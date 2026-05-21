<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecordAction extends Model
{
    protected $fillable = ['medical_record_id', 'medical_action_id', 'quantity', 'notes'];

    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }

    public function medicalRecord(): BelongsTo
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    public function medicalAction(): BelongsTo
    {
        return $this->belongsTo(MedicalAction::class);
    }
}
