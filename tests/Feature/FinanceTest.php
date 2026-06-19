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

        $this->assertEquals($expectedCommission, $payment->platform_fee);
        $this->assertEquals($expectedDriverAmount, $payment->driver_amount);
        $this->assertEquals($expectedCommission, $payment->company_commission);

        $riderWallet = $this->walletRepo->findByUser($this->rider->id);
        $driverWallet = $this->walletRepo->findByUser($this->driver->id);

        $this->assertEquals(200.00 - $expectedTotalFare, (float) $riderWallet->balance);
        $this->assertEquals(50.00 + $expectedDriverAmount, (float) $driverWallet->balance);

        $this->assertDatabaseHas('driver_debts', [
            'ride_id' => $ride->id,
            'type' => 'commission',
            'amount' => $expectedCommission,
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

    public function test_commission_rate_drops_to_9_percent_for_long_pickup(): void
    {
        $rate = $this->fareCalc->getCommissionRate(8.0);
        $this->assertEquals(0.09, $rate);
    }

    public function test_commission_rate_stays_10_percent_for_short_pickup(): void
    {
        $rate = $this->fareCalc->getCommissionRate(3.0);
        $this->assertEquals(0.10, $rate);
    }

    public function test_commission_rate_at_threshold_boundary(): void
    {
        $rate = $this->fareCalc->getCommissionRate(6.0);
        $this->assertEquals(0.10, $rate, 'At exactly threshold, rate should remain default');

        $rate = $this->fareCalc->getCommissionRate(6.1);
        $this->assertEquals(0.09, $rate, 'Above threshold, rate should drop');
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

    public function test_wallet_ride_commission_in_wallet_and_debt_match(): void
    {
        $ride = $this->createRideThroughFlow(10, 15, 'wallet');

        $this->rideService->completeRide($ride->id, 10, 15);

        $ride->refresh();
        $payment = $ride->payment;

        $debt = \App\Models\DriverDebt::where('ride_id', $ride->id)->where('type', 'commission')->first();

        $this->assertNotNull($debt);
        $this->assertEquals($payment->platform_fee, $debt->amount);
        $this->assertEquals($payment->company_commission, $debt->amount);
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
}
