import * as XLSX from 'xlsx';
import type { Book } from '../types';
import type {
  ValidatedImportRow,
  ImportValidationSummary,
  ImportValidationResult
} from '../types/import';

export const REQUIRED_IMPORT_COLUMNS = ['isbn', 'title', 'author', 'quantity'] as const;
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
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateFileRows: 0,
        duplicateDbRows: 0,
        canImport: false
      },
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
    const rawHeaders = (rawMatrix[0] || []).map((h) => String(h || '').trim());
    const normalizedHeaders = rawHeaders.map((h) => h.toLowerCase());

    // Check for duplicate headers
    const headerCounts = new Map<string, number>();
    for (const h of normalizedHeaders) {
      if (h) {
        headerCounts.set(h, (headerCounts.get(h) || 0) + 1);
      }
    }

    for (const [headerName, count] of headerCounts.entries()) {
      if (count > 1) {
        return {
          success: false,
          message: `Duplicate column header detected: "${headerName}". Each header must be unique.`,
          headers: rawHeaders,
          summary: createEmptySummary(),
          rows: []
        };
      }
    }

    // Check for missing required headers
    const missingHeaders: string[] = [];
    for (const req of REQUIRED_IMPORT_COLUMNS) {
      if (!normalizedHeaders.includes(req)) {
        missingHeaders.push(req.toUpperCase());
      }
    }

    if (missingHeaders.length > 0) {
      return {
        success: false,
        message: `Missing required column header(s): ${missingHeaders.join(', ')}. Required columns are: ISBN, Title, Author, Quantity.`,
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    // Map column indices
    const colIndexMap: Record<string, number> = {};
    for (const req of REQUIRED_IMPORT_COLUMNS) {
      colIndexMap[req] = normalizedHeaders.indexOf(req);
    }

    const dataRows = rawMatrix.slice(1);
    if (dataRows.length === 0) {
      return {
        success: false,
        message: 'The file contains valid headers but has no data rows to import.',
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    if (dataRows.length > MAX_IMPORT_ROW_LIMIT) {
      return {
        success: false,
        message: `File contains ${dataRows.length} rows, exceeding maximum batch limit of ${MAX_IMPORT_ROW_LIMIT} records.`,
        headers: rawHeaders,
        summary: createEmptySummary(),
        rows: []
      };
    }

    // 2. Build index of existing books in Database
    const existingDbMap = new Map<string, Book>();
    for (const book of existingBooks) {
      const norm = normalizeIsbn(book.isbn);
      if (norm) {
        existingDbMap.set(norm, book);
      }
    }

    // 3. Pre-scan uploaded file to identify all ISBN occurrences for file-duplicate detection
    const fileIsbnOccurrences = new Map<string, number[]>();
    dataRows.forEach((row, idx) => {
      const fileRowNum = idx + 2; // Row 1 is header
      const rawIsbn = String(row[colIndexMap.isbn] || '').trim();
      const norm = normalizeIsbn(rawIsbn);
      if (norm) {
        const list = fileIsbnOccurrences.get(norm) || [];
        list.push(fileRowNum);
        fileIsbnOccurrences.set(norm, list);
      }
    });

    // 4. Validate every row
    const validatedRows: ValidatedImportRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateFileCount = 0;
    let duplicateDbCount = 0;

    dataRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const rawIsbn = String(row[colIndexMap.isbn] || '').trim();
      const rawTitle = String(row[colIndexMap.title] || '').trim();
      const rawAuthor = String(row[colIndexMap.author] || '').trim();
      const rawQuantity = String(row[colIndexMap.quantity] || '').trim();

      const errors: string[] = [];
      let status: ValidatedImportRow['status'] = 'valid';
      const normIsbn = normalizeIsbn(rawIsbn);
      let parsedQuantity: number | null = null;

      // Mandatory field presence checks
      if (!rawIsbn) {
        errors.push('ISBN is required.');
      }
      if (!rawTitle) {
        errors.push('Title is required.');
      }
      if (!rawAuthor) {
        errors.push('Author is required.');
      }
      if (!rawQuantity) {
        errors.push('Quantity is required.');
      }

      // Quantity type-casting and constraint checks
      if (rawQuantity) {
        if (rawQuantity.includes('.') || rawQuantity.includes(',')) {
          errors.push(`Quantity must be a positive whole number (decimals like '${rawQuantity}' not allowed).`);
        } else if (!/^\d+$/.test(rawQuantity)) {
          errors.push('Quantity must be a valid whole number integer.');
        } else {
          const qty = parseInt(rawQuantity, 10);
          if (qty <= 0) {
            errors.push('Quantity must be greater than zero.');
          } else if (qty > 10000) {
            errors.push('Quantity exceeds the maximum allowed batch threshold of 10,000 copies.');
          } else {
            parsedQuantity = qty;
          }
        }
      }

      // ISBN format verification
      if (normIsbn) {
        if (!isValidIsbn(normIsbn)) {
          errors.push('Invalid ISBN format (must be a valid 10-digit or 13-digit standard ISBN).');
        }
      }

      // Duplicate check within the uploaded file
      let duplicateWithRow: number | null = null;
      if (normIsbn && fileIsbnOccurrences.has(normIsbn)) {
        const occurrences = fileIsbnOccurrences.get(normIsbn)!;
        if (occurrences.length > 1) {
          const firstOccur = occurrences[0];
          const otherOccurs = occurrences.filter((rn) => rn !== rowNum);
          duplicateWithRow = firstOccur !== rowNum ? firstOccur : otherOccurs[0];

          if (firstOccur !== rowNum) {
            status = 'duplicate_file';
            errors.push(`Duplicate ISBN in file: conflicts with Row ${firstOccur}. Use 'Quantity' to add multiple copies.`);
          } else {
            errors.push(`Duplicate ISBN in file: matches subsequent Row(s) ${otherOccurs.join(', ')}.`);
          }
        }
      }

      // Duplicate check against database records
      let existingBook: ValidatedImportRow['existingBook'] = null;
      if (normIsbn && existingDbMap.has(normIsbn)) {
        status = 'duplicate_db';
        const match = existingDbMap.get(normIsbn)!;
        existingBook = {
          id: match.id,
          title: match.title,
          author: match.author,
          isbn: match.isbn
        };
        errors.push(`ISBN already exists in library database (Title: "${match.title}", ISBN: ${match.isbn}).`);
      }

      // If errors were reported and status wasn't already a specific duplicate status, mark invalid
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

      validatedRows.push({
        rowNumber: rowNum,
        isbn: rawIsbn,
        normalizedIsbn: normIsbn,
        title: rawTitle,
        author: rawAuthor,
        quantity: parsedQuantity,
        rawQuantity,
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
 * Downloads a sample CSV or XLSX template for bulk book import with design and formatting rules.
 */
export function downloadSampleTemplate(format: 'csv' | 'xlsx' = 'xlsx') {
  const headers = ['ISBN', 'Title', 'Author', 'Quantity'];
  const sampleData = [
    headers,
    ['978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 3],
    ['978-0201616224', 'The Pragmatic Programmer: Your Journey to Mastery', 'David Thomas, Andrew Hunt', 2],
    ['978-0143127741', 'Designing Data-Intensive Applications', 'Martin Kleppmann', 1],
    ['978-0321125217', 'Domain-Driven Design: Tackling Complexity in Software', 'Eric Evans', 2]
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

  // Column width hints for clean presentation
  worksheet['!cols'] = [
    { wch: 22 }, // ISBN
    { wch: 54 }, // Title
    { wch: 32 }, // Author
    { wch: 14 }  // Quantity
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Books_Catalog');

  if (format === 'xlsx') {
    // Add a secondary formatted guidelines worksheet
    const guidelinesData = [
      ['BALINGASAG PUBLIC LIBRARY - BULK BOOK IMPORT GUIDELINES'],
      ['Official Bibliographic Cataloging Spreadsheet Schema (v2026.1)'],
      [''],
      ['COLUMN SPECIFICATIONS & VALIDATION RULES:'],
      ['Column Name', 'Required', 'Accepted Format & Constraints', 'Valid Example Value'],
      ['ISBN', 'YES', '10 or 13-digit standard ISBN. Permitted formatting (hyphens, spaces) is normalized automatically. Must be unique per book title.', '978-0132350884'],
      ['Title', 'YES', 'Full publication title. Trim redundant leading/trailing spaces.', 'Clean Code: A Handbook of Agile Software Craftsmanship'],
      ['Author', 'YES', 'Primary author or contributors.', 'Robert C. Martin'],
      ['Quantity', 'YES', 'Positive whole number integer > 0 (1 to 10,000). Decimals and zeros strictly forbidden. Represents number of physical copies to accession.', '3'],
      [''],
      ['IMPORTANT POLICIES & DUPLICATE PREVENTION:'],
      ['1. Multiple Copies Policy', 'Do NOT duplicate rows for the same ISBN. Use the Quantity column to indicate copy count (e.g., Quantity = 5 creates 5 copies).'],
      ['2. Duplicate ISBN Prevention', 'The system automatically detects duplicate ISBNs within this file and conflicts against existing library database records.'],
      ['3. Transactional Safety', 'All-or-Nothing mode ensures only 100% valid batches are committed to avoid partial corruption.'],
      ['4. Barcode & Accession Generation', 'Each copy generated from Quantity receives an automated unique accession number (ACC-XXXXXX) and barcode (BPL-XXXXXX).']
    ];

    const guidelinesSheet = XLSX.utils.aoa_to_sheet(guidelinesData);
    guidelinesSheet['!cols'] = [
      { wch: 26 },
      { wch: 12 },
      { wch: 65 },
      { wch: 35 }
    ];

    XLSX.utils.book_append_sheet(workbook, guidelinesSheet, 'Instructions_and_Rules');
    XLSX.writeFile(workbook, 'balingasag_library_book_import_template.xlsx');
  } else {
    XLSX.writeFile(workbook, 'balingasag_library_book_import_template.csv', { bookType: 'csv' });
  }
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
