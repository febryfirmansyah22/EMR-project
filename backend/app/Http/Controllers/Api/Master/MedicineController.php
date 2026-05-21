<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\MedicineRequest;
use App\Models\Medicine;
use App\Services\MedicineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicineController extends Controller
{
    public function __construct(private readonly MedicineService $service) {}

    public function index(Request $request): JsonResponse
    {
        $medicines = $this->service->index($request->only(['search', 'category', 'is_active', 'low_stock', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $medicines->items(),
            'meta'    => [
                'current_page' => $medicines->currentPage(),
                'last_page'    => $medicines->lastPage(),
                'per_page'     => $medicines->perPage(),
                'total'        => $medicines->total(),
            ],
        ]);
    }

    public function show(Medicine $medicine): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $medicine]);
    }

    public function store(MedicineRequest $request): JsonResponse
    {
        $this->authorize('create', Medicine::class);
        $medicine = $this->service->store($request->validated());
        return response()->json(['success' => true, 'message' => 'Obat berhasil ditambahkan', 'data' => $medicine], 201);
    }

    public function update(MedicineRequest $request, Medicine $medicine): JsonResponse
    {
        $this->authorize('update', $medicine);
        $medicine = $this->service->update($medicine, $request->validated());
        return response()->json(['success' => true, 'message' => 'Obat berhasil diperbarui', 'data' => $medicine]);
    }

    public function destroy(Medicine $medicine): JsonResponse
    {
        $this->authorize('delete', $medicine);
        $this->service->destroy($medicine);
        return response()->json(['success' => true, 'message' => 'Obat berhasil dihapus']);
    }
}
