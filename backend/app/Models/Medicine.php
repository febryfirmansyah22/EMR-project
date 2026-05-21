<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = [
        'name',
        'generic_name',
        'unit',
        'category',
        'price',
        'stock',
        'min_stock',
        'expiry_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price'       => 'decimal:2',
            'stock'       => 'integer',
            'min_stock'   => 'integer',
            'expiry_date' => 'date',
            'is_active'   => 'boolean',
        ];
    }

    public function isLowStock(): bool
    {
        return $this->stock <= $this->min_stock;
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }
}
