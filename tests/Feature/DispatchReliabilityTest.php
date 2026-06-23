<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Models\RideDriverOffer;
use App\Enums\RideStatus;
use App\Repositories\DriverRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DispatchReliabilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $rider;
    protected User $driverUser;
    protected Driver $driver;
    protected VehicleType $economyType;
    protected VehicleType $comfortType;
    protected VehicleType $premiumType;
    protected VehicleType $motorcycleType;
    protected Vehicle $economyVehicle;
    protected Vehicle $comfortVehicle;
    protected Vehicle $premiumVehicle;
    protected Vehicle $motorcycleVehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rider = User::factory()->create();
        Rider::factory()->create(['user_id' => $this->rider->id]);

        $this->driverUser = User::factory()->create();
        $this->driver = Driver::factory()->create([
            'user_id' => $this->driverUser->id,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'is_active' => true,
            'status' => 'approved',
            'latitude' => 30.0500,
            'longitude' => 31.2400,
        ]);

        $this->economyType = VehicleType::factory()->create([
            'slug' => 'economy',
            'base_fare' => 5.00,
            'per_km_rate' => 1.50,
            'per_minute_rate' => 0.25,
            'minimum_fare' => 8.00,
        ]);
        $this->comfortType = VehicleType::factory()->create([
            'slug' => 'comfort',
            'base_fare' => 8.00,
            'per_km_rate' => 2.00,
            'per_minute_rate' => 0.40,
            'minimum_fare' => 12.00,
        ]);
        $this->premiumType = VehicleType::factory()->create([
            'slug' => 'premium',
            'base_fare' => 15.00,
            'per_km_rate' => 3.50,
            'per_minute_rate' => 0.75,
            'minimum_fare' => 25.00,
        ]);
        $this->motorcycleType = VehicleType::factory()->create([
            'slug' => 'motorcycle',
            'base_fare' => 3.00,
            'per_km_rate' => 1.00,
            'per_minute_rate' => 0.15,
            'minimum_fare' => 5.00,
        ]);

        $this->economyVehicle = Vehicle::factory()->create([
            'driver_id' => $this->driver->id,
            'vehicle_type_id' => $this->economyType->id,
            'is_active' => true,
            'status' => 'active',
        ]);
        $this->comfortVehicle = Vehicle::factory()->create([
            'driver_id' => $this->driver->id,
            'vehicle_type_id' => $this->comfortType->id,
            'is_active' => true,
            'status' => 'active',
        ]);
        $this->premiumVehicle = Vehicle::factory()->create([
            'driver_id' => $this->driver->id,
            'vehicle_type_id' => $this->premiumType->id,
            'is_active' => true,
            'status' => 'active',
        ]);
        $this->motorcycleVehicle = Vehicle::factory()->create([
            'driver_id' => $this->driver->id,
            'vehicle_type_id' => $this->motorcycleType->id,
            'is_active' => true,
            'status' => 'active',
        ]);
    }

    public function test_cairo_ride_creates_offer_for_nearest_eligible_driver(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->economyType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');

        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers, 'Exactly one offer should be created for the eligible driver');
        $this->assertEquals($this->driver->id, $offers->first()->driver_id, 'Offer should be for the nearest eligible driver');
    }

    public function test_suspended_driver_is_excluded(): void
    {
        $this->driver->update(['status' => 'suspended', 'is_active' => false]);

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->economyType->id);

        $this->assertTrue($eligible->isEmpty(), 'Suspended driver should not be eligible');
    }

    public function test_blocked_driver_is_excluded(): void
    {
        $this->driverUser->update(['is_active' => false]);

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->economyType->id);

        $this->assertTrue($eligible->isEmpty(), 'Blocked driver should not be eligible');
    }

    public function test_offline_driver_is_excluded(): void
    {
        $this->driver->update(['is_online' => false]);

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->economyType->id);

        $this->assertTrue($eligible->isEmpty(), 'Offline driver should not be eligible');
    }

    public function test_driver_without_active_vehicle_type_is_excluded(): void
    {
        $this->economyVehicle->update(['is_active' => false]);

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->economyType->id);

        $this->assertTrue($eligible->isEmpty(), 'Driver without active matching vehicle should not be eligible');
    }

    public function test_nearest_driver_is_preferred(): void
    {
        $farUser = User::factory()->create();
        $farDriver = Driver::factory()->create([
            'user_id' => $farUser->id,
            'is_online' => true,
            'is_approved' => true,
            'is_active' => true,
            'status' => 'approved',
            'latitude' => 30.1000,
            'longitude' => 31.3000,
        ]);
        Vehicle::factory()->create([
            'driver_id' => $farDriver->id,
            'vehicle_type_id' => $this->economyType->id,
            'is_active' => true,
            'status' => 'active',
        ]);

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->economyType->id);

        $this->assertCount(2, $eligible);
        $this->assertEquals($this->driver->id, $eligible->first()->id, 'Nearest driver should be first');
    }

    public function test_cairo_giza_distance_is_realistic(): void
    {
        $pickupLat = 30.047;
        $pickupLng = 31.234;
        $destLat = 30.0517;
        $destLng = 31.2006;

        $repo = app(DriverRepository::class);
        $ref = new \ReflectionMethod($repo, 'haversine');
        $ref->setAccessible(true);
        $distance = $ref->invoke($repo, $pickupLat, $pickupLng, $destLat, $destLng);

        $this->assertGreaterThan(0.5, $distance, 'Tahrir to Mohandessin should be > 0.5km');
        $this->assertLessThan(10, $distance, 'Tahrir to Mohandessin should be < 10km');
    }

    public function test_pending_endpoint_returns_created_offer(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->economyType->id,
            'payment_method' => 'wallet',
        ]);
        $rideId = $response->json('data.id');

        $pendingResponse = $this->actingAs($this->driverUser)->getJson('/api/v1/driver/rides/pending');
        $pendingResponse->assertOk();
        $pendingData = $pendingResponse->json('data');

        $this->assertNotNull($pendingData);
        $matching = collect($pendingData)->firstWhere('id', $rideId);
        $this->assertNotNull($matching, 'Pending endpoint should return the created ride offer');
    }

    public function test_driver_can_accept_created_offer(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->economyType->id,
            'payment_method' => 'wallet',
        ]);
        $rideId = $response->json('data.id');

        $acceptResponse = $this->actingAs($this->driverUser)->postJson("/api/v1/driver/rides/{$rideId}/accept");
        $acceptResponse->assertOk();

        $ride = Ride::findOrFail($rideId);
        $this->assertEquals(RideStatus::DriverAssigned, $ride->status);
        $this->assertEquals($this->driver->id, $ride->driver_id);
    }

    public function test_no_driver_message_in_response_when_no_eligible(): void
    {
        $this->driver->update(['is_online' => false]);

        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->economyType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $this->assertEquals('No nearby eligible drivers available', $response->json('no_driver_message'));
    }

    public function test_comfort_ride_creates_offer(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->comfortType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');

        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers);
        $this->assertEquals($this->driver->id, $offers->first()->driver_id);
    }

    public function test_premium_ride_creates_offer(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->premiumType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');

        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers);
        $this->assertEquals($this->driver->id, $offers->first()->driver_id);
    }

    public function test_motorcycle_ride_creates_offer(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->motorcycleType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');

        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers);
        $this->assertEquals($this->driver->id, $offers->first()->driver_id);
    }

    public function test_premium_does_not_match_comfort_vehicle_only(): void
    {
        // Remove only the premium vehicle
        $this->premiumVehicle->delete();

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->premiumType->id);

        $this->assertTrue($eligible->isEmpty(), 'Premium should not match driver with only Comfort vehicle');
    }

    public function test_motorcycle_does_not_match_car_vehicles(): void
    {
        // Remove only the motorcycle vehicle
        $this->motorcycleVehicle->delete();

        $repo = app(DriverRepository::class);
        $eligible = $repo->findEligibleForRide(30.047, 31.234, $this->motorcycleType->id);

        $this->assertTrue($eligible->isEmpty(), 'Motorcycle should not match driver with only car vehicles');
    }

    public function test_no_driver_message_for_missing_vehicle_type(): void
    {
        $this->premiumVehicle->delete();

        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.047,
            'pickup_longitude' => 31.234,
            'pickup_address' => 'Tahrir Square, Cairo',
            'destination_latitude' => 30.0517,
            'destination_longitude' => 31.2006,
            'destination_address' => 'Syria Street, Mohandessin',
            'vehicle_type_id' => $this->premiumType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $this->assertEquals('No nearby eligible drivers available', $response->json('no_driver_message'));
    }

    public function test_all_four_types_pending_endpoint_returns_fresh_offers(): void
    {
        // Create rides for all 4 types
        $typeIds = [
            $this->economyType->id,
            $this->comfortType->id,
            $this->premiumType->id,
            $this->motorcycleType->id,
        ];
        $rideIds = [];

        foreach ($typeIds as $typeId) {
            $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
                'pickup_latitude' => 30.047,
                'pickup_longitude' => 31.234,
                'pickup_address' => 'Tahrir Square, Cairo',
                'destination_latitude' => 30.0517,
                'destination_longitude' => 31.2006,
                'destination_address' => 'Syria Street, Mohandessin',
                'vehicle_type_id' => $typeId,
                'payment_method' => 'wallet',
            ]);
            $response->assertCreated();
            $rideIds[] = $response->json('data.id');
        }

        // Verify pending endpoint returns all 4 offers
        $pendingResponse = $this->actingAs($this->driverUser)->getJson('/api/v1/driver/rides/pending');
        $pendingResponse->assertOk();
        $pendingData = $pendingResponse->json('data');

        foreach ($rideIds as $rideId) {
            $matching = collect($pendingData)->firstWhere('id', $rideId);
            $this->assertNotNull($matching, "Ride $rideId should appear in pending endpoint");
        }
    }

    public function test_driver_can_accept_each_type(): void
    {
        $typeIds = [
            $this->economyType->id,
            $this->comfortType->id,
            $this->premiumType->id,
            $this->motorcycleType->id,
        ];

        foreach ($typeIds as $typeId) {
            $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
                'pickup_latitude' => 30.047,
                'pickup_longitude' => 31.234,
                'pickup_address' => 'Tahrir Square, Cairo',
                'destination_latitude' => 30.0517,
                'destination_longitude' => 31.2006,
                'destination_address' => 'Syria Street, Mohandessin',
                'vehicle_type_id' => $typeId,
                'payment_method' => 'wallet',
            ]);
            $response->assertCreated();
            $rideId = $response->json('data.id');

            $acceptResponse = $this->actingAs($this->driverUser)->postJson("/api/v1/driver/rides/{$rideId}/accept");
            $acceptResponse->assertOk();

            $ride = Ride::findOrFail($rideId);
            $this->assertEquals(RideStatus::DriverAssigned, $ride->status);
            $this->assertEquals($this->driver->id, $ride->driver_id);

            // Cancel the ride so driver is free for the next type
            $this->actingAs($this->rider)->postJson("/api/v1/rides/{$rideId}/cancel", [
                'cancellation_reason' => 'Test iteration — freeing driver',
            ]);
        }
    }
}
