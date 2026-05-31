<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'username',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'name' => $this->name,
        ];
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function hasRole(string|array $roles): bool
    {
        if (is_string($roles)) {
            $roles = explode(',', $roles);
        }
        $roles = array_map('trim', $roles);
        return in_array($this->role, $roles);
    }

    public function observasiUmum()
    {
        return $this->hasMany(ObservasiUmum::class, 'created_by');
    }

    public function penjualanCream()
    {
        return $this->hasMany(PenjualanCream::class, 'created_by');
    }

    public function fakturObat()
    {
        return $this->hasMany(FakturObat::class, 'created_by');
    }

    public function setoran()
    {
        return $this->hasMany(Setoran::class, 'created_by');
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class, 'user_id');
    }
}
