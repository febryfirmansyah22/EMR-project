<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Visit;

class VisitPolicy
{
    // Semua role aktif boleh lihat antrean/kunjungan
    public function viewAny(User $user): bool  { return $user->is_active; }
    public function view(User $user): bool     { return $user->is_active; }

    // Pendaftaran pasien: admin_klinik atau super_admin
    public function create(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_klinik']);
    }

    // Update data kunjungan (dokter, keluhan, catatan): admin_klinik atau super_admin
    public function update(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_klinik']);
    }

    // Batalkan kunjungan: admin_klinik atau super_admin
    public function delete(User $user): bool
    {
        return in_array($user->role, ['super_admin', 'admin_klinik']);
    }

    /**
     * Update status antrean — setiap role hanya boleh melakukan transisi
     * yang sesuai dengan tugasnya:
     *   admin_klinik : terdaftar → menunggu_pemeriksaan_awal / batal
     *   perawat      : menunggu_pemeriksaan_awal → menunggu_dokter
     *   dokter       : menunggu_dokter → sedang_diperiksa → menunggu_obat / menunggu_pembayaran
     *   farmasi      : menunggu_obat → menunggu_pembayaran
     *   kasir        : menunggu_pembayaran → selesai
     *   super_admin  : semua transisi
     */
    public function updateStatus(User $user, Visit $visit): bool
    {
        if ($user->role === 'super_admin') return true;

        return match ($user->role) {
            'admin_klinik' => in_array($visit->status, [
                Visit::STATUS_TERDAFTAR,
                Visit::STATUS_MENUNGGU_AWAL,
            ]),
            'perawat' => $visit->status === Visit::STATUS_MENUNGGU_AWAL,
            'dokter'  => in_array($visit->status, [
                Visit::STATUS_MENUNGGU_DOKTER,
                Visit::STATUS_SEDANG_DIPERIKSA,
            ]),
            'farmasi' => $visit->status === Visit::STATUS_MENUNGGU_OBAT,
            'kasir'   => $visit->status === Visit::STATUS_MENUNGGU_PEMBAYARAN,
            default   => false,
        };
    }
}
