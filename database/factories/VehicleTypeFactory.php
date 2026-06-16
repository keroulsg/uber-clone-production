<?php

namespace Database\Factories;

use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

class VehicleTypeFactory extends Factory
{
    protected $model = VehicleType::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Economy', 'Comfort', 'Premium']),
            'slug' => fake()->unique()->randomElement(['economy', 'comfort', 'premium']),
            'base_fare' => fake()->randomFloat(2, 3, 10),
            'per_km_rate' => fake()->randomFloat(2, 1, 3),
            'per_minute_rate' => fake()->randomFloat(2, 0.1, 0.5),
            'minimum_fare' => fake()->randomFloat(2, 5, 15),
            'cancellation_fee' => fake()->randomFloat(2, 2, 5),
            'seating_capacity' => fake()->randomElement([3, 4, 6]),
            'is_active' => true,
        ];
    }
}
