<?php

namespace App\Http\Controllers;

use App\Http\Requests\Observasi\StoreObservasiRequest;
use App\Http\Requests\Observasi\UpdateObservasiRequest;
use App\Models\ObservasiUmum;
use App\Services\ObservasiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ObservasiController extends Controller
{
    public function __construct(
        protected ObservasiService $observasiService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'start_date', 'end_date', 'payment_method',
            'search', 'month', 'year', 'page', 'per_page',
        ]);

        $data = $this->observasiService->getList($filters);

        return $this->paginated('Observasi list', $data);
    }

    public function store(StoreObservasiRequest $request): JsonResponse
    {
        $record = $this->observasiService->create($request->validated());

        return $this->success('Observasi created', $record->load('creator'), [], 201);
    }

    public function show(ObservasiUmum $observasi): JsonResponse
    {
        return $this->success('Observasi detail', $observasi->load('creator'));
    }

    public function update(UpdateObservasiRequest $request, ObservasiUmum $observasi): JsonResponse
    {
        $record = $this->observasiService->update($observasi, $request->validated());

        return $this->success('Observasi updated', $record->load('creator'));
    }

    public function destroy(ObservasiUmum $observasi): JsonResponse
    {
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'pemilik', 'admin'])) {
            return $this->error('Forbidden', 403);
        }

        $this->observasiService->delete($observasi);

        return $this->success('Observasi deleted');
    }

    public function summary(Request $request): JsonResponse
    {
        $period = $request->get('period', 'this_month');
        $data = $this->observasiService->getSummary($period);

        return $this->success('Observasi summary', $data);
    }

    public function export(Request $request): Response
    {
        $filters = $request->only(['start_date', 'end_date']);
        $rows = $this->observasiService->export($filters);

        $filename = 'observasi_umum_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            // BOM for Excel UTF-8
            fputs($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, [
                'No', 'No. Transaksi', 'Tanggal', 'Nama Pasien',
                'Harga', 'Metode Bayar', 'Running Total',
                'Total Setoran', 'Saldo', 'Catatan', 'Dibuat Oleh',
            ]);

            foreach ($rows as $i => $row) {
                fputcsv($handle, [
                    $i + 1,
                    $row['transaction_no'],
                    $row['transaction_date'],
                    $row['patient_name'],
                    $row['price'],
                    $row['payment_method'],
                    $row['running_total'],
                    $row['deposit_amount'],
                    $row['balance'],
                    $row['note'] ?? '',
                    $row['creator']['name'] ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
