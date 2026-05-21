<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreVisitRequest;
use App\Http\Requests\UpdateVisitRequest;
use App\Http\Requests\UpdateVisitStatusRequest;
use App\Models\Visit;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitController extends Controller
{
    public function __construct(private readonly VisitService $service) {}

    // ── CRUD Standar ──────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Visit::class);

        $visits = $this->service->index(
            $request->only(['date', 'poli_id', 'doctor_id', 'status', 'patient_id', 'search', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $visits->items(),
            'meta'    => [
                'current_page' => $visits->currentPage(),
                'last_page'    => $visits->lastPage(),
                'per_page'     => $visits->perPage(),
                'total'        => $visits->total(),
            ],
        ]);
    }

    public function show(Visit $visit): JsonResponse
    {
        $this->authorize('view', $visit);

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $visit->load('patient', 'poli', 'doctor.user', 'registeredBy:id,name,role'),
        ]);
    }

    public function store(StoreVisitRequest $request): JsonResponse
    {
        $this->authorize('create', Visit::class);

        $visit = $this->service->store($request->validated());

        return response()->json([
            'success' => true,
            'message' => "Pasien berhasil didaftarkan. No. antrean: {$visit->queue_number}",
            'data'    => $visit,
        ], 201);
    }

    public function update(UpdateVisitRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('update', $visit);

        if (!$visit->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Kunjungan yang sudah selesai atau dibatalkan tidak dapat diubah.',
            ], 422);
        }

        $visit = $this->service->update($visit, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Data kunjungan berhasil diperbarui.',
            'data'    => $visit,
        ]);
    }

    public function destroy(Visit $visit): JsonResponse
    {
        $this->authorize('delete', $visit);

        if (!$visit->isActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Kunjungan sudah selesai atau sudah dibatalkan.',
            ], 422);
        }

        $this->service->cancel($visit, request('notes'));

        return response()->json([
            'success' => true,
            'message' => 'Kunjungan berhasil dibatalkan.',
        ]);
    }

    // ── Update Status Antrean ─────────────────────────────────

    /**
     * PATCH /visits/{visit}/status
     * Transisi status sesuai alur klinik.
     */
    public function updateStatus(UpdateVisitStatusRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('updateStatus', $visit);

        $newStatus = $request->validated()['status'];

        if (!$visit->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat mengubah status dari '{$visit->status}' ke '{$newStatus}'.",
                'data'    => [
                    'current_status'   => $visit->status,
                    'allowed_next'     => array_values(Visit::STATUS_TRANSITIONS[$visit->status] ?? []),
                ],
            ], 422);
        }

        $visit = $this->service->updateStatus($visit, $newStatus);

        return response()->json([
            'success' => true,
            'message' => "Status antrean diperbarui menjadi '{$newStatus}'.",
            'data'    => $visit,
        ]);
    }

    // ── Board Antrean Hari Ini ────────────────────────────────

    /**
     * GET /visits/queue-today?poli_id=1
     * Digunakan untuk tampilan board antrean (TV/monitor di ruang tunggu).
     */
    public function queueToday(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Visit::class);

        $queue = $this->service->todayQueue($request->integer('poli_id') ?: null);

        // Group by poli untuk tampilan terstruktur
        $grouped = $queue->groupBy('poli_id')->map(function ($visits) {
            $first = $visits->first();
            return [
                'poli'   => ['id' => $first->poli_id, 'name' => $first->poli->name],
                'queue'  => $visits->values(),
                'total'  => $visits->count(),
                'active' => $visits->where('status', '!=', Visit::STATUS_BATAL)->count(),
            ];
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Antrean hari ini',
            'data'    => $grouped,
            'meta'    => ['date' => today()->toDateString()],
        ]);
    }
}
