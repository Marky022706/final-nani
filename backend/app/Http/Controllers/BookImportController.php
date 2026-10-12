<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\PhysicalCopy;
use App\Models\AuditLog;
use App\Services\SimpleXlsxParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class BookImportController extends Controller
{
    private const REQUIRED_HEADERS = ['isbn', 'title', 'author', 'quantity'];
    private const MAX_FILE_SIZE_BYTES = 5242880; // 5 MB
    private const MAX_ROWS = 1000;

    /**
     * Checks if current authenticated user has administrative import permission.
     */
    private function checkPermission(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $effectivePrivs = method_exists($user, 'getEffectivePrivileges') ? $user->getEffectivePrivileges() : [];
        $hasInventoryPriv = !empty($effectivePrivs['inventoryManagement']);

        if (!in_array($user->role, ['super_admin', 'admin']) && !$hasInventoryPriv) {
            return response()->json([
                'message' => 'Access denied: Only authorized administrators can perform bulk book imports.'
            ], 403);
        }

        return null;
    }

    /**
     * Parse raw rows from either uploaded file or request body.
     *
     * @return array{0: array<int, array<string, string>>, 1: ?string, 2: array<string>} [rows, error, headers]
     */
    private function extractRowsFromRequest(Request $request): array
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');

            if (!$file->isValid()) {
                return [[], 'Uploaded file is corrupted or failed to upload.', []];
            }

            if ($file->getSize() > self::MAX_FILE_SIZE_BYTES) {
                return [[], 'File size exceeds maximum threshold of 5 MB.', []];
            }

            $ext = strtolower($file->getClientOriginalExtension());
            $realPath = $file->getRealPath();

            if (!in_array($ext, ['csv', 'xlsx'])) {
                return [[], 'Unsupported file format. Only .csv and .xlsx files are supported.', []];
            }

            // Verify content
            $fileContent = file_get_contents($realPath, false, null, 0, 1024);
            if ($fileContent === false || strlen($fileContent) === 0) {
                return [[], 'The uploaded file is empty.', []];
            }

            if ($ext === 'xlsx') {
                if (strncmp($fileContent, "PK\x03\x04", 4) !== 0) {
                    return [[], 'File signature mismatch: file is not a valid Excel (.xlsx) spreadsheet.', []];
                }
                try {
                    $rawMatrix = SimpleXlsxParser::parse($realPath);
                } catch (Exception $e) {
                    return [[], 'Failed to parse Excel spreadsheet: ' . $e->getMessage(), []];
                }
            } else {
                // Parse CSV
                $rawMatrix = [];
                $handle = fopen($realPath, 'r');
                if ($handle === false) {
                    return [[], 'Unable to read CSV file.', []];
                }

                // Remove UTF-8 BOM if present
                $bom = fread($handle, 3);
                if ($bom !== "\xEF\xBB\xBF") {
                    rewind($handle);
                }

                while (($row = fgetcsv($handle)) !== false) {
                    $rawMatrix[] = $row;
                }
                fclose($handle);
            }

            if (empty($rawMatrix)) {
                return [[], 'The uploaded file contains no data rows.', []];
            }

            // Extract and verify headers
            $headerRow = array_shift($rawMatrix);
            $cleanHeaders = array_map(function ($h) {
                return strtolower(trim((string) $h));
            }, $headerRow);

            // Check duplicate headers
            $counts = array_count_values(array_filter($cleanHeaders, fn($h) => $h !== ''));
            foreach ($counts as $name => $count) {
                if ($count > 1) {
                    return [[], "Duplicate column header detected: \"{$name}\"", $cleanHeaders];
                }
            }

            // Check missing required headers
            $missing = [];
            foreach (self::REQUIRED_HEADERS as $req) {
                if (!in_array($req, $cleanHeaders, true)) {
                    $missing[] = ucfirst($req);
                }
            }

            if (!empty($missing)) {
                return [[], 'Missing required column headers: ' . implode(', ', $missing) . '. Required: ISBN, Title, Author, Quantity.', $cleanHeaders];
            }

            // Map rows to associative arrays
            $mappedRows = [];
            $colIndexes = [];
            foreach (self::REQUIRED_HEADERS as $req) {
                $colIndexes[$req] = array_search($req, $cleanHeaders, true);
            }

            foreach ($rawMatrix as $rowIndex => $cols) {
                // Check if row is entirely empty
                $trimmedCols = array_map('trim', array_map('strval', $cols));
                if (count(array_filter($trimmedCols, fn($v) => $v !== '')) === 0) {
                    continue; // Skip completely blank lines
                }

                $mappedRows[] = [
                    'file_row_num' => $rowIndex + 2, // 1-based, accounting for header
                    'isbn' => trim((string) ($cols[$colIndexes['isbn']] ?? '')),
                    'title' => trim((string) ($cols[$colIndexes['title']] ?? '')),
                    'author' => trim((string) ($cols[$colIndexes['author']] ?? '')),
                    'quantity' => trim((string) ($cols[$colIndexes['quantity']] ?? '')),
                ];
            }

            return [$mappedRows, null, $cleanHeaders];
        }

        // Handle JSON payload
        if ($request->has('rows') && is_array($request->input('rows'))) {
            $rawList = $request->input('rows');
            $mappedRows = [];
            foreach ($rawList as $index => $item) {
                $mappedRows[] = [
                    'file_row_num' => $item['rowNumber'] ?? $item['file_row_num'] ?? ($index + 2),
                    'isbn' => trim((string) ($item['isbn'] ?? '')),
                    'title' => trim((string) ($item['title'] ?? '')),
                    'author' => trim((string) ($item['author'] ?? '')),
                    'quantity' => trim((string) ($item['quantity'] ?? '')),
                ];
            }
            return [$mappedRows, null, self::REQUIRED_HEADERS];
        }

        return [[], 'No file or records provided for import.', []];
    }

    /**
     * Validate ISBN-10 or ISBN-13 checksum format.
     */
    private function validateIsbnFormat(string $normalized): bool
    {
        $len = strlen($normalized);

        // ISBN-10
        if ($len === 10) {
            $sum = 0;
            for ($i = 0; $i < 9; $i++) {
                if (!ctype_digit($normalized[$i])) return false;
                $sum += ((int) $normalized[$i]) * (10 - $i);
            }
            $last = $normalized[9];
            $sum += ($last === 'X' ? 10 : (ctype_digit($last) ? (int) $last : -999));
            return ($sum >= 0) && ($sum % 11 === 0);
        }

        // ISBN-13
        if ($len === 13) {
            if (!ctype_digit($normalized)) return false;
            $sum = 0;
            for ($i = 0; $i < 12; $i++) {
                $weight = ($i % 2 === 0) ? 1 : 3;
                $sum += ((int) $normalized[$i]) * $weight;
            }
            $check = (10 - ($sum % 10)) % 10;
            return $check === ((int) $normalized[12]);
        }

        return false;
    }

    /**
     * Comprehensive validation of parsed rows.
     *
     * @param array<int, array<string, mixed>> $rows
     * @return array{validated_rows: array<int, mixed>, summary: array<string, int|bool>}
     */
    private function validateRowsData(array $rows): array
    {
        // 1. Fetch all existing books and index by normalized ISBN
        $existingBooks = Book::select('id', 'isbn', 'title', 'author')->get();
        $dbIsbnMap = [];
        foreach ($existingBooks as $book) {
            $cleaned = strtoupper((string) preg_replace('/[-\s]/', '', $book->isbn));
            $dbIsbnMap[$cleaned] = [
                'id' => $book->id,
                'title' => $book->title,
                'author' => $book->author,
                'isbn' => $book->isbn,
            ];
        }

        // 2. Track ISBN occurrences within this upload to detect duplicates
        $fileIsbnOccurrences = [];
        foreach ($rows as $r) {
            $rawIsbn = (string) $r['isbn'];
            $cleaned = strtoupper((string) preg_replace('/[-\s]/', '', $rawIsbn));
            if ($cleaned !== '') {
                if (!isset($fileIsbnOccurrences[$cleaned])) {
                    $fileIsbnOccurrences[$cleaned] = [];
                }
                $fileIsbnOccurrences[$cleaned][] = $r['file_row_num'];
            }
        }

        $validatedRows = [];
        $validCount = 0;
        $invalidCount = 0;
        $duplicateFileCount = 0;
        $duplicateDbCount = 0;

        foreach ($rows as $r) {
            $rowNum = $r['file_row_num'];
            $rawIsbn = (string) $r['isbn'];
            $rawTitle = (string) $r['title'];
            $rawAuthor = (string) $r['author'];
            $rawQuantity = (string) $r['quantity'];

            $errors = [];
            $status = 'valid';
            $cleanedIsbn = strtoupper((string) preg_replace('/[-\s]/', '', $rawIsbn));
            $parsedQuantity = null;

            // Missing mandatory fields
            if ($rawIsbn === '') {
                $errors[] = 'ISBN is required.';
            }
            if ($rawTitle === '') {
                $errors[] = 'Title is required.';
            }
            if ($rawAuthor === '') {
                $errors[] = 'Author is required.';
            }
            if ($rawQuantity === '') {
                $errors[] = 'Quantity is required.';
            }

            // Quantity constraints & casting
            if ($rawQuantity !== '') {
                if (str_contains($rawQuantity, '.') || str_contains($rawQuantity, ',')) {
                    $errors[] = "Quantity must be a positive whole number (decimal values like '{$rawQuantity}' are not allowed).";
                } elseif (!ctype_digit($rawQuantity)) {
                    $errors[] = "Quantity must be a valid numeric integer.";
                } else {
                    $qtyInt = (int) $rawQuantity;
                    if ($qtyInt <= 0) {
                        $errors[] = "Quantity must be greater than zero.";
                    } elseif ($qtyInt > 10000) {
                        $errors[] = "Quantity exceeds maximum allowable batch limit of 10,000.";
                    } else {
                        $parsedQuantity = $qtyInt;
                    }
                }
            }

            // ISBN format validation
            if ($cleanedIsbn !== '') {
                if (!$this->validateIsbnFormat($cleanedIsbn)) {
                    $errors[] = "Invalid ISBN format (must be a valid 10-digit or 13-digit standard ISBN).";
                }
            }

            // Duplicate detection within uploaded file
            $duplicateWithRow = null;
            if ($cleanedIsbn !== '' && isset($fileIsbnOccurrences[$cleanedIsbn]) && count($fileIsbnOccurrences[$cleanedIsbn]) > 1) {
                $occurrences = $fileIsbnOccurrences[$cleanedIsbn];
                $otherRows = array_filter($occurrences, fn($rn) => $rn !== $rowNum);
                $firstRow = reset($occurrences);
                $duplicateWithRow = $firstRow !== $rowNum ? $firstRow : reset($otherRows);

                if ($firstRow !== $rowNum) {
                    $status = 'duplicate_file';
                    $errors[] = "Duplicate ISBN in file: conflicts with Row {$firstRow}. Use 'Quantity' to add multiple copies.";
                } else {
                    // First occurrence is also flagged with duplicate notice
                    $otherRowsStr = implode(', ', $otherRows);
                    $errors[] = "Duplicate ISBN in file: matches subsequent Row(s) {$otherRowsStr}.";
                }
            }

            // Duplicate detection against existing Database records
            $existingBookMatch = null;
            if ($cleanedIsbn !== '' && isset($dbIsbnMap[$cleanedIsbn])) {
                $status = 'duplicate_db';
                $existingBookMatch = $dbIsbnMap[$cleanedIsbn];
                $errors[] = "ISBN already exists in database (Title: \"{$existingBookMatch['title']}\", ISBN: {$existingBookMatch['isbn']}).";
            }

            if (!empty($errors) && $status === 'valid') {
                $status = 'invalid';
            }

            if ($status === 'valid') {
                $validCount++;
            } elseif ($status === 'duplicate_file') {
                $duplicateFileCount++;
            } elseif ($status === 'duplicate_db') {
                $duplicateDbCount++;
            } else {
                $invalidCount++;
            }

            $validatedRows[] = [
                'row_number' => $rowNum,
                'isbn' => $rawIsbn,
                'normalized_isbn' => $cleanedIsbn,
                'title' => $rawTitle,
                'author' => $rawAuthor,
                'quantity' => $parsedQuantity,
                'raw_quantity' => $rawQuantity,
                'status' => $status,
                'errors' => $errors,
                'duplicate_with_row' => $duplicateWithRow,
                'existing_book' => $existingBookMatch,
            ];
        }

        $totalRows = count($rows);
        $summary = [
            'total_rows' => $totalRows,
            'valid_rows' => $validCount,
            'invalid_rows' => $invalidCount,
            'duplicate_file_rows' => $duplicateFileCount,
            'duplicate_db_rows' => $duplicateDbCount,
            'can_import' => ($totalRows > 0 && $validCount > 0 && $invalidCount === 0 && $duplicateFileCount === 0 && $duplicateDbCount === 0),
        ];

        return [
            'validated_rows' => $validatedRows,
            'summary' => $summary,
        ];
    }

    /**
     * Preview and validation endpoint.
     */
    public function validateImport(Request $request)
    {
        if ($err = $this->checkPermission($request)) {
            return $err;
        }

        [$rows, $extractError, $headers] = $this->extractRowsFromRequest($request);

        if ($extractError) {
            return response()->json([
                'success' => false,
                'message' => $extractError,
                'headers' => $headers,
                'summary' => [
                    'total_rows' => 0,
                    'valid_rows' => 0,
                    'invalid_rows' => 0,
                    'duplicate_file_rows' => 0,
                    'duplicate_db_rows' => 0,
                    'can_import' => false,
                ],
                'rows' => [],
            ], 422);
        }

        if (count($rows) > self::MAX_ROWS) {
            return response()->json([
                'success' => false,
                'message' => "Uploaded file contains " . count($rows) . " rows, which exceeds the maximum limit of " . self::MAX_ROWS . " records per batch.",
            ], 422);
        }

        $validationResult = $this->validateRowsData($rows);

        return response()->json([
            'success' => true,
            'headers' => $headers,
            'summary' => $validationResult['summary'],
            'rows' => $validationResult['validated_rows'],
        ]);
    }

    /**
     * Commit book import inside a database transaction.
     */
    public function import(Request $request)
    {
        if ($err = $this->checkPermission($request)) {
            return $err;
        }

        $mode = $request->input('mode', 'all_or_nothing'); // 'all_or_nothing' or 'skip_errors'
        [$rows, $extractError, $headers] = $this->extractRowsFromRequest($request);

        if ($extractError) {
            return response()->json([
                'success' => false,
                'message' => $extractError,
            ], 422);
        }

        if (empty($rows)) {
            return response()->json([
                'success' => false,
                'message' => 'No book records found to import.',
            ], 422);
        }

        if (count($rows) > self::MAX_ROWS) {
            return response()->json([
                'success' => false,
                'message' => "File contains " . count($rows) . " rows, exceeding maximum limit of " . self::MAX_ROWS . ".",
            ], 422);
        }

        // Revalidate all rows on the server before transaction
        $validationResult = $this->validateRowsData($rows);
        $summary = $validationResult['summary'];
        $validatedRows = $validationResult['validated_rows'];

        if ($mode === 'all_or_nothing') {
            if ($summary['invalid_rows'] > 0 || $summary['duplicate_file_rows'] > 0 || $summary['duplicate_db_rows'] > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Import aborted: File contains {$summary['invalid_rows']} invalid records, {$summary['duplicate_file_rows']} file duplicates, and {$summary['duplicate_db_rows']} existing database records. All-or-nothing mode requires 100% valid records.",
                    'summary' => $summary,
                    'rows' => $validatedRows,
                ], 422);
            }
        }

        $rowsToImport = array_filter($validatedRows, fn($r) => $r['status'] === 'valid');

        if (empty($rowsToImport)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid book records eligible for import.',
                'summary' => $summary,
            ], 422);
        }

        $user = $request->user();
        $importedBooks = [];
        $totalCopiesCreated = 0;

        DB::beginTransaction();
        try {
            // Determine starting sequence safely from highest ID or barcode
            $maxCopyId = (int) PhysicalCopy::max('id');
            $latestBarcode = PhysicalCopy::where('barcode', 'LIKE', 'BPL-%')->orderByDesc('id')->value('barcode');
            $latestNum = 0;
            if ($latestBarcode && preg_match('/BPL-(\d+)/', $latestBarcode, $m)) {
                $latestNum = (int) $m[1];
            }
            $currentSeq = max($maxCopyId, $latestNum);

            foreach ($rowsToImport as $row) {
                $book = Book::create([
                    'isbn' => $row['isbn'],
                    'title' => $row['title'],
                    'author' => $row['author'],
                    'category' => 'General Collection',
                    'classification' => 'General Stacks',
                    'language' => 'English',
                    'publisher' => 'Balingasag Municipal Library',
                    'publication_year' => (int) date('Y'),
                    'pages' => 0,
                    'is_archived' => false,
                ]);

                $qty = (int) $row['quantity'];
                for ($i = 1; $i <= $qty; $i++) {
                    $currentSeq++;
                    $padded = str_pad((string) $currentSeq, 6, '0', STR_PAD_LEFT);
                    PhysicalCopy::create([
                        'book_id' => $book->id,
                        'copy_id' => "cp-{$padded}",
                        'accession_number' => "ACC-{$padded}",
                        'barcode' => "BPL-{$padded}",
                        'shelf_location' => 'General Stacks',
                        'classification' => $book->classification,
                        'condition' => 'New',
                        'status' => 'Available',
                        'date_added' => now()->toDateString(),
                    ]);
                    $totalCopiesCreated++;
                }

                $importedBooks[] = $book->load('copies');
            }

            AuditLog::create([
                'action' => 'BULK_BOOK_IMPORT',
                'category' => 'Books',
                'details' => "Bulk imported " . count($importedBooks) . " book title(s) with {$totalCopiesCreated} physical copies",
                'performed_by' => $user->name ?? 'Staff',
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully imported " . count($importedBooks) . " book(s) with {$totalCopiesCreated} physical copies.",
                'imported_count' => count($importedBooks),
                'total_copies_created' => $totalCopiesCreated,
                'books' => $importedBooks,
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Database transaction failed during bulk import. No records were saved.',
            ], 500);
        }
    }

    /**
     * Download sample template in CSV format.
     */
    public function downloadTemplate(Request $request)
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="bpl_bulk_book_import_template.csv"',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['ISBN', 'Title', 'Author', 'Quantity']);
            fputcsv($handle, ['978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '3']);
            fputcsv($handle, ['978-0201616224', 'The Pragmatic Programmer', 'David Thomas, Andrew Hunt', '2']);
            fputcsv($handle, ['978-0143127741', 'Designing Data-Intensive Applications', 'Martin Kleppmann', '1']);
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
