<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PatientRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            // Wajib saat create, opsional saat update
            'name'       => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:150'],
            'nik'        => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'digits:16',
            ],
            'birth_date' => [$isUpdate ? 'sometimes' : 'required', 'date', 'before:today'],
            'birth_place'=> ['nullable', 'string', 'max:100'],
            'gender'     => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in(['laki-laki', 'perempuan']),
            ],
            'blood_type' => ['nullable', Rule::in(['A', 'B', 'AB', 'O'])],

            // Kontak
            'address'    => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:500'],
            'phone'      => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:20'],
            'email'      => ['nullable', 'email', 'max:150'],

            // Data sosial
            'religion'       => ['nullable', 'string', 'max:30'],
            'marital_status' => ['nullable', Rule::in(['belum_menikah', 'menikah', 'cerai_hidup', 'cerai_mati'])],
            'occupation'     => ['nullable', 'string', 'max:100'],
            'education'      => ['nullable', 'string', 'max:50'],

            // Kontak darurat
            'emergency_contact'              => ['nullable', 'array'],
            'emergency_contact.name'         => ['required_with:emergency_contact', 'string', 'max:100'],
            'emergency_contact.relationship' => ['required_with:emergency_contact', 'string', 'max:50'],
            'emergency_contact.phone'        => ['required_with:emergency_contact', 'string', 'max:20'],

            // Asuransi
            'insurance_type'   => ['sometimes', Rule::in(['umum', 'bpjs', 'asuransi_swasta'])],
            'insurance_number' => ['nullable', 'string', 'max:50'],

            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'nik.digits'          => 'NIK harus terdiri dari 16 digit angka.',
            'birth_date.before'   => 'Tanggal lahir harus sebelum hari ini.',
            'gender.in'           => 'Jenis kelamin tidak valid.',
            'blood_type.in'       => 'Golongan darah tidak valid (A, B, AB, O).',
            'insurance_type.in'   => 'Jenis asuransi tidak valid.',
        ];
    }
}
