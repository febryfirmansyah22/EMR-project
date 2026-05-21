<?php

namespace App\Policies;

use App\Models\User;

class MedicinePolicy
{
    private const WRITE_ROLES = ['super_admin', 'farmasi'];

    public function viewAny(User $user): bool { return $user->is_active; }
    public function view(User $user): bool    { return $user->is_active; }

    public function create(User $user): bool
    {
        return in_array($user->role, self::WRITE_ROLES);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, self::WRITE_ROLES);
    }

    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
