<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\Rider;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BlockedSuspendedUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_access_protected_endpoint(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/user');

        $response->assertOk();
    }

    public function test_inactive_user_is_denied_access(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/user');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your account is blocked. Please contact support.']);
    }

    public function test_suspended_driver_profile_is_denied_access(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $driver = Driver::create([
            'user_id' => $user->id,
            'status' => 'suspended',
            'is_active' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/user');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your account is suspended. You cannot perform this action.']);
    }

    public function test_suspended_rider_profile_is_denied_access(): void
    {
        $user = User::factory()->create(['is_active' => true]);
        $rider = Rider::create([
            'user_id' => $user->id,
            'is_active' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/user');

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'Your account is suspended. You cannot perform this action.']);
    }

    public function test_admin_bypasses_suspension(): void
    {
        $user = User::factory()->create([
            'is_active' => false,
            'roles' => json_encode(['admin']),
        ]);
        $user->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/user');

        $response->assertOk();
    }

    public function test_suspended_or_inactive_user_can_still_logout(): void
    {
        $user = User::factory()->create(['is_active' => false]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/auth/logout');

        // It should bypass the block and hit the logout logic (returning 200 or redirection)
        $response->assertStatus(200);
    }
}
