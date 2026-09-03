import type {
  User,
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

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Eleanor Vance',
    email: 'superadmin@balingasag.gov.ph',
    username: 'superadmin',
    password: 'password123',
    role: 'super_admin',
    status: 'active',
    createdAt: '2025-01-10',
    department: 'Municipal Information Office'
  },
  {
    id: 'usr-2',
    name: 'Roberto Gomez',
    email: 'admin.roberto@balingasag.gov.ph',
    username: 'admin',
    password: 'password123',
    role: 'admin',
    status: 'active',
    createdAt: '2025-02-15',
    department: 'Library Operations'
  },
  {
    id: 'usr-3',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@gmail.com',
    username: 'juan.delacruz',
    password: 'password123',
    role: 'member',
    memberId: 'BPL-2026-0001',
    status: 'active',
    createdAt: '2026-01-05',
    phone: '+63 917 123 4567',
    address: 'Brgy. 1 Poblacion, Balingasag, Misamis Oriental'
  },
  {
    id: 'usr-4',
    name: 'Maria Clara Santos',
    email: 'maria.santos@gmail.com',
    username: 'maria.santos',
    password: 'password123',
    role: 'member',
    memberId: 'BPL-2026-0002',
    status: 'active',
    createdAt: '2026-01-10',
    phone: '+63 928 987 6543',
    address: 'Brgy. Waterfall, Balingasag, Misamis Oriental'
  },
  {
    id: 'usr-5',
    name: 'David Deactivation Test',
    email: 'david.inactive@gmail.com',
    username: 'david.inactive',
    password: 'password123',
    role: 'member',
    memberId: 'BPL-2026-0005',
    status: 'inactive',
    createdAt: '2026-02-01',
    phone: '+63 933 111 2233',
    address: 'Brgy. Cogon, Balingasag, Misamis Oriental'
  },
  {
    id: 'usr-6',
    name: 'Samantha Suspension Test',
    email: 'samantha.suspended@gmail.com',
    username: 'samantha.suspended',
    password: 'password123',
    role: 'member',
    memberId: 'BPL-2026-0006',
    status: 'suspended',
    createdAt: '2026-02-10',
    phone: '+63 922 444 5566',
    address: 'Brgy. Hermano, Balingasag, Misamis Oriental'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mbr-1',
    userId: 'usr-3',
    memberId: 'BPL-2026-0001',
    fullName: 'Juan Dela Cruz',
    firstName: 'Juan',
    middleName: 'Ramos',
    lastName: 'Dela Cruz',
    username: 'juan.delacruz',
    dateOfBirth: '2004-05-14',
    gender: 'Male',
    email: 'juan.delacruz@gmail.com',
    phone: '+63 917 123 4567',
    address: 'Brgy. 1 Poblacion, Balingasag, Misamis Oriental',
    membershipType: 'Student',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0001',
    joinDate: '2026-01-05',
    totalBorrows: 12
  },
  {
    id: 'mbr-2',
    userId: 'usr-4',
    memberId: 'BPL-2026-0002',
    fullName: 'Maria Clara Santos',
    firstName: 'Maria',
    middleName: 'Clara',
    lastName: 'Santos',
    username: 'maria.santos',
    dateOfBirth: '2001-09-22',
    gender: 'Female',
    email: 'maria.santos@gmail.com',
    phone: '+63 928 987 6543',
    address: 'Brgy. Waterfall, Balingasag, Misamis Oriental',
    membershipType: 'Researcher',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0002',
    joinDate: '2026-01-10',
    totalBorrows: 8
  },
  {
    id: 'mbr-3',
    memberId: 'BPL-2026-0003',
    fullName: 'Carlos Reyes',
    firstName: 'Carlos',
    middleName: 'Vicente',
    lastName: 'Reyes',
    username: 'carlos.reyes',
    dateOfBirth: '1988-11-03',
    gender: 'Male',
    email: 'carlos.reyes@balingasagschool.edu.ph',
    phone: '+63 945 332 1122',
    address: 'Brgy. Baliwagan, Balingasag, Misamis Oriental',
    membershipType: 'Faculty',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0003',
    joinDate: '2026-01-15',
    totalBorrows: 19
  },
  {
    id: 'mbr-4',
    memberId: 'BPL-2026-0004',
    fullName: 'Beatriz Alonzo',
    firstName: 'Beatriz',
    middleName: 'Mercado',
    lastName: 'Alonzo',
    username: 'beatriz.a',
    dateOfBirth: '1996-03-29',
    gender: 'Female',
    email: 'beatriz.a@gmail.com',
    phone: '+63 912 445 7890',
    address: 'Brgy. Linggangao, Balingasag, Misamis Oriental',
    membershipType: 'Community',
    status: 'active',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0004',
    joinDate: '2026-01-20',
    totalBorrows: 5
  },
  {
    id: 'mbr-5',
    userId: 'usr-5',
    memberId: 'BPL-2026-0005',
    fullName: 'David Deactivation Test',
    firstName: 'David',
    middleName: 'Perez',
    lastName: 'Deactivation Test',
    username: 'david.inactive',
    dateOfBirth: '2000-07-12',
    gender: 'Male',
    email: 'david.inactive@gmail.com',
    phone: '+63 933 111 2233',
    address: 'Brgy. Cogon, Balingasag, Misamis Oriental',
    membershipType: 'Student',
    status: 'inactive',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0005',
    joinDate: '2026-02-01',
    totalBorrows: 2
  },
  {
    id: 'mbr-6',
    userId: 'usr-6',
    memberId: 'BPL-2026-0006',
    fullName: 'Samantha Suspension Test',
    firstName: 'Samantha',
    middleName: 'Joy',
    lastName: 'Suspension Test',
    username: 'samantha.suspended',
    dateOfBirth: '1999-12-05',
    gender: 'Female',
    email: 'samantha.suspended@gmail.com',
    phone: '+63 922 444 5566',
    address: 'Brgy. Hermano, Balingasag, Misamis Oriental',
    membershipType: 'Community',
    status: 'suspended',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    qrCodeData: 'BPL-2026-0006',
    joinDate: '2026-02-10',
    totalBorrows: 0
  }
];

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'bk-1',
    isbn: '978-0132350884',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    subtitle: 'Principles, Patterns, and Practices for Professional Developers',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    edition: '1st Edition',
    language: 'English',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. This book is a must-read for any developer looking to write cleaner, more maintainable code.',
    pages: 464,
    category: 'Technology & Computing',
    subject: 'Software Engineering / Clean Architecture',
    keywords: ['programming', 'agile', 'refactoring', 'best practices'],
    classification: '005.133 MAR',
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop&q=80',
    copies: [
      {
        copyId: 'cp-101',
        accessionNumber: 'BPL-000101',
        barcode: 'BPL-000101',
        shelfLocation: 'Stack A-2, Tech Section',
        classification: '005.133 MAR',
        condition: 'Good',
        status: 'Borrowed',
        dateAdded: '2025-01-15'
      },
      {
        copyId: 'cp-102',
        accessionNumber: 'BPL-000102',
        barcode: 'BPL-000102',
        shelfLocation: 'Stack A-2, Tech Section',
        classification: '005.133 MAR',
        condition: 'New',
        status: 'Available',
        dateAdded: '2025-01-15'
      }
    ]
  },
  {
    id: 'bk-2',
    isbn: '978-0261102217',
    title: 'The Hobbit, or There and Back Again',
    subtitle: 'The Enchanting Prelude to The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    publisher: 'HarperCollins',
    publicationYear: 1937,
    edition: 'Illustrated Edition',
    language: 'English',
    description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life. But his contentment is interrupted when the wizard Gandalf and a company of thirteen dwarves arrive on his doorstep.',
    pages: 310,
    category: 'Literature & Fiction',
    subject: 'Fantasy Fiction / Epic Adventure',
    keywords: ['middle-earth', 'bilbo', 'dragon', 'classic fantasy'],
    classification: '823.912 TOL',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&auto=format&fit=crop&q=80',
    copies: [
      {
        copyId: 'cp-103',
        accessionNumber: 'BPL-000103',
        barcode: 'BPL-000103',
        shelfLocation: 'Stack F-1, Fiction',
        classification: '823.912 TOL',
        condition: 'Good',
        status: 'Borrowed',
        dateAdded: '2025-02-01'
      },
      {
        copyId: 'cp-104',
        accessionNumber: 'BPL-000104',
        barcode: 'BPL-000104',
        shelfLocation: 'Stack F-1, Fiction',
        classification: '823.912 TOL',
        condition: 'Good',
        status: 'Available',
        dateAdded: '2025-02-01'
      },
      {
        copyId: 'cp-105',
        accessionNumber: 'BPL-000105',
        barcode: 'BPL-000105',
        shelfLocation: 'Stack F-1, Fiction',
        classification: '823.912 TOL',
        condition: 'Fair',
        status: 'Reserved',
        dateAdded: '2025-02-01'
      }
    ]
  },
  {
    id: 'bk-3',
    isbn: '978-0062316097',
    title: 'Sapiens: A Brief History of Humankind',
    subtitle: 'From the Stone Age to the Silicon Age',
    author: 'Yuval Noah Harari',
    publisher: 'Harper',
    publicationYear: 2015,
    edition: 'First Edition',
    language: 'English',
    description: 'One hundred thousand years ago, at least six human species inhabited the earth. Today there is just one. Us. Homo sapiens. How did our species succeed in the battle for dominance?',
    pages: 443,
    category: 'History & Anthropology',
    subject: 'Human Evolution / World History',
    keywords: ['anthropology', 'evolution', 'civilization', 'sociology'],
    classification: '909 HAR',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop&q=80',
    copies: [
      {
        copyId: 'cp-106',
        accessionNumber: 'BPL-000106',
        barcode: 'BPL-000106',
        shelfLocation: 'Stack H-3, General History',
        classification: '909 HAR',
        condition: 'New',
        status: 'Available',
        dateAdded: '2025-02-10'
      }
    ]
  },
  {
    id: 'bk-4',
    isbn: '978-0743273565',
    title: 'The Great Gatsby',
    subtitle: 'The Definitive F. Scott Fitzgerald Classic',
    author: 'F. Scott Fitzgerald',
    publisher: 'Scribner',
    publicationYear: 1925,
    edition: 'Scribner Classics',
    language: 'English',
    description: 'The story of the mysteriously wealthy Jay Gatsby and his unrequited love for Daisy Buchanan is an acclaimed portrait of the Jazz Age.',
    pages: 180,
    category: 'Literature & Fiction',
    subject: 'American Literature / Jazz Age',
    keywords: ['classic', 'jazz age', 'roaring twenties', 'american dream'],
    classification: '813.52 FIT',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop&q=80',
    copies: [
      {
        copyId: 'cp-107',
        accessionNumber: 'BPL-000107',
        barcode: 'BPL-000107',
        shelfLocation: 'Stack F-2, Classics',
        classification: '813.52 FIT',
        condition: 'Good',
        status: 'Available',
        dateAdded: '2025-02-14'
      }
    ]
  },
  {
    id: 'bk-5',
    isbn: '978-0131103627',
    title: 'The C Programming Language',
    subtitle: 'ANSI C Edition',
    author: 'Brian W. Kernighan & Dennis M. Ritchie',
    publisher: 'Prentice Hall',
    publicationYear: 1988,
    edition: '2nd Edition',
    language: 'English',
    description: 'The definitive guide to ANSI standard C by the original developers of the language. Covers systems programming, pointers, structures, and memory management.',
    pages: 272,
    category: 'Technology & Computing',
    subject: 'Systems Programming / Computer Science',
    keywords: ['c language', 'unix', 'low level', 'algorithms'],
    classification: '005.133 KER',
    coverImage: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=400&auto=format&fit=crop&q=80',
    copies: [
      {
        copyId: 'cp-108',
        accessionNumber: 'BPL-000108',
        barcode: 'BPL-000108',
        shelfLocation: 'Stack A-1, Tech Reference',
        classification: '005.133 KER',
        condition: 'Fair',
        status: 'Available',
        dateAdded: '2025-01-20'
      }
    ]
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    memberId: 'MBR-000001',
    memberName: 'Juan Dela Cruz',
    membershipType: 'Student',
    date: '2026-08-31',
    timeIn: '03:15 PM',
    timeOut: undefined,
    status: 'Inside',
    notes: 'Thesis research and study'
  },
  {
    id: 'att-2',
    memberId: 'MBR-000002',
    memberName: 'Maria Clara Santos',
    membershipType: 'Researcher',
    date: '2026-08-31',
    timeIn: '01:30 PM',
    timeOut: undefined,
    status: 'Inside',
    notes: 'Reference section use'
  },
  {
    id: 'att-3',
    memberId: 'MBR-000003',
    memberName: 'Carlos Reyes',
    membershipType: 'Faculty',
    date: '2026-08-31',
    timeIn: '09:15 AM',
    timeOut: '11:45 AM',
    duration: '2h 30m',
    status: 'Completed',
    notes: 'Curriculum reference review'
  },
  {
    id: 'att-4',
    memberId: 'MBR-000004',
    memberName: 'Beatriz Alonzo',
    membershipType: 'Community',
    date: '2026-08-31',
    timeIn: '10:00 AM',
    timeOut: '12:15 PM',
    duration: '2h 15m',
    status: 'Completed'
  },
  {
    id: 'att-5',
    memberId: 'MBR-000001',
    memberName: 'Juan Dela Cruz',
    membershipType: 'Student',
    date: '2026-08-30',
    timeIn: '02:00 PM',
    timeOut: '05:30 PM',
    duration: '3h 30m',
    status: 'Completed'
  }
];

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

export const INITIAL_SERVICE_RECORDS: ServiceRecord[] = [
  {
    id: 'rec-1',
    serviceId: 'srv-1',
    serviceName: 'Research Assistance',
    memberId: 'MBR-000001',
    memberName: 'Juan Dela Cruz',
    date: '2026-08-31',
    time: '03:30 PM',
    notes: 'Assisted with Philippine Municipal governance references for undergraduate thesis.',
    recordedBy: 'Roberto Gomez (Admin)'
  },
  {
    id: 'rec-2',
    serviceId: 'srv-2',
    serviceName: 'Computer & Internet Station',
    memberId: 'MBR-000002',
    memberName: 'Maria Clara Santos',
    date: '2026-08-31',
    time: '01:45 PM',
    notes: 'Assigned PC Station #04 for online research database access.',
    recordedBy: 'Roberto Gomez (Admin)'
  },
  {
    id: 'rec-3',
    serviceId: 'srv-4',
    serviceName: 'Printing & Photocopying',
    memberId: 'MBR-000004',
    memberName: 'Beatriz Alonzo',
    date: '2026-08-31',
    time: '11:20 AM',
    notes: '15 pages of educational research handouts.',
    recordedBy: 'Roberto Gomez (Admin)'
  }
];

export const INITIAL_TRANSACTIONS: CirculationTransaction[] = [
  {
    id: 'tx-1',
    bookId: 'bk-1',
    bookTitle: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    bookAuthor: 'Robert C. Martin',
    accessionNumber: 'BPL-000101',
    barcode: 'BPL-000101',
    memberId: 'MBR-000001',
    memberName: 'Juan Dela Cruz',
    borrowDate: '2026-08-25',
    dueDate: '2026-09-08',
    status: 'Active',
    renewalCount: 0,
    processedBy: 'Roberto Gomez (Admin)'
  },
  {
    id: 'tx-2',
    bookId: 'bk-2',
    bookTitle: 'The Hobbit, or There and Back Again',
    bookAuthor: 'J.R.R. Tolkien',
    accessionNumber: 'BPL-000103',
    barcode: 'BPL-000103',
    memberId: 'MBR-000003',
    memberName: 'Carlos Reyes',
    borrowDate: '2026-08-10',
    dueDate: '2026-08-24',
    status: 'Overdue',
    renewalCount: 0,
    processedBy: 'Roberto Gomez (Admin)'
  },
  {
    id: 'tx-3',
    bookId: 'bk-4',
    bookTitle: 'The Great Gatsby',
    bookAuthor: 'F. Scott Fitzgerald',
    accessionNumber: 'BPL-000107',
    barcode: 'BPL-000107',
    memberId: 'MBR-000002',
    memberName: 'Maria Clara Santos',
    borrowDate: '2026-08-15',
    dueDate: '2026-08-29',
    returnDate: '2026-08-28',
    status: 'Returned',
    renewalCount: 0,
    processedBy: 'Roberto Gomez (Admin)'
  }
];

export const INITIAL_RESERVATIONS: BookReservation[] = [
  {
    id: 'res-1',
    bookId: 'bk-2',
    bookTitle: 'The Hobbit, or There and Back Again',
    memberId: 'MBR-000001',
    memberName: 'Juan Dela Cruz',
    reservationDate: '2026-08-28',
    expiryDate: '2026-09-04',
    status: 'Waiting',
    queuePosition: 1
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Book Due Reminder',
    message: 'Your borrowed book "Clean Code" is due in 8 days (Sep 8, 2026).',
    type: 'info',
    timestamp: 'Today at 08:00 AM',
    read: false,
    targetRole: 'member',
    targetMemberId: 'MBR-000001'
  },
  {
    id: 'notif-2',
    title: 'Overdue Loan Notice',
    message: 'Book "The Hobbit" borrowed by Carlos Reyes (MBR-000003) is past due date (Aug 24, 2026).',
    type: 'alert',
    timestamp: 'Today at 09:00 AM',
    read: false,
    targetRole: 'admin'
  },
  {
    id: 'notif-3',
    title: 'Time-In Recorded',
    message: 'Welcome to Balingasag Public Library. Time-in registered at 3:15 PM.',
    type: 'success',
    timestamp: 'Today at 03:15 PM',
    read: true,
    targetRole: 'member',
    targetMemberId: 'MBR-000001'
  },
  {
    id: 'notif-4',
    title: 'System Health Check',
    message: 'LLM Studio ISBN Cataloging Integration is online and ready.',
    type: 'info',
    timestamp: 'Yesterday at 06:00 PM',
    read: true,
    targetRole: 'super_admin'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'RECORD_ATTENDANCE_TIME_IN',
    category: 'Attendance',
    details: 'Recorded Time-In for member Juan Dela Cruz (MBR-000001) via QR scan.',
    performedBy: 'Roberto Gomez (Admin)',
    timestamp: '2026-08-31 15:15:22',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'aud-2',
    action: 'SERVICE_RECORD_CREATED',
    category: 'Circulation',
    details: 'Recorded Research Assistance service for member MBR-000001.',
    performedBy: 'Roberto Gomez (Admin)',
    timestamp: '2026-08-31 15:30:10',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'aud-3',
    action: 'BOOK_CATALOGED_VIA_LLM',
    category: 'Books',
    details: 'Cataloged new publication "Clean Code" (ISBN 978-0132350884) with 2 physical copies.',
    performedBy: 'Eleanor Vance (Super Admin)',
    timestamp: '2026-08-25 10:14:05',
    ipAddress: '192.168.1.100'
  },
  {
    id: 'aud-4',
    action: 'MEMBER_REGISTERED',
    category: 'Members',
    details: 'Registered member Beatriz Alonzo (MBR-000004) and generated QR Library ID.',
    performedBy: 'Roberto Gomez (Admin)',
    timestamp: '2026-08-20 14:00:18',
    ipAddress: '192.168.1.104'
  }
];

export const ISBN_KNOWLEDGE_BASE: Record<string, Partial<Book>> = {
  '978-0132350884': {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    subtitle: 'Principles, Patterns, and Practices for Professional Developers',
    author: 'Robert C. Martin',
    publisher: 'Prentice Hall',
    publicationYear: 2008,
    edition: '1st Edition',
    language: 'English',
    description: 'Even bad code can function. But if code isn’t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
    pages: 464,
    category: 'Technology & Computing',
    subject: 'Software Engineering / Clean Code',
    keywords: ['software', 'architecture', 'refactoring', 'craftsmanship'],
    classification: '005.133 MAR'
  },
  '978-0201616224': {
    title: 'The Pragmatic Programmer: From Journeyman to Master',
    subtitle: 'Your Journey To Mastery',
    author: 'Andrew Hunt & David Thomas',
    publisher: 'Addison-Wesley Professional',
    publicationYear: 1999,
    edition: '20th Anniversary Edition',
    language: 'English',
    description: 'Straight from the programming trenches, The Pragmatic Programmer cuts through the increasing specialization and technicalities of modern software development to examine the core process.',
    pages: 352,
    category: 'Technology & Computing',
    subject: 'Computer Programming & Systems',
    keywords: ['pragmatic', 'software development', 'career', 'code'],
    classification: '005.1 HUN'
  },
  '978-0134685991': {
    title: 'Effective Java',
    subtitle: 'Best practices for the Java platform',
    author: 'Joshua Bloch',
    publisher: 'Addison-Wesley',
    publicationYear: 2018,
    edition: '3rd Edition',
    language: 'English',
    description: 'An indispensable guide to Java platform best practices, updated for Java 7, 8, and 9.',
    pages: 416,
    category: 'Technology & Computing',
    subject: 'Java Programming',
    keywords: ['java', 'object-oriented', 'design patterns', 'concurrency'],
    classification: '005.133 BLO'
  },
  '978-0261102217': {
    title: 'The Hobbit, or There and Back Again',
    subtitle: 'The Enchanting Prelude to The Lord of the Rings',
    author: 'J.R.R. Tolkien',
    publisher: 'HarperCollins',
    publicationYear: 1937,
    edition: 'Illustrated Edition',
    language: 'English',
    description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life. But his contentment is interrupted when the wizard Gandalf and a company of thirteen dwarves arrive.',
    pages: 310,
    category: 'Literature & Fiction',
    subject: 'Epic Fantasy Fiction',
    keywords: ['middle-earth', 'fantasy', 'bilbo baggins', 'smaug'],
    classification: '823.912 TOL'
  }
};
