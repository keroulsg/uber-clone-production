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
use App\Enums\RideStatus;
use App\Services\FareCalculationService;
use App\Services\PaymentService;
use App\Services\DriverDebtService;
use App\Services\RideService;
use App\Repositories\WalletRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class FinanceTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $rider;
    protected User $driver;
    protected Driver $driverModel;
    protected VehicleType $vehicleType;
    protected Vehicle $vehicle;
    protected FareCalculationService $fareCalc;
    protected PaymentService $paymentService;
    protected RideService $rideService;
    protected DriverDebtService $debtService;
    protected WalletRepository $walletRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fareCalc = $this->app->make(FareCalculationService::class);
        $this->paymentService = $this->app->make(PaymentService::class);
        $this->rideService = $this->app->make(RideService::class);
        $this->debtService = $this->app->make(DriverDebtService::class);
        $this->walletRepo = $this->app->make(WalletRepository::class);

        $this->rider = User::factory()->create();
        $this->driver = User::factory()->create();

        Rider::factory()->create(['user_id' => $this->rider->id]);
        $this->driverModel = Driver::factory()->create(['user_id' => $this->driver->id]);

        $this->vehicleType = VehicleType::factory()->create([
            'slug' => 'economy',
            'base_fare' => 5.00,
            'per_km_rate' => 1.50,
            'per_minute_rate' => 0.25,
            'minimum_fare' => 8.00,
        ]);

        $this->vehicle = Vehicle::factory()->create([
            'driver_id' => $this->driverModel->id,
            'vehicle_class' => 'basic',
            'year' => 2015,
        ]);

        Wallet::create(['user_id' => $this->rider->id, 'balance' => 200.00, 'currency' => 'USD']);
        Wallet::create(['user_id' => $this->driver->id, 'balance' => 50.00, 'currency' => 'USD']);

        collect([
            ['key' => 'default_commission_rate', 'value' => '10'],
            ['key' => 'company_commission_rate', 'value' => '10'],
            ['key' => 'long_pickup_commission_rate', 'value' => '8'],
            ['key' => 'long_pickup_threshold_km', 'value' => '5'],
            ['key' => 'default_fuel_price', 'value' => '20'],
            ['key' => 'default_fuel_consumption', 'value' => '8.5'],
            ['key' => 'waiting_free_minutes', 'value' => '5'],
            ['key' => 'waiting_fee_per_minute', 'value' => '0.50'],
            ['key' => 'vehicle_class_basic_multiplier', 'value' => '1.0'],
            ['key' => 'vehicle_class_medium_multiplier', 'value' => '1.2'],
            ['key' => 'vehicle_class_premium_multiplier', 'value' => '1.5'],
        ])->each(fn($s) => Setting::updateOrCreate(['key' => $s['key']], $s + ['group' => 'pricing', 'type' => 'decimal', 'description' => '']));
    }

    protected function createRideThroughFlow(float $distanceKm, int $durationMin, string $paymentMethod = 'wallet', ?int $waitingMinutes = null, ?int $driverPickupDistanceKm = null): Ride
    {
        $ride = Ride::factory()->create([
            'rider_id' => $this->rider->id,
            'driver_id' => $this->driverModel->id,
            'vehicle_type_id' => $this->vehicleType->id,
            'vehicle_id' => $this->vehicle->id,
            'estimated_distance' => $distanceKm,
            'estimated_duration' => $durationMin,
            'estimated_fare' => 20.00,
            'status' => RideStatus::RideStarted,
            'started_at' => now(),
            'payment_method' => $paymentMethod,
            'waiting_started_at' => $waitingMinutes !== null ? now()->subMinutes($waitingMinutes) : null,
            'driver_pickup_distance_km' => $driverPickupDistanceKm,
        ]);

        return $ride;
    }

    public function test_wallet_ride_payment_commission_split(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $this->rideService->completeRide($ride->id, 10, 15);

        $ride->refresh();
        $payment = $ride->payment;

        $this->assertNotNull($payment, 'Payment should exist');
        $this->assertEquals('completed', $payment->status->value);
        $this->assertEquals(0.10, $payment->applied_commission_rate);

        $expectedTotalFare = $ride->actual_fare;
        $expectedCommission = round($expectedTotalFare * 0.10, 2);
        $expectedDriverAmount = round($expectedTotalFare - $expectedCommission, 2);

        $this->assertEqualsWithDelta($expectedCommission, $payment->platform_fee, 0.01);
        $this->assertEqualsWithDelta($expectedDriverAmount, $payment->driver_amount, 0.01);
        $this->assertEqualsWithDelta($expectedCommission, $payment->company_commission, 0.01);

        $riderWallet = $this->walletRepo->findByUser($this->rider->id);
        $driverWallet = $this->walletRepo->findByUser($this->driver->id);

        $this->assertEqualsWithDelta(200.00 - $expectedTotalFare, (float) $riderWallet->balance, 0.01);
        $this->assertEqualsWithDelta(50.00 + $expectedDriverAmount, (float) $driverWallet->balance, 0.01);

        $this->assertDatabaseMissing('driver_debts', [
            'ride_id' => $ride->id,
            'type' => 'commission',
        ]);
    }

    public function test_cash_ride_no_wallet_debit_creates_debt(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'cash');

        $this->rideService->completeRide($ride->id, 10, 15);

        $ride->refresh();
        $payment = $ride->payment;

        $this->assertNotNull($payment);
        $this->assertEquals('completed', $payment->status->value);

        $expectedCommission = round($ride->actual_fare * 0.10, 2);

        $this->assertGreaterThan(0, $payment->driver_amount, 'Cash ride driver_amount should reflect earnings');
        $this->assertEquals($expectedCommission, $payment->platform_fee);

        $riderWallet = $this->walletRepo->findByUser($this->rider->id);
        $this->assertEquals(200.00, (float) $riderWallet->balance);

        $driverWallet = $this->walletRepo->findByUser($this->driver->id);
        $this->assertEquals(50.00, (float) $driverWallet->balance);

        $this->assertDatabaseHas('driver_debts', [
            'ride_id' => $ride->id,
            'type' => 'commission',
            'amount' => $expectedCommission,
        ]);
    }

    public function test_commission_rate_default_is_10_percent(): void
    {
        $rate = $this->fareCalc->getCommissionRate(null);
        $this->assertEquals(0.10, $rate);
    }

    public function test_commission_rate_drops_to_8_percent_for_long_pickup(): void
    {
        $rate = $this->fareCalc->getCommissionRate(8.0);
        $this->assertEquals(0.08, $rate);
    }

    public function test_commission_rate_stays_10_percent_for_short_pickup(): void
    {
        $rate = $this->fareCalc->getCommissionRate(3.0);
        $this->assertEquals(0.10, $rate);
    }

    public function test_commission_rate_at_threshold_boundary(): void
    {
        $rate = $this->fareCalc->getCommissionRate(5.0);
        $this->assertEquals(0.10, $rate, 'At exactly threshold, rate should remain default');

        $rate = $this->fareCalc->getCommissionRate(5.1);
        $this->assertEquals(0.08, $rate, 'Above threshold, rate should drop to 8%');
    }

    public function test_vehicle_class_multipliers_affect_fare(): void
    {
        $this->vehicle->update(['vehicle_class' => 'basic', 'year' => 2015]);
        $basicFare = $this->fareCalc->calculateEstimatedFare($this->vehicleType, 10, 15, $this->vehicle);

        $this->vehicle->update(['vehicle_class' => 'medium', 'year' => 2018]);
        $mediumFare = $this->fareCalc->calculateEstimatedFare($this->vehicleType, 10, 15, $this->vehicle);

        $this->vehicle->update(['vehicle_class' => 'premium', 'year' => 2023]);
        $premiumFare = $this->fareCalc->calculateEstimatedFare($this->vehicleType, 10, 15, $this->vehicle);

        $this->assertEquals(1.0, $basicFare['class_multiplier']);
        $this->assertEquals(1.2, $mediumFare['class_multiplier']);
        $this->assertEquals(1.5, $premiumFare['class_multiplier']);

        $base = $this->vehicleType->base_fare + (10 * $this->vehicleType->per_km_rate) + (15 * $this->vehicleType->per_minute_rate) + ($basicFare['fuel_cost'] ?? 0);
        $this->assertEquals(round($base * 1.0, 2), $basicFare['subtotal']);
        $this->assertEquals(round($base * 1.2, 2), $mediumFare['subtotal']);
        $this->assertEqualsWithDelta(round($base * 1.5, 2), $premiumFare['subtotal'], 0.01);
    }

    public function test_waiting_fee_calculation(): void
    {
        $this->assertEquals(0, $this->fareCalc->calculateWaitingFee(0));
        $this->assertEquals(0, $this->fareCalc->calculateWaitingFee(3));
        $this->assertEquals(0, $this->fareCalc->calculateWaitingFee(5));
        $this->assertEquals(0.50, $this->fareCalc->calculateWaitingFee(6));
        $this->assertEquals(2.50, $this->fareCalc->calculateWaitingFee(10));
        $this->assertEquals(5.00, $this->fareCalc->calculateWaitingFee(15));
    }

    public function test_wallet_ride_does_not_create_commission_debt(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $this->rideService->completeRide($ride->id, 10, 15);

        $ride->refresh();
        $payment = $ride->payment;

        $debt = \App\Models\DriverDebt::where('ride_id', $ride->id)->where('type', 'commission')->first();

        $this->assertNull($debt, 'Wallet ride must not create commission debt');
    }

    public function test_estimated_fare_breakdown_structure(): void
    {
        $fare = $this->fareCalc->calculateEstimatedFare($this->vehicleType, 10, 15, $this->vehicle);

        $this->assertArrayHasKey('base_fare', $fare);
        $this->assertArrayHasKey('distance_fare', $fare);
        $this->assertArrayHasKey('time_fare', $fare);
        $this->assertArrayHasKey('class_multiplier', $fare);
        $this->assertArrayHasKey('subtotal', $fare);
        $this->assertArrayHasKey('waiting_fee', $fare);
        $this->assertArrayHasKey('total_fare', $fare);
        $this->assertArrayHasKey('commission_rate', $fare);
        $this->assertArrayHasKey('company_commission', $fare);
        $this->assertArrayHasKey('driver_amount', $fare);

        $this->assertGreaterThan(0, $fare['total_fare']);
        $this->assertGreaterThan(0, $fare['company_commission']);
        $this->assertGreaterThan(0, $fare['driver_amount']);
        $this->assertEqualsWithDelta(
            $fare['total_fare'] - $fare['company_commission'],
            $fare['driver_amount'],
            0.01
        );
    }

    public function test_payment_service_get_commission_rate(): void
    {
        $rate = $this->paymentService->getCommissionRate();
        $this->assertEquals(0.10, $rate);
    }

    public function test_driver_debt_creation_and_outstanding(): void
    {
        $ride = $this->createRideThroughFlow(5, 10, 'cash');
        $this->rideService->completeRide($ride->id, 5, 10);

        $ride->refresh();
        $expectedDebt = round($ride->actual_fare * 0.10, 2);
        $totalOutstanding = $this->debtService->getTotalOutstanding($this->driverModel->id);

        $this->assertGreaterThan(0, $totalOutstanding);
        $this->assertEquals($expectedDebt, $totalOutstanding);
    }

    public function test_driver_payout_api(): void
    {
        $response = $this->actingAs($this->driver)->postJson('/api/v1/driver/payout', [
            'payout_method' => 'vodafone_cash',
            'payout_phone' => '+201234567890',
            'payout_account_name' => 'Test Driver',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('drivers', [
            'id' => $this->driverModel->id,
            'payout_method' => 'vodafone_cash',
            'payout_phone' => '+201234567890',
        ]);
    }

    public function test_wallet_topup_amount_must_be_positive(): void
    {
        $response = $this->actingAs($this->rider, 'sanctum')
            ->postJson('/api/v1/payments/wallet/fund', ['amount' => -10.00]);
        $response->assertStatus(422);

        $responseZero = $this->actingAs($this->rider, 'sanctum')
            ->postJson('/api/v1/payments/wallet/fund', ['amount' => 0]);
        $responseZero->assertStatus(422);
    }

    public function test_wallet_topup_updates_wallet_once_and_creates_ledger(): void
    {
        $wallet = \App\Models\Wallet::where('user_id', $this->rider->id)->first();
        $this->assertEquals(200.00, (float)$wallet->balance);

        $response = $this->actingAs($this->rider, 'sanctum')
            ->postJson('/api/v1/payments/wallet/fund', ['amount' => 50.00]);
        $response->assertOk();

        $wallet->refresh();
        $this->assertEquals(250.00, (float)$wallet->balance);

        $this->assertDatabaseHas('ledger_entries', [
            'user_id' => $this->rider->id,
            'type' => 'credit',
            'amount' => 50.00,
            'description' => 'Wallet top-up',
        ]);
    }

    public function test_wallet_payment_fails_with_insufficient_balance(): void
    {
        $riderWallet = \App\Models\Wallet::where('user_id', $this->rider->id)->first();
        $riderWallet->update(['balance' => 5.00]); // Low balance

        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);

        $response->assertStatus(402);
        $response->assertJsonFragment(['success' => false, 'message' => 'Insufficient wallet balance. Please choose cash or top up wallet.']);
    }

    public function test_wallet_payment_debits_rider_wallet_once_and_credits_driver_once(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response->assertOk();

        $riderWallet = \App\Models\Wallet::where('user_id', $this->rider->id)->first();
        $driverWallet = \App\Models\Wallet::where('user_id', $this->driver->id)->first();

        // Base 5.00, Distance 10*1.5=15.00, Duration 15*0.25=3.75, Fuel 17.00. Total = 40.75 EGP.
        $this->assertEquals(159.25, (float)$riderWallet->balance);

        // Driver gets 40.75 - 10% commission (4.08) = 36.67. Start balance 50.00. Total = 86.67.
        $this->assertEquals(86.67, (float)$driverWallet->balance);

        $this->assertEquals(1, \App\Models\Payment::where('ride_id', $ride->id)->count());
    }

    public function test_duplicate_ride_complete_does_not_duplicate_wallet_debit(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $response1 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response1->assertOk();

        $response2 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response2->assertStatus(200);
        $response2->assertJsonFragment(['success' => true, 'message' => 'Ride already completed']);

        $riderWallet = \App\Models\Wallet::where('user_id', $this->rider->id)->first();
        $this->assertEquals(159.25, (float)$riderWallet->balance);
    }

    public function test_cash_ride_creates_one_payment_record_and_one_commission_debt(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'cash');

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response->assertOk();

        $this->assertEquals(1, \App\Models\Payment::where('ride_id', $ride->id)->count());
        $this->assertEquals(1, \App\Models\DriverDebt::where('ride_id', $ride->id)->where('type', 'commission')->count());

        $debt = \App\Models\DriverDebt::where('ride_id', $ride->id)->where('type', 'commission')->first();
        $this->assertEquals(4.08, (float)$debt->amount);
    }

    public function test_duplicate_cash_complete_does_not_duplicate_payment_or_debt(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'cash');

        $response1 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response1->assertOk();

        $response2 = $this->actingAs($this->driver, 'sanctum')
            ->postJson("/api/v1/driver/rides/{$ride->id}/complete", [
                'actual_distance' => 10,
                'actual_duration' => 15,
            ]);
        $response2->assertStatus(200);
        $response2->assertJsonFragment(['success' => true, 'message' => 'Ride already completed']);

        $this->assertEquals(1, \App\Models\Payment::where('ride_id', $ride->id)->count());
        $this->assertEquals(1, \App\Models\DriverDebt::where('ride_id', $ride->id)->where('type', 'commission')->count());
    }

    public function test_driver_cannot_create_settlement_above_outstanding_debt(): void
    {
        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson('/api/v1/driver/settlements', [
                'amount' => 50.00,
                'method' => 'instapay',
                'reference' => 'TXN12345',
            ]);
        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
    }

    public function test_driver_cannot_create_settlement_for_another_driver(): void
    {
        \App\Models\DriverDebt::create([
            'driver_id' => $this->driverModel->id,
            'type' => 'commission',
            'amount' => 100.00,
        ]);

        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson('/api/v1/driver/settlements', [
                'amount' => 50.00,
                'method' => 'instapay',
                'reference' => 'TXN12345',
            ]);
        $response->assertStatus(201);

        $settlement = \App\Models\DriverSettlement::first();
        $this->assertEquals($this->driverModel->id, $settlement->driver_id);
    }

    public function test_rider_cannot_access_settlement_routes(): void
    {
        $responseGet = $this->actingAs($this->rider, 'sanctum')
            ->getJson('/api/v1/driver/settlements');
        $responseGet->assertStatus(403);

        $responsePost = $this->actingAs($this->rider, 'sanctum')
            ->postJson('/api/v1/driver/settlements', [
                'amount' => 10.00,
                'method' => 'cash',
            ]);
        $responsePost->assertStatus(403);
    }

    public function test_admin_can_approve_settlement(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        \App\Models\DriverDebt::create([
            'driver_id' => $this->driverModel->id,
            'type' => 'commission',
            'amount' => 100.00,
        ]);

        $settlement = \App\Models\DriverSettlement::create([
            'driver_id' => $this->driverModel->id,
            'amount' => 100.00,
            'method' => 'instapay',
            'reference' => 'TXN123',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/settlements/{$settlement->id}/approve");
        $response->assertOk();

        $settlement->refresh();
        $this->assertEquals('approved', $settlement->status);
        $this->assertEquals($admin->id, $settlement->reviewed_by);

        $this->assertDatabaseMissing('driver_debts', [
            'driver_id' => $this->driverModel->id,
            'paid_at' => null,
        ]);
    }

    public function test_duplicate_settlement_approval_does_not_double_pay_debts(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        \App\Models\DriverDebt::create([
            'driver_id' => $this->driverModel->id,
            'type' => 'commission',
            'amount' => 100.00,
        ]);

        $settlement = \App\Models\DriverSettlement::create([
            'driver_id' => $this->driverModel->id,
            'amount' => 100.00,
            'method' => 'instapay',
            'reference' => 'TXN123',
            'status' => 'pending',
        ]);

        $response1 = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/settlements/{$settlement->id}/approve");
        $response1->assertOk();

        $response2 = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/settlements/{$settlement->id}/approve");
        $response2->assertStatus(422);
    }

    public function test_rejected_settlement_does_not_pay_debts(): void
    {
        $admin = User::factory()->create();
        $admin->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        \App\Models\DriverDebt::create([
            'driver_id' => $this->driverModel->id,
            'type' => 'commission',
            'amount' => 100.00,
        ]);

        $settlement = \App\Models\DriverSettlement::create([
            'driver_id' => $this->driverModel->id,
            'amount' => 100.00,
            'method' => 'instapay',
            'reference' => 'TXN123',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/admin/settlements/{$settlement->id}/reject", [
                'rejection_reason' => 'Invalid reference number',
            ]);
        $response->assertOk();

        $settlement->refresh();
        $this->assertEquals('rejected', $settlement->status);

        $this->assertDatabaseHas('driver_debts', [
            'driver_id' => $this->driverModel->id,
            'paid_at' => null,
            'amount' => 100.00,
        ]);
    }

    public function test_negative_settlement_amount_rejected(): void
    {
        $response = $this->actingAs($this->driver, 'sanctum')
            ->postJson('/api/v1/driver/settlements', [
                'amount' => -50.00,
                'method' => 'cash',
            ]);
        $response->assertStatus(422);
    }

    public function test_protected_finance_routes_return_correct_auth_status(): void
    {
        $this->getJson('/api/v1/payments/wallet')->assertStatus(401);
        $this->postJson('/api/v1/payments/wallet/fund', ['amount' => 50.00])->assertStatus(401);

        $this->actingAs($this->driver, 'sanctum')
            ->getJson('/api/v1/admin/settlements')
            ->assertStatus(403);
    }

    public function test_wallet_balance_cannot_become_invalid(): void
    {
        $riderWallet = \App\Models\Wallet::where('user_id', $this->rider->id)->first();
        $riderWallet->update(['balance' => 0.00]);

        $deducted = $this->walletRepo->deductBalance($this->rider->id, 50.00);
        $this->assertFalse($deducted);
        
        $riderWallet->refresh();
        $this->assertEquals(0.00, (float)$riderWallet->balance);
    }
}
