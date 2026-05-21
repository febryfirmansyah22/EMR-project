<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalAction extends Model
{
    protected $fillable = ['name', 'category', 'price', 'is_active'];

    protected function casts(): array
    {
        return [
            'price'     => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }
}
