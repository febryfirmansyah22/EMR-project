<?php

namespace App\Services;

use App\Models\FakturObat;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FakturService
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    public function getList(array $filters): LengthAwarePaginator
    {
        $query = FakturObat::with('creator')
            ->orderBy('invoice_date', 'desc')
            ->orderBy('invoice_no', 'desc');

        if (!empty($filters['start_date'])) {
            $query->whereDate('invoice_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('invoice_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['supplier'])) {
            $query->where('supplier_name', 'ilike', '%' . $filters['supplier'] . '%');
        }

        if (!empty($filters['month'])) {
            $query->whereMonth('invoice_date', $filters['month']);
        }

        if (!empty($filters['year'])) {
            $query->whereYear('invoice_date', $filters['year']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('supplier_name', 'ilike', '%' . $filters['search'] . '%')
                    ->orWhere('description', 'ilike', '%' . $filters['search'] . '%');
            });
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): FakturObat
    {
        return DB::transaction(function () use ($data) {
            // Global auto-increment invoice_no
            $lastNo = FakturObat::lockForUpdate()->max('invoice_no') ?? 0;
            $data['invoice_no'] = $lastNo + 1;
            $data['created_by'] = Auth::id();

            $record = FakturObat::create($data);

            $this->activityLog->logCreate('faktur_obat', $record->toArray());

            return $record;
        });
    }

    public function update(FakturObat $record, array $data): FakturObat
    {
        return DB::transaction(function () use ($record, $data) {
            $oldData = $record->toArray();
            $record->update($data);
            $this->activityLog->logUpdate('faktur_obat', $oldData, $record->fresh()->toArray());
            return $record->fresh();
        });
    }

    public function delete(FakturObat $record): void
    {
        DB::transaction(function () use ($record) {
            $oldData = $record->toArray();
            $record->delete();
            $this->activityLog->logDelete('faktur_obat', $oldData);
        });
    }

    public function getSummary(string $period = 'this_month'): array
    {
        $query = FakturObat::query();
        $this->applyPeriodFilter($query, $period);

        return [
            'total_faktur' => $query->count(),
            'total_pembelian' => (clone $query)->sum('price'),
        ];
    }

    public function export(array $filters): array
    {
        $query = FakturObat::with('creator')->orderBy('invoice_date')->orderBy('invoice_no');

        if (!empty($filters['start_date'])) {
            $query->whereDate('invoice_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('invoice_date', '<=', $filters['end_date']);
        }

        return $query->get()->toArray();
    }

    private function applyPeriodFilter($query, string $period): void
    {
        match ($period) {
            'today' => $query->whereDate('invoice_date', today()),
            'this_week' => $query->whereBetween('invoice_date', [
                now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'),
                now()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d'),
            ]),
            'this_month' => $query->whereYear('invoice_date', now()->year)
                ->whereMonth('invoice_date', now()->month),
            'this_year' => $query->whereYear('invoice_date', now()->year),
            default => null,
        };
    }
}
