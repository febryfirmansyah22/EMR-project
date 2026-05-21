<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Visit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    // ── Index (antrian kasir) ─────────────────────────────────

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Invoice::with([
                'visit:id,visit_number,visit_date',
                'patient:id,name,medical_record_number',
                'paidBy:id,name',
                'items',
            ])
            ->when(!empty($filters['status']),
                fn ($q) => $q->where('status', $filters['status'])
            )
            ->when(!empty($filters['date']),
                fn ($q) => $q->whereDate('created_at', $filters['date'])
            )
            ->when(!empty($filters['search']),
                fn ($q) => $q->where(function ($q2) use ($filters) {
                    $q2->where('invoice_number', 'ilike', "%{$filters['search']}%")
                       ->orWhereHas('patient', fn ($p) =>
                            $p->where('name', 'ilike', "%{$filters['search']}%")
                              ->orWhere('medical_record_number', 'ilike', "%{$filters['search']}%")
                       );
                })
            )
            ->orderByRaw("CASE status
                WHEN 'menunggu_pembayaran' THEN 1
                WHEN 'lunas'              THEN 2
                WHEN 'dibatalkan'         THEN 3
                END")
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);
    }

    // ── Auto-create invoice dari kunjungan ───────────────────

    /**
     * Buat invoice otomatis saat visit berpindah ke menunggu_pembayaran.
     * Mengambil semua tindakan dari medical record + semua obat dari resep (jika ada).
     * Idempotent — tidak membuat duplikat jika invoice sudah ada.
     */
    public function createForVisit(Visit $visit): Invoice
    {
        // Idempotent — jika sudah ada, kembalikan yang sudah ada
        if ($existing = $visit->invoice()->first()) {
            return $existing;
        }

        return DB::transaction(function () use ($visit) {
            $visit->load([
                'medicalRecord.recordActions.medicalAction',
                'prescription.items.medicine',
            ]);

            $invoiceItems = [];

            // 1. Tindakan medis dari medical record
            $medRecord = $visit->medicalRecord;
            if ($medRecord) {
                foreach ($medRecord->recordActions as $ra) {
                    $action    = $ra->medicalAction;
                    $qty       = $ra->quantity ?? 1;
                    $unitPrice = (float) ($action?->price ?? 0);
                    $invoiceItems[] = [
                        'type'        => 'tindakan',
                        'description' => $action?->name ?? 'Tindakan Medis',
                        'quantity'    => $qty,
                        'unit_price'  => $unitPrice,
                        'subtotal'    => $unitPrice * $qty,
                    ];
                }
            }

            // 2. Obat dari resep (hanya jika resep berstatus selesai)
            $prescription = $visit->prescription;
            if ($prescription && $prescription->status === 'selesai') {
                foreach ($prescription->items as $pi) {
                    $invoiceItems[] = [
                        'type'        => 'obat',
                        'description' => $pi->medicine?->name ?? 'Obat',
                        'quantity'    => $pi->quantity,
                        'unit_price'  => (float) $pi->unit_price,
                        'subtotal'    => (float) $pi->subtotal,
                    ];
                }
            }

            $subtotal    = collect($invoiceItems)->sum('subtotal');
            $totalAmount = $subtotal; // diskon 0 secara default

            $invoice = Invoice::create([
                'invoice_number' => $this->generateNumber(),
                'visit_id'       => $visit->id,
                'patient_id'     => $visit->patient_id,
                'status'         => Invoice::STATUS_MENUNGGU,
                'subtotal'       => $subtotal,
                'discount'       => 0,
                'total_amount'   => $totalAmount,
            ]);

            foreach ($invoiceItems as $item) {
                InvoiceItem::create(array_merge(['invoice_id' => $invoice->id], $item));
            }

            $this->auditLog->log('create', 'invoices', $invoice->id, null, [
                'invoice_number' => $invoice->invoice_number,
                'visit_id'       => $visit->id,
                'total_amount'   => $totalAmount,
                'items_count'    => count($invoiceItems),
            ]);

            return $this->loadFull($invoice);
        });
    }

    // ── Record pembayaran (kasir) ─────────────────────────────

    public function recordPayment(Invoice $invoice, array $data): Invoice
    {
        return DB::transaction(function () use ($invoice, $data) {
            $old = $invoice->toArray();

            $discount     = (float) ($data['discount'] ?? $invoice->discount);
            $totalAmount  = (float) $invoice->subtotal - $discount;
            $payAmount    = (float) $data['payment_amount'];
            $payChange    = $payAmount - $totalAmount;

            $invoice->update([
                'status'          => Invoice::STATUS_LUNAS,
                'discount'        => $discount,
                'total_amount'    => $totalAmount,
                'payment_method'  => $data['payment_method'],
                'payment_amount'  => $payAmount,
                'payment_change'  => max(0, $payChange),
                'paid_at'         => now(),
                'paid_by'         => auth()->id(),
                'notes'           => $data['notes'] ?? null,
            ]);

            // Auto-advance visit ke selesai
            $visit = $invoice->visit;
            if ($visit->status === Visit::STATUS_MENUNGGU_PEMBAYARAN) {
                $visit->update(['status' => Visit::STATUS_SELESAI]);
            }

            $this->auditLog->log('update', 'invoices', $invoice->id,
                ['status' => $old['status']],
                [
                    'status'         => Invoice::STATUS_LUNAS,
                    'payment_method' => $data['payment_method'],
                    'total_amount'   => $totalAmount,
                ]
            );

            return $this->loadFull($invoice->fresh());
        });
    }

    // ── Cancel invoice ────────────────────────────────────────

    public function cancel(Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($invoice) {
            $old = ['status' => $invoice->status];
            $invoice->update(['status' => Invoice::STATUS_DIBATALKAN]);

            $this->auditLog->log('update', 'invoices', $invoice->id, $old, ['status' => Invoice::STATUS_DIBATALKAN]);

            return $this->loadFull($invoice->fresh());
        });
    }

    // ── Generator nomor ──────────────────────────────────────

    public function generateNumber(): string
    {
        $d      = now()->format('Ymd');
        $prefix = "INV-{$d}-";

        $latest = Invoice::where('invoice_number', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('invoice_number')
            ->first(['invoice_number']);

        $next = $latest ? ((int) substr($latest->invoice_number, -5)) + 1 : 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    // ── Load relasi lengkap ───────────────────────────────────

    private function loadFull(Invoice $invoice): Invoice
    {
        return $invoice->load([
            'visit:id,visit_number,visit_date,status',
            'patient:id,name,medical_record_number,insurance_type',
            'paidBy:id,name',
            'items',
        ]);
    }
}
