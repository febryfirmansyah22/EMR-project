<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\StockMovement;
use App\Models\Visit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PrescriptionService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    // ── Index (untuk antrian farmasi) ─────────────────────────

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Prescription::with([
                'visit:id,visit_number,visit_date,patient_id',
                'visit.patient:id,name,medical_record_number',
                'doctor:id,user_id',
                'doctor.user:id,name',
                'items.medicine:id,name,unit',
            ])
            ->when(!empty($filters['status']),
                fn ($q) => $q->where('status', $filters['status'])
            )
            ->when(!empty($filters['date']),
                fn ($q) => $q->whereDate('created_at', $filters['date'])
            )
            ->when(!empty($filters['search']),
                fn ($q) => $q->where(function ($q2) use ($filters) {
                    $q2->where('prescription_number', 'ilike', "%{$filters['search']}%")
                       ->orWhereHas('visit.patient', fn ($p) =>
                            $p->where('name', 'ilike', "%{$filters['search']}%")
                       );
                })
            )
            ->orderByRaw("CASE status
                WHEN 'menunggu'   THEN 1
                WHEN 'diproses'   THEN 2
                WHEN 'selesai'    THEN 3
                WHEN 'dibatalkan' THEN 4
                END")
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    // ── Store ─────────────────────────────────────────────────

    public function store(Visit $visit, array $data): Prescription
    {
        return DB::transaction(function () use ($visit, $data) {
            $doctorId = auth()->user()->doctor?->id
                ?? throw new \RuntimeException('User bukan dokter.');

            $prescription = Prescription::create([
                'prescription_number' => $this->generateNumber(),
                'visit_id'  => $visit->id,
                'doctor_id' => $doctorId,
                'status'    => Prescription::STATUS_MENUNGGU,
                'notes'     => $data['notes'] ?? null,
            ]);

            $this->syncItems($prescription, $data['items']);

            $this->auditLog->log('create', 'prescriptions', $prescription->id, null,
                ['prescription_number' => $prescription->prescription_number,
                 'items_count' => count($data['items'])]
            );

            return $this->loadFull($prescription);
        });
    }

    // ── Update (isi resep, hanya saat status=menunggu) ────────

    public function update(Prescription $prescription, array $data): Prescription
    {
        return DB::transaction(function () use ($prescription, $data) {
            $old = ['notes' => $prescription->notes, 'items_count' => $prescription->items->count()];

            if (isset($data['notes'])) {
                $prescription->update(['notes' => $data['notes']]);
            }

            if (isset($data['items'])) {
                $this->syncItems($prescription, $data['items']);
            }

            $this->auditLog->log('update', 'prescriptions', $prescription->id, $old,
                ['notes' => $prescription->fresh()->notes,
                 'items_count' => $prescription->items()->count()]
            );

            return $this->loadFull($prescription->fresh());
        });
    }

    // ── Update Status ─────────────────────────────────────────

    public function updateStatus(Prescription $prescription, string $newStatus, ?string $pharmacistNotes = null): Prescription
    {
        return DB::transaction(function () use ($prescription, $newStatus, $pharmacistNotes) {
            $old = $prescription->toArray();

            $updateData = ['status' => $newStatus];

            if ($newStatus === Prescription::STATUS_SELESAI) {
                // Kurangi stok saat resep diserahkan
                $this->dispenseStock($prescription);
                $updateData['dispensed_by'] = auth()->id();
                $updateData['dispensed_at'] = now();
            }

            if ($pharmacistNotes) {
                $updateData['pharmacist_notes'] = $pharmacistNotes;
            }

            $prescription->update($updateData);

            // Auto-advance kunjungan ke menunggu_pembayaran jika resep selesai
            if ($newStatus === Prescription::STATUS_SELESAI) {
                $visit = $prescription->visit;
                if ($visit->status === Visit::STATUS_MENUNGGU_OBAT) {
                    $visit->update(['status' => Visit::STATUS_MENUNGGU_PEMBAYARAN]);
                }
            }

            $this->auditLog->log('update', 'prescriptions', $prescription->id,
                ['status' => $old['status']],
                ['status' => $newStatus]
            );

            return $this->loadFull($prescription->fresh());
        });
    }

    // ── Stock Dispensing ──────────────────────────────────────

    private function dispenseStock(Prescription $prescription): void
    {
        $items = $prescription->items()->with('medicine')->get();

        // Validasi stok semua obat terlebih dahulu
        $errors = [];
        foreach ($items as $item) {
            $med = Medicine::lockForUpdate()->find($item->medicine_id);
            if ($med->stock < $item->quantity) {
                $errors[] = "Stok {$med->name} tidak cukup (stok: {$med->stock}, dibutuhkan: {$item->quantity})";
            }
        }

        if (!empty($errors)) {
            throw new \RuntimeException(implode('; ', $errors));
        }

        // Kurangi stok dan catat pergerakan
        foreach ($items as $item) {
            $med         = Medicine::lockForUpdate()->find($item->medicine_id);
            $stockBefore = $med->stock;
            $stockAfter  = $stockBefore - $item->quantity;

            $med->update(['stock' => $stockAfter]);

            StockMovement::create([
                'medicine_id'     => $med->id,
                'prescription_id' => $prescription->id,
                'created_by'      => auth()->id(),
                'type'            => 'keluar',
                'quantity'        => -$item->quantity,   // negatif = keluar
                'stock_before'    => $stockBefore,
                'stock_after'     => $stockAfter,
                'notes'           => "Resep {$prescription->prescription_number}",
            ]);
        }
    }

    // ── Sync Items ────────────────────────────────────────────

    private function syncItems(Prescription $prescription, array $items): void
    {
        // Hapus item lama, ganti dengan yang baru
        $prescription->items()->delete();

        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            $unitPrice = $medicine?->price ?? 0;
            $subtotal  = $unitPrice * $item['quantity'];

            PrescriptionItem::create([
                'prescription_id' => $prescription->id,
                'medicine_id'     => $item['medicine_id'],
                'quantity'        => $item['quantity'],
                'dosage'          => $item['dosage'],
                'instructions'    => $item['instructions'] ?? null,
                'notes'           => $item['notes'] ?? null,
                'unit_price'      => $unitPrice,
                'subtotal'        => $subtotal,
            ]);
        }
    }

    // ── Generator & Helper ────────────────────────────────────

    public function generateNumber(): string
    {
        $d      = now()->format('Ymd');
        $prefix = "RX-{$d}-";

        $latest = Prescription::where('prescription_number', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('prescription_number')
            ->first(['prescription_number']);

        $next = $latest ? ((int) substr($latest->prescription_number, -5)) + 1 : 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    private function loadFull(Prescription $p): Prescription
    {
        return $p->load([
            'doctor.user:id,name',
            'dispensedBy:id,name',
            'visit:id,visit_number,visit_date,patient_id,status',
            'visit.patient:id,name,medical_record_number',
            'items.medicine:id,name,unit,stock',
        ]);
    }

    // ── Riwayat stok obat ─────────────────────────────────────

    public function stockHistory(Medicine $medicine, array $filters = []): LengthAwarePaginator
    {
        return StockMovement::with('createdBy:id,name,role', 'prescription:id,prescription_number')
            ->where('medicine_id', $medicine->id)
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }
}
