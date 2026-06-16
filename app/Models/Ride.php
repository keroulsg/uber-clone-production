<?php

namespace App\Models;

use App\Enums\RideStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ride extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'rider_id',
        'driver_id',
        'vehicle_type_id',
        'vehicle_id',
        'pickup_latitude',
        'pickup_longitude',
        'pickup_address',
        'destination_latitude',
        'destination_longitude',
        'destination_address',
        'status',
        'estimated_distance',
        'estimated_duration',
        'estimated_fare',
        'actual_distance',
        'actual_duration',
        'actual_fare',
        'surge_multiplier',
        'payment_method',
        'payment_status',
        'route_polyline',
        'started_at',
        'picked_up_at',
        'dropped_at',
        'completed_at',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
        'female_driver_preferred',
        'female_driver_unavailable',
        'fallback_available',
        'fallback_to_any_driver_accepted',
        'driver_pickup_distance_km',
        'waiting_started_at',
        'rating_by_rider',
        'rating_by_driver',
    ];

    protected function casts(): array
    {
        return [
            'status' => RideStatus::class,
            'estimated_distance' => 'decimal:2',
            'estimated_duration' => 'integer',
            'estimated_fare' => 'decimal:2',
            'actual_distance' => 'decimal:2',
            'actual_duration' => 'integer',
            'actual_fare' => 'decimal:2',
            'surge_multiplier' => 'decimal:2',
            'driver_pickup_distance_km' => 'decimal:2',
            'started_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'dropped_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'waiting_started_at' => 'datetime',
            'female_driver_preferred' => 'boolean',
            'female_driver_unavailable' => 'boolean',
            'fallback_available' => 'boolean',
            'fallback_to_any_driver_accepted' => 'boolean',
            'rating_by_rider' => 'boolean',
            'rating_by_driver' => 'boolean',
        ];
    }

    public function rider()
    {
        return $this->belongsTo(User::class, 'rider_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function offers()
    {
        return $this->hasMany(RideDriverOffer::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(RideStatusHistory::class);
    }
}
