<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'super_admin';
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'username' => ['required', 'string', 'max:50', 'unique:users,username', 'alpha_dash'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:super_admin,pemilik,admin,viewer'],
            'status' => ['sometimes', 'in:active,inactive'],
        ];
    }
}
