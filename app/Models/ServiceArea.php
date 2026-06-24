<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceArea extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'city',
        'governorate',
        'center_latitude',
        'center_longitude',
        'radius_km',
        'cities',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'center_latitude' => 'decimal:7',
            'center_longitude' => 'decimal:7',
            'radius_km' => 'decimal:2',
            'cities' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
