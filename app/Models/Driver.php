<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_number',
        'is_online',
        'is_approved',
        'is_verified',
        'is_active',
        'status',
        'average_rating',
        'total_rides',
        'total_earnings',
        'current_balance',
        'acceptance_rate',
        'completion_rate',
        'payout_method',
        'payout_phone',
        'payout_account_name',
        'profile_photo_url',
        'license_front_image',
        'license_back_image',
        'identity_front_image',
        'identity_back_image',
        'criminal_record',
        'verification_document',
        'address',
        'city',
        'state',
        'latitude',
        'longitude',
        'gender',
        'female_only',
    ];

    protected function casts(): array
    {
        return [
            'is_online' => 'boolean',
            'is_approved' => 'boolean',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'average_rating' => 'decimal:2',
            'total_rides' => 'integer',
            'total_earnings' => 'decimal:2',
            'current_balance' => 'decimal:2',
            'acceptance_rate' => 'decimal:2',
            'completion_rate' => 'decimal:2',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'female_only' => 'boolean',
            'verification_document' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }

    public function rides()
    {
        return $this->hasMany(Ride::class);
    }

    public function debts()
    {
        return $this->hasMany(DriverDebt::class);
    }

    public function warnings()
    {
        return $this->hasMany(DriverWarning::class);
    }

    public function penalties()
    {
        return $this->hasMany(DriverPenalty::class);
    }

    public function scopeOnline($query)
    {
        return $query->where('is_online', true)->where('is_active', true);
    }
}
