<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RiderRegisterSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_register_with_escalated_role(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Bad Actor',
            'email' => 'badactor@example.com',
            'phone' => '+1111111111',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'admin', // manipulate role
        ]);

        $response->assertStatus(422); // Request Validation rules prevent "admin" since it's restricted to: rider, driver
    }
}
