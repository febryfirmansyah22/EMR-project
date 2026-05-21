<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    // Semua role aktif bisa lihat invoice
    public function viewAny(User $user): bool
    {
        return $user->is_active && in_array($user->role, [
            'super_admin', 'admin_klinik', 'dokter', 'perawat', 'farmasi', 'kasir', 'owner',
        ]);
    }

    public function view(User $user): bool
    {
        return $this->viewAny($user);
    }

    // Hanya kasir & super_admin yang bisa proses pembayaran
    public function pay(User $user, Invoice $invoice): bool
    {
        if (!$invoice->isEditable()) return false;

        return $user->is_active && in_array($user->role, ['super_admin', 'kasir']);
    }

    // Hanya super_admin yang bisa batalkan invoice
    public function cancel(User $user, Invoice $invoice): bool
    {
        return $user->role === 'super_admin' && $invoice->isEditable();
    }
}
