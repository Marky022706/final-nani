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
    private const REQUIRED_HEADERS = ['book_title', 'author', 'format', 'accession_number', 'availability', 'quantity'];
    private const MAX_FILE_SIZE_BYTES = 5242880; // 5 MB
    private const MAX_ROWS = 1000;

    /**
     * Resolves spreadsheet header labels against catalog fields.
     */
    public static function resolveHeader(string $header): ?string
    {
        $clean = strtolower(trim($header));
        $clean = preg_replace('/[*()]/', '', $clean);
        $clean = preg_replace('/\s+/', ' ', trim($clean));

        if (in_array($clean, ['book title', 'title', 'book_title', 'primary book title'])) return 'book_title';
        if (in_array($clean, ['category', 'book category', 'genre'])) return 'category';
        if (in_array($clean, ['subtitle', 'sub title', 'subtitle or edition notes'])) return 'subtitle';
        if (in_array($clean, ['author', 'authors', 'author full name', 'primary author'])) return 'author';
        if (in_array($clean, ['publisher', 'publishing house'])) return 'publisher';
        if (in_array($clean, ['publication year', 'year', 'pub year', 'publication_year', 'published year'])) return 'publication_year';
        if (in_array($clean, ['classification ddc', 'classification', 'ddc', 'dewey decimal', 'call number'])) return 'classification';
        if (in_array($clean, ['format', 'binding', 'book format'])) return 'format';
        if (in_array($clean, ['accession number', 'accession', 'accession no', 'accession_number'])) return 'accession_number';
        if (in_array($clean, ['availability', 'status', 'availability status'])) return 'availability';
        if (in_array($clean, ['description / abstract', 'description', 'abstract', 'summary'])) return 'description';
        if (in_array($clean, ['number of copies', 'copies', 'quantity', 'qty', 'number_of_copies'])) return 'quantity';
        if (in_array($clean, ['isbn', 'isbn 10', 'isbn 13', 'isbn10', 'isbn13'])) return 'isbn';

        return null;
    }

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

            // Dynamically locate the header row (supports files with top institutional headers or banners)
            $headerRowIndex = 0;
            foreach ($rawMatrix as $rIdx => $row) {
                if ($rIdx > 12) break;
                $trimmedRow = array_map('trim', array_map('strval', $row));
                if (count(array_filter($trimmedRow, fn($v) => $v !== '')) === 0) continue;
                if (str_starts_with($trimmedRow[0], '#')) continue;

                $canonicals = array_filter(array_map(fn($h) => self::resolveHeader((string) $h), $trimmedRow));
                if (
                    in_array('book_title', $canonicals, true) ||
                    (in_array('author', $canonicals, true) && in_array('format', $canonicals, true)) ||
                    (in_array('isbn', $canonicals, true) && in_array('author', $canonicals, true))
                ) {
                    $headerRowIndex = $rIdx;
                    break;
                }
            }

            $headerRow = $rawMatrix[$headerRowIndex] ?? [];
            $canonicalHeaders = [];
            foreach ($headerRow as $h) {
                $canonicalHeaders[] = self::resolveHeader((string) $h);
            }

            // Check duplicate canonical headers
            $counts = array_count_values(array_filter($canonicalHeaders, fn($h) => $h !== null));
            foreach ($counts as $name => $count) {
                if ($count > 1) {
                    return [[], "Duplicate column header detected for field: \"{$name}\"", $headerRow];
                }
            }

            // Check legacy format
            $hasLegacy = in_array('isbn', $canonicalHeaders, true) && in_array('title', $canonicalHeaders, true) && in_array('author', $canonicalHeaders, true) && in_array('quantity', $canonicalHeaders, true);

            // Check missing required headers
            $missing = [];
            if (!$hasLegacy) {
                foreach (self::REQUIRED_HEADERS as $req) {
                    if (!in_array($req, $canonicalHeaders, true)) {
                        $label = ucwords(str_replace('_', ' ', $req));
                        if ($req === 'book_title') $label = 'Book Title *';
                        if ($req === 'author') $label = 'Author(s) *';
                        if ($req === 'format') $label = 'Format *';
                        if ($req === 'accession_number') $label = 'Accession Number *';
                        if ($req === 'availability') $label = 'Availability *';
                        if ($req === 'quantity') $label = 'Number of Copies';
                        $missing[] = $label;
                    }
                }
            }

            if (!empty($missing)) {
                return [[], 'Missing required column headers: ' . implode(', ', $missing) . '. Please use the official Bulk Upload template.', $headerRow];
            }

            // Map rows to associative arrays
            $colIndexes = [];
            foreach ($canonicalHeaders as $idx => $canonical) {
                if ($canonical) {
                    $colIndexes[$canonical] = $idx;
                }
            }

            $dataRows = array_slice($rawMatrix, $headerRowIndex + 1);
            $mappedRows = [];
            foreach ($dataRows as $rIdx => $cols) {
                $trimmedCols = array_map('trim', array_map('strval', $cols));
                if (count(array_filter($trimmedCols, fn($v) => $v !== '')) === 0) {
                    continue; // Skip completely blank lines
                }
                if (str_starts_with($trimmedCols[0], '#')) {
                    continue; // Skip comment rows
                }

                $title = trim((string) ($cols[$colIndexes['book_title'] ?? $colIndexes['title'] ?? -1] ?? ''));
                $author = trim((string) ($cols[$colIndexes['author'] ?? -1] ?? ''));
                $category = trim((string) ($cols[$colIndexes['category'] ?? -1] ?? 'General Reference'));
                $subtitle = trim((string) ($cols[$colIndexes['subtitle'] ?? -1] ?? ''));
                $publisher = trim((string) ($cols[$colIndexes['publisher'] ?? -1] ?? 'Balingasag Municipal Library'));
                $pubYear = trim((string) ($cols[$colIndexes['publication_year'] ?? -1] ?? date('Y')));
                $classification = trim((string) ($cols[$colIndexes['classification'] ?? -1] ?? 'General Stacks'));
                $format = trim((string) ($cols[$colIndexes['format'] ?? -1] ?? 'Paperback'));
                $accession = trim((string) ($cols[$colIndexes['accession_number'] ?? -1] ?? ''));
                $availability = trim((string) ($cols[$colIndexes['availability'] ?? -1] ?? 'Available'));
                $description = trim((string) ($cols[$colIndexes['description'] ?? -1] ?? ''));
                $quantity = trim((string) ($cols[$colIndexes['quantity'] ?? -1] ?? '1'));
                $isbn = trim((string) ($cols[$colIndexes['isbn'] ?? -1] ?? ''));

                $mappedRows[] = [
                    'file_row_num' => $headerRowIndex + 1 + $rIdx + 1,
                    'title' => $title,
                    'author' => $author,
                    'category' => $category ?: 'General Reference',
                    'subtitle' => $subtitle,
                    'publisher' => $publisher ?: 'Balingasag Municipal Library',
                    'publication_year' => $pubYear ?: date('Y'),
                    'classification' => $classification ?: 'General Stacks',
                    'format' => $format ?: 'Paperback',
                    'accession_number' => $accession,
                    'availability' => $availability ?: 'Available',
                    'description' => $description,
                    'quantity' => $quantity,
                    'isbn' => $isbn,
                ];
            }

            return [$mappedRows, null, $headerRow];
        }

        // Handle JSON payload
        if ($request->has('rows') && is_array($request->input('rows'))) {
            $rawList = $request->input('rows');
            $mappedRows = [];
            foreach ($rawList as $index => $item) {
                $mappedRows[] = [
                    'file_row_num' => $item['rowNumber'] ?? $item['file_row_num'] ?? ($index + 2),
                    'title' => trim((string) ($item['title'] ?? $item['book_title'] ?? '')),
                    'author' => trim((string) ($item['author'] ?? '')),
                    'category' => trim((string) ($item['category'] ?? 'General Reference')),
                    'subtitle' => trim((string) ($item['subtitle'] ?? '')),
                    'publisher' => trim((string) ($item['publisher'] ?? 'Balingasag Municipal Library')),
                    'publication_year' => trim((string) ($item['publicationYear'] ?? $item['publication_year'] ?? date('Y'))),
                    'classification' => trim((string) ($item['classification'] ?? 'General Stacks')),
                    'format' => trim((string) ($item['format'] ?? 'Paperback')),
                    'accession_number' => trim((string) ($item['accessionNumber'] ?? $item['accession_number'] ?? '')),
                    'availability' => trim((string) ($item['availability'] ?? 'Available')),
                    'description' => trim((string) ($item['description'] ?? '')),
                    'quantity' => trim((string) ($item['quantity'] ?? $item['numberOfCopies'] ?? '1')),
                    'isbn' => trim((string) ($item['isbn'] ?? '')),
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
        // 1. Fetch all existing books and physical copies for duplication checks
        $existingBooks = Book::select('id', 'isbn', 'title', 'author')->get();
        $dbIsbnMap = [];
        foreach ($existingBooks as $book) {
            $cleaned = strtoupper((string) preg_replace('/[-\s]/', '', $book->isbn));
            if ($cleaned !== '') {
                $dbIsbnMap[$cleaned] = [
                    'id' => $book->id,
                    'title' => $book->title,
                    'author' => $book->author,
                    'isbn' => $book->isbn,
                ];
            }
        }

        $existingCopies = PhysicalCopy::with('book:id,title')->get();
        $dbAccMap = [];
        foreach ($existingCopies as $copy) {
            $cleaned = strtoupper(trim((string) $copy->accession_number));
            if ($cleaned !== '') {
                $dbAccMap[$cleaned] = [
                    'book_title' => $copy->book?->title ?? 'Existing Library Book',
                    'accession_number' => $copy->accession_number,
                ];
            }
        }

        // 2. Track ISBN and Accession occurrences within this upload to detect duplicates
        $fileIsbnOccurrences = [];
        $fileAccOccurrences = [];
        foreach ($rows as $r) {
            $rawIsbn = (string) ($r['isbn'] ?? '');
            $cleanedIsbn = strtoupper((string) preg_replace('/[-\s]/', '', $rawIsbn));
            if ($cleanedIsbn !== '') {
                if (!isset($fileIsbnOccurrences[$cleanedIsbn])) {
                    $fileIsbnOccurrences[$cleanedIsbn] = [];
                }
                $fileIsbnOccurrences[$cleanedIsbn][] = $r['file_row_num'];
            }

            $rawAcc = (string) ($r['accession_number'] ?? '');
            $cleanedAcc = strtoupper(trim($rawAcc));
            if ($cleanedAcc !== '') {
                if (!isset($fileAccOccurrences[$cleanedAcc])) {
                    $fileAccOccurrences[$cleanedAcc] = [];
                }
                $fileAccOccurrences[$cleanedAcc][] = $r['file_row_num'];
            }
        }

        $validatedRows = [];
        $validCount = 0;
        $invalidCount = 0;
        $duplicateFileCount = 0;
        $duplicateDbCount = 0;

        foreach ($rows as $r) {
            $rowNum = $r['file_row_num'];
            $rawTitle = (string) ($r['title'] ?? '');
            $rawAuthor = (string) ($r['author'] ?? '');
            $rawCategory = (string) ($r['category'] ?? 'General Reference');
            $rawSubtitle = (string) ($r['subtitle'] ?? '');
            $rawPublisher = (string) ($r['publisher'] ?? '');
            $rawPubYear = (string) ($r['publication_year'] ?? '');
            $rawClassification = (string) ($r['classification'] ?? '');
            $rawFormat = (string) ($r['format'] ?? 'Paperback');
            $rawAccession = (string) ($r['accession_number'] ?? '');
            $rawAvailability = (string) ($r['availability'] ?? 'Available');
            $rawDescription = (string) ($r['description'] ?? '');
            $rawQuantity = (string) ($r['quantity'] ?? '1');
            $rawIsbn = (string) ($r['isbn'] ?? '');

            $errors = [];
            $status = 'valid';
            $cleanedIsbn = strtoupper((string) preg_replace('/[-\s]/', '', $rawIsbn));
            $cleanedAcc = strtoupper(trim($rawAccession));
            $parsedQuantity = null;

            // Missing mandatory fields
            if ($rawTitle === '') {
                $errors[] = 'Book Title is required.';
            }
            if ($rawAuthor === '') {
                $errors[] = 'Author(s) is required.';
            }
            if ($rawFormat === '') {
                $errors[] = 'Format is required (e.g. Paperback, Hardcover).';
            }
            if ($rawAccession === '') {
                $errors[] = 'Accession Number is required (e.g. BPL-ACC-0006).';
            }
            if ($rawAvailability === '') {
                $errors[] = 'Availability is required (e.g. Available).';
            }
            if ($rawQuantity === '') {
                $errors[] = 'Number of Copies is required.';
            }

            // Quantity constraints & casting
            if ($rawQuantity !== '') {
                if (str_contains($rawQuantity, '.') || str_contains($rawQuantity, ',')) {
                    $errors[] = "Number of Copies must be a positive whole number (decimal values like '{$rawQuantity}' are not allowed).";
                } elseif (!ctype_digit($rawQuantity)) {
                    $errors[] = "Number of Copies must be a valid numeric integer.";
                } else {
                    $qtyInt = (int) $rawQuantity;
                    if ($qtyInt <= 0) {
                        $errors[] = "Number of Copies must be greater than zero.";
                    } elseif ($qtyInt > 10000) {
                        $errors[] = "Number of Copies exceeds maximum allowable batch limit of 10,000.";
                    } else {
                        $parsedQuantity = $qtyInt;
                    }
                }
            }

            // Accession Number duplicate detection within uploaded file
            $duplicateWithRow = null;
            if ($cleanedAcc !== '' && isset($fileAccOccurrences[$cleanedAcc]) && count($fileAccOccurrences[$cleanedAcc]) > 1) {
                $occurrences = $fileAccOccurrences[$cleanedAcc];
                $otherRows = array_filter($occurrences, fn($rn) => $rn !== $rowNum);
                $firstRow = reset($occurrences);
                $duplicateWithRow = $firstRow !== $rowNum ? $firstRow : reset($otherRows);

                if ($firstRow !== $rowNum) {
                    $status = 'duplicate_file';
                    $errors[] = "Duplicate Accession Number in file: conflicts with Row {$firstRow}.";
                } else {
                    $otherRowsStr = implode(', ', $otherRows);
                    $errors[] = "Duplicate Accession Number in file: matches subsequent Row(s) {$otherRowsStr}.";
                }
            }

            // Accession Number duplicate detection against database
            $existingBookMatch = null;
            if ($cleanedAcc !== '' && isset($dbAccMap[$cleanedAcc])) {
                $status = 'duplicate_db';
                $match = $dbAccMap[$cleanedAcc];
                $existingBookMatch = [
                    'id' => $match['accession_number'],
                    'title' => $match['book_title'],
                    'accession_number' => $match['accession_number'],
                ];
                $errors[] = "Accession Number '{$rawAccession}' already exists in database (Book: \"{$match['book_title']}\").";
            }

            // Optional ISBN format validation & duplicate checks
            if ($cleanedIsbn !== '') {
                if (!$this->validateIsbnFormat($cleanedIsbn)) {
                    $errors[] = "Invalid ISBN format (must be a valid 10-digit or 13-digit standard ISBN).";
                }

                if (isset($fileIsbnOccurrences[$cleanedIsbn]) && count($fileIsbnOccurrences[$cleanedIsbn]) > 1 && $status !== 'duplicate_file') {
                    $firstRow = reset($fileIsbnOccurrences[$cleanedIsbn]);
                    if ($firstRow !== $rowNum) {
                        $status = 'duplicate_file';
                        $errors[] = "Duplicate ISBN in file: conflicts with Row {$firstRow}.";
                    }
                }

                if (isset($dbIsbnMap[$cleanedIsbn]) && $status !== 'duplicate_db') {
                    $status = 'duplicate_db';
                    $existingBookMatch = $dbIsbnMap[$cleanedIsbn];
                    $errors[] = "ISBN already exists in database (Title: \"{$existingBookMatch['title']}\", ISBN: {$existingBookMatch['isbn']}).";
                }
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
                'title' => $rawTitle,
                'author' => $rawAuthor,
                'category' => $rawCategory ?: 'General Reference',
                'subtitle' => $rawSubtitle,
                'publisher' => $rawPublisher ?: 'Balingasag Municipal Library',
                'publication_year' => $rawPubYear ?: date('Y'),
                'classification' => $rawClassification ?: 'General Stacks',
                'format' => $rawFormat ?: 'Paperback',
                'accession_number' => $rawAccession ?: ('ACC-' . str_pad((string) $rowNum, 6, '0', STR_PAD_LEFT)),
                'availability' => $rawAvailability ?: 'Available',
                'description' => $rawDescription,
                'quantity' => $parsedQuantity,
                'raw_quantity' => $rawQuantity,
                'isbn' => $rawIsbn ?: ('978-BPL-' . ($rawAccession ?: str_pad((string) $rowNum, 6, '0', STR_PAD_LEFT))),
                'normalized_isbn' => $cleanedIsbn,
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
                // Ensure unique ISBN if not supplied
                $isbn = !empty($row['isbn']) ? $row['isbn'] : null;
                if (!$isbn) {
                    $sanitizedAcc = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $row['accession_number'] ?? ''));
                    $candidateIsbn = '978-BPL-' . ($sanitizedAcc ?: str_pad((string) $currentSeq, 6, '0', STR_PAD_LEFT));
                    if (Book::where('isbn', $candidateIsbn)->exists()) {
                        $candidateIsbn .= '-' . substr(uniqid(), -4);
                    }
                    $isbn = $candidateIsbn;
                }

                $book = Book::create([
                    'isbn' => $isbn,
                    'title' => $row['title'],
                    'subtitle' => !empty($row['subtitle']) ? $row['subtitle'] : null,
                    'author' => $row['author'],
                    'category' => !empty($row['category']) ? $row['category'] : 'General Reference',
                    'classification' => !empty($row['classification']) ? $row['classification'] : 'General Stacks',
                    'language' => 'English',
                    'publisher' => !empty($row['publisher']) ? $row['publisher'] : 'Balingasag Municipal Library',
                    'publication_year' => !empty($row['publication_year']) ? (int) $row['publication_year'] : (int) date('Y'),
                    'description' => !empty($row['description']) ? $row['description'] : null,
                    'pages' => 0,
                    'is_archived' => false,
                ]);

                $qty = (int) ($row['quantity'] ?? 1);
                for ($i = 1; $i <= $qty; $i++) {
                    $currentSeq++;
                    $padded = str_pad((string) $currentSeq, 6, '0', STR_PAD_LEFT);
                    $baseAcc = !empty($row['accession_number']) ? $row['accession_number'] : "BPL-ACC-{$padded}";
                    $accNum = ($qty > 1 && $i > 1) ? "{$baseAcc}-C{$i}" : $baseAcc;

                    PhysicalCopy::create([
                        'book_id' => $book->id,
                        'copy_id' => "cp-{$padded}",
                        'accession_number' => $accNum,
                        'barcode' => "BPL-{$padded}",
                        'shelf_location' => 'General Stacks',
                        'classification' => $book->classification,
                        'condition' => 'New',
                        'status' => in_array($row['availability'] ?? 'Available', ['Available', 'Borrowed', 'Reserved', 'Lost', 'Under Repair']) ? $row['availability'] : 'Available',
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
                'message' => 'Database transaction failed during bulk import. No records were saved: ' . $e->getMessage(),
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
            'Content-Disposition' => 'attachment; filename="balingasag_library_bulk_upload_template.csv"',
        ];

        $callback = function () {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");
            fputs($handle, "# ==========================================================================================================\r\n");
            fputs($handle, "# BALINGASAG PUBLIC LIBRARY — OFFICIAL BOOK CATALOGING TEMPLATE (v2026.2)\r\n");
            fputs($handle, "# Municipality of Balingasag, Misamis Oriental • Public Library Management System\r\n");
            fputs($handle, "# INSTRUCTIONS: Columns with (*) are REQUIRED. Accession numbers must be unique. Fill entries below.\r\n");
            fputs($handle, "# ==========================================================================================================\r\n");

            fputcsv($handle, [
                'Book Title *',
                'Category',
                'Subtitle',
                'Author(s) *',
                'Publisher',
                'Publication Year',
                'Classification (DDC)',
                'Format *',
                'Accession Number *',
                'Availability *',
                'Description / Abstract',
                'Number of Copies'
            ]);
            fputcsv($handle, [
                'Clean Code: A Handbook of Agile Software Craftsmanship',
                'General Reference',
                'A Handbook of Agile Software Craftsmanship',
                'Robert C. Martin',
                'Prentice Hall',
                '2026',
                '005.133 MAR',
                'Paperback',
                'BPL-ACC-0006',
                'Available',
                'Even bad code can function. But if code is not clean, it can bring a development organization to its knees.',
                '1'
            ]);
            fputcsv($handle, [
                'Introduction to Algorithms',
                'General Reference',
                'Fourth Edition',
                'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
                'MIT Press',
                '2022',
                '005.1 COR',
                'Hardcover',
                'BPL-ACC-0007',
                'Available',
                'Comprehensive textbook covering modern computer algorithms, data structures, and algorithmic complexity analysis.',
                '2'
            ]);
            fputcsv($handle, [
                'The Philippine Islands, 1493–1898',
                'Filipiniana',
                'Explorations by Early Navigators, Descriptions of the Islands and their Peoples',
                'Emma Helen Blair, James Alexander Robertson',
                'Arthur H. Clark Company',
                '2024',
                '959.9 BLA',
                'Hardcover',
                'BPL-ACC-0008',
                'Available',
                'Monumental collection of historical records, exploration accounts, and colonial documents on the Philippines.',
                '1'
            ]);
            fputcsv($handle, [
                'To Kill a Mockingbird',
                'Fiction',
                'Perennial Classics Edition',
                'Harper Lee',
                'HarperCollins',
                '2025',
                '813.54 LEE',
                'Paperback',
                'BPL-ACC-0009',
                'Available',
                'The unforgettable novel of childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
                '1'
            ]);
            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }
}
