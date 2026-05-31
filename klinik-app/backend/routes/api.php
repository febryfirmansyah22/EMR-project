<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ObservasiController;
use App\Http\Controllers\CreamController;
use App\Http\Controllers\FakturController;
use App\Http\Controllers\SetoranController;
use App\Http\Controllers\RekapController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ActivityLogController;
use Illuminate\Support\Facades\Route;

// Health check (untuk Railway)
Route::get('/api/v1/health', fn() => response()->json(['status' => 'ok']));

// Auth routes (public)
Route::prefix('api/v1/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth.jwt');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth.jwt');
    Route::post('/refresh', [AuthController::class, 'refresh'])->middleware('auth.jwt');
});

// Protected routes
Route::prefix('api/v1')->middleware(['auth.jwt'])->group(function () {

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Observasi Umum
    Route::get('/observasi/summary', [ObservasiController::class, 'summary']);
    Route::get('/observasi/export', [ObservasiController::class, 'export']);
    Route::apiResource('/observasi', ObservasiController::class)->parameters(['observasi' => 'observasi']);

    // Penjualan Cream
    Route::get('/cream/summary', [CreamController::class, 'summary']);
    Route::get('/cream/export', [CreamController::class, 'export']);
    Route::apiResource('/cream', CreamController::class)->parameters(['cream' => 'cream']);

    // Faktur Obat
    Route::get('/faktur/summary', [FakturController::class, 'summary']);
    Route::get('/faktur/export', [FakturController::class, 'export']);
    Route::apiResource('/faktur', FakturController::class)->parameters(['faktur' => 'faktur']);

    // Setoran
    Route::apiResource('/setoran', SetoranController::class);

    // Rekap
    Route::get('/rekap/mingguan', [RekapController::class, 'mingguan']);
    Route::get('/rekap/bulanan', [RekapController::class, 'bulanan']);

    // Users (super_admin only)
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('/users', UserController::class)->except(['show']);
    });

    // Activity Logs (super_admin, pemilik)
    Route::middleware('role:super_admin,pemilik')->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index']);
    });
});
