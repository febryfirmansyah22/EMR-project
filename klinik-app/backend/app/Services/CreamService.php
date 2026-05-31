<?php

namespace App\Services;

use App\Models\PenjualanCream;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CreamService
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    public function getList(array $filters): LengthAwarePaginator
    {
        $query = PenjualanCream::with('creator')
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
            $query->where(function ($q) use ($filters) {
                $q->where('patient_name', 'ilike', '%' . $filters['search'] . '%')
                    ->orWhere('product_name', 'ilike', '%' . $filters['search'] . '%');
            });
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): PenjualanCream
    {
        return DB::transaction(function () use ($data) {
            // Global auto-increment transaction_no
            $lastNo = PenjualanCream::lockForUpdate()->max('transaction_no') ?? 0;
            $data['transaction_no'] = $lastNo + 1;
            $data['created_by'] = Auth::id();

            // Calculate balances
            $balance = $data['selling_price'] - ($data['expense'] ?? 0);
            $data['balance'] = $balance;
            $data['cash_balance'] = ($data['payment_method'] === 'Cash') ? $balance : 0;
            $data['transfer_balance'] = ($data['payment_method'] === 'TF') ? $balance : 0;

            $record = PenjualanCream::create($data);

            $this->activityLog->logCreate('penjualan_cream', $record->toArray());

            return $record;
        });
    }

    public function update(PenjualanCream $record, array $data): PenjualanCream
    {
        return DB::transaction(function () use ($record, $data) {
            $oldData = $record->toArray();

            // Recalculate balances
            $sellingPrice = $data['selling_price'] ?? $record->selling_price;
            $expense = $data['expense'] ?? $record->expense;
            $paymentMethod = $data['payment_method'] ?? $record->payment_method;

            $balance = $sellingPrice - $expense;
            $data['balance'] = $balance;
            $data['cash_balance'] = ($paymentMethod === 'Cash') ? $balance : 0;
            $data['transfer_balance'] = ($paymentMethod === 'TF') ? $balance : 0;

            $record->update($data);

            $this->activityLog->logUpdate('penjualan_cream', $oldData, $record->fresh()->toArray());

            return $record->fresh();
        });
    }

    public function delete(PenjualanCream $record): void
    {
        DB::transaction(function () use ($record) {
            $oldData = $record->toArray();
            $record->delete();
            $this->activityLog->logDelete('penjualan_cream', $oldData);
        });
    }

    public function getSummary(string $period = 'this_month'): array
    {
        $query = PenjualanCream::query();
        $this->applyPeriodFilter($query, $period);

        $total = $query->count();
        $totalPenjualan = (clone $query)->sum('selling_price');
        $totalPengeluaran = (clone $query)->sum('expense');
        $totalCash = (clone $query)->where('payment_method', 'Cash')->sum('selling_price');
        $totalTf = (clone $query)->where('payment_method', 'TF')->sum('selling_price');
        $saldoCash = (clone $query)->sum('cash_balance');
        $saldoTf = (clone $query)->sum('transfer_balance');

        return [
            'total_transaksi' => $total,
            'total_penjualan' => $totalPenjualan,
            'total_pengeluaran' => $totalPengeluaran,
            'saldo_bersih' => $totalPenjualan - $totalPengeluaran,
            'total_cash' => $totalCash,
            'total_transfer' => $totalTf,
            'saldo_cash' => $saldoCash,
            'saldo_transfer' => $saldoTf,
        ];
    }

    public function export(array $filters): array
    {
        $query = PenjualanCream::with('creator')->orderBy('transaction_date')->orderBy('transaction_no');

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
}
