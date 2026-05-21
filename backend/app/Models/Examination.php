<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Examination extends Model
{
    protected $fillable = [
        'visit_id',
        'nurse_id',
        'weight',
        'height',
        'blood_pressure_systolic',
        'blood_pressure_diastolic',
        'pulse',
        'temperature',
        'respiratory_rate',
        'oxygen_saturation',
        'blood_sugar',
        'notes',
        'examined_at',
    ];

    protected function casts(): array
    {
        return [
            'weight'                    => 'decimal:2',
            'height'                    => 'decimal:2',
            'temperature'               => 'decimal:1',
            'oxygen_saturation'         => 'decimal:1',
            'blood_sugar'               => 'decimal:2',
            'examined_at'               => 'datetime',
        ];
    }

    // ── Relasi ───────────────────────────────────────────────

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function nurse(): BelongsTo
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }

    // ── Computed ─────────────────────────────────────────────

    /** BMI = berat (kg) / tinggi² (m) */
    public function getBmiAttribute(): ?float
    {
        if (!$this->weight || !$this->height || $this->height == 0) return null;
        $heightM = $this->height / 100;
        return round($this->weight / ($heightM * $heightM), 1);
    }

    /** Kategori BMI berdasarkan standar Asia */
    public function getBmiCategoryAttribute(): ?string
    {
        $bmi = $this->bmi;
        if ($bmi === null) return null;
        return match (true) {
            $bmi < 18.5 => 'Kurus',
            $bmi < 23.0 => 'Normal',
            $bmi < 27.5 => 'Kelebihan berat',
            default     => 'Obesitas',
        };
    }

    /** Tekanan darah gabungan: "120/80 mmHg" */
    public function getBloodPressureAttribute(): ?string
    {
        if (!$this->blood_pressure_systolic || !$this->blood_pressure_diastolic) return null;
        return "{$this->blood_pressure_systolic}/{$this->blood_pressure_diastolic} mmHg";
    }
}
