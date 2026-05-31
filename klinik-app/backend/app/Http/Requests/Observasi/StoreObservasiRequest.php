<?php

namespace App\Http\Requests\Observasi;

use Illuminate\Foundation\Http\FormRequest;

class StoreObservasiRequest extends FormRequest
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
            'price' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:Cash,QRIS/TF'],
            'note' => ['nullable', 'string'],
        ];
    }
}
