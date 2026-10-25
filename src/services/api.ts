import type {
  Book,
  Member,
  CirculationTransaction,
  BookReservation,
  AttendanceRecord,
  AuditLog,
  NotificationItem,
  User,
  UserRole,
  LibraryServiceItem,
  ServiceRecord,
  LibrarianPrivileges
} from '../types';
import type {
  ComparisonAnalyticsResponse,
  TrendsAnalyticsResponse,
  AnalyticsQueryParams
} from '../types/analytics';

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

export type ApiErrorType =
  | 'connection_error'
  | 'database_error'
  | 'timeout_error'
  | 'server_error'
  | 'auth_error'
  | 'unexpected_error';

export class ApiError extends Error {
  status?: number;
  errorType: ApiErrorType;
  rawMessage?: string;

  constructor(message: string, errorType: ApiErrorType, status?: number, rawMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.errorType = errorType;
    this.status = status;
    this.rawMessage = rawMessage;
  }
}

/**
 * Universal JSON Fetch Helper
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | undefined;
    if (errorObj?.name === 'AbortError' || options.signal?.aborted) {
      throw new ApiError(
        'The server took too long to respond. Please try again.',
        'timeout_error',
        408
      );
    }
    throw new ApiError(
      'Unable to connect to the library server. Please check your internet connection and try again.',
      'connection_error',
      0,
      errorObj?.message
    );
  }

  if (response.status === 401) {
    // Token missing/expired/revoked - clear it so the app returns to the login screen.
    setToken(null);
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}: ${response.statusText || 'Error'}`;
    let errorType: ApiErrorType = 'unexpected_error';

    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errData = await response.json();
        if (errData.error_type === 'database_error') {
          errorType = 'database_error';
          errorDetail = errData.message || 'The library database is temporarily unavailable. Please try again later.';
        } else if (errData.error_type === 'server_error') {
          errorType = 'server_error';
          errorDetail = errData.message || 'The library system is temporarily unavailable. Please try again later.';
        } else if (response.status === 401 || response.status === 403) {
          errorType = 'auth_error';
          errorDetail = errData.message || 'Invalid credentials. Please verify your email / username and password.';
        } else if (response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504) {
          errorType = response.status === 502 || response.status === 504 ? 'connection_error' : 'server_error';
          errorDetail = errData.message || (errorType === 'connection_error'
            ? 'Unable to connect to the library server. Please check your internet connection and try again.'
            : 'The library system is temporarily unavailable. Please try again later.');
        } else if (errData.message) {
          errorDetail = errData.message;
        } else if (errData.error) {
          errorDetail = errData.error;
        }
      } else {
        const rawText = await response.text();
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          errorType = 'connection_error';
          errorDetail = 'Unable to connect to the library server. Please check your internet connection and try again.';
        } else if (response.status >= 500) {
          errorType = 'server_error';
          errorDetail = 'The library system is temporarily unavailable. Please try again later.';
        } else if (rawText && rawText.length < 200 && !rawText.trim().startsWith('<')) {
          errorDetail = rawText.trim();
        }
      }
    } catch {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        errorType = 'connection_error';
        errorDetail = 'Unable to connect to the library server. Please check your internet connection and try again.';
      } else if (response.status >= 500) {
        errorType = 'server_error';
        errorDetail = 'The library system is temporarily unavailable. Please try again later.';
      }
    }

    if (errorType === 'unexpected_error') {
      if (response.status === 408) errorType = 'timeout_error';
      else if (response.status === 401 || response.status === 403) errorType = 'auth_error';
      else if (response.status >= 500) errorType = 'server_error';
    }

    throw new ApiError(errorDetail, errorType, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError('Received an invalid non-JSON response from the server.', 'unexpected_error', response.status);
  }
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

  async validateBookImport(fileOrRows: File | any[]): Promise<any> {
    if (fileOrRows instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrRows);
      return request<any>('/books/import/validate', {
        method: 'POST',
        body: formData
      });
    } else {
      return request<any>('/books/import/validate', {
        method: 'POST',
        body: JSON.stringify({ rows: fileOrRows })
      });
    }
  },

  async bulkImportBooks(
    fileOrRows: File | any[],
    mode: 'all_or_nothing' | 'skip_errors' = 'all_or_nothing'
  ): Promise<any> {
    if (fileOrRows instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrRows);
      formData.append('mode', mode);
      return request<any>('/books/import', {
        method: 'POST',
        body: formData
      });
    } else {
      return request<any>('/books/import', {
        method: 'POST',
        body: JSON.stringify({ rows: fileOrRows, mode })
      });
    }
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

  async validateMemberImport(fileOrRows: File | any[]): Promise<any> {
    if (fileOrRows instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrRows);
      return request<any>('/members/import/validate', {
        method: 'POST',
        body: formData
      });
    } else {
      return request<any>('/members/import/validate', {
        method: 'POST',
        body: JSON.stringify({ rows: fileOrRows })
      });
    }
  },

  async bulkImportMembers(
    fileOrRows: File | any[],
    mode: 'all_or_nothing' | 'skip_errors' = 'all_or_nothing'
  ): Promise<any> {
    if (fileOrRows instanceof File) {
      const formData = new FormData();
      formData.append('file', fileOrRows);
      formData.append('mode', mode);
      return request<any>('/members/import', {
        method: 'POST',
        body: formData
      });
    } else {
      return request<any>('/members/import', {
        method: 'POST',
        body: JSON.stringify({ rows: fileOrRows, mode })
      });
    }
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

  async borrowBooks(
    memberId: string,
    barcodes: string[],
    dueDate: string,
    processedBy?: string
  ): Promise<{ success: boolean; message: string; transaction?: CirculationTransaction; transactions?: CirculationTransaction[] }> {
    return request<{ success: boolean; message: string; transaction?: CirculationTransaction; transactions?: CirculationTransaction[] }>(
      '/circulation/borrow',
      {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, barcodes, due_date: dueDate, processed_by: processedBy })
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

  async login(identifier: string, password: string, timeoutMs = 10000): Promise<{ user: User; token: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await request<{ user: User; token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
        signal: controller.signal
      });
      setToken(result.token);
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/logout', { method: 'POST' });
    } finally {
      setToken(null);
    }
  },

  async me(): Promise<User> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    try {
      return await request<User>('/me', { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  },

  // Administrative Accounts (super_admin / admin governance)
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async createUser(
    user: Partial<User> & { role: UserRole }
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
  },

  // Public Library Statistics
  async getPublicStats(): Promise<{
    books_available: number;
    active_members: number;
    founding_year: number;
    years_serving: number;
  }> {
    return request('/public-stats');
  },

  // User Profile & Account Settings
  async updateProfile(data: { name: string; email: string; phone?: string; department?: string }): Promise<{ message: string; user: User }> {
    return request<{ message: string; user: User }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async changePassword(data: { current_password: string; new_password: string; new_password_confirmation: string }): Promise<{ message: string }> {
    return request<{ message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Library Analytics (Interactive Bar & Line Graphs)
  async getAnalyticsComparison(params: AnalyticsQueryParams = {}): Promise<ComparisonAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params.metric) query.set('metric', params.metric);
    if (params.period) query.set('period', params.period);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<ComparisonAnalyticsResponse>(`/analytics/comparison${qs}`);
  },

  async getAnalyticsTrends(params: AnalyticsQueryParams = {}): Promise<TrendsAnalyticsResponse> {
    const query = new URLSearchParams();
    if (params.metric) query.set('metric', params.metric);
    if (params.period) query.set('period', params.period);
    if (params.start_date) query.set('start_date', params.start_date);
    if (params.end_date) query.set('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<TrendsAnalyticsResponse>(`/analytics/trends${qs}`);
  }
};
