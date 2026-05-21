<?php

namespace App\Http\Requests;

use App\Models\Prescription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePrescriptionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'notes'                   => ['sometimes', 'nullable', 'string', 'max:1000'],
            'items'                   => ['sometimes', 'array', 'min:1'],
            'items.*.medicine_id'     => ['required_with:items', 'integer', 'exists:medicines,id'],
            'items.*.quantity'        => ['required_with:items', 'integer', 'min:1', 'max:9999'],
            'items.*.dosage'          => ['required_with:items', 'string', 'max:100'],
            'items.*.instructions'    => ['nullable', 'string', 'max:500'],
            'items.*.notes'           => ['nullable', 'string', 'max:500'],
        ];
    }
}
