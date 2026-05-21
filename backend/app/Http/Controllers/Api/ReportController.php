<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $service) {}

    // ── GET /reports/dashboard ────────────────────────────────

    public function dashboard(): JsonResponse
    {
        Gate::authorize('view-dashboard');

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard berhasil diambil.',
            'data'    => $this->service->dashboard(),
        ]);
    }

    // ── GET /reports/visits ───────────────────────────────────

    public function visits(Request $request): JsonResponse
    {
        Gate::authorize('view-reports');

        $filters   = $request->only(['date_from', 'date_to', 'poli_id', 'doctor_id', 'status', 'per_page']);
        $paginated = $this->service->visitsReport($filters);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kunjungan berhasil diambil.',
            'data'    => $paginated->items(),
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
                'filters'      => $filters,
            ],
        ]);
    }

    // ── GET /reports/visits/export ────────────────────────────

    public function exportVisits(Request $request): Response
    {
        Gate::authorize('export-reports');

        $filters  = $request->only(['date_from', 'date_to', 'poli_id', 'status']);
        $csv      = $this->service->exportVisitsCsv($filters);
        $filename = 'laporan-kunjungan-' . now()->format('Ymd-His') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ── GET /reports/revenue ──────────────────────────────────

    public function revenue(Request $request): JsonResponse
    {
        Gate::authorize('view-reports');

        $filters = $request->only(['date_from', 'date_to', 'group_by']);
        $data    = $this->service->revenueReport($filters);

        return response()->json([
            'success' => true,
            'message' => 'Laporan pendapatan berhasil diambil.',
            'data'    => $data,
        ]);
    }

    // ── GET /reports/revenue/export ───────────────────────────

    public function exportRevenue(Request $request): Response
    {
        Gate::authorize('export-reports');

        $filters  = $request->only(['date_from', 'date_to']);
        $csv      = $this->service->exportRevenueCsv($filters);
        $filename = 'laporan-pendapatan-' . now()->format('Ymd-His') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ── GET /reports/medicines ────────────────────────────────

    public function medicines(): JsonResponse
    {
        Gate::authorize('view-reports');

        return response()->json([
            'success' => true,
            'message' => 'Laporan stok obat berhasil diambil.',
            'data'    => $this->service->medicinesReport(),
        ]);
    }
}
