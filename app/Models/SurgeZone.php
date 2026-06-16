<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurgeZone extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'bounds',
        'center_latitude',
        'center_longitude',
        'radius_km',
        'multiplier',
        'is_active',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'bounds' => 'array',
            'center_latitude' => 'decimal:7',
            'center_longitude' => 'decimal:7',
            'radius_km' => 'decimal:2',
            'multiplier' => 'decimal:2',
            'is_active' => 'boolean',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }
}
