<?php

namespace Database\Factories;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class NotificationFactory extends Factory
{
    protected $model = Notification::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'type' => fake()->randomElement(['ride_requested', 'ride_accepted', 'ride_completed']),
            'notifiable_type' => User::class,
            'notifiable_id' => User::factory(),
            'data' => ['message' => fake()->sentence()],
            'read_at' => null,
        ];
    }
}
