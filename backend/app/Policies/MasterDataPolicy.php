<?php

namespace App\Policies;

use App\Models\User;

/**
 * Policy tunggal untuk semua master data.
 * Daftarkan per-model di AuthServiceProvider (atau via Gate::policy).
 */
class MasterDataPolicy
{
    private const ADMIN_ROLES = ['super_admin', 'admin_klinik'];

    public function viewAny(User $user): bool
    {
        return $user->is_active;  // semua role terautentikasi bisa index/show
    }

    public function view(User $user): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, self::ADMIN_ROLES);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, self::ADMIN_ROLES);
    }

    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
