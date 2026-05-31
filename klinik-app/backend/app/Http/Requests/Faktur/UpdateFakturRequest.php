<?php

namespace App\Http\Requests\Faktur;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFakturRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['super_admin', 'pemilik', 'admin']);
    }

    public function rules(): array
    {
        return [
            'invoice_date' => ['sometimes', 'date'],
            'supplier_name' => ['sometimes', 'string', 'max:255'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}
