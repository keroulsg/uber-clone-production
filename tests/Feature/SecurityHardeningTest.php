<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\Rider;
use App\Models\Vehicle;
use App\Models\Ride;
use App\Models\Payment;
use App\Models\Ticket;
use App\Models\AuditLog;
use App\Models\VehicleType;
use App\Services\AuditLogService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected User $riderUserA;
    protected User $riderUserB;
    protected User $driverUserA;
    protected User $driverUserB;
    protected User $adminUser;

    protected Driver $driverA;
    protected Driver $driverB;
    protected Rider $riderA;
    protected Rider $riderB;
    protected VehicleType $vehicleType;

    protected function setUp(): void
    {
        parent::setUp();

        // Enable necessary feature flags
        app(\App\Services\FeatureFlagService::class)->enable('saved_places');
        app(\App\Services\FeatureFlagService::class)->enable('driver_settlements');

        // Create Spatie Roles
        Role::findOrCreate('rider');
        Role::findOrCreate('driver');
        Role::findOrCreate('admin');

        // Create VehicleType
        $this->vehicleType = VehicleType::create([
            'name' => 'Standard',
            'slug' => 'standard',
            'base_fare' => 10.00,
            'per_km_rate' => 2.00,
            'per_minute_rate' => 0.50,
            'minimum_fare' => 10.00,
            'is_active' => true,
        ]);

        // Setup Riders
        $this->riderUserA = User::factory()->create(['is_active' => true]);
        $this->riderUserA->roles()->attach(Role::findByName('rider')->id);
        $this->riderA = Rider::create(['user_id' => $this->riderUserA->id]);

        $this->riderUserB = User::factory()->create(['is_active' => true]);
        $this->riderUserB->roles()->attach(Role::findByName('rider')->id);
        $this->riderB = Rider::create(['user_id' => $this->riderUserB->id]);

        // Setup Drivers
        $this->driverUserA = User::factory()->create(['is_active' => true]);
        $this->driverUserA->roles()->attach(Role::findByName('driver')->id);
        $this->driverA = Driver::create(['user_id' => $this->driverUserA->id, 'status' => 'approved', 'is_approved' => true, 'is_verified' => true, 'is_active' => true]);

        $this->driverUserB = User::factory()->create(['is_active' => true]);
        $this->driverUserB->roles()->attach(Role::findByName('driver')->id);
        $this->driverB = Driver::create(['user_id' => $this->driverUserB->id, 'status' => 'approved', 'is_approved' => true, 'is_verified' => true, 'is_active' => true]);

        // Setup Admin
        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->roles()->attach(Role::findByName('admin')->id);
    }

    public function test_security_headers_are_present(): void
    {
        $response = $this->getJson('/api/v1/vehicle-types');

        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Permissions-Policy');
        $response->assertHeader('Content-Security-Policy');
    }

    public function test_hsts_appears_only_on_secure_requests(): void
    {
        // 1. Unsecure request (HTTP)
        $response = $this->getJson('/api/v1/vehicle-types');
        $response->assertHeaderMissing('Strict-Transport-Security');

        // 2. Secure request (HTTPS)
        $response = $this->get('https://localhost/api/v1/vehicle-types');
        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    public function test_rider_cannot_access_another_rider_payment(): void
    {
        $ride = Ride::create([
            'booking_id' => 'RIDE-000001',
            'rider_id' => $this->riderUserA->id,
            'status' => \App\Enums\RideStatus::RideCompleted,
            'pickup_latitude' => 30.0,
            'pickup_longitude' => 31.0,
            'destination_latitude' => 30.1,
            'destination_longitude' => 31.1,
            'pickup_address' => 'Cairo',
            'destination_address' => 'Giza',
            'vehicle_type_id' => $this->vehicleType->id,
            'payment_method' => 'wallet',
        ]);

        $payment = Payment::create([
            'ride_id' => $ride->id,
            'amount' => 50.00,
            'currency' => 'EGP',
            'status' => \App\Enums\PaymentStatus::Completed,
            'payment_method' => 'wallet',
        ]);

        // Rider A can access own payment
        $response = $this->actingAs($this->riderUserA, 'sanctum')
            ->getJson("/api/v1/payments/{$payment->id}");
        $response->assertOk();

        // Rider B cannot access Rider A's payment (403)
        $response = $this->actingAs($this->riderUserB, 'sanctum')
            ->getJson("/api/v1/payments/{$payment->id}");
        $response->assertStatus(403);
    }

    public function test_driver_cannot_access_another_drivers_payment(): void
    {
        $ride = Ride::create([
            'booking_id' => 'RIDE-000002',
            'rider_id' => $this->riderUserA->id,
            'driver_id' => $this->driverA->id,
            'status' => \App\Enums\RideStatus::RideCompleted,
            'pickup_latitude' => 30.0,
            'pickup_longitude' => 31.0,
            'destination_latitude' => 30.1,
            'destination_longitude' => 31.1,
            'pickup_address' => 'Cairo',
            'destination_address' => 'Giza',
            'vehicle_type_id' => $this->vehicleType->id,
            'payment_method' => 'wallet',
        ]);

        $payment = Payment::create([
            'ride_id' => $ride->id,
            'amount' => 60.00,
            'currency' => 'EGP',
            'status' => \App\Enums\PaymentStatus::Completed,
            'payment_method' => 'wallet',
        ]);

        // Driver A (assigned driver) can access
        $response = $this->actingAs($this->driverUserA, 'sanctum')
            ->getJson("/api/v1/payments/{$payment->id}");
        $response->assertOk();

        // Driver B cannot access (403)
        $response = $this->actingAs($this->driverUserB, 'sanctum')
            ->getJson("/api/v1/payments/{$payment->id}");
        $response->assertStatus(403);
    }

    public function test_driver_cannot_view_or_update_another_drivers_vehicle(): void
    {
        $vehicle = Vehicle::create([
            'driver_id' => $this->driverA->id,
            'make' => 'Toyota',
            'model' => 'Corolla',
            'year' => 2020,
            'color' => 'Black',
            'license_plate' => 'ABC-123',
            'vehicle_class' => 'sedan',
            'vehicle_type_id' => $this->vehicleType->id,
        ]);

        // Driver A can view & update own vehicle
        $response = $this->actingAs($this->driverUserA, 'sanctum')
            ->getJson("/api/v1/driver/vehicles/{$vehicle->id}");
        $response->assertOk();

        $response = $this->actingAs($this->driverUserA, 'sanctum')
            ->putJson("/api/v1/driver/vehicles/{$vehicle->id}", [
                'make' => 'Honda',
                'model' => 'Civic',
                'year' => 2021,
                'color' => 'Red',
                'license_plate' => 'ABC-123',
                'vehicle_class' => 'sedan',
                'vehicle_type_id' => $this->vehicleType->id,
            ]);
        $response->assertOk();

        // Driver B cannot view or update Driver A's vehicle (403)
        $response = $this->actingAs($this->driverUserB, 'sanctum')
            ->getJson("/api/v1/driver/vehicles/{$vehicle->id}");
        $response->assertStatus(403);

        $response = $this->actingAs($this->driverUserB, 'sanctum')
            ->putJson("/api/v1/driver/vehicles/{$vehicle->id}", [
                'make' => 'Honda',
                'model' => 'Civic',
                'year' => 2021,
                'color' => 'Red',
                'license_plate' => 'ABC-123',
                'vehicle_class' => 'sedan',
                'vehicle_type_id' => $this->vehicleType->id,
            ]);
        $response->assertStatus(403);
    }

    public function test_unrelated_user_cannot_view_message_or_close_another_ticket(): void
    {
        $ticket = Ticket::create([
            'ticket_id' => 'TKT-12345',
            'user_id' => $this->riderUserA->id,
            'subject' => 'Issue A',
            'message' => 'Help me',
            'priority' => 'high',
            'category' => 'general',
            'status' => 'open',
        ]);

        // Owner Rider A can access
        $response = $this->actingAs($this->riderUserA, 'sanctum')
            ->getJson("/api/v1/tickets/{$ticket->id}");
        $response->assertOk();

        // Rider B cannot view (403)
        $response = $this->actingAs($this->riderUserB, 'sanctum')
            ->getJson("/api/v1/tickets/{$ticket->id}");
        $response->assertStatus(403);

        // Rider B cannot add message (403)
        $response = $this->actingAs($this->riderUserB, 'sanctum')
            ->postJson("/api/v1/tickets/{$ticket->id}/messages", ['message' => 'Hacked message']);
        $response->assertStatus(403);

        // Rider B cannot close (403)
        $response = $this->actingAs($this->riderUserB, 'sanctum')
            ->postJson("/api/v1/tickets/{$ticket->id}/close");
        $response->assertStatus(403);
    }

    public function test_admin_route_protection_still_works(): void
    {
        // Rider cannot access
        $response = $this->actingAs($this->riderUserA, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(403);

        // Admin can access
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');
        $response->assertOk();
    }

    public function test_suspended_user_is_blocked(): void
    {
        $suspendedRider = User::factory()->create(['is_active' => true]);
        $suspendedRider->roles()->attach(Role::findByName('rider')->id);
        Rider::create(['user_id' => $suspendedRider->id, 'is_active' => false]);

        $response = $this->actingAs($suspendedRider, 'sanctum')
            ->getJson('/api/v1/auth/user');
        $response->assertStatus(403);
    }

    public function test_rate_limits_trigger_429(): void
    {
        // Estimate fare limit test
        for ($i = 0; $i < 35; $i++) {
            $response = $this->actingAs($this->riderUserA, 'sanctum')
                ->postJson('/api/v1/rides/estimate-fare', [
                    'vehicle_type_id' => $this->vehicleType->id,
                    'pickup_latitude' => 30.0,
                    'pickup_longitude' => 31.0,
                    'destination_latitude' => 30.1,
                    'destination_longitude' => 31.1,
                ]);
            if ($response->status() === 429) {
                break;
            }
        }
        $this->assertEquals(429, $response->status());
    }

    public function test_ride_booking_rate_limit(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($this->riderUserA, 'sanctum')
                ->postJson('/api/v1/rides', [
                    'pickup_latitude' => 30.0,
                    'pickup_longitude' => 31.0,
                    'pickup_address' => 'Cairo',
                    'destination_latitude' => 30.1,
                    'destination_longitude' => 31.1,
                    'destination_address' => 'Giza',
                    'vehicle_type_id' => $this->vehicleType->id,
                    'payment_method' => 'wallet',
                ]);
            if ($response->status() === 429) {
                break;
            }
        }
        $this->assertEquals(429, $response->status());
    }

    public function test_wallet_topup_rate_limit(): void
    {
        // First create wallet for User A if it doesn't exist
        \App\Models\Wallet::firstOrCreate(['user_id' => $this->riderUserA->id], ['balance' => 100.00, 'currency' => 'EGP']);

        for ($i = 0; $i < 15; $i++) {
            $response = $this->actingAs($this->riderUserA, 'sanctum')
                ->postJson('/api/v1/payments/wallet/fund', [
                    'amount' => 10.00,
                ]);
            if ($response->status() === 429) {
                break;
            }
        }
        $this->assertEquals(429, $response->status());
    }

    public function test_support_messages_rate_limit(): void
    {
        $ticket = Ticket::create([
            'ticket_id' => 'TKT-99999',
            'user_id' => $this->riderUserA->id,
            'subject' => 'Issue A',
            'message' => 'Help me',
            'priority' => 'high',
            'category' => 'general',
            'status' => 'open',
        ]);

        for ($i = 0; $i < 20; $i++) {
            $response = $this->actingAs($this->riderUserA, 'sanctum')
                ->postJson("/api/v1/tickets/{$ticket->id}/messages", [
                    'message' => 'Spam message ' . $i,
                ]);
            if ($response->status() === 429) {
                break;
            }
        }
        $this->assertEquals(429, $response->status());
    }

    public function test_database_exception_masking_returns_safe_json(): void

    {
        // Register a temporary API route dynamically to execute an illegal SQL command
        Route::middleware('api')->get('/api/v1/test-db-error', function () {
            \Illuminate\Support\Facades\DB::select('SELECT * FROM non_existent_table');
        });

        $response = $this->getJson('/api/v1/test-db-error');
        $response->assertStatus(500);
        $response->assertJsonFragment([
            'success' => false,
            'message' => 'A database error occurred. Please try again later.',
        ]);

        // Ensure SQL details are not in the response
        $this->assertStringNotContainsString('non_existent_table', $response->getContent());
        $this->assertStringNotContainsString('SELECT', $response->getContent());
    }

    public function test_audit_log_created_and_redacts_secrets(): void
    {
        // Clean existing logs
        AuditLog::truncate();

        // Action: Failed Login
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'secret_password_123',
        ]);

        $response->assertUnauthorized();

        // Audit log must exist
        $log = AuditLog::where('event', 'login_failed')->first();
        $this->assertNotNull($log);
        $this->assertNull($log->actor_id);
        $this->assertEquals('nobody@example.com', $log->metadata['email']);

        // Check register logs
        AuditLog::truncate();
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'John Doe',
            'email' => 'john.doe@example.com',
            'phone' => '+201111111111',
            'password' => 'password_secret_val',
            'password_confirmation' => 'password_secret_val',
            'role' => 'rider',
        ]);
        $response->assertCreated();

        $log = AuditLog::where('event', 'register')->first();
        $this->assertNotNull($log);
        
        // Metadata must redact password
        $this->assertArrayNotHasKey('password', $log->metadata ?? []);
    }
}
