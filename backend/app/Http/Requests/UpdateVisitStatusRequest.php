<?php

namespace App\Http\Requests;

use App\Models\Visit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVisitStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    Visit::STATUS_MENUNGGU_AWAL,
                    Visit::STATUS_MENUNGGU_DOKTER,
                    Visit::STATUS_SEDANG_DIPERIKSA,
                    Visit::STATUS_MENUNGGU_OBAT,
                    Visit::STATUS_MENUNGGU_PEMBAYARAN,
                    Visit::STATUS_SELESAI,
                    Visit::STATUS_BATAL,
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status tidak valid.',
        ];
    }
}
