<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ObservasiUmum extends Model
{
    use HasFactory;

    protected $table = 'observasi_umum';

    protected $fillable = [
        'transaction_no',
        'transaction_date',
        'patient_name',
        'price',
        'payment_method',
        'running_total',
        'deposit_amount',
        'balance',
        'note',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'price' => 'decimal:2',
            'running_total' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
