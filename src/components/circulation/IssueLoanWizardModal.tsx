import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Member, Book, PhysicalCopy, CirculationTransaction, User } from '../../types';
import {
  X,
  QrCode,
  Barcode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Printer,
  RotateCcw,
  Check,
  Camera,
  Search,
  Trash2,
  Plus,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  ChevronRight,
  RefreshCw,
  Phone,
  Mail,
  Layers
} from 'lucide-react';
import { CameraScanner } from '../common/CameraScanner';
import { playSuccessBeep, playErrorTone } from '../../utils/sound';
import { StorageService } from '../../utils/storage';
import { useActionLoading } from '../../context/ActionLoadingContext';

export interface IssueLoanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  books: Book[];
  transactions: CirculationTransaction[];
  currentUser?: User;
  onConfirmBorrow: (
    memberId: string,
    barcode: string,
    dueDate: string
  ) => { success: boolean; message: string; transaction?: CirculationTransaction };
  onConfirmBorrowBatch?: (
    memberId: string,
    barcodes: string[],
    dueDate: string
  ) => { success: boolean; message: string; transactions?: CirculationTransaction[]; transaction?: CirculationTransaction };
}

export interface ScannedBookItem {
  book: Book;
  copy: PhysicalCopy;
  scannedAt: string;
}

export const IssueLoanWizardModal: React.FC<IssueLoanWizardModalProps> = ({
  isOpen,
  onClose,
  members,
  books,
  transactions,
  currentUser,
  onConfirmBorrow,
  onConfirmBorrowBatch
}) => {
  const { showActionLoading, hideActionLoading } = useActionLoading();

  // Wizard Steps: 1 = Scan Member, 2 = Scan Books, 3 = Review, 4 = Confirm / Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // System Settings & Policies
  const systemSettings = StorageService.getSystemSettings();

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + (systemSettings.standardLoanPeriodDays || 7));
  const defaultDueStr = defaultDue.toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueStr);

  // Scanner & Input State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [memberManualCode, setMemberManualCode] = useState<string>('');
  const [bookManualCode, setBookManualCode] = useState<string>('');

  // Step 1: Member State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberStatusState, setMemberStatusState] = useState<'waiting' | 'scanning' | 'verifying' | 'ready'>('waiting');

  // Step 2: Book State
  const [scannedBooks, setScannedBooks] = useState<ScannedBookItem[]>([]);
  const [lastScannedBook, setLastScannedBook] = useState<{ book: Book; copy: PhysicalCopy } | null>(null);

  // Feedback, Alerts & Transient Notices
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Step 4: Completed Transactions
  const [completedTransactions, setCompletedTransactions] = useState<CirculationTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Manual input focus ref
  const memberInputRef = useRef<HTMLInputElement>(null);
  const bookInputRef = useRef<HTMLInputElement>(null);

  // Calculate member borrowing allowance
  const memberActiveLoans = selectedMember
    ? transactions.filter((t) => t.memberId === selectedMember.memberId && (t.status === 'Active' || t.status === 'Overdue'))
    : [];

  const memberTier = selectedMember
    ? systemSettings.tierPolicies.find((p) => p.tierName.toLowerCase() === (selectedMember.membershipType || '').toLowerCase()) ||
      systemSettings.tierPolicies[0]
    : systemSettings.tierPolicies[0];

  const maxAllowedLoans = memberTier?.maxLoanLimit ?? 3;
  const currentBorrowsCount = memberActiveLoans.length;
  const remainingAllowance = Math.max(0, maxAllowedLoans - currentBorrowsCount);
  const slotsLeftInTransaction = Math.max(0, remainingAllowance - scannedBooks.length);

  // Normalize scanned string
  const cleanScannedCode = (raw: string): string => {
    let text = (raw || '').trim();
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        const parsed = JSON.parse(text);
        text = parsed.memberId || parsed.id || parsed.barcode || parsed.code || text;
      } catch {
        // use raw
      }
    }
    if (text.includes('/') && !text.includes(' ')) {
      const parts = text.split('/');
      const last = parts[parts.length - 1];
      if (last) text = last;
    }
    return text.trim();
  };

  // Find Member
  const findMemberByCode = (raw: string): Member | null => {
    const term = cleanScannedCode(raw).toUpperCase();
    if (!term) return null;
    return (
      members.find(
        (m) =>
          m.memberId.toUpperCase() === term ||
          (m.qrCodeData && m.qrCodeData.toUpperCase() === term) ||
          m.fullName.toUpperCase().includes(term) ||
          (m.email && m.email.toUpperCase() === term)
      ) || null
    );
  };

  // Find Book Copy
  const findCopyByCode = (raw: string): { book: Book; copy: PhysicalCopy } | null => {
    const term = cleanScannedCode(raw).toUpperCase();
    if (!term) return null;
    for (const b of books) {
      const copy = b.copies.find(
        (c) => c.barcode.toUpperCase() === term || c.accessionNumber.toUpperCase() === term
      );
      if (copy) return { book: b, copy };
    }
    return null;
  };

  // Reset wizard when modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedMember(null);
      setScannedBooks([]);
      setLastScannedBook(null);
      setCompletedTransactions([]);
      setErrorMessage(null);
      setWarningMessage(null);
      setSuccessNotice(null);
      setIsCameraActive(false);
      setShowManualInput(false);
      setMemberManualCode('');
      setBookManualCode('');
      setMemberStatusState('waiting');
      setDueDate(defaultDueStr);
    }
  }, [isOpen, defaultDueStr]);

  // Adjust due date when member is verified
  useEffect(() => {
    if (selectedMember) {
      const tier = systemSettings.tierPolicies.find(
        (p) => p.tierName.toLowerCase() === (selectedMember.membershipType || '').toLowerCase()
      ) || systemSettings.tierPolicies[0];
      const days = tier?.loanPeriodDays || systemSettings.standardLoanPeriodDays || 7;
      const targetDue = new Date();
      targetDue.setDate(targetDue.getDate() + days);
      setDueDate(targetDue.toISOString().split('T')[0]);
    }
  }, [selectedMember, systemSettings]);

  // Focus manual input field when toggled
  useEffect(() => {
    if (showManualInput) {
      if (currentStep === 1) {
        setTimeout(() => memberInputRef.current?.focus(), 100);
      } else if (currentStep === 2) {
        setTimeout(() => bookInputRef.current?.focus(), 100);
      }
    }
  }, [showManualInput, currentStep]);

  // Auto-switch camera mode on step change
  useEffect(() => {
    if (currentStep === 1 || currentStep === 2) {
      setIsCameraActive(false);
      setErrorMessage(null);
      setWarningMessage(null);
    } else {
      setIsCameraActive(false);
    }
  }, [currentStep]);

  // Quick physical copies available in inventory for test scans
  const availableQuickCopies = useMemo(() => {
    const list: { title: string; barcode: string; accession: string }[] = [];
    for (const b of books || []) {
      for (const c of b.copies || []) {
        if (c.status === 'Available' && c.barcode) {
          list.push({ title: b.title, barcode: c.barcode, accession: c.accessionNumber });
          if (list.length >= 6) return list;
        }
      }
    }
    return list;
  }, [books]);

  // Hardware Barcode Scanner Listener (USB / Bluetooth Keyboard Wedge Mode)
  useEffect(() => {
    if (!isOpen) return;

    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      const now = Date.now();
      if (now - lastKeyTime > 80) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3 && !isTyping) {
          e.preventDefault();
          const scanned = buffer.trim();
          buffer = '';
          if (currentStep === 1) {
            handleMemberScan(scanned);
          } else if (currentStep === 2) {
            handleBookScan(scanned);
          }
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, members, books]);

  if (!isOpen) return null;

  // ==========================================
  // STEP 1: MEMBER VERIFICATION LOGIC
  // ==========================================
  const verifyMember = (member: Member) => {
    setMemberStatusState('verifying');
    setErrorMessage(null);
    setWarningMessage(null);

    // Validate account status
    if (member.status === 'inactive' || member.status === 'suspended') {
      playErrorTone();
      setMemberStatusState('waiting');
      setErrorMessage(
        `Member account "${member.fullName}" (${member.memberId}) is ${member.status.toUpperCase()}. Circulation borrowing is restricted.`
      );
      return;
    }

    // Validate active overdue loans
    const overdues = transactions.filter((t) => t.memberId === member.memberId && t.status === 'Overdue');
    if (overdues.length > 0) {
      playErrorTone();
      setMemberStatusState('waiting');
      setErrorMessage(
        `${member.fullName} has ${overdues.length} overdue book(s) that must be returned or settled before borrowing additional titles.`
      );
      return;
    }

    // Validate active loan count
    const active = transactions.filter(
      (t) => t.memberId === member.memberId && (t.status === 'Active' || t.status === 'Overdue')
    );
    const tier = systemSettings.tierPolicies.find(
      (p) => p.tierName.toLowerCase() === (member.membershipType || '').toLowerCase()
    ) || systemSettings.tierPolicies[0];
    const limit = tier?.maxLoanLimit ?? 3;

    if (active.length >= limit) {
      playErrorTone();
      setMemberStatusState('waiting');
      setErrorMessage(
        `${member.fullName} has already reached the maximum borrowing limit (${active.length} of ${limit} books).`
      );
      return;
    }

    // Eligible!
    playSuccessBeep();
    setSelectedMember(member);
    setMemberStatusState('ready');
    setIsCameraActive(false);
    setSuccessNotice(`Member verified: ${member.fullName}`);
    setTimeout(() => setSuccessNotice(null), 1800);
  };

  const handleMemberScan = (detectedCode: string) => {
    const term = cleanScannedCode(detectedCode);
    if (!term) return;

    const found = findMemberByCode(term);
    if (!found) {
      playErrorTone();
      setMemberStatusState('waiting');
      setErrorMessage(`Scanned QR code "${term}" does not match any registered library member.`);
      return;
    }

    verifyMember(found);
  };

  const handleMemberManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberManualCode.trim()) return;
    const found = findMemberByCode(memberManualCode);
    if (!found) {
      playErrorTone();
      setErrorMessage(`No member record found matching "${memberManualCode.trim()}".`);
      return;
    }
    verifyMember(found);
    setMemberManualCode('');
  };

  // ==========================================
  // STEP 2: BOOK SCANNING & MULTI-BOOK LOGIC
  // ==========================================
  const handleAddBookCopy = (book: Book, copy: PhysicalCopy) => {
    setErrorMessage(null);
    setWarningMessage(null);

    // 1. Check if copy is already added to this transaction
    const alreadyInList = scannedBooks.some((item) => item.copy.barcode.toUpperCase() === copy.barcode.toUpperCase());
    if (alreadyInList) {
      playErrorTone();
      setWarningMessage(`Book copy "${copy.barcode}" is already in your pending borrowing list.`);
      return;
    }

    // 2. Check if another copy of the exact same book title is already in list (policy: 1 copy per title per transaction)
    const sameTitleInList = scannedBooks.some((item) => item.book.id === book.id);
    if (sameTitleInList) {
      playErrorTone();
      setWarningMessage(`A copy of "${book.title}" is already in your borrowing list. Duplicate titles per loan are restricted.`);
      return;
    }

    // 3. Check copy availability status
    if (copy.status !== 'Available') {
      playErrorTone();
      setErrorMessage(
        `Copy "${copy.barcode}" is marked as "${copy.status}" and cannot be borrowed. Only "Available" copies can be issued.`
      );
      return;
    }

    // 4. Check patron allowance limit
    if (slotsLeftInTransaction <= 0) {
      playErrorTone();
      setErrorMessage(
        `Borrowing limit reached (${scannedBooks.length} books in this transaction + ${currentBorrowsCount} active loans = ${maxAllowedLoans} maximum allowed).`
      );
      return;
    }

    // Add book!
    playSuccessBeep();
    const newItem: ScannedBookItem = {
      book,
      copy,
      scannedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setScannedBooks((prev) => [...prev, newItem]);
    setLastScannedBook({ book, copy });
    setSuccessNotice(`Added: "${book.title}"`);
    setTimeout(() => setSuccessNotice(null), 1600);
  };

  const handleBookScan = (detectedCode: string) => {
    const term = cleanScannedCode(detectedCode);
    if (!term) return;

    const result = findCopyByCode(term);
    if (!result) {
      playErrorTone();
      setErrorMessage(`Barcode "${term}" not found in library physical inventory.`);
      return;
    }

    handleAddBookCopy(result.book, result.copy);
  };

  const handleBookManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookManualCode.trim()) return;

    const result = findCopyByCode(bookManualCode);
    if (!result) {
      playErrorTone();
      setErrorMessage(`No physical book found matching barcode or accession number "${bookManualCode.trim()}".`);
      return;
    }

    handleAddBookCopy(result.book, result.copy);
    setBookManualCode('');
  };

  const handleRemoveScannedBook = (barcode: string) => {
    setScannedBooks((prev) => prev.filter((item) => item.copy.barcode !== barcode));
    if (lastScannedBook?.copy.barcode === barcode) {
      setLastScannedBook(null);
    }
    setWarningMessage(null);
    setErrorMessage(null);
  };

  // ==========================================
  // STEP 4: CONFIRM & EXECUTE BORROWING
  // ==========================================
  const handleExecuteBorrowing = async () => {
    if (!selectedMember) {
      setErrorMessage('Member verification is required.');
      return;
    }
    if (scannedBooks.length === 0) {
      setErrorMessage('Please scan at least one book before confirming.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Trigger modal loading animation with library logo
    showActionLoading({
      title: 'Issuing Library Books',
      message: `Recording ${scannedBooks.length} loan transaction(s) for ${selectedMember.fullName}...`,
      useLogo: true
    });

    try {
      const barcodes = scannedBooks.map((item) => item.copy.barcode);

      if (onConfirmBorrowBatch) {
        // Prefer batch handler if available
        const res = onConfirmBorrowBatch(selectedMember.memberId, barcodes, dueDate);
        if (res.success && res.transactions && res.transactions.length > 0) {
          setCompletedTransactions(res.transactions);
          playSuccessBeep();
          setCurrentStep(4);
        } else if (res.success && res.transaction) {
          setCompletedTransactions([res.transaction]);
          playSuccessBeep();
          setCurrentStep(4);
        } else {
          playErrorTone();
          setErrorMessage(res.message || 'Failed to complete borrowing transaction.');
        }
      } else {
        // Call per-book sequential handler
        const createdTxList: CirculationTransaction[] = [];
        let anyFailed = false;
        let failMessage = '';

        for (const item of scannedBooks) {
          const res = onConfirmBorrow(selectedMember.memberId, item.copy.barcode, dueDate);
          if (res.success && res.transaction) {
            createdTxList.push(res.transaction);
          } else if (res.success) {
            createdTxList.push({
              id: `BRW-2026-${Date.now().toString().slice(-5)}`,
              bookId: item.book.id,
              bookTitle: item.book.title,
              bookAuthor: item.book.author,
              accessionNumber: item.copy.accessionNumber,
              barcode: item.copy.barcode,
              memberId: selectedMember.memberId,
              memberName: selectedMember.fullName,
              borrowDate: todayStr,
              dueDate: dueDate,
              status: 'Active',
              renewalCount: 0,
              processedBy: currentUser?.name || 'Staff Desk'
            });
          } else {
            anyFailed = true;
            failMessage = res.message;
            break;
          }
        }

        if (anyFailed) {
          playErrorTone();
          setErrorMessage(failMessage || 'An error occurred while issuing books.');
        } else {
          setCompletedTransactions(createdTxList);
          playSuccessBeep();
          setCurrentStep(4);
        }
      }
    } catch (err: unknown) {
      playErrorTone();
      setErrorMessage(err instanceof Error ? err.message : 'Failed to finalize borrowing transaction.');
    } finally {
      setTimeout(() => {
        hideActionLoading();
        setIsSubmitting(false);
      }, 350);
    }
  };

  // Reset entire transaction wizard
  const handleResetForNextPatron = () => {
    setCurrentStep(1);
    setSelectedMember(null);
    setScannedBooks([]);
    setLastScannedBook(null);
    setCompletedTransactions([]);
    setErrorMessage(null);
    setWarningMessage(null);
    setIsCameraActive(false);
    setShowManualInput(false);
    setMemberManualCode('');
    setBookManualCode('');
    setMemberStatusState('waiting');
    setDueDate(defaultDueStr);
  };

  // Stepper Items
  const stepsConfig = [
    { num: 1, label: 'Scan Member' },
    { num: 2, label: 'Scan Books' },
    { num: 3, label: 'Review' },
    { num: 4, label: 'Confirm' }
  ];

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.70)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog animate-modal-fade-in issue-loan-modal"
        style={{
          width: '100%',
          maxWidth: '780px',
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          color: 'var(--text-primary, #0F172A)',
          borderRadius: '20px',
          border: '1px solid var(--border-main, #E2E8F0)',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(22, 101, 52, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative',
          overflow: 'hidden',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Forest Bar */}
        <div
          style={{
            height: '4px',
            backgroundColor: '#166534',
            background: 'linear-gradient(90deg, #166534 0%, #22c55e 50%, #166534 100%)'
          }}
        />

        {/* Transient Floating Success Notice */}
        {successNotice && (
          <div
            style={{
              position: 'absolute',
              top: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 60,
              backgroundColor: '#166534',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 25px -4px rgba(22, 101, 52, 0.4)',
              fontSize: '13.5px',
              fontWeight: 700,
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <Check size={18} strokeWidth={3} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL HEADER: Breadcrumb, Title, Stepper, Close      */}
        {/* ==================================================== */}
        <div
          className="issue-loan-header"
          style={{
            padding: '20px 28px 16px',
            borderBottom: '1px solid var(--border-main, #E2E8F0)',
            backgroundColor: 'var(--bg-surface, #FFFFFF)'
          }}
        >
          {/* Top row: Breadcrumb + Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>Circulation</span>
              <ChevronRight size={13} color="var(--text-subtle, #94A3B8)" />
              <span style={{ color: 'var(--deep-green, #166534)', fontWeight: 700 }}>Borrow Book</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close Borrow Book Modal"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-muted, #64748B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover, #F1F5F9)';
                e.currentTarget.style.color = 'var(--text-primary, #0F172A)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted, #64748B)';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Title & Short Description */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary, #0F172A)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}
              >
                Borrow Book
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--deep-green, #166534)',
                  backgroundColor: 'var(--light-green, #DCFCE7)',
                  border: '1px solid var(--light-green-border, #BBF7D0)',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Circulation Desk
              </span>
            </div>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted, #64748B)',
                margin: '4px 0 0',
                lineHeight: 1.4
              }}
            >
              Scan member credentials, register book copy barcodes, review borrowing terms, and confirm official library loans.
            </p>
          </div>

          {/* HORIZONTAL STEPPER */}
          <div style={{ position: 'relative', marginTop: '6px' }}>
            {/* Background connecting track */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '32px',
                right: '32px',
                height: '2px',
                backgroundColor: 'var(--border-main, #E2E8F0)',
                zIndex: 0
              }}
            />
            {/* Active connecting track */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '32px',
                width: `${((currentStep - 1) / 3) * 100}%`,
                maxWidth: 'calc(100% - 64px)',
                height: '2px',
                backgroundColor: 'var(--deep-green, #166534)',
                transition: 'width 0.3s ease',
                zIndex: 0
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                zIndex: 1
              }}
            >
              {stepsConfig.map((s) => {
                const isCompleted = currentStep > s.num;
                const isCurrent = currentStep === s.num;
                return (
                  <div
                    key={s.num}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: isCompleted ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (isCompleted && s.num < 4) {
                        setCurrentStep(s.num as 1 | 2 | 3);
                      }
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        backgroundColor: isCompleted ? 'var(--deep-green, #166534)' : isCurrent ? 'var(--bg-surface, #FFFFFF)' : 'var(--bg-subtle, #F8FAFC)',
                        color: isCompleted ? '#FFFFFF' : isCurrent ? 'var(--deep-green, #166534)' : 'var(--text-muted, #94A3B8)',
                        border: isCompleted
                          ? '2px solid var(--deep-green, #166534)'
                          : isCurrent
                          ? '2px solid var(--deep-green, #166534)'
                          : '2px solid var(--border-main, #E2E8F0)',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(22, 101, 52, 0.15)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isCompleted ? <Check size={16} strokeWidth={3} /> : s.num}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--deep-green, #166534)' : isCompleted ? 'var(--text-primary, #0F172A)' : 'var(--text-muted, #94A3B8)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* ERROR / WARNING ALERTS                               */}
        {/* ==================================================== */}
        {errorMessage && (
          <div
            style={{
              margin: '16px 28px 0',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1, lineHeight: 1.45 }}>{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#991B1B',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {warningMessage && (
          <div
            style={{
              margin: '16px 28px 0',
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#FFFBEB',
              border: '1px solid #FDE68A',
              color: '#92400E',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <AlertCircle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div style={{ flex: 1, lineHeight: 1.45 }}>{warningMessage}</div>
            <button
              onClick={() => setWarningMessage(null)}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#92400E',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL BODY CONTENT                                   */}
        {/* ==================================================== */}
        <div
          className="issue-loan-body"
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: 'var(--bg-subtle, #F8FAFC)'
          }}
        >
          {/* ==================================================== */}
          {/* STEP 1: SCAN MEMBER QR CODE                          */}
          {/* ==================================================== */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Scanning Panel */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                {/* Panel Title & Instructions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Scan Member QR Code
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                      Use the camera to scan the member’s library QR code or enter the code manually.
                    </p>
                  </div>
                </div>

                {/* Primary & Secondary Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCameraActive(!isCameraActive);
                      if (!isCameraActive) {
                        setMemberStatusState('scanning');
                      } else {
                        setMemberStatusState(selectedMember ? 'ready' : 'waiting');
                      }
                    }}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isCameraActive ? '#14532D' : '#166534',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(22, 101, 52, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={16} />
                    <span>{isCameraActive ? 'Stop Scanner' : 'Start Scanner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    style={{
                      height: '40px',
                      padding: '0 18px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: showManualInput ? '#F1F5F9' : '#FFFFFF',
                      color: '#334155',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Search size={15} />
                    <span>Manual Input</span>
                  </button>
                </div>

                {/* Camera Scanner Viewport when active */}
                {isCameraActive && (
                  <div
                    style={{
                      marginBottom: '18px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #166534',
                      backgroundColor: '#0F172A',
                      position: 'relative'
                    }}
                  >
                    <CameraScanner
                      onScan={handleMemberScan}
                      scannerId="member-qr-scanner"
                      isActive={isCameraActive}
                      mode="qr"
                      label="Point camera directly at patron's library QR code"
                    />
                  </div>
                )}

                {/* Manual Input Fallback Bar */}
                {showManualInput && (
                  <form onSubmit={handleMemberManualSubmit} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Search
                          size={16}
                          color="#94A3B8"
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          ref={memberInputRef}
                          type="text"
                          value={memberManualCode}
                          onChange={(e) => setMemberManualCode(e.target.value)}
                          placeholder="Enter Member ID (e.g. MEM-2026-00001) or Full Name..."
                          style={{
                            width: '100%',
                            height: '42px',
                            paddingLeft: '38px',
                            paddingRight: '12px',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13.5px',
                            color: '#0F172A',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          height: '42px',
                          padding: '0 18px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#166534',
                          color: '#FFFFFF',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Verify
                      </button>
                    </div>
                  </form>
                )}

                {/* TRANSACTION STATUS PANEL */}
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Scanner Status:</span>
                    {memberStatusState === 'waiting' && (
                      <span style={{ fontWeight: 600, color: '#64748B' }}>Waiting for member scan or input</span>
                    )}
                    {memberStatusState === 'scanning' && (
                      <span style={{ fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: '#22c55e',
                            animation: 'pulse 1.5s infinite'
                          }}
                        />
                        Camera active — scanning QR code...
                      </span>
                    )}
                    {memberStatusState === 'verifying' && (
                      <span style={{ fontWeight: 600, color: '#D97706' }}>Verifying member credentials...</span>
                    )}
                    {memberStatusState === 'ready' && (
                      <span style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={15} color="#166534" />
                        Ready to continue
                      </span>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      backgroundColor:
                        memberStatusState === 'ready'
                          ? '#DCFCE7'
                          : memberStatusState === 'scanning'
                          ? '#E0F2FE'
                          : '#F1F5F9',
                      color:
                        memberStatusState === 'ready'
                          ? '#166534'
                          : memberStatusState === 'scanning'
                          ? '#0284C7'
                          : '#64748B'
                    }}
                  >
                    {memberStatusState.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* MEMBER VERIFICATION CARD (Shown after successful scan) */}
              {selectedMember && (
                <div
                  className="animate-modal-fade-in"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #BBF7D0',
                    padding: '22px',
                    boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)',
                    position: 'relative'
                  }}
                >
                  {/* Verified Header Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #F1F5F9',
                      paddingBottom: '14px',
                      marginBottom: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 700, fontSize: '13.5px' }}>
                      <CheckCircle2 size={18} />
                      <span>Member Verified & Eligible to Borrow</span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        border: '1px solid #BBF7D0'
                      }}
                    >
                      {selectedMember.status.toUpperCase()} ACCOUNT
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-start' }}>
                    {/* Avatar / Photo */}
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '14px',
                        backgroundColor: '#F0FDF4',
                        border: '2px solid #BBF7D0',
                        color: '#166534',
                        fontSize: '22px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {selectedMember.photoUrl ? (
                        <img
                          src={selectedMember.photoUrl}
                          alt={selectedMember.fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        />
                      ) : (
                        selectedMember.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      )}
                    </div>

                    {/* Member Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h4 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          {selectedMember.fullName}
                        </h4>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>
                          {selectedMember.memberId}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px', fontSize: '12.5px', color: '#64748B' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <ShieldCheck size={14} color="#166534" />
                          <span>{selectedMember.membershipType || 'Standard Member'}</span>
                        </div>
                        {selectedMember.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Mail size={14} color="#64748B" />
                            <span>{selectedMember.email}</span>
                          </div>
                        )}
                        {selectedMember.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Phone size={14} color="#64748B" />
                            <span>{selectedMember.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Quota & Borrowing Count Meter */}
                      <div style={{ marginTop: '14px', backgroundColor: '#F8FAFC', borderRadius: '10px', padding: '10px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>Current Borrowing Quota:</span>
                          <span style={{ fontWeight: 700, color: '#166534' }}>
                            {currentBorrowsCount} of {maxAllowedLoans} books active ({remainingAllowance} slot{remainingAllowance !== 1 ? 's' : ''} available)
                          </span>
                        </div>
                        <div
                          style={{
                            height: '6px',
                            backgroundColor: '#E2E8F0',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(currentBorrowsCount / maxAllowedLoans) * 100}%`,
                              backgroundColor: currentBorrowsCount >= maxAllowedLoans ? '#DC2626' : '#166534',
                              borderRadius: '9999px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 2: SCAN BOOK BARCODE                            */}
          {/* ==================================================== */}
          {currentStep === 2 && selectedMember && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Member Summary Ribbon */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '12px'
                    }}
                  >
                    <UserIcon size={16} />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748B', display: 'block', fontWeight: 600 }}>Borrowing Patron</span>
                    <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>{selectedMember.fullName}</strong>
                    <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px', fontFamily: 'monospace' }}>
                      ({selectedMember.memberId})
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      backgroundColor: slotsLeftInTransaction > 0 ? '#DCFCE7' : '#FEE2E2',
                      color: slotsLeftInTransaction > 0 ? '#166534' : '#991B1B',
                      border: slotsLeftInTransaction > 0 ? '1px solid #BBF7D0' : '1px solid #FECACA'
                    }}
                  >
                    {slotsLeftInTransaction} Slot{slotsLeftInTransaction !== 1 ? 's' : ''} Remaining
                  </span>
                </div>
              </div>

              {/* Book Scanner Panel */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Barcode size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Scan Book Barcode
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0' }}>
                      Scan the barcode label or accession number on the book copy to add it to this loan.
                    </p>
                  </div>
                </div>

                {/* Primary & Fallback Actions */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCameraActive(!isCameraActive)}
                    style={{
                      flex: 1,
                      height: '40px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isCameraActive ? '#14532D' : '#166534',
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Camera size={16} />
                    <span>{isCameraActive ? 'Stop Scanner' : 'Start Scanner'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowManualInput(!showManualInput)}
                    style={{
                      height: '40px',
                      padding: '0 18px',
                      borderRadius: '10px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: showManualInput ? '#F1F5F9' : '#FFFFFF',
                      color: '#334155',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Search size={15} />
                    <span>Manual Barcode</span>
                  </button>
                </div>

                {/* Camera Viewport */}
                {isCameraActive && (
                  <div
                    style={{
                      marginBottom: '18px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '2px solid #166534',
                      backgroundColor: '#0F172A'
                    }}
                  >
                    <CameraScanner
                      onScan={handleBookScan}
                      scannerId="book-barcode-scanner"
                      isActive={isCameraActive}
                      mode="barcode"
                      label="Point camera directly at book barcode or accession label"
                    />
                  </div>
                )}

                {/* Manual Barcode Input Fallback */}
                {showManualInput && (
                  <form onSubmit={handleBookManualSubmit} style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Barcode
                          size={18}
                          color="#94A3B8"
                          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                          ref={bookInputRef}
                          type="text"
                          value={bookManualCode}
                          onChange={(e) => setBookManualCode(e.target.value)}
                          placeholder="Enter Book Barcode or Accession # (e.g. BAL-00042)..."
                          style={{
                            width: '100%',
                            height: '42px',
                            paddingLeft: '38px',
                            paddingRight: '12px',
                            borderRadius: '10px',
                            border: '1px solid #CBD5E1',
                            fontSize: '13.5px',
                            color: '#0F172A',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          height: '42px',
                          padding: '0 18px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: '#166534',
                          color: '#FFFFFF',
                          fontSize: '13.5px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Add Book
                      </button>
                    </div>
                  </form>
                )}

                {/* Quick Available Book Barcode Chips */}
                {availableQuickCopies.length > 0 && (
                  <div style={{ marginTop: '8px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '6px' }}>
                      Quick Available Book Barcodes (Inventory):
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {availableQuickCopies.map((item: { title: string; barcode: string; accession: string }) => (
                        <button
                          key={item.barcode}
                          type="button"
                          onClick={() => handleBookScan(item.barcode)}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#F8FAFC',
                            color: '#1E293B',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Click to simulate scanning "${item.title}"`}
                        >
                          <span>{item.title.length > 16 ? item.title.slice(0, 15) + '...' : item.title}</span>
                          <code style={{ fontSize: '10px', color: '#166534', backgroundColor: '#DCFCE7', padding: '1px 4px', borderRadius: '3px' }}>
                            {item.barcode}
                          </code>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Book Details Card (Most recently added/verified) */}
              {lastScannedBook && (
                <div
                  className="animate-modal-fade-in"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '64px',
                      borderRadius: '6px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8'
                    }}
                  >
                    {lastScannedBook.book.coverImage ? (
                      <img
                        src={lastScannedBook.book.coverImage}
                        alt={lastScannedBook.book.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <BookOpen size={20} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                        Just Scanned
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#DCFCE7',
                          color: '#166534'
                        }}
                      >
                        {lastScannedBook.copy.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {lastScannedBook.book.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      by {lastScannedBook.book.author} • Accession:{' '}
                      <code style={{ fontWeight: 600 }}>{lastScannedBook.copy.accessionNumber}</code> • Barcode:{' '}
                      <code style={{ fontWeight: 600 }}>{lastScannedBook.copy.barcode}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* SCANNED BOOKS LIST */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px 24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={18} color="#166534" />
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      Books in Current Transaction ({scannedBooks.length})
                    </h4>
                  </div>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Max {maxAllowedLoans} book{maxAllowedLoans !== 1 ? 's' : ''} allowed per patron
                  </span>
                </div>

                {scannedBooks.length === 0 ? (
                  <div
                    style={{
                      padding: '32px 16px',
                      textAlign: 'center',
                      borderRadius: '12px',
                      backgroundColor: '#F8FAFC',
                      border: '1px dashed #CBD5E1',
                      color: '#94A3B8'
                    }}
                  >
                    <BookOpen size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#64748B' }}>No books scanned yet</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      Scan a book barcode using the camera above or type the accession number manually.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {scannedBooks.map((item, idx) => (
                      <div
                        key={item.copy.barcode}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#E2E8F0',
                              color: '#334155',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 700,
                                color: '#0F172A',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {item.book.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', gap: '10px' }}>
                              <span>by {item.book.author}</span>
                              <span>•</span>
                              <span>
                                Accession: <code>{item.copy.accessionNumber}</code>
                              </span>
                              <span>•</span>
                              <span>
                                Barcode: <code>{item.copy.barcode}</code>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#166534',
                              backgroundColor: '#DCFCE7',
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Available
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScannedBook(item.copy.barcode)}
                            title="Remove book from transaction"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 3: REVIEW BORROWING TRANSACTION                 */}
          {/* ==================================================== */}
          {currentStep === 3 && selectedMember && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Verified Member Summary Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px 24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '8px' }}>
                  1. Borrowing Member
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '16px'
                      }}
                    >
                      {selectedMember.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                        {selectedMember.fullName}
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#64748B' }}>
                        ID: <code style={{ fontWeight: 600 }}>{selectedMember.memberId}</code> • Type: {selectedMember.membershipType || 'Standard'}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#DCFCE7',
                      color: '#166534',
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      border: '1px solid #BBF7D0'
                    }}
                  >
                    ACTIVE PATRON
                  </span>
                </div>
              </div>

              {/* Table of Selected Books */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px 24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                    2. Selected Books ({scannedBooks.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#166534',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add More Books</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#64748B' }}>
                        <th style={{ padding: '8px 12px', fontWeight: 600, width: '32px' }}>#</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Book Title & Author</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Accession #</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Barcode</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600 }}>Due Date</th>
                        <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scannedBooks.map((item, idx) => (
                        <tr key={item.copy.barcode} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '10px 12px', color: '#64748B', fontWeight: 600 }}>{idx + 1}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.book.title}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>{item.book.author}</div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <code style={{ fontWeight: 600, color: '#334155' }}>{item.copy.accessionNumber}</code>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <code style={{ fontWeight: 600, color: '#334155' }}>{item.copy.barcode}</code>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#166534', fontWeight: 700 }}>
                            {dueDate}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveScannedBook(item.copy.barcode)}
                              title="Remove"
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy & Due Date Adjustment Card */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  padding: '20px 24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '12px' }}>
                  3. Circulation Schedule & Policy Terms
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                      Date of Issue
                    </label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={15} color="#166534" />
                      <span>{todayStr} (Today)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                      Return Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      min={todayStr}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#166534'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                      Librarian in Charge
                    </label>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      {currentUser?.name || 'Circulation Desk Staff'}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    color: '#64748B',
                    lineHeight: 1.45
                  }}
                >
                  <strong style={{ color: '#334155' }}>Municipal Circulation Policy:</strong> Standard loan duration is 7 days.
                  Late returns will incur a standard overdue fine of ₱10.00/day. Patrons may renew books once prior to due date if no pending reservation holds exist.
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* STEP 4: SUCCESS RECEIPT MODAL SCREEN                 */}
          {/* ==================================================== */}
          {currentStep === 4 && (
            <div className="animate-modal-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Success Hero Badge */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  border: '3px solid #BBF7D0',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  boxShadow: '0 8px 16px rgba(22, 101, 52, 0.15)'
                }}
              >
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Borrowing Successful!
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 20px', textAlign: 'center', maxWidth: '420px' }}>
                {completedTransactions.length} book{completedTransactions.length !== 1 ? 's have' : ' has'} been officially issued to{' '}
                <strong style={{ color: '#0F172A' }}>{selectedMember?.fullName}</strong>.
              </p>

              {/* Printable Receipt Card */}
              <div
                id="printable-borrow-receipt"
                style={{
                  width: '100%',
                  maxWidth: '540px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '2px dashed #CBD5E1',
                  padding: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  marginBottom: '20px'
                }}
              >
                {/* Receipt Header with Library Logo */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px', marginBottom: '16px' }}>
                  <img
                    src="/logo.png"
                    alt="Balingasag Municipal Library"
                    style={{ width: '40px', height: '40px', objectFit: 'contain', margin: '0 auto 6px', display: 'block' }}
                  />
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748B', fontWeight: 700 }}>
                    Municipality of Balingasag • Misamis Oriental
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#166534' }}>
                    Balingasag Municipal Library
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                    Official Circulation Loan Receipt
                  </div>
                </div>

                {/* Receipt Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Member / Borrower</span>
                    <strong style={{ color: '#0F172A', fontSize: '13px' }}>{selectedMember?.fullName}</strong>
                    <div style={{ color: '#64748B', fontSize: '11px', fontFamily: 'monospace' }}>{selectedMember?.memberId}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '11px' }}>Date Borrowed</span>
                    <strong style={{ color: '#0F172A', fontSize: '13px' }}>{todayStr}</strong>
                    <div style={{ color: '#166534', fontSize: '11.5px', fontWeight: 700 }}>Due: {dueDate}</div>
                  </div>
                </div>

                {/* Table of Issued Books */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Issued Books
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {completedTransactions.map((tx, idx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12.5px',
                          padding: '6px 0',
                          borderBottom: idx !== completedTransactions.length - 1 ? '1px dashed #F1F5F9' : 'none'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{tx.bookTitle}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            Ref: <code>{tx.id}</code> • Barcode: <code>{tx.barcode}</code>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>Due {tx.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Footer */}
                <div
                  style={{
                    borderTop: '1px solid #E2E8F0',
                    marginTop: '16px',
                    paddingTop: '12px',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#94A3B8'
                  }}
                >
                  Issued by: {currentUser?.name || 'Staff Desk'} • Please preserve this slip until books are cleared.
                </div>
              </div>

              {/* Action Buttons for Step 4 */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '540px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetForNextPatron}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#166534',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Start Another Transaction</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER NAVIGATION (Steps 1, 2, 3)              */}
        {/* ==================================================== */}
        {currentStep < 4 && (
          <div
            className="issue-loan-footer"
            style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--border-main, #E2E8F0)',
              backgroundColor: 'var(--bg-surface, #FFFFFF)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((currentStep - 1) as 1 | 2 | 3)}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong, #CBD5E1)',
                    backgroundColor: 'var(--bg-surface, #FFFFFF)',
                    color: 'var(--text-secondary, #475569)',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={15} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    height: '38px',
                    padding: '0 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-strong, #CBD5E1)',
                    backgroundColor: 'var(--bg-surface, #FFFFFF)',
                    color: 'var(--text-muted, #64748B)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {currentStep === 1 && (
                <button
                  type="button"
                  disabled={!selectedMember || memberStatusState !== 'ready'}
                  onClick={() => {
                    if (selectedMember && memberStatusState === 'ready') {
                      setCurrentStep(2);
                    }
                  }}
                  style={{
                    height: '38px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: selectedMember && memberStatusState === 'ready' ? '#166534' : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: selectedMember && memberStatusState === 'ready' ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Proceed to Scan Books</span>
                  <ArrowRight size={15} />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  disabled={scannedBooks.length === 0}
                  onClick={() => {
                    if (scannedBooks.length > 0) {
                      setCurrentStep(3);
                    }
                  }}
                  style={{
                    height: '38px',
                    padding: '0 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: scannedBooks.length > 0 ? '#166534' : '#CBD5E1',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: scannedBooks.length > 0 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>Review Borrowing ({scannedBooks.length})</span>
                  <ArrowRight size={15} />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  disabled={isSubmitting || scannedBooks.length === 0}
                  onClick={handleExecuteBorrowing}
                  style={{
                    height: '40px',
                    padding: '0 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSubmitting ? '#14532D' : '#166534',
                    color: '#FFFFFF',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Confirming...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm Borrowing</span>
                      <Check size={16} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
