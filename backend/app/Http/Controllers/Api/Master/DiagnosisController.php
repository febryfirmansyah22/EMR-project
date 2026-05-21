<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\DiagnosisRequest;
use App\Models\Diagnosis;
use App\Services\DiagnosisService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiagnosisController extends Controller
{
    public function __construct(private readonly DiagnosisService $service) {}

    public function index(Request $request): JsonResponse
    {
        $diagnoses = $this->service->index($request->only(['search', 'is_active', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $diagnoses->items(),
            'meta'    => [
                'current_page' => $diagnoses->currentPage(),
                'last_page'    => $diagnoses->lastPage(),
                'per_page'     => $diagnoses->perPage(),
                'total'        => $diagnoses->total(),
            ],
        ]);
    }

    public function show(Diagnosis $diagnosis): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $diagnosis]);
    }

    public function store(DiagnosisRequest $request): JsonResponse
    {
        $this->authorize('create', Diagnosis::class);
        $diagnosis = $this->service->store($request->validated());
        return response()->json(['success' => true, 'message' => 'Diagnosis berhasil ditambahkan', 'data' => $diagnosis], 201);
    }

    public function update(DiagnosisRequest $request, Diagnosis $diagnosis): JsonResponse
    {
        $this->authorize('update', $diagnosis);
        $diagnosis = $this->service->update($diagnosis, $request->validated());
        return response()->json(['success' => true, 'message' => 'Diagnosis berhasil diperbarui', 'data' => $diagnosis]);
    }

    public function destroy(Diagnosis $diagnosis): JsonResponse
    {
        $this->authorize('delete', $diagnosis);
        $this->service->destroy($diagnosis);
        return response()->json(['success' => true, 'message' => 'Diagnosis berhasil dihapus']);
    }
}
