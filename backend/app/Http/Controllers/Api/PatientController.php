<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PatientRequest;
use App\Models\Patient;
use App\Services\PatientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(private readonly PatientService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Patient::class);

        $patients = $this->service->index(
            $request->only(['search', 'gender', 'insurance_type', 'is_active', 'per_page'])
        );

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => $patients->items(),
            'meta'    => [
                'current_page' => $patients->currentPage(),
                'last_page'    => $patients->lastPage(),
                'per_page'     => $patients->perPage(),
                'total'        => $patients->total(),
            ],
        ]);
    }

    public function show(Patient $patient): JsonResponse
    {
        $this->authorize('view', $patient);

        // Tambahkan usia yang dihitung on-the-fly
        $data         = $patient->toArray();
        $data['age']  = $patient->age;

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $data]);
    }

    public function store(PatientRequest $request): JsonResponse
    {
        $this->authorize('create', Patient::class);

        $patient = $this->service->store($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pasien berhasil didaftarkan',
            'data'    => $patient,
        ], 201);
    }

    public function update(PatientRequest $request, Patient $patient): JsonResponse
    {
        $this->authorize('update', $patient);

        $patient = $this->service->update($patient, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil diperbarui',
            'data'    => $patient,
        ]);
    }

    /**
     * Deactivate pasien (bukan hard delete).
     * Data historis tetap terjaga.
     */
    public function destroy(Patient $patient): JsonResponse
    {
        $this->authorize('delete', $patient);

        $this->service->destroy($patient);

        return response()->json([
            'success' => true,
            'message' => 'Pasien berhasil dinonaktifkan',
        ]);
    }
}
