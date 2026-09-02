import type {
  Book,
  Member,
  CirculationTransaction,
  BookReservation,
  AttendanceRecord,
  AuditLog,
  NotificationItem
} from '../types';

const API_BASE = '/api';

/**
 * Universal JSON Fetch Helper
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

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
    return request<Member>('/members', {
      method: 'POST',
      body: JSON.stringify(member)
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

  // Audit Logs & Notifications
  async getAuditLogs(): Promise<AuditLog[]> {
    return request<AuditLog[]>('/audit-logs');
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return request<NotificationItem[]>('/notifications');
  }
};
