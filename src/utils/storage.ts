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

import {
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_BOOKS,
  INITIAL_ATTENDANCE,
  INITIAL_SERVICES,
  INITIAL_SERVICE_RECORDS,
  INITIAL_TRANSACTIONS,
  INITIAL_RESERVATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
  ISBN_KNOWLEDGE_BASE
} from '../data/mockData';

const STORAGE_KEYS = {
  USERS: 'bpl_users_v2',
  CURRENT_USER: 'bpl_current_user_v2',
  MEMBERS: 'bpl_members_v2',
  BOOKS: 'bpl_books_v2',
  ATTENDANCE: 'bpl_attendance_v2',
  SERVICES: 'bpl_services_v2',
  SERVICE_RECORDS: 'bpl_service_records_v2',
  TRANSACTIONS: 'bpl_transactions_v2',
  RESERVATIONS: 'bpl_reservations_v2',
  NOTIFICATIONS: 'bpl_notifications_v2',
  AUDIT_LOGS: 'bpl_audit_logs_v2'
};

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

export const StorageService = {
  // Current logged in user
  getCurrentUser(): User {
    const saved = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (saved) return saved;
    return INITIAL_USERS[0];
  },

  setCurrentUser(user: User): void {
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  },

  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
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
    return getStored<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
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
      ipAddress: '192.168.1.' + Math.floor(100 + Math.random() * 50)
    };
    this.saveAuditLogs([newLog, ...logs]);
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

  async lookupIsbnWithLlm(isbnClean: string): Promise<{ success: boolean; data?: Partial<Book>; message?: string }> {
    await new Promise((r) => setTimeout(r, 750));

    const normalized = isbnClean.replace(/[-\s]/g, '');
    
    for (const [key, val] of Object.entries(ISBN_KNOWLEDGE_BASE)) {
      if (key.replace(/[-\s]/g, '') === normalized) {
        return { success: true, data: { ...val, isbn: isbnClean } };
      }
    }

    if (normalized.length >= 10) {
      return {
        success: true,
        data: {
          isbn: isbnClean,
          title: `Academic Reference Treatise (ISBN ${isbnClean})`,
          subtitle: 'Comprehensive Scholarly & Educational Edition',
          author: 'Dr. Aurelius M. Valenzuela',
          publisher: 'Balingasag Academic Press',
          publicationYear: 2024,
          edition: '1st Revised Edition',
          language: 'English',
          description: 'A comprehensive academic publication structured by the LLM Studio cataloging assistant. Includes bibliographic citations, index, and classification keywords.',
          pages: 384,
          category: 'General Reference',
          subject: 'Academic & Reference Studies',
          keywords: ['reference', 'research', 'scholarly', 'balingasag'],
          classification: '025.4 VAL'
        }
      };
    }

    return {
      success: false,
      message: 'Invalid ISBN format. Please enter a valid 10 or 13-digit ISBN.'
    };
  }
};
