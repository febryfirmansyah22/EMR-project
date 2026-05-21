<?php

namespace App\Services;

use App\Models\Medicine;
use Illuminate\Pagination\LengthAwarePaginator;

class MedicineService
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(array $filters = []): LengthAwarePaginator
    {
        return Medicine::query()
            ->when(isset($filters['search']), fn ($q) => $q
                ->where('name', 'ilike', "%{$filters['search']}%")
                ->orWhere('generic_name', 'ilike', "%{$filters['search']}%")
            )
            ->when(isset($filters['category']), fn ($q) => $q->where('category', $filters['category']))
            ->when(isset($filters['is_active']), fn ($q) => $q->where('is_active', $filters['is_active']))
            ->when($filters['low_stock'] ?? false, fn ($q) => $q->whereColumn('stock', '<=', 'min_stock'))
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 15);
    }

    public function store(array $data): Medicine
    {
        $medicine = Medicine::create($data);
        $this->auditLog->log('create', 'medicines', $medicine->id, null, $medicine->toArray());
        return $medicine;
    }

    public function update(Medicine $medicine, array $data): Medicine
    {
        $old = $medicine->toArray();
        $medicine->update($data);
        $this->auditLog->log('update', 'medicines', $medicine->id, $old, $medicine->fresh()->toArray());
        return $medicine->fresh();
    }

    public function destroy(Medicine $medicine): void
    {
        $this->auditLog->log('delete', 'medicines', $medicine->id, $medicine->toArray(), null);
        $medicine->delete();
    }
}
