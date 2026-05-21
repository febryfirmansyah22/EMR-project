<?php

namespace App\Services;

use App\Models\Patient;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PatientService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    // ── Index ─────────────────────────────────────────────────

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Patient::query()
            ->when(
                !empty($filters['search']),
                fn ($q) => $q->search($filters['search'])
            )
            ->when(
                isset($filters['gender']),
                fn ($q) => $q->where('gender', $filters['gender'])
            )
            ->when(
                isset($filters['insurance_type']),
                fn ($q) => $q->where('insurance_type', $filters['insurance_type'])
            )
            ->when(
                isset($filters['is_active']),
                fn ($q) => $q->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN))
            )
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 15);
    }

    // ── Store ─────────────────────────────────────────────────

    public function store(array $data): Patient
    {
        return DB::transaction(function () use ($data) {
            $data['medical_record_number'] = $this->generateMedicalRecordNumber();

            $patient = Patient::create($data);

            $this->auditLog->log('create', 'patients', $patient->id, null, $this->safeData($patient));

            return $patient;
        });
    }

    // ── Update ────────────────────────────────────────────────

    public function update(Patient $patient, array $data): Patient
    {
        return DB::transaction(function () use ($patient, $data) {
            $old = $this->safeData($patient);

            $patient->update($data);

            $this->auditLog->log('update', 'patients', $patient->id, $old, $this->safeData($patient->fresh()));

            return $patient->fresh();
        });
    }

    // ── Destroy (deactivate, bukan hard delete) ───────────────

    public function destroy(Patient $patient): void
    {
        DB::transaction(function () use ($patient) {
            $old = $this->safeData($patient);

            $patient->update(['is_active' => false]);

            $this->auditLog->log('delete', 'patients', $patient->id, $old, null);
        });
    }

    // ── Nomor Rekam Medis Otomatis ────────────────────────────

    /**
     * Generate nomor RM: RM-YYYY-NNNNN
     * Contoh: RM-2026-00001
     * Urutan global per tahun, terkunci dengan DB lock untuk mencegah race condition.
     */
    public function generateMedicalRecordNumber(): string
    {
        $year   = now()->format('Y');
        $prefix = "RM-{$year}-";

        // Kunci baris agar tidak ada dua request mengambil nomor yang sama
        $latest = Patient::where('medical_record_number', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('medical_record_number')
            ->first();

        $next = $latest
            ? ((int) substr($latest->medical_record_number, -5)) + 1
            : 1;

        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    // ── Helper ────────────────────────────────────────────────

    /**
     * Data untuk audit log — mask NIK agar tidak tersimpan plaintext di log.
     */
    private function safeData(Patient $patient): array
    {
        $arr = $patient->toArray();

        // Mask NIK: simpan hanya 4 digit terakhir
        if (isset($arr['nik'])) {
            $nik = $arr['nik'];
            $arr['nik'] = '************' . substr($nik, -4);
        }

        return $arr;
    }
}
