<?php

namespace App\Helpers;

use App\Models\Patient;

class MedicalRecordHelper
{
    private const PREFIX = 'RM';
    private const PAD_LENGTH = 6;

    public static function generate(): string
    {
        $year = now()->format('Y');
        $lastPatient = Patient::whereYear('created_at', $year)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();

        $sequence = $lastPatient
            ? ((int) substr($lastPatient->medical_record_number, -self::PAD_LENGTH)) + 1
            : 1;

        return self::PREFIX . $year . str_pad($sequence, self::PAD_LENGTH, '0', STR_PAD_LEFT);
    }
}
