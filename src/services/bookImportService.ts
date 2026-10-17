import * as XLSX from 'xlsx';
import type { Book } from '../types';
import type {
  ValidatedImportRow,
  ImportValidationSummary,
  ImportValidationResult
} from '../types/import';

export const REQUIRED_IMPORT_COLUMNS = [
  'book_title',
  'author',
  'format',
  'accession_number',
  'availability',
  'quantity'
] as const;

export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_IMPORT_ROW_LIMIT = 1000;

export interface FileFormatValidationResult {
  valid: boolean;
  format?: 'csv' | 'xlsx';
  error?: string;
}

/**
 * Normalizes an ISBN by removing whitespace and hyphens, and converting to uppercase.
 */
export function normalizeIsbn(isbn: string): string {
  if (!isbn) return '';
  return isbn.replace(/[-\s]/g, '').trim().toUpperCase();
}

/**
 * Validates standard ISBN-10 and ISBN-13 checksums.
 */
export function isValidIsbn(normalized: string): boolean {
  if (!normalized) return false;

  // ISBN-10
  if (normalized.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(normalized[i], 10);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }
    const lastChar = normalized[9];
    const lastValue = lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    if (isNaN(lastValue)) return false;
    sum += lastValue;
    return sum % 11 === 0;
  }

  // ISBN-13
  if (normalized.length === 13) {
    if (!/^\d{13}$/.test(normalized)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(normalized[i], 10);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return check === parseInt(normalized[12], 10);
  }

  return false;
}

/**
 * Resolves spreadsheet header labels against catalog fields with flexible alias support.
 */
export function resolveColumnHeader(header: string): string | null {
  const clean = String(header || '')
    .toLowerCase()
    .replace(/[*()]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!clean) return null;

  if (['book title', 'title', 'book_title', 'primary book title', 'booktitle'].includes(clean)) {
    return 'book_title';
  }
  if (['category', 'book category', 'genre'].includes(clean)) {
    return 'category';
  }
  if (['subtitle', 'sub title', 'subtitle or edition notes', 'edition notes'].includes(clean)) {
    return 'subtitle';
  }
  if (['author', 'authors', 'author full name', 'authors name', 'primary author', 'authors'].includes(clean)) {
    return 'author';
  }
  if (['publisher', 'publishing house'].includes(clean)) {
    return 'publisher';
  }
  if (['publication year', 'year', 'pub year', 'publication_year', 'published year'].includes(clean)) {
    return 'publication_year';
  }
  if (['classification ddc', 'classification', 'ddc', 'dewey decimal', 'call number', 'dewey'].includes(clean)) {
    return 'classification';
  }
  if (['format', 'binding', 'book format'].includes(clean)) {
    return 'format';
  }
  if (['accession number', 'accession', 'accession no', 'accession_number', 'acc no', 'acc number'].includes(clean)) {
    return 'accession_number';
  }
  if (['availability', 'status', 'availability status'].includes(clean)) {
    return 'availability';
  }
  if (['description / abstract', 'description', 'abstract', 'summary', 'bibliographic summary'].includes(clean)) {
    return 'description';
  }
  if (['number of copies', 'copies', 'quantity', 'qty', 'number_of_copies', 'count', 'copy count'].includes(clean)) {
    return 'quantity';
  }
  if (['isbn', 'isbn 10', 'isbn 13', 'isbn10', 'isbn13'].includes(clean)) {
    return 'isbn';
  }

  return null;
}

/**
 * Validates the file format, extension, and content signature.
 */
export async function validateFileFormat(file: File): Promise<FileFormatValidationResult> {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'The uploaded file is empty (0 bytes).' };
  }

  if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 5 MB.`
    };
  }

  const name = file.name.toLowerCase();
  const isCsvExt = name.endsWith('.csv');
  const isXlsxExt = name.endsWith('.xlsx');

  if (!isCsvExt && !isXlsxExt) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload a valid .csv or .xlsx file.'
    };
  }

  // Inspect binary magic bytes for .xlsx files
  if (isXlsxExt) {
    try {
      const slice = file.slice(0, 4);
      const buffer = await slice.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // PK zip signature: 0x50, 0x4B, 0x03, 0x04
      const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
      if (!isZip) {
        return {
          valid: false,
          error: 'File signature mismatch: the file has a .xlsx extension but does not contain a valid Excel ZIP structure.'
        };
      }
    } catch {
      return { valid: false, error: 'Unable to inspect file contents.' };
    }
  }

  return {
    valid: true,
    format: isXlsxExt ? 'xlsx' : 'csv'
  };
}

/**
 * Parses and verifies the spreadsheet/CSV file using SheetJS.
 */
export async function parseAndValidateSpreadsheet(
  file: File,
  existingBooks: Book[]
): Promise<ImportValidationResult> {
  const formatCheck = await validateFileFormat(file);
  if (!formatCheck.valid) {
    return {
      success: false,
      message: formatCheck.error,
      headers: [],
      summary: createEmptySummary(),
      rows: []
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', raw: false });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        message: 'The spreadsheet contains no readable worksheets.',
        headers: [],
        summary: createEmptySummary(),
        rows: []
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read rows as array of arrays (AOA)
    const rawMatrix = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false
    });

    if (!rawMatrix || rawMatrix.length === 0) {
      return {
        success: false,
        message: 'The uploaded file is empty and contains no headers or records.',
        headers: [],
        summary: createEmptySummary(),
        rows: []
      };
    }

    // 1. Column Schema Verification
    // Dynamically locate the header row (supports files with institutional headers, banners, or metadata)
    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(rawMatrix.length, 12); r++) {
      const candidateRow = (rawMatrix[r] || []).map((h) => String(h || '').trim());
      // Skip empty rows or comment rows starting with '#'
      if (candidateRow.length === 0 || candidateRow.every((c) => !c) || candidateRow[0].startsWith('#')) {
        continue;
      }
      const canonicals = candidateRow.map((h) => resolveColumnHeader(h)).filter(Boolean);
      if (
        canonicals.includes('book_title') ||
        (canonicals.includes('author') && canonicals.includes('format')) ||
        (canonicals.includes('isbn') && canonicals.includes('author'))
      ) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const rawHeaders = (rawMatrix[headerRowIndex] || []).map((h) => String(h || '').trim());
    const canonicalHeaders = rawHeaders.map((h) => resolveColumnHeader(h));

    // Check duplicate resolved canonical headers
    const headerCounts = new Map<string, number>();
    for (const h of canonicalHeaders) {
      if (h) {
        headerCounts.set(h, (headerCounts.get(h) || 0) + 1);
      }
    }

    for (const [headerName, count] of headerCounts.entries()) {
      if (count > 1) {
        return {
          success: false,
          message: `Duplicate column header detected for field: "${headerName}". Each header must be unique.`,
          headers: rawHeaders,
          summary: createEmptySummary(),
          rows: []
        };
      }
    }

    // Check for missing required headers
    // Legacy support: if 'isbn', 'book_title', 'author', 'quantity' are present, allow it
    const hasLegacy = canonicalHeaders.includes('isbn') && canonicalHeaders.includes('book_title') && canonicalHeaders.includes('author') && canonicalHeaders.includes('quantity');
    const missingHeaders: string[] = [];

    if (!hasLegacy) {
      for (const req of REQUIRED_IMPORT_COLUMNS) {
        if (!canonicalHeaders.includes(req)) {
          let label = req.replace('_', ' ').toUpperCase();
          if (req === 'book_title') label = 'Book Title *';
          if (req === 'author') label = 'Author(s) *';
          if (req === 'format') label = 'Format *';
          if (req === 'accession_number') label = 'Accession Number *';
          if (req === 'availability') label = 'Availability *';
          if (req === 'quantity') label = 'Number of Copies';
          missingHeaders.push(label);
        }
      }
    }

    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required column header(s): ${missingHeaders.join(', ')}. Please use the official Bulk Upload template.`,
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    // Map column indices
    const colIndexMap: Record<string, number> = {};
    canonicalHeaders.forEach((canonical, idx) => {
      if (canonical) {
        colIndexMap[canonical] = idx;
      }
    });

    // Filter data rows to exclude comment lines and completely blank lines
    const rawDataRows = rawMatrix.slice(headerRowIndex + 1);
    const dataRowsWithMeta: { row: string[]; fileRowNum: number }[] = [];
    rawDataRows.forEach((row, idx) => {
      const fileRowNum = headerRowIndex + 1 + idx + 1;
      const trimmed = row.map((c) => String(c || '').trim());
      if (trimmed.every((c) => c === '')) return; // skip blank
      if (trimmed[0].startsWith('#')) return; // skip comment
      dataRowsWithMeta.push({ row, fileRowNum });
    });

    if (dataRowsWithMeta.length === 0) {
      return {
        success: false,
        message: 'The file contains valid headers but has no data rows to import.',
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    if (dataRowsWithMeta.length > MAX_IMPORT_ROW_LIMIT) {
      return {
        success: false,
        message: `File contains ${dataRowsWithMeta.length} rows, exceeding maximum batch limit of ${MAX_IMPORT_ROW_LIMIT} records.`,
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    // 2. Build index of existing books & physical copies in Database
    const existingDbIsbnMap = new Map<string, Book>();
    const existingDbAccessionMap = new Map<string, { bookTitle: string; accessionNumber: string }>();

    for (const book of existingBooks) {
      const norm = normalizeIsbn(book.isbn);
      if (norm) {
        existingDbIsbnMap.set(norm, book);
      }
      if (Array.isArray(book.copies)) {
        for (const copy of book.copies) {
          const accNorm = (copy.accessionNumber || '').trim().toUpperCase();
          if (accNorm) {
            existingDbAccessionMap.set(accNorm, { bookTitle: book.title, accessionNumber: copy.accessionNumber });
          }
        }
      }
    }

    // 3. Pre-scan uploaded file to identify all ISBN & Accession Number occurrences for file-duplicate detection
    const fileIsbnOccurrences = new Map<string, number[]>();
    const fileAccessionOccurrences = new Map<string, number[]>();

    dataRowsWithMeta.forEach(({ row, fileRowNum }) => {
      const rawIsbn = colIndexMap.isbn !== undefined ? String(row[colIndexMap.isbn] || '').trim() : '';
      const normIsbn = normalizeIsbn(rawIsbn);
      if (normIsbn) {
        const list = fileIsbnOccurrences.get(normIsbn) || [];
        list.push(fileRowNum);
        fileIsbnOccurrences.set(normIsbn, list);
      }

      const rawAcc = colIndexMap.accession_number !== undefined ? String(row[colIndexMap.accession_number] || '').trim().toUpperCase() : '';
      if (rawAcc) {
        const list = fileAccessionOccurrences.get(rawAcc) || [];
        list.push(fileRowNum);
        fileAccessionOccurrences.set(rawAcc, list);
      }
    });

    // 4. Validate every row
    const validatedRows: ValidatedImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateFileCount = 0;
    let duplicateDbCount = 0;

    dataRowsWithMeta.forEach(({ row, fileRowNum }) => {
      const rowNum = fileRowNum;
      const rawTitle = colIndexMap.book_title !== undefined ? String(row[colIndexMap.book_title] || '').trim() : '';
      const rawCategory = colIndexMap.category !== undefined ? String(row[colIndexMap.category] || '').trim() : '';
      const rawSubtitle = colIndexMap.subtitle !== undefined ? String(row[colIndexMap.subtitle] || '').trim() : '';
      const rawAuthor = colIndexMap.author !== undefined ? String(row[colIndexMap.author] || '').trim() : '';
      const rawPublisher = colIndexMap.publisher !== undefined ? String(row[colIndexMap.publisher] || '').trim() : '';
      const rawYear = colIndexMap.publication_year !== undefined ? String(row[colIndexMap.publication_year] || '').trim() : '';
      const rawClassification = colIndexMap.classification !== undefined ? String(row[colIndexMap.classification] || '').trim() : '';
      const rawFormat = colIndexMap.format !== undefined ? String(row[colIndexMap.format] || '').trim() : '';
      const rawAccession = colIndexMap.accession_number !== undefined ? String(row[colIndexMap.accession_number] || '').trim() : '';
      const rawAvailability = colIndexMap.availability !== undefined ? String(row[colIndexMap.availability] || '').trim() : '';
      const rawDescription = colIndexMap.description !== undefined ? String(row[colIndexMap.description] || '').trim() : '';
      const rawQuantity = colIndexMap.quantity !== undefined ? String(row[colIndexMap.quantity] || '').trim() : '';
      const rawIsbn = colIndexMap.isbn !== undefined ? String(row[colIndexMap.isbn] || '').trim() : '';

      const errors: string[] = [];
      let status: ValidatedImportRow['status'] = 'valid';
      const normIsbn = normalizeIsbn(rawIsbn);
      const normAccession = rawAccession.toUpperCase();
      let parsedQuantity: number | null = null;
      let parsedYear: number | undefined = undefined;

      // Mandatory field presence checks
      if (!rawTitle) {
        errors.push('Book Title is required.');
      }
      if (!rawAuthor) {
        errors.push('Author(s) is required.');
      }
      if (!rawFormat && !hasLegacy) {
        errors.push('Format is required (e.g. Paperback, Hardcover).');
      }
      if (!rawAccession && !hasLegacy) {
        errors.push('Accession Number is required (e.g. BPL-ACC-0006).');
      }
      if (!rawAvailability && !hasLegacy) {
        errors.push('Availability is required (e.g. Available).');
      }
      if (!rawQuantity) {
        errors.push('Number of Copies is required.');
      }

      // Quantity type-casting and constraint checks
      if (rawQuantity) {
        if (rawQuantity.includes('.') || rawQuantity.includes(',')) {
          errors.push(`Number of Copies must be a positive whole number (decimals like '${rawQuantity}' not allowed).`);
        } else if (!/^\d+$/.test(rawQuantity)) {
          errors.push('Number of Copies must be a valid whole number integer.');
        } else {
          const qty = parseInt(rawQuantity, 10);
          if (qty <= 0) {
            errors.push('Number of Copies must be greater than zero.');
          } else if (qty > 10000) {
            errors.push('Number of Copies exceeds the maximum allowed batch threshold of 10,000 copies.');
          } else {
            parsedQuantity = qty;
          }
        }
      }

      // Year parsing
      if (rawYear) {
        const y = parseInt(rawYear, 10);
        if (!isNaN(y) && y >= 1000 && y <= new Date().getFullYear() + 1) {
          parsedYear = y;
        } else {
          errors.push(`Publication Year '${rawYear}' is invalid. Must be a valid 4-digit year.`);
        }
      }

      // Accession Number duplicate check within file
      let duplicateWithRow: number | null = null;
      if (normAccession && fileAccessionOccurrences.has(normAccession)) {
        const occurrences = fileAccessionOccurrences.get(normAccession)!;
        if (occurrences.length > 1) {
          const firstOccur = occurrences[0];
          const otherOccurs = occurrences.filter((rn) => rn !== rowNum);
          duplicateWithRow = firstOccur !== rowNum ? firstOccur : otherOccurs[0];

          if (firstOccur !== rowNum) {
            status = 'duplicate_file';
            errors.push(`Duplicate Accession Number in file: conflicts with Row ${firstOccur}.`);
          } else {
            errors.push(`Duplicate Accession Number in file: matches subsequent Row(s) ${otherOccurs.join(', ')}.`);
          }
        }
      }

      // Accession Number duplicate check against database records
      let existingBook: ValidatedImportRow['existingBook'] = null;
      if (normAccession && existingDbAccessionMap.has(normAccession)) {
        status = 'duplicate_db';
        const match = existingDbAccessionMap.get(normAccession)!;
        existingBook = {
          id: match.accessionNumber,
          title: match.bookTitle,
          accessionNumber: match.accessionNumber
        };
        errors.push(`Accession Number "${rawAccession}" already exists in library database (Book: "${match.bookTitle}").`);
      }

      // ISBN checks if present
      if (normIsbn) {
        if (!isValidIsbn(normIsbn)) {
          errors.push('Invalid ISBN format (must be a valid 10-digit or 13-digit standard ISBN).');
        }

        // Duplicate check in file
        if (fileIsbnOccurrences.has(normIsbn)) {
          const occurrences = fileIsbnOccurrences.get(normIsbn)!;
          if (occurrences.length > 1 && status !== 'duplicate_file') {
            const firstOccur = occurrences[0];
            if (firstOccur !== rowNum) {
              status = 'duplicate_file';
              errors.push(`Duplicate ISBN in file: conflicts with Row ${firstOccur}.`);
            }
          }
        }

        // Duplicate check in database
        if (existingDbIsbnMap.has(normIsbn) && status !== 'duplicate_db') {
          status = 'duplicate_db';
          const match = existingDbIsbnMap.get(normIsbn)!;
          existingBook = {
            id: match.id,
            title: match.title,
            author: match.author,
            isbn: match.isbn
          };
          errors.push(`ISBN already exists in library database (Title: "${match.title}", ISBN: ${match.isbn}).`);
        }
      }

      // Mark invalid if errors exist and no specific duplicate status was assigned
      if (errors.length > 0 && status === 'valid') {
        status = 'invalid';
      }

      // Update counters
      if (status === 'valid') {
        validCount++;
      } else if (status === 'duplicate_file') {
        duplicateFileCount++;
      } else if (status === 'duplicate_db') {
        duplicateDbCount++;
      } else {
        invalidCount++;
      }

      const generatedAcc = rawAccession || `BPL-ACC-${String(rowNum).padStart(4, '0')}`;
      const generatedIsbn = rawIsbn || `978-BPL-${normAccession || String(rowNum).padStart(6, '0')}`;

      validatedRows.push({
        rowNumber: rowNum,
        title: rawTitle,
        category: rawCategory || 'General Reference',
        subtitle: rawSubtitle || undefined,
        author: rawAuthor,
        publisher: rawPublisher || 'Balingasag Municipal Library',
        publicationYear: parsedYear || new Date().getFullYear(),
        classification: rawClassification || 'General Stacks',
        format: rawFormat || 'Paperback',
        accessionNumber: generatedAcc,
        availability: rawAvailability || 'Available',
        description: rawDescription || undefined,
        quantity: parsedQuantity,
        rawQuantity,
        isbn: rawIsbn || generatedIsbn,
        normalizedIsbn: normIsbn || generatedIsbn,
        status,
        errors,
        duplicateWithRow,
        existingBook
      });
    });

    const totalRows = validatedRows.length;
    const canImport =
      totalRows > 0 &&
      validCount > 0 &&
      invalidCount === 0 &&
      duplicateFileCount === 0 &&
      duplicateDbCount === 0;

    const summary: ImportValidationSummary = {
      totalRows,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateFileRows: duplicateFileCount,
      duplicateDbRows: duplicateDbCount,
      canImport
    };

    return {
      success: true,
      headers: rawHeaders,
      summary,
      rows: validatedRows
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to parse file: ${err?.message || 'File corrupted or unreadable.'}`,
      headers: [],
      summary: createEmptySummary(),
      rows: []
    };
  }
}

/**
 * Downloads an expertly designed sample CSV or Excel (.xlsx) template
 * with institutional branding, formatting guidelines, and sample records.
 */
export function downloadSampleTemplate(format: 'csv' | 'xlsx' = 'xlsx') {
  const headers = [
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
  ];

  const sampleCatalogRows = [
    [
      'Clean Code: A Handbook of Agile Software Craftsmanship',
      'General Reference',
      'A Handbook of Agile Software Craftsmanship',
      'Robert C. Martin',
      'Prentice Hall',
      2026,
      '005.133 MAR',
      'Paperback',
      'BPL-ACC-0006',
      'Available',
      'Even bad code can function. But if code is not clean, it can bring a development organization to its knees.',
      1
    ],
    [
      'Introduction to Algorithms',
      'General Reference',
      'Fourth Edition',
      'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
      'MIT Press',
      2022,
      '005.1 COR',
      'Hardcover',
      'BPL-ACC-0007',
      'Available',
      'Comprehensive textbook covering modern computer algorithms, data structures, and algorithmic complexity analysis.',
      2
    ],
    [
      'The Philippine Islands, 1493–1898',
      'Filipiniana',
      'Explorations by Early Navigators, Descriptions of the Islands and their Peoples',
      'Emma Helen Blair, James Alexander Robertson',
      'Arthur H. Clark Company',
      2024,
      '959.9 BLA',
      'Hardcover',
      'BPL-ACC-0008',
      'Available',
      'Monumental collection of historical records, exploration accounts, and colonial documents on the Philippines.',
      1
    ],
    [
      'To Kill a Mockingbird',
      'Fiction',
      'Perennial Classics Edition',
      'Harper Lee',
      'HarperCollins',
      2025,
      '813.54 LEE',
      'Paperback',
      'BPL-ACC-0009',
      'Available',
      'The unforgettable novel of childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
      1
    ]
  ];

  if (format === 'csv') {
    // Generate an expertly formatted CSV with UTF-8 BOM and institutional ASCII header banner
    const csvLines: string[] = [
      '# ==========================================================================================================',
      '# BALINGASAG PUBLIC LIBRARY — OFFICIAL BOOK CATALOGING TEMPLATE (v2026.2)',
      '# Municipality of Balingasag, Misamis Oriental • Public Library Management System',
      '# INSTRUCTIONS: Columns with (*) are REQUIRED. Accession numbers must be unique. Fill entries below.',
      '# ==========================================================================================================',
      headers.map((h) => escapeCsvValue(h)).join(',')
    ];

    sampleCatalogRows.forEach((row) => {
      csvLines.push(row.map((cell) => escapeCsvValue(String(cell))).join(','));
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n') + '\r\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'balingasag_library_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    return;
  }

  // Generate a rich, formatted Excel (.xlsx) workbook
  const workbook = XLSX.utils.book_new();

  // ----------------------------------------------------
  // Sheet 1: Books_Catalog
  // ----------------------------------------------------
  const sheet1Data = [
    ['BALINGASAG PUBLIC LIBRARY — OFFICIAL BOOK CATALOGING TEMPLATE'],
    ['Municipality of Balingasag, Misamis Oriental • Public Library Management System (Schema v2026.2)'],
    ['INSTRUCTIONS: Columns with (*) are REQUIRED. Accession Numbers must be unique per copy. Fill catalog entries starting from Row 5.'],
    [''],
    headers,
    ...sampleCatalogRows
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Column width formatting
  worksheet['!cols'] = [
    { wch: 46 }, // Book Title *
    { wch: 20 }, // Category
    { wch: 38 }, // Subtitle
    { wch: 32 }, // Author(s) *
    { wch: 28 }, // Publisher
    { wch: 18 }, // Publication Year
    { wch: 22 }, // Classification (DDC)
    { wch: 14 }, // Format *
    { wch: 22 }, // Accession Number *
    { wch: 16 }, // Availability *
    { wch: 60 }, // Description / Abstract
    { wch: 18 }  // Number of Copies
  ];

  // Row height formatting
  worksheet['!rows'] = [
    { hpt: 32 }, // Row 1 Title banner
    { hpt: 19 }, // Row 2 Subtitle
    { hpt: 19 }, // Row 3 Instructions
    { hpt: 8 },  // Row 4 Blank spacer
    { hpt: 28 }, // Row 5 Table Headers
    { hpt: 22 }, // Row 6 Sample 1
    { hpt: 22 }, // Row 7 Sample 2
    { hpt: 22 }, // Row 8 Sample 3
    { hpt: 22 }  // Row 9 Sample 4
  ];

  // Cell merges for institutional banner
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 11 } }
  ];

  // Auto-filter on table headers (A5:L9)
  worksheet['!autofilter'] = { ref: 'A5:L9' };

  // Freeze panes at row 5 so headers stay pinned
  worksheet['!views'] = [{ state: 'frozen', ySplit: 5 }];

  // Column comments on Row 5 headers (A5 to L5)
  const headerComments: Record<string, string> = {
    A5: 'Required. Primary bibliographic publication title.',
    B5: 'Optional. e.g. General Reference, Fiction, Non-Fiction, Filipiniana. Defaults to General Reference.',
    C5: 'Optional. Subtitle or edition notes.',
    D5: 'Required. Primary author full name or multiple authors separated by commas.',
    E5: 'Optional. Publishing house or imprint.',
    F5: 'Optional. 4-digit publication year (e.g. 2026).',
    G5: 'Optional. Dewey Decimal Classification code (e.g. 005.133 MAR).',
    H5: 'Required. Paperback, Hardcover, Digital, Periodical. Defaults to Paperback.',
    I5: 'Required. Unique accession identifier (e.g. BPL-ACC-0006). Must be unique.',
    J5: 'Required. Catalog availability: Available, Reserved, Under Repair. Defaults to Available.',
    K5: 'Optional. Bibliographic summary, abstract, or synopsis.',
    L5: 'Required. Number of physical copies to accession (positive integer >= 1).'
  };

  for (const [cellRef, commentText] of Object.entries(headerComments)) {
    if (worksheet[cellRef]) {
      worksheet[cellRef].c = [{ a: 'Balingasag Public Library', t: commentText }];
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Books_Catalog');

  // ----------------------------------------------------
  // Sheet 2: Cataloging_Standards_Guide
  // ----------------------------------------------------
  const guideSheetData = [
    ['BALINGASAG PUBLIC LIBRARY — CATALOGING STANDARDS & DATA DICTIONARY'],
    ['Official Technical Services Reference for Municipal Librarians & Cataloging Staff'],
    [''],
    ['FIELD SPECIFICATIONS & VALIDATION RULES:'],
    ['Column Name', 'Required', 'Data Type', 'Validation Rules & Allowed Values', 'Example Value'],
    ['Book Title *', 'YES', 'Text', 'Primary book title. Full official publication title without truncation.', 'Clean Code: A Handbook of Agile Software Craftsmanship'],
    ['Category', 'NO', 'Text', 'Subject category (e.g. General Reference, Fiction, Filipiniana, Philosophy, Science). Defaults to "General Reference".', 'General Reference'],
    ['Subtitle', 'NO', 'Text', 'Subtitle, series information, or edition notes.', 'A Handbook of Agile Software Craftsmanship'],
    ['Author(s) *', 'YES', 'Text', 'Author full name or multiple authors separated by commas.', 'Robert C. Martin'],
    ['Publisher', 'NO', 'Text', 'Publishing house, university press, or institutional imprint.', 'Prentice Hall'],
    ['Publication Year', 'NO', 'Integer', '4-digit publication year (e.g. 2026). Defaults to current year.', '2026'],
    ['Classification (DDC)', 'NO', 'Text', 'Dewey Decimal Classification number with optional author cutter.', '005.133 MAR'],
    ['Format *', 'YES', 'Enum', 'Book physical binding: Paperback, Hardcover, Digital, Periodical, Reference. Defaults to "Paperback".', 'Paperback'],
    ['Accession Number *', 'YES', 'Text', 'Unique library accession number (e.g. BPL-ACC-0006). Must not collide with existing catalog.', 'BPL-ACC-0006'],
    ['Availability *', 'YES', 'Enum', 'Initial status: Available, Reserved, Under Repair. Defaults to "Available".', 'Available'],
    ['Description / Abstract', 'NO', 'Text', 'Bibliographic synopsis, summary, or subject description.', 'Even bad code can function. But if code is not clean, it can bring a team to its knees.'],
    ['Number of Copies', 'YES', 'Integer', 'Physical copies count to catalog (positive whole number >= 1).', '1'],
    [''],
    ['INVENTORY & ACCESSIONING POLICIES:'],
    ['1. Unique Accession Identifier Policy', '', '', 'Each accession number must be unique across the library catalog and within the file.'],
    ['2. Automated Multi-Copy Accessioning', '', '', 'When Number of Copies > 1, the system automatically assigns sequential copy suffixes (-C2, -C3).'],
    ['3. Standard Book Formats', '', '', 'Allowed formats: Paperback, Hardcover, eBook, Periodical, Reference, Spiral-bound.'],
    ['4. Shelf Location & Dewey Decimal System', '', '', 'Call numbers follow Dewey Decimal Classification (DDC) to maintain proper shelf order.'],
    ['5. Transaction Safety Mode', '', '', 'All-or-Nothing mode ensures only 100% valid batches are committed to avoid partial database corruption.']
  ];

  const guideSheet = XLSX.utils.aoa_to_sheet(guideSheetData);

  guideSheet['!cols'] = [
    { wch: 26 }, // Column Name
    { wch: 12 }, // Required
    { wch: 14 }, // Data Type
    { wch: 72 }, // Rules & Allowed Values
    { wch: 38 }  // Example Value
  ];

  guideSheet['!rows'] = [
    { hpt: 28 }, // Title
    { hpt: 18 }, // Subtitle
    { hpt: 8 },  // Spacer
    { hpt: 22 }, // Section Header
    { hpt: 24 }  // Table Headers
  ];

  guideSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }
  ];

  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Cataloging_Standards_Guide');
  XLSX.writeFile(workbook, 'balingasag_library_bulk_upload_template.xlsx');
}

/**
 * Helper to safely escape values for CSV export.
 */
function escapeCsvValue(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function createEmptySummary(): ImportValidationSummary {
  return {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    duplicateFileRows: 0,
    duplicateDbRows: 0,
    canImport: false
  };
}
