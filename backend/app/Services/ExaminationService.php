<?php

namespace App\Services;

use App\Models\Examination;
use App\Models\Visit;
use Illuminate\Support\Facades\DB;

class ExaminationService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function store(Visit $visit, array $data): Examination
    {
        return DB::transaction(function () use ($visit, $data) {
            $data['visit_id'] = $visit->id;
            $data['nurse_id'] = auth()->id();

            $exam = Examination::create($data);

            // Auto-advance status: menunggu_pemeriksaan_awal → menunggu_dokter
            if ($visit->status === Visit::STATUS_MENUNGGU_AWAL) {
                $visit->update(['status' => Visit::STATUS_MENUNGGU_DOKTER]);
            }

            $this->auditLog->log('create', 'examinations', $exam->id, null, $exam->toArray());

            return $exam->load('nurse:id,name,role');
        });
    }

    public function update(Examination $exam, array $data): Examination
    {
        return DB::transaction(function () use ($exam, $data) {
            $old = $exam->toArray();
            $exam->update($data);
            $this->auditLog->log('update', 'examinations', $exam->id, $old, $exam->fresh()->toArray());
            return $exam->fresh()->load('nurse:id,name,role');
        });
    }
}
