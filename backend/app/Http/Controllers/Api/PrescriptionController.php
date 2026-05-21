<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PrescriptionRequest;
use App\Http\Requests\UpdatePrescriptionRequest;
use App\Http\Requests\UpdatePrescriptionStatusRequest;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\Visit;
use App\Services\PrescriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrescriptionController extends Controller
{
    public function __construct(private readonly PrescriptionService $service) {}

    // ── GET /prescriptions — antrian farmasi ──────────────────

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Prescription::class);

        $filters = $request->only(['status', 'date', 'search', 'per_page']);
        $paginated = $this->service->index($filters);

        return response()->json([
            'success' => true,
            'message' => 'Daftar resep berhasil diambil.',
            'data'    => $paginated->items(),
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    // ── GET /visits/{visit}/prescription ─────────────────────

    public function showByVisit(Visit $visit): JsonResponse
    {
        $this->authorize('view', Prescription::class);

        $prescription = $visit->prescription()->with([
            'doctor.user:id,name',
            'dispensedBy:id,name',
            'visit:id,visit_number,visit_date,patient_id,status',
            'visit.patient:id,name,medical_record_number',
            'items.medicine:id,name,unit,stock',
        ])->first();

        if (!$prescription) {
            return response()->json([
                'success' => false,
                'message' => 'Kunjungan ini belum memiliki resep.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data resep berhasil diambil.',
            'data'    => $prescription,
        ]);
    }

    // ── GET /prescriptions/{prescription} ────────────────────

    public function show(Prescription $prescription): JsonResponse
    {
        $this->authorize('view', $prescription);

        $prescription->load([
            'doctor.user:id,name',
            'dispensedBy:id,name',
            'visit:id,visit_number,visit_date,patient_id,status',
            'visit.patient:id,name,medical_record_number',
            'items.medicine:id,name,unit,stock',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail resep berhasil diambil.',
            'data'    => $prescription,
        ]);
    }

    // ── POST /visits/{visit}/prescription ────────────────────

    public function store(PrescriptionRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('create', Prescription::class);

        // Cek apakah kunjungan ini sudah punya resep
        if ($visit->prescription()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Kunjungan ini sudah memiliki resep. Gunakan PUT untuk memperbarui.',
            ], 422);
        }

        $prescription = $this->service->store($visit, $request->validated());

        return response()->json([
            'success' => true,
            'message' => "Resep {$prescription->prescription_number} berhasil dibuat.",
            'data'    => $prescription,
        ], 201);
    }

    // ── PUT /prescriptions/{prescription} ────────────────────

    public function update(UpdatePrescriptionRequest $request, Prescription $prescription): JsonResponse
    {
        $this->authorize('update', $prescription);

        if (!$prescription->isEditable()) {
            return response()->json([
                'success' => false,
                'message' => "Resep berstatus '{$prescription->status}' tidak dapat diubah. Hanya resep berstatus 'menunggu' yang dapat diedit.",
            ], 422);
        }

        $prescription = $this->service->update($prescription, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Resep berhasil diperbarui.',
            'data'    => $prescription,
        ]);
    }

    // ── PATCH /prescriptions/{prescription}/status ───────────

    public function updateStatus(UpdatePrescriptionStatusRequest $request, Prescription $prescription): JsonResponse
    {
        $this->authorize('updateStatus', $prescription);

        $newStatus = $request->validated()['status'];

        // Validasi transisi status
        if (!$prescription->canTransitionTo($newStatus)) {
            return response()->json([
                'success' => false,
                'message' => "Tidak dapat mengubah status dari '{$prescription->status}' ke '{$newStatus}'.",
            ], 422);
        }

        try {
            $prescription = $this->service->updateStatus(
                $prescription,
                $newStatus,
                $request->validated()['pharmacist_notes'] ?? null,
            );
        } catch (\RuntimeException $e) {
            // Stok tidak cukup atau error lain dari service
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => "Status resep berhasil diubah ke '{$newStatus}'.",
            'data'    => $prescription,
        ]);
    }

    // ── DELETE /prescriptions/{prescription} ─────────────────

    public function destroy(Prescription $prescription): JsonResponse
    {
        $this->authorize('delete', $prescription);

        $prescription->items()->delete();
        $prescription->delete();

        return response()->json([
            'success' => true,
            'message' => 'Resep berhasil dihapus.',
        ]);
    }

    // ── GET /master/medicines/{medicine}/stock-history ───────

    public function stockHistory(Request $request, Medicine $medicine): JsonResponse
    {
        $this->authorize('view', $medicine);

        $filters = $request->only(['per_page']);
        $paginated = $this->service->stockHistory($medicine, $filters);

        return response()->json([
            'success' => true,
            'message' => "Riwayat stok {$medicine->name} berhasil diambil.",
            'data'    => $paginated->items(),
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
                'medicine'     => [
                    'id'    => $medicine->id,
                    'name'  => $medicine->name,
                    'stock' => $medicine->stock,
                    'unit'  => $medicine->unit,
                ],
            ],
        ]);
    }
}
