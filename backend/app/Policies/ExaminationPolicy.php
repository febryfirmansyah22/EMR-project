<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Examination;

class ExaminationPolicy
{
    // Semua role aktif bisa lihat hasil pemeriksaan
    public function viewAny(User $user): bool { return $user->is_active; }
    public function view(User $user): bool    { return $user->is_active; }

    // Hanya perawat dan super_admin yang bisa input/edit vital signs
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'perawat']);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'perawat']);
    }

    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
