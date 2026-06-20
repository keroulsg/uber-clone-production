<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'password',
        'gender',
        'avatar_url',
        'is_active',
        'email_verified_at',
        'phone_verified_at',
        'fcm_token',
        'preferences',
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
            'preferences' => 'array',
        ];
    }

    protected function getRolesAttribute($value): mixed
    {
        if ($this->relationLoaded('roles')) {
            return $this->getRelationValue('roles');
        }
        return json_decode($value, true) ?? [];
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

    public function banHistories()
    {
        return $this->hasMany(BanHistory::class);
    }

    public function latestBan()
    {
        return $this->hasOne(BanHistory::class)->latestOfMany();
    }
}
