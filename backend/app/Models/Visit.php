<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visit extends Model
{
    protected $fillable = [
        'visit_number',
        'queue_number',
        'patient_id',
        'poli_id',
        'doctor_id',
        'registered_by',
        'visit_date',
        'complaint',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
        ];
    }

    // ── Konstanta status ─────────────────────────────────────

    const STATUS_TERDAFTAR              = 'terdaftar';
    const STATUS_MENUNGGU_AWAL          = 'menunggu_pemeriksaan_awal';
    const STATUS_MENUNGGU_DOKTER        = 'menunggu_dokter';
    const STATUS_SEDANG_DIPERIKSA       = 'sedang_diperiksa';
    const STATUS_MENUNGGU_OBAT          = 'menunggu_obat';
    const STATUS_MENUNGGU_PEMBAYARAN    = 'menunggu_pembayaran';
    const STATUS_SELESAI                = 'selesai';
    const STATUS_BATAL                  = 'batal';

    /**
     * Urutan alur status yang valid (untuk validasi transisi).
     * Key = status saat ini, Value = status yang diperbolehkan berikutnya.
     */
    const STATUS_TRANSITIONS = [
        'terdaftar'                  => ['menunggu_pemeriksaan_awal', 'batal'],
        'menunggu_pemeriksaan_awal'  => ['menunggu_dokter', 'batal'],
        'menunggu_dokter'            => ['sedang_diperiksa', 'batal'],
        'sedang_diperiksa'           => ['menunggu_obat', 'menunggu_pembayaran', 'batal'],
        'menunggu_obat'              => ['menunggu_pembayaran'],
        'menunggu_pembayaran'        => ['selesai'],
        'selesai'                    => [],
        'batal'                      => [],
    ];

    // ── Relasi ───────────────────────────────────────────────

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function poli(): BelongsTo
    {
        return $this->belongsTo(Poli::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    public function examination(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Examination::class);
    }

    public function medicalRecord(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(MedicalRecord::class);
    }

    public function prescription(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Prescription::class);
    }

    public function invoice(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    // ── Helpers ──────────────────────────────────────────────

    public function canTransitionTo(string $newStatus): bool
    {
        return in_array($newStatus, self::STATUS_TRANSITIONS[$this->status] ?? []);
    }

    public function isActive(): bool
    {
        return !in_array($this->status, [self::STATUS_SELESAI, self::STATUS_BATAL]);
    }
}
