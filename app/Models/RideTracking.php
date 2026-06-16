<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RideTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'driver_latitude',
        'driver_longitude',
    ];

    protected function casts(): array
    {
        return [
            'driver_latitude' => 'decimal:7',
            'driver_longitude' => 'decimal:7',
        ];
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
