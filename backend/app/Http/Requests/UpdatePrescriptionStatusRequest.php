<?php

namespace App\Http\Requests;

use App\Models\Prescription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePrescriptionStatusRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in([
                    Prescription::STATUS_DIPROSES,
                    Prescription::STATUS_SELESAI,
                    Prescription::STATUS_DIBATALKAN,
                ]),
            ],
            'pharmacist_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status baru wajib diisi.',
            'status.in'       => 'Status tidak valid. Pilih: diproses, selesai, atau dibatalkan.',
        ];
    }
}
