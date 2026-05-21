<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Visit;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    // ── Dashboard ─────────────────────────────────────────────

    public function dashboard(): array
    {
        $today     = today()->toDateString();
        $monthStart = today()->startOfMonth()->toDateString();
        $monthEnd   = today()->endOfMonth()->toDateString();

        // ── Kunjungan hari ini ──
        $todayVisits = Visit::whereDate('visit_date', $today)
            ->where('status', '!=', Visit::STATUS_BATAL)
            ->get(['status']);

        $visitsByStatus = $todayVisits->groupBy('status')
            ->map(fn ($g) => $g->count());

        // ── Pasien baru hari ini ──
        $newPatientsToday = Patient::whereDate('created_at', $today)->count();

        // ── Pendapatan hari ini ──
        $revenueToday = Invoice::whereDate('paid_at', $today)
            ->where('status', Invoice::STATUS_LUNAS)
            ->sum('total_amount');

        // ── Pendapatan bulan ini ──
        $revenueMonth = Invoice::whereBetween('paid_at', [$monthStart . ' 00:00:00', $monthEnd . ' 23:59:59'])
            ->where('status', Invoice::STATUS_LUNAS)
            ->sum('total_amount');

        // ── Kunjungan bulan ini ──
        $visitsMonth = Visit::whereBetween('visit_date', [$monthStart, $monthEnd])
            ->where('status', '!=', Visit::STATUS_BATAL)
            ->count();

        // ── Pasien baru bulan ini ──
        $newPatientsMonth = Patient::whereBetween('created_at', [$monthStart . ' 00:00:00', $monthEnd . ' 23:59:59'])
            ->count();

        // ── Resep menunggu proses ──
        $prescriptionsPending = Prescription::whereIn('status', [
            Prescription::STATUS_MENUNGGU,
            Prescription::STATUS_DIPROSES,
        ])->count();

        // ── Invoice menunggu pembayaran ──
        $invoicesPending = Invoice::where('status', Invoice::STATUS_MENUNGGU)->count();

        // ── Obat stok menipis ──
        $lowStockMedicines = Medicine::whereColumn('stock', '<=', 'min_stock')
            ->where('is_active', true)
            ->orderBy('stock')
            ->get(['id', 'name', 'stock', 'min_stock', 'unit']);

        // ── Top 5 poli hari ini ──
        $topPolisToday = Visit::whereDate('visit_date', $today)
            ->where('status', '!=', Visit::STATUS_BATAL)
            ->join('polis', 'visits.poli_id', '=', 'polis.id')
            ->groupBy('polis.id', 'polis.name')
            ->orderByDesc(DB::raw('count(*)'))
            ->limit(5)
            ->get([DB::raw('polis.id'), DB::raw('polis.name'), DB::raw('count(*) as total')]);

        // ── Pendapatan 7 hari terakhir ──
        $last7Days = collect(range(6, 0))->map(function ($daysAgo) {
            $date = today()->subDays($daysAgo)->toDateString();
            $rev  = Invoice::whereDate('paid_at', $date)
                ->where('status', Invoice::STATUS_LUNAS)
                ->sum('total_amount');
            $cnt  = Visit::whereDate('visit_date', $date)
                ->where('status', '!=', Visit::STATUS_BATAL)
                ->count();
            return [
                'date'     => $date,
                'revenue'  => (float) $rev,
                'visits'   => $cnt,
            ];
        });

        return [
            'today' => [
                'visits_total'    => $todayVisits->count(),
                'visits_by_status' => $visitsByStatus,
                'new_patients'    => $newPatientsToday,
                'revenue'         => (float) $revenueToday,
            ],
            'month' => [
                'visits_total'  => $visitsMonth,
                'new_patients'  => $newPatientsMonth,
                'revenue'       => (float) $revenueMonth,
            ],
            'pending' => [
                'prescriptions' => $prescriptionsPending,
                'invoices'      => $invoicesPending,
            ],
            'alerts' => [
                'low_stock_count'     => $lowStockMedicines->count(),
                'low_stock_medicines' => $lowStockMedicines,
            ],
            'top_polis_today' => $topPolisToday,
            'last_7_days'     => $last7Days,
        ];
    }

    // ── Laporan Kunjungan ────────────────────────────────────

    public function visitsReport(array $filters = []): LengthAwarePaginator
    {
        return Visit::with([
                'patient:id,name,medical_record_number,insurance_type',
                'poli:id,name',
                'doctor:id,user_id',
                'doctor.user:id,name',
                'invoice:id,visit_id,invoice_number,total_amount,status,payment_method',
            ])
            ->when(!empty($filters['date_from']),
                fn ($q) => $q->whereDate('visit_date', '>=', $filters['date_from'])
            )
            ->when(!empty($filters['date_to']),
                fn ($q) => $q->whereDate('visit_date', '<=', $filters['date_to'])
            )
            ->when(!empty($filters['poli_id']),
                fn ($q) => $q->where('poli_id', $filters['poli_id'])
            )
            ->when(!empty($filters['doctor_id']),
                fn ($q) => $q->where('doctor_id', $filters['doctor_id'])
            )
            ->when(!empty($filters['status']),
                fn ($q) => $q->where('status', $filters['status'])
            )
            ->orderByDesc('visit_date')
            ->orderBy('queue_number')
            ->paginate($filters['per_page'] ?? 20);
    }

    // ── Laporan Pendapatan ───────────────────────────────────

    public function revenueReport(array $filters = []): array
    {
        $dateFrom = $filters['date_from'] ?? today()->startOfMonth()->toDateString();
        $dateTo   = $filters['date_to']   ?? today()->toDateString();
        $groupBy  = $filters['group_by']  ?? 'daily'; // daily | monthly

        $baseQuery = Invoice::where('status', Invoice::STATUS_LUNAS)
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59']);

        // ── Ringkasan ──
        $summary = (clone $baseQuery)->selectRaw(
            'COUNT(*) as total_invoices,
             SUM(total_amount) as total_revenue,
             SUM(discount) as total_discount,
             AVG(total_amount) as avg_revenue'
        )->first();

        // ── Breakdown per metode pembayaran ──
        $byMethod = (clone $baseQuery)
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total_amount) as revenue')
            ->groupBy('payment_method')
            ->get();

        // ── Breakdown per periode ──
        $dateFormat = $groupBy === 'monthly' ? 'YYYY-MM' : 'YYYY-MM-DD';
        $breakdown = (clone $baseQuery)
            ->selectRaw(
                "TO_CHAR(paid_at, '{$dateFormat}') as period,
                 COUNT(*) as invoices,
                 SUM(total_amount) as revenue,
                 SUM(discount) as discount"
            )
            ->groupByRaw("TO_CHAR(paid_at, '{$dateFormat}')")
            ->orderBy('period')
            ->get();

        return [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
                'group_by'  => $groupBy,
            ],
            'summary' => [
                'total_invoices' => (int) ($summary->total_invoices ?? 0),
                'total_revenue'  => (float) ($summary->total_revenue ?? 0),
                'total_discount' => (float) ($summary->total_discount ?? 0),
                'avg_revenue'    => round((float) ($summary->avg_revenue ?? 0), 2),
            ],
            'by_payment_method' => $byMethod,
            'breakdown'         => $breakdown,
        ];
    }

    // ── Laporan Stok Obat ────────────────────────────────────

    public function medicinesReport(array $filters = []): array
    {
        $medicines = Medicine::orderBy('name')->get([
            'id', 'name', 'generic_name', 'category', 'unit',
            'stock', 'min_stock', 'price', 'is_active',
        ]);

        $summary = [
            'total'     => $medicines->count(),
            'active'    => $medicines->where('is_active', true)->count(),
            'low_stock' => $medicines->where('is_active', true)
                              ->filter(fn ($m) => $m->stock <= $m->min_stock)->count(),
            'out_stock' => $medicines->where('is_active', true)
                              ->where('stock', 0)->count(),
        ];

        // Beri label status stok
        $enriched = $medicines->map(function ($m) {
            $status = match (true) {
                $m->stock === 0                    => 'habis',
                $m->stock <= $m->min_stock         => 'menipis',
                default                            => 'normal',
            };
            return array_merge($m->toArray(), ['stock_status' => $status]);
        });

        return [
            'summary'   => $summary,
            'medicines' => $enriched,
        ];
    }

    // ── Export CSV Kunjungan ─────────────────────────────────

    public function exportVisitsCsv(array $filters = []): string
    {
        $visits = Visit::with([
                'patient:id,name,medical_record_number,insurance_type',
                'poli:id,name',
                'doctor:id,user_id',
                'doctor.user:id,name',
                'invoice:id,visit_id,total_amount,payment_method,status',
            ])
            ->when(!empty($filters['date_from']),
                fn ($q) => $q->whereDate('visit_date', '>=', $filters['date_from'])
            )
            ->when(!empty($filters['date_to']),
                fn ($q) => $q->whereDate('visit_date', '<=', $filters['date_to'])
            )
            ->when(!empty($filters['poli_id']),
                fn ($q) => $q->where('poli_id', $filters['poli_id'])
            )
            ->when(!empty($filters['status']),
                fn ($q) => $q->where('status', $filters['status'])
            )
            ->orderByDesc('visit_date')
            ->orderBy('queue_number')
            ->get();

        $rows   = [];
        $rows[] = implode(',', [
            'No. Kunjungan', 'Tanggal', 'No. Antrian', 'No. RM', 'Nama Pasien',
            'Poli', 'Dokter', 'Status', 'Asuransi',
            'Total Tagihan', 'Metode Bayar', 'Status Pembayaran',
        ]);

        foreach ($visits as $v) {
            $rows[] = implode(',', [
                $v->visit_number,
                $v->visit_date->format('d/m/Y'),
                $v->queue_number,
                $v->patient?->medical_record_number ?? '',
                '"' . str_replace('"', '""', $v->patient?->name ?? '') . '"',
                '"' . str_replace('"', '""', $v->poli?->name ?? '') . '"',
                '"' . str_replace('"', '""', $v->doctor?->user?->name ?? 'Belum ditentukan') . '"',
                $v->status,
                $v->patient?->insurance_type ?? '',
                $v->invoice?->total_amount ?? 0,
                $v->invoice?->payment_method ?? '',
                $v->invoice?->status ?? '',
            ]);
        }

        return implode("\n", $rows);
    }

    // ── Export CSV Pendapatan ────────────────────────────────

    public function exportRevenueCsv(array $filters = []): string
    {
        $dateFrom = $filters['date_from'] ?? today()->startOfMonth()->toDateString();
        $dateTo   = $filters['date_to']   ?? today()->toDateString();

        $invoices = Invoice::with([
                'patient:id,name,medical_record_number',
                'visit:id,visit_number',
                'paidBy:id,name',
            ])
            ->where('status', Invoice::STATUS_LUNAS)
            ->whereBetween('paid_at', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->orderByDesc('paid_at')
            ->get();

        $rows   = [];
        $rows[] = implode(',', [
            'No. Invoice', 'No. Kunjungan', 'No. RM', 'Nama Pasien',
            'Subtotal', 'Diskon', 'Total Tagihan',
            'Metode Bayar', 'Jumlah Dibayar', 'Kembalian',
            'Tanggal Bayar', 'Kasir',
        ]);

        foreach ($invoices as $inv) {
            $rows[] = implode(',', [
                $inv->invoice_number,
                $inv->visit?->visit_number ?? '',
                $inv->patient?->medical_record_number ?? '',
                '"' . str_replace('"', '""', $inv->patient?->name ?? '') . '"',
                $inv->subtotal,
                $inv->discount,
                $inv->total_amount,
                $inv->payment_method,
                $inv->payment_amount,
                $inv->payment_change,
                $inv->paid_at?->format('d/m/Y H:i') ?? '',
                '"' . str_replace('"', '""', $inv->paidBy?->name ?? '') . '"',
            ]);
        }

        return implode("\n", $rows);
    }
}
