<?php

namespace App\Http\Controllers;

use App\Http\Requests\Setoran\StoreSetoranRequest;
use App\Http\Requests\Setoran\UpdateSetoranRequest;
use App\Models\Setoran;
use App\Services\SetoranService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SetoranController extends Controller
{
    public function __construct(
        protected SetoranService $setoranService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['start_date', 'end_date', 'source', 'page', 'per_page']);
        $data = $this->setoranService->getList($filters);

        return $this->paginated('Setoran list', $data);
    }

    public function store(StoreSetoranRequest $request): JsonResponse
    {
        $record = $this->setoranService->create($request->validated());

        return $this->success('Setoran created', $record->load('creator'), [], 201);
    }

    public function show(Setoran $setoran): JsonResponse
    {
        return $this->success('Setoran detail', $setoran->load('creator'));
    }

    public function update(UpdateSetoranRequest $request, Setoran $setoran): JsonResponse
    {
        $record = $this->setoranService->update($setoran, $request->validated());

        return $this->success('Setoran updated', $record->load('creator'));
    }

    public function destroy(Setoran $setoran): JsonResponse
    {
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'pemilik', 'admin'])) {
            return $this->error('Forbidden', 403);
        }

        $this->setoranService->delete($setoran);

        return $this->success('Setoran deleted');
    }
}
