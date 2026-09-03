<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Members
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('member_id')->unique(); // e.g. BPL-2026-0001
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('full_name');
            $table->string('username')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable(); // Male, Female, Other, Prefer not to say
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('membership_type')->default('Student'); // Student, Faculty, Community, Researcher
            $table->string('status')->default('active'); // active, inactive, suspended
            $table->text('photo_url')->nullable();
            $table->string('qr_code_data')->nullable();
            $table->date('join_date')->nullable();
            $table->integer('total_borrows')->default(0);
            $table->timestamps();
        });

        // 2. Books
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('isbn')->unique();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('author');
            $table->string('publisher')->nullable();
            $table->integer('publication_year')->nullable();
            $table->string('edition')->nullable();
            $table->string('language')->default('English');
            $table->text('description')->nullable();
            $table->integer('pages')->default(0);
            $table->string('category')->default('General');
            $table->string('subject')->nullable();
            $table->json('keywords')->nullable();
            $table->string('classification')->nullable(); // Dewey e.g. 005.133
            $table->text('cover_image')->nullable();
            $table->timestamps();
        });

        // 3. Physical Copies
        Schema::create('physical_copies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->onDelete('cascade');
            $table->string('copy_id')->unique(); // e.g. BPL-000101-C1
            $table->string('accession_number')->unique(); // e.g. ACC-000101
            $table->string('barcode')->unique(); // e.g. BPL-000101
            $table->string('shelf_location')->nullable(); // e.g. Shelf A-3
            $table->string('classification')->nullable();
            $table->string('condition')->default('Good'); // New, Good, Fair, Damaged
            $table->string('status')->default('Available'); // Available, Borrowed, Reserved, Lost, Under Repair
            $table->date('date_added')->nullable();
            $table->timestamps();
        });

        // 4. Circulation Transactions
        Schema::create('circulation_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_id')->unique(); // e.g. BRW-2026-00001
            $table->foreignId('book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->string('book_title');
            $table->string('book_author')->nullable();
            $table->string('accession_number');
            $table->string('barcode');
            $table->string('member_id');
            $table->string('member_name');
            $table->date('borrow_date');
            $table->date('due_date');
            $table->date('return_date')->nullable();
            $table->string('status')->default('Active'); // Active, Returned, Overdue, Renewed, Pending Approval, Rejected
            $table->integer('renewal_count')->default(0);
            $table->string('processed_by')->default('Admin');
            $table->date('request_date')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });

        // 5. Book Reservations
        Schema::create('book_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->string('book_title');
            $table->string('member_id');
            $table->string('member_name');
            $table->date('reservation_date');
            $table->date('expiry_date');
            $table->string('status')->default('Pending Approval'); // Pending Approval, Waiting, Ready for Pickup, Claimed, Cancelled, Expired, Rejected
            $table->integer('queue_position')->default(1);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 6. Attendance Records
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->string('member_id');
            $table->string('member_name');
            $table->string('membership_type')->default('Student');
            $table->date('date');
            $table->string('time_in');
            $table->string('time_out')->nullable();
            $table->string('duration')->nullable();
            $table->string('status')->default('Inside'); // Inside, Completed
            $table->text('notes')->nullable();
            $table->string('edited_by')->nullable();
            $table->text('edit_reason')->nullable();
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
        });

        // 7. Audit Logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action');
            $table->string('category'); // Attendance, Books, Members, Circulation, Admin, System
            $table->text('details');
            $table->string('performed_by')->default('System');
            $table->string('ip_address')->nullable();
            $table->timestamps();
        });

        // 8. Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('info'); // info, warning, success, alert
            $table->boolean('read')->default(false);
            $table->string('target_role')->nullable(); // super_admin, admin, member, all
            $table->string('target_member_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('book_reservations');
        Schema::dropIfExists('circulation_transactions');
        Schema::dropIfExists('physical_copies');
        Schema::dropIfExists('books');
        Schema::dropIfExists('members');
    }
};
