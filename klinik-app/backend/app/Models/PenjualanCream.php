<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PenjualanCream extends Model
{
    use HasFactory;

    protected $table = 'penjualan_cream';

    protected $fillable = [
        'transaction_no',
        'transaction_date',
        'patient_name',
        'product_name',
        'selling_price',
        'expense',
        'payment_method',
        'balance',
        'cash_balance',
        'transfer_balance',
        'note',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'selling_price' => 'decimal:2',
            'expense' => 'decimal:2',
            'balance' => 'decimal:2',
            'cash_balance' => 'decimal:2',
            'transfer_balance' => 'decimal:2',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
