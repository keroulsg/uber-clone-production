<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DriverDocumentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_can_upload_document_privately(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $user->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('driver')->id);
        $driver = Driver::create(['user_id' => $user->id]);

        $file = UploadedFile::fake()->image('license.jpg');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/driver/documents', [
                'type' => 'license_front',
                'file' => $file,
            ]);

        $response->assertOk();
        $driver->refresh();

        $this->assertNotNull($driver->license_front_image);
        Storage::disk('local')->assertExists($driver->license_front_image);
        Storage::disk('public')->assertMissing($driver->license_front_image);
    }

    public function test_owner_and_admin_can_download_document_but_other_users_cannot(): void
    {
        Storage::fake('local');

        // Owner Driver
        $ownerUser = User::factory()->create();
        $ownerUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('driver')->id);
        $driver = Driver::create(['user_id' => $ownerUser->id]);

        $file = UploadedFile::fake()->image('license.jpg');
        $path = $file->storeAs('driver-documents', 'test_license.jpg', 'local');
        $driver->update(['license_front_image' => $path]);

        // Other Driver
        $otherUser = User::factory()->create();
        $otherUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('driver')->id);

        // Admin User
        $adminUser = User::factory()->create(['roles' => json_encode(['admin'])]);
        $adminUser->roles()->attach(\Spatie\Permission\Models\Role::findOrCreate('admin')->id);

        // 1. Owner can download with signed URL
        $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'driver.document',
            now()->addMinutes(5),
            ['driverId' => $driver->id, 'type' => 'license_front']
        );
        $response = $this->actingAs($ownerUser, 'sanctum')->getJson($url);
        $response->assertOk();

        // 2. Admin can download with signed URL
        $response = $this->actingAs($adminUser, 'sanctum')->getJson($url);
        $response->assertOk();

        // 3. Other driver is forbidden even with signed URL (403)
        $response = $this->actingAs($otherUser, 'sanctum')->getJson($url);
        $response->assertStatus(403);

        // 4. Request without signature is blocked (403)
        $response = $this->actingAs($ownerUser, 'sanctum')
            ->getJson("/api/v1/driver/{$driver->id}/documents/license_front");
        $response->assertStatus(403);
    }
}
