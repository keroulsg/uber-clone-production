<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'gender',
        'avatar_url',
        'is_active',
        'roles',
        'email_verified_at',
        'phone_verified_at',
        'fcm_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'roles' => 'array',
        ];
    }

    public function rider()
    {
        return $this->hasOne(Rider::class);
    }

    public function driver()
    {
        return $this->hasOne(Driver::class);
    }

    public function wallet()
    {
        return $this->hasOne(Wallet::class);
    }

    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable');
    }
}
