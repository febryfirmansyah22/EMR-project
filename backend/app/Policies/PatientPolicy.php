<?php

namespace App\Policies;

use App\Models\User;

class PatientPolicy
{
    /** Semua role aktif bisa melihat daftar & detail pasien */
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user): bool
    {
        return $user->is_active;
    }

    /** Buat pasien baru: admin_klinik atau super_admin */
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_klinik']);
    }

    /** Update data pasien: admin_klinik atau super_admin */
    public function update(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_klinik']);
    }

    /**
     * Pasien tidak di-hard delete — hanya di-deactivate.
     * Hanya super_admin yang bisa menonaktifkan pasien.
     */
    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
