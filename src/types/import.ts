export type ImportRowStatus = 'valid' | 'invalid' | 'duplicate_file' | 'duplicate_db';

export interface RawImportRow {
  title?: string;
  category?: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  publicationYear?: string | number;
  classification?: string;
  format?: string;
  accessionNumber?: string;
  availability?: string;
  description?: string;
  numberOfCopies?: string | number;
  isbn?: string;
  quantity?: string | number;
  [key: string]: any;
}

export interface ValidatedImportRow {
  rowNumber: number;
  title: string;
  category?: string;
  subtitle?: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  classification?: string;
  format: string;
  accessionNumber: string;
  availability: string;
  description?: string;
  quantity: number | null;
  rawQuantity: string;
  isbn: string;
  normalizedIsbn: string;
  status: ImportRowStatus;
  errors: string[];
  duplicateWithRow?: number | null;
  existingBook?: {
    id: string | number;
    title: string;
    author?: string;
    isbn?: string;
    accessionNumber?: string;
  } | null;
}

export interface ImportValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateFileRows: number;
  duplicateDbRows: number;
  canImport: boolean;
}

export interface ImportValidationResult {
  success: boolean;
  message?: string;
  headers: string[];
  summary: ImportValidationSummary;
  rows: ValidatedImportRow[];
}

export interface ImportExecutionResult {
  success: boolean;
  message: string;
  imported_count: number;
  total_copies_created: number;
  books: any[];
  summary?: ImportValidationSummary;
}
