<?php

namespace Database\Seeders;

use App\Models\Setting;
use App\Models\VehicleType;
use App\Models\Wallet;
use App\Models\User;
use Illuminate\Database\Seeder;

class CoreDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedVehicleTypes();
        $this->seedSettings();
        $this->seedWallets();
    }

    private function seedVehicleTypes(): void
    {
        $types = [
            ['name' => 'Economy', 'slug' => 'economy', 'description' => 'Affordable everyday rides', 'icon' => 'car', 'base_fare' => 15.00, 'per_km_rate' => 8.00, 'per_minute_rate' => 1.00, 'minimum_fare' => 35.00, 'commission_rate' => 10, 'cancellation_fee' => 10.00, 'seating_capacity' => 4, 'is_active' => true],
            ['name' => 'Comfort', 'slug' => 'comfort', 'description' => 'Spacious comfortable rides', 'icon' => 'car', 'base_fare' => 20.00, 'per_km_rate' => 10.00, 'per_minute_rate' => 1.25, 'minimum_fare' => 45.00, 'commission_rate' => 10, 'cancellation_fee' => 10.00, 'seating_capacity' => 4, 'is_active' => true],
            ['name' => 'Premium', 'slug' => 'premium', 'description' => 'Luxury premium experience', 'icon' => 'car', 'base_fare' => 35.00, 'per_km_rate' => 14.00, 'per_minute_rate' => 2.00, 'minimum_fare' => 70.00, 'commission_rate' => 10, 'cancellation_fee' => 15.00, 'seating_capacity' => 4, 'is_active' => true],
            ['name' => 'Motorcycle', 'slug' => 'motorcycle', 'description' => 'Fast and agile motorcycle rides', 'icon' => 'motorcycle', 'base_fare' => 10.00, 'per_km_rate' => 5.00, 'per_minute_rate' => 0.75, 'minimum_fare' => 25.00, 'commission_rate' => 10, 'cancellation_fee' => 5.00, 'seating_capacity' => 1, 'is_active' => true],
        ];

        foreach ($types as $type) {
            VehicleType::updateOrCreate(
                ['slug' => $type['slug']],
                $type
            );
        }
    }

    private function seedSettings(): void
    {
        $settings = [
            ['key' => 'default_currency', 'value' => 'EGP', 'group' => 'currency', 'type' => 'string', 'description' => 'Default currency for the platform'],
            ['key' => 'currency_locale', 'value' => 'en-EG', 'group' => 'currency', 'type' => 'string', 'description' => 'Currency locale for formatting'],
            ['key' => 'base_fare', 'value' => '10', 'group' => 'pricing', 'type' => 'decimal', 'description' => 'Base fare amount'],
            ['key' => 'price_per_km', 'value' => '5', 'group' => 'pricing', 'type' => 'decimal', 'description' => 'Price per kilometer'],
            ['key' => 'price_per_minute', 'value' => '1.5', 'group' => 'pricing', 'type' => 'decimal', 'description' => 'Price per minute'],
            ['key' => 'minimum_fare', 'value' => '15', 'group' => 'pricing', 'type' => 'decimal', 'description' => 'Minimum fare amount'],
            ['key' => 'waiting_free_minutes', 'value' => '5', 'group' => 'pricing', 'type' => 'integer', 'description' => 'Free waiting time in minutes before fee starts'],
            ['key' => 'waiting_fee_per_minute', 'value' => '1', 'group' => 'pricing', 'type' => 'decimal', 'description' => 'Waiting fee per minute after free wait time'],
            ['key' => 'company_commission_rate', 'value' => '10', 'group' => 'commission', 'type' => 'decimal', 'description' => 'Company commission rate (10%)'],
            ['key' => 'long_pickup_threshold_km', 'value' => '2', 'group' => 'commission', 'type' => 'decimal', 'description' => 'Distance threshold for long pickup commission adjustment'],
            ['key' => 'long_pickup_commission_rate', 'value' => '8', 'group' => 'commission', 'type' => 'decimal', 'description' => 'Reduced commission rate for long pickups (8%)'],
            ['key' => 'default_fuel_price', 'value' => '20', 'group' => 'fuel', 'type' => 'decimal', 'description' => 'Default fuel price per liter in EGP'],
            ['key' => 'default_fuel_consumption', 'value' => '8.5', 'group' => 'fuel', 'type' => 'decimal', 'description' => 'Average fuel consumption (L/100KM)'],
            ['key' => 'average_motorcycle_fuel_consumption_l_per_100km', 'value' => '3', 'group' => 'fuel', 'type' => 'decimal', 'description' => 'Average motorcycle fuel consumption liters per 100km'],
            ['key' => 'surge_enabled', 'value' => 'false', 'group' => 'surge', 'type' => 'boolean', 'description' => 'Enable surge pricing'],
            ['key' => 'surge_demand_window_minutes', 'value' => '5', 'group' => 'surge', 'type' => 'integer', 'description' => 'Time window in minutes for surge demand calculation'],
            ['key' => 'surge_min_open_requests', 'value' => '3', 'group' => 'surge', 'type' => 'integer', 'description' => 'Minimum open ride requests to trigger surge'],
            ['key' => 'surge_min_demand_supply_ratio', 'value' => '1.5', 'group' => 'surge', 'type' => 'decimal', 'description' => 'Minimum demand/supply ratio for surge activation'],
            ['key' => 'surge_max_multiplier', 'value' => '3.0', 'group' => 'surge', 'type' => 'decimal', 'description' => 'Maximum surge price multiplier'],
            ['key' => 'surge_step', 'value' => '0.5', 'group' => 'surge', 'type' => 'decimal', 'description' => 'Surge multiplier increment step'],
            ['key' => 'surge_radius_km', 'value' => '3', 'group' => 'surge', 'type' => 'decimal', 'description' => 'Radius in km for surge zone calculation'],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }

    private function seedWallets(): void
    {
        $users = User::whereIn('email', [
            'admin@test.com',
            'driver@test.com',
            'rider@test.com',
        ])->get();

        foreach ($users as $user) {
            Wallet::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'balance' => 0,
                    'currency' => 'EGP',
                    'is_active' => true,
                ]
            );
        }
    }
}
