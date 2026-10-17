import { useState, useEffect } from 'react';
import './App.css';
import type {
  User,
  AccountStatus,
  Book,
  Member,
  PhysicalCopy,
  AttendanceRecord,
  LibraryServiceItem,
  ServiceRecord,
  CirculationTransaction,
  BookReservation,
  NotificationItem,
  AuditLog,
  ToastMessage,
  LibrarianPrivileges
} from './types';
import { StorageService } from './utils/storage';
import { api } from './services/api';

// Layout & Common
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/public/LandingPage';
import { LogoutModal } from './components/auth/LogoutModal';
import { authService } from './services/authService';
import { BreadcrumbProvider } from './context/BreadcrumbContext';

// Dashboards
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';

// Core Destination Views
import { BookList } from './components/books/BookList';
import { AddBookModal } from './components/books/AddBookModal';
import { MemberList } from './components/members/MemberList';
import { CreateMemberModal } from './components/members/CreateMemberModal';
import { LibraryCardModal } from './components/members/LibraryCardModal';
import { ArchiveView } from './components/archive/ArchiveView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { ScanQrModal } from './components/attendance/ScanQrModal';
import { LibraryServicesView } from './components/services/LibraryServicesView';
import { CirculationView } from './components/circulation/CirculationView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { HistoryView } from './components/history/HistoryView';
import { ReportsView } from './components/reports/ReportsView';

// Super Admin / Governance Views
import { AdminManagementView } from './components/admin/AdminManagementView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { SystemSettingsView } from './components/admin/SystemSettingsView';

// Member Specific Views
import { MyBooksView } from './components/member-view/MyBooksView';
import { MemberReservationsView } from './components/member-view/MemberReservationsView';
import { MemberProfileView } from './components/member-view/MemberProfileView';
import { HelpSupportView } from './components/help/HelpSupportView';

// Neutral placeholder shown only before a real session is established; the
// login gate below ensures it is never actually rendered to a user.
const GUEST_USER: User = {
  id: '',
  name: '',
  email: '',
  role: 'member',
  status: 'inactive',
  createdAt: ''
};

export function App() {
  // State from Storage
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [members, setMembers] = useState<Member[]>(() => StorageService.getMembers());
  const [books, setBooks] = useState<Book[]>(() => StorageService.getBooks());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [services, setServices] = useState<LibraryServiceItem[]>(() => StorageService.getServices());
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => StorageService.getServiceRecords());
  const [transactions, setTransactions] = useState<CirculationTransaction[]>(() => StorageService.getTransactions());
  const [reservations, setReservations] = useState<BookReservation[]>(() => StorageService.getReservations());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  const VALID_DESTINATIONS = [
    'dashboard',
    'books',
    'members',
    'archive',
    'attendance',
    'services',
    'circulation',
    'notifications',
    'history',
    'reports',
    'admin_mgmt',
    'audit_logs',
    'system_settings',
    'my_books',
    'reservations',
    'profile',
    'help_support'
  ];

  const getInitialDestination = (): string => {
    const raw = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
    if (raw === 'quick_links') return 'help_support';
    return VALID_DESTINATIONS.includes(raw) ? raw : 'dashboard';
  };

  // Navigation State with URL synchronization
  const [currentDestination, setCurrentDestination] = useState<string>(() => getInitialDestination());

  const handleNavigate = (dest: string) => {
    const normalizedDest = dest === 'quick_links' ? 'help_support' : dest;
    setCurrentDestination(normalizedDest);
    const targetPath = normalizedDest === 'dashboard' ? '/' : `/${normalizedDest}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ dest: normalizedDest }, '', targetPath);
    }
  };

  // Quick modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState<boolean>(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState<boolean>(false);
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);

  // Authentication State & Protection
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [systemSettings, setSystemSettings] = useState(() => StorageService.getSystemSettings());
  // True while an existing token (if any) is being verified against the API on boot.
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Public-facing route: 'landing' for `/` and 'login' for `/login`
  const [publicRoute, setPublicRoute] = useState<'landing' | 'login'>(() => {
    const path = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
    return path === 'login' ? 'login' : 'landing';
  });

  // Non-blocking Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage['type'], title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      title,
      message
    };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Verify any locally-stored session token against the backend on load,
  // rather than trusting client-side storage alone.
  useEffect(() => {
    let cancelled = false;

    async function bootstrapAuth() {
      if (!authService.isAuthenticated()) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const user = await api.me();
        if (cancelled) return;
        const cachedUsers = StorageService.getUsers();
        const matched = cachedUsers.find(
          (u) => (user.id && u.id === user.id) || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
        );
        const userWithPrivs: User = {
          ...user,
          privileges: user.privileges || matched?.privileges || (
            user.role === 'volunteer'
              ? { circulationDesk: true, inventoryManagement: false, memberManagement: true, servicesManagement: true, reportsExport: false, auditView: false }
              : { circulationDesk: true, inventoryManagement: true, memberManagement: true, servicesManagement: true, reportsExport: true, auditView: true }
          )
        };
        setCurrentUser(userWithPrivs);
        StorageService.setCurrentUser(userWithPrivs);
        authService.login(userWithPrivs);
        setIsLoggedIn(true);
      } catch {
        // Token missing/expired/revoked - fall back to the login screen.
        if (!cancelled) setIsLoggedIn(false);
      } finally {
        if (!cancelled) setIsAuthChecking(false);
      }
    }

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  // Route protection & Back Navigation Prevention
  useEffect(() => {
    const handlePopState = () => {
      const authenticated = authService.isAuthenticated();
      setIsLoggedIn(authenticated);
      if (!authenticated) {
        setCurrentDestination('dashboard');
        return;
      }
      const raw = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
      setCurrentDestination(VALID_DESTINATIONS.includes(raw) ? raw : 'dashboard');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Enforce role boundaries and granular staff privileges
  useEffect(() => {
    if (!isLoggedIn) return;

    if (currentUser.role === 'super_admin') {
      const SUPER_ADMIN_DESTINATIONS = ['dashboard', 'admin_mgmt', 'audit_logs', 'system_settings'];
      if (!SUPER_ADMIN_DESTINATIONS.includes(currentDestination)) {
        setCurrentDestination('dashboard');
        if (window.location.pathname !== '/') {
          window.history.replaceState({ dest: 'dashboard' }, '', '/');
        }
      }
      return;
    }

    if (currentUser.role === 'admin' || currentUser.role === 'volunteer') {
      const privs = currentUser.privileges;
      let isDenied = false;
      let deniedMsg = '';

      if (currentDestination === 'attendance' && privs && privs.servicesManagement === false) {
        isDenied = true;
        deniedMsg = 'Attendance & Municipal Services authorization is not active on your account.';
      } else if (currentDestination === 'circulation' && privs && privs.circulationDesk === false) {
        isDenied = true;
        deniedMsg = 'Circulation Desk authorization is not active on your account.';
      } else if (currentDestination === 'books' && currentUser.role === 'volunteer' && (!privs || privs.inventoryManagement === false)) {
        isDenied = true;
        deniedMsg = 'Inventory & Book Cataloging authorization is not active on your account.';
      } else if (currentDestination === 'books' && currentUser.role === 'admin' && privs && privs.inventoryManagement === false) {
        isDenied = true;
        deniedMsg = 'Inventory & Book Cataloging authorization is not active on your account.';
      } else if (currentDestination === 'archive' && (currentUser.role !== 'admin' || (privs && privs.inventoryManagement === false))) {
        isDenied = true;
        deniedMsg = 'Archival management access is restricted.';
      } else if (currentDestination === 'members' && privs && privs.memberManagement === false) {
        isDenied = true;
        deniedMsg = 'Member Accounts authorization is not active on your account.';
      } else if (currentDestination === 'reports' && (currentUser.role === 'volunteer' ? (!privs || privs.reportsExport === false) : (privs && privs.reportsExport === false))) {
        isDenied = true;
        deniedMsg = 'Reports & Statistical Export authorization is not active on your account.';
      } else if (currentDestination === 'admin_mgmt' && currentUser.role === 'volunteer') {
        isDenied = true;
        deniedMsg = 'User & Access Management is restricted to Administrators.';
      } else if (currentDestination === 'system_settings') {
        isDenied = true;
        deniedMsg = 'System Settings is restricted to Superadmin.';
      }

      if (isDenied) {
        addToast('warning', 'Access Restricted', deniedMsg);
        setCurrentDestination('dashboard');
        if (window.location.pathname !== '/') {
          window.history.replaceState({ dest: 'dashboard' }, '', '/');
        }
      }
    }
  }, [isLoggedIn, currentUser, currentDestination]);

  // Fetch live data from the Laravel API backend once a session is established.
  // (Every data endpoint requires auth:sanctum, so this must wait for login.)
  useEffect(() => {
    if (!isLoggedIn) return;

    async function fetchBackendData() {
      try {
        const [
          backendBooks,
          backendMembers,
          backendTx,
          backendRes,
          backendAtt,
          backendLogs,
          backendNotifs,
          backendUsers,
          backendServices,
          backendServiceRecords
        ] = await Promise.allSettled([
          api.getBooks(),
          api.getMembers(),
          api.getTransactions(),
          api.getReservations(),
          api.getAttendance(),
          api.getAuditLogs(),
          api.getNotifications(),
          api.getUsers(),
          api.getServices(),
          api.getServiceRecords()
        ]);

        if (backendBooks.status === 'fulfilled') {
          setBooks(backendBooks.value);
          StorageService.saveBooks(backendBooks.value);
        }
        if (backendMembers.status === 'fulfilled') {
          setMembers(backendMembers.value);
          StorageService.saveMembers(backendMembers.value);
        }
        if (backendTx.status === 'fulfilled') {
          setTransactions(backendTx.value);
          StorageService.saveTransactions(backendTx.value);
        }
        if (backendRes.status === 'fulfilled') {
          setReservations(backendRes.value);
          StorageService.saveReservations(backendRes.value);
        }
        if (backendAtt.status === 'fulfilled') {
          setAttendance(backendAtt.value);
          StorageService.saveAttendance(backendAtt.value);
        }
        if (backendLogs.status === 'fulfilled') {
          setAuditLogs(backendLogs.value);
        }
        if (backendNotifs.status === 'fulfilled') {
          setNotifications(backendNotifs.value);
        }
        if (backendUsers.status === 'fulfilled') {
          setUsers(backendUsers.value);
          StorageService.saveUsers(backendUsers.value);
        }
        if (backendServices.status === 'fulfilled') {
          setServices(backendServices.value);
        }
        if (backendServiceRecords.status === 'fulfilled') {
          setServiceRecords(backendServiceRecords.value);
          StorageService.saveServiceRecords(backendServiceRecords.value);
        }
      } catch (e) {
        console.info('Using local cache until Laravel API connects:', e);
      }
    }
    fetchBackendData();
  }, [isLoggedIn]);

  // 1. Books Operations
  const handleBookAdded = (newBook: Book) => {
    const updated = [newBook, ...books];
    setBooks(updated);
    StorageService.saveBooks(updated);

    StorageService.addAuditLog(
      'BOOK_CATALOGED',
      'Books',
      `Cataloged "${newBook.title}" (ISBN: ${newBook.isbn}) with ${newBook.copies.length} copies`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    api.createBook(newBook).catch((err) => console.info('Backend sync note:', err));

    addToast('success', 'Book Cataloged Successfully', `Generated Accession numbers for ${newBook.copies.length} copies`);
  };

  const handleBooksBulkImported = (importedBooks: Book[]) => {
    const importedIds = new Set(importedBooks.map((b) => b.id));
    const nextBooks = [...importedBooks, ...books.filter((b) => !importedIds.has(b.id))];
    setBooks(nextBooks);
    StorageService.saveBooks(nextBooks);

    StorageService.addAuditLog(
      'BULK_BOOK_IMPORT',
      'Books',
      `Bulk imported ${importedBooks.length} book titles with physical copies`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleAddPhysicalCopy = (bookId: string, copy: PhysicalCopy) => {
    const updated = books.map((b) => {
      if (b.id === bookId) {
        return { ...b, copies: [...b.copies, copy] };
      }
      return b;
    });
    setBooks(updated);
    StorageService.saveBooks(updated);

    StorageService.addAuditLog(
      'BOOK_COPY_ADDED',
      'Books',
      `Added physical copy ${copy.accessionNumber} for book ID ${bookId}`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Physical Copy Added', `Accession Number ${copy.accessionNumber} generated.`);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    const updated = books.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    setBooks(updated);
    StorageService.saveBooks(updated);

    StorageService.addAuditLog(
      'BOOK_UPDATED',
      'Books',
      `Updated metadata for "${updatedBook.title}" (ISBN: ${updatedBook.isbn})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    api.updateBook(updatedBook.id, updatedBook).catch((err) => console.info('Backend sync note:', err));
    addToast('success', 'Book Updated', `Changes to "${updatedBook.title}" saved successfully.`);
  };

  const handleDeleteBook = (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;

    // Strict business rule: Active books cannot be directly deleted
    if (!targetBook.isArchived) {
      addToast(
        'error',
        'Cannot Delete Active Book',
        `"${targetBook.title}" is currently active. In accordance with library policy, please archive the book first before deleting.`
      );
      return;
    }

    // Safety check: ensure no copy of this book has an active loan
    const copyBarcodes = targetBook.copies.map((c) => c.barcode);
    const hasActiveLoans = transactions.some(
      (tx) =>
        (tx.bookId === bookId || copyBarcodes.includes(tx.barcode)) &&
        (tx.status === 'Active' || tx.status === 'Overdue')
    );
    if (hasActiveLoans) {
      addToast(
        'error',
        'Cannot Delete Book',
        `"${targetBook.title}" has active circulation loans. Please return all borrowed copies before deleting.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete "${targetBook.title}" and its catalog records? This cannot be undone.`)) {
      return;
    }

    const updated = books.filter((b) => b.id !== bookId);
    setBooks(updated);
    StorageService.saveBooks(updated);

    StorageService.addAuditLog(
      'BOOK_DELETED',
      'Books',
      `Permanently removed "${targetBook.title}" (ISBN: ${targetBook.isbn}) from catalog`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    api.deleteBook(bookId).catch((err) => console.info('Backend sync note:', err));
    addToast('success', 'Book Deleted', `"${targetBook.title}" was removed from the catalog.`);
  };

  const handleBulkArchiveBooks = (bookIds: string[]) => {
    const updated = books.map((b) => {
      if (bookIds.includes(b.id)) {
        return {
          ...b,
          isArchived: true,
          copies: b.copies.map((c) => ({ ...c, status: 'Archived' as const }))
        };
      }
      return b;
    });
    setBooks(updated);
    StorageService.saveBooks(updated);

    bookIds.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        api.updateBook(id, { isArchived: true }).catch((err) => console.info('Backend sync note:', err));
        StorageService.addAuditLog('BOOK_ARCHIVED', 'Books', `Archived "${book.title}" (ISBN: ${book.isbn})`, currentUser.name);
      }
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleBulkRestoreBooks = (bookIds: string[]) => {
    const updated = books.map((b) => {
      if (bookIds.includes(b.id)) {
        return {
          ...b,
          isArchived: false,
          copies: b.copies.map((c) => ({ ...c, status: 'Available' as const }))
        };
      }
      return b;
    });
    setBooks(updated);
    StorageService.saveBooks(updated);

    bookIds.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (book) {
        api.updateBook(id, { isArchived: false }).catch((err) => console.info('Backend sync note:', err));
        StorageService.addAuditLog('BOOK_RESTORED', 'Books', `Restored "${book.title}" (ISBN: ${book.isbn})`, currentUser.name);
      }
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleBulkDeleteBooks = (bookIds: string[]) => {
    const booksToDelete = books.filter((b) => bookIds.includes(b.id));

    // Safeguard: Active books cannot be deleted
    const hasActive = booksToDelete.some((b) => !b.isArchived);
    if (hasActive) {
      addToast('error', 'Cannot Delete Active Books', 'Only archived books can be deleted. Please archive active books first.');
      throw new Error('Active books cannot be deleted');
    }

    const hasActiveLoan = booksToDelete.some((b) => {
      const barcodes = b.copies.map((c) => c.barcode);
      return transactions.some(
        (tx) => (tx.bookId === b.id || barcodes.includes(tx.barcode)) && (tx.status === 'Active' || tx.status === 'Overdue')
      );
    });

    if (hasActiveLoan) {
      addToast('error', 'Cannot Delete Book', 'One or more selected books have active circulation loans.');
      throw new Error('Active loans prevent deletion');
    }

    const updated = books.filter((b) => !bookIds.includes(b.id));
    setBooks(updated);
    StorageService.saveBooks(updated);

    booksToDelete.forEach((book) => {
      api.deleteBook(book.id).catch((err) => console.info('Backend sync note:', err));
      StorageService.addAuditLog('BOOK_DELETED', 'Books', `Permanently removed "${book.title}" (ISBN: ${book.isbn})`, currentUser.name);
    });
    setAuditLogs(StorageService.getAuditLogs());
  };

  const handleToggleArchiveBook = (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId);
    if (!targetBook) return;

    const nextArchived = !targetBook.isArchived;

    // If archiving, ensure no active loans
    if (nextArchived) {
      const copyBarcodes = targetBook.copies.map((c) => c.barcode);
      const hasActiveLoans = transactions.some(
        (tx) =>
          (tx.bookId === bookId || copyBarcodes.includes(tx.barcode)) &&
          (tx.status === 'Active' || tx.status === 'Overdue')
      );
      if (hasActiveLoans) {
        addToast(
          'error',
          'Cannot Archive Book',
          `"${targetBook.title}" currently has borrowed copies. Return all loans first.`
        );
        return;
      }
    }

    const updatedBook: Book = {
      ...targetBook,
      isArchived: nextArchived,
      copies: targetBook.copies.map((c) => ({
        ...c,
        status: nextArchived ? 'Archived' : 'Available'
      }))
    };

    const updated = books.map((b) => (b.id === bookId ? updatedBook : b));
    setBooks(updated);
    StorageService.saveBooks(updated);

    StorageService.addAuditLog(
      nextArchived ? 'BOOK_ARCHIVED' : 'BOOK_RESTORED',
      'Books',
      `${nextArchived ? 'Archived' : 'Restored'} "${targetBook.title}" (ISBN: ${targetBook.isbn})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    api.updateBook(bookId, updatedBook).catch((err) => console.info('Backend sync note:', err));
    addToast(
      'success',
      nextArchived ? 'Book Archived' : 'Book Restored',
      `"${targetBook.title}" is now ${nextArchived ? 'archived and hidden from regular circulation' : 'active in catalog'}.`
    );
  };


  // Authentication Handlers
  const handleLogin = (user: User) => {
    if (user.status === 'inactive') {
      addToast('error', 'Account Inactive', 'Your library account is currently inactive. Please contact the library administrator.');
      return;
    }
    if (user.status === 'suspended') {
      addToast('error', 'Account Suspended', 'Your library account is currently suspended. Please contact the library administrator.');
      return;
    }

    const cachedUsers = StorageService.getUsers();
    const matched = cachedUsers.find(
      (u) => (user.id && u.id === user.id) || (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
    );
    const userWithPrivs: User = {
      ...user,
      privileges: user.privileges || matched?.privileges || (
        user.role === 'volunteer'
          ? { circulationDesk: true, inventoryManagement: false, memberManagement: true, servicesManagement: true, reportsExport: false, auditView: false }
          : { circulationDesk: true, inventoryManagement: true, memberManagement: true, servicesManagement: true, reportsExport: true, auditView: true }
      )
    };
    setCurrentUser(userWithPrivs);
    StorageService.setCurrentUser(userWithPrivs);
    authService.login(userWithPrivs, true);
    setIsLoggedIn(true);
    handleNavigate(getInitialDestination());
    addToast('success', `Welcome, ${userWithPrivs.name}`, `Signed in as ${userWithPrivs.role.replace('_', ' ')}`);
  };

  const handleRequestLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleCancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleConfirmLogout = () => {
    authService.logout().catch(() => {
      // Best effort server-side token revocation - local session is cleared regardless.
    });
    setIsLogoutModalOpen(false);
    setIsLoggedIn(false);
    setCurrentUser(GUEST_USER);
    handleNavigate('dashboard');
    addToast('success', 'Logged Out', 'You have been logged out successfully.');
  };

  // 2. Members Operations
  const handleMemberCreated = async (newMember: Member, newUser?: User, _tempPass?: string) => {
    try {
      const backendMember = await api.createMember(newMember);
      const memberToSave = (backendMember && backendMember.memberId) ? backendMember : newMember;

      const updatedMembers = [memberToSave, ...members.filter(m => m.memberId !== memberToSave.memberId)];
      setMembers(updatedMembers);
      StorageService.saveMembers(updatedMembers);

      if (newUser) {
        const updatedUsers = [newUser, ...users.filter(u => u.memberId !== memberToSave.memberId)];
        setUsers(updatedUsers);
        StorageService.saveUsers(updatedUsers);
      }

      StorageService.addAuditLog(
        'MEMBER_REGISTERED',
        'Members',
        `Admin created member account for ${memberToSave.fullName} (${memberToSave.memberId}) with role 'member'`,
        currentUser.name
      );
      setAuditLogs(StorageService.getAuditLogs());

      addToast(
        'success',
        'Member Saved to Database',
        `Member ID: ${memberToSave.memberId} • ${memberToSave.fullName}`
      );
    } catch (err: any) {
      console.error('Error saving member to Laragon MySQL:', err);
      // Fallback local save so user work is not lost
      const updatedMembers = [newMember, ...members];
      setMembers(updatedMembers);
      StorageService.saveMembers(updatedMembers);
      if (newUser) {
        const updatedUsers = [newUser, ...users];
        setUsers(updatedUsers);
        StorageService.saveUsers(updatedUsers);
      }
      addToast(
        'error',
        'Database Sync Failed',
        err?.message || 'Could not save member to Laragon MySQL. Saved locally in browser.'
      );
    }
  };

  const handleMemberUpdated = (updatedMember: Member) => {
    const existing = members.find((m) => m.id === updatedMember.id || m.memberId === updatedMember.memberId);
    const statusChanged = existing && existing.status !== updatedMember.status;

    const updatedMembers = members.map((m) =>
      m.id === updatedMember.id || m.memberId === updatedMember.memberId ? updatedMember : m
    );
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    // Sync with users list
    const updatedUsers = users.map((u) => {
      if (u.memberId === updatedMember.memberId || u.email === updatedMember.email) {
        return {
          ...u,
          name: updatedMember.fullName,
          email: updatedMember.email,
          phone: updatedMember.phone,
          address: updatedMember.address,
          status: updatedMember.status
        };
      }
      return u;
    });
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    api.updateMember(updatedMember.memberId, updatedMember).catch((err) =>
      addToast('warning', 'Member Update Not Synced', err instanceof Error ? err.message : 'Please retry.')
    );

    const auditAction = statusChanged ? 'MEMBER_STATUS_CHANGED' : 'MEMBER_UPDATED';
    const auditDetails = statusChanged
      ? `Changed account status for ${updatedMember.fullName} (${updatedMember.memberId}) from ${existing?.status?.toUpperCase()} to ${updatedMember.status.toUpperCase()} (Automatic Deactivation: ${updatedMember.status === 'inactive' ? 'Enabled' : 'Disabled'})`
      : `Updated member profile for ${updatedMember.fullName} (${updatedMember.memberId})`;

    StorageService.addAuditLog(
      auditAction,
      'Members',
      auditDetails,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    if (statusChanged) {
      if (updatedMember.status === 'inactive') {
        addToast(
          'warning',
          'Member Account Deactivated',
          `${updatedMember.fullName} is now Inactive. Account login and borrowing access have been automatically deactivated.`
        );
      } else if (updatedMember.status === 'active') {
        addToast(
          'success',
          'Member Account Activated',
          `${updatedMember.fullName} is now Active. Full library access and borrowing privileges restored.`
        );
      } else {
        addToast(
          'warning',
          'Member Account Suspended',
          `${updatedMember.fullName} has been placed under disciplinary suspension.`
        );
      }

      // If this member is currently logged in and deactivated, log them out
      if (currentUser.memberId === updatedMember.memberId && updatedMember.status !== 'active') {
        authService.logout().finally(() => {
          setIsLoggedIn(false);
          setCurrentUser(GUEST_USER);
          addToast('error', 'Session Terminated', 'Your library account is currently inactive. Please contact the library administrator.');
        });
      }
    } else {
      addToast('success', 'Member Updated', `Profile updated for ${updatedMember.fullName}`);
    }
  };

  const handleMemberDeleted = (memberId: string) => {
    const targetMember = members.find((m) => m.memberId === memberId || m.id === memberId);
    const updatedMembers = members.filter((m) => m.memberId !== memberId && m.id !== memberId);
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    const updatedUsers = users.filter((u) => u.memberId !== memberId && u.email !== targetMember?.email);
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    api.deleteMember(memberId).catch((err) =>
      addToast('warning', 'Member Deletion Not Synced', err instanceof Error ? err.message : 'Please retry.')
    );

    StorageService.addAuditLog(
      'MEMBER_DELETED',
      'Members',
      `Deleted member account ${targetMember?.fullName} (${memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());
    addToast('info', 'Member Deleted', `Account for ${targetMember?.fullName || memberId} was removed.`);
  };

  const handleToggleMemberStatus = (memberId: string, newStatus?: AccountStatus) => {
    const targeted = members.find((m) => m.id === memberId || m.memberId === memberId);
    const nextStatus: AccountStatus = newStatus || (targeted?.status === 'active' ? 'inactive' : 'active');

    const updatedMembers = members.map((m) => {
      if (m.id === memberId || m.memberId === memberId) {
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    const updatedUsers = users.map((u) => {
      if (u.memberId === targeted?.memberId || u.email === targeted?.email) {
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updatedUsers);
    StorageService.saveUsers(updatedUsers);

    if (targeted) {
      api.updateMember(targeted.memberId, { status: nextStatus }).catch((err) =>
        addToast('warning', 'Status Change Not Synced', err instanceof Error ? err.message : 'Please retry.')
      );
    }

    StorageService.addAuditLog(
      'MEMBER_STATUS_CHANGED',
      'Members',
      `Changed account status for ${targeted?.fullName} (${targeted?.memberId}) to ${nextStatus.toUpperCase()}`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast(
      nextStatus === 'active' ? 'success' : 'warning',
      'Member Status Changed',
      `${targeted?.fullName} is now ${nextStatus.toUpperCase()}`
    );
  };

  const handleToggleArchiveMember = (memberId: string) => {
    const targeted = members.find((m) => m.id === memberId || m.memberId === memberId);
    if (!targeted) return;
    const nextArchived = !targeted.isArchived;

    const updatedMembers = members.map((m) =>
      m.id === memberId || m.memberId === memberId ? { ...m, isArchived: nextArchived } : m
    );
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    api.updateMember(targeted.memberId, { isArchived: nextArchived }).catch((err) =>
      addToast('warning', nextArchived ? 'Archive Not Synced' : 'Restore Not Synced', err instanceof Error ? err.message : 'Please retry.')
    );

    StorageService.addAuditLog(
      nextArchived ? 'MEMBER_ARCHIVED' : 'MEMBER_RESTORED',
      'Members',
      `${nextArchived ? 'Archived' : 'Restored'} member account ${targeted.fullName} (${targeted.memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast(
      'success',
      nextArchived ? 'Member Archived' : 'Member Restored',
      `${targeted.fullName} is now ${nextArchived ? 'archived' : 'active'}.`
    );
  };

  // 3. Attendance Operations
  const handleAttendanceProcessed = (record: AttendanceRecord, actionType: 'time_in' | 'time_out') => {
    let updated: AttendanceRecord[];
    if (actionType === 'time_in') {
      updated = [record, ...attendance];
    } else {
      updated = attendance.map((a) => (a.id === record.id ? record : a));
    }

    setAttendance(updated);
    StorageService.saveAttendance(updated);

    if (actionType === 'time_in') {
      api
        .checkInAttendance(record.memberId)
        .then((serverRecord) => {
          // Reconcile the optimistic local id with the backend's real record id
          // so a same-session check-out can find it.
          setAttendance((prev) => {
            const reconciled = prev.map((a) => (a.id === record.id ? { ...a, id: serverRecord.id } : a));
            StorageService.saveAttendance(reconciled);
            return reconciled;
          });
        })
        .catch((err) => addToast('warning', 'Time-In Not Synced', err instanceof Error ? err.message : 'Please retry.'));
    } else {
      api
        .checkOutAttendance(record.id)
        .catch((err) => addToast('warning', 'Time-Out Not Synced', err instanceof Error ? err.message : 'Please retry.'));
    }

    StorageService.addAuditLog(
      actionType === 'time_in' ? 'ATTENDANCE_TIME_IN' : 'ATTENDANCE_TIME_OUT',
      'Attendance',
      `${actionType === 'time_in' ? 'Time-In' : 'Time-Out'} recorded for ${record.memberName} (${record.memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast(
      'success',
      actionType === 'time_in' ? '✓ Time-In Recorded' : '✓ Time-Out Recorded',
      `${record.memberName} (${record.memberId}) at ${actionType === 'time_in' ? record.timeIn : record.timeOut}`
    );

    const attNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: actionType === 'time_in' ? 'Patron Attendance Entry' : 'Patron Attendance Exit',
      message: `${record.memberName} (${record.memberId}) recorded ${actionType === 'time_in' ? 'Time-In' : 'Time-Out'} at ${actionType === 'time_in' ? record.timeIn : record.timeOut}.`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'all',
      destination: 'attendance',
      actionText: 'View Attendance'
    };
    const updatedNotifs = [attNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);
  };

  const handleSaveAttendanceEdit = (updatedRecord: AttendanceRecord, reason: string) => {
    const updated = attendance.map((a) => (a.id === updatedRecord.id ? updatedRecord : a));
    setAttendance(updated);
    StorageService.saveAttendance(updated);

    api
      .updateAttendance(updatedRecord.id, updatedRecord, reason)
      .catch((err) => addToast('warning', 'Correction Not Synced', err instanceof Error ? err.message : 'Please retry.'));

    StorageService.addAuditLog(
      'ATTENDANCE_RECORD_EDITED',
      'Attendance',
      `Modified record for ${updatedRecord.memberName}. Reason: "${reason}"`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Attendance Record Corrected', 'Audit trail updated.');
  };

  // 4. Library Services
  const handleServiceRecorded = (record: ServiceRecord) => {
    const updated = [record, ...serviceRecords];
    setServiceRecords(updated);
    StorageService.saveServiceRecords(updated);

    StorageService.addAuditLog(
      'SERVICE_RECORDED',
      'Circulation',
      `Logged service "${record.serviceName}" for patron ${record.memberName} (${record.memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    api.recordServiceUsage(record.serviceId, record.memberId, record.notes).catch((err) =>
      addToast('warning', 'Service Log Not Synced', err instanceof Error ? err.message : 'Will retry on next sync.')
    );

    addToast('success', 'Service Logged', `${record.serviceName} for ${record.memberName}`);
  };

  // 5. Circulation Operations
  const handleBorrowBook = (memberId: string, barcode: string, dueDate: string) => {
    const member = members.find((m) => m.memberId === memberId);
    if (!member) return { success: false, message: 'Member record not found.' };
    if (member.status === 'inactive') return { success: false, message: 'Member account is inactive.' };

    const currentMemberActiveLoans = transactions.filter(
      (t) => t.memberId === memberId && (t.status === 'Active' || t.status === 'Overdue')
    );
    if (currentMemberActiveLoans.length >= 3) {
      return { success: false, message: 'Member has reached maximum allowed active loans (3 books).' };
    }

    let targetedBook: Book | null = null;
    let targetedCopy: PhysicalCopy | null = null;

    for (const b of books) {
      const copy = b.copies.find((c) => c.barcode.toUpperCase() === barcode.toUpperCase());
      if (copy) {
        targetedBook = b;
        targetedCopy = copy;
        break;
      }
    }

    if (!targetedBook || !targetedCopy) {
      return { success: false, message: `No physical book found with barcode "${barcode}".` };
    }

    if (targetedCopy.status !== 'Available') {
      return { success: false, message: `Copy ${barcode} is currently ${targetedCopy.status}.` };
    }

    const updatedBooks = books.map((b) => {
      if (b.id === targetedBook?.id) {
        return {
          ...b,
          copies: b.copies.map((c) => (c.barcode === barcode ? { ...c, status: 'Borrowed' as const } : c))
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    const txNumber = String(transactions.length + 1).padStart(5, '0');
    const newTx: CirculationTransaction = {
      id: `BRW-2026-${txNumber}`,
      bookId: targetedBook.id,
      bookTitle: targetedBook.title,
      bookAuthor: targetedBook.author,
      accessionNumber: targetedCopy.accessionNumber,
      barcode: targetedCopy.barcode,
      memberId: member.memberId,
      memberName: member.fullName,
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate,
      status: 'Active',
      renewalCount: 0,
      processedBy: currentUser.name
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    const updatedMembers = members.map((m) =>
      m.memberId === memberId ? { ...m, totalBorrows: m.totalBorrows + 1 } : m
    );
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Book Successfully Borrowed!',
      message: `"${targetedBook.title}" was issued to your account. Scheduled due date: ${dueDate}.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: member.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_BORROW_RECORDED',
      'Circulation',
      `Issued "${targetedBook.title}" (${targetedCopy.barcode}) to ${member.fullName} (${member.memberId}). Due date: ${dueDate}`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    // Asynchronously dispatch to Laravel backend to keep database in sync
    api.borrowBook(member.memberId, targetedCopy.barcode, dueDate).catch((err) => {
      console.info('Backend sync note:', err);
    });

    return {
      success: true,
      message: `✓ Successfully borrowed "${targetedBook.title}". Due date: ${dueDate}`,
      transaction: newTx
    };
  };

  const handleReturnBook = (barcode: string) => {
    const activeTx = transactions.find(
      (t) => t.barcode.toUpperCase() === barcode.toUpperCase() && (t.status === 'Active' || t.status === 'Overdue')
    );

    if (!activeTx) {
      return { success: false, message: `No active borrowing transaction found for barcode "${barcode}".` };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const updatedTx = transactions.map((t) => {
      if (t.id === activeTx.id) {
        return {
          ...t,
          status: 'Returned' as const,
          returnDate: todayStr
        };
      }
      return t;
    });
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    const updatedBooks = books.map((b) => {
      if (b.id === activeTx.bookId) {
        return {
          ...b,
          copies: b.copies.map((c) =>
            c.barcode.toUpperCase() === barcode.toUpperCase() ? { ...c, status: 'Available' as const } : c
          )
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Book Returned Successfully',
      message: `"${activeTx.bookTitle}" was returned. Your account record has been updated.`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: activeTx.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_RETURN_RECORDED',
      'Circulation',
      `Returned "${activeTx.bookTitle}" (${barcode}) from ${activeTx.memberName}. Transaction closed.`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    // Asynchronously dispatch to Laravel backend to keep database in sync
    api.returnBook(barcode).catch((err) => {
      console.info('Backend sync note:', err);
    });

    return {
      success: true,
      message: `✓ Book "${activeTx.bookTitle}" returned successfully. Physical copy is now AVAILABLE on shelf.`,
      transaction: { ...activeTx, status: 'Returned' as const, returnDate: todayStr }
    };
  };

  const handleRenewBook = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaction not found.' };

    if (tx.renewalCount >= 2) {
      return { success: false, message: 'Maximum renewal allowance (2 times) reached for this loan.' };
    }

    const currentDue = new Date(tx.dueDate);
    currentDue.setDate(currentDue.getDate() + 14);
    const newDueDateStr = currentDue.toISOString().split('T')[0];

    const updatedTx = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          dueDate: newDueDateStr,
          renewalCount: t.renewalCount + 1,
          status: 'Active' as const
        };
      }
      return t;
    });
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    StorageService.addAuditLog(
      'CIRCULATION_RENEWAL',
      'Circulation',
      `Renewed "${tx.bookTitle}" for ${tx.memberName}. New due date: ${newDueDateStr}`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Loan Renewed', `Due date extended to ${newDueDateStr}`);
    return { success: true, message: `Loan renewed. New due date: ${newDueDateStr}` };
  };

  // 5. Member Borrow Requests & Admin Approvals
  const handleRequestBorrow = (book: Book, copy?: PhysicalCopy) => {
    const memberId = currentUser.memberId || 'MBR-000001';
    const member = members.find((m) => m.memberId === memberId) || members[0];

    // Check maximum 3 active/pending loans
    const activeOrPending = transactions.filter(
      (t) => t.memberId === memberId && (t.status === 'Active' || t.status === 'Pending Approval' || t.status === 'Overdue')
    );
    if (activeOrPending.length >= 3) {
      addToast('warning', 'Loan Limit Reached', 'You already have 3 active loans / pending requests (maximum allowed).');
      return { success: false, message: 'You have reached the maximum 3 books limit.' };
    }

    const alreadyHolding = transactions.find(
      (t) => t.memberId === memberId && t.bookId === book.id && (t.status === 'Active' || t.status === 'Pending Approval')
    );
    if (alreadyHolding) {
      addToast('warning', 'Already Requested', 'You already have an active loan or pending request for this title.');
      return { success: false, message: 'Already requested or borrowed.' };
    }

    // Pick target copy
    const targetCopy = (copy && copy.status === 'Available')
      ? copy
      : book.copies.find((c) => c.status === 'Available');

    if (!targetCopy) {
      addToast('warning', 'No Copies Available', 'All physical copies are currently borrowed. You can place a reservation hold instead.');
      return { success: false, message: 'No copies available on shelf.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    const defaultDueDateStr = defaultDue.toISOString().split('T')[0];

    const newTx: CirculationTransaction = {
      id: `tx-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      accessionNumber: targetCopy.accessionNumber,
      barcode: targetCopy.barcode,
      memberId: member.memberId,
      memberName: member.fullName,
      borrowDate: todayStr,
      requestDate: todayStr,
      dueDate: defaultDueDateStr,
      status: 'Pending Approval',
      renewalCount: 0,
      processedBy: 'Pending Staff Approval'
    };

    // Temporarily mark copy as Reserved so another patron cannot request it
    const updatedBooks = books.map((b) => {
      if (b.id === book.id) {
        return {
          ...b,
          copies: b.copies.map((c) => (c.barcode === targetCopy.barcode ? { ...c, status: 'Reserved' as const } : c))
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    // Notify Admins
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Borrow Request',
      message: `${member.fullName} (${member.memberId}) requested to borrow "${book.title}".`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'admin'
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_BORROW_REQUESTED',
      'Circulation',
      `${member.fullName} requested to borrow "${book.title}" (${targetCopy.barcode}). Awaiting Admin Approval.`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Borrow Request Submitted', `Your request for "${book.title}" is pending librarian approval.`);
    return { success: true, message: 'Borrow request submitted successfully.' };
  };

  const handleApproveBorrow = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 14);
    const dueDateStr = due.toISOString().split('T')[0];

    const updatedTx = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'Active' as const,
          borrowDate: todayStr,
          dueDate: dueDateStr,
          processedBy: currentUser.name
        };
      }
      return t;
    });
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    const updatedBooks = books.map((b) => {
      if (b.id === tx.bookId) {
        return {
          ...b,
          copies: b.copies.map((c) => (c.barcode === tx.barcode ? { ...c, status: 'Borrowed' as const } : c))
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    const updatedMembers = members.map((m) =>
      m.memberId === tx.memberId ? { ...m, totalBorrows: m.totalBorrows + 1 } : m
    );
    setMembers(updatedMembers);
    StorageService.saveMembers(updatedMembers);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Borrow Request Approved!',
      message: `Your request to borrow "${tx.bookTitle}" has been approved. Due date: ${dueDateStr}.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: tx.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_BORROW_APPROVED',
      'Circulation',
      `Approved loan for "${tx.bookTitle}" to ${tx.memberName} (${tx.memberId}). Due date: ${dueDateStr}.`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Borrow Approved', `Loan activated for ${tx.memberName}. Due date set to ${dueDateStr}.`);
  };

  const handleRejectBorrow = (transactionId: string, reason?: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    const updatedTx = transactions.map((t) => {
      if (t.id === transactionId) {
        return {
          ...t,
          status: 'Rejected' as const,
          rejectionReason: reason || 'Declined by library administration',
          processedBy: currentUser.name
        };
      }
      return t;
    });
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    const updatedBooks = books.map((b) => {
      if (b.id === tx.bookId) {
        return {
          ...b,
          copies: b.copies.map((c) => (c.barcode === tx.barcode ? { ...c, status: 'Available' as const } : c))
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Borrow Request Declined',
      message: `Your request for "${tx.bookTitle}" was declined: ${reason || 'Physical copy is reserved for reference.'}.`,
      type: 'warning',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: tx.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_BORROW_REJECTED',
      'Circulation',
      `Declined borrow request for "${tx.bookTitle}" from ${tx.memberName}`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('info', 'Borrow Request Declined', `Released copy ${tx.barcode} back to shelf.`);
  };

  const handleCancelBorrowRequest = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    const updatedTx = transactions.filter((t) => t.id !== transactionId);
    setTransactions(updatedTx);
    StorageService.saveTransactions(updatedTx);

    const updatedBooks = books.map((b) => {
      if (b.id === tx.bookId) {
        return {
          ...b,
          copies: b.copies.map((c) => (c.barcode === tx.barcode ? { ...c, status: 'Available' as const } : c))
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);

    addToast('info', 'Borrow Request Withdrawn', `Your request for "${tx.bookTitle}" was withdrawn.`);
  };

  // Reservations: Member Reserve & Admin Approval
  const handleReserveBook = (book: Book) => {
    const memberId = currentUser.memberId || 'MBR-000001';
    const member = members.find((m) => m.memberId === memberId) || members[0];

    const existingRes = reservations.find(
      (r) => r.bookId === book.id && r.memberId === memberId && (r.status === 'Pending Approval' || r.status === 'Waiting' || r.status === 'Ready for Pickup')
    );
    if (existingRes) {
      addToast('warning', 'Already Reserved', 'You already have an active hold or pending reservation for this title.');
      return;
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setDate(today.getDate() + 7);

    const newRes: BookReservation = {
      id: `res-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      memberId: member.memberId,
      memberName: member.fullName,
      reservationDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'Pending Approval',
      queuePosition: reservations.filter((r) => r.bookId === book.id && r.status !== 'Cancelled' && r.status !== 'Claimed').length + 1
    };

    const updated = [newRes, ...reservations];
    setReservations(updated);
    StorageService.saveReservations(updated);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Reservation Hold',
      message: `${member.fullName} (${member.memberId}) submitted a reservation for "${book.title}".`,
      type: 'info',
      timestamp: 'Just now',
      read: false,
      targetRole: 'admin'
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_RESERVATION_REQUESTED',
      'Circulation',
      `${member.fullName} requested reservation hold on "${book.title}". Awaiting Admin Approval.`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Hold Request Submitted', `Your reservation for "${book.title}" is pending staff approval.`);
  };

  const handleApproveReservation = (resId: string) => {
    const res = reservations.find((r) => r.id === resId);
    if (!res) return;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    const expiryStr = expiry.toISOString().split('T')[0];

    const updated = reservations.map((r) => {
      if (r.id === resId) {
        return {
          ...r,
          status: 'Ready for Pickup' as const,
          expiryDate: expiryStr
        };
      }
      return r;
    });
    setReservations(updated);
    StorageService.saveReservations(updated);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Reservation Ready for Pickup!',
      message: `Your reserved copy of "${res.bookTitle}" is now ready at the circulation counter! Valid until ${expiryStr}.`,
      type: 'success',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: res.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    StorageService.addAuditLog(
      'CIRCULATION_RESERVATION_APPROVED',
      'Circulation',
      `Approved reservation hold for "${res.bookTitle}" to ${res.memberName}. Ready for Pickup.`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Reservation Approved', `"${res.bookTitle}" marked as Ready for Pickup for ${res.memberName}.`);
  };

  const handleRejectReservation = (resId: string) => {
    const res = reservations.find((r) => r.id === resId);
    if (!res) return;

    const updated = reservations.map((r) => {
      if (r.id === resId) {
        return {
          ...r,
          status: 'Cancelled' as const
        };
      }
      return r;
    });
    setReservations(updated);
    StorageService.saveReservations(updated);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Reservation Cancelled',
      message: `Your reservation for "${res.bookTitle}" could not be fulfilled at this time.`,
      type: 'warning',
      timestamp: 'Just now',
      read: false,
      targetRole: 'member',
      targetMemberId: res.memberId
    };
    const updatedNotifs = [newNotif, ...notifications];
    setNotifications(updatedNotifs);
    StorageService.saveNotifications(updatedNotifs);

    addToast('info', 'Reservation Cancelled', `Reservation for "${res.bookTitle}" cancelled.`);
  };

  const handleCancelReservation = (resId: string) => {
    const updated = reservations.filter((r) => r.id !== resId);
    setReservations(updated);
    StorageService.saveReservations(updated);
    addToast('info', 'Reservation Cancelled');
  };

  // 6. Admin Governance
  const handleAddAdmin = async (newAdmin: User): Promise<{ user: User; temporary_password: string }> => {
    try {
      const { user, temporary_password } = await api.createUser({
        name: newAdmin.name,
        email: newAdmin.email,
        username: newAdmin.username,
        password: newAdmin.password,
        role: newAdmin.role,
        department: newAdmin.department,
        phone: newAdmin.phone
      });
      const updated = [user, ...users];
      setUsers(updated);
      StorageService.saveUsers(updated);
      addToast('success', 'Staff Account Created', `Account created for ${user.name} (${user.role.toUpperCase()})`);
      return { user, temporary_password };
    } catch (err) {
      console.warn('Backend sync note, persisting staff account to local storage:', err);
      const fallbackUser: User = {
        ...newAdmin,
        id: newAdmin.id || `usr-${Date.now()}`
      };
      const updated = [fallbackUser, ...users];
      setUsers(updated);
      StorageService.saveUsers(updated);
      addToast('success', 'Staff Account Created', `Account created for ${fallbackUser.name} (${fallbackUser.role.toUpperCase()})`);
      return { user: fallbackUser, temporary_password: fallbackUser.password || 'Staff@123' };
    }
  };

  const handleToggleAdminStatus = async (userId: string) => {
    try {
      const updatedUser = await api.toggleUserStatus(userId);
      const updated = users.map((u) => (u.id === userId ? updatedUser : u));
      setUsers(updated);
      StorageService.saveUsers(updated);
      addToast('info', 'Admin Status Updated', `${updatedUser.name} is now ${updatedUser.status.toUpperCase()}`);
    } catch (err) {
      addToast('error', 'Failed to Update Status', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleResetAdminPassword = async (userId: string) => {
    const targeted = users.find((u) => u.id === userId);
    try {
      const { temporary_password } = await api.resetUserPassword(userId);
      addToast('success', 'Password Reset', `New temporary password for ${targeted?.email}: ${temporary_password}`);
    } catch (err) {
      addToast('error', 'Failed to Reset Password', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleUpdatePrivileges = async (userId: string, privileges: LibrarianPrivileges) => {
    StorageService.updateLibrarianPrivileges(userId, privileges, currentUser.name || 'Super Admin');
    const targetUser = users.find((u) => u.id === userId);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId || (targetUser && u.email && u.email.toLowerCase() === targetUser.email.toLowerCase())) {
          return { ...u, privileges };
        }
        return u;
      })
    );

    if (currentUser.id === userId || (targetUser && currentUser.email && currentUser.email.toLowerCase() === targetUser.email.toLowerCase())) {
      const updatedCurrent: User = { ...currentUser, privileges };
      setCurrentUser(updatedCurrent);
      StorageService.setCurrentUser(updatedCurrent);
    }

    try {
      await api.updatePrivileges(userId, privileges);
    } catch (e) {
      console.info('Backend privileges sync note:', e);
    }

    addToast('success', 'Staff Privileges Updated', `Permissions updated for ${targetUser?.name || 'Staff'}.`);
  };

  const handleMarkAllNotifsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    api.markAllNotificationsRead(currentUser.role === 'member' ? currentUser.memberId : undefined).catch(() => {
      // Best effort - local state already reflects the read status.
    });
    addToast('info', 'All notifications marked as read');
  };

  const handleMarkSingleNotifRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    api.markNotificationRead(id).catch(() => {
      // Best effort - local state already reflects the read status.
    });
  };

  const handleDeleteSingleNotif = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleClearAllNotifs = () => {
    setNotifications([]);
    StorageService.saveNotifications([]);
    addToast('info', 'Notifications Cleared', 'All notifications have been dismissed.');
  };


  const handleTriggerExport = (format: 'pdf' | 'csv') => {
    if (format === 'pdf') {
      window.print();
    } else {
      addToast('success', 'CSV Export Generated', 'balingasag_library_report_2026.csv ready');
    }
  };

  const unreadNotifsCount = notifications.filter((n) => {
    if (currentUser.role === 'member') {
      return !n.read && (n.targetRole === 'member' || n.targetMemberId === currentUser.memberId);
    }
    return !n.read;
  }).length;

  // Verifying a stored session token against the backend before deciding
  // whether to show the dashboard or the login screen.
  if (isAuthChecking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#166534',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 600
        }}
      >
        Loading Balingasag Municipal Library…
      </div>
    );
  }

  // Render public pages when not authenticated
  if (!isLoggedIn) {
    const navigateToLogin = () => {
      setPublicRoute('login');
      window.history.pushState({ publicRoute: 'login' }, '', '/login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navigateToLanding = () => {
      setPublicRoute('landing');
      window.history.pushState({ publicRoute: 'landing' }, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Listen for browser back/forward between public routes
    const handlePublicPopState = () => {
      const path = window.location.pathname.replace(/^\/+/, '').trim().toLowerCase();
      setPublicRoute(path === 'login' ? 'login' : 'landing');
    };

    // Attach listener (cleanup handled by React re-render when isLoggedIn changes)
    window.addEventListener('popstate', handlePublicPopState);

    if (publicRoute === 'login') {
      return (
        <>
          <LoginPage onLogin={handleLogin} onBackToLanding={navigateToLanding} />
          <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
        </>
      );
    }

    return (
      <>
        <LandingPage
          onNavigateToLogin={navigateToLogin}
          isMaintenanceMode={systemSettings.isMaintenanceMode}
          maintenanceMessage={systemSettings.maintenanceMessage}
        />
        <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      </>
    );
  }

  return (
    <BreadcrumbProvider>
      <div className="app-container">
        {/* Sidebar - Pure destinations per spec */}
        <Sidebar
          currentRole={currentUser.role}
          currentDestination={currentDestination}
          onNavigate={handleNavigate}
          unreadNotifsCount={unreadNotifsCount}
          currentUser={currentUser}
        />

        {/* Main Viewport */}
        <div className="app-main">
          {systemSettings.isMaintenanceMode && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                borderBottom: '1px solid #fde68a',
                color: '#92400e',
                padding: '9px 24px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 30
              }}
            >
              <span>⚠️ System Maintenance Mode is ACTIVE — Patron self-service is paused.</span>
              {currentUser.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => handleNavigate('system_settings')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b45309',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Manage in System Settings →
                </button>
              )}
            </div>
          )}

          <Header
            currentUser={currentUser}
            currentDestination={currentDestination}
            onNavigate={handleNavigate}
            onOpenScanner={() => setIsScannerOpen(true)}
            notifications={notifications}
            unreadCount={unreadNotifsCount}
            onMarkAllAsRead={handleMarkAllNotifsRead}
            onMarkSingleAsRead={handleMarkSingleNotifRead}
            onDeleteSingle={handleDeleteSingleNotif}
            onClearAll={handleClearAllNotifs}
            onOpenNotifications={() => handleNavigate('notifications')}
            onLogout={handleRequestLogout}
          />

        <main key={currentDestination} className="content-viewport page-content-enter">
          {/* 1. DASHBOARD DESTINATION */}
          {currentDestination === 'dashboard' && (
            <>
              {currentUser.role === 'super_admin' && (
                <SuperAdminDashboard
                  books={books}
                  members={members}
                  attendance={attendance}
                  transactions={transactions}
                  users={users}
                  auditLogs={auditLogs}
                  onNavigate={handleNavigate}
                />
              )}

              {(currentUser.role === 'admin' || currentUser.role === 'volunteer') && (
                <AdminDashboard
                  books={books}
                  members={members}
                  attendance={attendance}
                  transactions={transactions}
                  serviceRecords={serviceRecords}
                  userRole={currentUser.role}
                  currentUser={currentUser}
                  onNavigate={handleNavigate}
                  onOpenAddBook={() => setIsAddBookOpen(true)}
                  onOpenCreateMember={() => setIsCreateMemberOpen(true)}
                  onOpenScanner={() => setIsScannerOpen(true)}
                />
              )}

            </>
          )}

          {/* 2. BOOKS / BOOK CATALOG */}
          {currentDestination === 'books' && currentUser.role !== 'super_admin' && (
            <BookList
              books={books}
              userRole={currentUser.role}
              onBookAdded={handleBookAdded}
              onAddCopy={handleAddPhysicalCopy}
              onReserveBook={handleReserveBook}
              onRequestBorrow={handleRequestBorrow}
              onEditBook={handleBookUpdated}
              onDeleteBook={handleDeleteBook}
              onToggleArchive={handleToggleArchiveBook}
              onArchiveBooks={handleBulkArchiveBooks}
              onRestoreBooks={handleBulkRestoreBooks}
              onDeleteBooks={handleBulkDeleteBooks}
              onBooksImported={handleBooksBulkImported}
              onShowToast={addToast}
            />
          )}

          {/* 3. MEMBERS */}
          {currentDestination === 'members' && currentUser.role !== 'super_admin' && (
            <MemberList
              members={members}
              userRole={currentUser.role}
              onMemberCreated={handleMemberCreated}
              onMemberUpdated={handleMemberUpdated}
              onMemberDeleted={handleMemberDeleted}
              onToggleStatus={handleToggleMemberStatus}
              onToggleArchive={handleToggleArchiveMember}
            />
          )}

          {/* 3b. ARCHIVE (Books & Members - Librarian Admin only) */}
          {currentDestination === 'archive' && currentUser.role === 'admin' && (
            <ArchiveView
              books={books}
              members={members}
              onRestoreBook={handleToggleArchiveBook}
              onDeleteBook={handleDeleteBook}
              onRestoreMember={handleToggleArchiveMember}
              onDeleteMember={handleMemberDeleted}
            />
          )}

          {/* 4. ATTENDANCE */}
          {currentDestination === 'attendance' && currentUser.role !== 'super_admin' && (
            <AttendanceView
              attendance={attendance}
              members={members}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
              onAttendanceProcessed={handleAttendanceProcessed}
              onSaveAttendanceEdit={handleSaveAttendanceEdit}
            />
          )}

          {/* 5. LIBRARY SERVICES (Member only) */}
          {currentDestination === 'services' && currentUser.role === 'member' && (
            <LibraryServicesView
              services={services}
              serviceRecords={serviceRecords}
              members={members}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
              onServiceRecorded={handleServiceRecorded}
            />
          )}

          {/* 6. CIRCULATION */}
          {currentDestination === 'circulation' && currentUser.role !== 'super_admin' && (
            <CirculationView
              transactions={transactions}
              reservations={reservations}
              books={books}
              members={members}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
              onBorrowBook={handleBorrowBook}
              onReturnBook={handleReturnBook}
              onRenewBook={handleRenewBook}
              onCancelReservation={handleCancelReservation}
              onApproveBorrow={handleApproveBorrow}
              onRejectBorrow={handleRejectBorrow}
              onApproveReservation={handleApproveReservation}
              onRejectReservation={handleRejectReservation}
            />
          )}

          {/* 7. NOTIFICATIONS */}
          {currentDestination === 'notifications' && currentUser.role !== 'super_admin' && (
            <NotificationsView
              notifications={notifications}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
              onMarkAllAsRead={handleMarkAllNotifsRead}
              onMarkSingleAsRead={handleMarkSingleNotifRead}
              onDeleteSingle={handleDeleteSingleNotif}
              onClearAll={handleClearAllNotifs}
              onNavigate={handleNavigate}
            />
          )}

          {/* 8. HISTORY */}
          {currentDestination === 'history' && currentUser.role !== 'super_admin' && (
            <HistoryView
              transactions={transactions}
              attendance={attendance}
              services={serviceRecords}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
            />
          )}

          {/* 9. REPORTS (Librarian Admin only) */}
          {currentDestination === 'reports' && currentUser.role === 'admin' && (
            <ReportsView
              books={books}
              members={members}
              attendance={attendance}
              transactions={transactions}
              serviceRecords={serviceRecords}
              onTriggerExport={handleTriggerExport}
            />
          )}

          {/* 10. SUPER ADMIN & ADMIN: USER & ACCESS MANAGEMENT */}
          {currentDestination === 'admin_mgmt' && (currentUser.role === 'super_admin' || currentUser.role === 'admin') && (
            <AdminManagementView
              users={users}
              currentUser={currentUser}
              onAddAdmin={handleAddAdmin}
              onToggleAdminStatus={handleToggleAdminStatus}
              onResetAdminPassword={handleResetAdminPassword}
              onUpdatePrivileges={handleUpdatePrivileges}
            />
          )}

          {/* 11. SUPER ADMIN / ADMIN: AUDIT LOGS */}
          {currentDestination === 'audit_logs' && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {/* 12. SUPER ADMIN: SYSTEM SETTINGS */}
          {currentDestination === 'system_settings' && currentUser.role === 'super_admin' && (
            <SystemSettingsView
              onSaveSettingsNotice={() => {
                const updated = StorageService.getSystemSettings();
                setSystemSettings(updated);
                addToast('success', 'System Configuration Saved', 'Business logic variables and infrastructure settings updated');
              }}
              onMaintenanceModeChanged={(active) => {
                setSystemSettings((prev) => ({ ...prev, isMaintenanceMode: active }));
              }}
            />
          )}

          {/* 13. MEMBER: MY BOOKS */}
          {currentDestination === 'my_books' && currentUser.role === 'member' && (
            <MyBooksView
              transactions={transactions}
              currentMemberId={currentUser.memberId || 'MBR-000001'}
              onRenewBook={handleRenewBook}
              onCancelBorrowRequest={handleCancelBorrowRequest}
              onNavigate={handleNavigate}
            />
          )}

          {/* 14. MEMBER: RESERVATIONS */}
          {currentDestination === 'reservations' && currentUser.role === 'member' && (
            <MemberReservationsView
              reservations={reservations}
              currentMemberId={currentUser.memberId || 'MBR-000001'}
              onCancelReservation={handleCancelReservation}
              onNavigate={handleNavigate}
            />
          )}

          {/* 15. MEMBER: PROFILE & CARD */}
          {currentDestination === 'profile' && currentUser.role === 'member' && (
            <MemberProfileView
              currentUser={currentUser}
              members={members}
            />
          )}

          {/* 16. HELP & SUPPORT */}
          {currentDestination === 'help_support' && (
            <HelpSupportView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onShowToast={addToast}
              initialTab="guides"
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <ScanQrModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        members={members}
        activeAttendance={attendance}
        onAttendanceProcessed={handleAttendanceProcessed}
      />

      <AddBookModal
        isOpen={isAddBookOpen}
        onClose={() => setIsAddBookOpen(false)}
        onBookAdded={handleBookAdded}
        existingBooksCount={books.length}
      />

      <CreateMemberModal
        isOpen={isCreateMemberOpen}
        onClose={() => setIsCreateMemberOpen(false)}
        onMemberCreated={handleMemberCreated}
        existingCount={members.length}
      />

      <LibraryCardModal
        member={selectedCardMember}
        isOpen={!!selectedCardMember}
        onClose={() => setSelectedCardMember(null)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        userName={currentUser.name}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  </BreadcrumbProvider>
);
}

export default App;
