import type {
  Book,
  Member,
  CirculationTransaction,
  BookReservation,
  AttendanceRecord,
  AuditLog,
  NotificationItem,
  User,
  LibraryServiceItem,
  ServiceRecord,
  LibrarianPrivileges
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'bpl_auth_token';

/**
 * Auth Token Storage
 * The backend issues a Sanctum personal access token on login; every
 * subsequent request authenticates with it via the Authorization header.
 */
function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore in non-browser environments
  }
}

/**
 * Universal JSON Fetch Helper
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token missing/expired/revoked - clear it so the app returns to the login screen.
    setToken(null);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.message) {
        errorDetail = errData.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Books & Physical Copies
  async getBooks(): Promise<Book[]> {
    return request<Book[]>('/books');
  },

  async getBook(id: string): Promise<Book> {
    return request<Book>(`/books/${id}`);
  },

  async createBook(book: Partial<Book>): Promise<Book> {
    return request<Book>('/books', {
      method: 'POST',
      body: JSON.stringify(book)
    });
  },

  async updateBook(id: string, book: Partial<Book>): Promise<Book> {
    return request<Book>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book)
    });
  },

  async deleteBook(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/books/${id}`, {
      method: 'DELETE'
    });
  },

  // Members
  async getMembers(): Promise<Member[]> {
    return request<Member[]>('/members');
  },

  async getMemberByQr(code: string): Promise<Member> {
    return request<Member>(`/members/qr/${encodeURIComponent(code)}`);
  },

  async createMember(member: Partial<Member>): Promise<Member> {
    const res = await request<any>('/members', {
      method: 'POST',
      body: JSON.stringify(member)
    });
    return (res && res.member) ? res.member : res;
  },

  async updateMember(id: string, member: Partial<Member>): Promise<Member> {
    return request<Member>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member)
    });
  },

  async deleteMember(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE'
    });
  },

  async resetMemberPassword(id: string, password: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/members/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  },

  // Circulation Loans
  async getTransactions(): Promise<CirculationTransaction[]> {
    return request<CirculationTransaction[]>('/circulation/transactions');
  },

  async borrowBook(
    memberId: string,
    barcode: string,
    dueDate: string
  ): Promise<{ success: boolean; message: string; transaction?: CirculationTransaction }> {
    return request<{ success: boolean; message: string; transaction?: CirculationTransaction }>(
      '/circulation/borrow',
      {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, barcode, due_date: dueDate })
      }
    );
  },

  async returnBook(
    barcode: string
  ): Promise<{ success: boolean; message: string; transaction?: CirculationTransaction; fine?: number }> {
    return request<{ success: boolean; message: string; transaction?: CirculationTransaction; fine?: number }>(
      '/circulation/return',
      {
        method: 'POST',
        body: JSON.stringify({ barcode })
      }
    );
  },

  async renewBook(
    transactionId: string
  ): Promise<{ success: boolean; message: string; transaction?: CirculationTransaction }> {
    return request<{ success: boolean; message: string; transaction?: CirculationTransaction }>(
      '/circulation/renew',
      {
        method: 'POST',
        body: JSON.stringify({ transaction_id: transactionId })
      }
    );
  },

  // Online Borrow Requests
  async requestBorrow(
    memberId: string,
    bookId: string
  ): Promise<{ success: boolean; message: string; transaction?: CirculationTransaction }> {
    return request<{ success: boolean; message: string; transaction?: CirculationTransaction }>(
      '/circulation/requests/borrow',
      {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, book_id: bookId })
      }
    );
  },

  async approveBorrow(transactionId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/circulation/requests/${transactionId}/approve`, {
      method: 'POST'
    });
  },

  async rejectBorrow(transactionId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/circulation/requests/${transactionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  // Reservations
  async getReservations(): Promise<BookReservation[]> {
    return request<BookReservation[]>('/reservations');
  },

  async createReservation(
    memberId: string,
    bookId: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; reservation?: BookReservation }> {
    return request<{ success: boolean; message: string; reservation?: BookReservation }>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, book_id: bookId, notes })
    });
  },

  async approveReservation(reservationId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/reservations/${reservationId}/approve`, {
      method: 'POST'
    });
  },

  async cancelReservation(reservationId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/reservations/${reservationId}/cancel`, {
      method: 'POST'
    });
  },

  // Attendance
  async getAttendance(): Promise<AttendanceRecord[]> {
    return request<AttendanceRecord[]>('/attendance');
  },

  async checkInAttendance(memberId: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId })
    });
  },

  async checkOutAttendance(attendanceId: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>(`/attendance/${attendanceId}/check-out`, {
      method: 'POST'
    });
  },

  async updateAttendance(id: string, record: Partial<AttendanceRecord>, reason: string): Promise<AttendanceRecord> {
    return request<AttendanceRecord>(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        time_in: record.timeIn,
        time_out: record.timeOut,
        status: record.status,
        notes: record.notes,
        reason
      })
    });
  },

  // Audit Logs & Notifications
  async getAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/audit-logs');
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>('/notifications');
  },

  async markNotificationRead(id: string): Promise<NotificationItem> {
    return request<NotificationItem>(`/notifications/${id}/read`, { method: 'POST' });
  },

  async markAllNotificationsRead(memberId?: string): Promise<{ message: string }> {
    return request<{ message: string }>('/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId })
    });
  },

  // Authentication
  hasToken(): boolean {
    return Boolean(getToken());
  },

  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const result = await request<{ user: User; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    setToken(result.token);
    return result;
  },

  async logout(): Promise<void> {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  async me(): Promise<User> {
    return request<User>('/me');
  },

  // Administrative Accounts (super_admin / admin governance)
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async createUser(
    user: Partial<User> & { role: 'super_admin' | 'admin' }
  ): Promise<{ user: User; temporary_password: string }> {
    return request<{ user: User; temporary_password: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  },

  async updatePrivileges(id: string, privileges: LibrarianPrivileges): Promise<User> {
    return request<User>(`/users/${id}/privileges`, {
      method: 'POST',
      body: JSON.stringify({ privileges })
    });
  },

  async toggleUserStatus(id: string): Promise<User> {
    return request<User>(`/users/${id}/toggle-status`, { method: 'POST' });
  },

  async resetUserPassword(id: string): Promise<{ message: string; temporary_password: string }> {
    return request<{ message: string; temporary_password: string }>(`/users/${id}/reset-password`, {
      method: 'POST'
    });
  },

  // Library Services
  async getServices(): Promise<LibraryServiceItem[]> {
    return request<LibraryServiceItem[]>('/services');
  },

  async getServiceRecords(): Promise<ServiceRecord[]> {
    return request<ServiceRecord[]>('/service-records');
  },

  async recordServiceUsage(serviceId: string, memberId: string, notes?: string): Promise<ServiceRecord> {
    return request<ServiceRecord>('/service-records', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId, member_id: memberId, notes })
    });
  }
};
