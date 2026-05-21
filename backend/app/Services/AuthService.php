<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function __construct(
        private readonly AuditLogService $auditLog
    ) {}

    public function login(string $email, string $password): array
    {
        $credentials = ['email' => $email, 'password' => $password];

        if (! $token = JWTAuth::attempt($credentials)) {
            return ['success' => false, 'message' => 'Email atau password salah'];
        }

        $user = auth()->user();

        if (! $user->is_active) {
            auth()->logout();
            return ['success' => false, 'message' => 'Akun tidak aktif'];
        }

        $this->auditLog->log('login', 'users', $user->id);

        return [
            'success' => true,
            'token'   => $token,
            'user'    => $user,
        ];
    }

    public function logout(): void
    {
        $userId = auth()->id();
        $this->auditLog->log('logout', 'users', $userId);
        JWTAuth::invalidate(JWTAuth::getToken());
    }

    public function refresh(): string
    {
        return JWTAuth::refresh(JWTAuth::getToken());
    }
}
