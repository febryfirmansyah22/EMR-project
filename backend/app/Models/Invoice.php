<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    protected $fillable = [
        'invoice_number',
        'visit_id',
        'patient_id',
        'status',
        'subtotal',
        'discount',
        'total_amount',
        'payment_method',
        'payment_amount',
        'payment_change',
        'paid_at',
        'paid_by',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal'        => 'decimal:2',
            'discount'        => 'decimal:2',
            'total_amount'    => 'decimal:2',
            'payment_amount'  => 'decimal:2',
            'payment_change'  => 'decimal:2',
            'paid_at'         => 'datetime',
        ];
    }

    // ── Konstanta status ─────────────────────────────────────

    const STATUS_MENUNGGU    = 'menunggu_pembayaran';
    const STATUS_LUNAS       = 'lunas';
    const STATUS_DIBATALKAN  = 'dibatalkan';

    // ── Relasi ───────────────────────────────────────────────

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_LUNAS;
    }

    public function isEditable(): bool
    {
        return $this->status === self::STATUS_MENUNGGU;
    }
}
