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
        'seating_capacity',
        'image_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_fare' => 'decimal:2',
            'per_km_rate' => 'decimal:2',
            'per_minute_rate' => 'decimal:2',
            'minimum_fare' => 'decimal:2',
            'cancellation_fee' => 'decimal:2',
            'seating_capacity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
