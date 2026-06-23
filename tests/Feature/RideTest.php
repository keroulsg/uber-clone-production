<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\CancellationReason;
use App\Models\RideDriverOffer;
use App\Models\Wallet;
use App\Models\LedgerEntry;
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

    public function test_rider_can_cancel_pending_searching_ride_with_valid_rider_reason(): void
    {
        $reason = CancellationReason::create([
            'actor' => 'rider',
            'reason' => 'Rider reason description',
            'is_active' => true,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Rider reason text',
            'cancellation_reason_id' => $reason->id,
        ]);

        $response->assertOk();
        $this->assertEquals(RideStatus::Cancelled, $ride->fresh()->status);
        $this->assertEquals($reason->id, $ride->fresh()->cancellation_reason_id);
    }

    public function test_rider_cannot_cancel_started_ride(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::RideStarted,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Attempt cancel started ride',
        ]);

        $response->assertStatus(422);
        $this->assertEquals(RideStatus::RideStarted, $ride->fresh()->status);
    }

    public function test_rider_cannot_cancel_completed_ride(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::RideCompleted,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Attempt cancel completed ride',
        ]);

        $response->assertStatus(422);
        $this->assertEquals(RideStatus::RideCompleted, $ride->fresh()->status);
    }

    public function test_duplicate_cancel_is_idempotent_safe(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response1 = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Double cancel first attempt',
        ]);
        $response1->assertOk();

        $response2 = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Double cancel second attempt',
        ]);
        $response2->assertOk();
        
        $this->assertEquals(RideStatus::Cancelled, $ride->fresh()->status);
    }

    public function test_invalid_cancellation_reason_rejected(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Invalid reason test',
            'cancellation_reason_id' => 99999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cancellation_reason_id']);
    }

    public function test_driver_only_reason_rejected_for_rider_cancellation(): void
    {
        $reason = CancellationReason::create([
            'actor' => 'driver',
            'reason' => 'Driver only reason description',
            'is_active' => true,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Driver only reason test',
            'cancellation_reason_id' => $reason->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cancellation_reason_id']);
    }

    public function test_inactive_cancellation_reason_rejected(): void
    {
        $reason = CancellationReason::create([
            'actor' => 'rider',
            'reason' => 'Inactive reason description',
            'is_active' => false,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Inactive reason test',
            'cancellation_reason_id' => $reason->id,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['cancellation_reason_id']);
    }

    public function test_cancellation_penalty_deducted_once_when_driver_is_within_150_meters(): void
    {
        $vehicleType = VehicleType::factory()->create([
            'cancellation_fee' => 7.50,
            'slug' => 'comfort'
        ]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'latitude' => 40.7128,
            'longitude' => -74.0060,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'status' => 'approved',
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'driver_id' => $driverModel->id,
            'status' => RideStatus::DriverAssigned,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'vehicle_type_id' => $vehicleType->id,
        ]);

        $wallet = Wallet::create([
            'user_id' => $this->rider->id,
            'balance' => 20.00,
            'currency' => 'EGP',
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Deduct penalty test',
        ]);

        $response->assertOk();
        $this->assertEquals(12.50, (float) $wallet->fresh()->balance);

        // Check ledger entry
        $this->assertDatabaseHas('ledger_entries', [
            'user_id' => $this->rider->id,
            'type' => 'debit',
            'amount' => 7.50,
            'balance_before' => 20.00,
            'balance_after' => 12.50,
        ]);
    }

    public function test_cancellation_penalty_does_not_create_negative_wallet_balance(): void
    {
        $vehicleType = VehicleType::factory()->create([
            'cancellation_fee' => 10.00,
            'slug' => 'premium'
        ]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'latitude' => 40.7128,
            'longitude' => -74.0060,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'driver_id' => $driverModel->id,
            'status' => RideStatus::DriverAssigned,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'vehicle_type_id' => $vehicleType->id,
        ]);

        $wallet = Wallet::create([
            'user_id' => $this->rider->id,
            'balance' => 3.00,
            'currency' => 'EGP',
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Not enough balance test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['message' => 'Insufficient wallet balance to cover the cancellation fee.']);
        $this->assertEquals(3.00, (float) $wallet->fresh()->balance);
    }

    public function test_duplicate_cancellation_does_not_duplicate_wallet_debit(): void
    {
        $vehicleType = VehicleType::factory()->create([
            'cancellation_fee' => 5.00,
            'slug' => 'motorcycle'
        ]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'latitude' => 40.7128,
            'longitude' => -74.0060,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'driver_id' => $driverModel->id,
            'status' => RideStatus::DriverAssigned,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'vehicle_type_id' => $vehicleType->id,
        ]);

        $wallet = Wallet::create([
            'user_id' => $this->rider->id,
            'balance' => 15.00,
            'currency' => 'EGP',
        ]);

        // First cancel
        $response1 = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Cancel with penalty',
        ]);
        $response1->assertOk();
        $this->assertEquals(10.00, (float) $wallet->fresh()->balance);

        // Second cancel
        $response2 = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Cancel with penalty duplicate',
        ]);
        $response2->assertOk();
        $this->assertEquals(10.00, (float) $wallet->fresh()->balance);
    }

    public function test_duplicate_cancellation_does_not_duplicate_ledger_entry(): void
    {
        $vehicleType = VehicleType::factory()->create([
            'cancellation_fee' => 5.00,
        ]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'latitude' => 40.7128,
            'longitude' => -74.0060,
        ]);

        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'driver_id' => $driverModel->id,
            'status' => RideStatus::DriverAssigned,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'vehicle_type_id' => $vehicleType->id,
        ]);

        Wallet::create([
            'user_id' => $this->rider->id,
            'balance' => 10.00,
            'currency' => 'EGP',
        ]);

        $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Cancel with penalty',
        ])->assertOk();

        $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Cancel with penalty second time',
        ])->assertOk();

        $ledgerCount = LedgerEntry::where('user_id', $this->rider->id)
            ->where('description', 'like', '%Cancellation penalty%')
            ->count();
        $this->assertEquals(1, $ledgerCount);
    }

    public function test_driver_can_reject_own_pending_offer(): void
    {
        $ride = Ride::factory()->create(['status' => RideStatus::SearchingDriver]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'status' => 'approved',
        ]);

        $offer = RideDriverOffer::create([
            'ride_id' => $ride->id,
            'driver_id' => $driverModel->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/driver/rides/{$ride->id}/reject");

        $response->assertOk();
        $this->assertEquals('rejected', $offer->fresh()->status);
    }

    public function test_driver_cannot_reject_another_driver_offer(): void
    {
        $ride = Ride::factory()->create(['status' => RideStatus::SearchingDriver]);

        $driverModel1 = Driver::factory()->create([
            'user_id' => $this->driver->id,
        ]);

        $otherDriverUser = User::factory()->create();
        $driverModel2 = Driver::factory()->create([
            'user_id' => $otherDriverUser->id,
        ]);

        $offer = RideDriverOffer::create([
            'ride_id' => $ride->id,
            'driver_id' => $driverModel2->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/driver/rides/{$ride->id}/reject");

        $response->assertStatus(404);
        $this->assertEquals('pending', $offer->fresh()->status);
    }

    public function test_driver_cannot_reject_non_pending_offer(): void
    {
        $ride = Ride::factory()->create(['status' => RideStatus::SearchingDriver]);

        $driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
        ]);

        $offer = RideDriverOffer::create([
            'ride_id' => $ride->id,
            'driver_id' => $driverModel->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAs($this->driver)->postJson("/api/v1/driver/rides/{$ride->id}/reject");

        $response->assertStatus(400);
        $this->assertEquals('accepted', $offer->fresh()->status);
    }

    public function test_driver_reject_triggers_existing_sequential_dispatch_safely(): void
    {
        $driverModel1 = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'latitude' => 30.0444,
            'longitude' => 31.2357,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'status' => 'approved',
        ]);

        $otherDriverUser = User::factory()->create();
        $driverModel2 = Driver::factory()->create([
            'user_id' => $otherDriverUser->id,
            'latitude' => 30.0450,
            'longitude' => 31.2360,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'status' => 'approved',
        ]);

        $vt = VehicleType::first(); // economy was created in setUp
        \App\Models\Vehicle::factory()->create([
            'driver_id' => $driverModel1->id,
            'vehicle_type_id' => $vt->id,
            'is_active' => true,
            'status' => 'active',
        ]);
        \App\Models\Vehicle::factory()->create([
            'driver_id' => $driverModel2->id,
            'vehicle_type_id' => $vt->id,
            'is_active' => true,
            'status' => 'active',
        ]);

        $ride = Ride::factory()->create([
            'pickup_latitude' => 30.0440,
            'pickup_longitude' => 31.2350,
            'status' => RideStatus::SearchingDriver,
            'vehicle_type_id' => $vt->id,
        ]);

        $offer1 = RideDriverOffer::create([
            'ride_id' => $ride->id,
            'driver_id' => $driverModel1->id,
            'status' => 'pending',
        ]);

        // Driver 1 rejects
        $response = $this->actingAs($this->driver)->postJson("/api/v1/driver/rides/{$ride->id}/reject");
        $response->assertOk();

        // The offer status should be rejected
        $this->assertEquals('rejected', $offer1->fresh()->status);

        // A new offer should be dispatched to Driver 2 automatically
        $this->assertDatabaseHas('ride_driver_offers', [
            'ride_id' => $ride->id,
            'driver_id' => $driverModel2->id,
            'status' => 'pending',
        ]);
    }

    public function test_unauthorized_user_cannot_cancel_another_user_ride(): void
    {
        $otherUser = User::factory()->create();

        $ride = Ride::factory()->create([
            'rider_id' => $otherUser->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Steal cancel attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_cancellation_does_not_create_payment_records_unexpectedly(): void
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'status' => RideStatus::SearchingDriver,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$ride->id}/cancel", [
            'cancellation_reason' => 'Safe cancel no payment creation',
        ]);

        $response->assertOk();

        $this->assertDatabaseMissing('payments', [
            'ride_id' => $ride->id,
        ]);
        $this->assertDatabaseMissing('driver_debts', [
            'ride_id' => $ride->id,
        ]);
    }
}
