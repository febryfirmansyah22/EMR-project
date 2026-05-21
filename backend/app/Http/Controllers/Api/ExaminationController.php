<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExaminationRequest;
use App\Models\Examination;
use App\Models\Visit;
use App\Services\ExaminationService;
use Illuminate\Http\JsonResponse;

class ExaminationController extends Controller
{
    public function __construct(private readonly ExaminationService $service) {}

    /**
     * GET /visits/{visit}/examination
     * Tampilkan hasil pemeriksaan awal untuk kunjungan ini.
     */
    public function show(Visit $visit): JsonResponse
    {
        $this->authorize('view', Examination::class);

        $exam = $visit->examination?->load('nurse:id,name');

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada pemeriksaan awal untuk kunjungan ini.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'OK',
            'data'    => array_merge($exam->toArray(), [
                'bmi'          => $exam->bmi,
                'bmi_category' => $exam->bmi_category,
                'blood_pressure' => $exam->blood_pressure,
            ]),
        ]);
    }

    /**
     * POST /visits/{visit}/examination
     * Input hasil pemeriksaan awal (vital signs) oleh perawat.
     */
    public function store(ExaminationRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('create', Examination::class);

        if ($visit->examination) {
            return response()->json([
                'success' => false,
                'message' => 'Pemeriksaan awal untuk kunjungan ini sudah ada. Gunakan PUT untuk memperbarui.',
            ], 409);
        }

        if (!in_array($visit->status, [
            Visit::STATUS_MENUNGGU_AWAL,
            Visit::STATUS_MENUNGGU_DOKTER,  // izinkan input meski status sudah lanjut
        ])) {
            return response()->json([
                'success' => false,
                'message' => "Kunjungan berstatus '{$visit->status}', tidak dapat input pemeriksaan awal.",
            ], 422);
        }

        $exam = $this->service->store($visit, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pemeriksaan awal berhasil disimpan.',
            'data'    => array_merge($exam->toArray(), [
                'bmi'            => $exam->bmi,
                'bmi_category'   => $exam->bmi_category,
                'blood_pressure' => $exam->blood_pressure,
            ]),
        ], 201);
    }

    /**
     * PUT /visits/{visit}/examination
     * Update hasil pemeriksaan awal.
     */
    public function update(ExaminationRequest $request, Visit $visit): JsonResponse
    {
        $this->authorize('update', Examination::class);

        $exam = $visit->examination;

        if (!$exam) {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada pemeriksaan awal. Gunakan POST untuk membuat.',
            ], 404);
        }

        $exam = $this->service->update($exam, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pemeriksaan awal berhasil diperbarui.',
            'data'    => array_merge($exam->toArray(), [
                'bmi'            => $exam->bmi,
                'bmi_category'   => $exam->bmi_category,
                'blood_pressure' => $exam->blood_pressure,
            ]),
        ]);
    }
}
