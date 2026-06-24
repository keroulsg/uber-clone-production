<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\PromoCode;
use App\Models\ServiceArea;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;

class Phase10aSafeAdditivesTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $rider;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = \Spatie\Permission\Models\Role::findOrCreate('admin');
        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->roles()->attach($adminRole->id);

        $this->rider = User::factory()->create(['is_active' => true]);
    }

    // ── VehicleType Resource ──

    public function test_vehicle_type_resource_returns_new_fields(): void
    {
        \App\Models\VehicleType::factory()->create([
            'name' => 'Test Type',
            'slug' => 'test-type',
            'commission_rate' => 15,
            'fuel_multiplier' => 1.2,
            'vip_enabled' => true,
            'female_driver_enabled' => true,
        ]);

        $response = $this->getJson('/api/v1/vehicle-types');
        $response->assertOk();

        $type = collect($response->json('data'))->firstWhere('slug', 'test-type');
        $this->assertNotNull($type, 'Test vehicle type not found in response');
        $this->assertEquals(15, (float) $type['commission_rate']);
        $this->assertEquals(1.2, (float) $type['fuel_multiplier']);
        $this->assertTrue($type['vip_enabled']);
        $this->assertTrue($type['female_driver_enabled']);
    }

    // ── Driver Resource ──

    public function test_driver_resource_returns_gender_and_female_only(): void
    {
        $driverUser = User::factory()->create();
        $driver = Driver::factory()->create([
            'user_id' => $driverUser->id,
            'gender' => 'male',
            'female_only' => false,
        ]);
        $driver->load('user');

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/drivers/' . $driver->id);
        $response->assertOk();
        $response->assertJsonPath('data.driver.gender', 'male');
        $response->assertJsonPath('data.driver.femaleOnly', false);
    }

    // ── Promo Code Admin CRUD ──

    public function test_admin_can_list_promo_codes(): void
    {
        PromoCode::factory()->create(['code' => 'TEST10']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/promo-codes');
        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_admin_can_create_promo_code(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/promo-codes', [
            'code' => 'WELCOME20',
            'type' => 'percentage',
            'value' => 20,
            'min_ride_amount' => 50,
            'max_discount' => 100,
            'usage_limit' => 100,
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('promo_codes', ['code' => 'WELCOME20']);
    }

    public function test_admin_can_view_promo_code(): void
    {
        $promo = PromoCode::factory()->create(['code' => 'VIEWTEST']);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/promo-codes/{$promo->id}");
        $response->assertOk();
        $response->assertJsonPath('data.code', 'VIEWTEST');
    }

    public function test_admin_can_update_promo_code(): void
    {
        $promo = PromoCode::factory()->create(['code' => 'UPDATEME', 'value' => 10]);

        $response = $this->actingAs($this->admin)->putJson("/api/v1/admin/promo-codes/{$promo->id}", [
            'value' => 25,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('promo_codes', ['id' => $promo->id, 'value' => 25]);
    }

    public function test_admin_can_delete_promo_code(): void
    {
        $promo = PromoCode::factory()->create(['code' => 'DELETEME']);

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/promo-codes/{$promo->id}");
        $response->assertOk();
        $this->assertDatabaseMissing('promo_codes', ['id' => $promo->id]);
    }

    public function test_non_admin_cannot_create_promo_code(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/admin/promo-codes', [
            'code' => 'HACKED',
            'type' => 'percentage',
            'value' => 100,
        ]);

        $response->assertStatus(403);
    }

    public function test_promo_code_code_must_be_unique(): void
    {
        PromoCode::factory()->create(['code' => 'UNIQUE']);

        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/promo-codes', [
            'code' => 'UNIQUE',
            'type' => 'fixed',
            'value' => 10,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('code');
    }

    // ── Service Area Admin CRUD ──

    public function test_admin_can_list_service_areas(): void
    {
        ServiceArea::factory()->create(['name' => 'Cairo Test']);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/admin/service-areas');
        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_admin_can_create_service_area(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/v1/admin/service-areas', [
            'name' => 'Alexandria',
            'slug' => 'alexandria',
            'city' => 'Alexandria',
            'governorate' => 'Alexandria',
            'center_latitude' => 31.2001,
            'center_longitude' => 29.9187,
            'radius_km' => 40,
            'cities' => ['Alexandria', 'Borg El Arab'],
            'is_active' => true,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('service_areas', ['slug' => 'alexandria']);
    }

    public function test_admin_can_view_service_area(): void
    {
        $area = ServiceArea::factory()->create(['name' => 'View Test']);

        $response = $this->actingAs($this->admin)->getJson("/api/v1/admin/service-areas/{$area->id}");
        $response->assertOk();
        $response->assertJsonPath('data.name', 'View Test');
    }

    public function test_admin_can_update_service_area(): void
    {
        $area = ServiceArea::factory()->create(['name' => 'Old Name']);

        $response = $this->actingAs($this->admin)->putJson("/api/v1/admin/service-areas/{$area->id}", [
            'name' => 'New Name',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('service_areas', ['id' => $area->id, 'name' => 'New Name']);
    }

    public function test_admin_can_delete_service_area(): void
    {
        $area = ServiceArea::factory()->create(['name' => 'Delete Me']);

        $response = $this->actingAs($this->admin)->deleteJson("/api/v1/admin/service-areas/{$area->id}");
        $response->assertOk();
        $this->assertDatabaseMissing('service_areas', ['id' => $area->id]);
    }

    public function test_non_admin_cannot_manage_service_areas(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/admin/service-areas', [
            'name' => 'Hack',
            'slug' => 'hack',
        ]);

        $response->assertStatus(403);
    }

    // ── Settings ──

    public function test_waiting_free_minutes_setting_exists(): void
    {
        Setting::updateOrCreate(
            ['key' => 'waiting_free_minutes'],
            ['value' => '5', 'group' => 'pricing', 'type' => 'integer', 'description' => 'Free waiting time in minutes before fee starts']
        );

        $setting = Setting::where('key', 'waiting_free_minutes')->first();
        $this->assertNotNull($setting);
        $this->assertEquals('5', $setting->value);
    }
}
