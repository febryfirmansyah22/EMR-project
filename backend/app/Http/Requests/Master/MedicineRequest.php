<?php

namespace App\Http\Requests\Master;

use Illuminate\Foundation\Http\FormRequest;

class MedicineRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:150'],
            'generic_name' => ['nullable', 'string', 'max:150'],
            'unit'         => ['required', 'string', 'in:tablet,kapsul,botol,sachet,ampul,tube,strip,lainnya'],
            'category'     => ['nullable', 'string', 'max:100'],
            'price'        => ['required', 'numeric', 'min:0'],
            'stock'        => ['sometimes', 'integer', 'min:0'],
            'min_stock'    => ['sometimes', 'integer', 'min:0'],
            'expiry_date'  => ['nullable', 'date', 'after:today'],
            'is_active'    => ['sometimes', 'boolean'],
        ];
    }
}
