<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SavedPlace;
use App\Services\FeatureFlagService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RiderSavedPlacesSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $userA;
    protected User $userB;
    protected SavedPlace $placeA;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->userA = User::factory()->create();
        $this->userB = User::factory()->create();

        // Enforce saved_places feature flag is enabled
        app(FeatureFlagService::class)->enable('saved_places');

        $this->placeA = SavedPlace::create([
            'user_id' => $this->userA->id,
            'label' => 'home',
            'name' => 'User A Home',
            'address' => 'Cairo, Egypt',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
            'is_favorite' => true,
        ]);
    }

    public function test_user_cannot_access_others_saved_place(): void
    {
        $response = $this->actingAs($this->userB)->getJson("/api/v1/saved-places/{$this->placeA->id}");
        $response->assertForbidden();
    }

    public function test_user_cannot_update_others_saved_place(): void
    {
        $response = $this->actingAs($this->userB)->putJson("/api/v1/saved-places/{$this->placeA->id}", [
            'name' => 'Hacked Name',
        ]);
        $response->assertForbidden();
    }

    public function test_user_cannot_delete_others_saved_place(): void
    {
        $response = $this->actingAs($this->userB)->deleteJson("/api/v1/saved-places/{$this->placeA->id}");
        $response->assertForbidden();
    }
}
