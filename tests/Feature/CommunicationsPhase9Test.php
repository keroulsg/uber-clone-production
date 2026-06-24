<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Ride;
use App\Models\Rider;
use App\Models\Driver;
use App\Models\Ticket;
use App\Models\ChatMessage;
use App\Models\Notification;
use App\Models\Vehicle;
use App\Models\Wallet;
use App\Models\Setting;
use App\Models\VehicleType;
use App\Enums\RideStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;

class CommunicationsPhase9Test extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $rider;
    protected User $driver;
    protected Driver $driverModel;
    protected Ride $ride;

    protected function setUp(): void
    {
        parent::setUp();

        $this->rider = User::factory()->create();
        $this->driver = User::factory()->create();

        Rider::factory()->create(['user_id' => $this->rider->id]);
        $this->driverModel = Driver::factory()->create([
            'user_id' => $this->driver->id,
            'is_online' => true,
            'is_approved' => true,
            'is_verified' => true,
            'is_active' => true,
            'status' => 'approved',
        ]);

        $vehicleType = VehicleType::factory()->create(['slug' => 'economy']);
        Vehicle::factory()->create([
            'driver_id' => $this->driverModel->id,
            'vehicle_type_id' => $vehicleType->id,
            'vehicle_class' => 'basic',
            'is_active' => true,
            'status' => 'active',
        ]);

        Wallet::create(['user_id' => $this->rider->id, 'balance' => 200.00, 'currency' => 'USD']);

        Setting::updateOrCreate(
            ['key' => 'default_commission_rate'],
            ['value' => '10', 'group' => 'pricing', 'type' => 'decimal', 'description' => '']
        );

        $this->ride = Ride::create([
            'rider_id' => $this->rider->id,
            'driver_id' => $this->driverModel->id,
            'vehicle_type_id' => $vehicleType->id,
            'pickup_latitude' => 40.7128,
            'pickup_longitude' => -74.0060,
            'pickup_address' => '123 Pickup St',
            'destination_latitude' => 40.7580,
            'destination_longitude' => -73.9855,
            'destination_address' => '456 Dest Ave',
            'status' => RideStatus::DriverAssigned,
            'estimated_distance' => 5.0,
            'estimated_duration' => 15,
            'estimated_fare' => 15.00,
            'payment_method' => 'wallet',
        ]);
    }

    // ── Chat Tests ──

    public function test_rider_can_send_chat_message(): void
    {
        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => 'Hello driver!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.message', 'Hello driver!');
        $this->assertDatabaseHas('chat_messages', [
            'ride_id' => $this->ride->id,
            'user_id' => $this->rider->id,
            'message' => 'Hello driver!',
        ]);
    }

    public function test_driver_can_send_chat_message(): void
    {
        $response = $this->actingAs($this->driver)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => 'Hello rider!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.message', 'Hello rider!');
    }

    public function test_unauthorized_user_cannot_send_chat_message(): void
    {
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => 'Hi',
        ]);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_send_chat(): void
    {
        [$response1, $response2] = [
            $this->postJson("/api/v1/rides/{$this->ride->id}/chat", ['message' => 'test']),
            $this->getJson("/api/v1/rides/{$this->ride->id}/chat"),
        ];

        $response1->assertUnauthorized();
        $response2->assertUnauthorized();
    }

    public function test_chat_message_max_length(): void
    {
        $longMsg = str_repeat('a', 5001);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => $longMsg,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('message');
    }

    public function test_chat_message_at_max_length(): void
    {
        $maxMsg = str_repeat('a', 5000);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => $maxMsg,
        ]);

        $response->assertStatus(201);
    }

    public function test_chat_message_required(): void
    {
        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$this->ride->id}/chat", []);

        $response->assertStatus(422);
    }

    public function test_cannot_chat_on_nonexistent_ride(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/rides/99999/chat', [
            'message' => 'test',
        ]);

        $response->assertStatus(404);
    }

    public function test_rider_can_list_chat_messages(): void
    {
        ChatMessage::create(['ride_id' => $this->ride->id, 'user_id' => $this->driver->id, 'message' => 'From driver']);
        ChatMessage::create(['ride_id' => $this->ride->id, 'user_id' => $this->rider->id, 'message' => 'From rider']);

        $response = $this->actingAs($this->rider)->getJson("/api/v1/rides/{$this->ride->id}/chat");

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonCount(2, 'data');
    }

    public function test_driver_can_list_chat_messages(): void
    {
        ChatMessage::create(['ride_id' => $this->ride->id, 'user_id' => $this->driver->id, 'message' => 'From driver']);

        $response = $this->actingAs($this->driver)->getJson("/api/v1/rides/{$this->ride->id}/chat");

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    public function test_unauthorized_user_cannot_list_chat(): void
    {
        ChatMessage::create(['ride_id' => $this->ride->id, 'user_id' => $this->driver->id, 'message' => 'From driver']);

        $stranger = User::factory()->create();
        $response = $this->actingAs($stranger)->getJson("/api/v1/rides/{$this->ride->id}/chat");

        $response->assertStatus(403);
    }

    // ── Chat Rate Limit ──

    public function test_chat_rate_limit_middleware_applied(): void
    {
        $response = $this->actingAs($this->rider)->postJson("/api/v1/rides/{$this->ride->id}/chat", [
            'message' => 'Test rate limit',
        ]);

        $this->assertNotNull($response->headers->get('X-RateLimit-Remaining'), 'Rate limit header should be present');
        $response->assertStatus(201);
    }

    // ── Notification Tests ──

    public function test_user_can_list_notifications(): void
    {
        Notification::factory()->count(3)->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);

        $response = $this->actingAs($this->rider)->getJson('/api/v1/notifications');

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonStructure(['data' => ['data', 'meta']]);
    }

    public function test_user_cannot_see_other_users_notifications(): void
    {
        Notification::factory()->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->getJson('/api/v1/notifications');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.data'));
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $notif = Notification::factory()->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertOk();
        $this->assertDatabaseMissing('notifications', [
            'id' => $notif->id,
            'read_at' => null,
        ]);
    }

    public function test_user_cannot_mark_others_notification_as_read(): void
    {
        $notif = Notification::factory()->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->postJson("/api/v1/notifications/{$notif->id}/read");

        $response->assertOk();
        $this->assertNull($notif->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        Notification::factory()->count(3)->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);

        $response = $this->actingAs($this->rider)->postJson('/api/v1/notifications/read-all');

        $response->assertOk();
        $this->assertEquals(0, Notification::where('notifiable_id', $this->rider->id)->whereNull('read_at')->count());
    }

    public function test_user_can_get_unread_count(): void
    {
        Notification::factory()->count(3)->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);
        Notification::factory()->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
            'read_at' => now(),
        ]);

        $response = $this->actingAs($this->rider)->getJson('/api/v1/notifications/unread-count');

        $response->assertOk();
        $response->assertJsonPath('data.count', 3);
    }

    public function test_unread_notifications_filter(): void
    {
        Notification::factory()->count(2)->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
        ]);
        Notification::factory()->create([
            'notifiable_id' => $this->rider->id,
            'notifiable_type' => User::class,
            'read_at' => now(),
        ]);

        $response = $this->actingAs($this->rider)->getJson('/api/v1/notifications?unread=1');

        $response->assertOk();
        $this->assertCount(2, $response->json('data.data'));
    }

    // ── Support Ticket Tests ──

    public function test_user_can_create_ticket(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/tickets', [
            'subject' => 'Test ticket',
            'message' => 'Need help with my ride',
            'priority' => 'medium',
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('tickets', [
            'user_id' => $this->rider->id,
            'subject' => 'Test ticket',
        ]);
    }

    public function test_user_can_list_own_tickets(): void
    {
        Ticket::factory()->count(2)->create(['user_id' => $this->rider->id]);

        $response = $this->actingAs($this->rider)->getJson('/api/v1/tickets');

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_user_cannot_see_others_tickets(): void
    {
        Ticket::factory()->create(['user_id' => $this->rider->id]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->getJson('/api/v1/tickets');

        $response->assertOk();
        $this->assertCount(0, $response->json('data.data'));
    }

    public function test_user_can_view_own_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $response = $this->actingAs($this->rider)->getJson("/api/v1/tickets/{$ticket->id}");

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_user_cannot_view_others_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->getJson("/api/v1/tickets/{$ticket->id}");

        $response->assertStatus(403);
    }

    public function test_user_can_close_own_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/tickets/{$ticket->id}/close");

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_user_cannot_close_others_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->postJson("/api/v1/tickets/{$ticket->id}/close");

        $response->assertStatus(403);
    }

    public function test_user_can_add_message_to_own_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $response = $this->actingAs($this->rider)->postJson("/api/v1/tickets/{$ticket->id}/messages", [
            'message' => 'Additional info',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
    }

    public function test_user_cannot_add_message_to_others_ticket(): void
    {
        $ticket = Ticket::factory()->create(['user_id' => $this->rider->id]);

        $otherUser = User::factory()->create();
        $response = $this->actingAs($otherUser)->postJson("/api/v1/tickets/{$ticket->id}/messages", [
            'message' => 'Hacking',
        ]);

        $response->assertStatus(403);
    }

    public function test_ticket_subject_required(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/tickets', [
            'message' => 'Help!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('subject');
    }

    public function test_ticket_message_required(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/tickets', [
            'subject' => 'Help!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('message');
    }

    public function test_ticket_subject_max_length(): void
    {
        $response = $this->actingAs($this->rider)->postJson('/api/v1/tickets', [
            'subject' => str_repeat('a', 256),
            'message' => 'Help!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('subject');
    }

    // ── Broadcast Auth Tests ──

    public function test_ride_channel_auth_success_for_rider(): void
    {
        $response = $this->actingAs($this->rider)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-ride.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertOk();
    }

    public function test_ride_channel_auth_success_for_driver(): void
    {
        $response = $this->actingAs($this->driver)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-ride.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertOk();
    }

    public function test_ride_channel_auth_fails_for_stranger(): void
    {
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-ride.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertStatus(403);
    }

    public function test_chat_channel_auth_success_for_rider(): void
    {
        $response = $this->actingAs($this->rider)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-chat.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertOk();
    }

    public function test_chat_channel_auth_success_for_driver(): void
    {
        $response = $this->actingAs($this->driver)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-chat.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertOk();
    }

    public function test_chat_channel_auth_fails_for_stranger(): void
    {
        $stranger = User::factory()->create();

        $response = $this->actingAs($stranger)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-chat.{$this->ride->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertStatus(403);
    }

    public function test_driver_channel_auth_success(): void
    {
        $response = $this->actingAs($this->driver)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-driver.{$this->driverModel->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertOk();
    }

    public function test_driver_channel_auth_fails_for_other_driver(): void
    {
        $response = $this->actingAs($this->rider)
            ->postJson('/broadcasting/auth', [
                'channel_name' => "private-driver.{$this->driverModel->id}",
                'socket_id' => '1234.5678',
            ]);

        $response->assertStatus(403);
    }

    public function test_broadcast_auth_requires_authentication(): void
    {
        $response = $this->postJson('/broadcasting/auth', [
            'channel_name' => "private-ride.{$this->ride->id}",
            'socket_id' => '1234.5678',
        ]);

        $this->assertTrue(in_array($response->status(), [401, 302]));
    }
}
