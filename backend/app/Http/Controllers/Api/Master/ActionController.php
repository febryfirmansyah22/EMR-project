<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\MedicalActionRequest;
use App\Models\MedicalAction;
use App\Services\MedicalActionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActionController extends Controller
{
    public function __construct(private readonly MedicalActionService $service) {}

    public function index(Request $request): JsonResponse
    {
        $actions = $this->service->index($request->only(['search', 'category', 'is_active', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $actions->items(),
            'meta'    => [
                'current_page' => $actions->currentPage(),
                'last_page'    => $actions->lastPage(),
                'per_page'     => $actions->perPage(),
                'total'        => $actions->total(),
            ],
        ]);
    }

    public function show(MedicalAction $action): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $action]);
    }

    public function store(MedicalActionRequest $request): JsonResponse
    {
        $this->authorize('create', MedicalAction::class);
        $action = $this->service->store($request->validated());
        return response()->json(['success' => true, 'message' => 'Tindakan berhasil ditambahkan', 'data' => $action], 201);
    }

    public function update(MedicalActionRequest $request, MedicalAction $action): JsonResponse
    {
        $this->authorize('update', $action);
        $action = $this->service->update($action, $request->validated());
        return response()->json(['success' => true, 'message' => 'Tindakan berhasil diperbarui', 'data' => $action]);
    }

    public function destroy(MedicalAction $action): JsonResponse
    {
        $this->authorize('delete', $action);
        $this->service->destroy($action);
        return response()->json(['success' => true, 'message' => 'Tindakan berhasil dihapus']);
    }
}
