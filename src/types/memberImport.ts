export type MemberImportRowStatus = 'valid' | 'invalid' | 'duplicate_file' | 'duplicate_db';

export interface RawMemberImportRow {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  membershipType?: string;
  status?: string;
  memberId?: string;
  temporaryPassword?: string;
  [key: string]: any;
}

export interface ValidatedMemberImportRow {
  rowNumber: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  membershipType: 'Student' | 'Faculty' | 'Researcher' | 'Community';
  status: 'active' | 'inactive' | 'suspended';
  memberId?: string;
  temporaryPassword?: string;
  rowStatus: MemberImportRowStatus;
  errors: string[];
  warnings: string[];
  duplicateWithRow?: number | null;
  existingMember?: {
    id: string | number;
    fullName: string;
    email: string;
    memberId?: string;
  } | null;
}

export interface MemberImportValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateFileRows: number;
  duplicateDbRows: number;
  canImport: boolean;
  canImportValid: boolean;
}

export interface MemberImportValidationResult {
  success: boolean;
  message?: string;
  headers: string[];
  summary: MemberImportValidationSummary;
  rows: ValidatedMemberImportRow[];
}

export interface MemberImportExecutionResult {
  success: boolean;
  message: string;
  imported_count: number;
  skipped_count: number;
  imported_members: any[];
  summary?: MemberImportValidationSummary;
}
