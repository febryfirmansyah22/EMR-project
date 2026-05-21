<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedicalRecord extends Model
{
    protected $fillable = [
        'visit_id',
        'doctor_id',
        'soap_subjective',
        'soap_objective',
        'soap_assessment',
        'soap_plan',
        'doctor_notes',
    ];

    /**
     * Semua kolom SOAP dienkripsi sesuai CLAUDE.md.
     * Data sensitif tidak boleh tersimpan plaintext di database.
     */
    protected function casts(): array
    {
        return [
            'soap_subjective' => 'encrypted',
            'soap_objective'  => 'encrypted',
            'soap_assessment' => 'encrypted',
            'soap_plan'       => 'encrypted',
            'doctor_notes'    => 'encrypted',
        ];
    }

    // ── Relasi ───────────────────────────────────────────────

    public function visit(): BelongsTo
    {
        return $this->belongsTo(Visit::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    /** Diagnosis yang ditegakkan (primer & sekunder) */
    public function diagnoses(): BelongsToMany
    {
        return $this->belongsToMany(Diagnosis::class, 'record_diagnoses')
                    ->withPivot('type')
                    ->withTimestamps();
    }

    /** Tindakan medis yang dilakukan */
    public function actions(): BelongsToMany
    {
        return $this->belongsToMany(MedicalAction::class, 'record_actions')
                    ->withPivot('quantity', 'notes')
                    ->withTimestamps();
    }

    public function recordDiagnoses(): HasMany
    {
        return $this->hasMany(RecordDiagnosis::class);
    }

    public function recordActions(): HasMany
    {
        return $this->hasMany(RecordAction::class);
    }
}
