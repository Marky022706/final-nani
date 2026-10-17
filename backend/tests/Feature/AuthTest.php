<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $admin;
    protected User $member;
    protected User $inactiveUser;
    protected User $suspendedUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::create([
            'name' => 'Eleanor Vance',
            'email' => 'superadmin@balingasag.gov.ph',
            'username' => 'superadmin',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->admin = User::create([
            'name' => 'Ms. Arquita',
            'email' => 'admin.arquita@balingasag.gov.ph',
            'username' => 'admin.arquita',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->member = User::create([
            'name' => 'Library Member',
            'email' => 'member@example.com',
            'username' => 'member',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);

        $this->inactiveUser = User::create([
            'name' => 'Inactive Staff',
            'email' => 'inactive@balingasag.gov.ph',
            'username' => 'inactive_staff',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'inactive',
        ]);

        $this->suspendedUser = User::create([
            'name' => 'Suspended Staff',
            'email' => 'suspended@balingasag.gov.ph',
            'username' => 'suspended_staff',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'suspended',
        ]);
    }

    public function test_login_successful_with_email_and_correct_password(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'superadmin@balingasag.gov.ph',
            'password' => 'admin123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                    'username',
                    'role',
                    'status',
                    'privileges',
                ],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'email' => 'superadmin@balingasag.gov.ph',
                    'role' => 'super_admin',
                    'status' => 'active',
                ],
            ]);

        $this->assertNotEmpty($response->json('token'));
    }

    public function test_login_successful_with_username(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'admin.arquita',
            'password' => 'admin123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'username' => 'admin.arquita',
                    'role' => 'admin',
                ],
            ]);
    }

    public function test_login_fails_with_invalid_password(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'superadmin@balingasag.gov.ph',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials. Please verify your email / username and password.',
            ]);
    }

    public function test_login_fails_with_nonexistent_user(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'unknown@balingasag.gov.ph',
            'password' => 'admin123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials. Please verify your email / username and password.',
            ]);
    }

    public function test_login_fails_with_missing_credentials(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['identifier', 'password']);
    }

    public function test_member_account_denied_access_to_staff_portal(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'member@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Library member accounts do not have access to the staff dashboard. Web portal access is restricted to Super Admin and Admin staff.',
            ]);
    }

    public function test_inactive_account_denied_access(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'inactive@balingasag.gov.ph',
            'password' => 'admin123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your library account is currently inactive. Please contact the library administrator.',
            ]);
    }

    public function test_suspended_account_denied_access(): void
    {
        $response = $this->postJson('/api/login', [
            'identifier' => 'suspended@balingasag.gov.ph',
            'password' => 'admin123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Your library account is currently suspended. Please contact the library administrator.',
            ]);
    }

    public function test_authenticated_user_can_fetch_me_profile(): void
    {
        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJson([
                'email' => 'superadmin@balingasag.gov.ph',
                'role' => 'super_admin',
            ]);
    }

    public function test_authenticated_user_can_logout_and_revoke_token(): void
    {
        $token = $this->superAdmin->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully.',
            ]);

        $this->assertCount(0, $this->superAdmin->fresh()->tokens);
    }

    public function test_unauthenticated_request_to_protected_api_returns_401_json_not_redirect(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }
}
