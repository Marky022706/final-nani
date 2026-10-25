<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Book;
use App\Models\Member;
use App\Models\CirculationTransaction;
use App\Models\AttendanceRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $memberUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Ms. Arquita',
            'email' => 'admin.arquita@balingasag.gov.ph',
            'username' => 'admin.arquita',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->memberUser = User::create([
            'name' => 'Patron User',
            'email' => 'patron@example.ph',
            'username' => 'patron.user',
            'password' => Hash::make('secret123'),
            'role' => 'member',
            'status' => 'active',
        ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/analytics/comparison');
        $response->assertStatus(401);
    }

    public function test_member_role_is_forbidden_from_viewing_analytics(): void
    {
        Sanctum::actingAs($this->memberUser);

        $response = $this->getJson('/api/analytics/comparison');
        $response->assertStatus(403)
            ->assertJson(['error_type' => 'forbidden']);
    }

    public function test_admin_can_retrieve_books_by_category_comparison(): void
    {
        Sanctum::actingAs($this->admin);

        Book::create([
            'isbn' => '978-0132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'category' => 'General Reference',
        ]);

        $response = $this->getJson('/api/analytics/comparison?metric=books_by_category');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'metric',
                'period',
                'title',
                'xAxisLabel',
                'yAxisLabel',
                'data',
                'series',
                'total',
                'summary',
            ]);
    }

    public function test_admin_can_retrieve_circulation_status_breakdown(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/analytics/comparison?metric=circulation_by_status&period=30d');
        $response->assertStatus(200)
            ->assertJsonFragment(['metric' => 'circulation_by_status']);
    }

    public function test_admin_can_retrieve_circulation_trends(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/analytics/trends?metric=circulation&period=7d');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'metric',
                'period',
                'title',
                'data',
                'series',
                'total',
            ]);
    }

    public function test_admin_can_retrieve_attendance_trends(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/analytics/trends?metric=attendance&period=30d');
        $response->assertStatus(200)
            ->assertJsonFragment(['metric' => 'attendance']);
    }
}
