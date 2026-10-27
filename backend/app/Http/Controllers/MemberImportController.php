<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\SimpleXlsxParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Exception;

class MemberImportController extends Controller
{
    private const REQUIRED_HEADERS = ['first_name', 'last_name', 'email'];
    private const MAX_FILE_SIZE_BYTES = 5242880; // 5 MB
    private const MAX_ROWS = 1000;

    /**
     * Resolves spreadsheet header labels against member fields.
     */
    public static function resolveHeader(string $header): ?string
    {
        $clean = strtolower(trim($header));
        $clean = preg_replace('/[*()]/', '', $clean);
        $clean = preg_replace('/\s+/', ' ', trim($clean));

        if (in_array($clean, ['first name', 'firstname', 'first_name', 'given name', 'first'])) return 'first_name';
        if (in_array($clean, ['last name', 'lastname', 'last_name', 'surname', 'family name', 'last'])) return 'last_name';
        if (in_array($clean, ['middle name', 'middlename', 'middle_name', 'middle initial', 'mi'])) return 'middle_name';
        if (in_array($clean, ['suffix', 'name suffix', 'ext', 'extension'])) return 'suffix';
        if (in_array($clean, ['full name', 'fullname', 'full_name', 'name'])) return 'full_name';
        if (in_array($clean, ['email', 'email address', 'email_address', 'e-mail', 'mail'])) return 'email';
        if (in_array($clean, ['phone', 'contact number', 'contact_number', 'phone number', 'phone_number', 'mobile', 'mobile number', 'contact'])) return 'phone';
        if (in_array($clean, ['address', 'home address', 'barangay', 'residence', 'location'])) return 'address';
        if (in_array($clean, ['date of birth', 'date_of_birth', 'birthdate', 'birth date', 'dob', 'birthday'])) return 'date_of_birth';
        if (in_array($clean, ['gender', 'sex'])) return 'gender';
        if (in_array($clean, ['membership type', 'membership_type', 'member type', 'member_type', 'type', 'category'])) return 'membership_type';
        if (in_array($clean, ['status', 'account status', 'account_status', 'membership status'])) return 'status';
        if (in_array($clean, ['member id', 'member_id', 'library id', 'library_id', 'id number', 'patron id', 'patron_id'])) return 'member_id';
        if (in_array($clean, ['temporary password', 'temporary_password', 'password', 'temp password', 'temp_password'])) return 'temporary_password';
        if (in_array($clean, ['school', 'school name', 'school_name', 'university', 'college', 'institution', 'academy'])) return 'school';

        return null;
    }

    /**
     * Checks if authenticated user has administrative member management permissions.
     */
    private function checkPermission(Request $request): ?\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!in_array($user->role, ['super_admin', 'admin'])) {
            return response()->json([
                'message' => 'Access denied: Only authorized administrators can perform bulk member imports.'
            ], 403);
        }

        return null;
    }

    /**
     * Download a formatted CSV template with headers, data validation hints, and example records.
     */
    public function downloadTemplate()
    {
        $headers = [
            'First Name*',
            'Last Name*',
            'Middle Name',
            'Suffix',
            'Email Address*',
            'Contact Number',
            'Home Address',
            'Date of Birth (YYYY-MM-DD)',
            'Gender (Male/Female/Other)',
            'Membership Type (Student/Faculty/Researcher/Community)',
            'Account Status (active/inactive/suspended)',
            'Member ID (optional, e.g. BPL-2026-0001)'
        ];

        $sampleRows = [
            [
                'Juan',
                'Dela Cruz',
                'Santos',
                '',
                'juan.delacruz@example.ph',
                '+63 917 123 4567',
                'Brgy. 1, Poblacion, Balingasag, Misamis Oriental',
                '2004-05-15',
                'Male',
                'Student',
                'active',
                ''
            ],
            [
                'Maria Clara',
                'Reyes',
                'Lopez',
                '',
                'maria.reyes@balingasagschool.edu.ph',
                '+63 928 987 6543',
                'Brgy. Hermano, Balingasag, Misamis Oriental',
                '1988-11-20',
                'Female',
                'Faculty',
                'active',
                ''
            ],
            [
                'Pedro',
                'Penduko',
                'Aquino',
                'Jr.',
                'pedro.penduko@gmail.com',
                '+63 939 555 7890',
                'Brgy. Linggangao, Balingasag, Misamis Oriental',
                '1995-08-30',
                'Male',
                'Community',
                'active',
                ''
            ]
        ];

        $output = fopen('php://memory', 'w');
        // Add UTF-8 BOM so Excel opens with proper encoding
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        fputcsv($output, $headers);
        foreach ($sampleRows as $row) {
            fputcsv($output, $row);
        }
        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="balingasag_members_import_template.csv"',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }

    /**
     * Extract raw rows from file upload or JSON request.
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
                $rawMatrix = [];
                $handle = fopen($realPath, 'r');
                if ($handle === false) {
                    return [[], 'Unable to read CSV file.', []];
                }

                $bom = fread($handle, 3);
                if ($bom !== "\xEF\xBB\xBF") {
                    rewind($handle);
                }

                while (($line = fgetcsv($handle, 4096, ',')) !== false) {
                    if (empty(array_filter($line, fn($cell) => trim((string)$cell) !== ''))) {
                        continue;
                    }
                    $rawMatrix[] = $line;
                }
                fclose($handle);
            }

            if (empty($rawMatrix)) {
                return [[], 'The uploaded spreadsheet contains no data rows.', []];
            }

            $rawHeaderRow = array_shift($rawMatrix);
            $headerMap = [];
            $unmapped = [];

            foreach ($rawHeaderRow as $colIdx => $colName) {
                $resolved = self::resolveHeader((string) $colName);
                if ($resolved !== null) {
                    $headerMap[$colIdx] = $resolved;
                } else {
                    $unmapped[] = trim((string) $colName);
                }
            }

            $foundResolved = array_values($headerMap);
            $missingRequired = array_diff(self::REQUIRED_HEADERS, $foundResolved);
            if (!empty($missingRequired)) {
                $humanNames = array_map(fn($f) => ucwords(str_replace('_', ' ', $f)), $missingRequired);
                return [[], 'Missing required spreadsheet headers: ' . implode(', ', $humanNames) . '. Please ensure First Name, Last Name, and Email columns are present.', []];
            }

            if (count($rawMatrix) > self::MAX_ROWS) {
                return [[], 'File contains ' . count($rawMatrix) . ' rows, exceeding maximum limit of ' . self::MAX_ROWS . ' records per import.', []];
            }

            $parsedRows = [];
            foreach ($rawMatrix as $rowOffset => $cells) {
                $fileRowNum = $rowOffset + 2;
                $rowAssoc = ['file_row_num' => $fileRowNum];

                foreach ($headerMap as $colIdx => $fieldName) {
                    $val = isset($cells[$colIdx]) ? trim((string) $cells[$colIdx]) : '';
                    $rowAssoc[$fieldName] = $val;
                }

                // If first_name, last_name, and email are all blank, skip
                if (empty($rowAssoc['first_name']) && empty($rowAssoc['last_name']) && empty($rowAssoc['email'])) {
                    continue;
                }

                $parsedRows[] = $rowAssoc;
            }

            return [$parsedRows, null, $foundResolved];
        }

        // Direct JSON array of rows in body
        if ($request->has('rows') && is_array($request->input('rows'))) {
            $rawRows = $request->input('rows');
            if (empty($rawRows)) {
                return [[], 'The submitted rows array is empty.', []];
            }

            if (count($rawRows) > self::MAX_ROWS) {
                return [[], 'Exceeded maximum limit of ' . self::MAX_ROWS . ' rows per import.', []];
            }

            $mappedRows = [];
            foreach ($rawRows as $idx => $item) {
                $mappedRows[] = [
                    'file_row_num' => $item['file_row_num'] ?? ($idx + 1),
                    'first_name' => trim((string) ($item['first_name'] ?? $item['firstName'] ?? '')),
                    'last_name' => trim((string) ($item['last_name'] ?? $item['lastName'] ?? '')),
                    'middle_name' => trim((string) ($item['middle_name'] ?? $item['middleName'] ?? '')),
                    'suffix' => trim((string) ($item['suffix'] ?? '')),
                    'email' => trim((string) ($item['email'] ?? '')),
                    'phone' => trim((string) ($item['phone'] ?? $item['contactNumber'] ?? '')),
                    'address' => trim((string) ($item['address'] ?? '')),
                    'date_of_birth' => trim((string) ($item['date_of_birth'] ?? $item['dateOfBirth'] ?? '')),
                    'gender' => trim((string) ($item['gender'] ?? $item['sex'] ?? '')),
                    'membership_type' => trim((string) ($item['membership_type'] ?? $item['membershipType'] ?? 'Student')),
                    'school' => trim((string) ($item['school'] ?? '')),
                    'status' => trim((string) ($item['status'] ?? $item['membershipStatus'] ?? 'active')),
                    'member_id' => trim((string) ($item['member_id'] ?? $item['memberId'] ?? '')),
                    'temporary_password' => trim((string) ($item['temporary_password'] ?? $item['temporaryPassword'] ?? '')),
                ];
            }
            return [$mappedRows, null, self::REQUIRED_HEADERS];
        }

        return [[], 'No file or records provided for member import.', []];
    }

    /**
     * Validates parsed rows against database and integrity rules.
     */
    private function validateRowsData(array $rows): array
    {
        // 1. Fetch existing members and users for duplicate detection
        $existingMembers = Member::select('id', 'member_id', 'email', 'phone', 'full_name')->get();
        $dbMemberIdMap = [];
        $dbEmailMap = [];
        $dbPhoneMap = [];

        foreach ($existingMembers as $m) {
            if (!empty($m->member_id)) {
                $dbMemberIdMap[strtoupper(trim($m->member_id))] = $m;
            }
            if (!empty($m->email)) {
                $dbEmailMap[strtolower(trim($m->email))] = $m;
            }
            if (!empty($m->phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $m->phone);
                if (strlen($cleanPhone) >= 7) {
                    $dbPhoneMap[$cleanPhone] = $m;
                }
            }
        }

        // Also check existing user accounts
        $existingUsers = User::select('id', 'email', 'name', 'username')->get();
        $dbUserEmailMap = [];
        foreach ($existingUsers as $u) {
            if (!empty($u->email)) {
                $dbUserEmailMap[strtolower(trim($u->email))] = $u;
            }
        }

        // 2. Track duplicate email and member_id occurrences inside this upload
        $fileEmailOccurrences = [];
        $fileMemberIdOccurrences = [];

        foreach ($rows as $r) {
            $email = strtolower(trim($r['email'] ?? ''));
            if ($email !== '') {
                if (!isset($fileEmailOccurrences[$email])) {
                    $fileEmailOccurrences[$email] = [];
                }
                $fileEmailOccurrences[$email][] = $r['file_row_num'];
            }

            $memId = strtoupper(trim($r['member_id'] ?? ''));
            if ($memId !== '') {
                if (!isset($fileMemberIdOccurrences[$memId])) {
                    $fileMemberIdOccurrences[$memId] = [];
                }
                $fileMemberIdOccurrences[$memId][] = $r['file_row_num'];
            }
        }

        // 3. Process each row
        $validatedRows = [];
        $validCount = 0;
        $issueCount = 0;
        $duplicateEmailCount = 0;

        foreach ($rows as $r) {
            $fileRowNum = $r['file_row_num'];
            $firstName = trim($r['first_name'] ?? '');
            $lastName = trim($r['last_name'] ?? '');
            $middleName = trim($r['middle_name'] ?? '');
            $suffix = trim($r['suffix'] ?? '');
            $email = strtolower(trim($r['email'] ?? ''));
            $phone = trim($r['phone'] ?? '');
            $address = trim($r['address'] ?? '');
            $dob = trim($r['date_of_birth'] ?? '');
            $gender = trim($r['gender'] ?? '');
            $membershipType = trim($r['membership_type'] ?? '');
            $status = strtolower(trim($r['status'] ?? 'active'));
            $school = trim($r['school'] ?? '');
            $memberId = strtoupper(trim($r['member_id'] ?? ''));
            $tempPass = trim($r['temporary_password'] ?? '');

            $errors = [];
            $warnings = [];

            // A. Required: First Name & Last Name
            if ($firstName === '') {
                $errors[] = [
                    'code' => 'MISSING_FIRST_NAME',
                    'field' => 'first_name',
                    'message' => 'First Name is required.'
                ];
            }
            if ($lastName === '') {
                $errors[] = [
                    'code' => 'MISSING_LAST_NAME',
                    'field' => 'last_name',
                    'message' => 'Last Name is required.'
                ];
            }

            // Construct Full Name
            $nameParts = array_filter([$firstName, $middleName, $lastName]);
            $baseName = implode(' ', $nameParts);
            if ($suffix !== '') {
                $baseName .= ' ' . $suffix;
            }
            $fullName = $baseName ?: 'New Library Member';

            // B. Required: Email Address
            if ($email === '') {
                $errors[] = [
                    'code' => 'MISSING_EMAIL',
                    'field' => 'email',
                    'message' => 'Email address is required.'
                ];
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors[] = [
                    'code' => 'INVALID_EMAIL_FORMAT',
                    'field' => 'email',
                    'message' => "'{$email}' is not a valid email address format."
                ];
            } else {
                // Check within-file duplicate email
                if (isset($fileEmailOccurrences[$email]) && count($fileEmailOccurrences[$email]) > 1) {
                    $otherRows = array_diff($fileEmailOccurrences[$email], [$fileRowNum]);
                    $errors[] = [
                        'code' => 'DUPLICATE_EMAIL_IN_FILE',
                        'field' => 'email',
                        'message' => "Email '{$email}' is duplicated within this file (Row(s): " . implode(', ', $otherRows) . ")."
                    ];
                    $duplicateEmailCount++;
                }

                // Check existing in database
                if (isset($dbEmailMap[$email]) || isset($dbUserEmailMap[$email])) {
                    $existingPerson = $dbEmailMap[$email] ?? $dbUserEmailMap[$email];
                    $name = $existingPerson->full_name ?? $existingPerson->name ?? 'Existing User';
                    $errors[] = [
                        'code' => 'EMAIL_ALREADY_EXISTS_DB',
                        'field' => 'email',
                        'message' => "Email '{$email}' is already registered to '{$name}' in the library system."
                    ];
                    $duplicateEmailCount++;
                }
            }

            // C. Member ID (if provided)
            if ($memberId !== '') {
                if (isset($fileMemberIdOccurrences[$memberId]) && count($fileMemberIdOccurrences[$memberId]) > 1) {
                    $otherRows = array_diff($fileMemberIdOccurrences[$memberId], [$fileRowNum]);
                    $errors[] = [
                        'code' => 'DUPLICATE_MEMBER_ID_IN_FILE',
                        'field' => 'member_id',
                        'message' => "Member ID '{$memberId}' is duplicated in Row(s): " . implode(', ', $otherRows) . "."
                    ];
                }

                if (isset($dbMemberIdMap[$memberId])) {
                    $existingPerson = $dbMemberIdMap[$memberId];
                    $errors[] = [
                        'code' => 'MEMBER_ID_ALREADY_EXISTS_DB',
                        'field' => 'member_id',
                        'message' => "Member ID '{$memberId}' already belongs to '{$existingPerson->full_name}'."
                    ];
                }
            }

            // D. Date of Birth
            $normalizedDob = null;
            if ($dob !== '') {
                $time = strtotime($dob);
                if ($time === false) {
                    $warnings[] = [
                        'code' => 'INVALID_DATE_FORMAT',
                        'field' => 'date_of_birth',
                        'message' => "Date of birth '{$dob}' could not be parsed. Expected YYYY-MM-DD."
                    ];
                } else {
                    $parsedYear = (int) date('Y', $time);
                    $currentYear = (int) date('Y');
                    if ($parsedYear < 1920 || $parsedYear > $currentYear) {
                        $warnings[] = [
                            'code' => 'SUSPICIOUS_BIRTH_YEAR',
                            'field' => 'date_of_birth',
                            'message' => "Birth year {$parsedYear} appears unusual."
                        ];
                    }
                    $normalizedDob = date('Y-m-d', $time);
                }
            }

            // E. Membership Type normalization
            $typeClean = strtolower($membershipType);
            if (in_array($typeClean, ['student', 'pupil', 'learner'])) {
                $membershipType = 'Student';
            } elseif (in_array($typeClean, ['faculty', 'teacher', 'instructor', 'professor', 'educator'])) {
                $membershipType = 'Faculty';
            } elseif (in_array($typeClean, ['researcher', 'scholar', 'fellow'])) {
                $membershipType = 'Researcher';
            } elseif (in_array($typeClean, ['community', 'citizen', 'resident', 'public', 'general'])) {
                $membershipType = 'Community';
            } elseif ($membershipType === '') {
                $membershipType = 'Student';
            } else {
                $warnings[] = [
                    'code' => 'UNKNOWN_MEMBERSHIP_TYPE',
                    'field' => 'membership_type',
                    'message' => "Membership type '{$membershipType}' defaulted to 'Student'."
                ];
                $membershipType = 'Student';
            }

            // F. Account Status normalization
            if (!in_array($status, ['active', 'inactive', 'suspended'])) {
                $status = 'active';
            }

            // G. Gender normalization
            $genderClean = strtolower($gender);
            if (in_array($genderClean, ['male', 'm', 'boy', 'man'])) {
                $gender = 'Male';
            } elseif (in_array($genderClean, ['female', 'f', 'girl', 'woman'])) {
                $gender = 'Female';
            } elseif ($gender !== '') {
                $gender = 'Other';
            } else {
                $gender = 'Other';
            }

            // H. Phone validation
            if ($phone !== '') {
                $cleanDigits = preg_replace('/[^0-9]/', '', $phone);
                if (strlen($cleanDigits) < 7) {
                    $warnings[] = [
                        'code' => 'SHORT_PHONE_NUMBER',
                        'field' => 'phone',
                        'message' => "Contact number '{$phone}' seems unusually short."
                    ];
                }
            }

            $isValid = empty($errors);
            if ($isValid) {
                $validCount++;
            } else {
                $issueCount++;
            }

            $validatedRows[] = [
                'file_row_num' => $fileRowNum,
                'is_valid' => $isValid,
                'errors' => $errors,
                'warnings' => $warnings,
                'data' => [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => $middleName,
                    'suffix' => $suffix,
                    'full_name' => $fullName,
                    'email' => $email,
                    'phone' => $phone ?: '+63 9',
                    'address' => $address ?: 'Poblacion, Balingasag, Misamis Oriental',
                    'date_of_birth' => $normalizedDob ?: '2004-01-01',
                    'gender' => $gender,
                    'membership_type' => $membershipType,
                    'school' => $school,
                    'status' => $status,
                    'member_id' => $memberId,
                    'temporary_password' => $tempPass ?: 'P@ssword123',
                ]
            ];
        }

        $totalRows = count($rows);

        return [
            'validated_rows' => $validatedRows,
            'summary' => [
                'total_rows' => $totalRows,
                'valid_rows' => $validCount,
                'issue_rows' => $issueCount,
                'duplicate_email_count' => $duplicateEmailCount,
                'can_import_all' => ($issueCount === 0 && $validCount > 0),
                'can_import_valid' => ($validCount > 0)
            ]
        ];
    }

    /**
     * Validate uploaded file or submitted rows and return inspection report.
     */
    public function validateImport(Request $request)
    {
        $permCheck = $this->checkPermission($request);
        if ($permCheck) return $permCheck;

        [$rows, $error] = $this->extractRowsFromRequest($request);
        if ($error !== null) {
            return response()->json([
                'success' => false,
                'message' => $error,
                'schema_error' => true
            ], 422);
        }

        $result = $this->validateRowsData($rows);

        return response()->json([
            'success' => true,
            'summary' => $result['summary'],
            'rows' => $result['validated_rows']
        ]);
    }

    /**
     * Execute the bulk member import.
     */
    public function import(Request $request)
    {
        $permCheck = $this->checkPermission($request);
        if ($permCheck) return $permCheck;

        $mode = $request->input('mode', 'all_or_nothing');
        if (!in_array($mode, ['all_or_nothing', 'skip_errors'])) {
            $mode = 'all_or_nothing';
        }

        [$rows, $error] = $this->extractRowsFromRequest($request);
        if ($error !== null) {
            return response()->json([
                'success' => false,
                'message' => $error,
            ], 422);
        }

        $validation = $this->validateRowsData($rows);
        $summary = $validation['summary'];
        $validatedRows = $validation['validated_rows'];

        if ($mode === 'all_or_nothing' && $summary['issue_rows'] > 0) {
            return response()->json([
                'success' => false,
                'message' => "Import blocked: {$summary['issue_rows']} row(s) contain validation errors. Select 'Skip Errors' or correct the spreadsheet.",
                'summary' => $summary,
                'rows' => $validatedRows
            ], 422);
        }

        $rowsToImport = array_filter($validatedRows, fn($r) => $r['is_valid']);
        if (empty($rowsToImport)) {
            return response()->json([
                'success' => false,
                'message' => 'No valid records found to import.',
                'summary' => $summary,
            ], 422);
        }

        $createdMembers = [];
        $defaultPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
        $year = date('Y');

        DB::beginTransaction();
        try {
            // Determine starting sequence number for auto-generated member IDs
            $currentMemberCount = Member::count();
            $seqCounter = $currentMemberCount + 1;

            foreach ($rowsToImport as $rowItem) {
                $d = $rowItem['data'];

                // Assign or generate Member ID
                $assignedMemberId = !empty($d['member_id'])
                    ? $d['member_id']
                    : "BPL-{$year}-" . str_pad($seqCounter++, 4, '0', STR_PAD_LEFT);

                // Auto-generate username from name or email
                $cleanFirst = strtolower(preg_replace('/[^a-z0-9]/', '', $d['first_name']));
                $cleanLast = strtolower(preg_replace('/[^a-z0-9]/', '', $d['last_name']));
                $baseUsername = ($cleanFirst && $cleanLast) ? "{$cleanFirst}.{$cleanLast}" : ($cleanFirst ?: $cleanLast ?: 'member');

                $username = $baseUsername;
                $counter = 1;
                while (User::where('username', $username)->where('email', '!=', $d['email'])->exists()) {
                    $username = "{$baseUsername}{$counter}";
                    $counter++;
                }

                $tempPass = !empty($d['temporary_password']) ? $d['temporary_password'] : 'P@ssword123';

                // 1. Create or update User account
                $user = User::updateOrCreate(
                    ['email' => $d['email']],
                    [
                        'name' => $d['full_name'],
                        'username' => $username,
                        'password' => Hash::make($tempPass),
                        'role' => 'member',
                        'status' => $d['status'],
                        'member_id' => $assignedMemberId,
                        'phone' => $d['phone'],
                        'address' => $d['address'],
                    ]
                );

                // 2. Create or update Member record
                $member = Member::updateOrCreate(
                    ['email' => $d['email']],
                    [
                        'user_id' => $user->id,
                        'member_id' => $assignedMemberId,
                        'first_name' => $d['first_name'],
                        'middle_name' => $d['middle_name'] ?: null,
                        'last_name' => $d['last_name'],
                        'suffix' => $d['suffix'] ?: null,
                        'full_name' => $d['full_name'],
                        'username' => $username,
                        'date_of_birth' => $d['date_of_birth'],
                        'gender' => $d['gender'],
                        'email' => $d['email'],
                        'phone' => $d['phone'],
                        'address' => $d['address'],
                        'membership_type' => $d['membership_type'],
                        'school' => !empty($d['school']) ? $d['school'] : null,
                        'status' => $d['status'],
                        'qr_code_data' => $assignedMemberId,
                        'join_date' => now()->toDateString(),
                        'total_borrows' => 0,
                        'photo_url' => $defaultPhoto,
                    ]
                );

                $createdMembers[] = $member;
            }

            $importedCount = count($createdMembers);
            $skippedCount = $summary['issue_rows'];

            // Log administrative audit event
            AuditLog::create([
                'action' => 'MEMBER_BULK_IMPORT',
                'category' => 'Members',
                'details' => "Bulk import completed: {$importedCount} member accounts registered ({$skippedCount} skipped) in {$mode} mode.",
                'performed_by' => $request->user()->name ?? 'Library Administrator',
                'ip_address' => $request->ip(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'imported_count' => $importedCount,
                'skipped_count' => $skippedCount,
                'imported_members' => $createdMembers,
                'message' => "Successfully imported {$importedCount} member account(s)" . ($skippedCount > 0 ? " ({$skippedCount} invalid rows skipped)." : ".")
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Database transaction failed during bulk member import: ' . $e->getMessage()
            ], 500);
        }
    }
}
