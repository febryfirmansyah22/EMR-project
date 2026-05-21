<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExaminationRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('PUT') || $this->isMethod('PATCH');

        return [
            'weight'                    => ['nullable', 'numeric', 'min:1', 'max:300'],
            'height'                    => ['nullable', 'numeric', 'min:30', 'max:250'],
            'blood_pressure_systolic'   => ['nullable', 'integer', 'min:60', 'max:300'],
            'blood_pressure_diastolic'  => ['nullable', 'integer', 'min:40', 'max:200'],
            'pulse'                     => ['nullable', 'integer', 'min:20', 'max:300'],
            'temperature'               => ['nullable', 'numeric', 'min:30', 'max:45'],
            'respiratory_rate'          => ['nullable', 'integer', 'min:5', 'max:60'],
            'oxygen_saturation'         => ['nullable', 'numeric', 'min:50', 'max:100'],
            'blood_sugar'               => ['nullable', 'numeric', 'min:20', 'max:600'],
            'notes'                     => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'temperature.min'            => 'Suhu tubuh minimal 30°C.',
            'temperature.max'            => 'Suhu tubuh maksimal 45°C.',
            'oxygen_saturation.min'      => 'Saturasi oksigen minimal 50%.',
            'blood_pressure_systolic.min'=> 'Tekanan darah sistolik minimal 60 mmHg.',
        ];
    }
}
