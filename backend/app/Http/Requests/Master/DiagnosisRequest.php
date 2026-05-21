<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DiagnosisRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $id = $this->route('diagnosis')?->id;

        return [
            'code'      => ['required', 'string', 'max:10',
                            Rule::unique('diagnoses', 'code')->ignore($id)],
            'name'      => ['required', 'string', 'max:255'],
            'category'  => ['nullable', 'string', 'max:20'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
