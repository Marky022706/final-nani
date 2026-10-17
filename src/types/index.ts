export type UserRole = 'super_admin' | 'admin' | 'volunteer' | 'member';
export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  status: AccountStatus;
  createdAt: string;
  memberId?: string; // For members: e.g. BPL-2026-0001
  phone?: string;
  address?: string;
  department?: string;
  mustChangePassword?: boolean;
  privileges?: LibrarianPrivileges;
  lastLogin?: string;
  lastLoginIp?: string;
}

export interface LibrarianPrivileges {
  circulationDesk: boolean; // Daily check-ins, check-outs, issue loans
  inventoryManagement: boolean; // Add, edit, catalog, archive books
  memberManagement: boolean; // Register, verify, update members
  servicesManagement: boolean; // Record library services & attendance
  reportsExport: boolean; // Export circulation & inventory analytics
  auditView: boolean; // View audit logs
}

export interface MemberTierPolicy {
  id: string;
  tierName: string; // e.g. Student, Faculty, Community, Senior / PWD, Researcher
  maxLoanLimit: number; // Max books concurrently borrowed
  loanPeriodDays: number; // Max days allowed per loan
  maxReservations: number;
  dailyFineRate: number; // PHP per day overdue
  gracePeriodDays: number; // Days after due date before fine starts
  fineExempt: boolean;
  description?: string;
}

export interface PhysicalCopy {
  copyId: string;
  accessionNumber: string; // e.g. BPL-000101
  barcode: string;          // e.g. BPL-000101
  shelfLocation?: string;   // e.g. Shelf A-3, 2nd Floor
  classification: string;  // e.g. 005.133
  condition: 'Good' | 'Fair' | 'New' | 'Damaged';
  status: 'Available' | 'Borrowed' | 'Reserved' | 'Lost' | 'Under Repair' | 'Archived';
  format?: 'Paperback' | 'Hardcover' | 'eBook' | 'Periodical' | 'Reference' | 'Spiral-bound' | string;
  dateAdded: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  author: string;
  publisher: string;
  publicationYear: number;
  edition?: string;
  language: string;
  description: string;
  pages: number;
  category: string;
  subject?: string;
  keywords?: string[];
  classification: string;
  coverImage?: string;
  accessionNumber?: string; // Primary accession number
  format?: 'Paperback' | 'Hardcover' | 'eBook' | 'Periodical' | 'Reference' | 'Spiral-bound' | string;
  availability?: 'Available' | 'Borrowed' | 'Reserved' | 'Out of Stock' | 'Archived' | string;
  isArchived?: boolean;
  copies: PhysicalCopy[];
}

export interface Member {
  id: string;
  userId?: string;
  memberId: string; // BPL-2026-0001
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  username?: string;
  dateOfBirth?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  sex?: 'Male' | 'Female' | 'Other';
  email: string;
  phone: string;
  address: string;
  membershipType: 'Student' | 'Faculty' | 'Community' | 'Researcher';
  status: AccountStatus;
  photoUrl: string;
  qrCodeData: string; // memberId e.g. BPL-2026-0001
  joinDate: string;
  totalBorrows: number;
  isArchived?: boolean;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  membershipType: string;
  date: string; // YYYY-MM-DD
  timeIn: string; // e.g. 03:15 PM
  timeOut?: string; // e.g. 05:42 PM
  duration?: string; // e.g. 2h 27m
  status: 'Inside' | 'Completed';
  notes?: string;
  editedBy?: string;
  editReason?: string;
  editedAt?: string;
}

export interface LibraryServiceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  isAvailable: boolean;
}

export interface ServiceRecord {
  id: string;
  serviceId: string;
  serviceName: string;
  memberId: string;
  memberName: string;
  date: string;
  time: string;
  notes?: string;
  recordedBy: string;
}

export interface CirculationTransaction {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  accessionNumber: string;
  barcode: string;
  memberId: string;
  memberName: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'Active' | 'Returned' | 'Overdue' | 'Renewed' | 'Pending Approval' | 'Rejected';
  renewalCount: number;
  processedBy: string;
  requestDate?: string;
  rejectionReason?: string;
}

export interface BookReservation {
  id: string;
  bookId: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  reservationDate: string;
  expiryDate: string;
  status: 'Pending Approval' | 'Waiting' | 'Ready for Pickup' | 'Claimed' | 'Cancelled' | 'Expired' | 'Rejected';
  queuePosition: number;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  timestamp: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  targetMemberId?: string;
  destination?: string;
  actionText?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  category: 'Attendance' | 'Books' | 'Members' | 'Circulation' | 'Admin' | 'System';
  details: string;
  performedBy: string;
  timestamp: string;
  ipAddress?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface StaffAccessAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  event: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PRIVILEGE_CHANGED' | 'PASSWORD_RESET' | 'STATUS_CHANGED' | 'LOGOUT';
  details: string;
  ipAddress: string;
}

export interface DatabaseBackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  sizeBytes: number;
  recordCounts: {
    books: number;
    members: number;
    transactions: number;
    attendance: number;
    users: number;
    auditLogs: number;
  };
  status: 'Success' | 'Failed';
  notes?: string;
}

export interface SystemSettings {
  // Global Business Logic Variables
  dailyFineRate: number; // ₱ / day
  gracePeriodDays: number;
  maxFineCap: number; // ₱ cap per book
  standardLoanPeriodDays: number;
  maxRenewals: number;
  renewalPeriodDays: number;
  tierPolicies: MemberTierPolicy[];

  // Infrastructure & Maintenance Mode
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceStartedAt?: string;
  estimatedUptime?: string;

  // AI Cataloging Integration
  llmEndpoint: string;
  llmModel: string;

  // Operational Metadata
  libraryName: string;
  operatingHours: string;
  contactEmail: string;
  contactPhone: string;
}
