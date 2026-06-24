<?php

namespace Database\Factories;

use App\Enums\PromoType;
use App\Models\PromoCode;
use Illuminate\Database\Eloquent\Factories\Factory;

class PromoCodeFactory extends Factory
{
    protected $model = PromoCode::class;

    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->lexify('??????')),
            'type' => PromoType::Percentage,
            'value' => fake()->randomFloat(2, 5, 50),
            'min_ride_amount' => fake()->randomFloat(2, 10, 100),
            'max_discount' => fake()->randomFloat(2, 20, 200),
            'usage_limit' => fake()->numberBetween(10, 1000),
            'used_count' => 0,
            'expires_at' => now()->addDays(30),
            'is_active' => true,
        ];
    }
}
