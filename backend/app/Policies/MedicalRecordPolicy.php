<?php

namespace App\Policies;

use App\Models\MedicalRecord;
use App\Models\User;

class MedicalRecordPolicy
{
    // Dokter, perawat, super_admin, admin_klinik bisa lihat rekam medis
    public function viewAny(User $user): bool
    {
        return $user->is_active && in_array($user->role, [
            'super_admin', 'admin_klinik', 'perawat', 'dokter',
        ]);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    // Hanya dokter dan super_admin yang bisa tulis SOAP
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'dokter']);
    }

    public function update(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'dokter']);
    }

    // Rekam medis tidak boleh dihapus — hanya super_admin dalam keadaan darurat
    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
