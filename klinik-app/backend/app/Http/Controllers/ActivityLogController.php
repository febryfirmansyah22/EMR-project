<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($request->get('module')) {
            $query->where('module', $request->module);
        }

        if ($request->get('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->get('activity')) {
            $query->where('activity', $request->activity);
        }

        if ($request->get('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->get('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return $this->paginated('Activity logs', $logs);
    }
}
