<?php

namespace App\Services;

use App\Models\ObservasiUmum;
use App\Models\Setoran;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ObservasiService
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    public function getList(array $filters): LengthAwarePaginator
    {
        $query = ObservasiUmum::with('creator')
            ->orderBy('transaction_date', 'desc')
            ->orderBy('transaction_no', 'desc');

        if (!empty($filters['start_date'])) {
            $query->whereDate('transaction_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('transaction_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (!empty($filters['month'])) {
            $query->whereMonth('transaction_date', $filters['month']);
        }

        if (!empty($filters['year'])) {
            $query->whereYear('transaction_date', $filters['year']);
        }

        if (!empty($filters['search'])) {
            $query->where('patient_name', 'ilike', '%' . $filters['search'] . '%');
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): ObservasiUmum
    {
        return DB::transaction(function () use ($data) {
            $date = Carbon::parse($data['transaction_date']);

            // Get week bounds (Mon-Sun)
            $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY);
            $weekEnd = $date->copy()->endOfWeek(Carbon::SUNDAY);

            // Auto-increment transaction_no per week
            $lastNo = ObservasiUmum::whereBetween('transaction_date', [
                $weekStart->format('Y-m-d'),
                $weekEnd->format('Y-m-d'),
            ])->lockForUpdate()->max('transaction_no') ?? 0;

            $data['transaction_no'] = $lastNo + 1;
            $data['created_by'] = Auth::id();

            // Calculate running_total for current week
            $weekTotal = ObservasiUmum::whereBetween('transaction_date', [
                $weekStart->format('Y-m-d'),
                $weekEnd->format('Y-m-d'),
            ])->sum('price');

            $data['running_total'] = $weekTotal + $data['price'];

            // Get total deposits for this week
            $weekDeposits = Setoran::where('source', 'Observasi Umum')
                ->whereBetween('deposit_date', [
                    $weekStart->format('Y-m-d'),
                    $weekEnd->format('Y-m-d'),
                ])->sum('amount');

            $data['deposit_amount'] = $weekDeposits;
            $data['balance'] = $data['running_total'] - $weekDeposits;

            $record = ObservasiUmum::create($data);

            $this->activityLog->logCreate('observasi_umum', $record->toArray());

            return $record;
        });
    }

    public function update(ObservasiUmum $record, array $data): ObservasiUmum
    {
        return DB::transaction(function () use ($record, $data) {
            $oldData = $record->toArray();

            // Recalculate if price or date changes
            if (isset($data['price']) || isset($data['transaction_date'])) {
                $date = Carbon::parse($data['transaction_date'] ?? $record->transaction_date);
                $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY);
                $weekEnd = $date->copy()->endOfWeek(Carbon::SUNDAY);

                // running total = sum of all transactions in week (excluding this one) + new price
                $weekTotal = ObservasiUmum::whereBetween('transaction_date', [
                    $weekStart->format('Y-m-d'),
                    $weekEnd->format('Y-m-d'),
                ])->where('id', '!=', $record->id)->sum('price');

                $newPrice = $data['price'] ?? $record->price;
                $data['running_total'] = $weekTotal + $newPrice;

                $weekDeposits = Setoran::where('source', 'Observasi Umum')
                    ->whereBetween('deposit_date', [
                        $weekStart->format('Y-m-d'),
                        $weekEnd->format('Y-m-d'),
                    ])->sum('amount');

                $data['deposit_amount'] = $weekDeposits;
                $data['balance'] = $data['running_total'] - $weekDeposits;
            }

            $record->update($data);

            $this->activityLog->logUpdate('observasi_umum', $oldData, $record->fresh()->toArray());

            return $record->fresh();
        });
    }

    public function delete(ObservasiUmum $record): void
    {
        DB::transaction(function () use ($record) {
            $oldData = $record->toArray();
            $record->delete();
            $this->activityLog->logDelete('observasi_umum', $oldData);
        });
    }

    public function getSummary(string $period = 'this_month'): array
    {
        $query = ObservasiUmum::query();
        $this->applyPeriodFilter($query, $period);

        $total = $query->count();
        $totalPemasukan = (clone $query)->sum('price');
        $totalCash = (clone $query)->where('payment_method', 'Cash')->sum('price');
        $totalQrisTf = (clone $query)->where('payment_method', 'QRIS/TF')->sum('price');

        $depositQuery = Setoran::where('source', 'Observasi Umum');
        $this->applyPeriodFilterToSetoran($depositQuery, $period);
        $totalSetoran = $depositQuery->sum('amount');

        return [
            'total_transaksi' => $total,
            'total_pemasukan' => $totalPemasukan,
            'total_cash' => $totalCash,
            'total_qris_tf' => $totalQrisTf,
            'total_setoran' => $totalSetoran,
            'sisa_saldo' => $totalPemasukan - $totalSetoran,
        ];
    }

    public function export(array $filters): array
    {
        $query = ObservasiUmum::with('creator')->orderBy('transaction_date')->orderBy('transaction_no');

        if (!empty($filters['start_date'])) {
            $query->whereDate('transaction_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->whereDate('transaction_date', '<=', $filters['end_date']);
        }

        return $query->get()->toArray();
    }

    private function applyPeriodFilter($query, string $period): void
    {
        match ($period) {
            'today' => $query->whereDate('transaction_date', today()),
            'this_week' => $query->whereBetween('transaction_date', [
                now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'),
                now()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d'),
            ]),
            'this_month' => $query->whereYear('transaction_date', now()->year)
                ->whereMonth('transaction_date', now()->month),
            'this_year' => $query->whereYear('transaction_date', now()->year),
            default => null,
        };
    }

    private function applyPeriodFilterToSetoran($query, string $period): void
    {
        match ($period) {
            'today' => $query->whereDate('deposit_date', today()),
            'this_week' => $query->whereBetween('deposit_date', [
                now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'),
                now()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d'),
            ]),
            'this_month' => $query->whereYear('deposit_date', now()->year)
                ->whereMonth('deposit_date', now()->month),
            'this_year' => $query->whereYear('deposit_date', now()->year),
            default => null,
        };
    }
}
