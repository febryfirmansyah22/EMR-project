<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['period', 'start_date', 'end_date']);
        $data = $this->dashboardService->getSummary($filters);

        return $this->success('Dashboard data', $data);
    }
}
