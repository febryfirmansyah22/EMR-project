<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prescription extends Model
{
    protected $fillable = [
        'prescription_number',
        'visit_id',
        'doctor_id',
        'status',
        'dispensed_by',
        'dispensed_at',
        'notes',
        'pharmacist_notes',
    ];

    protected function casts(): array
    {
        return [
            'dispensed_at' => 'datetime',
        ];
    }

    // ── Konstanta status (sinkron dengan frontend constants.ts) ─

    const STATUS_MENUNGGU   = 'menunggu';
    const STATUS_DIPROSES   = 'diproses';
    const STATUS_SELESAI    = 'selesai';
    const STATUS_DIBATALKAN = 'dibatalkan';

    const STATUS_TRANSITIONS = [
        'menunggu'   => ['diproses', 'dibatalkan'],
        'diproses'   => ['selesai',  'dibatalkan'],
        'selesai'    => [],
        'dibatalkan' => [],
    ];

    // ── Relasi ───────────────────────────────────────────────

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function dispensedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispensed_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PrescriptionItem::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function canTransitionTo(string $newStatus): bool
    {
        return in_array($newStatus, self::STATUS_TRANSITIONS[$this->status] ?? []);
    }

    public function isEditable(): bool
    {
        return $this->status === self::STATUS_MENUNGGU;
    }

    /** Total nilai resep (sum subtotal item) */
    public function getTotalAttribute(): float
    {
        return $this->items->sum('subtotal');
    }
}
