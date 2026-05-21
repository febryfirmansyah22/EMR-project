<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RecordPaymentRequest;
use App\Models\Invoice;
use App\Models\Visit;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $service) {}

    // ── GET /invoices — antrian kasir ─────────────────────────

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Invoice::class);

        $paginated = $this->service->index($request->only(['status', 'date', 'search', 'per_page']));

        return response()->json([
            'success' => true,
            'message' => 'Daftar invoice berhasil diambil.',
            'data'    => $paginated->items(),
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    // ── GET /invoices/{invoice} ───────────────────────────────

    public function show(Invoice $invoice): JsonResponse
    {
        $this->authorize('view', $invoice);

        $invoice->load([
            'visit:id,visit_number,visit_date,status',
            'patient:id,name,medical_record_number,insurance_type,insurance_number',
            'paidBy:id,name',
            'items',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail invoice berhasil diambil.',
            'data'    => $invoice,
        ]);
    }

    // ── GET /visits/{visit}/invoice — auto-create jika belum ada ─

    public function showByVisit(Visit $visit): JsonResponse
    {
        $this->authorize('view', Invoice::class);

        // Auto-create jika visit sudah menunggu_pembayaran / lunas tapi belum ada invoice
        if (!$visit->invoice()->exists()) {
            if (!in_array($visit->status, [
                Visit::STATUS_MENUNGGU_PEMBAYARAN,
                Visit::STATUS_SELESAI,
            ])) {
                return response()->json([
                    'success' => false,
                    'message' => "Invoice belum tersedia. Kunjungan masih berstatus '{$visit->status}'.",
                ], 404);
            }

            $invoice = $this->service->createForVisit($visit);
        } else {
            $invoice = $visit->invoice()->with([
                'visit:id,visit_number,visit_date,status',
                'patient:id,name,medical_record_number,insurance_type,insurance_number',
                'paidBy:id,name',
                'items',
            ])->first();
        }

        return response()->json([
            'success' => true,
            'message' => 'Invoice berhasil diambil.',
            'data'    => $invoice,
        ]);
    }

    // ── POST /invoices/{invoice}/pay ──────────────────────────

    public function pay(RecordPaymentRequest $request, Invoice $invoice): JsonResponse
    {
        $this->authorize('pay', $invoice);

        if ($invoice->isPaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice ini sudah lunas.',
            ], 422);
        }

        $invoice = $this->service->recordPayment($invoice, $request->validated());

        return response()->json([
            'success' => true,
            'message' => "Pembayaran {$invoice->invoice_number} berhasil dicatat. "
                . "Kembalian: Rp " . number_format($invoice->payment_change, 0, ',', '.'),
            'data'    => $invoice,
        ]);
    }

    // ── POST /invoices/{invoice}/cancel ──────────────────────

    public function cancel(Invoice $invoice): JsonResponse
    {
        $this->authorize('cancel', $invoice);

        $invoice = $this->service->cancel($invoice);

        return response()->json([
            'success' => true,
            'message' => 'Invoice berhasil dibatalkan.',
            'data'    => $invoice,
        ]);
    }
}
