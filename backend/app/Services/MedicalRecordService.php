<?php

namespace App\Services;

use App\Models\MedicalRecord;
use App\Models\Visit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MedicalRecordService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    // ── Riwayat rekam medis pasien ────────────────────────────

    public function patientHistory(int $patientId, array $filters = []): LengthAwarePaginator
    {
        return MedicalRecord::with([
                'visit:id,visit_number,visit_date,poli_id,complaint',
                'visit.poli:id,name',
                'doctor:id,user_id',
                'doctor.user:id,name',
                'diagnoses:id,code,name',
                'actions:id,name,price',
            ])
            ->whereHas('visit', fn ($q) => $q->where('patient_id', $patientId))
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 10);
    }

    // ── Store SOAP ────────────────────────────────────────────

    public function store(Visit $visit, array $data): MedicalRecord
    {
        return DB::transaction(function () use ($visit, $data) {
            $data['visit_id']  = $visit->id;
            $data['doctor_id'] = auth()->user()->doctor?->id
                ?? throw new \RuntimeException('User bukan dokter.');

            $diagnoses = $data['diagnoses'] ?? [];
            $actions   = $data['actions']   ?? [];
            unset($data['diagnoses'], $data['actions']);

            $record = MedicalRecord::create($data);

            // Sync diagnoses (pivot: type primer/sekunder)
            $this->syncDiagnoses($record, $diagnoses);

            // Sync tindakan medis (pivot: quantity, notes)
            $this->syncActions($record, $actions);

            // Auto-advance: jika masih sedang_diperiksa, biarkan dokter yg update status manual
            $this->auditLog->log('create', 'medical_records', $record->id, null,
                $this->safeRecordData($record)
            );

            return $this->loadFull($record);
        });
    }

    // ── Update SOAP ───────────────────────────────────────────

    public function update(MedicalRecord $record, array $data): MedicalRecord
    {
        return DB::transaction(function () use ($record, $data) {
            $old = $this->safeRecordData($record);

            $diagnoses = $data['diagnoses'] ?? null;
            $actions   = $data['actions']   ?? null;
            unset($data['diagnoses'], $data['actions']);

            // Update kolom SOAP (hanya yang dikirim)
            $record->update(array_filter($data, fn ($v) => $v !== null));

            if ($diagnoses !== null) $this->syncDiagnoses($record, $diagnoses);
            if ($actions   !== null) $this->syncActions($record, $actions);

            $this->auditLog->log('update', 'medical_records', $record->id, $old,
                $this->safeRecordData($record->fresh())
            );

            return $this->loadFull($record->fresh());
        });
    }

    // ── Private helpers ───────────────────────────────────────

    private function syncDiagnoses(MedicalRecord $record, array $diagnoses): void
    {
        // Format: [['diagnosis_id' => 1, 'type' => 'primer'], ...]
        $sync = [];
        foreach ($diagnoses as $d) {
            $sync[$d['diagnosis_id']] = ['type' => $d['type'] ?? 'primer'];
        }
        $record->diagnoses()->sync($sync);
    }

    private function syncActions(MedicalRecord $record, array $actions): void
    {
        // Format: [['medical_action_id' => 1, 'quantity' => 1, 'notes' => '...'], ...]
        $sync = [];
        foreach ($actions as $a) {
            $sync[$a['medical_action_id']] = [
                'quantity' => $a['quantity'] ?? 1,
                'notes'    => $a['notes']    ?? null,
            ];
        }
        $record->actions()->sync($sync);
    }

    private function loadFull(MedicalRecord $record): MedicalRecord
    {
        return $record->load([
            'doctor.user:id,name',
            'visit:id,visit_number,visit_date,complaint',
            'diagnoses:id,code,name',
            'actions:id,name,price,category',
        ]);
    }

    /**
     * Audit log hanya menyimpan flag ada/tidaknya SOAP, bukan isinya.
     * Isi SOAP tetap terproteksi — tidak disimpan ulang sebagai plaintext di log.
     */
    private function safeRecordData(MedicalRecord $record): array
    {
        return [
            'id'            => $record->id,
            'visit_id'      => $record->visit_id,
            'doctor_id'     => $record->doctor_id,
            'has_subjective' => !empty($record->soap_subjective),
            'has_objective'  => !empty($record->soap_objective),
            'has_assessment' => !empty($record->soap_assessment),
            'has_plan'       => !empty($record->soap_plan),
            'diagnoses_count' => $record->diagnoses()->count(),
            'actions_count'   => $record->actions()->count(),
        ];
    }
}
