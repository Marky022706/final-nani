export type UserRole = 'super_admin' | 'admin' | 'member';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  memberId?: string; // For members: e.g. MBR-000001
  phone?: string;
  address?: string;
  department?: string;
}

export interface PhysicalCopy {
  copyId: string;
  accessionNumber: string; // e.g. BPL-000101
  barcode: string;          // e.g. BPL-000101
  shelfLocation: string;   // e.g. Shelf A-3, 2nd Floor
  classification: string;  // e.g. 005.133
  condition: 'Good' | 'Fair' | 'New' | 'Damaged';
  status: 'Available' | 'Borrowed' | 'Reserved' | 'Lost' | 'Under Repair' | 'Archived';
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
  copies: PhysicalCopy[];
}

export interface Member {
  id: string;
  memberId: string; // MBR-000001
  fullName: string;
  email: string;
  phone: string;
  address: string;
  membershipType: 'Student' | 'Faculty' | 'Community' | 'Researcher';
  status: 'active' | 'inactive';
  photoUrl: string;
  qrCodeData: string; // token / memberId
  joinDate: string;
  totalBorrows: number;
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
