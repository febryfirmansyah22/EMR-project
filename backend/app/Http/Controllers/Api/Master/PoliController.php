<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\PoliRequest;
use App\Models\Poli;
use App\Services\PoliService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PoliController extends Controller
{
    public function __construct(private readonly PoliService $service) {}

    public function index(Request $request): JsonResponse
    {
        $polis = $this->service->index($request->only(['search', 'is_active', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $polis->items(),
            'meta'    => [
                'current_page' => $polis->currentPage(),
                'last_page'    => $polis->lastPage(),
                'per_page'     => $polis->perPage(),
                'total'        => $polis->total(),
            ],
        ]);
    }

    public function show(Poli $poli): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $poli]);
    }

    public function store(PoliRequest $request): JsonResponse
    {
        $this->authorize('create', Poli::class);
        $poli = $this->service->store($request->validated());
        return response()->json(['success' => true, 'message' => 'Poli berhasil ditambahkan', 'data' => $poli], 201);
    }

    public function update(PoliRequest $request, Poli $poli): JsonResponse
    {
        $this->authorize('update', $poli);
        $poli = $this->service->update($poli, $request->validated());
        return response()->json(['success' => true, 'message' => 'Poli berhasil diperbarui', 'data' => $poli]);
    }

    public function destroy(Poli $poli): JsonResponse
    {
        $this->authorize('delete', $poli);
        $this->service->destroy($poli);
        return response()->json(['success' => true, 'message' => 'Poli berhasil dihapus']);
    }
}
