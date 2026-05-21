<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MedicalRecordRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // SOAP — semua optional agar bisa disimpan bertahap
            'soap_subjective' => ['nullable', 'string', 'max:5000'],
            'soap_objective'  => ['nullable', 'string', 'max:5000'],
            'soap_assessment' => ['nullable', 'string', 'max:3000'],
            'soap_plan'       => ['nullable', 'string', 'max:3000'],
            'doctor_notes'    => ['nullable', 'string', 'max:2000'],

            // Diagnoses: [{ diagnosis_id: 1, type: 'primer' }, ...]
            'diagnoses'                  => ['nullable', 'array'],
            'diagnoses.*.diagnosis_id'   => ['required_with:diagnoses', 'integer', 'exists:diagnoses,id'],
            'diagnoses.*.type'           => ['sometimes', 'in:primer,sekunder'],

            // Tindakan: [{ medical_action_id: 1, quantity: 2, notes: '...' }, ...]
            'actions'                         => ['nullable', 'array'],
            'actions.*.medical_action_id'     => ['required_with:actions', 'integer', 'exists:medical_actions,id'],
            'actions.*.quantity'              => ['sometimes', 'integer', 'min:1', 'max:100'],
            'actions.*.notes'                 => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'diagnoses.*.diagnosis_id.exists'       => 'Diagnosis tidak ditemukan.',
            'actions.*.medical_action_id.exists'    => 'Tindakan medis tidak ditemukan.',
        ];
    }
}
