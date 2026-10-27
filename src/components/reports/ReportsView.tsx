import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  Book,
  Member,
  AttendanceRecord,
  CirculationTransaction,
  ServiceRecord,
  AuditLog,
  User
} from '../../types';
import {
  Printer,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  UserCheck,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
  Sparkles,
  TrendingUp,
  Download,
  Building2,
  BadgeAlert,
  Archive,
  BarChart3
} from 'lucide-react';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';
import { useTheme } from '../../context/ThemeContext';
import { ReportsSkeleton } from '../common/skeleton';
import { api } from '../../services/api';
import * as XLSX from 'xlsx';

interface ReportsViewProps {
  books: Book[];
  members: Member[];
  attendance: AttendanceRecord[];
  transactions: CirculationTransaction[];
  serviceRecords: ServiceRecord[];
  isLoading?: boolean;
  currentUser?: User;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

type ReportTab = 'overview' | 'attendance' | 'books' | 'overdue' | 'activity';

export const ReportsView: React.FC<ReportsViewProps> = ({
  books: initialBooks,
  members: initialMembers,
  attendance: initialAttendance,
  transactions: initialTransactions,
  isLoading: initialLoading = false,
  currentUser,
  onShowToast
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Dynamic Breadcrumb synchronization
  const { setSubTrail, clearSubTrail } = useBreadcrumbs();

  useEffect(() => {
    const reportLabels: Record<ReportTab, string> = {
      overview: 'Executive Summary',
      attendance: 'Attendance Reports',
      books: 'Book Inventory Reports',
      overdue: 'Overdue Book Reports',
      activity: 'System Activity Reports'
    };
    if (activeTab && reportLabels[activeTab]) {
      setSubTrail([{ label: reportLabels[activeTab], current: true }]);
    } else {
      setSubTrail([]);
    }

    return () => {
      clearSubTrail();
    };
  }, [activeTab, setSubTrail, clearSubTrail]);

  // Escape key listener for PDF preview modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrintModal) {
        setShowPrintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrintModal]);

  // Default Dates
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const firstDayOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  // -------------------------------------------------------------
  // TAB 1: EXECUTIVE SUMMARY STATE
  // -------------------------------------------------------------
  const [execPeriod, setExecPeriod] = useState<string>('this_month');
  const [execStartDate, setExecStartDate] = useState<string>(firstDayOfMonth);
  const [execEndDate, setExecEndDate] = useState<string>(todayStr);
  const [execData, setExecData] = useState<{
    period_label: string;
    start_date: string;
    end_date: string;
    metrics: {
      total_members: { current: number; active: number; new_in_period: number; previous_new: number; growth: number };
      book_inventory: { total_titles: number; total_copies: number; available_copies: number; borrowed_copies: number; utilization_rate: number };
      attendance: { current: number; previous: number; growth: number; unique_visitors: number };
      circulation: {
        borrows_current: number;
        borrows_previous: number;
        borrows_growth: number;
        returns_current: number;
        returns_previous: number;
        active_loans: number;
        overdue_loans: number;
        overdue_rate: number;
      };
    };
    generated_at: string;
  } | null>(null);

  // -------------------------------------------------------------
  // TAB 2: ATTENDANCE REPORT STATE
  // -------------------------------------------------------------
  const [attStartDate, setAttStartDate] = useState<string>(firstDayOfMonth);
  const [attEndDate, setAttEndDate] = useState<string>(todayStr);
  const [attMemberSearch, setAttMemberSearch] = useState<string>('');
  const [attStatusFilter, setAttStatusFilter] = useState<'all' | 'inside' | 'completed'>('all');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendance || []);
  const [attSummary, setAttSummary] = useState({
    total_records: initialAttendance.length,
    unique_visitors: new Set(initialAttendance.map((a) => a.memberId)).size,
    currently_inside: initialAttendance.filter((a) => !a.timeOut || a.status === 'Inside').length,
    completed_visits: initialAttendance.filter((a) => a.timeOut && a.status !== 'Inside').length
  });

  // -------------------------------------------------------------
  // TAB 3: BOOK INVENTORY REPORT STATE
  // -------------------------------------------------------------
  const [invSearch, setInvSearch] = useState<string>('');
  const [invCategory, setInvCategory] = useState<string>('all');
  const [invStatus, setInvStatus] = useState<string>('all');
  const [inventoryBooks, setInventoryBooks] = useState<Book[]>(initialBooks || []);
  const [invSummary, setInvSummary] = useState({
    total_titles: initialBooks.length,
    active_titles: initialBooks.filter((b) => !b.isArchived).length,
    archived_titles: initialBooks.filter((b) => b.isArchived).length,
    total_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.length || 0), 0),
    available_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Available').length || 0), 0),
    borrowed_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Borrowed').length || 0), 0),
    reserved_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Reserved').length || 0), 0),
    archived_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Archived').length || 0), 0),
    damaged_or_lost_copies: initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Lost' || c.status === 'Under Repair').length || 0), 0)
  });
  const [invCategories, setInvCategories] = useState<Record<string, number>>({});

  // -------------------------------------------------------------
  // TAB 4: OVERDUE REPORT STATE
  // -------------------------------------------------------------
  const [overdueSearch, setOverdueSearch] = useState<string>('');
  const [overdueBracket, setOverdueBracket] = useState<string>('all');
  const [overdueStartDate, setOverdueStartDate] = useState<string>('');
  const [overdueEndDate, setOverdueEndDate] = useState<string>('');
  const [overdueRecords, setOverdueRecords] = useState<Array<{
    id: string;
    transaction_id: string;
    member_id: string;
    member_name: string;
    book_title: string;
    book_author?: string;
    barcode: string;
    accession_number: string;
    borrow_date: string;
    due_date: string;
    overdue_days: number;
    fine_rate: number;
    estimated_fine: number;
    processed_by: string;
    status: string;
  }>>([]);
  const [overdueSummary, setOverdueSummary] = useState({
    total_overdue: 0,
    unique_patrons: 0,
    total_estimated_fines: 0,
    longest_overdue_days: 0
  });

  // -------------------------------------------------------------
  // TAB 5: SYSTEM ACTIVITY / AUDIT LOG REPORT STATE
  // -------------------------------------------------------------
  const [actStartDate, setActStartDate] = useState<string>(firstDayOfMonth);
  const [actEndDate, setActEndDate] = useState<string>(todayStr);
  const [actUser, setActUser] = useState<string>('all');
  const [actCategory, setActCategory] = useState<string>('all');
  const [actSearch, setActSearch] = useState<string>('');
  const [activityRecords, setActivityRecords] = useState<AuditLog[]>([]);
  const [activitySummary, setActivitySummary] = useState({
    total_activities: 0,
    unique_users: [] as string[],
    module_breakdown: {} as Record<string, number>
  });

  // Pagination State (Shared per table)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 20;

  // Reset pagination when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, attStartDate, attEndDate, attStatusFilter, invCategory, invStatus, overdueBracket, actCategory, actUser]);

  // -------------------------------------------------------------
  // API LOADERS
  // -------------------------------------------------------------
  const fetchExecutiveSummary = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await api.getExecutiveSummaryReport({
        period: execPeriod,
        start_date: execPeriod === 'custom' ? execStartDate : undefined,
        end_date: execPeriod === 'custom' ? execEndDate : undefined
      });
      setExecData(res);
    } catch (err) {
      console.warn('Fallback calculating executive summary:', err);
      // Client-side fallback from props
      const totalCopies = initialBooks.reduce((sum, b) => sum + (b.copies?.length || 0), 0);
      const borrowedCopies = initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Borrowed').length || 0), 0);
      const availableCopies = initialBooks.reduce((sum, b) => sum + (b.copies?.filter((c) => c.status === 'Available').length || 0), 0);
      const activeOverdue = initialTransactions.filter((t) => t.status === 'Overdue');
      setExecData({
        period_label: 'Current Library Records',
        start_date: execStartDate,
        end_date: execEndDate,
        metrics: {
          total_members: {
            current: initialMembers.length,
            active: initialMembers.filter((m) => m.status === 'active').length,
            new_in_period: initialMembers.length,
            previous_new: 0,
            growth: 0
          },
          book_inventory: {
            total_titles: initialBooks.length,
            total_copies: totalCopies,
            available_copies: availableCopies,
            borrowed_copies: borrowedCopies,
            utilization_rate: totalCopies > 0 ? Math.round((borrowedCopies / totalCopies) * 100) : 0
          },
          attendance: {
            current: initialAttendance.length,
            previous: 0,
            growth: 0,
            unique_visitors: new Set(initialAttendance.map((a) => a.memberId)).size
          },
          circulation: {
            borrows_current: initialTransactions.length,
            borrows_previous: 0,
            borrows_growth: 0,
            returns_current: initialTransactions.filter((t) => t.status === 'Returned').length,
            returns_previous: 0,
            active_loans: initialTransactions.filter((t) => t.status === 'Active' || t.status === 'Overdue').length,
            overdue_loans: activeOverdue.length,
            overdue_rate: initialTransactions.length > 0 ? Math.round((activeOverdue.length / initialTransactions.length) * 100) : 0
          }
        },
        generated_at: new Date().toISOString()
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [execPeriod, execStartDate, execEndDate, initialBooks, initialMembers, initialAttendance, initialTransactions]);

  const fetchAttendanceReport = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await api.getAttendanceReport({
        start_date: attStartDate || undefined,
        end_date: attEndDate || undefined,
        member: attMemberSearch || undefined,
        status: attStatusFilter !== 'all' ? attStatusFilter : undefined
      });
      setAttendanceRecords(res.records || []);
      setAttSummary(res.summary);
    } catch (err) {
      console.warn('Fallback attendance records:', err);
      // Filter locally
      let filtered = [...initialAttendance];
      if (attStartDate) filtered = filtered.filter((a) => a.date >= attStartDate);
      if (attEndDate) filtered = filtered.filter((a) => a.date <= attEndDate);
      if (attMemberSearch) {
        const s = attMemberSearch.toLowerCase();
        filtered = filtered.filter((a) => a.memberName.toLowerCase().includes(s) || a.memberId.toLowerCase().includes(s));
      }
      if (attStatusFilter === 'inside') {
        filtered = filtered.filter((a) => !a.timeOut || a.status === 'Inside');
      } else if (attStatusFilter === 'completed') {
        filtered = filtered.filter((a) => a.timeOut && a.status !== 'Inside');
      }
      setAttendanceRecords(filtered);
      setAttSummary({
        total_records: filtered.length,
        unique_visitors: new Set(filtered.map((a) => a.memberId)).size,
        currently_inside: filtered.filter((a) => !a.timeOut || a.status === 'Inside').length,
        completed_visits: filtered.filter((a) => a.timeOut && a.status !== 'Inside').length
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [attStartDate, attEndDate, attMemberSearch, attStatusFilter, initialAttendance]);

  const fetchInventoryReport = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await api.getInventoryReport({
        search: invSearch || undefined,
        category: invCategory !== 'all' ? invCategory : undefined,
        status: invStatus !== 'all' ? invStatus : undefined
      });
      setInventoryBooks(res.books || []);
      setInvSummary(res.summary);
      setInvCategories(res.categories || {});
    } catch (err) {
      console.warn('Fallback inventory records:', err);
      let filtered = [...initialBooks];
      if (invCategory !== 'all') filtered = filtered.filter((b) => b.category === invCategory);
      if (invSearch) {
        const s = invSearch.toLowerCase();
        filtered = filtered.filter(
          (b) =>
            b.title.toLowerCase().includes(s) ||
            b.author.toLowerCase().includes(s) ||
            b.isbn.toLowerCase().includes(s) ||
            b.classification?.toLowerCase().includes(s)
        );
      }
      if (invStatus === 'Archived') {
        filtered = filtered.filter((b) => b.isArchived);
      } else if (invStatus !== 'all') {
        filtered = filtered.filter((b) => !b.isArchived && b.copies.some((c) => c.status === invStatus));
      }
      setInventoryBooks(filtered);
    } finally {
      setIsDataLoading(false);
    }
  }, [invSearch, invCategory, invStatus, initialBooks]);

  const fetchOverdueReport = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await api.getOverdueReport({
        start_date: overdueStartDate || undefined,
        end_date: overdueEndDate || undefined,
        search: overdueSearch || undefined,
        bracket: overdueBracket !== 'all' ? overdueBracket : undefined
      });
      setOverdueRecords(res.records || []);
      setOverdueSummary(res.summary);
    } catch (err) {
      console.warn('Fallback overdue records:', err);
      // Local fallback calculation
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const items = initialTransactions
        .filter((t) => (t.status === 'Active' || t.status === 'Overdue' || t.status === 'Renewed') && !t.returnDate)
        .map((t) => {
          const due = new Date(t.dueDate);
          due.setHours(0, 0, 0, 0);
          const diff = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
          const isOverdue = diff > 0 || t.status === 'Overdue';
          const overdueDays = Math.max(0, diff);
          const fine = overdueDays * 5;
          return {
            id: t.id,
            transaction_id: t.id,
            member_id: t.memberId,
            member_name: t.memberName,
            book_title: t.bookTitle,
            book_author: t.bookAuthor,
            barcode: t.barcode,
            accession_number: t.accessionNumber,
            borrow_date: t.borrowDate,
            due_date: t.dueDate,
            overdue_days: overdueDays,
            fine_rate: 5,
            estimated_fine: fine,
            processed_by: t.processedBy || 'Staff',
            status: isOverdue ? 'Overdue' : t.status
          };
        })
        .filter((t) => t.overdue_days > 0);

      setOverdueRecords(items);
      setOverdueSummary({
        total_overdue: items.length,
        unique_patrons: new Set(items.map((i) => i.member_id)).size,
        total_estimated_fines: items.reduce((sum, i) => sum + i.estimated_fine, 0),
        longest_overdue_days: items.length > 0 ? Math.max(...items.map((i) => i.overdue_days)) : 0
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [overdueStartDate, overdueEndDate, overdueSearch, overdueBracket, initialTransactions]);

  const fetchActivityLogsReport = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const res = await api.getActivityLogsReport({
        start_date: actStartDate || undefined,
        end_date: actEndDate || undefined,
        user: actUser !== 'all' ? actUser : undefined,
        category: actCategory !== 'all' ? actCategory : undefined,
        search: actSearch || undefined
      });
      setActivityRecords(res.records || []);
      setActivitySummary(res.summary);
    } catch (err) {
      console.warn('Activity logs API error:', err);
      setActivityRecords([]);
      setActivitySummary({ total_activities: 0, unique_users: [], module_breakdown: {} });
    } finally {
      setIsDataLoading(false);
    }
  }, [actStartDate, actEndDate, actUser, actCategory, actSearch]);

  // Load report data when tab changes or primary filters trigger
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchExecutiveSummary();
    } else if (activeTab === 'attendance') {
      fetchAttendanceReport();
    } else if (activeTab === 'books') {
      fetchInventoryReport();
    } else if (activeTab === 'overdue') {
      fetchOverdueReport();
    } else if (activeTab === 'activity') {
      fetchActivityLogsReport();
    }
  }, [activeTab, fetchExecutiveSummary, fetchAttendanceReport, fetchInventoryReport, fetchOverdueReport, fetchActivityLogsReport]);

  // -------------------------------------------------------------
  // EXCEL EXPORT HANDLER (FR19.2)
  // -------------------------------------------------------------
  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      const currentStaffName = currentUser?.fullName || currentUser?.name || 'Authorized Library Staff';

      if (activeTab === 'attendance') {
        const titleRow = ['BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER'];
        const subTitle = ['OFFICIAL PATRON ATTENDANCE REPORT'];
        const metaRow = [`Reporting Period: ${attStartDate || 'All'} to ${attEndDate || 'Current'}`, `Generated: ${timestamp}`, `Generated By: ${currentStaffName}`];
        const summaryHeader = ['Total Attendance Visits', 'Unique Visitors', 'Currently Inside / Incomplete', 'Completed Sessions'];
        const summaryData = [attSummary.total_records, attSummary.unique_visitors, attSummary.currently_inside, attSummary.completed_visits];
        const blankRow = [];
        const tableHeaders = ['Log ID', 'Date', 'Member Name', 'Member ID', 'Membership Type', 'Time-In', 'Time-Out', 'Duration', 'Status'];

        const dataRows = attendanceRecords.map((r) => [
          r.id,
          r.date,
          r.memberName,
          r.memberId,
          r.membershipType || 'Standard',
          r.timeIn || '—',
          r.timeOut || 'Incomplete (Inside)',
          r.duration || '—',
          r.status || (r.timeOut ? 'Completed' : 'Inside')
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          titleRow,
          subTitle,
          metaRow,
          blankRow,
          ['--- EXECUTIVE ATTENDANCE SUMMARY ---'],
          summaryHeader,
          summaryData,
          blankRow,
          ['--- DETAILED ATTENDANCE LOG RECORDS ---'],
          tableHeaders,
          ...dataRows
        ]);

        ws['!cols'] = [
          { wch: 10 }, { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 14 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Report');
        const filename = `Attendance_Report_${attStartDate || 'all'}_to_${attEndDate || todayStr}.xlsx`;
        XLSX.writeFile(wb, filename);

      } else if (activeTab === 'books') {
        const titleRow = ['BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER'];
        const subTitle = ['OFFICIAL BOOK INVENTORY & COLLECTION REPORT'];
        const metaRow = [`Catalog Filter: Category [${invCategory}], Status [${invStatus}]`, `Generated: ${timestamp}`, `Generated By: ${currentStaffName}`];
        const summaryHeader = ['Total Titles', 'Total Copies', 'Available Copies', 'Borrowed Copies', 'Reserved', 'Archived', 'Damaged/Lost'];
        const summaryData = [
          invSummary.total_titles,
          invSummary.total_copies,
          invSummary.available_copies,
          invSummary.borrowed_copies,
          invSummary.reserved_copies,
          invSummary.archived_copies,
          invSummary.damaged_or_lost_copies
        ];
        const blankRow = [];
        const tableHeaders = ['Book Title', 'Author', 'ISBN', 'Dewey Classification', 'Category', 'Publisher', 'Year', 'Total Copies', 'Shelf Location', 'Catalog Status'];

        const dataRows = inventoryBooks.map((b) => [
          b.title,
          b.author,
          b.isbn,
          b.classification || '—',
          b.category,
          b.publisher || '—',
          b.publicationYear || '—',
          b.copies?.length || 0,
          b.copies?.map((c) => c.shelfLocation).filter(Boolean).join(', ') || 'General Stacks',
          b.isArchived ? 'Archived' : (b.copies?.some((c) => c.status === 'Available') ? 'Available' : 'Borrowed / Checked Out')
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          titleRow,
          subTitle,
          metaRow,
          blankRow,
          ['--- COLLECTION INVENTORY SUMMARY ---'],
          summaryHeader,
          summaryData,
          blankRow,
          ['--- DETAILED BOOK RECORDS ---'],
          tableHeaders,
          ...dataRows
        ]);

        ws['!cols'] = [
          { wch: 34 }, { wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 16 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Book_Inventory');
        const filename = `Book_Inventory_Report_${todayStr}.xlsx`;
        XLSX.writeFile(wb, filename);

      } else if (activeTab === 'overdue') {
        const titleRow = ['BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER'];
        const subTitle = ['OFFICIAL OVERDUE CIRCULATION & RECOVERY REPORT'];
        const metaRow = [`Bracket Filter: [${overdueBracket}]`, `Generated: ${timestamp}`, `Generated By: ${currentStaffName}`];
        const summaryHeader = ['Total Overdue Loans', 'Patrons Requiring Follow-up', 'Total Estimated Fines (PHP)', 'Longest Overdue (Days)'];
        const summaryData = [
          overdueSummary.total_overdue,
          overdueSummary.unique_patrons,
          `PHP ${overdueSummary.total_estimated_fines.toFixed(2)}`,
          `${overdueSummary.longest_overdue_days} days`
        ];
        const blankRow = [];
        const tableHeaders = ['Transaction ID', 'Patron Name', 'Member ID', 'Book Title', 'Barcode / Accession', 'Borrow Date', 'Due Date', 'Days Overdue', 'Daily Fine Rate (PHP)', 'Estimated Fine (PHP)', 'Processed By'];

        const dataRows = overdueRecords.map((r) => [
          r.transaction_id,
          r.member_name,
          r.member_id,
          r.book_title,
          r.barcode || r.accession_number,
          r.borrow_date,
          r.due_date,
          r.overdue_days,
          r.fine_rate.toFixed(2),
          r.estimated_fine.toFixed(2),
          r.processed_by || 'Staff'
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          titleRow,
          subTitle,
          metaRow,
          blankRow,
          ['--- OVERDUE SUMMARY ---'],
          summaryHeader,
          summaryData,
          blankRow,
          ['--- UNRETURNED OVERDUE ITEMS REQUIRING FOLLOW-UP ---'],
          tableHeaders,
          ...dataRows
        ]);

        ws['!cols'] = [
          { wch: 16 }, { wch: 26 }, { wch: 16 }, { wch: 32 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Overdue_Loans');
        const filename = `Overdue_Loans_Report_${todayStr}.xlsx`;
        XLSX.writeFile(wb, filename);

      } else if (activeTab === 'activity') {
        const titleRow = ['BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER'];
        const subTitle = ['SYSTEM ACTIVITY & GOVERNANCE AUDIT LOG REPORT'];
        const metaRow = [`Module: [${actCategory}], User: [${actUser}]`, `Generated: ${timestamp}`, `Generated By: ${currentStaffName}`];
        const summaryHeader = ['Total Activities Logged', 'Active Staff Users', 'Date Range'];
        const summaryData = [
          activitySummary.total_activities,
          activitySummary.unique_users.length,
          `${actStartDate || 'Beginning'} to ${actEndDate || todayStr}`
        ];
        const blankRow = [];
        const tableHeaders = ['Log ID', 'Timestamp', 'Performed By', 'Module / Category', 'Action Description', 'Detailed Parameters / Affected ID', 'IP Address'];

        const dataRows = activityRecords.map((r) => [
          r.id,
          new Date(r.timestamp || (r as any).created_at).toLocaleString(),
          r.performedBy || (r as any).performed_by || 'System',
          r.category,
          r.action,
          r.details,
          r.ipAddress || (r as any).ip_address || '127.0.0.1'
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
          titleRow,
          subTitle,
          metaRow,
          blankRow,
          ['--- AUDIT GOVERNANCE SUMMARY ---'],
          summaryHeader,
          summaryData,
          blankRow,
          ['--- RECORDED SYSTEM ACTIVITIES ---'],
          tableHeaders,
          ...dataRows
        ]);

        ws['!cols'] = [
          { wch: 8 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 26 }, { wch: 45 }, { wch: 16 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'System_Activity');
        const filename = `System_Activity_Report_${todayStr}.xlsx`;
        XLSX.writeFile(wb, filename);

      } else {
        // Executive Summary
        const titleRow = ['BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER'];
        const subTitle = ['EXECUTIVE OPERATIONS SUMMARY REPORT'];
        const metaRow = [`Reporting Period: ${execData?.period_label || execPeriod}`, `Generated: ${timestamp}`, `Generated By: ${currentStaffName}`];
        const blankRow = [];
        const kpiHeader = ['Core Indicator', 'Current Period', 'Previous Period / Reference', 'Trend / Growth Rate'];
        const kpiRows = [
          ['Total Registered Members', execData?.metrics.total_members.current || 0, `${execData?.metrics.total_members.active || 0} Active`, '—'],
          ['New Members Registered in Period', execData?.metrics.total_members.new_in_period || 0, execData?.metrics.total_members.previous_new || 0, `${execData?.metrics.total_members.growth || 0}%`],
          ['Total Book Titles in Catalog', execData?.metrics.book_inventory.total_titles || 0, '—', '—'],
          ['Total Physical Book Copies', execData?.metrics.book_inventory.total_copies || 0, `${execData?.metrics.book_inventory.available_copies || 0} Available`, `${execData?.metrics.book_inventory.utilization_rate || 0}% Borrowed`],
          ['Patron Attendance Visits', execData?.metrics.attendance.current || 0, execData?.metrics.attendance.previous || 0, `${execData?.metrics.attendance.growth || 0}%`],
          ['Unique Individual Visitors', execData?.metrics.attendance.unique_visitors || 0, '—', '—'],
          ['Borrowing Checkouts Issued', execData?.metrics.circulation.borrows_current || 0, execData?.metrics.circulation.borrows_previous || 0, `${execData?.metrics.circulation.borrows_growth || 0}%`],
          ['Book Returns Restocked', execData?.metrics.circulation.returns_current || 0, execData?.metrics.circulation.returns_previous || 0, '—'],
          ['Currently Active Loans', execData?.metrics.circulation.active_loans || 0, '—', '—'],
          ['Overdue Loans Requiring Follow-up', execData?.metrics.circulation.overdue_loans || 0, '—', `${execData?.metrics.circulation.overdue_rate || 0}% Overdue Rate`]
        ];

        const ws = XLSX.utils.aoa_to_sheet([
          titleRow,
          subTitle,
          metaRow,
          blankRow,
          ['--- EXECUTIVE OPERATIONS KPIS ---'],
          kpiHeader,
          ...kpiRows
        ]);

        ws['!cols'] = [
          { wch: 36 }, { wch: 18 }, { wch: 28 }, { wch: 22 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Executive_Summary');
        const filename = `Executive_Summary_Report_${todayStr}.xlsx`;
        XLSX.writeFile(wb, filename);
      }

      if (onShowToast) {
        onShowToast('success', 'Excel Spreadsheet Exported', 'Report file has been saved to your downloads.');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      if (onShowToast) {
        onShowToast('error', 'Export Failed', 'An error occurred while compiling the Excel file.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // -------------------------------------------------------------
  // PRINT / PDF PREVIEW TRIGGER (FR19.1)
  // -------------------------------------------------------------
  const handleOpenPrintPreview = () => {
    setShowPrintModal(true);
  };

  const handlePrintExecution = () => {
    window.print();
  };

  // Get active dataset slice for pagination
  const activeDatasetLength = useMemo(() => {
    if (activeTab === 'attendance') return attendanceRecords.length;
    if (activeTab === 'books') return inventoryBooks.length;
    if (activeTab === 'overdue') return overdueRecords.length;
    if (activeTab === 'activity') return activityRecords.length;
    return 0;
  }, [activeTab, attendanceRecords, inventoryBooks, overdueRecords, activityRecords]);

  const totalPages = Math.max(1, Math.ceil(activeDatasetLength / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, activeDatasetLength);

  const paginatedAttendance = useMemo(() => attendanceRecords.slice(startIndex, endIndex), [attendanceRecords, startIndex, endIndex]);
  const paginatedBooks = useMemo(() => inventoryBooks.slice(startIndex, endIndex), [inventoryBooks, startIndex, endIndex]);
  const paginatedOverdue = useMemo(() => overdueRecords.slice(startIndex, endIndex), [overdueRecords, startIndex, endIndex]);
  const paginatedActivity = useMemo(() => activityRecords.slice(startIndex, endIndex), [activityRecords, startIndex, endIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Statistical Reports & Operational Analytics</span>
            <span
              style={{
                fontSize: '11.5px',
                padding: '3px 9px',
                borderRadius: '999px',
                backgroundColor: 'var(--light-green)',
                color: 'var(--brand-forest)',
                fontWeight: 700,
                border: '1px solid var(--light-green-border)'
              }}
            >
              Official Module
            </span>
          </div>
          <div className="page-subtitle">
            Generate, analyze, filter, print, and export official Balingasag Public Library documentation
          </div>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting || isDataLoading}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px', fontWeight: 600 }}
            title="Export report in Microsoft Excel (.xlsx) format"
          >
            <FileSpreadsheet size={15} color="#166534" />
            <span>{isExporting ? 'Compiling Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenPrintPreview}
            disabled={isDataLoading}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px', fontWeight: 600 }}
            title="Preview formatted document and Print / Save as PDF"
          >
            <Printer size={15} />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* 5 Core Report Tabs Navigation (FR18) */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-main)', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'overview' as ReportTab, label: 'Executive Summary', icon: Sparkles },
          { id: 'attendance' as ReportTab, label: 'Attendance Reports', icon: UserCheck, count: attendanceRecords.length },
          { id: 'books' as ReportTab, label: 'Book Inventory', icon: BookOpen, count: inventoryBooks.length },
          { id: 'overdue' as ReportTab, label: 'Overdue Books', icon: BadgeAlert, count: overdueRecords.length, isAlert: overdueRecords.length > 0 },
          { id: 'activity' as ReportTab, label: 'System Activity Logs', icon: ShieldCheck, count: activityRecords.length }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={`btn btn-ghost ${isActive ? 'active' : ''}`}
              style={{
                borderBottom: isActive ? '2px solid var(--brand-forest, #166534)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--brand-forest, #166534)' : 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                whiteSpace: 'nowrap'
              }}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '999px',
                    backgroundColor: tab.isAlert
                      ? (isDark ? 'rgba(239, 68, 68, 0.25)' : '#FEE2E2')
                      : (isDark ? 'rgba(255,255,255,0.1)' : '#F1F5F9'),
                    color: tab.isAlert ? '#EF4444' : 'inherit',
                    fontWeight: 700
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: EXECUTIVE SUMMARY (FR18.4)
          ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Executive Period Filter Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Calendar size={16} />
                <span>Reporting Scope:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'this_quarter', label: 'This Quarter' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setExecPeriod(p.id)}
                    type="button"
                    className="btn btn-sm"
                    style={{
                      fontSize: '12px',
                      backgroundColor: execPeriod === p.id ? 'var(--brand-forest, #166534)' : 'transparent',
                      color: execPeriod === p.id ? '#ffffff' : 'var(--text-secondary)',
                      border: execPeriod === p.id ? 'none' : '1px solid var(--border-main)'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {execPeriod === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={execStartDate}
                  onChange={(e) => setExecStartDate(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 8px', width: 'auto' }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>to</span>
                <input
                  type="date"
                  value={execEndDate}
                  onChange={(e) => setExecEndDate(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '12px', padding: '4px 8px', width: 'auto' }}
                />
                <button type="button" onClick={fetchExecutiveSummary} className="btn btn-primary btn-sm" style={{ padding: '4px 10px', fontSize: '12px' }}>
                  Apply
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={fetchExecutiveSummary}
              className="btn btn-ghost btn-sm"
              style={{ gap: '6px', fontSize: '12px' }}
              title="Refresh summary data from database"
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Core Performance Indicator Cards (Real DB Metrics) */}
          <div className="stats-grid">
            {/* Card 1: Members */}
            <div className="stat-card">
              <span className="stat-label">Registered Members</span>
              <div className="stat-value">{execData?.metrics.total_members.current ?? initialMembers.length}</div>
              <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{execData?.metrics.total_members.active ?? initialMembers.filter((m) => m.status === 'active').length} Active Accounts</span>
                {execData && execData.metrics.total_members.growth !== 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: execData.metrics.total_members.growth >= 0 ? '#10B981' : '#EF4444' }}>
                    {execData.metrics.total_members.growth > 0 ? `+${execData.metrics.total_members.growth}%` : `${execData.metrics.total_members.growth}%`}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Book Inventory */}
            <div className="stat-card">
              <span className="stat-label">Book Collection</span>
              <div className="stat-value">{execData?.metrics.book_inventory.total_titles ?? initialBooks.length}</div>
              <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{execData?.metrics.book_inventory.total_copies ?? initialBooks.reduce((sum, b) => sum + b.copies.length, 0)} Copies Registered</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7' }}>
                  {execData?.metrics.book_inventory.available_copies ?? 0} Available
                </span>
              </div>
            </div>

            {/* Card 3: Attendance */}
            <div className="stat-card">
              <span className="stat-label">Attendance in Period</span>
              <div className="stat-value">{execData?.metrics.attendance.current ?? initialAttendance.length}</div>
              <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{execData?.metrics.attendance.unique_visitors ?? new Set(initialAttendance.map((a) => a.memberId)).size} Unique Visitors</span>
                {execData && execData.metrics.attendance.growth !== 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 700, color: execData.metrics.attendance.growth >= 0 ? '#10B981' : '#EF4444' }}>
                    {execData.metrics.attendance.growth > 0 ? `+${execData.metrics.attendance.growth}%` : `${execData.metrics.attendance.growth}%`}
                  </span>
                )}
              </div>
            </div>

            {/* Card 4: Circulation & Overdue */}
            <div className="stat-card">
              <span className="stat-label">Active Loans & Overdue</span>
              <div className="stat-value" style={{ color: (execData?.metrics.circulation.overdue_loans ?? 0) > 0 ? 'var(--danger)' : 'var(--brand-forest)' }}>
                {execData?.metrics.circulation.active_loans ?? 0}
              </div>
              <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{execData?.metrics.circulation.borrows_current ?? 0} Checked Out</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: (execData?.metrics.circulation.overdue_loans ?? 0) > 0 ? '#EF4444' : '#10B981' }}>
                  {execData?.metrics.circulation.overdue_loans ?? 0} Overdue ({execData?.metrics.circulation.overdue_rate ?? 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Operational Overview Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Category Breakdown */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Collection Category Distribution</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{initialBooks.length} Total Titles</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(
                  initialBooks.reduce((acc, b) => {
                    acc[b.category] = (acc[b.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([category, count]) => {
                  const pct = Math.round((count / (initialBooks.length || 1)) * 100);
                  return (
                    <div key={category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                        <span>{category}</span>
                        <strong>{count} titles ({pct}%)</strong>
                      </div>
                      <div style={{ height: '7px', width: '100%', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: 'var(--brand-forest, #166534)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Attendance & Session Verification Flow */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Attendance Engagement Breakdown</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{attSummary.total_records} Total Recorded Visits</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: '1px solid var(--border-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Completed Reading Sessions (Checked Out):</span>
                    <strong style={{ color: '#10B981' }}>{attSummary.completed_visits}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Patrons with full time-in and time-out logged via Library QR Scanner
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: '1px solid var(--border-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Incomplete Records / Currently Inside:</span>
                    <strong style={{ color: '#F59E0B' }}>{attSummary.currently_inside}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Active library floor visitors or records with missing time-out timestamps
                  </div>
                </div>

                <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: '1px solid var(--border-main)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Unique Individual Visitors:</span>
                    <strong style={{ color: 'var(--brand-forest)' }}>{attSummary.unique_visitors}</strong>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Distinct patrons logged across the selected reporting interval
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ATTENDANCE REPORTS (FR18.1)
          ========================================================================= */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Attendance Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date Range:</span>
              <input
                type="date"
                value={attStartDate}
                onChange={(e) => setAttStartDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', padding: '5px 10px', width: 'auto' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={attEndDate}
                onChange={(e) => setAttEndDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', padding: '5px 10px', width: 'auto' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search member name or ID..."
                value={attMemberSearch}
                onChange={(e) => setAttMemberSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '12.5px', padding: '6px 10px 6px 30px', width: '100%' }}
              />
            </div>

            <select
              value={attStatusFilter}
              onChange={(e) => setAttStatusFilter(e.target.value as any)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="all">Status: All Records</option>
              <option value="completed">Completed Visits Only</option>
              <option value="inside">Currently Inside / Incomplete</option>
            </select>

            <button
              type="button"
              onClick={fetchAttendanceReport}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} />
              <span>Filter</span>
            </button>
          </div>

          {/* Attendance Summary KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Recorded Visits</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{attSummary.total_records}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Unique Patrons</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-forest)' }}>{attSummary.unique_visitors}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed Sessions</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>{attSummary.completed_visits}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currently Inside / Incomplete</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>{attSummary.currently_inside}</div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Patron Name</th>
                    <th>Member ID</th>
                    <th>Type</th>
                    <th>Time-In</th>
                    <th>Time-Out</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <UserCheck size={28} style={{ opacity: 0.4 }} />
                          <span style={{ fontWeight: 600 }}>No attendance records match the selected criteria.</span>
                          <span style={{ fontSize: '12px' }}>Try selecting a broader date range or clearing your search.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendance.map((a) => {
                      const isInside = !a.timeOut || a.status === 'Inside';
                      return (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td style={{ fontWeight: 600 }}>{a.memberName}</td>
                          <td><code>{a.memberId}</code></td>
                          <td>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                              {a.membershipType || 'Standard'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--brand-forest)' }}>{a.timeIn}</td>
                          <td>
                            {a.timeOut ? (
                              <span>{a.timeOut}</span>
                            ) : (
                              <span style={{ fontSize: '11.5px', color: '#F59E0B', fontStyle: 'italic' }}>
                                Missing Time-Out (Inside)
                              </span>
                            )}
                          </td>
                          <td>{a.duration || '—'}</td>
                          <td>
                            {isInside ? (
                              <span className="badge badge-warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#D97706', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                Inside / Incomplete
                              </span>
                            ) : (
                              <span className="badge badge-success">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {attendanceRecords.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-main)', backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{attendanceRecords.length}</strong> records
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '0 8px', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BOOK INVENTORY REPORTS (FR18.2)
          ========================================================================= */}
      {activeTab === 'books' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Inventory Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search title, author, ISBN, accession number, barcode..."
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '12.5px', padding: '6px 10px 6px 30px', width: '100%' }}
              />
            </div>

            <select
              value={invCategory}
              onChange={(e) => setInvCategory(e.target.value)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="all">Category: All Categories</option>
              {Array.from(new Set(initialBooks.map((b) => b.category))).filter(Boolean).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={invStatus}
              onChange={(e) => setInvStatus(e.target.value)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="all">Status: All Statuses</option>
              <option value="Available">Available for Borrowing</option>
              <option value="Borrowed">Currently Borrowed / On Loan</option>
              <option value="Reserved">Reserved Copies</option>
              <option value="Archived">Archived Titles</option>
              <option value="Lost">Lost or Damaged</option>
            </select>

            <button
              type="button"
              onClick={fetchInventoryReport}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} />
              <span>Filter</span>
            </button>
          </div>

          {/* Book Inventory KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Registered Titles</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{invSummary.total_titles}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Physical Copies</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-forest)' }}>{invSummary.total_copies}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Available on Shelf</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#10B981' }}>{invSummary.available_copies}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Currently Borrowed</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#0284C7' }}>{invSummary.borrowed_copies}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Archived Titles</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--text-muted)' }}>{invSummary.archived_titles}</div>
            </div>
          </div>

          {/* Books Inventory Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Dewey / Classification</th>
                    <th>Publisher & Year</th>
                    <th>Physical Copies</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBooks.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <BookOpen size={28} style={{ opacity: 0.4 }} />
                          <span style={{ fontWeight: 600 }}>No books match your inventory filters.</span>
                          <span style={{ fontSize: '12px' }}>Check your search terms or reset the category/status filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedBooks.map((b) => {
                      const copyCount = b.copies?.length || 0;
                      const hasAvailable = b.copies?.some((c) => c.status === 'Available');
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600, maxWidth: '280px' }}>
                            <div>{b.title}</div>
                            {b.subtitle && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{b.subtitle}</div>}
                          </td>
                          <td>{b.author}</td>
                          <td><code>{b.isbn}</code></td>
                          <td>
                            <span style={{ fontSize: '11.5px', padding: '2px 8px', borderRadius: '4px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                              {b.category}
                            </span>
                          </td>
                          <td>{b.classification || '—'}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {b.publisher ? `${b.publisher} (${b.publicationYear || '—'})` : (b.publicationYear || '—')}
                          </td>
                          <td>
                            <strong>{copyCount}</strong> {copyCount === 1 ? 'copy' : 'copies'}
                          </td>
                          <td>
                            {b.isArchived ? (
                              <span className="badge badge-secondary" style={{ backgroundColor: '#64748B', color: '#ffffff' }}>
                                Archived
                              </span>
                            ) : hasAvailable ? (
                              <span className="badge badge-success">
                                Available ({b.copies.filter((c) => c.status === 'Available').length})
                              </span>
                            ) : (
                              <span className="badge badge-danger">
                                Borrowed / Out
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {inventoryBooks.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-main)', backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{inventoryBooks.length}</strong> titles
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '0 8px', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: OVERDUE BOOK REPORTS (FR18.3)
          ========================================================================= */}
      {activeTab === 'overdue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overdue Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search overdue patron name, member ID, book title, or barcode..."
                value={overdueSearch}
                onChange={(e) => setOverdueSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '12.5px', padding: '6px 10px 6px 30px', width: '100%' }}
              />
            </div>

            <select
              value={overdueBracket}
              onChange={(e) => setOverdueBracket(e.target.value)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="all">Overdue Bracket: All Durations</option>
              <option value="1-7">1 to 7 Days Overdue</option>
              <option value="8-14">8 to 14 Days Overdue</option>
              <option value="15-30">15 to 30 Days Overdue</option>
              <option value="30+">Over 30 Days (Critical)</option>
            </select>

            <button
              type="button"
              onClick={fetchOverdueReport}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} />
              <span>Filter</span>
            </button>
          </div>

          {/* Overdue Summary KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Overdue Titles Unreturned</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: overdueSummary.total_overdue > 0 ? '#EF4444' : '#10B981' }}>
                {overdueSummary.total_overdue}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Patrons Requiring Follow-up</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#F59E0B' }}>
                {overdueSummary.unique_patrons}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Longest Overdue Delay</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                {overdueSummary.longest_overdue_days} <span style={{ fontSize: '13px', fontWeight: 500 }}>days</span>
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Estimated Fines</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: '#EF4444' }}>
                PHP {overdueSummary.total_estimated_fines.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Overdue Loans Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Patron Name</th>
                    <th>Member ID</th>
                    <th>Book Title</th>
                    <th>Barcode</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Overdue Days</th>
                    <th>Estimated Fine</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOverdue.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <CheckCircle2 size={32} style={{ color: '#10B981' }} />
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#10B981' }}>No Overdue Records Found!</span>
                          <span style={{ fontSize: '12.5px' }}>All borrowed library titles are currently within their designated loan period or have been returned.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedOverdue.map((r) => {
                      const isCritical = r.overdue_days > 14;
                      return (
                        <tr key={r.id}>
                          <td><code>{r.transaction_id}</code></td>
                          <td style={{ fontWeight: 600 }}>{r.member_name}</td>
                          <td><code>{r.member_id}</code></td>
                          <td style={{ fontWeight: 600, maxWidth: '240px' }}>{r.book_title}</td>
                          <td><code>{r.barcode}</code></td>
                          <td>{r.borrow_date}</td>
                          <td style={{ color: '#EF4444', fontWeight: 600 }}>{r.due_date}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '11.5px',
                                fontWeight: 800,
                                padding: '3px 9px',
                                borderRadius: '999px',
                                backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: isCritical ? '#EF4444' : '#D97706',
                                border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                              }}
                            >
                              {r.overdue_days} days late
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#EF4444' }}>
                            PHP {r.estimated_fine.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {overdueRecords.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-main)', backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{overdueRecords.length}</strong> overdue loans
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '0 8px', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SYSTEM ACTIVITY LOGS (FR18.5)
          ========================================================================= */}
      {activeTab === 'activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Activity Filters Bar */}
          <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Date:</span>
              <input
                type="date"
                value={actStartDate}
                onChange={(e) => setActStartDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', padding: '5px 10px', width: 'auto' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={actEndDate}
                onChange={(e) => setActEndDate(e.target.value)}
                className="form-input"
                style={{ fontSize: '12px', padding: '5px 10px', width: 'auto' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search action, details, staff member..."
                value={actSearch}
                onChange={(e) => setActSearch(e.target.value)}
                className="form-input"
                style={{ fontSize: '12.5px', padding: '6px 10px 6px 30px', width: '100%' }}
              />
            </div>

            <select
              value={actCategory}
              onChange={(e) => setActCategory(e.target.value)}
              className="form-input"
              style={{ fontSize: '12.5px', padding: '6px 10px', width: 'auto' }}
            >
              <option value="all">Module: All Modules</option>
              <option value="Circulation">Circulation</option>
              <option value="Books">Books Catalog</option>
              <option value="Members">Member Accounts</option>
              <option value="Attendance">Attendance</option>
              <option value="Admin">Admin Governance</option>
              <option value="System">System & Security</option>
            </select>

            <button
              type="button"
              onClick={fetchActivityLogsReport}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} />
              <span>Filter</span>
            </button>
          </div>

          {/* Activity Summary KPI Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Activities Logged</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{activitySummary.total_activities}</div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Active Administrative Users</div>
              <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-forest)' }}>
                {activitySummary.unique_users.length}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Top Action Module</div>
              <div style={{ fontSize: '16px', fontWeight: 800, marginTop: '6px', color: '#0284C7' }}>
                {Object.keys(activitySummary.module_breakdown).length > 0
                  ? Object.entries(activitySummary.module_breakdown).sort((a, b) => b[1] - a[1])[0][0]
                  : 'Circulation'}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Audit Trail Integrity</div>
              <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '6px', color: '#10B981' }}>
                100% Immutable Log
              </div>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Performed By</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Details / Affected Record</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedActivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <ShieldCheck size={28} style={{ opacity: 0.4 }} />
                          <span style={{ fontWeight: 600 }}>No system activity records match the selected criteria.</span>
                          <span style={{ fontSize: '12px' }}>Try selecting a broader date range or clearing filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedActivity.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {new Date(r.timestamp || (r as any).created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{r.performedBy || (r as any).performed_by || 'System'}</td>
                        <td>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isDark ? '#1e293b' : '#f1f5f9'
                            }}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--brand-forest)' }}>{r.action}</td>
                        <td style={{ fontSize: '12.5px', maxWidth: '380px' }}>{r.details}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.ipAddress || (r as any).ip_address || '127.0.0.1'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {activityRecords.length > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border-main)', backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{activityRecords.length}</strong> activities
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', padding: '0 8px', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PUBLICATION-READY PDF PRINT PREVIEW MODAL (FR19.1)
          ========================================================================= */}
      {showPrintModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
          onClick={() => setShowPrintModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Control Bar (Non-print) */}
            <div
              className="no-print"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} color="#166534" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#166534' }}>Official PDF Document Preview</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handlePrintExecution}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px', backgroundColor: '#166534', padding: '6px 16px' }}
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: '6px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div
              id="printable-report-document"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '40px 48px',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              {/* Official Municipal Letterhead */}
              <div style={{ textAlign: 'center', borderBottom: '2.5px solid #166534', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B' }}>
                  Republic of the Philippines • Province of Misamis Oriental
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#1E293B', marginTop: '2px' }}>
                  Municipality of Balingasag
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534', marginTop: '4px', letterSpacing: '0.02em' }}>
                  BALINGASAG PUBLIC LIBRARY & INFORMATION CENTER
                </div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  Municipal Hall Compound, Balingasag, Misamis Oriental • Contact: balingasagpubliclibrary@gmail.com
                </div>
              </div>

              {/* Document Title & Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px dashed #CBD5E1', paddingBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>
                    {activeTab === 'attendance'
                      ? 'Official Patron Attendance Report'
                      : activeTab === 'books'
                      ? 'Comprehensive Book Inventory Report'
                      : activeTab === 'overdue'
                      ? 'Overdue Circulation & Recovery Report'
                      : activeTab === 'activity'
                      ? 'System Activity & Governance Audit Log Report'
                      : 'Executive Library Operations Summary'}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Reporting Period:{' '}
                    <strong>
                      {activeTab === 'attendance'
                        ? `${attStartDate || 'Beginning'} to ${attEndDate || todayStr}`
                        : activeTab === 'activity'
                        ? `${actStartDate || 'Beginning'} to ${actEndDate || todayStr}`
                        : activeTab === 'overview'
                        ? execData?.period_label || execPeriod
                        : `As of ${todayStr}`}
                    </strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#64748B' }}>
                  <div>Date Generated: <strong>{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</strong></div>
                  <div>Generated By: <strong>{currentUser?.fullName || currentUser?.name || 'Library Administrator'}</strong></div>
                  <div>Doc ID: <code>BPL-REP-{Date.now().toString().slice(-6)}</code></div>
                </div>
              </div>

              {/* Summary KPIs Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '24px',
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0'
                }}
              >
                {activeTab === 'attendance' && (
                  <>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Total Visits:</span><div style={{ fontSize: '16px', fontWeight: 800 }}>{attSummary.total_records}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Unique Visitors:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>{attSummary.unique_visitors}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Completed Visits:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{attSummary.completed_visits}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Incomplete (Inside):</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#D97706' }}>{attSummary.currently_inside}</div></div>
                  </>
                )}
                {activeTab === 'books' && (
                  <>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Total Titles:</span><div style={{ fontSize: '16px', fontWeight: 800 }}>{invSummary.total_titles}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Total Copies:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>{invSummary.total_copies}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Available:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{invSummary.available_copies}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Checked Out:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7' }}>{invSummary.borrowed_copies}</div></div>
                  </>
                )}
                {activeTab === 'overdue' && (
                  <>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Overdue Items:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>{overdueSummary.total_overdue}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Patrons:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#D97706' }}>{overdueSummary.unique_patrons}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Est. Fines:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#DC2626' }}>PHP {overdueSummary.total_estimated_fines.toFixed(2)}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Max Delay:</span><div style={{ fontSize: '16px', fontWeight: 800 }}>{overdueSummary.longest_overdue_days} days</div></div>
                  </>
                )}
                {activeTab === 'activity' && (
                  <>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Total Logs:</span><div style={{ fontSize: '16px', fontWeight: 800 }}>{activitySummary.total_activities}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Active Staff:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>{activitySummary.unique_users.length}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Scope:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7' }}>Audit Trail</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Integrity:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>Verified</div></div>
                  </>
                )}
                {activeTab === 'overview' && (
                  <>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Registered Members:</span><div style={{ fontSize: '16px', fontWeight: 800 }}>{execData?.metrics.total_members.current ?? initialMembers.length}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Book Titles:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>{execData?.metrics.book_inventory.total_titles ?? initialBooks.length}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Total Attendance:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>{execData?.metrics.attendance.current ?? initialAttendance.length}</div></div>
                    <div><span style={{ fontSize: '10.5px', color: '#64748B' }}>Active Loans:</span><div style={{ fontSize: '16px', fontWeight: 800, color: '#0284C7' }}>{execData?.metrics.circulation.active_loans ?? 0}</div></div>
                  </>
                )}
              </div>

              {/* Printable Table Content */}
              <div style={{ marginBottom: '32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                      {activeTab === 'attendance' && (
                        <>
                          <th style={{ padding: '6px 8px' }}>Date</th>
                          <th style={{ padding: '6px 8px' }}>Patron Name</th>
                          <th style={{ padding: '6px 8px' }}>Member ID</th>
                          <th style={{ padding: '6px 8px' }}>Time-In</th>
                          <th style={{ padding: '6px 8px' }}>Time-Out</th>
                          <th style={{ padding: '6px 8px' }}>Duration</th>
                          <th style={{ padding: '6px 8px' }}>Status</th>
                        </>
                      )}
                      {activeTab === 'books' && (
                        <>
                          <th style={{ padding: '6px 8px' }}>Book Title</th>
                          <th style={{ padding: '6px 8px' }}>Author</th>
                          <th style={{ padding: '6px 8px' }}>ISBN</th>
                          <th style={{ padding: '6px 8px' }}>Category</th>
                          <th style={{ padding: '6px 8px' }}>Dewey</th>
                          <th style={{ padding: '6px 8px' }}>Copies</th>
                          <th style={{ padding: '6px 8px' }}>Status</th>
                        </>
                      )}
                      {activeTab === 'overdue' && (
                        <>
                          <th style={{ padding: '6px 8px' }}>Loan ID</th>
                          <th style={{ padding: '6px 8px' }}>Patron Name</th>
                          <th style={{ padding: '6px 8px' }}>Member ID</th>
                          <th style={{ padding: '6px 8px' }}>Book Title</th>
                          <th style={{ padding: '6px 8px' }}>Due Date</th>
                          <th style={{ padding: '6px 8px' }}>Days Late</th>
                          <th style={{ padding: '6px 8px' }}>Fine (PHP)</th>
                        </>
                      )}
                      {activeTab === 'activity' && (
                        <>
                          <th style={{ padding: '6px 8px' }}>Date & Time</th>
                          <th style={{ padding: '6px 8px' }}>User</th>
                          <th style={{ padding: '6px 8px' }}>Module</th>
                          <th style={{ padding: '6px 8px' }}>Action</th>
                          <th style={{ padding: '6px 8px' }}>Details / Affected Record</th>
                        </>
                      )}
                      {activeTab === 'overview' && (
                        <>
                          <th style={{ padding: '6px 8px' }}>Operational Indicator</th>
                          <th style={{ padding: '6px 8px' }}>Current Scope</th>
                          <th style={{ padding: '6px 8px' }}>Comparison / Breakdown</th>
                          <th style={{ padding: '6px 8px' }}>Calculated Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'attendance' &&
                      attendanceRecords.slice(0, 100).map((a, idx) => (
                        <tr key={a.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '5px 8px' }}>{a.date}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{a.memberName}</td>
                          <td style={{ padding: '5px 8px' }}>{a.memberId}</td>
                          <td style={{ padding: '5px 8px' }}>{a.timeIn}</td>
                          <td style={{ padding: '5px 8px' }}>{a.timeOut || 'Missing (Inside)'}</td>
                          <td style={{ padding: '5px 8px' }}>{a.duration || '—'}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{!a.timeOut ? 'Inside' : 'Completed'}</td>
                        </tr>
                      ))}

                    {activeTab === 'books' &&
                      inventoryBooks.slice(0, 100).map((b, idx) => (
                        <tr key={b.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{b.title}</td>
                          <td style={{ padding: '5px 8px' }}>{b.author}</td>
                          <td style={{ padding: '5px 8px' }}>{b.isbn}</td>
                          <td style={{ padding: '5px 8px' }}>{b.category}</td>
                          <td style={{ padding: '5px 8px' }}>{b.classification || '—'}</td>
                          <td style={{ padding: '5px 8px' }}>{b.copies?.length || 0}</td>
                          <td style={{ padding: '5px 8px' }}>{b.isArchived ? 'Archived' : 'Active'}</td>
                        </tr>
                      ))}

                    {activeTab === 'overdue' &&
                      (overdueRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '16px', color: '#10B981', fontWeight: 700 }}>
                            No Overdue Records. All library loans are fully compliant.
                          </td>
                        </tr>
                      ) : (
                        overdueRecords.slice(0, 100).map((r, idx) => (
                          <tr key={r.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '5px 8px' }}>{r.transaction_id}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.member_name}</td>
                            <td style={{ padding: '5px 8px' }}>{r.member_id}</td>
                            <td style={{ padding: '5px 8px' }}>{r.book_title}</td>
                            <td style={{ padding: '5px 8px', color: '#DC2626' }}>{r.due_date}</td>
                            <td style={{ padding: '5px 8px', fontWeight: 700, color: '#DC2626' }}>{r.overdue_days} days</td>
                            <td style={{ padding: '5px 8px' }}>PHP {r.estimated_fine.toFixed(2)}</td>
                          </tr>
                        ))
                      ))}

                    {activeTab === 'activity' &&
                      activityRecords.slice(0, 100).map((r, idx) => (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '5px 8px' }}>{new Date(r.timestamp || (r as any).created_at).toLocaleString()}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.performedBy || (r as any).performed_by || 'Staff'}</td>
                          <td style={{ padding: '5px 8px' }}>{r.category}</td>
                          <td style={{ padding: '5px 8px', color: '#166534', fontWeight: 600 }}>{r.action}</td>
                          <td style={{ padding: '5px 8px' }}>{r.details}</td>
                        </tr>
                      ))}

                    {activeTab === 'overview' && (
                      <>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Total Registered Members</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.total_members.current ?? initialMembers.length}</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.total_members.active ?? 0} Active</td>
                          <td style={{ padding: '6px 8px', color: '#10B981', fontWeight: 600 }}>Compliant</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Total Book Catalog Titles</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.book_inventory.total_titles ?? initialBooks.length}</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.book_inventory.total_copies ?? 0} Total Physical Copies</td>
                          <td style={{ padding: '6px 8px', color: '#0284C7', fontWeight: 600 }}>Inventory Active</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Total Patron Attendance</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.attendance.current ?? initialAttendance.length}</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.attendance.unique_visitors ?? 0} Unique Visitors</td>
                          <td style={{ padding: '6px 8px', color: '#10B981', fontWeight: 600 }}>QR Tracked</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>Circulation Active Loans</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.circulation.active_loans ?? 0}</td>
                          <td style={{ padding: '6px 8px' }}>{execData?.metrics.circulation.overdue_loans ?? 0} Overdue Items</td>
                          <td style={{ padding: '6px 8px', color: (execData?.metrics.circulation.overdue_loans ?? 0) > 0 ? '#DC2626' : '#10B981', fontWeight: 600 }}>
                            {(execData?.metrics.circulation.overdue_loans ?? 0) > 0 ? 'Action Required' : 'Optimal'}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Document Sign-Off Block */}
              <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '32px' }}>Prepared & Compiled By:</div>
                  <div style={{ borderBottom: '1px solid #0F172A', width: '220px', marginBottom: '4px' }}></div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{currentUser?.fullName || currentUser?.name || 'Library Administrative Assistant'}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Library Records Officer / Administrative Staff</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '32px' }}>Certified Correct & Noted:</div>
                  <div style={{ borderBottom: '1px solid #0F172A', width: '220px', marginLeft: 'auto', marginBottom: '4px' }}></div>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>Municipal Librarian / Super Admin</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Balingasag Public Library Management</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
