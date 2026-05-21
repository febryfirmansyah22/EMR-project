<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreDoctorRequest;
use App\Http\Requests\Master\UpdateDoctorRequest;
use App\Models\Doctor;
use App\Services\DoctorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function __construct(private readonly DoctorService $service) {}

    public function index(Request $request): JsonResponse
    {
        $doctors = $this->service->index($request->only(['search', 'poli_id', 'is_active', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $doctors->items(),
            'meta'    => [
                'current_page' => $doctors->currentPage(),
                'last_page'    => $doctors->lastPage(),
                'per_page'     => $doctors->perPage(),
                'total'        => $doctors->total(),
            ],
        ]);
    }

    public function show(Doctor $doctor): JsonResponse
    {
        return response()->json(['success' => true, 'message' => 'OK', 'data' => $doctor->load('user', 'poli')]);
    }

    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $this->authorize('create', Doctor::class);
        $doctor = $this->service->store($request->validated());
        return response()->json(['success' => true, 'message' => 'Dokter berhasil ditambahkan', 'data' => $doctor], 201);
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor): JsonResponse
    {
        $this->authorize('update', $doctor);
        $doctor = $this->service->update($doctor, $request->validated());
        return response()->json(['success' => true, 'message' => 'Dokter berhasil diperbarui', 'data' => $doctor]);
    }

    public function destroy(Doctor $doctor): JsonResponse
    {
        $this->authorize('delete', $doctor);
        $this->service->destroy($doctor);
        return response()->json(['success' => true, 'message' => 'Dokter berhasil dinonaktifkan']);
    }
}
