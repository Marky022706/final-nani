<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Book;
use App\Models\PhysicalCopy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

class BookImportTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        // Create or get an admin user
        $this->admin = User::firstOrCreate(
            ['email' => 'admin@balingasag.gov.ph'],
            [
                'name' => 'Test Admin',
                'password' => bcrypt('password123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }

    public function test_rejects_missing_column_headers(): void
    {
        $csvContent = "ISBN,Title\n978-0132350884,Clean Code\n";
        $file = UploadedFile::fake()->createWithContent('invalid_headers.csv', $csvContent);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import/validate', [
                'file' => $file,
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['success' => false]);
        $this->assertStringContainsString('Missing required column headers', $response->json('message'));
    }

    public function test_rejects_duplicate_column_headers(): void
    {
        $csvContent = "ISBN,Title,Author,Quantity,ISBN\n978-0132350884,Clean Code,Robert C. Martin,2,test\n";
        $file = UploadedFile::fake()->createWithContent('dup_headers.csv', $csvContent);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import/validate', [
                'file' => $file,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Duplicate column header detected', $response->json('message'));
    }

    public function test_flags_missing_fields_and_invalid_quantities(): void
    {
        $rows = [
            ['file_row_num' => 2, 'isbn' => '', 'title' => 'Missing ISBN', 'author' => 'Author A', 'quantity' => '2'],
            ['file_row_num' => 3, 'isbn' => '978-0132350884', 'title' => '', 'author' => 'Author B', 'quantity' => '3'],
            ['file_row_num' => 4, 'isbn' => '978-0201616224', 'title' => 'Invalid Qty', 'author' => 'Author C', 'quantity' => '2.5'],
            ['file_row_num' => 5, 'isbn' => '978-0143127741', 'title' => 'Zero Qty', 'author' => 'Author D', 'quantity' => '0'],
            ['file_row_num' => 6, 'isbn' => '978-0596007126', 'title' => 'Negative Qty', 'author' => 'Author E', 'quantity' => '-5'],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import/validate', [
                'rows' => $rows,
            ]);

        $response->assertStatus(200);
        $summary = $response->json('summary');
        $this->assertEquals(5, $summary['invalid_rows']);
        $this->assertEquals(0, $summary['valid_rows']);
        $this->assertFalse($summary['can_import']);
    }

    public function test_detects_duplicates_within_file(): void
    {
        $rows = [
            ['file_row_num' => 2, 'isbn' => '978-0132350884', 'title' => 'Book 1', 'author' => 'Author 1', 'quantity' => '1'],
            ['file_row_num' => 3, 'isbn' => '9780132350884', 'title' => 'Book 1 Duplicate', 'author' => 'Author 1', 'quantity' => '2'],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import/validate', [
                'rows' => $rows,
            ]);

        $response->assertStatus(200);
        $summary = $response->json('summary');
        $this->assertGreaterThanOrEqual(1, $summary['duplicate_file_rows']);
    }

    public function test_detects_duplicates_against_database(): void
    {
        // Get or create existing book
        $existing = Book::first();
        if (!$existing) {
            $existing = Book::create([
                'isbn' => '978-1111111111',
                'title' => 'Existing Database Book',
                'author' => 'Existing Author',
            ]);
        }

        $rows = [
            ['file_row_num' => 2, 'isbn' => $existing->isbn, 'title' => 'Attempted Overwrite', 'author' => 'Author', 'quantity' => '1'],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import/validate', [
                'rows' => $rows,
            ]);

        $response->assertStatus(200);
        $summary = $response->json('summary');
        $this->assertEquals(1, $summary['duplicate_db_rows']);
        $this->assertEquals(0, $summary['valid_rows']);
    }

    public function test_all_or_nothing_mode_aborts_on_errors(): void
    {
        $rows = [
            ['file_row_num' => 2, 'isbn' => '978-0132350884', 'title' => 'Valid Title', 'author' => 'Valid Author', 'quantity' => '1'],
            ['file_row_num' => 3, 'isbn' => 'invalid-isbn', 'title' => 'Bad ISBN', 'author' => 'Author', 'quantity' => '1'],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import', [
                'rows' => $rows,
                'mode' => 'all_or_nothing',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Import aborted', $response->json('message'));
    }

    public function test_successful_transactional_import(): void
    {
        // Generate unique ISBN
        $uniqueIsbn = '978-0321125217'; // Domain-Driven Design
        Book::where('isbn', $uniqueIsbn)->orWhere('isbn', '9780321125217')->delete();

        $rows = [
            [
                'file_row_num' => 2,
                'isbn' => $uniqueIsbn,
                'title' => 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
                'author' => 'Eric Evans',
                'quantity' => '3',
                'accession_number' => 'BPL-ACC-9999',
            ],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/books/import', [
                'rows' => $rows,
                'mode' => 'all_or_nothing',
            ]);

        $response->assertStatus(201);
        $this->assertEquals(1, $response->json('imported_count'));
        $this->assertEquals(3, $response->json('total_copies_created'));

        $this->assertDatabaseHas('books', [
            'isbn' => $uniqueIsbn,
            'title' => 'Domain-Driven Design: Tackling Complexity in the Heart of Software',
        ]);

        $createdBook = Book::where('isbn', $uniqueIsbn)->first();
        $this->assertNotNull($createdBook);
        $this->assertEquals(3, $createdBook->copies()->count());
    }
}
