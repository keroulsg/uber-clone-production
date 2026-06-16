<?php

namespace Database\Factories;

use App\Models\Rider;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RiderFactory extends Factory
{
    protected $model = Rider::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'total_rides' => 0,
            'total_spent' => 0,
            'average_rating' => 0,
            'is_active' => true,
        ];
    }
}
