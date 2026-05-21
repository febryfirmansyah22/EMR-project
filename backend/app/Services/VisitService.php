<?php

namespace App\Services;

use App\Models\Visit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VisitService
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly InvoiceService  $invoiceService,
    ) {}

    // ── Index ─────────────────────────────────────────────────

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Visit::with(['patient:id,name,medical_record_number', 'poli:id,name', 'doctor:id,user_id', 'doctor.user:id,name'])
            ->when(!empty($filters['date']),
                fn ($q) => $q->whereDate('visit_date', $filters['date'])
            )
            ->when(!empty($filters['poli_id']),
                fn ($q) => $q->where('poli_id', $filters['poli_id'])
            )
            ->when(!empty($filters['doctor_id']),
                fn ($q) => $q->where('doctor_id', $filters['doctor_id'])
            )
            ->when(!empty($filters['status']),
                fn ($q) => $q->where('status', $filters['status'])
            )
            ->when(!empty($filters['patient_id']),
                fn ($q) => $q->where('patient_id', $filters['patient_id'])
            )
            ->when(!empty($filters['search']),
                fn ($q) => $q->where(function ($q2) use ($filters) {
                    $q2->where('visit_number', 'ilike', "%{$filters['search']}%")
                       ->orWhereHas('patient', fn ($p) =>
                            $p->where('name', 'ilike', "%{$filters['search']}%")
                              ->orWhere('medical_record_number', 'ilike', "%{$filters['search']}%")
                       );
                })
            )
            ->orderBy('visit_date', 'desc')
            ->orderBy('queue_number')
            ->paginate($filters['per_page'] ?? 20);
    }

    // ── Antrean hari ini ──────────────────────────────────────

    /**
     * Ambil antrean hari ini untuk tampilan board antrean.
     * Di-group per poli, urutkan by queue_number.
     */
    public function todayQueue(?int $poliId = null): Collection
    {
        return Visit::with([
                'patient:id,name,medical_record_number,gender',
                'poli:id,name',
                'doctor:id,user_id',
                'doctor.user:id,name',
            ])
            ->whereDate('visit_date', today())
            ->when($poliId, fn ($q) => $q->where('poli_id', $poliId))
            ->where('status', '!=', Visit::STATUS_BATAL)
            ->orderBy('poli_id')
            ->orderBy('queue_number')
            ->get();
    }

    // ── Store ─────────────────────────────────────────────────

    public function store(array $data): Visit
    {
        return DB::transaction(function () use ($data) {
            $visitDate = $data['visit_date'] ?? today()->toDateString();
            $poliId    = $data['poli_id'];

            $data['visit_number'] = $this->generateVisitNumber($visitDate);
            $data['queue_number'] = $this->generateQueueNumber($poliId, $visitDate);
            $data['visit_date']   = $visitDate;
            $data['status']       = Visit::STATUS_TERDAFTAR;
            $data['registered_by'] = auth()->id();

            $visit = Visit::create($data);

            $this->auditLog->log('create', 'visits', $visit->id, null,
                $visit->load('patient', 'poli', 'doctor')->toArray()
            );

            return $visit->load('patient', 'poli', 'doctor', 'registeredBy');
        });
    }

    // ── Update data kunjungan ─────────────────────────────────

    public function update(Visit $visit, array $data): Visit
    {
        return DB::transaction(function () use ($visit, $data) {
            $old = $visit->toArray();

            // Field yang boleh diubah setelah pendaftaran
            $visit->update(array_filter([
                'doctor_id' => $data['doctor_id'] ?? null,
                'complaint' => $data['complaint'] ?? null,
                'notes'     => $data['notes'] ?? null,
            ], fn ($v) => $v !== null));

            $this->auditLog->log('update', 'visits', $visit->id, $old, $visit->fresh()->toArray());

            return $visit->fresh()->load('patient', 'poli', 'doctor', 'registeredBy');
        });
    }

    // ── Update status antrean ─────────────────────────────────

    public function updateStatus(Visit $visit, string $newStatus): Visit
    {
        return DB::transaction(function () use ($visit, $newStatus) {
            $old = $visit->toArray();

            $visit->update(['status' => $newStatus]);

            // Auto-buat invoice saat kunjungan masuk antrian kasir
            if ($newStatus === Visit::STATUS_MENUNGGU_PEMBAYARAN) {
                $this->invoiceService->createForVisit($visit->fresh());
            }

            $this->auditLog->log('update', 'visits', $visit->id,
                ['status' => $old['status']],
                ['status' => $newStatus]
            );

            return $visit->fresh()->load('patient', 'poli', 'doctor');
        });
    }

    // ── Cancel (batal) ────────────────────────────────────────

    public function cancel(Visit $visit, ?string $notes = null): void
    {
        DB::transaction(function () use ($visit, $notes) {
            $old = $visit->toArray();

            $visit->update([
                'status' => Visit::STATUS_BATAL,
                'notes'  => $notes ?? $visit->notes,
            ]);

            $this->auditLog->log('delete', 'visits', $visit->id, $old, null);
        });
    }

    // ── Generator Nomor ──────────────────────────────────────

    /**
     * Nomor kunjungan unik global: KNJ-YYYYMMDD-NNNNN
     * Contoh: KNJ-20260520-00001
     */
    public function generateVisitNumber(string $date): string
    {
        $d      = \Carbon\Carbon::parse($date)->format('Ymd');
        $prefix = "KNJ-{$d}-";

        $latest = Visit::where('visit_number', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('visit_number')
            ->first();

        $next = $latest ? ((int) substr($latest->visit_number, -5)) + 1 : 1;

        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Nomor antrean per poli per hari (1, 2, 3, ...).
     * Pakai orderByDesc + first() — PostgreSQL tidak izinkan lockForUpdate + max().
     * Unique constraint di DB sebagai safety net duplikat.
     */
    public function generateQueueNumber(int $poliId, string $date): int
    {
        $latest = Visit::where('poli_id', $poliId)
            ->whereDate('visit_date', $date)
            ->lockForUpdate()
            ->orderByDesc('queue_number')
            ->first(['queue_number']);

        return ($latest?->queue_number ?? 0) + 1;
    }
}
