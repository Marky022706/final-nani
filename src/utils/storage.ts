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
  AuditLog,
  SystemSettings,
  MemberTierPolicy,
  DatabaseBackupRecord,
  StaffAccessAuditLog,
  LibrarianPrivileges
} from '../types';

import {
  INITIAL_MEMBERS,
  INITIAL_BOOKS,
  INITIAL_ATTENDANCE,
  INITIAL_SERVICES,
  INITIAL_SERVICE_RECORDS,
  INITIAL_TRANSACTIONS,
  INITIAL_RESERVATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS
} from '../data/mockData';

// Version 3: Clean operational state without mock records
const STORAGE_KEYS = {
  USERS: 'bpl_users_v3',
  CURRENT_USER: 'bpl_current_user_v3',
  MEMBERS: 'bpl_members_v3',
  BOOKS: 'bpl_books_v3',
  ATTENDANCE: 'bpl_attendance_v3',
  SERVICES: 'bpl_services_v3',
  SERVICE_RECORDS: 'bpl_service_records_v3',
  TRANSACTIONS: 'bpl_transactions_v3',
  RESERVATIONS: 'bpl_reservations_v3',
  NOTIFICATIONS: 'bpl_notifications_v3',
  AUDIT_LOGS: 'bpl_audit_logs_v3',
  SYSTEM_SETTINGS: 'bpl_system_settings_v3',
  DATABASE_BACKUPS: 'bpl_database_backups_v3',
  STAFF_ACCESS_LOGS: 'bpl_staff_access_logs_v3'
};

// Automatic cleanup of legacy mock data caches
try {
  const legacyPrefixes = ['bpl_users_v2', 'bpl_members_v2', 'bpl_books_v2', 'bpl_attendance_v2', 'bpl_transactions_v2', 'bpl_reservations_v2'];
  legacyPrefixes.forEach((k) => localStorage.removeItem(k));
} catch {
  // ignore in non-browser environments
}

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export const DEFAULT_MEMBER_TIER_POLICIES: MemberTierPolicy[] = [
  {
    id: 'tier-student',
    tierName: 'Student',
    maxLoanLimit: 3,
    loanPeriodDays: 7,
    maxReservations: 2,
    dailyFineRate: 5, // ₱5.00/day
    gracePeriodDays: 1,
    fineExempt: false,
    description: 'Enrolled elementary, high school, and college students'
  },
  {
    id: 'tier-faculty',
    tierName: 'Faculty',
    maxLoanLimit: 10,
    loanPeriodDays: 30,
    maxReservations: 5,
    dailyFineRate: 2, // ₱2.00/day
    gracePeriodDays: 3,
    fineExempt: false,
    description: 'Teachers, professors, academic researchers, and school staff'
  },
  {
    id: 'tier-community',
    tierName: 'Community',
    maxLoanLimit: 4,
    loanPeriodDays: 14,
    maxReservations: 3,
    dailyFineRate: 5, // ₱5.00/day
    gracePeriodDays: 1,
    fineExempt: false,
    description: 'General municipal residents and community members'
  },
  {
    id: 'tier-senior-pwd',
    tierName: 'Senior / PWD',
    maxLoanLimit: 5,
    loanPeriodDays: 21,
    maxReservations: 4,
    dailyFineRate: 0,
    gracePeriodDays: 5,
    fineExempt: true,
    description: 'Senior citizens and persons with disabilities (Full fine exemption)'
  },
  {
    id: 'tier-researcher',
    tierName: 'Researcher',
    maxLoanLimit: 8,
    loanPeriodDays: 21,
    maxReservations: 4,
    dailyFineRate: 5,
    gracePeriodDays: 2,
    fineExempt: false,
    description: 'Independent researchers and municipal project investigators'
  }
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  dailyFineRate: 5,
  gracePeriodDays: 1,
  maxFineCap: 300,
  standardLoanPeriodDays: 14,
  maxRenewals: 2,
  renewalPeriodDays: 7,
  tierPolicies: DEFAULT_MEMBER_TIER_POLICIES,
  isMaintenanceMode: false,
  maintenanceMessage: 'System maintenance is currently in progress. Catalog browsing and services will resume shortly.',
  llmEndpoint: 'http://localhost:1234/v1',
  llmModel: 'meta-llama-3-8b-instruct',
  libraryName: 'Balingasag Municipal Library',
  operatingHours: '8:00 AM - 5:00 PM (Monday - Friday)',
  contactEmail: 'library@balingasag.gov.ph',
  contactPhone: '(088) 333-2145'
};

export const DEFAULT_USERS: User[] = [
  {
    id: 'usr-superadmin',
    name: 'Eleanor Vance',
    email: 'superadmin@balingasag.gov.ph',
    role: 'super_admin',
    department: 'Municipal Information Office',
    phone: '+63 912 345 6789',
    status: 'active',
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'usr-admin-arquita',
    name: 'Ms. Arquita',
    email: 'admin.arquita@balingasag.gov.ph',
    role: 'admin',
    department: 'Head Librarian / Library Administration',
    phone: '+63 920 111 2233',
    status: 'active',
    createdAt: '2026-09-02T08:00:00Z',
    privileges: {
      circulationDesk: true,
      inventoryManagement: true,
      memberManagement: true,
      servicesManagement: true,
      reportsExport: true,
      auditView: true
    }
  },
  {
    id: 'usr-admin-roberto',
    name: 'Roberto Gomez',
    email: 'admin.roberto@balingasag.gov.ph',
    role: 'admin',
    department: 'Library Operations',
    phone: '+63 923 456 7890',
    status: 'active',
    createdAt: '2026-09-03T08:00:00Z'
  },
  {
    id: 'usr-volunteer',
    name: 'Balong Long',
    email: 'admin1@balingasag.gov.ph',
    role: 'volunteer',
    department: 'Volunteer Desk Relief Operations',
    phone: '+63 930 444 5566',
    status: 'active',
    createdAt: '2026-09-10T08:00:00Z',
    privileges: {
      circulationDesk: true,
      inventoryManagement: false,
      memberManagement: true,
      servicesManagement: true,
      reportsExport: false,
      auditView: false
    }
  }
];

export const StorageService = {
  // Current logged in user (cached from the last authenticated /api/me response)
  getCurrentUser(): User | null {
    const user = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (user && (user.id === 'usr-volunteer' || user.email === 'volunteer@balingasag.gov.ph' || user.role === 'volunteer')) {
      if (user.email === 'volunteer@balingasag.gov.ph' || user.name === 'Volunteer Staff') {
        const updatedUser = { ...user, name: 'Balong Long', email: 'admin1@balingasag.gov.ph' };
        setStored(STORAGE_KEYS.CURRENT_USER, updatedUser);
        return updatedUser;
      }
    }
    return user;
  },

  setCurrentUser(user: User): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  },

  clearCurrentUser(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      // ignore in non-browser environments
    }
  },

  // Administrative accounts cache (real accounts are sourced from the backend)
  getUsers(): User[] {
    const users = getStored<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
    // Ensure volunteer record has updated name and email
    let modified = false;
    const migrated = users.map((u) => {
      if (u.id === 'usr-volunteer' || u.role === 'volunteer') {
        if (u.name === 'Volunteer Staff' || u.email === 'volunteer@balingasag.gov.ph') {
          modified = true;
          return { ...u, name: 'Balong Long', email: 'admin1@balingasag.gov.ph' };
        }
      }
      return u;
    });
    if (modified) {
      setStored(STORAGE_KEYS.USERS, migrated);
      return migrated;
    }
    return users;
  },

  saveUsers(users: User[]): void {
    setStored(STORAGE_KEYS.USERS, users);
  },

  getMembers(): Member[] {
    return getStored<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS);
  },

  saveMembers(members: Member[]): void {
    setStored(STORAGE_KEYS.MEMBERS, members);
  },

  getBooks(): Book[] {
    return getStored<Book[]>(STORAGE_KEYS.BOOKS, INITIAL_BOOKS);
  },

  saveBooks(books: Book[]): void {
    setStored(STORAGE_KEYS.BOOKS, books);
  },

  getAttendance(): AttendanceRecord[] {
    return getStored<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },

  saveAttendance(records: AttendanceRecord[]): void {
    setStored(STORAGE_KEYS.ATTENDANCE, records);
  },

  getServices(): LibraryServiceItem[] {
    return getStored<LibraryServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
  },

  getServiceRecords(): ServiceRecord[] {
    return getStored<ServiceRecord[]>(STORAGE_KEYS.SERVICE_RECORDS, INITIAL_SERVICE_RECORDS);
  },

  saveServiceRecords(records: ServiceRecord[]): void {
    setStored(STORAGE_KEYS.SERVICE_RECORDS, records);
  },

  getTransactions(): CirculationTransaction[] {
    return getStored<CirculationTransaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  },

  saveTransactions(transactions: CirculationTransaction[]): void {
    setStored(STORAGE_KEYS.TRANSACTIONS, transactions);
  },

  getReservations(): BookReservation[] {
    return getStored<BookReservation[]>(STORAGE_KEYS.RESERVATIONS, INITIAL_RESERVATIONS);
  },

  saveReservations(reservations: BookReservation[]): void {
    setStored(STORAGE_KEYS.RESERVATIONS, reservations);
  },

  getNotifications(): NotificationItem[] {
    const list = getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!list || list.length === 0) {
      setStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
      return INITIAL_NOTIFICATIONS;
    }
    return list;
  },

  saveNotifications(notifications: NotificationItem[]): void {
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifications);
  },

  getAuditLogs(): AuditLog[] {
    return getStored<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  },

  saveAuditLogs(logs: AuditLog[]): void {
    setStored(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  addAuditLog(action: string, category: AuditLog['category'], details: string, performedBy: string): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: 'aud-' + Date.now(),
      action,
      category,
      details,
      performedBy,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ipAddress: '127.0.0.1'
    };
    this.saveAuditLogs([newLog, ...logs]);
  },

  // ─── SUPERADMIN: SYSTEM CONFIGURATION ───
  getSystemSettings(): SystemSettings {
    const stored = getStored<SystemSettings | null>(STORAGE_KEYS.SYSTEM_SETTINGS, null);
    if (!stored) {
      return DEFAULT_SYSTEM_SETTINGS;
    }
    // Ensure all tier policies exist
    if (!stored.tierPolicies || stored.tierPolicies.length === 0) {
      return { ...stored, tierPolicies: DEFAULT_MEMBER_TIER_POLICIES };
    }
    return stored;
  },

  saveSystemSettings(settings: SystemSettings): void {
    setStored(STORAGE_KEYS.SYSTEM_SETTINGS, settings);
  },

  // ─── SUPERADMIN: DATA & INFRASTRUCTURE MANAGEMENT ───
  getBackups(): DatabaseBackupRecord[] {
    return getStored<DatabaseBackupRecord[]>(STORAGE_KEYS.DATABASE_BACKUPS, [
      {
        id: 'bk-init-1',
        filename: 'balingasag_db_backup_2026-08-30.json',
        timestamp: '2026-08-30 23:00:00',
        sizeBytes: 245760,
        recordCounts: {
          books: 12,
          members: 8,
          transactions: 6,
          attendance: 14,
          users: 3,
          auditLogs: 18
        },
        status: 'Success',
        notes: 'Pre-migration full system snapshot'
      }
    ]);
  },

  saveBackups(backups: DatabaseBackupRecord[]): void {
    setStored(STORAGE_KEYS.DATABASE_BACKUPS, backups);
  },

  createBackup(performedBy: string = 'Superadmin'): { record: DatabaseBackupRecord; jsonData: string } {
    const books = this.getBooks();
    const members = this.getMembers();
    const transactions = this.getTransactions();
    const attendance = this.getAttendance();
    const users = this.getUsers();
    const auditLogs = this.getAuditLogs();
    const services = this.getServices();
    const serviceRecords = this.getServiceRecords();
    const settings = this.getSystemSettings();

    const snapshotPayload = {
      metadata: {
        system: 'Balingasag Municipal Library Management System',
        version: '3.0.0',
        generatedAt: new Date().toISOString(),
        generatedBy: performedBy,
        environment: 'Municipal Production'
      },
      data: {
        books,
        members,
        transactions,
        attendance,
        users,
        auditLogs,
        services,
        serviceRecords,
        settings
      }
    };

    const jsonData = JSON.stringify(snapshotPayload, null, 2);
    const sizeBytes = new Blob([jsonData]).size;
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `balingasag_library_backup_${dateStamp}.json`;

    const record: DatabaseBackupRecord = {
      id: `bk-${Date.now()}`,
      filename,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sizeBytes,
      recordCounts: {
        books: books.length,
        members: members.length,
        transactions: transactions.length,
        attendance: attendance.length,
        users: users.length,
        auditLogs: auditLogs.length
      },
      status: 'Success',
      notes: `Manual snapshot triggered by ${performedBy}`
    };

    const currentBackups = this.getBackups();
    this.saveBackups([record, ...currentBackups]);
    this.addAuditLog('DATABASE_BACKUP_INITIATED', 'System', `Backup snapshot ${filename} created (${(sizeBytes / 1024).toFixed(1)} KB)`, performedBy);

    return { record, jsonData };
  },

  clearAuditLogs(scope: 'all' | 'older_30' | 'older_90', performedBy: string = 'Superadmin'): number {
    const logs = this.getAuditLogs();
    let retainedLogs: AuditLog[] = [];
    const now = Date.now();

    if (scope === 'older_30') {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      retainedLogs = logs.filter((l) => now - new Date(l.timestamp).getTime() < thirtyDaysMs);
    } else if (scope === 'older_90') {
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
      retainedLogs = logs.filter((l) => now - new Date(l.timestamp).getTime() < ninetyDaysMs);
    } else {
      retainedLogs = [];
    }

    const clearedCount = logs.length - retainedLogs.length;
    this.saveAuditLogs(retainedLogs);
    this.addAuditLog(
      'SYSTEM_LOGS_CLEARED',
      'System',
      `Purged ${clearedCount} audit log records (Scope: ${scope.replace('_', ' ')})`,
      performedBy
    );
    return clearedCount;
  },

  // ─── SUPERADMIN: USER & ACCESS MANAGEMENT ───
  getStaffAccessLogs(): StaffAccessAuditLog[] {
    return getStored<StaffAccessAuditLog[]>(STORAGE_KEYS.STAFF_ACCESS_LOGS, [
      {
        id: 'sal-1',
        timestamp: '2026-08-31 08:00:15',
        userId: 'usr-superadmin',
        userName: 'Municipal Super Admin',
        role: 'super_admin',
        event: 'LOGIN_SUCCESS',
        details: 'Superadmin authenticated via secure session gate',
        ipAddress: '192.168.1.10'
      },
      {
        id: 'sal-2',
        timestamp: '2026-08-31 08:15:22',
        userId: 'usr-admin-1',
        userName: 'Chief Librarian',
        role: 'admin',
        event: 'LOGIN_SUCCESS',
        details: 'Staff member authenticated into circulation terminal',
        ipAddress: '192.168.1.15'
      },
      {
        id: 'sal-3',
        timestamp: '2026-08-31 09:30:45',
        userId: 'usr-admin-2',
        userName: 'Assistant Librarian',
        role: 'admin',
        event: 'PRIVILEGE_CHANGED',
        details: 'Librarian privileges updated: Granted Circulation Desk & Inventory access',
        ipAddress: '192.168.1.18'
      }
    ]);
  },

  saveStaffAccessLogs(logs: StaffAccessAuditLog[]): void {
    setStored(STORAGE_KEYS.STAFF_ACCESS_LOGS, logs);
  },

  addStaffAccessLog(entry: Omit<StaffAccessAuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getStaffAccessLogs();
    const newEntry: StaffAccessAuditLog = {
      ...entry,
      id: `sal-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.saveStaffAccessLogs([newEntry, ...logs]);
  },

  updateLibrarianPrivileges(userId: string, privileges: LibrarianPrivileges, performedBy: string): void {
    const users = this.getUsers();
    const targetUser = users.find((u) => u.id === userId);
    const updatedUsers = users.map((u) => {
      if (u.id === userId || (targetUser && u.email && u.email.toLowerCase() === targetUser.email.toLowerCase())) {
        return { ...u, privileges };
      }
      return u;
    });
    this.saveUsers(updatedUsers);

    const currentUser = this.getCurrentUser();
    if (currentUser && (currentUser.id === userId || (targetUser && currentUser.email?.toLowerCase() === targetUser.email.toLowerCase()))) {
      this.setCurrentUser({ ...currentUser, privileges });
    }

    this.addStaffAccessLog({
      userId,
      userName: targetUser?.name || 'Staff User',
      role: targetUser?.role || 'admin',
      event: 'PRIVILEGE_CHANGED',
      details: `Operational privileges updated by ${performedBy}`,
      ipAddress: '127.0.0.1'
    });
    this.addAuditLog('LIBRARIAN_PRIVILEGES_UPDATED', 'Admin', `Privileges updated for ${targetUser?.name || userId}`, performedBy);
  },

  resetToDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.SERVICE_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  },

  /**
   * Real Book ISBN Lookup using Open Library and Google Books API
   */
  async lookupIsbnWithLlm(isbnClean: string): Promise<{ success: boolean; data?: Partial<Book>; message?: string }> {
    const normalized = isbnClean.replace(/[-\s]/g, '');
    if (normalized.length < 10) {
      return {
        success: false,
        message: 'Invalid ISBN format. Please enter a valid 10 or 13-digit ISBN.'
      };
    }

    try {
      // 1. Try Open Library API
      const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${normalized}&jscmd=data&format=json`;
      const res = await fetch(olUrl);
      if (res.ok) {
        const json = await res.json();
        const bookData = json[`ISBN:${normalized}`];
        if (bookData) {
          const authors = (bookData.authors || []).map((a: { name: string }) => a.name).join(', ') || 'Unknown Author';
          const publishers = (bookData.publishers || []).map((p: { name: string }) => p.name).join(', ');
          const subjects = (bookData.subjects || []).map((s: { name: string }) => s.name).slice(0, 6);
          const cover = bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small;
          const openLibraryDesc = typeof bookData.description === 'string'
            ? bookData.description
            : (bookData.description?.value || bookData.notes || '');

          return {
            success: true,
            data: {
              isbn: isbnClean,
              title: bookData.title || '',
              subtitle: bookData.subtitle || '',
              author: authors,
              publisher: publishers,
              publicationYear: bookData.publish_date ? parseInt(bookData.publish_date.match(/\d{4}/)?.[0] || '2024', 10) : new Date().getFullYear(),
              pages: bookData.number_of_pages || 0,
              description: openLibraryDesc,
              category: subjects[0] || 'General Reference',
              subject: subjects.slice(0, 3).join(' / ') || 'General',
              keywords: subjects,
              coverImage: cover
            }
          };
        }
      }

      // 2. Try Google Books API fallback
      const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalized}`;
      const gbRes = await fetch(gbUrl);
      if (gbRes.ok) {
        const gbJson = await gbRes.json();
        if (gbJson.totalItems > 0 && gbJson.items?.[0]?.volumeInfo) {
          const vi = gbJson.items[0].volumeInfo;
          return {
            success: true,
            data: {
              isbn: isbnClean,
              title: vi.title || '',
              subtitle: vi.subtitle || '',
              author: (vi.authors || []).join(', ') || 'Unknown Author',
              publisher: vi.publisher || '',
              publicationYear: vi.publishedDate ? parseInt(vi.publishedDate.substring(0, 4), 10) : new Date().getFullYear(),
              pages: vi.pageCount || 0,
              description: vi.description || '',
              category: vi.categories?.[0] || 'General',
              subject: (vi.categories || []).join(' / ') || 'General',
              keywords: vi.categories || [],
              coverImage: vi.imageLinks?.thumbnail?.replace('http:', 'https:')
            }
          };
        }
      }
    } catch (err) {
      console.warn('ISBN lookup service issue:', err);
    }

    return {
      success: false,
      message: 'Book not found in public database. Please fill in details manually.'
    };
  }
};
