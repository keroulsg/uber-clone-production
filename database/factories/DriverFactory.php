<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DriverFactory extends Factory
{
    protected $model = Driver::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'is_online' => false,
            'is_approved' => false,
            'is_verified' => false,
            'is_active' => true,
            'status' => 'pending',
            'average_rating' => 0,
            'total_rides' => 0,
            'total_earnings' => 0,
            'current_balance' => 0,
            'acceptance_rate' => 0,
            'completion_rate' => 0,
        ];
    }
}
