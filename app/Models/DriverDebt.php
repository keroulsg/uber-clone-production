<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverDebt extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_id',
        'ride_id',
        'type',
        'amount',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
