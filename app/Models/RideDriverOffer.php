<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RideDriverOffer extends Model
{
    use HasFactory;

    protected $fillable = [
        'ride_id',
        'driver_id',
        'status',
    ];

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
