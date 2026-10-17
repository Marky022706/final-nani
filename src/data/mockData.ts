import type {
  Book,
  Member,
  AttendanceRecord,
  LibraryServiceItem,
  ServiceRecord,
  CirculationTransaction,
  BookReservation,
  NotificationItem,
  AuditLog
} from '../types';

/**
 * Clean live state - No mock members. Real members are created via Member Registration.
 */
export const INITIAL_MEMBERS: Member[] = [];

/**
 * Clean live state - No mock books. Real books are cataloged via Book Acquisition.
 */
export const INITIAL_BOOKS: Book[] = [];

/**
 * Clean live state - No mock attendance records.
 */
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

/**
 * Standard Municipal Library Services Catalog
 */
export const INITIAL_SERVICES: LibraryServiceItem[] = [
  {
    id: 'srv-1',
    name: 'Research Assistance',
    category: 'Academic Support',
    description: 'One-on-one assistance finding academic journals, regional archives, and library databases.',
    iconName: 'Search',
    isAvailable: true
  },
  {
    id: 'srv-2',
    name: 'Computer & Internet Station',
    category: 'Technology',
    description: 'High-speed internet access workstation for academic research, government filings, and digital learning.',
    iconName: 'Monitor',
    isAvailable: true
  },
  {
    id: 'srv-3',
    name: 'Quiet Reading Room',
    category: 'Facilities',
    description: 'Dedicated air-conditioned quiet area for concentrated studying and book reading.',
    iconName: 'BookOpen',
    isAvailable: true
  },
  {
    id: 'srv-4',
    name: 'Printing & Photocopying',
    category: 'Document Services',
    description: 'Official document printing, scanning, and photocopying for educational materials.',
    iconName: 'Printer',
    isAvailable: true
  },
  {
    id: 'srv-5',
    name: 'Reference & Heritage Desk',
    category: 'Historical & Reference',
    description: 'Specialized consultation on local Balingasag history, municipal records, and rare book collections.',
    iconName: 'Landmark',
    isAvailable: true
  },
  {
    id: 'srv-6',
    name: 'Library Orientation & Card Renewal',
    category: 'Member Services',
    description: 'Guided tour for new members, orientation on Dewey Decimal system, and digital card replacements.',
    iconName: 'Compass',
    isAvailable: true
  }
];

/**
 * Clean live state - No mock service records.
 */
export const INITIAL_SERVICE_RECORDS: ServiceRecord[] = [];

/**
 * Clean live state - No mock circulation transactions.
 */
export const INITIAL_TRANSACTIONS: CirculationTransaction[] = [];

/**
 * Clean live state - No mock reservations.
 */
export const INITIAL_RESERVATIONS: BookReservation[] = [];

/**
 * Initial Operational Notifications
 */
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-init-1',
    title: 'Overdue Loan Alert: "Noli Me Tangere"',
    message: 'Copy BPL-000101 issued to Juan Dela Cruz is past due. Settle return and fine rate (₱5.00/day) at desk.',
    type: 'alert',
    timestamp: '15 mins ago',
    read: false,
    targetRole: 'admin',
    destination: 'circulation',
    actionText: 'View in Circulation'
  },
  {
    id: 'notif-init-2',
    title: 'Borrow Request Awaiting Review',
    message: 'Patron Maria Santos (MBR-000002) submitted a borrow request for "Florante at Laura".',
    type: 'info',
    timestamp: '35 mins ago',
    read: false,
    targetRole: 'admin',
    destination: 'circulation',
    actionText: 'Review Approval'
  },
  {
    id: 'notif-init-3',
    title: 'Hold Reservation Ready for Pickup',
    message: 'Your reserved title "El Filibusterismo" is ready at the circulation counter. Hold valid for 7 days.',
    type: 'success',
    timestamp: '1 hour ago',
    read: false,
    targetRole: 'member',
    targetMemberId: 'MBR-000001',
    destination: 'reservations',
    actionText: 'View Hold'
  },
  {
    id: 'notif-init-4',
    title: 'QR Attendance Confirmed',
    message: 'Time-in recorded at Municipal Library front desk. Free WiFi & study station access activated.',
    type: 'info',
    timestamp: '2 hours ago',
    read: true,
    targetRole: 'all',
    destination: 'attendance',
    actionText: 'View Attendance'
  },
  {
    id: 'notif-init-5',
    title: 'New Catalog Acquisition Available',
    message: '15 new physical copies of Philippine History and Information Technology books cataloged on shelves.',
    type: 'info',
    timestamp: 'Yesterday',
    read: true,
    targetRole: 'all',
    destination: 'books',
    actionText: 'Browse Books'
  }
];

/**
 * System Audit Log - Initialized with real operational start record.
 */
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-init',
    action: 'SYSTEM_INITIALIZED',
    category: 'System',
    details: 'Balingasag Municipal Library Management System initialized for live operations.',
    performedBy: 'System Administrator',
    timestamp: '2026-09-07 08:00:00',
    ipAddress: '127.0.0.1'
  }
];

export const ISBN_KNOWLEDGE_BASE: Record<string, Partial<Book>> = {};
