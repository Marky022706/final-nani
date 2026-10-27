<?php

namespace Tests\Feature;

use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Book;
use App\Models\CirculationTransaction;
use App\Models\Member;
use App\Models\PhysicalCopy;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $superAdmin;
    protected User $memberUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name' => 'Librarian Admin',
            'email' => 'admin@balingasag.gov.ph',
            'username' => 'admin.librarian',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@balingasag.gov.ph',
            'username' => 'super.admin',
            'password' => Hash::make('password123'),
            'role' => 'super_admin',
            'status' => 'active',
        ]);

        $this->memberUser = User::create([
            'name' => 'Patron Member',
            'email' => 'patron@example.ph',
            'username' => 'patron.member',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
        ]);

        // Seed sample data for testing
        $book = Book::create([
            'isbn' => '978-0132350884',
            'title' => 'Clean Code',
            'author' => 'Robert C. Martin',
            'category' => 'General Reference',
            'classification' => '005.133',
            'is_archived' => false,
        ]);

        PhysicalCopy::create([
            'book_id' => $book->id,
            'copy_id' => 'BPL-0001-C1',
            'accession_number' => 'ACC-0001',
            'barcode' => 'BPL-000001',
            'status' => 'Available',
        ]);

        Member::create([
            'member_id' => 'BPL-2026-0001',
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'full_name' => 'Juan Dela Cruz',
            'status' => 'active',
            'membership_type' => 'Student',
        ]);

        AttendanceRecord::create([
            'member_id' => 'BPL-2026-0001',
            'member_name' => 'Juan Dela Cruz',
            'membership_type' => 'Student',
            'date' => Carbon::today()->toDateString(),
            'time_in' => '08:30 AM',
            'time_out' => '11:45 AM',
            'duration' => '3 hrs 15 mins',
            'status' => 'Completed',
        ]);

        AuditLog::create([
            'action' => 'Book Created',
            'category' => 'Books',
            'details' => 'Added new title "Clean Code"',
            'performed_by' => 'Librarian Admin',
            'ip_address' => '127.0.0.1',
        ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/reports/attendance');
        $response->assertStatus(401);
    }

    public function test_admin_can_generate_attendance_report(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/reports/attendance');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'records',
                'summary' => ['total_records', 'unique_visitors', 'currently_inside', 'completed_visits'],
                'daily_summary',
                'generated_at',
            ]);

        $this->assertEquals(1, $response->json('summary.total_records'));
        $this->assertEquals(1, $response->json('summary.completed_visits'));
    }

    public function test_admin_can_generate_inventory_report(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/reports/inventory');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'books',
                'summary' => ['total_titles', 'active_titles', 'total_copies', 'available_copies'],
                'categories',
                'generated_at',
            ]);

        $this->assertEquals(1, $response->json('summary.total_titles'));
        $this->assertEquals(1, $response->json('summary.available_copies'));
    }

    public function test_admin_can_generate_overdue_report(): void
    {
        Sanctum::actingAs($this->admin);

        // Add an overdue transaction
        CirculationTransaction::create([
            'transaction_id' => 'BRW-TEST-001',
            'book_title' => 'Clean Code',
            'accession_number' => 'ACC-0001',
            'barcode' => 'BPL-000001',
            'member_id' => 'BPL-2026-0001',
            'member_name' => 'Juan Dela Cruz',
            'borrow_date' => Carbon::now()->subDays(14)->toDateString(),
            'due_date' => Carbon::now()->subDays(7)->toDateString(),
            'status' => 'Active',
            'processed_by' => 'Librarian Admin',
        ]);

        $response = $this->getJson('/api/reports/overdue');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'records',
                'summary' => ['total_overdue', 'unique_patrons', 'total_estimated_fines', 'longest_overdue_days'],
                'generated_at',
            ]);

        $this->assertEquals(1, $response->json('summary.total_overdue'));
        $this->assertEquals(7, $response->json('records.0.overdue_days'));
    }

    public function test_admin_can_generate_executive_summary(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/reports/executive-summary?period=this_month');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'period_label',
                'start_date',
                'end_date',
                'metrics' => [
                    'total_members',
                    'book_inventory',
                    'attendance',
                    'circulation',
                ],
                'generated_at',
            ]);
    }

    public function test_superadmin_can_generate_activity_logs_report(): void
    {
        Sanctum::actingAs($this->superAdmin);

        $response = $this->getJson('/api/reports/activity-logs');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'records',
                'summary' => ['total_activities', 'unique_users', 'module_breakdown'],
                'generated_at',
            ]);

        $this->assertEquals(1, $response->json('summary.total_activities'));
    }
}
