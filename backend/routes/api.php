<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Api\Master\ActionController;
use App\Http\Controllers\Api\Master\DiagnosisController;
use App\Http\Controllers\Api\Master\DoctorController;
use App\Http\Controllers\Api\Master\MedicineController;
use App\Http\Controllers\Api\Master\PoliController;
use App\Http\Controllers\Api\ExaminationController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\VisitController;
use Illuminate\Support\Facades\Route;

// ============================================================
// Public — hanya login yang tidak butuh auth
// ============================================================
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// ============================================================
// Protected — semua route di bawah ini wajib JWT + audit log
// ============================================================
Route::middleware(['auth.jwt', 'audit.log'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/me',       [AuthController::class, 'me']);
    });

    // ============================================================
    // Fase 3 — Master Data
    // ============================================================
    Route::prefix('master')->group(function () {
        Route::apiResource('polis',      PoliController::class);
        Route::apiResource('doctors',    DoctorController::class);
        Route::apiResource('diagnoses',  DiagnosisController::class);
        Route::apiResource('actions',    ActionController::class);
        Route::apiResource('medicines',  MedicineController::class);
    });

    // ============================================================
    // Fase 4 — Modul Pasien
    // ============================================================
    Route::apiResource('patients', PatientController::class);

    // Riwayat rekam medis per pasien
    Route::get('patients/{patient}/medical-records',
        [MedicalRecordController::class, 'patientHistory']);

    // ============================================================
    // Fase 5 — Pendaftaran & Antrean
    // ============================================================
    Route::get('visits/queue-today', [VisitController::class, 'queueToday']);
    Route::apiResource('visits', VisitController::class);
    Route::patch('visits/{visit}/status', [VisitController::class, 'updateStatus']);

    // ============================================================
    // Fase 6 — Pemeriksaan
    // ============================================================

    // Pemeriksaan awal perawat (vital signs) — nested dalam visit
    Route::prefix('visits/{visit}')->group(function () {
        Route::get('examination',  [ExaminationController::class, 'show']);
        Route::post('examination', [ExaminationController::class, 'store']);
        Route::put('examination',  [ExaminationController::class, 'update']);

        // SOAP dokter
        Route::get('medical-record',  [MedicalRecordController::class, 'show']);
        Route::post('medical-record', [MedicalRecordController::class, 'store']);
        Route::put('medical-record',  [MedicalRecordController::class, 'update']);

        // Resep (nested dalam visit)
        Route::get('prescription',  [PrescriptionController::class, 'showByVisit']);
        Route::post('prescription', [PrescriptionController::class, 'store']);

        // Invoice (nested dalam visit)
        Route::get('invoice', [InvoiceController::class, 'showByVisit']);
    });

    // ============================================================
    // Fase 7 — Resep & Farmasi
    // ============================================================

    // Antrian farmasi — list semua resep dengan filter status
    Route::get('prescriptions', [PrescriptionController::class, 'index']);
    Route::get('prescriptions/{prescription}', [PrescriptionController::class, 'show']);
    Route::put('prescriptions/{prescription}', [PrescriptionController::class, 'update']);
    Route::patch('prescriptions/{prescription}/status', [PrescriptionController::class, 'updateStatus']);
    Route::delete('prescriptions/{prescription}', [PrescriptionController::class, 'destroy']);

    // Riwayat stok per obat
    Route::get('master/medicines/{medicine}/stock-history',
        [PrescriptionController::class, 'stockHistory']);

    // ============================================================
    // Fase 8 — Kasir & Pembayaran
    // ============================================================
    Route::get('invoices',                         [InvoiceController::class, 'index']);
    Route::get('invoices/{invoice}',               [InvoiceController::class, 'show']);
    Route::post('invoices/{invoice}/pay',          [InvoiceController::class, 'pay']);
    Route::post('invoices/{invoice}/cancel',       [InvoiceController::class, 'cancel']);

    // ============================================================
    // Fase 9 — Laporan & Dashboard
    // ============================================================
    Route::prefix('reports')->group(function () {
        Route::get('dashboard',       [ReportController::class, 'dashboard']);
        Route::get('visits/export',   [ReportController::class, 'exportVisits']);   // sebelum visits
        Route::get('visits',          [ReportController::class, 'visits']);
        Route::get('revenue/export',  [ReportController::class, 'exportRevenue']);  // sebelum revenue
        Route::get('revenue',         [ReportController::class, 'revenue']);
        Route::get('medicines',       [ReportController::class, 'medicines']);
    });
});
