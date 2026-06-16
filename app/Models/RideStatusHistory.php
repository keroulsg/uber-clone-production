<?php

namespace App\Models;

use App\Enums\RideStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RideStatusHistory extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'ride_id',
        'status',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => RideStatus::class,
            'created_at' => 'datetime',
        ];
    }

    public function ride()
    {
        return $this->belongsTo(Ride::class);
    }
}
