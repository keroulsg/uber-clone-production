<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\DriverDebt;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DriverCoreFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $driverUser;
    protected Driver $driver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->driverUser = User::factory()->create(['is_active' => true]);
        // Assign driver role
        $this->driverUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('driver')->id);

        $this->driver = Driver::create([
            'user_id' => $this->driverUser->id,
            'status' => 'approved',
            'is_active' => true,
            'is_online' => false,
        ]);
    }

    public function test_approved_driver_can_go_online(): void
    {
        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'is_online' => true,
        ]);

        $this->assertTrue($this->driver->fresh()->is_online);
    }

    public function test_suspended_driver_cannot_go_online(): void
    {
        $this->driver->update(['is_active' => false]);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your account is suspended. You cannot perform this action.']);
        $this->assertFalse($this->driver->fresh()->is_online);
    }

    public function test_blocked_driver_user_cannot_go_online(): void
    {
        $this->driverUser->update(['is_active' => false]);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your account is blocked. Please contact support.']);
        $this->assertFalse($this->driver->fresh()->is_online);
    }

    public function test_unapproved_driver_cannot_go_online(): void
    {
        $this->driver->update(['status' => 'pending']);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your driver profile is not approved yet.']);
        $this->assertFalse($this->driver->fresh()->is_online);
    }

    public function test_driver_with_high_debt_cannot_go_online(): void
    {
        // Configure limit dynamically
        config(['driver.debt_limit' => 200.00]);

        // Debt below limit (e.g. 199) should be allowed
        DriverDebt::create([
            'driver_id' => $this->driver->id,
            'amount' => 199.00,
            'type' => 'commission',
        ]);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertOk();
        $this->assertTrue($this->driver->fresh()->is_online);

        // Refresh the driver instance from the database so it knows it is online, then turn offline first
        $this->driver->refresh();
        $this->driver->update(['is_online' => false]);

        // Add debt to reach 200.00 (exactly at the limit)
        DriverDebt::create([
            'driver_id' => $this->driver->id,
            'amount' => 1.00,
            'type' => 'commission',
        ]);

        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->postJson('/api/v1/driver/toggle-online');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Cannot go online. Your outstanding commission debt (200 EGP) exceeds the limit of 200 EGP. Please settle your dues.']);
        $this->assertFalse($this->driver->fresh()->is_online);
    }
}
