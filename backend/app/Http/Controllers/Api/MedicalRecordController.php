<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MedicalRecordRequest;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Visit;
use App\Services\MedicalRecordService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function __construct(private readonly MedicalRecordService $service) {}

    // ── Per Kunjungan ─────────────────────────────────────────

    /**
     * GET /visits/{visit}/medical-record
     * SOAP dokter untuk kunjungan ini.
     */
    public function show(Visit $visit): JsonResponse
    {
        $this->authorize('view', MedicalRecord::class);

        $record = $visit->medicalRecord?->load([
            'doctor.user:id,name',
            'diagnoses:id,code,name',
            'actions:id,name,price,category',
        ]);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada rekam medis untuk kunjungan ini.',
            ], 404);
        }

        return response()->json(['success' => true, 'message' => 'OK', 'data' => $record]);
    }

    /**
     * POST /visits/{visit}/medical-record
     * Dokter menyimpan SOAP + diagnosis + tindakan.
     */
    public function store(MedicalRecordRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('create', MedicalRecord::class);

        if ($visit->medicalRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Rekam medis sudah ada. Gunakan PUT untuk memperbarui.',
            ], 409);
        }

        if (!in_array($visit->status, [
            Visit::STATUS_MENUNGGU_DOKTER,
            Visit::STATUS_SEDANG_DIPERIKSA,
        ])) {
            return response()->json([
                'success' => false,
                'message' => "Kunjungan berstatus '{$visit->status}', belum waktunya input rekam medis.",
            ], 422);
        }

        try {
            $record = $this->service->store($visit, $request->validated());
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        // Auto-advance: menunggu_dokter → sedang_diperiksa saat dokter mulai input
        if ($visit->status === Visit::STATUS_MENUNGGU_DOKTER) {
            $visit->update(['status' => Visit::STATUS_SEDANG_DIPERIKSA]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rekam medis berhasil disimpan.',
            'data'    => $record,
        ], 201);
    }

    /**
     * PUT /visits/{visit}/medical-record
     * Dokter memperbarui SOAP / diagnosis / tindakan.
     */
    public function update(MedicalRecordRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('update', MedicalRecord::class);

        $record = $visit->medicalRecord;

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Rekam medis belum ada. Gunakan POST untuk membuat.',
            ], 404);
        }

        try {
            $record = $this->service->update($record, $request->validated());
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rekam medis berhasil diperbarui.',
            'data'    => $record,
        ]);
    }

    // ── Riwayat per Pasien ────────────────────────────────────

    /**
     * GET /patients/{patient}/medical-records
     * Seluruh riwayat rekam medis seorang pasien.
     */
    public function patientHistory(Request $request, Patient $patient): JsonResponse
    {
        $this->authorize('view', MedicalRecord::class);

        $records = $this->service->patientHistory(
            $patient->id,
            $request->only(['per_page'])
        );

        return response()->json([
            'success' => true,
            'message' => "Riwayat rekam medis {$patient->name}",
            'data'    => $records->items(),
            'meta'    => [
                'patient'      => ['id' => $patient->id, 'name' => $patient->name,
                                   'medical_record_number' => $patient->medical_record_number],
                'current_page' => $records->currentPage(),
                'last_page'    => $records->lastPage(),
                'per_page'     => $records->perPage(),
                'total'        => $records->total(),
            ],
        ]);
    }
}
