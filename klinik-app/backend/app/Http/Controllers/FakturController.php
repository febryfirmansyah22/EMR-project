<?php

namespace App\Http\Controllers;

use App\Http\Requests\Faktur\StoreFakturRequest;
use App\Http\Requests\Faktur\UpdateFakturRequest;
use App\Models\FakturObat;
use App\Services\FakturService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FakturController extends Controller
{
    public function __construct(
        protected FakturService $fakturService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'start_date', 'end_date', 'supplier',
            'search', 'month', 'year', 'page', 'per_page',
        ]);

        $data = $this->fakturService->getList($filters);

        return $this->paginated('Faktur obat list', $data);
    }

    public function store(StoreFakturRequest $request): JsonResponse
    {
        $record = $this->fakturService->create($request->validated());

        return $this->success('Faktur created', $record->load('creator'), [], 201);
    }

    public function show(FakturObat $faktur): JsonResponse
    {
        return $this->success('Faktur detail', $faktur->load('creator'));
    }

    public function update(UpdateFakturRequest $request, FakturObat $faktur): JsonResponse
    {
        $record = $this->fakturService->update($faktur, $request->validated());

        return $this->success('Faktur updated', $record->load('creator'));
    }

    public function destroy(FakturObat $faktur): JsonResponse
    {
        $user = auth()->user();
        if (!in_array($user->role, ['super_admin', 'pemilik', 'admin'])) {
            return $this->error('Forbidden', 403);
        }

        $this->fakturService->delete($faktur);

        return $this->success('Faktur deleted');
    }

    public function summary(Request $request): JsonResponse
    {
        $period = $request->get('period', 'this_month');
        $data = $this->fakturService->getSummary($period);

        return $this->success('Faktur summary', $data);
    }

    public function export(Request $request): Response
    {
        $filters = $request->only(['start_date', 'end_date']);
        $rows = $this->fakturService->export($filters);

        $filename = 'faktur_obat_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'No', 'No. Invoice', 'Tanggal', 'Supplier',
                'Harga', 'Keterangan', 'Dibuat Oleh',
            ]);

            foreach ($rows as $i => $row) {
                fputcsv($handle, [
                    $i + 1,
                    $row['invoice_no'],
                    $row['invoice_date'],
                    $row['supplier_name'],
                    $row['price'],
                    $row['description'] ?? '',
                    $row['creator']['name'] ?? '',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
