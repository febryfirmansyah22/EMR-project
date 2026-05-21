<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $doctorId = $this->route('doctor')?->id;

        return [
            'name'           => ['sometimes', 'string', 'max:100'],
            'email'          => ['sometimes', 'email', "unique:users,email,{$this->route('doctor')?->user_id}"],
            'poli_id'        => ['nullable', 'exists:polis,id'],
            'specialization' => ['sometimes', 'string', 'max:100'],
            'str_number'     => ['nullable', 'string', "unique:doctors,str_number,{$doctorId}"],
            'is_active'      => ['sometimes', 'boolean'],
        ];
    }
}
