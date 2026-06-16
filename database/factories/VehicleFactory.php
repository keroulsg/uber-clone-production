<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    public function definition(): array
    {
        return [
            'driver_id' => Driver::factory(),
            'vehicle_type_id' => VehicleType::factory(),
            'make' => fake()->randomElement(['Toyota', 'Honda', 'Hyundai']),
            'model' => fake()->randomElement(['Corolla', 'Civic', 'Elantra']),
            'year' => fake()->year(),
            'color' => fake()->safeColorName(),
            'license_plate' => strtoupper(fake()->bothify('???-####')),
            'vehicle_class' => 'basic',
            'status' => 'pending',
            'is_active' => true,
        ];
    }
}
