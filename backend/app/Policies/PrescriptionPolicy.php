<?php

namespace App\Policies;

use App\Models\Prescription;
use App\Models\User;

class PrescriptionPolicy
{
    // Semua role medis aktif bisa lihat resep
    public function viewAny(User $user): bool
    {
        return $user->is_active && in_array($user->role, [
            'super_admin', 'admin_klinik', 'dokter', 'perawat', 'farmasi', 'kasir',
        ]);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    // Hanya dokter (dan super_admin) yang bisa buat/edit resep
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'dokter']);
    }

    public function update(User $user, Prescription $prescription): bool
    {
        // Hanya bisa diedit saat status masih 'menunggu'
        return in_array($user->role, ['super_admin', 'dokter'])
            && $prescription->isEditable();
    }

    // Update status resep: farmasi (diproses/selesai) + dokter/admin (batal)
    public function updateStatus(User $user, Prescription $prescription): bool
    {
        if ($user->role === 'super_admin') return true;

        return match ($user->role) {
            'farmasi' => in_array($prescription->status, [
                Prescription::STATUS_MENUNGGU,
                Prescription::STATUS_DIPROSES,
            ]),
            'dokter', 'admin_klinik' => $prescription->status === Prescription::STATUS_MENUNGGU,
            default => false,
        };
    }

    public function delete(User $user): bool
    {
        return $user->role === 'super_admin';
    }
}
