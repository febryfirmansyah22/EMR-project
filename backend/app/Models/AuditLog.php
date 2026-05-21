<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'user_name',
        'user_role',
        'action',
        'resource',
        'resource_id',
        'old_data',
        'new_data',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_data'   => 'array',
            'new_data'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    // Audit log tidak boleh diubah — enforce di level aplikasi
    public function update(array $attributes = [], array $options = []): never
    {
        throw new LogicException('Audit log tidak dapat diubah.');
    }

    public function delete(): never
    {
        throw new LogicException('Audit log tidak dapat dihapus.');
    }

    public function forceDelete(): never
    {
        throw new LogicException('Audit log tidak dapat dihapus.');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
