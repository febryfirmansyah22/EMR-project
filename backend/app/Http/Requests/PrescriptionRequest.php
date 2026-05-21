<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PrescriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'notes'                   => ['nullable', 'string', 'max:1000'],
            'items'                   => ['required', 'array', 'min:1'],
            'items.*.medicine_id'     => ['required', 'integer', 'exists:medicines,id'],
            'items.*.quantity'        => ['required', 'integer', 'min:1', 'max:9999'],
            'items.*.dosage'          => ['required', 'string', 'max:100'],
            'items.*.instructions'    => ['nullable', 'string', 'max:500'],
            'items.*.notes'           => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required'                => 'Resep harus memiliki minimal 1 item obat.',
            'items.*.medicine_id.required'  => 'Setiap item harus menyertakan obat.',
            'items.*.medicine_id.exists'    => 'Obat tidak ditemukan di database.',
            'items.*.quantity.required'     => 'Jumlah obat wajib diisi.',
            'items.*.quantity.min'          => 'Jumlah obat minimal 1.',
            'items.*.dosage.required'       => 'Dosis obat wajib diisi (contoh: 3x1).',
        ];
    }
}
