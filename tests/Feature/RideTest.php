<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\VehicleType;
use App\Enums\RideStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class RideTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $rider;
    protected User $driver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rider = User::factory()->create();
        $this->driver = User::factory()->create();
        Rider::factory()->create(['user_id' => $this->rider->id]);
        VehicleType::factory()->create(['slug' => 'economy']);
    }

    public function test_rider_can_estimate_fare(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides/estimate-fare', [
            'vehicle_type_id' => 1,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'destination_latitude' => 40.7580,
            'destination_longitude' => -73.9855,
        ]);

        $response->assertOk()->assertJsonStructure(['data' => ['fare', 'breakdown' => ['base', 'distance', 'time']]]);
    }

    public function test_rider_can_create_ride(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'pickup_address' => '123 Main St, New York, NY',
            'destination_latitude' => 40.7580,
            'destination_longitude' => -73.9855,
            'destination_address' => '456 Park Ave, New York, NY',
            'vehicle_type_id' => 1,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'searching_driver');
        $this->assertDatabaseHas('rides', ['rider_id' => $this->rider->id]);
    }

    public function test_rider_can_cancel_ride(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Changed my mind',
        ]);

        $response->assertOk();
        $this->assertEquals(RideStatus::Cancelled, $ride->fresh()->status);
    }
}
