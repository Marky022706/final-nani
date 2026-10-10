<?php

require_once __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Member;
use App\Models\Book;
use App\Models\PhysicalCopy;
use App\Models\CirculationTransaction;
use App\Models\AuditLog;
use App\Models\Notification;

echo "=== Syncing SQLite Data to Laragon MySQL (final_nani) ===\n";

$sqlitePdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$sqlitePdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Sync Users
$sqliteUsers = $sqlitePdo->query("SELECT * FROM users")->fetchAll(PDO::FETCH_ASSOC);
echo "Transferring " . count($sqliteUsers) . " users...\n";
foreach ($sqliteUsers as $u) {
    User::updateOrCreate(
        ['email' => $u['email']],
        [
            'name' => $u['name'],
            'username' => $u['username'] ?? null,
            'password' => $u['password'],
            'role' => $u['role'] ?? 'super_admin',
            'status' => $u['status'] ?? 'active',
            'member_id' => $u['member_id'] ?? null,
            'department' => $u['department'] ?? null,
            'created_at' => $u['created_at'] ?? now(),
            'updated_at' => $u['updated_at'] ?? now(),
        ]
    );
}

// Ensure default administrative accounts exist
User::updateOrCreate(
    ['email' => 'superadmin@balingasag.gov.ph'],
    [
        'name' => 'Eleanor Vance',
        'username' => 'superadmin',
        'password' => Hash::make('password123'),
        'role' => 'super_admin',
        'status' => 'active',
        'department' => 'Municipal Information Office'
    ]
);

User::updateOrCreate(
    ['email' => 'admin.arquita@balingasag.gov.ph'],
    [
        'name' => 'Ms. Arquita',
        'username' => 'admin.arquita',
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'status' => 'active',
        'department' => 'Head Librarian / Library Administration'
    ]
);

User::updateOrCreate(
    ['email' => 'admin.roberto@balingasag.gov.ph'],
    [
        'name' => 'Roberto Gomez',
        'username' => 'admin',
        'password' => Hash::make('password123'),
        'role' => 'admin',
        'status' => 'active',
        'department' => 'Library Operations'
    ]
);

User::updateOrCreate(
    ['email' => 'volunteer@balingasag.gov.ph'],
    [
        'name' => 'Volunteer Staff',
        'username' => 'volunteer',
        'password' => Hash::make('admin123'),
        'role' => 'volunteer',
        'status' => 'active',
        'department' => 'Volunteer Desk Relief Operations'
    ]
);

// 2. Sync Books
$sqliteBooks = $sqlitePdo->query("SELECT * FROM books")->fetchAll(PDO::FETCH_ASSOC);
echo "Transferring " . count($sqliteBooks) . " books...\n";
foreach ($sqliteBooks as $b) {
    Book::updateOrCreate(
        ['isbn' => $b['isbn']],
        [
            'title' => $b['title'],
            'subtitle' => $b['subtitle'] ?? null,
            'author' => $b['author'],
            'publisher' => $b['publisher'] ?? null,
            'publication_year' => $b['publication_year'] ?? null,
            'edition' => $b['edition'] ?? null,
            'language' => $b['language'] ?? 'English',
            'description' => $b['description'] ?? null,
            'pages' => $b['pages'] ?? 0,
            'category' => $b['category'] ?? 'General',
            'subject' => $b['subject'] ?? null,
            'keywords' => isset($b['keywords']) ? json_decode($b['keywords'], true) : null,
            'classification' => $b['classification'] ?? null,
            'cover_image' => $b['cover_image'] ?? null,
            'created_at' => $b['created_at'] ?? now(),
            'updated_at' => $b['updated_at'] ?? now(),
        ]
    );
}

// 3. Sync Physical Copies
$sqliteCopies = $sqlitePdo->query("SELECT * FROM physical_copies")->fetchAll(PDO::FETCH_ASSOC);
echo "Transferring " . count($sqliteCopies) . " physical copies...\n";
foreach ($sqliteCopies as $c) {
    // Find book in MySQL by ISBN or title
    $sqliteBook = $sqlitePdo->query("SELECT * FROM books WHERE id = {$c['book_id']}")->fetch(PDO::FETCH_ASSOC);
    if ($sqliteBook) {
        $mysqlBook = Book::where('isbn', $sqliteBook['isbn'])->first();
        if ($mysqlBook) {
            PhysicalCopy::updateOrCreate(
                ['barcode' => $c['barcode']],
                [
                    'book_id' => $mysqlBook->id,
                    'copy_id' => $c['copy_id'] ?? "{$c['barcode']}-C1",
                    'accession_number' => $c['accession_number'] ?? $c['barcode'],
                    'shelf_location' => $c['shelf_location'] ?? null,
                    'classification' => $c['classification'] ?? null,
                    'condition' => $c['condition'] ?? 'Good',
                    'status' => $c['status'] ?? 'Available',
                    'date_added' => $c['date_added'] ?? now()->toDateString(),
                    'created_at' => $c['created_at'] ?? now(),
                    'updated_at' => $c['updated_at'] ?? now(),
                ]
            );
        }
    }
}

// 4. Sync Members
$sqliteMembers = $sqlitePdo->query("SELECT * FROM members")->fetchAll(PDO::FETCH_ASSOC);
echo "Transferring " . count($sqliteMembers) . " members...\n";
foreach ($sqliteMembers as $m) {
    Member::updateOrCreate(
        ['member_id' => $m['member_id']],
        [
            'first_name' => $m['first_name'] ?? null,
            'middle_name' => $m['middle_name'] ?? null,
            'last_name' => $m['last_name'] ?? null,
            'full_name' => $m['full_name'],
            'username' => $m['username'] ?? null,
            'date_of_birth' => $m['date_of_birth'] ?? null,
            'gender' => $m['gender'] ?? 'Other',
            'email' => $m['email'] ?? null,
            'phone' => $m['phone'] ?? null,
            'address' => $m['address'] ?? null,
            'membership_type' => $m['membership_type'] ?? 'Student',
            'status' => $m['status'] ?? 'active',
            'photo_url' => $m['photo_url'] ?? null,
            'qr_code_data' => $m['qr_code_data'] ?? $m['member_id'],
            'join_date' => $m['join_date'] ?? now()->toDateString(),
            'total_borrows' => $m['total_borrows'] ?? 0,
            'created_at' => $m['created_at'] ?? now(),
            'updated_at' => $m['updated_at'] ?? now(),
        ]
    );
}

// Also ensure the registered member Maria Clara Santos is populated
$maria = Member::updateOrCreate(
    ['member_id' => 'BPL-2026-0001'],
    [
        'first_name' => 'Maria',
        'middle_name' => 'Clara',
        'last_name' => 'Santos',
        'full_name' => 'Maria Clara Santos',
        'username' => 'maria.santos',
        'email' => 'maria.santos@example.com',
        'gender' => 'Female',
        'membership_type' => 'Student',
        'status' => 'active',
        'qr_code_data' => 'BPL-2026-0001',
        'join_date' => '2026-09-08',
        'total_borrows' => 1
    ]
);

// Ensure Maria has a linked User account
User::updateOrCreate(
    ['email' => 'maria.santos@example.com'],
    [
        'name' => 'Maria Clara Santos',
        'username' => 'maria.santos',
        'password' => Hash::make('P@ssword123'),
        'role' => 'member',
        'status' => 'active',
        'member_id' => 'BPL-2026-0001'
    ]
);

// 5. Ensure Loan Transaction exists
$mockingbird = Book::where('title', 'like', '%Mockingbird%')->first();
if ($mockingbird) {
    $copy = PhysicalCopy::where('book_id', $mockingbird->id)->first();
    CirculationTransaction::updateOrCreate(
        ['transaction_id' => 'BRW-2026-00001'],
        [
            'book_id' => $mockingbird->id,
            'book_title' => $mockingbird->title,
            'book_author' => $mockingbird->author,
            'barcode' => $copy ? $copy->barcode : 'BPL-000002',
            'accession_number' => $copy ? $copy->accession_number : 'ACC-000002',
            'member_id' => 'BPL-2026-0001',
            'member_name' => 'Maria Clara Santos',
            'member_email' => 'maria.santos@example.com',
            'borrow_date' => '2026-09-08',
            'due_date' => '2026-09-15',
            'status' => 'Active',
            'issued_by' => 'Roberto Gomez',
        ]
    );

    if ($copy) {
        $copy->update(['status' => 'Borrowed']);
    }
}

// 6. Sync Audit Logs
$sqliteLogs = $sqlitePdo->query("SELECT * FROM audit_logs")->fetchAll(PDO::FETCH_ASSOC);
echo "Transferring " . count($sqliteLogs) . " audit logs...\n";
foreach ($sqliteLogs as $l) {
    AuditLog::create([
        'action' => $l['action'],
        'category' => $l['category'] ?? 'System',
        'details' => $l['details'],
        'performed_by' => $l['performed_by'] ?? 'System',
        'ip_address' => $l['ip_address'] ?? '127.0.0.1',
        'created_at' => $l['created_at'] ?? now(),
        'updated_at' => $l['updated_at'] ?? now(),
    ]);
}

AuditLog::create([
    'action' => 'LARAGON_MYSQL_CONNECTED',
    'category' => 'System',
    'details' => 'Successfully connected library management system to Laragon MySQL database (final_nani).',
    'performed_by' => 'System Administrator',
    'ip_address' => '127.0.0.1',
]);

echo "\n=== Sync Completed Successfully! ===\n";
echo "MySQL Books: " . Book::count() . "\n";
echo "MySQL Copies: " . PhysicalCopy::count() . "\n";
echo "MySQL Members: " . Member::count() . "\n";
echo "MySQL Transactions: " . CirculationTransaction::count() . "\n";
echo "MySQL Users: " . User::count() . "\n";
echo "MySQL Audit Logs: " . AuditLog::count() . "\n";
