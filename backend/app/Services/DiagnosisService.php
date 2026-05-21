<?php

namespace App\Services;

use App\Models\Diagnosis;
use Illuminate\Pagination\LengthAwarePaginator;

class DiagnosisService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Diagnosis::query()
            ->when(isset($filters['search']), fn ($q) => $q
                ->where('code', 'ilike', "%{$filters['search']}%")
                ->orWhere('name', 'ilike', "%{$filters['search']}%")
            )
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active']))
            ->orderBy('code')
            ->paginate($filters['per_page'] ?? 20);
    }

    public function store(array $data): Diagnosis
    {
        $diagnosis = Diagnosis::create($data);
        $this->auditLog->log('create', 'diagnoses', $diagnosis->id, null, $diagnosis->toArray());
        return $diagnosis;
    }

    public function update(Diagnosis $diagnosis, array $data): Diagnosis
    {
        $old = $diagnosis->toArray();
        $diagnosis->update($data);
        $this->auditLog->log('update', 'diagnoses', $diagnosis->id, $old, $diagnosis->fresh()->toArray());
        return $diagnosis->fresh();
    }

    public function destroy(Diagnosis $diagnosis): void
    {
        $this->auditLog->log('delete', 'diagnoses', $diagnosis->id, $diagnosis->toArray(), null);
        $diagnosis->delete();
    }
}
