<?php

namespace App\Services;

use App\Models\FakturObat;
use App\Models\ObservasiUmum;
use App\Models\PenjualanCream;
use App\Models\Setoran;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    public function getSummary(array $filters): array
    {
        $period = $filters['period'] ?? 'this_month';
        $startDate = $filters['start_date'] ?? null;
        $endDate = $filters['end_date'] ?? null;

        [$obsStart, $obsEnd] = $this->resolveDateRange($period, $startDate, $endDate);

        // Observasi Umum stats
        $obsQuery = ObservasiUmum::query();
        $this->applyDateFilter($obsQuery, 'transaction_date', $obsStart, $obsEnd);

        $totalPasienHariIni = ObservasiUmum::whereDate('transaction_date', today())->count();
        $totalPasienBulanIni = ObservasiUmum::whereYear('transaction_date', now()->year)
            ->whereMonth('transaction_date', now()->month)->count();

        $totalPemasukan = (clone $obsQuery)->sum('price');
        $totalCash = (clone $obsQuery)->where('payment_method', 'Cash')->sum('price');
        $totalQrisTf = (clone $obsQuery)->where('payment_method', 'QRIS/TF')->sum('price');

        $setoranObsQuery = Setoran::where('source', 'Observasi Umum');
        $this->applyDateFilter($setoranObsQuery, 'deposit_date', $obsStart, $obsEnd);
        $totalSetoran = $setoranObsQuery->sum('amount');

        // Penjualan Cream stats
        $creamQuery = PenjualanCream::query();
        $this->applyDateFilter($creamQuery, 'transaction_date', $obsStart, $obsEnd);

        $totalPenjualanCream = (clone $creamQuery)->sum('selling_price');
        $totalPengeluaranCream = (clone $creamQuery)->sum('expense');

        // Faktur Obat stats
        $fakturQuery = FakturObat::query();
        $this->applyDateFilter($fakturQuery, 'invoice_date', $obsStart, $obsEnd);
        $totalPembelianObat = $fakturQuery->sum('price');

        // Chart data (monthly for current year)
        $chartData = $this->getChartData();

        return [
            'total_pasien_hari_ini' => $totalPasienHariIni,
            'total_pasien_bulan_ini' => $totalPasienBulanIni,
            'total_pemasukan' => $totalPemasukan,
            'total_cash' => $totalCash,
            'total_qristf' => $totalQrisTf,
            'total_setoran' => $totalSetoran,
            'sisa_saldo' => $totalPemasukan - $totalSetoran,
            'total_penjualan_cream' => $totalPenjualanCream,
            'total_pengeluaran_cream' => $totalPengeluaranCream,
            'saldo_cream' => $totalPenjualanCream - $totalPengeluaranCream,
            'total_pembelian_obat' => $totalPembelianObat,
            'chart_data' => $chartData,
        ];
    }

    private function getChartData(): array
    {
        $year = now()->year;
        $months = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthStr = str_pad($m, 2, '0', STR_PAD_LEFT);

            $pasien = ObservasiUmum::whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $m)->count();

            $pemasukan = ObservasiUmum::whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $m)->sum('price');

            $penjualanCream = PenjualanCream::whereYear('transaction_date', $year)
                ->whereMonth('transaction_date', $m)->sum('selling_price');

            $pembelianObat = FakturObat::whereYear('invoice_date', $year)
                ->whereMonth('invoice_date', $m)->sum('price');

            $months[] = [
                'month' => $year . '-' . $monthStr,
                'label' => Carbon::create($year, $m, 1)->translatedFormat('M Y'),
                'pasien' => $pasien,
                'pemasukan' => $pemasukan,
                'penjualan_cream' => $penjualanCream,
                'pembelian_obat' => $pembelianObat,
            ];
        }

        return $months;
    }

    private function resolveDateRange(string $period, ?string $startDate, ?string $endDate): array
    {
        if ($startDate && $endDate) {
            return [$startDate, $endDate];
        }

        return match ($period) {
            'today' => [today()->format('Y-m-d'), today()->format('Y-m-d')],
            'this_week' => [
                now()->startOfWeek(Carbon::MONDAY)->format('Y-m-d'),
                now()->endOfWeek(Carbon::SUNDAY)->format('Y-m-d'),
            ],
            'this_month' => [
                now()->startOfMonth()->format('Y-m-d'),
                now()->endOfMonth()->format('Y-m-d'),
            ],
            'this_year' => [
                now()->startOfYear()->format('Y-m-d'),
                now()->endOfYear()->format('Y-m-d'),
            ],
            default => [
                now()->startOfMonth()->format('Y-m-d'),
                now()->endOfMonth()->format('Y-m-d'),
            ],
        };
    }

    private function applyDateFilter($query, string $column, string $start, string $end): void
    {
        $query->whereDate($column, '>=', $start)->whereDate($column, '<=', $end);
    }
}
