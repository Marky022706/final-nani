<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Member;
use App\Models\Book;
use App\Models\PhysicalCopy;
use App\Models\CirculationTransaction;
use App\Models\BookReservation;
use App\Models\AttendanceRecord;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users
        User::create([
            'name' => 'Eleanor Vance',
            'email' => 'superadmin@balingasag.gov.ph',
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'Roberto Gomez',
            'email' => 'admin.roberto@balingasag.gov.ph',
            'password' => Hash::make('password'),
        ]);

        User::create([
            'name' => 'Juan Dela Cruz',
            'email' => 'juan.delacruz@gmail.com',
            'password' => Hash::make('password'),
        ]);

        // 2. Seed Members
        $members = [
            [
                'member_id' => 'MBR-000001',
                'full_name' => 'Juan Dela Cruz',
                'email' => 'juan.delacruz@gmail.com',
                'phone' => '+63 917 123 4567',
                'address' => 'Brgy. 1 Poblacion, Balingasag, Misamis Oriental',
                'membership_type' => 'Student',
                'status' => 'active',
                'photo_url' => 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                'qr_code_data' => 'MBR-000001',
                'join_date' => '2025-03-01',
                'total_borrows' => 12,
            ],
            [
                'member_id' => 'MBR-000002',
                'full_name' => 'Maria Clara Santos',
                'email' => 'maria.santos@gmail.com',
                'phone' => '+63 928 987 6543',
                'address' => 'Brgy. Waterfall, Balingasag, Misamis Oriental',
                'membership_type' => 'Researcher',
                'status' => 'active',
                'photo_url' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                'qr_code_data' => 'MBR-000002',
                'join_date' => '2025-03-05',
                'total_borrows' => 8,
            ],
            [
                'member_id' => 'MBR-000003',
                'full_name' => 'Carlos Reyes',
                'email' => 'carlos.reyes@balingasagschool.edu.ph',
                'phone' => '+63 945 332 1122',
                'address' => 'Brgy. Baliwagan, Balingasag, Misamis Oriental',
                'membership_type' => 'Faculty',
                'status' => 'active',
                'photo_url' => 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
                'qr_code_data' => 'MBR-000003',
                'join_date' => '2025-03-12',
                'total_borrows' => 19,
            ],
            [
                'member_id' => 'MBR-000004',
                'full_name' => 'Beatriz Alonzo',
                'email' => 'beatriz.a@gmail.com',
                'phone' => '+63 912 445 7890',
                'address' => 'Brgy. Linggangao, Balingasag, Misamis Oriental',
                'membership_type' => 'Community',
                'status' => 'active',
                'photo_url' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
                'qr_code_data' => 'MBR-000004',
                'join_date' => '2025-04-01',
                'total_borrows' => 5,
            ],
            [
                'member_id' => 'MBR-000005',
                'full_name' => 'Antonio Luna',
                'email' => 'antonio.luna@outlook.com',
                'phone' => '+63 930 112 3344',
                'address' => 'Brgy. Binitinan, Balingasag, Misamis Oriental',
                'membership_type' => 'Student',
                'status' => 'inactive',
                'photo_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                'qr_code_data' => 'MBR-000005',
                'join_date' => '2025-04-10',
                'total_borrows' => 2,
            ],
        ];

        foreach ($members as $m) {
            Member::create($m);
        }

        // 3. Seed Books & Physical Copies
        $b1 = Book::create([
            'isbn' => '978-0132350884',
            'title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
            'subtitle' => 'Principles, Patterns, and Practices for Professional Developers',
            'author' => 'Robert C. Martin',
            'publisher' => 'Prentice Hall',
            'publication_year' => 2008,
            'edition' => '1st Edition',
            'language' => 'English',
            'description' => 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees.',
            'pages' => 464,
            'category' => 'Technology & Computing',
            'subject' => 'Software Engineering / Clean Architecture',
            'keywords' => ['programming', 'agile', 'refactoring', 'best practices'],
            'classification' => '005.133 MAR',
            'cover_image' => 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop&q=80',
        ]);

        PhysicalCopy::create([
            'book_id' => $b1->id,
            'copy_id' => 'cp-101',
            'accession_number' => 'ACC-000101',
            'barcode' => 'BPL-000101',
            'shelf_location' => 'Stack A-2, Tech Section',
            'classification' => '005.133 MAR',
            'condition' => 'Good',
            'status' => 'Borrowed',
            'date_added' => '2025-01-15',
        ]);

        PhysicalCopy::create([
            'book_id' => $b1->id,
            'copy_id' => 'cp-102',
            'accession_number' => 'ACC-000102',
            'barcode' => 'BPL-000102',
            'shelf_location' => 'Stack A-2, Tech Section',
            'classification' => '005.133 MAR',
            'condition' => 'New',
            'status' => 'Available',
            'date_added' => '2025-01-15',
        ]);

        $b2 = Book::create([
            'isbn' => '978-0261102217',
            'title' => 'The Hobbit, or There and Back Again',
            'subtitle' => 'The Enchanting Prelude to The Lord of the Rings',
            'author' => 'J.R.R. Tolkien',
            'publisher' => 'HarperCollins',
            'publication_year' => 1937,
            'edition' => 'Illustrated Edition',
            'language' => 'English',
            'description' => 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life.',
            'pages' => 310,
            'category' => 'Literature & Fiction',
            'subject' => 'Fantasy Fiction / Epic Adventure',
            'keywords' => ['middle-earth', 'bilbo', 'dragon', 'classic fantasy'],
            'classification' => '823.912 TOL',
            'cover_image' => 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80',
        ]);

        PhysicalCopy::create([
            'book_id' => $b2->id,
            'copy_id' => 'cp-103',
            'accession_number' => 'ACC-000103',
            'barcode' => 'BPL-000103',
            'shelf_location' => 'Stack F-1, Fiction',
            'classification' => '823.912 TOL',
            'condition' => 'Good',
            'status' => 'Borrowed',
            'date_added' => '2025-02-01',
        ]);

        PhysicalCopy::create([
            'book_id' => $b2->id,
            'copy_id' => 'cp-104',
            'accession_number' => 'ACC-000104',
            'barcode' => 'BPL-000104',
            'shelf_location' => 'Stack F-1, Fiction',
            'classification' => '823.912 TOL',
            'condition' => 'Good',
            'status' => 'Available',
            'date_added' => '2025-02-01',
        ]);

        PhysicalCopy::create([
            'book_id' => $b2->id,
            'copy_id' => 'cp-105',
            'accession_number' => 'ACC-000105',
            'barcode' => 'BPL-000105',
            'shelf_location' => 'Stack F-1, Fiction',
            'classification' => '823.912 TOL',
            'condition' => 'Fair',
            'status' => 'Reserved',
            'date_added' => '2025-02-01',
        ]);

        $b3 = Book::create([
            'isbn' => '978-0062316097',
            'title' => 'Sapiens: A Brief History of Humankind',
            'subtitle' => 'From the Stone Age to the Silicon Age',
            'author' => 'Yuval Noah Harari',
            'publisher' => 'Harper',
            'publication_year' => 2015,
            'edition' => 'First Edition',
            'language' => 'English',
            'description' => 'One hundred thousand years ago, at least six human species inhabited the earth.',
            'pages' => 443,
            'category' => 'History & Anthropology',
            'subject' => 'Human Evolution / World History',
            'keywords' => ['anthropology', 'evolution', 'civilization', 'sociology'],
            'classification' => '909 HAR',
            'cover_image' => 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
        ]);

        PhysicalCopy::create([
            'book_id' => $b3->id,
            'copy_id' => 'cp-106',
            'accession_number' => 'ACC-000106',
            'barcode' => 'BPL-000106',
            'shelf_location' => 'Stack H-3, General History',
            'classification' => '909 HAR',
            'condition' => 'New',
            'status' => 'Available',
            'date_added' => '2025-02-10',
        ]);

        $b4 = Book::create([
            'isbn' => '978-0743273565',
            'title' => 'The Great Gatsby',
            'subtitle' => 'The Definitive F. Scott Fitzgerald Classic',
            'author' => 'F. Scott Fitzgerald',
            'publisher' => 'Scribner',
            'publication_year' => 1925,
            'edition' => 'Scribner Classics',
            'language' => 'English',
            'description' => 'The story of the mysteriously wealthy Jay Gatsby and his unrequited love for Daisy Buchanan.',
            'pages' => 180,
            'category' => 'Literature & Fiction',
            'subject' => 'American Literature / Jazz Age',
            'keywords' => ['classic', 'jazz age', 'roaring twenties', 'american dream'],
            'classification' => '813.52 FIT',
            'cover_image' => 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
        ]);

        PhysicalCopy::create([
            'book_id' => $b4->id,
            'copy_id' => 'cp-107',
            'accession_number' => 'ACC-000107',
            'barcode' => 'BPL-000107',
            'shelf_location' => 'Stack F-2, Classics',
            'classification' => '813.52 FIT',
            'condition' => 'Good',
            'status' => 'Available',
            'date_added' => '2025-02-14',
        ]);

        $b5 = Book::create([
            'isbn' => '978-0131103627',
            'title' => 'The C Programming Language',
            'subtitle' => 'ANSI C Edition',
            'author' => 'Brian W. Kernighan & Dennis M. Ritchie',
            'publisher' => 'Prentice Hall',
            'publication_year' => 1988,
            'edition' => '2nd Edition',
            'language' => 'English',
            'description' => 'The definitive guide to ANSI standard C by the original developers of the language.',
            'pages' => 272,
            'category' => 'Technology & Computing',
            'subject' => 'Systems Programming / Computer Science',
            'keywords' => ['c language', 'unix', 'low level', 'algorithms'],
            'classification' => '005.133 KER',
            'cover_image' => 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=400&auto=format&fit=crop&q=80',
        ]);

        PhysicalCopy::create([
            'book_id' => $b5->id,
            'copy_id' => 'cp-108',
            'accession_number' => 'ACC-000108',
            'barcode' => 'BPL-000108',
            'shelf_location' => 'Stack A-1, Tech Reference',
            'classification' => '005.133 KER',
            'condition' => 'Fair',
            'status' => 'Available',
            'date_added' => '2025-01-20',
        ]);

        // 4. Seed Circulation Transactions
        CirculationTransaction::create([
            'transaction_id' => 'BRW-2026-00001',
            'book_id' => $b1->id,
            'book_title' => 'Clean Code: A Handbook of Agile Software Craftsmanship',
            'book_author' => 'Robert C. Martin',
            'accession_number' => 'ACC-000101',
            'barcode' => 'BPL-000101',
            'member_id' => 'MBR-000001',
            'member_name' => 'Juan Dela Cruz',
            'borrow_date' => '2026-08-25',
            'due_date' => '2026-09-08',
            'status' => 'Active',
            'renewal_count' => 0,
            'processed_by' => 'Roberto Gomez',
        ]);

        CirculationTransaction::create([
            'transaction_id' => 'BRW-2026-00002',
            'book_id' => $b2->id,
            'book_title' => 'The Hobbit, or There and Back Again',
            'book_author' => 'J.R.R. Tolkien',
            'accession_number' => 'ACC-000103',
            'barcode' => 'BPL-000103',
            'member_id' => 'MBR-000002',
            'member_name' => 'Maria Clara Santos',
            'borrow_date' => '2026-08-28',
            'due_date' => '2026-09-11',
            'status' => 'Active',
            'renewal_count' => 0,
            'processed_by' => 'Roberto Gomez',
        ]);

        // 5. Seed Book Reservations
        BookReservation::create([
            'book_id' => $b2->id,
            'book_title' => 'The Hobbit, or There and Back Again',
            'member_id' => 'MBR-000003',
            'member_name' => 'Carlos Reyes',
            'reservation_date' => '2026-08-30',
            'expiry_date' => '2026-09-06',
            'status' => 'Ready for Pickup',
            'queue_position' => 1,
            'notes' => 'Faculty research reservation',
        ]);

        // 6. Seed Attendance Records
        AttendanceRecord::create([
            'member_id' => 'MBR-000001',
            'member_name' => 'Juan Dela Cruz',
            'membership_type' => 'Student',
            'date' => '2026-08-31',
            'time_in' => '03:15 PM',
            'status' => 'Inside',
            'notes' => 'Thesis research and study',
        ]);

        AttendanceRecord::create([
            'member_id' => 'MBR-000002',
            'member_name' => 'Maria Clara Santos',
            'membership_type' => 'Researcher',
            'date' => '2026-08-31',
            'time_in' => '01:30 PM',
            'status' => 'Inside',
            'notes' => 'Reference section use',
        ]);

        AttendanceRecord::create([
            'member_id' => 'MBR-000003',
            'member_name' => 'Carlos Reyes',
            'membership_type' => 'Faculty',
            'date' => '2026-08-31',
            'time_in' => '09:15 AM',
            'time_out' => '11:45 AM',
            'duration' => '2h 30m',
            'status' => 'Completed',
            'notes' => 'Curriculum reference review',
        ]);

        // 7. Seed Audit Logs
        AuditLog::create([
            'action' => 'Member Login',
            'category' => 'System',
            'details' => 'Patron MBR-000001 logged into Library OPAC',
            'performed_by' => 'Juan Dela Cruz',
            'ip_address' => '192.168.1.102',
        ]);

        AuditLog::create([
            'action' => 'Book Issued',
            'category' => 'Circulation',
            'details' => 'Clean Code (BPL-000101) issued to Juan Dela Cruz (MBR-000001)',
            'performed_by' => 'Roberto Gomez',
            'ip_address' => '192.168.1.50',
        ]);

        // 8. Seed Notifications
        Notification::create([
            'title' => 'Welcome to Balingasag Public Library',
            'message' => 'Your digital library patron account is active. Explore thousands of books online.',
            'type' => 'info',
            'read' => false,
            'target_role' => 'all',
        ]);

        Notification::create([
            'title' => 'Borrow Transaction Confirmed',
            'message' => 'Clean Code (BPL-000101) borrowed. Due on September 8, 2026.',
            'type' => 'success',
            'read' => false,
            'target_member_id' => 'MBR-000001',
        ]);
    }
}
