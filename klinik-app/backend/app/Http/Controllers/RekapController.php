<?php

namespace App\Http\Controllers;

use App\Services\RekapService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RekapController extends Controller
{
    public function __construct(
        protected RekapService $rekapService
    ) {}

    public function mingguan(Request $request): JsonResponse
    {
        $request->validate([
            'week_start' => ['required', 'date'],
        ]);

        $weekStart = $request->get('week_start');
        $data = $this->rekapService->getRekapMingguan($weekStart);

        return $this->success('Rekap mingguan', $data);
    }

    public function bulanan(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $month = (int) $request->get('month');
        $year = (int) $request->get('year');

        $data = $this->rekapService->getRekapBulanan($month, $year);

        return $this->success('Rekap bulanan', $data);
    }
}
