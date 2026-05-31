<?php

namespace App\Http\Controllers;

use App\Http\Requests\Cream\StoreCreamRequest;
use App\Http\Requests\Cream\UpdateCreamRequest;
use App\Models\PenjualanCream;
use App\Services\CreamService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CreamController extends Controller
{
    public function __construct(
        protected CreamService $creamService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'start_date', 'end_date', 'payment_method',
            'search', 'month', 'year', 'page', 'per_page',
        ]);

        $data = $this->creamService->getList($filters);

        return $this->paginated('Penjualan cream list', $data);
    }

    public function store(StoreCreamRequest $request): JsonResponse
    {
        $record = $this->creamService->create($request->validated());

        return $this->success('Penjualan cream created', $record->load('creator'), [], 201);
    }

    public function show(PenjualanCream $cream): JsonResponse
    {
        return $this->success('Penjualan cream detail', $cream->load('creator'));
    }

    public function update(UpdateCreamRequest $request, PenjualanCream $cream): JsonResponse
    {
        $record = $this->creamService->update($cream, $request->validated());

        return $this->success('Penjualan cream updated', $record->load('creator'));
    }

    public function destroy(PenjualanCream $cream): JsonResponse
    {
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'pemilik', 'admin'])) {
            return $this->error('Forbidden', 403);
        }

        $this->creamService->delete($cream);

        return $this->success('Penjualan cream deleted');
    }

    public function summary(Request $request): JsonResponse
    {
        $period = $request->get('period', 'this_month');
        $data = $this->creamService->getSummary($period);

        return $this->success('Penjualan cream summary', $data);
    }

    public function export(Request $request): Response
    {
        $filters = $request->only(['start_date', 'end_date']);
        $rows = $this->creamService->export($filters);

        $filename = 'penjualan_cream_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'No', 'No. Transaksi', 'Tanggal', 'Nama Pasien', 'Nama Produk',
                'Harga Jual', 'Pengeluaran', 'Metode Bayar',
                'Saldo', 'Saldo Cash', 'Saldo Transfer', 'Catatan', 'Dibuat Oleh',
            ]);

            foreach ($rows as $i => $row) {
                fputcsv($handle, [
                    $i + 1,
                    $row['transaction_no'],
                    $row['transaction_date'],
                    $row['patient_name'],
                    $row['product_name'],
                    $row['selling_price'],
                    $row['expense'],
                    $row['payment_method'],
                    $row['balance'],
                    $row['cash_balance'],
                    $row['transfer_balance'],
                    $row['note'] ?? '',
                    $row['creator']['name'] ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
