<?php

namespace App\Services;

use App\Models\Poli;
use Illuminate\Pagination\LengthAwarePaginator;

class PoliService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Poli::query()
            ->when(isset($filters['search']), fn ($q) => $q->where('name', 'ilike', "%{$filters['search']}%"))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active']))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function store(array $data): Poli
    {
        $poli = Poli::create($data);
        $this->auditLog->log('create', 'polis', $poli->id, null, $poli->toArray());
        return $poli;
    }

    public function update(Poli $poli, array $data): Poli
    {
        $old = $poli->toArray();
        $poli->update($data);
        $this->auditLog->log('update', 'polis', $poli->id, $old, $poli->fresh()->toArray());
        return $poli->fresh();
    }

    public function destroy(Poli $poli): void
    {
        $this->auditLog->log('delete', 'polis', $poli->id, $poli->toArray(), null);
        $poli->delete();
    }
}
