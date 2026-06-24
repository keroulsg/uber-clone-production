<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'icon',
        'base_fare',
        'per_km_rate',
        'per_minute_rate',
        'minimum_fare',
        'cancellation_fee',
        'commission_rate',
        'fuel_multiplier',
        'seating_capacity',
        'image_url',
        'is_active',
        'vip_enabled',
        'vip_base_fare',
        'vip_multiplier',
        'vip_commission_rate',
        'vip_priority_multiplier',
        'female_driver_enabled',
        'female_base_fare',
        'female_multiplier',
        'female_commission_rate',
    ];

    protected function casts(): array
    {
        return [
            'base_fare' => 'decimal:2',
            'per_km_rate' => 'decimal:2',
            'per_minute_rate' => 'decimal:2',
            'minimum_fare' => 'decimal:2',
            'cancellation_fee' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'fuel_multiplier' => 'decimal:2',
            'seating_capacity' => 'integer',
            'is_active' => 'boolean',
            'vip_enabled' => 'boolean',
            'vip_base_fare' => 'decimal:2',
            'vip_multiplier' => 'decimal:2',
            'vip_commission_rate' => 'decimal:2',
            'vip_priority_multiplier' => 'decimal:2',
            'female_driver_enabled' => 'boolean',
            'female_base_fare' => 'decimal:2',
            'female_multiplier' => 'decimal:2',
            'female_commission_rate' => 'decimal:2',
        ];
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
