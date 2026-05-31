<?php

namespace App\Services;

use App\Models\Setoran;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SetoranService
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    public function getList(array $filters): LengthAwarePaginator
    {
        $query = Setoran::with('creator')
            ->orderBy('deposit_date', 'desc')
            ->orderBy('id', 'desc');

        if (!empty($filters['start_date'])) {
            $query->whereDate('deposit_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('deposit_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Setoran
    {
        return DB::transaction(function () use ($data) {
            $data['created_by'] = Auth::id();
            $record = Setoran::create($data);
            $this->activityLog->logCreate('setoran', $record->toArray());
            return $record;
        });
    }

    public function update(Setoran $record, array $data): Setoran
    {
        return DB::transaction(function () use ($record, $data) {
            $oldData = $record->toArray();
            $record->update($data);
            $this->activityLog->logUpdate('setoran', $oldData, $record->fresh()->toArray());
            return $record->fresh();
        });
    }

    public function delete(Setoran $record): void
    {
        DB::transaction(function () use ($record) {
            $oldData = $record->toArray();
            $record->delete();
            $this->activityLog->logDelete('setoran', $oldData);
        });
    }
}
