import * as XLSX from 'xlsx';
import type { Member } from '../types';
import type {
  ValidatedMemberImportRow,
  MemberImportValidationSummary,
  MemberImportValidationResult
} from '../types/memberImport';

export const REQUIRED_MEMBER_IMPORT_COLUMNS = [
  'first_name',
  'last_name',
  'email'
] as const;

export const MAX_MEMBER_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_MEMBER_IMPORT_ROW_LIMIT = 1000;

export interface FileFormatValidationResult {
  valid: boolean;
  format?: 'csv' | 'xlsx';
  error?: string;
}

/**
 * Resolves spreadsheet header labels against member fields with flexible alias support.
 */
export function resolveMemberColumnHeader(header: string): string | null {
  const clean = String(header || '')
    .toLowerCase()
    .replace(/[*()]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!clean) return null;

  if (['first name', 'firstname', 'first_name', 'given name', 'first'].includes(clean)) {
    return 'first_name';
  }
  if (['last name', 'lastname', 'last_name', 'surname', 'family name', 'last'].includes(clean)) {
    return 'last_name';
  }
  if (['middle name', 'middlename', 'middle_name', 'middle initial', 'mi'].includes(clean)) {
    return 'middle_name';
  }
  if (['suffix', 'name suffix', 'ext', 'extension'].includes(clean)) {
    return 'suffix';
  }
  if (['full name', 'fullname', 'full_name', 'name'].includes(clean)) {
    return 'full_name';
  }
  if (['email', 'email address', 'email_address', 'e-mail', 'mail'].includes(clean)) {
    return 'email';
  }
  if (['phone', 'contact number', 'contact_number', 'phone number', 'phone_number', 'mobile', 'mobile number', 'contact'].includes(clean)) {
    return 'phone';
  }
  if (['address', 'home address', 'barangay', 'residence', 'location'].includes(clean)) {
    return 'address';
  }
  if (['date of birth', 'date_of_birth', 'birthdate', 'birth date', 'dob', 'birthday'].includes(clean)) {
    return 'date_of_birth';
  }
  if (['gender', 'sex'].includes(clean)) {
    return 'gender';
  }
  if (['membership type', 'membership_type', 'member type', 'member_type', 'type', 'category'].includes(clean)) {
    return 'membership_type';
  }
  if (['status', 'account status', 'account_status', 'membership status'].includes(clean)) {
    return 'status';
  }
  if (['member id', 'member_id', 'library id', 'library_id', 'id number', 'patron id', 'patron_id'].includes(clean)) {
    return 'member_id';
  }
  if (['temporary password', 'temporary_password', 'password', 'temp password', 'temp_password'].includes(clean)) {
    return 'temporary_password';
  }

  return null;
}

/**
 * Validates file format and size for member uploads.
 */
export function validateMemberFileFormat(file: File): FileFormatValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided.' };
  }

  if (file.size > MAX_MEMBER_IMPORT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed limit of 5 MB.`
    };
  }

  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return { valid: true, format: 'csv' };
  }
  if (name.endsWith('.xlsx')) {
    return { valid: true, format: 'xlsx' };
  }

  return {
    valid: false,
    error: 'Unsupported file format. Please upload a standard CSV (.csv) or Excel (.xlsx) file.'
  };
}

/**
 * Generates and triggers download of a standardized CSV template for member bulk import.
 */
export function downloadSampleMemberTemplate(): void {
  const headers = [
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
    'Member ID (optional)'
  ];

  const sampleRows = [
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

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Members Template');

  const csvContent = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'balingasag_members_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses and performs client-side validation on an uploaded member spreadsheet.
 */
export async function parseAndValidateMemberSpreadsheet(
  file: File,
  existingMembers: Member[] = []
): Promise<MemberImportValidationResult> {
  const formatCheck = validateMemberFileFormat(file);
  if (!formatCheck.valid) {
    throw new Error(formatCheck.error || 'Invalid file format.');
  }

  const buffer = await file.arrayBuffer();
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch (err: any) {
    throw new Error(`Failed to parse spreadsheet: ${err?.message || 'File may be corrupted.'}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet does not contain any worksheets.');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('The spreadsheet is empty.');
  }

  // 1. Identify header row
  const rawHeaders: string[] = rawRows[0].map(c => String(c || '').trim());
  const headerMap: { [colIndex: number]: string } = {};

  rawHeaders.forEach((h, idx) => {
    const resolved = resolveMemberColumnHeader(h);
    if (resolved) {
      headerMap[idx] = resolved;
    }
  });

  const recognizedFields = Object.values(headerMap);
  const missingRequired = REQUIRED_MEMBER_IMPORT_COLUMNS.filter(
    req => !recognizedFields.includes(req)
  );

  if (missingRequired.length > 0) {
    const humanNames = missingRequired.map(f => f.replace('_', ' ').toUpperCase());
    throw new Error(
      `Missing required columns: ${humanNames.join(', ')}. Please verify that First Name, Last Name, and Email Address columns exist.`
    );
  }

  const dataRows = rawRows.slice(1);
  if (dataRows.length === 0) {
    throw new Error('The spreadsheet contains header columns but no data rows.');
  }

  if (dataRows.length > MAX_MEMBER_IMPORT_ROW_LIMIT) {
    throw new Error(
      `Spreadsheet contains ${dataRows.length} rows, which exceeds the limit of ${MAX_MEMBER_IMPORT_ROW_LIMIT} rows per import.`
    );
  }

  // 2. Build existing database lookup maps
  const dbEmailMap = new Map<string, Member>();
  const dbMemberIdMap = new Map<string, Member>();

  existingMembers.forEach(m => {
    if (m.email) {
      dbEmailMap.set(m.email.toLowerCase().trim(), m);
    }
    if (m.memberId) {
      dbMemberIdMap.set(m.memberId.toUpperCase().trim(), m);
    }
  });

  // 3. Scan rows to identify duplicates within the uploaded file
  const fileEmailOccurrences = new Map<string, number[]>();
  const fileMemberIdOccurrences = new Map<string, number[]>();

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    let email = '';
    let memId = '';

    Object.entries(headerMap).forEach(([colIdxStr, fieldName]) => {
      const colIdx = parseInt(colIdxStr, 10);
      const val = String(row[colIdx] || '').trim();
      if (fieldName === 'email') email = val.toLowerCase();
      if (fieldName === 'member_id') memId = val.toUpperCase();
    });

    if (email) {
      if (!fileEmailOccurrences.has(email)) fileEmailOccurrences.set(email, []);
      fileEmailOccurrences.get(email)!.push(rowNum);
    }

    if (memId) {
      if (!fileMemberIdOccurrences.has(memId)) fileMemberIdOccurrences.set(memId, []);
      fileMemberIdOccurrences.get(memId)!.push(rowNum);
    }
  });

  // 4. Validate each row
  const validatedRows: ValidatedMemberImportRow[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateFileCount = 0;
  let duplicateDbCount = 0;

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Map columns into row values
    const item: any = {};
    Object.entries(headerMap).forEach(([colIdxStr, fieldName]) => {
      const colIdx = parseInt(colIdxStr, 10);
      item[fieldName] = String(row[colIdx] || '').trim();
    });

    const firstName = item.first_name || '';
    const lastName = item.last_name || '';
    const middleName = item.middle_name || '';
    const suffix = item.suffix || '';
    const email = (item.email || '').toLowerCase().trim();
    const phone = item.phone || '+63 9';
    const address = item.address || 'Poblacion, Balingasag, Misamis Oriental';
    let dob = item.date_of_birth || '2004-01-01';
    let gender = item.gender || 'Other';
    let membershipType: 'Student' | 'Faculty' | 'Researcher' | 'Community' = 'Student';
    let status: 'active' | 'inactive' | 'suspended' = 'active';
    const memberId = (item.member_id || '').toUpperCase().trim();
    const temporaryPassword = item.temporary_password || 'P@ssword123';

    // Format Full Name
    const nameParts = [firstName, middleName, lastName].filter(Boolean);
    let fullName = nameParts.join(' ');
    if (suffix) fullName += ` ${suffix}`;
    if (!fullName) fullName = 'New Library Member';

    // Required fields check
    if (!firstName) errors.push('First name is required.');
    if (!lastName) errors.push('Last name is required.');

    // Email validation
    let rowStatus: 'valid' | 'invalid' | 'duplicate_file' | 'duplicate_db' = 'valid';
    let duplicateWithRow: number | null = null;
    let existingMemberMatch: Member | null = null;

    if (!email) {
      errors.push('Email address is required.');
      rowStatus = 'invalid';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Invalid email format: "${email}".`);
      rowStatus = 'invalid';
    } else {
      // Duplicate in file?
      const occurrences = fileEmailOccurrences.get(email) || [];
      if (occurrences.length > 1) {
        const otherRows = occurrences.filter(r => r !== rowNum);
        errors.push(`Email "${email}" is duplicated in file (Row(s): ${otherRows.join(', ')}).`);
        rowStatus = 'duplicate_file';
        duplicateWithRow = otherRows[0];
        duplicateFileCount++;
      }

      // Duplicate in DB?
      if (dbEmailMap.has(email)) {
        existingMemberMatch = dbEmailMap.get(email)!;
        errors.push(`Email "${email}" already registered to member "${existingMemberMatch.fullName}".`);
        rowStatus = 'duplicate_db';
        duplicateDbCount++;
      }
    }

    // Member ID check (if supplied)
    if (memberId) {
      const occurrences = fileMemberIdOccurrences.get(memberId) || [];
      if (occurrences.length > 1) {
        const otherRows = occurrences.filter(r => r !== rowNum);
        errors.push(`Member ID "${memberId}" is duplicated in file (Row(s): ${otherRows.join(', ')}).`);
        if (rowStatus === 'valid') rowStatus = 'duplicate_file';
      }

      if (dbMemberIdMap.has(memberId)) {
        const existing = dbMemberIdMap.get(memberId)!;
        errors.push(`Member ID "${memberId}" already exists for "${existing.fullName}".`);
        if (rowStatus === 'valid') rowStatus = 'duplicate_db';
      }
    }

    // Normalize membership type
    const rawType = (item.membership_type || '').toLowerCase();
    if (rawType.includes('fac') || rawType.includes('teach')) {
      membershipType = 'Faculty';
    } else if (rawType.includes('res')) {
      membershipType = 'Researcher';
    } else if (rawType.includes('com') || rawType.includes('cit') || rawType.includes('pub')) {
      membershipType = 'Community';
    } else {
      membershipType = 'Student';
    }

    // Normalize status
    const rawStatus = (item.status || '').toLowerCase();
    if (rawStatus === 'inactive') status = 'inactive';
    else if (rawStatus === 'suspended') status = 'suspended';
    else status = 'active';

    // Normalize gender
    const rawGender = (item.gender || '').toLowerCase();
    if (rawGender.startsWith('m')) gender = 'Male';
    else if (rawGender.startsWith('f')) gender = 'Female';
    else gender = 'Other';

    // Normalize date of birth
    if (dob && typeof dob === 'string') {
      const parsed = Date.parse(dob);
      if (!isNaN(parsed)) {
        dob = new Date(parsed).toISOString().split('T')[0];
      }
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
      rowStatus = 'valid';
    } else {
      invalidCount++;
      if (rowStatus === 'valid') rowStatus = 'invalid';
    }

    validatedRows.push({
      rowNumber: rowNum,
      firstName,
      lastName,
      middleName,
      suffix,
      fullName,
      email,
      phone,
      address,
      dateOfBirth: dob,
      gender,
      membershipType,
      status,
      memberId: memberId || undefined,
      temporaryPassword,
      rowStatus,
      errors,
      warnings,
      duplicateWithRow,
      existingMember: existingMemberMatch
        ? {
            id: existingMemberMatch.id,
            fullName: existingMemberMatch.fullName,
            email: existingMemberMatch.email,
            memberId: existingMemberMatch.memberId
          }
        : null
    });
  });

  const summary: MemberImportValidationSummary = {
    totalRows: dataRows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    duplicateFileRows: duplicateFileCount,
    duplicateDbRows: duplicateDbCount,
    canImport: invalidCount === 0 && validCount > 0,
    canImportValid: validCount > 0
  };

  return {
    success: true,
    headers: recognizedFields,
    summary,
    rows: validatedRows
  };
}
