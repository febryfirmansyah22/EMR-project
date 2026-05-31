<?php

namespace App\Services;

use App\Models\FakturObat;
use App\Models\ObservasiUmum;
use App\Models\PenjualanCream;
use App\Models\Setoran;
use Carbon\Carbon;

class RekapService
{
    public function getRekapMingguan(string $weekStart): array
    {
        $start = Carbon::parse($weekStart)->startOfWeek(Carbon::MONDAY);
        $end = $start->copy()->endOfWeek(Carbon::SUNDAY);

        $startStr = $start->format('Y-m-d');
        $endStr = $end->format('Y-m-d');

        // Observasi Umum
        $obsRows = ObservasiUmum::whereBetween('transaction_date', [$startStr, $endStr])
            ->orderBy('transaction_date')
            ->orderBy('transaction_no')
            ->get();

        $totalObs = $obsRows->sum('price');
        $totalObsCash = $obsRows->where('payment_method', 'Cash')->sum('price');
        $totalObsQrisTf = $obsRows->where('payment_method', 'QRIS/TF')->sum('price');

        $setoranObs = Setoran::where('source', 'Observasi Umum')
            ->whereBetween('deposit_date', [$startStr, $endStr])
            ->sum('amount');

        // Penjualan Cream
        $creamRows = PenjualanCream::whereBetween('transaction_date', [$startStr, $endStr])
            ->orderBy('transaction_date')
            ->orderBy('transaction_no')
            ->get();

        $totalCream = $creamRows->sum('selling_price');
        $totalCreamExpense = $creamRows->sum('expense');
        $totalCreamCash = $creamRows->where('payment_method', 'Cash')->sum('selling_price');
        $totalCreamTf = $creamRows->where('payment_method', 'TF')->sum('selling_price');

        // Faktur Obat
        $fakturRows = FakturObat::whereBetween('invoice_date', [$startStr, $endStr])
            ->orderBy('invoice_date')
            ->orderBy('invoice_no')
            ->get();

        $totalFaktur = $fakturRows->sum('price');

        return [
            'period' => [
                'start' => $startStr,
                'end' => $endStr,
                'week_label' => 'Minggu ' . $start->format('d M') . ' - ' . $end->format('d M Y'),
            ],
            'observasi_umum' => [
                'rows' => $obsRows,
                'total_transaksi' => $obsRows->count(),
                'total_pemasukan' => $totalObs,
                'total_cash' => $totalObsCash,
                'total_qris_tf' => $totalObsQrisTf,
                'total_setoran' => $setoranObs,
                'sisa_saldo' => $totalObs - $setoranObs,
            ],
            'penjualan_cream' => [
                'rows' => $creamRows,
                'total_transaksi' => $creamRows->count(),
                'total_penjualan' => $totalCream,
                'total_pengeluaran' => $totalCreamExpense,
                'saldo_bersih' => $totalCream - $totalCreamExpense,
                'total_cash' => $totalCreamCash,
                'total_transfer' => $totalCreamTf,
            ],
            'faktur_obat' => [
                'rows' => $fakturRows,
                'total_faktur' => $fakturRows->count(),
                'total_pembelian' => $totalFaktur,
            ],
        ];
    }

    public function getRekapBulanan(int $month, int $year): array
    {
        // Observasi Umum grouped by week
        $obsRows = ObservasiUmum::whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->orderBy('transaction_date')
            ->orderBy('transaction_no')
            ->get();

        $creamRows = PenjualanCream::whereYear('transaction_date', $year)
            ->whereMonth('transaction_date', $month)
            ->orderBy('transaction_date')
            ->orderBy('transaction_no')
            ->get();

        $fakturRows = FakturObat::whereYear('invoice_date', $year)
            ->whereMonth('invoice_date', $month)
            ->orderBy('invoice_date')
            ->orderBy('invoice_no')
            ->get();

        $setoranObs = Setoran::where('source', 'Observasi Umum')
            ->whereYear('deposit_date', $year)
            ->whereMonth('deposit_date', $month)
            ->sum('amount');

        $setoranCream = Setoran::where('source', 'Penjualan Cream')
            ->whereYear('deposit_date', $year)
            ->whereMonth('deposit_date', $month)
            ->sum('amount');

        $setoranLainnya = Setoran::where('source', 'Lainnya')
            ->whereYear('deposit_date', $year)
            ->whereMonth('deposit_date', $month)
            ->sum('amount');

        $totalObs = $obsRows->sum('price');
        $totalCream = $creamRows->sum('selling_price');
        $totalCreamExpense = $creamRows->sum('expense');
        $totalFaktur = $fakturRows->sum('price');

        // Group observasi by week
        $weeklyObs = $this->groupByWeek($obsRows, 'transaction_date', 'price');

        return [
            'period' => [
                'month' => $month,
                'year' => $year,
                'label' => Carbon::create($year, $month, 1)->format('F Y'),
            ],
            'observasi_umum' => [
                'weekly_breakdown' => $weeklyObs,
                'total_transaksi' => $obsRows->count(),
                'total_pemasukan' => $totalObs,
                'total_cash' => $obsRows->where('payment_method', 'Cash')->sum('price'),
                'total_qris_tf' => $obsRows->where('payment_method', 'QRIS/TF')->sum('price'),
                'total_setoran' => $setoranObs,
                'sisa_saldo' => $totalObs - $setoranObs,
            ],
            'penjualan_cream' => [
                'total_transaksi' => $creamRows->count(),
                'total_penjualan' => $totalCream,
                'total_pengeluaran' => $totalCreamExpense,
                'saldo_bersih' => $totalCream - $totalCreamExpense,
                'total_cash' => $creamRows->where('payment_method', 'Cash')->sum('selling_price'),
                'total_transfer' => $creamRows->where('payment_method', 'TF')->sum('selling_price'),
                'total_setoran' => $setoranCream,
                'sisa_saldo' => ($totalCream - $totalCreamExpense) - $setoranCream,
            ],
            'faktur_obat' => [
                'total_faktur' => $fakturRows->count(),
                'total_pembelian' => $totalFaktur,
            ],
            'setoran' => [
                'observasi_umum' => $setoranObs,
                'penjualan_cream' => $setoranCream,
                'lainnya' => $setoranLainnya,
                'total' => $setoranObs + $setoranCream + $setoranLainnya,
            ],
        ];
    }

    private function groupByWeek($rows, string $dateField, string $valueField): array
    {
        $weeks = [];

        foreach ($rows as $row) {
            $date = Carbon::parse($row->$dateField);
            $weekStart = $date->copy()->startOfWeek(Carbon::MONDAY)->format('Y-m-d');
            $weekEnd = $date->copy()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d');
            $weekKey = $weekStart;

            if (!isset($weeks[$weekKey])) {
                $weeks[$weekKey] = [
                    'week_start' => $weekStart,
                    'week_end' => $weekEnd,
                    'label' => 'Minggu ' . Carbon::parse($weekStart)->format('d') . '-' . Carbon::parse($weekEnd)->format('d M'),
                    'count' => 0,
                    'total' => 0,
                ];
            }

            $weeks[$weekKey]['count']++;
            $weeks[$weekKey]['total'] += $row->$valueField;
        }

        return array_values($weeks);
    }
}
