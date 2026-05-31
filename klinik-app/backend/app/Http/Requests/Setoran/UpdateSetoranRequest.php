<?php

namespace App\Http\Requests\Setoran;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSetoranRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['super_admin', 'pemilik', 'admin']);
    }

    public function rules(): array
    {
        return [
            'deposit_date' => ['sometimes', 'date'],
            'source' => ['sometimes', 'in:Observasi Umum,Penjualan Cream,Lainnya'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'method' => ['nullable', 'in:Cash,Transfer'],
            'note' => ['nullable', 'string'],
        ];
    }
}
