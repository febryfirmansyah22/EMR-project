<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Patient extends Model
{
    protected $fillable = [
        'medical_record_number',
        'name',
        'nik',
        'birth_date',
        'birth_place',
        'gender',
        'blood_type',
        'address',
        'phone',
        'email',
        'religion',
        'marital_status',
        'occupation',
        'education',
        'emergency_contact',
        'insurance_type',
        'insurance_number',
        'is_active',
    ];

    /**
     * Kolom-kolom sensitif dienkripsi otomatis oleh Laravel.
     * Data tersimpan sebagai ciphertext di database.
     */
    protected function casts(): array
    {
        return [
            'nik'               => 'encrypted',
            'address'           => 'encrypted',
            'phone'             => 'encrypted',
            'emergency_contact' => 'encrypted:array', // decrypt → PHP array
            'birth_date'        => 'date',
            'is_active'         => 'boolean',
        ];
    }

    // ── Scopes ───────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('medical_record_number', 'ilike', "%{$term}%")
              ->orWhere('email', 'ilike', "%{$term}%");
        });
    }

    // ── Helpers ──────────────────────────────────────────────

    /** Hitung usia dari tanggal lahir */
    public function getAgeAttribute(): int
    {
        return $this->birth_date->diffInYears(now());
    }
}
