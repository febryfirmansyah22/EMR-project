<?php

namespace App\Services;

use App\Models\MedicalAction;
use Illuminate\Pagination\LengthAwarePaginator;

class MedicalActionService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(array $filters = []): LengthAwarePaginator
    {
        return MedicalAction::query()
            ->when(isset($filters['search']), fn ($q) => $q->where('name', 'ilike', "%{$filters['search']}%"))
            ->when(isset($filters['category']), fn ($q) => $q->where('category', $filters['category']))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active']))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function store(array $data): MedicalAction
    {
        $action = MedicalAction::create($data);
        $this->auditLog->log('create', 'medical_actions', $action->id, null, $action->toArray());
        return $action;
    }

    public function update(MedicalAction $action, array $data): MedicalAction
    {
        $old = $action->toArray();
        $action->update($data);
        $this->auditLog->log('update', 'medical_actions', $action->id, $old, $action->fresh()->toArray());
        return $action->fresh();
    }

    public function destroy(MedicalAction $action): void
    {
        $this->auditLog->log('delete', 'medical_actions', $action->id, $action->toArray(), null);
        $action->delete();
    }
}
