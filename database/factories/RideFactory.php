<?php

namespace Database\Factories;

use App\Enums\RideStatus;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

class RideFactory extends Factory
{
    protected $model = Ride::class;

    public function definition(): array
    {
        return [
            'rider_id' => Rider::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'pickup_latitude' => fake()->latitude(),
            'pickup_longitude' => fake()->longitude(),
            'pickup_address' => fake()->address(),
            'destination_latitude' => fake()->latitude(),
            'destination_longitude' => fake()->longitude(),
            'destination_address' => fake()->address(),
            'status' => RideStatus::Pending,
            'estimated_distance' => fake()->randomFloat(2, 1, 50),
            'estimated_duration' => fake()->numberBetween(5, 120),
            'estimated_fare' => fake()->randomFloat(2, 5, 100),
            'payment_method' => 'wallet',
        ];
    }
}
