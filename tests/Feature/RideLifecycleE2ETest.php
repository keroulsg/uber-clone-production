<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Wallet;
use App\Models\Setting;
use App\Models\VehicleType;
use App\Models\RideDriverOffer;
use App\Models\LedgerEntry;
use App\Models\Notification;
use App\Enums\RideStatus;
use App\Services\FareCalculationService;
use App\Services\PaymentService;
use App\Services\DriverDebtService;
use App\Services\RideService;
use App\Services\DriverMatchingService;
use App\Repositories\WalletRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class RideLifecycleE2ETest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $rider;
    protected User $driver;
    protected Driver $driverModel;
    protected VehicleType $vehicleType;
    protected Vehicle $vehicle;
    protected RideService $rideService;
    protected DriverMatchingService $matchingService;
    protected PaymentService $paymentService;
    protected DriverDebtService $debtService;
    protected WalletRepository $walletRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rideService = $this->app->make(RideService::class);
        $this->matchingService = $this->app->make(DriverMatchingService::class);
        $this->paymentService = $this->app->make(PaymentService::class);
        $this->debtService = $this->app->make(DriverDebtService::class);
        $this->walletRepo = $this->app->make(WalletRepository::class);

        $this->rider = User::factory()->create(['email' => 'rider@test.com']);
        $this->driver = User::factory()->create(['email' => 'driver@test.com']);

        Rider::factory()->create(['user_id' => $this->rider->id]);
        $this->driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'is_active' => true,
            'status' => 'approved',
            'latitude' => 30.0500,
            'longitude' => 31.2400,
        ]);

        $this->vehicleType = VehicleType::factory()->create([
            'slug' => 'economy',
            'base_fare' => 5.00,
            'per_km_rate' => 1.50,
            'per_minute_rate' => 0.25,
            'minimum_fare' => 8.00,
        ]);

        $this->vehicle = Vehicle::factory()->create([
            'driver_id' => $this->driverModel->id,
            'vehicle_type_id' => $this->vehicleType->id,
            'vehicle_class' => 'basic',
            'is_active' => true,
            'status' => 'active',
            'year' => 2015,
        ]);

        Wallet::create(['user_id' => $this->rider->id, 'balance' => 200.00, 'currency' => 'USD']);
        Wallet::create(['user_id' => $this->driver->id, 'balance' => 50.00, 'currency' => 'USD']);

        collect([
            ['key' => 'company_commission_rate', 'value' => '10'],
            ['key' => 'long_pickup_commission_rate', 'value' => '9'],
            ['key' => 'long_pickup_threshold_km', 'value' => '6'],
            ['key' => 'waiting_free_minutes', 'value' => '5'],
            ['key' => 'waiting_fee_per_minute', 'value' => '0.50'],
            ['key' => 'vehicle_class_basic_multiplier', 'value' => '1.0'],
            ['key' => 'vehicle_class_medium_multiplier', 'value' => '1.2'],
            ['key' => 'vehicle_class_premium_multiplier', 'value' => '1.5'],
        ])->each(fn($s) => Setting::updateOrCreate(['key' => $s['key']], $s + ['group' => 'pricing', 'type' => 'decimal', 'description' => '']));
    }

    public function test_wallet_ride_full_e2e_lifecycle(): void
    {
        // 1. Ride creation via API with dispatch
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.0444,
            'pickup_longitude' => 31.2357,
            'pickup_address' => 'Tahrir Square',
            'destination_latitude' => 30.0581,
            'destination_longitude' => 31.2262,
            'destination_address' => 'Zamalek',
            'vehicle_type_id' => $this->vehicleType->id,
            'payment_method' => 'wallet',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');
        $this->assertNotNull($rideId);
        $ride = Ride::findOrFail($rideId);
        $this->assertEquals('searching_driver', $ride->status->value);

        // 2. Verify offer created for exactly one driver
        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers, 'Exactly one offer should be created');
        $this->assertEquals($this->driverModel->id, $offers->first()->driver_id);

        // 3. Driver accepts ride
        $this->matchingService->acceptRide($ride, $this->driverModel->id);
        $ride->refresh();
        $this->assertEquals('driver_assigned', $ride->status->value);
        $this->assertEquals($this->driverModel->id, $ride->driver_id);

        // 4. Driver arrived
        $ride = $this->rideService->driverArrived($rideId);
        $this->assertEquals('driver_arrived', $ride->status->value);

        // 5. Driver starts ride
        $ride = $this->rideService->startRide($rideId);
        $this->assertEquals('ride_started', $ride->status->value);

        // 6. Driver completes ride
        $ride = $this->rideService->completeRide($rideId, 10.0, 15);
        $ride->refresh();
        $this->assertEquals('ride_completed', $ride->status->value);

        // 7. Payment created once
        $payment = $ride->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('completed', $payment->status->value);

        // 8. No duplicate payment on retry (exception expected for completed ride)
        try {
            $this->rideService->completeRide($rideId, 10.0, 15);
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Invalid state transition', $e->getMessage());
        }
        $this->assertCount(1, Ride::find($rideId)->payment()->get(), 'No duplicate payment on retry');

        // 9. Ledger entries created (rider debit + driver credit)
        $ledgerCount = LedgerEntry::where('reference_id', $rideId)
            ->where('reference_type', 'App\Models\Ride')
            ->count();
        $this->assertGreaterThanOrEqual(1, $ledgerCount, 'Ledger entries should exist');

        $riderLedgers = LedgerEntry::where('user_id', $this->rider->id)
            ->where('reference_id', $rideId)
            ->where('type', 'debit')
            ->get();
        $this->assertCount(1, $riderLedgers, 'Rider debit ledger entry should exist');
        $this->assertEquals($ride->actual_fare, (float) $riderLedgers->first()->amount);

        // 10. Wallet balances correct
        $riderWallet = $this->walletRepo->findByUser($this->rider->id);
        $this->assertEquals(200.00 - $ride->actual_fare, (float) $riderWallet->balance);

        $driverWallet = $this->walletRepo->findByUser($this->driver->id);
        $expectedDriverEarning = round($ride->actual_fare - ($ride->actual_fare * 0.10), 2);
        $this->assertEqualsWithDelta(50.00 + $expectedDriverEarning, (float) $driverWallet->balance, 0.01);

        // 11. Debt created for commission
        $this->assertDatabaseHas('driver_debts', [
            'ride_id' => $rideId,
            'type' => 'commission',
        ]);

        // 12. Notifications created for ride lifecycle
        $riderNotifs = Notification::where('notifiable_id', $this->rider->id)
            ->where('notifiable_type', 'App\Models\User')
            ->count();
        $this->assertGreaterThanOrEqual(3, $riderNotifs, 'Rider should have received notifications');

        $driverNotifs = Notification::where('notifiable_id', $this->driver->id)
            ->where('notifiable_type', 'App\Models\User')
            ->count();
        $this->assertGreaterThanOrEqual(1, $driverNotifs, 'Driver should have received notifications');

        // 13. Ride status history created
        $this->assertDatabaseHas('ride_status_histories', [
            'ride_id' => $rideId,
        ]);
        $statusCount = \DB::table('ride_status_histories')->where('ride_id', $rideId)->count();
        $this->assertGreaterThanOrEqual(5, $statusCount, 'Status history should track all transitions');
    }

    public function test_cash_ride_full_e2e_lifecycle(): void
    {
        $initialRiderBalance = 200.00;
        $initialDriverBalance = 50.00;

        // 1. Create cash ride via API
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides', [
            'pickup_latitude' => 30.0444,
            'pickup_longitude' => 31.2357,
            'pickup_address' => 'Tahrir Square',
            'destination_latitude' => 30.0581,
            'destination_longitude' => 31.2262,
            'destination_address' => 'Zamalek',
            'vehicle_type_id' => $this->vehicleType->id,
            'payment_method' => 'cash',
        ]);
        $response->assertCreated();
        $rideId = $response->json('data.id');
        $this->assertNotNull($rideId);
        $ride = Ride::findOrFail($rideId);

        // 2. Offer created
        $offers = RideDriverOffer::where('ride_id', $rideId)->get();
        $this->assertCount(1, $offers);
        $this->assertEquals($this->driverModel->id, $offers->first()->driver_id);

        // 3. Full lifecycle
        $this->matchingService->acceptRide($ride, $this->driverModel->id);
        $ride->refresh();
        $this->assertEquals('driver_assigned', $ride->status->value);

        $ride = $this->rideService->driverArrived($rideId);
        $this->assertEquals('driver_arrived', $ride->status->value);

        $ride = $this->rideService->startRide($rideId);
        $this->assertEquals('ride_started', $ride->status->value);

        $ride = $this->rideService->completeRide($rideId, 10.0, 15);
        $ride->refresh();
        $this->assertEquals('ride_completed', $ride->status->value);

        // 4. Payment created
        $payment = $ride->payment;
        $this->assertNotNull($payment);
        $this->assertEquals('completed', $payment->status->value);
        $this->assertEquals(0, $payment->driver_amount);

        // 5. No wallet debit for rider (cash ride)
        $riderWallet = $this->walletRepo->findByUser($this->rider->id);
        $this->assertEquals($initialRiderBalance, (float) $riderWallet->balance, 'Rider wallet unchanged for cash');

        // 6. No wallet credit for driver (cash collected directly)
        $driverWallet = $this->walletRepo->findByUser($this->driver->id);
        $this->assertEquals($initialDriverBalance, (float) $driverWallet->balance, 'Driver wallet unchanged for cash');

        // 7. Ledger entries for cash collection + commission debt
        $cashLedgers = LedgerEntry::where('reference_id', $rideId)
            ->where('type', 'cash_payment')
            ->get();
        $this->assertCount(1, $cashLedgers, 'Cash payment ledger entry should exist');
        $this->assertEquals($ride->actual_fare, (float) $cashLedgers->first()->amount);

        $commissionLedgers = LedgerEntry::where('reference_id', $payment->id)
            ->where('type', 'commission_debt')
            ->get();
        $this->assertCount(1, $commissionLedgers, 'Commission debt ledger entry should exist');

        // 8. Debt created for commission
        $this->assertDatabaseHas('driver_debts', [
            'ride_id' => $rideId,
            'type' => 'commission',
        ]);

        // 9. Notifications created
        $riderNotifs = Notification::where('notifiable_id', $this->rider->id)
            ->where('notifiable_type', 'App\Models\User')
            ->count();
        $this->assertGreaterThanOrEqual(3, $riderNotifs, 'Rider should have notifications');

        $driverNotifs = Notification::where('notifiable_id', $this->driver->id)
            ->where('notifiable_type', 'App\Models\User')
            ->count();
        $this->assertGreaterThanOrEqual(2, $driverNotifs, 'Driver should have ride + debt notifications');

        // 10. Ride status history
        $statusCount = \DB::table('ride_status_histories')->where('ride_id', $rideId)->count();
        $this->assertGreaterThanOrEqual(5, $statusCount, 'Status history should track all transitions');
    }
}
