<?php

namespace App\Http\Requests\Cream;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['super_admin', 'pemilik', 'admin']);
    }

    public function rules(): array
    {
        return [
            'transaction_date' => ['sometimes', 'date'],
            'patient_name' => ['sometimes', 'string', 'max:255'],
            'product_name' => ['sometimes', 'string', 'max:255'],
            'selling_price' => ['sometimes', 'numeric', 'min:0'],
            'expense' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['sometimes', 'in:Cash,TF'],
            'note' => ['nullable', 'string'],
        ];
    }
}
