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

    /**
     * Accessor that always returns the Spatie roles() relationship Collection,
     * bypassing the 'roles' database column that shadows the relationship name.
     */
    protected function getRolesAttribute($value): \Illuminate\Database\Eloquent\Collection
    {
        return $this->roles()->get();
    }

    public function syncRolesColumn(): void
    {
        $names = $this->roles()->pluck('name')->toArray();
        self::withoutTimestamps(fn() => $this->newQuery()->whereKey($this->getKey())->update(['roles' => json_encode($names)]));
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
