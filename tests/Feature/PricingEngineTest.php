<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Setting;
use App\Models\VehicleType;
use App\Services\FareCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PricingEngineTest extends TestCase
{
    use RefreshDatabase;

    protected User $riderUser;
    protected FareCalculationService $fareCalc;
    protected VehicleType $economyType;
    protected VehicleType $comfortType;
    protected VehicleType $premiumType;
    protected VehicleType $motorcycleType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fareCalc = $this->app->make(FareCalculationService::class);

        // Rider User
        $this->riderUser = User::factory()->create();
        $this->riderUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('rider')->id);

        // Seed Vehicle Types
        $this->economyType = VehicleType::create(['name' => 'Economy', 'slug' => 'economy', 'description' => 'Affordable everyday rides', 'icon' => 'car', 'base_fare' => 15.00, 'per_km_rate' => 8.00, 'per_minute_rate' => 1.00, 'minimum_fare' => 35.00, 'commission_rate' => 10, 'cancellation_fee' => 10.00, 'seating_capacity' => 4, 'is_active' => true]);
        $this->comfortType = VehicleType::create(['name' => 'Comfort', 'slug' => 'comfort', 'description' => 'Spacious comfortable rides', 'icon' => 'car', 'base_fare' => 20.00, 'per_km_rate' => 10.00, 'per_minute_rate' => 1.25, 'minimum_fare' => 45.00, 'commission_rate' => 10, 'cancellation_fee' => 10.00, 'seating_capacity' => 4, 'is_active' => true]);
        $this->premiumType = VehicleType::create(['name' => 'Premium', 'slug' => 'premium', 'description' => 'Luxury premium experience', 'icon' => 'car', 'base_fare' => 35.00, 'per_km_rate' => 14.00, 'per_minute_rate' => 2.00, 'minimum_fare' => 70.00, 'commission_rate' => 10, 'cancellation_fee' => 15.00, 'seating_capacity' => 4, 'is_active' => true]);
        $this->motorcycleType = VehicleType::create(['name' => 'Motorcycle', 'slug' => 'motorcycle', 'description' => 'Fast and agile motorcycle rides', 'icon' => 'motorcycle', 'base_fare' => 10.00, 'per_km_rate' => 5.00, 'per_minute_rate' => 0.75, 'minimum_fare' => 25.00, 'commission_rate' => 10, 'cancellation_fee' => 5.00, 'seating_capacity' => 1, 'is_active' => true]);

        // Seed settings
        collect([
            ['key' => 'default_currency', 'value' => 'EGP'],
            ['key' => 'currency_locale', 'value' => 'en-EG'],
            ['key' => 'default_fuel_price', 'value' => '20'],
            ['key' => 'default_fuel_consumption', 'value' => '8.5'],
            ['key' => 'waiting_free_minutes', 'value' => '5'],
            ['key' => 'waiting_fee_per_minute', 'value' => '0.50'],
            ['key' => 'peak_surcharge_rate', 'value' => '10'],
            ['key' => 'night_surcharge_rate', 'value' => '15'],
        ])->each(fn($s) => Setting::create($s + ['group' => 'pricing', 'type' => 'decimal', 'description' => '']));
    }

    public function test_economy_estimate_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->economyType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009), // Approx 10km
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'data' => [
                'fare',
                'breakdown' => [
                    'base_fare',
                    'distance_fare',
                    'time_fare',
                    'total_fare',
                ]
            ]
        ]);

        $data = $response->json('data.breakdown');
        $this->assertEquals(15.00, $data['base_fare']);
        $this->assertEquals(80.00, $data['distance_fare']);
        $this->assertEquals(20.00, $data['time_fare']);
    }

    public function test_comfort_estimate_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->comfortType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009),
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
            ]);

        $response->assertOk();
        $data = $response->json('data.breakdown');
        $this->assertEquals(20.00, $data['base_fare']);
        $this->assertEquals(100.00, $data['distance_fare']);
        $this->assertEquals(25.00, $data['time_fare']);
    }

    public function test_premium_estimate_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->premiumType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009),
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
            ]);

        $response->assertOk();
        $data = $response->json('data.breakdown');
        $this->assertEquals(35.00, $data['base_fare']);
        $this->assertEquals(140.00, $data['distance_fare']);
        $this->assertEquals(40.00, $data['time_fare']);
    }

    public function test_motorcycle_estimate_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->motorcycleType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009),
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
            ]);

        $response->assertOk();
        $data = $response->json('data.breakdown');
        $this->assertEquals(10.00, $data['base_fare']);
        $this->assertEquals(50.00, $data['distance_fare']);
        $this->assertEquals(15.00, $data['time_fare']);
    }

    public function test_waiting_fee_boundary_checks(): void
    {
        // 5 free minutes = 0 waiting fee
        $feeBefore = $this->fareCalc->calculateWaitingFee(5);
        $this->assertEquals(0.00, $feeBefore);

        // 6 minutes = EGP 0.50
        $feeAfter = $this->fareCalc->calculateWaitingFee(6);
        $this->assertEquals(0.50, $feeAfter);

        // 10 minutes = EGP 2.50
        $feeTen = $this->fareCalc->calculateWaitingFee(10);
        $this->assertEquals(2.50, $feeTen);
    }

    public function test_peak_surcharge_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->economyType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009),
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
                'is_peak' => true,
            ]);

        $response->assertOk();
        $totalFare = $response->json('data.fare');
        // Core fare = 15 (base) + 80 (distance) + 20 (time) = 115
        // Fuel Cost = (10km * 8.5L/100km) * 20 EGP/L = 17
        // Subtotal = 115 + 17 = 132
        // Peak surcharge = 10%
        // Expected total = 132 * 1.10 = 145.2
        $this->assertEquals(145.20, $totalFare);
    }

    public function test_night_surcharge_calculation(): void
    {
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->economyType->id,
                'pickup_latitude' => 30.05,
                'pickup_longitude' => 31.24,
                'destination_latitude' => 30.05 + (10 * 0.009),
                'destination_longitude' => 31.24 + (10 * 0.009),
                'distance' => 10.0,
                'duration' => 20,
                'is_night' => true,
            ]);

        $response->assertOk();
        $totalFare = $response->json('data.fare');
        // Core fare = 115
        // Fuel Cost = 17
        // Subtotal = 132
        // Night surcharge = 15%
        // Expected total = 132 * 1.15 = 151.8
        $this->assertEquals(151.80, $totalFare);
    }

    public function test_haversine_direct_distance_fallback(): void
    {
        // Request estimate without distance/duration inputs -> triggers backend calculateDistance fallback
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->postJson('/api/v1/rides/estimate-fare', [
                'vehicle_type_id' => $this->economyType->id,
                'pickup_latitude' => 30.0500,
                'pickup_longitude' => 31.2400,
                'destination_latitude' => 30.0590, // approx 1km away
                'destination_longitude' => 31.2400,
            ]);

        $response->assertOk();
        $data = $response->json('data.breakdown');
        $this->assertGreaterThan(0.00, $data['distance_fare']);
        $this->assertGreaterThan(0.00, $data['time_fare']);
    }
}
