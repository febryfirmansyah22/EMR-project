<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVisitRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'poli_id'    => ['required', 'integer', 'exists:polis,id'],
            'doctor_id'  => ['nullable', 'integer', 'exists:doctors,id'],
            'visit_date' => ['nullable', 'date'],     // default = hari ini
            'complaint'  => ['nullable', 'string', 'max:1000'],
            'notes'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.exists' => 'Pasien tidak ditemukan.',
            'poli_id.exists'    => 'Poli tidak ditemukan.',
            'doctor_id.exists'  => 'Dokter tidak ditemukan.',
        ];
    }
}
