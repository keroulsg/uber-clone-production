<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\Rider;
use App\Models\Ride;
use App\Models\Payment;
use App\Enums\RideStatus;
use App\Enums\PaymentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminSecurityAndManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $driverUser;
    protected User $riderUser;
    protected Driver $driver;
    protected Rider $rider;

    protected function setUp(): void
    {
        parent::setUp();

        // Admin User setup
        $this->adminUser = User::factory()->create(['is_active' => true]);
        $this->adminUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        // Driver User setup
        $this->driverUser = User::factory()->create(['is_active' => true]);
        $this->driverUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('driver')->id);
        $this->driver = Driver::create([
            'user_id' => $this->driverUser->id,
            'status' => 'pending',
            'is_approved' => false,
            'is_verified' => false,
            'is_active' => true,
        ]);

        // Rider User setup
        $this->riderUser = User::factory()->create(['is_active' => true]);
        $this->riderUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('rider')->id);
        $this->rider = Rider::create([
            'user_id' => $this->riderUser->id,
            'is_active' => true,
        ]);
    }

    public function test_non_admin_cannot_access_admin_endpoints(): void
    {
        // Riders are blocked (403)
        $response = $this->actingAs($this->riderUser, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(403);

        // Drivers are blocked (403)
        $response = $this->actingAs($this->driverUser, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');
        $response->assertStatus(403);
    }

    public function test_admin_can_access_dashboard_and_retrieves_stats(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/admin/dashboard');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'data' => [
                'totalUsers',
                'totalDrivers',
                'totalRides',
                'activeDrivers',
            ],
        ]);
    }

    public function test_admin_can_manage_driver_status(): void
    {
        // 1. Approve
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/drivers/{$this->driver->id}/approve");
        $response->assertOk();
        $this->driver->refresh();
        $this->assertEquals('approved', $this->driver->status);
        $this->assertTrue($this->driver->is_approved);

        // 2. Suspend
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/drivers/{$this->driver->id}/suspend");
        $response->assertOk();
        $this->driver->refresh();
        $this->assertEquals('suspended', $this->driver->status);
        $this->assertFalse($this->driver->is_active);

        // 3. Reactivate
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/drivers/{$this->driver->id}/reactivate");
        $response->assertOk();
        $this->driver->refresh();
        $this->assertEquals('approved', $this->driver->status);
        $this->assertTrue($this->driver->is_active);

        // 4. Block
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/drivers/{$this->driver->id}/block", ['reason' => 'Violation']);
        $response->assertOk();
        $this->driverUser->refresh();
        $this->assertFalse($this->driverUser->is_active);

        // 5. Unblock
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/drivers/{$this->driver->id}/unblock", ['reason' => 'Appeal']);
        $response->assertOk();
        $this->driverUser->refresh();
        $this->assertTrue($this->driverUser->is_active);
    }

    public function test_admin_can_manage_rider_status(): void
    {
        // 1. Suspend
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/riders/{$this->rider->id}/suspend");
        $response->assertOk();
        $this->rider->refresh();
        $this->assertFalse($this->rider->is_active);

        // 2. Reactivate
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/riders/{$this->rider->id}/reactivate");
        $response->assertOk();
        $this->rider->refresh();
        $this->assertTrue($this->rider->is_active);

        // 3. Block
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/riders/{$this->rider->id}/block", ['reason' => 'Fraud']);
        $response->assertOk();
        $this->riderUser->refresh();
        $this->assertFalse($this->riderUser->is_active);

        // 4. Unblock
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/admin/riders/{$this->rider->id}/unblock", ['reason' => 'Cleared']);
        $response->assertOk();
        $this->riderUser->refresh();
        $this->assertTrue($this->riderUser->is_active);
    }
}
