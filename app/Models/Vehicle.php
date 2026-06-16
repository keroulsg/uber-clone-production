<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'vehicle_type_id',
        'make',
        'model',
        'year',
        'color',
        'license_plate',
        'registration_number',
        'vehicle_class',
        'features',
        'status',
        'is_active',
        'image_url',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'is_active' => 'boolean',
            'features' => 'array',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class);
    }
}
