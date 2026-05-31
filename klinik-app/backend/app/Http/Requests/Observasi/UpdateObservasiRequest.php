<?php

namespace App\Http\Requests\Observasi;

use Illuminate\Foundation\Http\FormRequest;

class UpdateObservasiRequest extends FormRequest
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
            'price' => ['sometimes', 'numeric', 'min:0'],
            'payment_method' => ['sometimes', 'in:Cash,QRIS/TF'],
            'note' => ['nullable', 'string'],
        ];
    }
}
