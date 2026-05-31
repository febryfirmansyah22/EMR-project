<?php

namespace App\Http\Requests\Cream;

use Illuminate\Foundation\Http\FormRequest;

class StoreCreamRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['super_admin', 'pemilik', 'admin']);
    }

    public function rules(): array
    {
        return [
            'transaction_date' => ['required', 'date'],
            'patient_name' => ['required', 'string', 'max:255'],
            'product_name' => ['required', 'string', 'max:255'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'expense' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:Cash,TF'],
            'note' => ['nullable', 'string'],
        ];
    }
}
