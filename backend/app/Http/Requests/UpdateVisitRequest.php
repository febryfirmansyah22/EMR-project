<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVisitRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'doctor_id' => ['sometimes', 'nullable', 'integer', 'exists:doctors,id'],
            'complaint' => ['sometimes', 'string', 'max:1000'],
            'notes'     => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
