<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:100'],
            'email'          => ['required', 'email', 'unique:users,email'],
            'password'       => ['required', 'string', 'min:8'],
            'poli_id'        => ['nullable', 'exists:polis,id'],
            'specialization' => ['required', 'string', 'max:100'],
            'str_number'     => ['nullable', 'string', 'unique:doctors,str_number'],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}
