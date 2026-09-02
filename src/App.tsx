import { useState, useEffect } from 'react';
import './App.css';
import type {
  User,
  UserRole,
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
  ToastMessage
} from './types';
import { StorageService } from './utils/storage';
import { api } from './services/api';

// Layout & Common
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';

// Dashboards
import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { MemberDashboard } from './components/dashboard/MemberDashboard';

// Core Destination Views
import { BookList } from './components/books/BookList';
import { AddBookModal } from './components/books/AddBookModal';
import { MemberList } from './components/members/MemberList';
import { CreateMemberModal } from './components/members/CreateMemberModal';
import { LibraryCardModal } from './components/members/LibraryCardModal';
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

export function App() {
  // State from Storage
  const [currentUser, setCurrentUser] = useState<User>(() => StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => StorageService.getUsers());
  const [members, setMembers] = useState<Member[]>(() => StorageService.getMembers());
  const [books, setBooks] = useState<Book[]>(() => StorageService.getBooks());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [services] = useState<LibraryServiceItem[]>(() => StorageService.getServices());
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>(() => StorageService.getServiceRecords());
  const [transactions, setTransactions] = useState<CirculationTransaction[]>(() => StorageService.getTransactions());
  const [reservations, setReservations] = useState<BookReservation[]>(() => StorageService.getReservations());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => StorageService.getNotifications());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  // Navigation State
  const [currentDestination, setCurrentDestination] = useState<string>('dashboard');

  // Quick modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddBookOpen, setIsAddBookOpen] = useState<boolean>(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState<boolean>(false);
  const [selectedCardMember, setSelectedCardMember] = useState<Member | null>(null);

  // Non-blocking Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Fetch initial live data from Laravel API backend
  useEffect(() => {
    async function fetchBackendData() {
      try {
        const [backendBooks, backendMembers, backendTx, backendRes, backendAtt, backendLogs, backendNotifs] =
          await Promise.allSettled([
            api.getBooks(),
            api.getMembers(),
            api.getTransactions(),
            api.getReservations(),
            api.getAttendance(),
            api.getAuditLogs(),
            api.getNotifications()
          ]);

        if (backendBooks.status === 'fulfilled' && backendBooks.value.length > 0) {
          setBooks(backendBooks.value);
          StorageService.saveBooks(backendBooks.value);
        }
        if (backendMembers.status === 'fulfilled' && backendMembers.value.length > 0) {
          setMembers(backendMembers.value);
          StorageService.saveMembers(backendMembers.value);
        }
        if (backendTx.status === 'fulfilled' && backendTx.value.length > 0) {
          setTransactions(backendTx.value);
          StorageService.saveTransactions(backendTx.value);
        }
        if (backendRes.status === 'fulfilled' && backendRes.value.length > 0) {
          setReservations(backendRes.value);
          StorageService.saveReservations(backendRes.value);
        }
        if (backendAtt.status === 'fulfilled' && backendAtt.value.length > 0) {
          setAttendance(backendAtt.value);
          StorageService.saveAttendance(backendAtt.value);
        }
        if (backendLogs.status === 'fulfilled' && backendLogs.value.length > 0) {
          setAuditLogs(backendLogs.value);
        }
        if (backendNotifs.status === 'fulfilled' && backendNotifs.value.length > 0) {
          setNotifications(backendNotifs.value);
        }
      } catch (e) {
        console.info('Using local cache until Laravel API connects:', e);
      }
    }
    fetchBackendData();
  }, []);

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

  // Role Switcher Handler
  const handleRoleChange = (newRole: UserRole) => {
    const matchingUser = users.find((u) => u.role === newRole) || {
      id: `usr-${newRole}`,
      name: newRole === 'super_admin' ? 'Eleanor Vance' : newRole === 'admin' ? 'Roberto Gomez' : 'Juan Dela Cruz',
      email: `${newRole}@balingasag.gov.ph`,
      role: newRole,
      status: 'active',
      createdAt: '2025-01-01',
      memberId: newRole === 'member' ? 'MBR-000001' : undefined
    };

    setCurrentUser(matchingUser);
    StorageService.setCurrentUser(matchingUser);
    setCurrentDestination('dashboard');
    addToast('info', `Switched View to ${newRole.replace('_', ' ').toUpperCase()}`, 'Active destination reset to Dashboard');
  };

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

    addToast('success', 'Book Cataloged Successfully', `Generated Accession numbers for ${newBook.copies.length} copies`);
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

  // 2. Members Operations
  const handleMemberCreated = (newMember: Member) => {
    const updated = [newMember, ...members];
    setMembers(updated);
    StorageService.saveMembers(updated);

    StorageService.addAuditLog(
      'MEMBER_REGISTERED',
      'Members',
      `Registered member ${newMember.fullName} (${newMember.memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('success', 'Member Registered', `Digital QR Card created for ${newMember.fullName} (${newMember.memberId})`);
    setSelectedCardMember(newMember);
  };

  const handleToggleMemberStatus = (memberId: string) => {
    const updated = members.map((m) => {
      if (m.id === memberId) {
        const nextStatus = m.status === 'active' ? 'inactive' : 'active';
        return { ...m, status: nextStatus as Member['status'] };
      }
      return m;
    });
    setMembers(updated);
    StorageService.saveMembers(updated);

    const targeted = members.find((m) => m.id === memberId);
    StorageService.addAuditLog(
      'MEMBER_STATUS_CHANGED',
      'Members',
      `Updated member status for ${targeted?.fullName} (${targeted?.memberId})`,
      currentUser.name
    );
    setAuditLogs(StorageService.getAuditLogs());

    addToast('info', 'Member Status Updated');
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
  };

  const handleSaveAttendanceEdit = (updatedRecord: AttendanceRecord, reason: string) => {
    const updated = attendance.map((a) => (a.id === updatedRecord.id ? updatedRecord : a));
    setAttendance(updated);
    StorageService.saveAttendance(updated);

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
  const handleAddAdmin = (newAdmin: User) => {
    const updated = [...users, newAdmin];
    setUsers(updated);
    StorageService.saveUsers(updated);
    addToast('success', 'Administrator Created', `Account created for ${newAdmin.name}`);
  };

  const handleToggleAdminStatus = (userId: string) => {
    const updated = users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as User['status'] };
      }
      return u;
    });
    setUsers(updated);
    StorageService.saveUsers(updated);
    addToast('info', 'Admin Status Updated');
  };

  const handleResetAdminPassword = (userId: string) => {
    const targeted = users.find((u) => u.id === userId);
    addToast('success', 'Password Reset Initiated', `Temporary credential sent to ${targeted?.email}`);
  };

  const handleMarkAllNotifsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
    addToast('info', 'All notifications marked as read');
  };

  const handleMarkSingleNotifRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(updated);
    StorageService.saveNotifications(updated);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to default initial seed?')) {
      StorageService.resetToDefaults();
      window.location.reload();
    }
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

  return (
    <div className="app-container">
      {/* Sidebar - Pure destinations per spec */}
      <Sidebar
        currentRole={currentUser.role}
        currentDestination={currentDestination}
        onNavigate={(dest) => setCurrentDestination(dest)}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main Viewport */}
      <div className="app-main">
        <Header
          currentUser={currentUser}
          currentDestination={currentDestination}
          onNavigate={(dest) => setCurrentDestination(dest)}
          onRoleChange={handleRoleChange}
          onOpenScanner={() => setIsScannerOpen(true)}
          unreadCount={unreadNotifsCount}
          onOpenNotifications={() => setCurrentDestination('notifications')}
          onResetData={handleResetData}
        />

        <main className="content-viewport">
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
                  onNavigate={(dest) => setCurrentDestination(dest)}
                />
              )}

              {currentUser.role === 'admin' && (
                <AdminDashboard
                  books={books}
                  members={members}
                  attendance={attendance}
                  transactions={transactions}
                  serviceRecords={serviceRecords}
                  onNavigate={(dest) => setCurrentDestination(dest)}
                  onOpenAddBook={() => setIsAddBookOpen(true)}
                  onOpenCreateMember={() => setIsCreateMemberOpen(true)}
                  onOpenScanner={() => setIsScannerOpen(true)}
                />
              )}

              {currentUser.role === 'member' && (
                <MemberDashboard
                  currentUser={currentUser}
                  members={members}
                  transactions={transactions}
                  reservations={reservations}
                  attendance={attendance}
                  notifications={notifications}
                  onNavigate={(dest) => setCurrentDestination(dest)}
                  onOpenCardModal={(m) => setSelectedCardMember(m)}
                />
              )}
            </>
          )}

          {/* 2. BOOKS / BOOK CATALOG */}
          {currentDestination === 'books' && (
            <BookList
              books={books}
              userRole={currentUser.role}
              onBookAdded={handleBookAdded}
              onAddCopy={handleAddPhysicalCopy}
              onReserveBook={handleReserveBook}
              onRequestBorrow={handleRequestBorrow}
            />
          )}

          {/* 3. MEMBERS */}
          {currentDestination === 'members' && (
            <MemberList
              members={members}
              userRole={currentUser.role}
              onMemberCreated={handleMemberCreated}
              onToggleStatus={handleToggleMemberStatus}
            />
          )}

          {/* 4. ATTENDANCE */}
          {currentDestination === 'attendance' && (
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
          {currentDestination === 'circulation' && (
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
          {currentDestination === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
              onMarkAllAsRead={handleMarkAllNotifsRead}
              onMarkSingleAsRead={handleMarkSingleNotifRead}
            />
          )}

          {/* 8. HISTORY */}
          {currentDestination === 'history' && (
            <HistoryView
              transactions={transactions}
              attendance={attendance}
              services={serviceRecords}
              userRole={currentUser.role}
              currentMemberId={currentUser.memberId}
            />
          )}

          {/* 9. REPORTS */}
          {currentDestination === 'reports' && (
            <ReportsView
              books={books}
              members={members}
              attendance={attendance}
              transactions={transactions}
              serviceRecords={serviceRecords}
              onTriggerExport={handleTriggerExport}
            />
          )}

          {/* 10. SUPER ADMIN: ADMIN MANAGEMENT */}
          {currentDestination === 'admin_mgmt' && currentUser.role === 'super_admin' && (
            <AdminManagementView
              users={users}
              onAddAdmin={handleAddAdmin}
              onToggleAdminStatus={handleToggleAdminStatus}
              onResetAdminPassword={handleResetAdminPassword}
            />
          )}

          {/* 11. SUPER ADMIN / ADMIN: AUDIT LOGS */}
          {currentDestination === 'audit_logs' && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {/* 12. SUPER ADMIN: SYSTEM SETTINGS */}
          {currentDestination === 'system_settings' && currentUser.role === 'super_admin' && (
            <SystemSettingsView
              onSaveSettingsNotice={() => addToast('success', 'Configuration Saved', 'Policies and LLM API endpoint updated')}
            />
          )}

          {/* 13. MEMBER: MY BOOKS */}
          {currentDestination === 'my_books' && currentUser.role === 'member' && (
            <MyBooksView
              transactions={transactions}
              currentMemberId={currentUser.memberId || 'MBR-000001'}
              onRenewBook={handleRenewBook}
              onCancelBorrowRequest={handleCancelBorrowRequest}
              onNavigate={(dest) => setCurrentDestination(dest)}
            />
          )}

          {/* 14. MEMBER: RESERVATIONS */}
          {currentDestination === 'reservations' && currentUser.role === 'member' && (
            <MemberReservationsView
              reservations={reservations}
              currentMemberId={currentUser.memberId || 'MBR-000001'}
              onCancelReservation={handleCancelReservation}
              onNavigate={(dest) => setCurrentDestination(dest)}
            />
          )}

          {/* 15. MEMBER: PROFILE & CARD */}
          {currentDestination === 'profile' && currentUser.role === 'member' && (
            <MemberProfileView
              currentUser={currentUser}
              members={members}
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}

export default App;
