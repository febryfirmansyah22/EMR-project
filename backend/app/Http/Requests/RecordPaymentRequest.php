<?php

namespace App\Http\Requests;

use App\Models\Invoice;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'payment_method' => [
                'required',
                'string',
                Rule::in(['tunai', 'bpjs', 'asuransi_swasta', 'debit', 'kredit']),
            ],
            'payment_amount' => ['required', 'numeric', 'min:0'],
            'discount'       => ['sometimes', 'numeric', 'min:0'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_method.required' => 'Metode pembayaran wajib dipilih.',
            'payment_method.in'       => 'Metode pembayaran tidak valid.',
            'payment_amount.required' => 'Jumlah pembayaran wajib diisi.',
            'payment_amount.min'      => 'Jumlah pembayaran tidak boleh negatif.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $invoice = $this->route('invoice');
            if (!$invoice instanceof Invoice) return;

            $discount    = (float) ($this->input('discount', 0));
            $totalAmount = (float) $invoice->subtotal - $discount;
            $payAmount   = (float) $this->input('payment_amount', 0);

            // Untuk tunai/debit/kredit, pembayaran tidak boleh kurang dari total
            $method = $this->input('payment_method');
            if (in_array($method, ['tunai', 'debit', 'kredit']) && $payAmount < $totalAmount) {
                $v->errors()->add('payment_amount',
                    "Jumlah pembayaran (Rp " . number_format($payAmount, 0, ',', '.') . ") "
                    . "kurang dari total tagihan (Rp " . number_format($totalAmount, 0, ',', '.') . ")."
                );
            }

            // Diskon tidak boleh melebihi subtotal
            if ($discount > (float) $invoice->subtotal) {
                $v->errors()->add('discount',
                    "Diskon tidak boleh melebihi subtotal (Rp " . number_format($invoice->subtotal, 0, ',', '.') . ")."
                );
            }
        });
    }
}
