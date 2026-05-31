<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FakturObat extends Model
{
    use HasFactory;

    protected $table = 'faktur_obat';

    protected $fillable = [
        'invoice_no',
        'invoice_date',
        'supplier_name',
        'price',
        'description',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'price' => 'decimal:2',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
