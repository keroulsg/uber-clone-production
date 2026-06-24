<?php

namespace Database\Factories;

use App\Models\ServiceArea;
use Illuminate\Database\Eloquent\Factories\Factory;

class ServiceAreaFactory extends Factory
{
    protected $model = ServiceArea::class;

    public function definition(): array
    {
        return [
            'name' => fake()->city(),
            'slug' => fake()->slug(),
            'city' => fake()->city(),
            'governorate' => fake()->state(),
            'center_latitude' => fake()->latitude(),
            'center_longitude' => fake()->longitude(),
            'radius_km' => fake()->randomFloat(2, 10, 100),
            'cities' => json_encode([fake()->city(), fake()->city()]),
            'is_active' => true,
        ];
    }
}
