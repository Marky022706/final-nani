import React, { useState } from 'react';
import type {
  CirculationTransaction,
  BookReservation,
  Book,
  PhysicalCopy,
  Member,
  UserRole
} from '../../types';
import { CirculationScannerModal } from './CirculationScannerModal';
import { LoanSlipModal } from './LoanSlipModal';
import { IssueLoanWizardModal } from './IssueLoanWizardModal';
import {
  Repeat,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  BookmarkCheck,
  RefreshCw,
  Clock,
  Check,
  X,
  QrCode,
  Barcode,
  XCircle,
  Sparkles
} from 'lucide-react';

interface CirculationViewProps {
  transactions: CirculationTransaction[];
  reservations: BookReservation[];
  books: Book[];
  members: Member[];
  userRole: UserRole;
  currentMemberId?: string;
  onBorrowBook: (memberId: string, barcode: string, dueDate: string) => { success: boolean; message: string; transaction?: CirculationTransaction };
  onReturnBook: (barcode: string) => { success: boolean; message: string; transaction?: CirculationTransaction };
  onRenewBook: (transactionId: string) => { success: boolean; message: string };
  onCancelReservation: (reservationId: string) => void;
  onApproveBorrow?: (transactionId: string) => void;
  onRejectBorrow?: (transactionId: string, reason?: string) => void;
  onApproveReservation?: (reservationId: string) => void;
  onRejectReservation?: (reservationId: string) => void;
}

export const CirculationView: React.FC<CirculationViewProps> = ({
  transactions,
  reservations,
  books,
  members,
  userRole,
  onBorrowBook,
  onReturnBook,
  onRenewBook,
  onCancelReservation,
  onApproveBorrow,
  onRejectBorrow,
  onApproveReservation,
  onRejectReservation
}) => {
  const pendingBorrows = transactions.filter((t) => t.status === 'Pending Approval');
  const pendingReservations = reservations.filter((r) => r.status === 'Pending Approval');
  const totalPending = pendingBorrows.length + pendingReservations.length;

  const [activeTab, setActiveTab] = useState<'approvals' | 'borrow' | 'return' | 'loans' | 'reservations'>('approvals');

  // Modals state
  const [scannerModal, setScannerModal] = useState<{
    isOpen: boolean;
    mode: 'member_qr' | 'book_barcode';
    targetAction: 'borrow_member' | 'borrow_book' | 'return_scan';
  }>({
    isOpen: false,
    mode: 'member_qr',
    targetAction: 'borrow_member'
  });

  const [loanSlipModal, setLoanSlipModal] = useState<{
    isOpen: boolean;
    transaction: CirculationTransaction | null;
  }>({
    isOpen: false,
    transaction: null
  });

  const [isWizardModalOpen, setIsWizardModalOpen] = useState<boolean>(false);

  // Calculate default dates
  const todayDateStr = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const defaultDueDateStr = defaultDueDate.toISOString().split('T')[0];

  // Borrow Form State
  const [borrowMemberId, setBorrowMemberId] = useState<string>(members[0]?.memberId || '');
  const [borrowBarcode, setBorrowBarcode] = useState<string>('');
  const [borrowDueDate, setBorrowDueDate] = useState<string>(defaultDueDateStr);
  const [borrowStatusMessage, setBorrowStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Return Form State
  const [returnBarcode, setReturnBarcode] = useState<string>('');
  const [fineSettled, setFineSettled] = useState<boolean>(true);
  const [returnStatusMessage, setReturnStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search in transactions table
  const [loansSearch, setLoansSearch] = useState<string>('');

  // Collect available book copies for quick pick
  const availableCopies: { bookTitle: string; author: string; barcode: string; accession: string }[] = [];
  books.forEach((b) => {
    b.copies.forEach((c) => {
      if (c.status === 'Available') {
        availableCopies.push({
          bookTitle: b.title,
          author: b.author,
          barcode: c.barcode,
          accession: c.accessionNumber
        });
      }
    });
  });

  // Active borrowed items
  const activeLoans = transactions.filter((t) => t.status === 'Active' || t.status === 'Overdue');

  // Derive selected Member and Eligibility
  const selectedMember = members.find((m) => m.memberId === borrowMemberId);
  const memberActiveLoans = transactions.filter(
    (t) => t.memberId === borrowMemberId && (t.status === 'Active' || t.status === 'Overdue')
  );
  const memberOverdueLoans = transactions.filter(
    (t) => t.memberId === borrowMemberId && t.status === 'Overdue'
  );

  const isAccountActive = selectedMember?.status === 'active';
  const isWithinLimit = memberActiveLoans.length < 3;
  const hasNoOverdue = memberOverdueLoans.length === 0;
  const hasNoBlockedFines = true;
  const isMemberEligible = !!selectedMember && isAccountActive && isWithinLimit && hasNoOverdue && hasNoBlockedFines;

  // Derive selected Book & Physical Copy
  let selectedBook: Book | null = null;
  let selectedCopy: PhysicalCopy | null = null;
  if (borrowBarcode.trim()) {
    for (const b of books) {
      const copy = b.copies.find(
        (c) =>
          c.barcode.toUpperCase() === borrowBarcode.trim().toUpperCase() ||
          c.accessionNumber.toUpperCase() === borrowBarcode.trim().toUpperCase()
      );
      if (copy) {
        selectedBook = b;
        selectedCopy = copy;
        break;
      }
    }
  }

  const isCopyAvailable = selectedCopy?.status === 'Available';
  const currentCopyBorrower = selectedCopy && !isCopyAvailable
    ? transactions.find(
        (t) => t.barcode === selectedCopy?.barcode && (t.status === 'Active' || t.status === 'Overdue')
      )
    : null;

  // Derive matched loan for Return
  let matchedReturnLoan: CirculationTransaction | null = null;
  if (returnBarcode.trim()) {
    matchedReturnLoan =
      transactions.find(
        (t) =>
          (t.barcode.toUpperCase() === returnBarcode.trim().toUpperCase() ||
           t.accessionNumber.toUpperCase() === returnBarcode.trim().toUpperCase() ||
           t.memberId.toUpperCase() === returnBarcode.trim().toUpperCase()) &&
          (t.status === 'Active' || t.status === 'Overdue')
      ) || null;
  }

  // Calculate fine for matched return loan
  const computeOverdueInfo = (tx: CirculationTransaction | null) => {
    if (!tx) return { isOverdue: false, daysLate: 0, fine: 0 };
    const today = new Date();
    const dueDate = new Date(tx.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { isOverdue: true, daysLate: diffDays, fine: diffDays * 10 }; // ₱10/day
    }
    return { isOverdue: false, daysLate: 0, fine: 0 };
  };

  const overdueInfo = computeOverdueInfo(matchedReturnLoan);

  const handleScannerDetected = (code: string) => {
    if (scannerModal.targetAction === 'borrow_member') {
      const found = members.find(
        (m) => m.memberId.toUpperCase() === code.toUpperCase() || m.id.toUpperCase() === code.toUpperCase()
      );
      if (found) {
        setBorrowMemberId(found.memberId);
        setBorrowStatusMessage(null);
      } else {
        setBorrowStatusMessage({ type: 'error', text: `Member "${code}" not found.` });
      }
    } else if (scannerModal.targetAction === 'borrow_book') {
      setBorrowBarcode(code);
      setBorrowStatusMessage(null);
    } else if (scannerModal.targetAction === 'return_scan') {
      setReturnBarcode(code);
      setReturnStatusMessage(null);
    }
  };

  const handleExecuteBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowMemberId || !borrowBarcode) {
      setBorrowStatusMessage({ type: 'error', text: 'Please scan or select both a Member QR and a Book Barcode.' });
      return;
    }

    if (!isMemberEligible) {
      setBorrowStatusMessage({
        type: 'error',
        text: !isAccountActive
          ? 'Member account is inactive or suspended.'
          : !isWithinLimit
          ? 'Member has reached the maximum 3 books borrowing limit.'
          : 'Member has overdue loans that must be settled first.'
      });
      return;
    }

    if (!isCopyAvailable) {
      setBorrowStatusMessage({
        type: 'error',
        text: `Physical copy ${borrowBarcode} is not available (Status: ${selectedCopy?.status || 'Unknown'}).`
      });
      return;
    }

    const res = onBorrowBook(borrowMemberId, borrowBarcode, borrowDueDate);
    if (res.success) {
      setBorrowStatusMessage({ type: 'success', text: res.message });
      if (res.transaction) {
        setLoanSlipModal({ isOpen: true, transaction: res.transaction });
      }
      setBorrowBarcode('');
    } else {
      setBorrowStatusMessage({ type: 'error', text: res.message });
    }
  };

  const handleExecuteReturn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const barcodeToReturn = matchedReturnLoan ? matchedReturnLoan.barcode : returnBarcode.trim();
    if (!barcodeToReturn) {
      setReturnStatusMessage({ type: 'error', text: 'Please scan or enter a book barcode to return.' });
      return;
    }

    const res = onReturnBook(barcodeToReturn);
    if (res.success) {
      const fineMsg = overdueInfo.isOverdue ? ` Overdue fine of ₱${overdueInfo.fine}.00 recorded.` : '';
      setReturnStatusMessage({ type: 'success', text: `${res.message}${fineMsg}` });
      setReturnBarcode('');
    } else {
      setReturnStatusMessage({ type: 'error', text: res.message });
    }
  };


  const filteredLoans = transactions.filter((tx) => {
    const bookTitle = tx.bookTitle || (tx as any).book_title || '';
    const memberName = tx.memberName || (tx as any).member_name || '';
    const barcode = tx.barcode || '';
    const memberId = tx.memberId || (tx as any).member_id || '';
    const q = loansSearch.toLowerCase();
    return (
      bookTitle.toLowerCase().includes(q) ||
      memberName.toLowerCase().includes(q) ||
      barcode.toLowerCase().includes(q) ||
      memberId.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Circulation Management</div>
          <div className="page-subtitle">
            Book Borrowing, Barcode Returns, Loan Renewals, and Active Reservation Holds
          </div>
        </div>
        {userRole !== 'member' && (
          <div className="page-actions">
            <button
              onClick={() => setIsWizardModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', fontWeight: 700 }}
            >
              <Sparkles size={15} />
              <span>Step-by-Step Issue Loan Modal</span>
            </button>
          </div>
        )}
      </div>

      {/* Circulation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-main)', marginBottom: '24px' }}>
        {userRole !== 'member' && (
          <>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`btn btn-ghost ${activeTab === 'approvals' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'approvals' ? '2px solid var(--primary-600)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'approvals' ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Clock size={16} color={totalPending > 0 ? 'var(--warning)' : undefined} />
              <span>Pending Approvals</span>
              {totalPending > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--danger)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    lineHeight: 1.3
                  }}
                >
                  {totalPending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('borrow')}
              className={`btn btn-ghost ${activeTab === 'borrow' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'borrow' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'borrow' ? 600 : 500
              }}
            >
              <BookOpen size={16} />
              <span>Issue Loan (Staff)</span>
            </button>

            <button
              onClick={() => setActiveTab('return')}
              className={`btn btn-ghost ${activeTab === 'return' ? 'active' : ''}`}
              style={{
                borderBottom: activeTab === 'return' ? '2px solid var(--accent-blue)' : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                fontWeight: activeTab === 'return' ? 600 : 500
              }}
            >
              <CheckCircle2 size={16} />
              <span>Return (Scan Barcode)</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('loans')}
          className={`btn btn-ghost ${activeTab === 'loans' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'loans' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'loans' ? 600 : 500
          }}
        >
          <Repeat size={16} />
          <span>Active Loans ({activeLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`btn btn-ghost ${activeTab === 'reservations' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'reservations' ? '2px solid var(--accent-blue)' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'reservations' ? 600 : 500
          }}
        >
          <BookmarkCheck size={16} />
          <span>Reservations ({reservations.length})</span>
        </button>
      </div>

      {/* TAB 0: PENDING APPROVALS */}
      {activeTab === 'approvals' && userRole !== 'member' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Borrow Requests Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Borrow Requests Awaiting Approval</span>
                  <span className={`badge ${pendingBorrows.length > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                    {pendingBorrows.length} Pending
                  </span>
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Members who requested to borrow physical books from the online catalog
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patron / Member</th>
                    <th>Book Title & Accession</th>
                    <th>Barcode</th>
                    <th>Date Requested</th>
                    <th style={{ textAlign: 'right' }}>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBorrows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No pending borrow requests at this time.
                      </td>
                    </tr>
                  ) : (
                    pendingBorrows.map((tx) => (
                      <tr key={tx.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.memberName}</div>
                          <code style={{ fontSize: '11.5px' }}>{tx.memberId}</code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{tx.bookTitle}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            by {tx.bookAuthor} • Accession: <code>{tx.accessionNumber}</code>
                          </div>
                        </td>
                        <td>
                          <code>{tx.barcode}</code>
                        </td>
                        <td>{tx.requestDate || tx.borrowDate}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {onApproveBorrow && (
                              <button
                                onClick={() => onApproveBorrow(tx.id)}
                                className="btn btn-primary btn-sm"
                                title="Approve borrow request (activates 14-day loan)"
                              >
                                <Check size={14} />
                                <span>Approve</span>
                              </button>
                            )}
                            {onRejectBorrow && (
                              <button
                                onClick={() => onRejectBorrow(tx.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                                title="Decline request"
                              >
                                <X size={14} />
                                <span>Decline</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reservation Requests Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Reservation Holds Awaiting Approval</span>
                  <span className={`badge ${pendingReservations.length > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                    {pendingReservations.length} Pending
                  </span>
                </h3>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Hold requests placed by patrons waiting for shelf clearance
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Patron / Member</th>
                    <th>Book Title</th>
                    <th>Date Requested</th>
                    <th>Queue Pos.</th>
                    <th style={{ textAlign: 'right' }}>Review Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No pending reservation holds.
                      </td>
                    </tr>
                  ) : (
                    pendingReservations.map((res) => (
                      <tr key={res.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{res.memberName}</div>
                          <code style={{ fontSize: '11.5px' }}>{res.memberId}</code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{res.bookTitle}</div>
                        </td>
                        <td>{res.reservationDate}</td>
                        <td>
                          <span className="badge badge-warning">Queue #{res.queuePosition}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {onApproveReservation && (
                              <button
                                onClick={() => onApproveReservation(res.id)}
                                className="btn btn-primary btn-sm"
                                title="Approve hold and notify patron that book is ready for pickup"
                              >
                                <Check size={14} />
                                <span>Approve (Ready for Pickup)</span>
                              </button>
                            )}
                            {onRejectReservation && (
                              <button
                                onClick={() => onRejectReservation(res.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)' }}
                                title="Decline reservation"
                              >
                                <X size={14} />
                                <span>Decline</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: BORROW WORKFLOW */}
      {activeTab === 'borrow' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Main Borrow Workflow Card - Matching user specification diagram */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--border-main)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em', textTransform: 'uppercase' }}>
                  Borrow Book
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Scan Member QR & Book Barcode to record official loan transaction
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsWizardModalOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '6px', fontWeight: 700 }}
                >
                  <Sparkles size={14} />
                  <span>Open Step-by-Step Modal Wizard</span>
                </button>
                <span className="badge badge-neutral" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Desk Circulation
                </span>
              </div>
            </div>

            {/* SECTION 1: SCAN MEMBER QR */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 0 }}>
                  1. Scan Member QR Code
                </label>
                <button
                  type="button"
                  onClick={() => setScannerModal({ isOpen: true, mode: 'member_qr', targetAction: 'borrow_member' })}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px', fontSize: '12px', padding: '4px 10px' }}
                >
                  <QrCode size={14} />
                  <span>📷 Scan QR</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                  className="form-select"
                  value={borrowMemberId}
                  onChange={(e) => {
                    setBorrowMemberId(e.target.value);
                    setBorrowStatusMessage(null);
                  }}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select or Scan Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.memberId}>
                      {m.fullName} ({m.memberId}) • {m.membershipType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Card Details & Real-Time Eligibility Engine */}
              {selectedMember ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          backgroundColor: 'var(--brand-forest)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px'
                        }}
                      >
                        {selectedMember.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {selectedMember.fullName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          ID: <code>{selectedMember.memberId}</code> • {selectedMember.membershipType}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`badge ${isMemberEligible ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px', fontWeight: 600 }}>
                        {isMemberEligible ? '✓ Eligible' : '❌ Ineligible'}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Checklist */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAccountActive ? 'var(--success)' : 'var(--danger)' }}>
                      {isAccountActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>Account Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isWithinLimit ? 'var(--success)' : 'var(--danger)' }}>
                      {isWithinLimit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>Borrow Limit ({memberActiveLoans.length}/3 Loans)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoOverdue ? 'var(--success)' : 'var(--danger)' }}>
                      {hasNoOverdue ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>No Overdue Books</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoBlockedFines ? 'var(--success)' : 'var(--danger)' }}>
                      {hasNoBlockedFines ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      <span>No Blocked Fines</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border-main)', borderRadius: 'var(--radius-md)' }}>
                  No member selected yet. Scan QR code or select from dropdown above.
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border-main)' }} />

            {/* SECTION 2: SCAN BOOK BARCODE */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 0 }}>
                  2. Scan Book Barcode
                </label>
                <button
                  type="button"
                  onClick={() => setScannerModal({ isOpen: true, mode: 'book_barcode', targetAction: 'borrow_book' })}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '6px', fontSize: '12px', padding: '4px 10px' }}
                >
                  <Barcode size={14} />
                  <span>📷 Scan Barcode</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter or scan physical copy barcode (e.g. BPL-000101)"
                  value={borrowBarcode}
                  onChange={(e) => {
                    setBorrowBarcode(e.target.value);
                    setBorrowStatusMessage(null);
                  }}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Book Details & Availability Card */}
              {selectedCopy && selectedBook ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {selectedBook.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        by {selectedBook.author} • ISBN: <code>{selectedBook.isbn}</code>
                      </div>
                    </div>
                    <span
                      className={`badge ${isCopyAvailable ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    >
                      {isCopyAvailable ? '✓ Available' : `❌ ${selectedCopy.status}`}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Accession No: </span>
                      <code>{selectedCopy.accessionNumber}</code>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Barcode: </span>
                      <code>{selectedCopy.barcode}</code>
                    </div>
                  </div>

                  {currentCopyBorrower && (
                    <div style={{ fontSize: '11px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', padding: '6px 10px', borderRadius: '4px' }}>
                      Currently borrowed by <strong>{currentCopyBorrower.memberName}</strong> ({currentCopyBorrower.memberId}), due {currentCopyBorrower.dueDate}.
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border-main)', borderRadius: 'var(--radius-md)' }}>
                  No book barcode scanned. Use camera scanner or pick an available shelf copy on the right.
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid var(--border-main)' }} />

            {/* SECTION 3: BORROW DATES & CONFIRMATION */}
            <form onSubmit={handleExecuteBorrow}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Borrow Date
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={todayDateStr}
                    style={{ backgroundColor: 'var(--bg-page)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Due Date (7 Days Default)
                  </label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={borrowDueDate}
                    onChange={(e) => setBorrowDueDate(e.target.value)}
                  />
                </div>
              </div>

              {borrowStatusMessage && (
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: borrowStatusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: borrowStatusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${borrowStatusMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
                  }}
                >
                  {borrowStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{borrowStatusMessage.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setBorrowBarcode('');
                    setBorrowStatusMessage(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedMember || !isMemberEligible || !selectedCopy || !isCopyAvailable}
                  className="btn btn-primary"
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  <Check size={16} />
                  <span>Confirm Borrow</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Available Shelf Inventory & Member Quick-Picks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Shelf copies */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Available Copies on Shelf</h4>
                <span className="badge badge-success" style={{ fontSize: '11px' }}>{availableCopies.length} Ready</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Click any copy below to instantly load its barcode into the scanner:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {availableCopies.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    All copies are currently checked out.
                  </div>
                ) : (
                  availableCopies.map((copy, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setBorrowBarcode(copy.barcode);
                        setBorrowStatusMessage(null);
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-main)',
                        backgroundColor: borrowBarcode === copy.barcode ? 'var(--accent-blue-light)' : 'var(--bg-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--text-primary)' }}>{copy.bookTitle}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>by {copy.author}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <code style={{ fontSize: '11.5px', fontWeight: 700 }}>{copy.barcode}</code>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{copy.accession}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Member Switcher for Demo */}
            <div className="card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Registered Patrons Quick-Select</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {members.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setBorrowMemberId(m.memberId);
                      setBorrowStatusMessage(null);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      justifyContent: 'space-between',
                      backgroundColor: borrowMemberId === m.memberId ? 'var(--accent-blue-light)' : undefined,
                      padding: '6px 10px',
                      fontSize: '11.5px'
                    }}
                  >
                    <span>{m.fullName} ({m.memberId})</span>
                    <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10px' }}>
                      {m.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RETURN WORKFLOW */}
      {activeTab === 'return' && (
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Return Book & Restock Shelf</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '480px', margin: '4px auto 0' }}>
                Scan the member QR or book physical barcode to verify borrowing, check overdue fine calculations, and confirm return.
              </p>
            </div>

            {/* Input & Scanner Buttons */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 700, marginBottom: 0 }}>
                  Scan Book Barcode or Member QR
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setScannerModal({ isOpen: true, mode: 'book_barcode', targetAction: 'return_scan' })}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '12px' }}
                  >
                    <Barcode size={14} />
                    <span>📷 Scan Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScannerModal({ isOpen: true, mode: 'member_qr', targetAction: 'return_scan' })}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '6px', fontSize: '12px' }}
                  >
                    <QrCode size={14} />
                    <span>📷 Scan Member QR</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BPL-000101, ACC-000101, or MBR-000001"
                  value={returnBarcode}
                  onChange={(e) => {
                    setReturnBarcode(e.target.value);
                    setReturnStatusMessage(null);
                  }}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                {matchedReturnLoan && (
                  <button
                    type="button"
                    onClick={() => handleExecuteReturn()}
                    className="btn btn-primary"
                    style={{ minWidth: '140px', gap: '6px' }}
                  >
                    <Check size={15} />
                    <span>Confirm Return</span>
                  </button>
                )}
              </div>
            </div>

            {/* Matched Loan Card with Overdue Fine Engine */}
            {matchedReturnLoan ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '11px', marginBottom: '6px' }}>
                      Active Loan Found: <code>{matchedReturnLoan.id}</code>
                    </span>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {matchedReturnLoan.bookTitle}
                    </h4>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      by {matchedReturnLoan.bookAuthor}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Accession No:</div>
                    <code style={{ fontSize: '13px', fontWeight: 700 }}>{matchedReturnLoan.accessionNumber}</code>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Borrower Patron:</span>
                    <div style={{ fontWeight: 600 }}>{matchedReturnLoan.memberName} (<code>{matchedReturnLoan.memberId}</code>)</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Borrow Date:</span>
                    <div>{matchedReturnLoan.borrowDate}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Scheduled Due Date:</span>
                    <div style={{ fontWeight: 700, color: overdueInfo.isOverdue ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {matchedReturnLoan.dueDate}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Physical Copy Barcode:</span>
                    <div><code>{matchedReturnLoan.barcode}</code></div>
                  </div>
                </div>

                {/* Overdue Fine Engine */}
                <div
                  style={{
                    backgroundColor: overdueInfo.isOverdue ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${overdueInfo.isOverdue ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {overdueInfo.isOverdue ? (
                      <AlertCircle size={20} color="var(--danger)" />
                    ) : (
                      <CheckCircle2 size={20} color="var(--success)" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: overdueInfo.isOverdue ? '#991b1b' : '#166534' }}>
                        {overdueInfo.isOverdue ? `Overdue by ${overdueInfo.daysLate} day(s)` : 'Returned on Schedule'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: overdueInfo.isOverdue ? '#b91c1c' : '#15803d' }}>
                        {overdueInfo.isOverdue
                          ? `Daily Penalty Rate: ₱10.00 / day • Total Fine: ₱${overdueInfo.fine}.00`
                          : 'No overdue fines assessed. Account in good standing.'}
                      </div>
                    </div>
                  </div>

                  {overdueInfo.isOverdue && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={fineSettled}
                        onChange={(e) => setFineSettled(e.target.checked)}
                      />
                      <span style={{ fontWeight: 600 }}>Fine Paid at Counter</span>
                    </label>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteReturn()}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                >
                  <CheckCircle2 size={16} />
                  <span>Confirm Return & Release Copy to Shelf</span>
                </button>
              </div>
            ) : returnBarcode.trim() ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '13px' }}>
                No active or overdue loan record found for identifier "{returnBarcode}".
              </div>
            ) : null}

            {returnStatusMessage && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: returnStatusMessage.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: returnStatusMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${returnStatusMessage.type === 'success' ? 'var(--success-border)' : 'var(--danger-border)'}`
                }}
              >
                {returnStatusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{returnStatusMessage.text}</span>
              </div>
            )}

            {/* Quick Click from Active Loans */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Quick Return from Active Loans:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeLoans.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No books currently checked out.</span>
                ) : (
                  activeLoans.map((loan) => (
                    <button
                      key={loan.id}
                      type="button"
                      onClick={() => {
                        setReturnBarcode(loan.barcode);
                        setReturnStatusMessage(null);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px' }}
                    >
                      <span>{loan.barcode}</span>
                      <span style={{ color: 'var(--text-muted)' }}>({(loan.bookTitle || (loan as any).book_title || '').slice(0, 16)}...)</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE LOANS TABLE */}
      {activeTab === 'loans' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '16px' }}>Active & Historical Circulation Loans</h3>
            <div style={{ width: '260px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search loans, member, barcode..."
                value={loansSearch}
                onChange={(e) => setLoansSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Barcode</th>
                  <th>Patron</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  {userRole !== 'member' && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No loan records found.
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.bookTitle}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {loan.bookAuthor}</div>
                      </td>
                      <td>
                        <code style={{ fontWeight: 600 }}>{loan.barcode}</code>
                      </td>
                      <td>
                        <div>{loan.memberName}</div>
                        <code style={{ fontSize: '11px' }}>{loan.memberId}</code>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{loan.borrowDate}</td>
                      <td style={{ fontSize: '12.5px' }}>
                        <strong>{loan.dueDate}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            loan.status === 'Overdue'
                              ? 'badge-danger'
                              : loan.status === 'Returned'
                              ? 'badge-neutral'
                              : loan.status === 'Pending Approval'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>
                      {userRole !== 'member' && (
                        <td style={{ textAlign: 'right' }}>
                          {loan.status === 'Pending Approval' ? (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {onApproveBorrow && (
                                <button
                                  onClick={() => onApproveBorrow(loan.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '3px 8px', fontSize: '11px' }}
                                  title="Approve loan"
                                >
                                  <Check size={12} />
                                  <span>Approve</span>
                                </button>
                              )}
                              {onRejectBorrow && (
                                <button
                                  onClick={() => onRejectBorrow(loan.id)}
                                  className="btn btn-ghost btn-sm"
                                  style={{ color: 'var(--danger)', padding: '3px 6px' }}
                                  title="Decline loan"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          ) : (
                            loan.status !== 'Returned' && (
                              <button
                                onClick={() => onRenewBook(loan.id)}
                                className="btn btn-secondary btn-sm"
                                title="Extend Due Date by 14 days"
                              >
                                <RefreshCw size={13} />
                                <span>Renew</span>
                              </button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RESERVATIONS QUEUE */}
      {activeTab === 'reservations' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Book Hold & Reservations Queue</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Reserved By</th>
                  <th>Reservation Date</th>
                  <th>Expiry Date</th>
                  <th>Queue Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No active hold reservations.
                    </td>
                  </tr>
                ) : (
                  reservations.map((res) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 600 }}>{res.bookTitle}</td>
                      <td>
                        <div>{res.memberName}</div>
                        <code style={{ fontSize: '11px' }}>{res.memberId}</code>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{res.reservationDate}</td>
                      <td style={{ fontSize: '12.5px' }}>{res.expiryDate}</td>
                      <td>
                        {res.status === 'Ready for Pickup' ? (
                          <span className="badge badge-success">Ready for Pickup</span>
                        ) : res.status === 'Pending Approval' ? (
                          <span className="badge badge-warning">Pending Approval</span>
                        ) : res.status === 'Waiting' ? (
                          <span className="badge badge-info">Queue #{res.queuePosition}</span>
                        ) : (
                          <span className="badge badge-neutral">{res.status}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {res.status === 'Pending Approval' && onApproveReservation && (
                            <button
                              onClick={() => onApproveReservation(res.id)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              title="Approve hold and mark ready for pickup"
                            >
                              <Check size={12} />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => onCancelReservation(res.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)', padding: '3px 8px', fontSize: '11px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Scanner Modal (Member QR & Book Barcode) */}
      <CirculationScannerModal
        isOpen={scannerModal.isOpen}
        onClose={() => setScannerModal({ ...scannerModal, isOpen: false })}
        mode={scannerModal.mode}
        members={members}
        books={books}
        onCodeDetected={handleScannerDetected}
      />

      {/* Official Loan Slip Modal / Receipt */}
      <LoanSlipModal
        isOpen={loanSlipModal.isOpen}
        onClose={() => setLoanSlipModal({ isOpen: false, transaction: null })}
        transaction={loanSlipModal.transaction}
      />

      {/* Step-by-Step Issue Loan Wizard Modal with Process Indicator */}
      <IssueLoanWizardModal
        isOpen={isWizardModalOpen}
        onClose={() => setIsWizardModalOpen(false)}
        members={members}
        books={books}
        transactions={transactions}
        onConfirmBorrow={onBorrowBook}
      />
    </div>
  );
};
