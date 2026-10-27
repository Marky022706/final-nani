import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Member, Book, CirculationTransaction, User } from '../../types';
import {
  X,
  QrCode,
  Barcode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  Check,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  CheckCheck
} from 'lucide-react';
import { CameraScanner } from '../common/CameraScanner';
import { playSuccessBeep, playErrorTone } from '../../utils/sound';
import { StorageService } from '../../utils/storage';
import { useTheme } from '../../context/ThemeContext';

export interface ReturnBookWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  books: Book[];
  transactions: CirculationTransaction[];
  currentUser?: User;
  onConfirmReturn: (
    barcode: string
  ) => Promise<{ success: boolean; message: string; transaction?: CirculationTransaction; fine?: number }> | { success: boolean; message: string; transaction?: CirculationTransaction; fine?: number };
}

export const ReturnBookWizardModal: React.FC<ReturnBookWizardModalProps> = ({
  isOpen,
  onClose,
  members,
  books,
  transactions,
  currentUser: _currentUser,
  onConfirmReturn
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Steps:
  // 1 = Scan Member Library QR
  // 2 = Select which borrowed book to return
  // 3 = Scan physical book barcode to verify
  // 4 = Modal Successful Overlay
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // System Settings
  const systemSettings = StorageService.getSystemSettings();

  // Selected Member State
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberManualInput, setMemberManualInput] = useState<string>('');

  // Selected Loan to Return State
  const [selectedLoan, setSelectedLoan] = useState<CirculationTransaction | null>(null);

  // Verification State
  const [bookManualInput, setBookManualInput] = useState<string>('');

  // Feedback & Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Successful Return Record for Step 4 Modal Overlay
  const [lastReturnedRecord, setLastReturnedRecord] = useState<{
    loan: CirculationTransaction;
    returnedAt: string;
    fineAmount: number;
    daysLate: number;
    isOverdue: boolean;
    restockedShelf: string;
  } | null>(null);

  // Hardware Scanner buffer
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  // Helper to normalize alphanumeric code
  const normAlnum = (str: string) => String(str ?? '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // Reset wizard on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedMember(null);
      setSelectedLoan(null);
      setMemberManualInput('');
      setBookManualInput('');
      setErrorMessage(null);
      setLastReturnedRecord(null);
    }
  }, [isOpen]);

  // Find active loans for a given member
  const getMemberActiveLoans = (m: Member | null): CirculationTransaction[] => {
    if (!m) return [];
    const mIdUpper = String(m.memberId ?? '').toUpperCase();
    const idUpper = String(m.id ?? '').toUpperCase();
    return (transactions || []).filter(
      (t) =>
        (String(t.memberId ?? '').toUpperCase() === mIdUpper ||
         String(t.memberId ?? '').toUpperCase() === idUpper) &&
        (t.status === 'Active' || t.status === 'Overdue')
    );
  };

  // Active loans for currently selected member
  const currentMemberLoans = useMemo(() => {
    return getMemberActiveLoans(selectedMember);
  }, [selectedMember, transactions]);

  // Compute fine info for a given transaction
  const computeLoanOverdueInfo = (loan: CirculationTransaction | null) => {
    if (!loan) return { isOverdue: false, daysLate: 0, fine: 0, rate: 5, isExempt: false };
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const m = members.find(
        (mem) =>
          String(mem.memberId).toUpperCase() === String(loan.memberId).toUpperCase() ||
          String(mem.id).toUpperCase() === String(loan.memberId).toUpperCase()
      );
      const tier = systemSettings.tierPolicies.find(
        (p) => p.tierName.toLowerCase() === (m?.membershipType || '').toLowerCase()
      ) || systemSettings.tierPolicies[0];

      if (tier?.fineExempt) {
        return { isOverdue: true, daysLate: diffDays, fine: 0, rate: 0, isExempt: true };
      }

      const grace = tier?.gracePeriodDays ?? systemSettings.gracePeriodDays ?? 1;
      const chargeableDays = Math.max(0, diffDays - grace);
      const rate = tier?.dailyFineRate ?? systemSettings.dailyFineRate ?? 5;
      const rawFine = chargeableDays * rate;
      return { isOverdue: true, daysLate: diffDays, fine: rawFine, rate, isExempt: false };
    }

    return { isOverdue: false, daysLate: 0, fine: 0, rate: 5, isExempt: false };
  };

  // =========================================================================
  // STEP 1: VERIFY MEMBER QR
  // =========================================================================
  const handleProcessMemberCode = (detectedCode: string) => {
    setErrorMessage(null);
    let term = (detectedCode || '').trim();
    if (term.startsWith('{') && term.endsWith('}')) {
      try {
        const parsed = JSON.parse(term);
        term = parsed.memberId || parsed.id || parsed.code || term;
      } catch {
        // use raw
      }
    }
    const cleanTerm = term.trim();
    const normTerm = normAlnum(cleanTerm);

    const found = members.find((m) => {
      const mIdNorm = normAlnum(m.memberId);
      const idNorm = normAlnum(m.id);
      const qrNorm = normAlnum(m.qrCodeData || '');
      return (
        mIdNorm === normTerm ||
        idNorm === normTerm ||
        (qrNorm && qrNorm === normTerm) ||
        String(m.fullName ?? '').toUpperCase().includes(cleanTerm.toUpperCase())
      );
    });

    if (!found) {
      playErrorTone();
      setErrorMessage(`No library member found matching QR data "${cleanTerm}". Please verify the patron card.`);
      return;
    }

    // Check member's active loans
    const memberLoans = getMemberActiveLoans(found);
    if (memberLoans.length === 0) {
      playErrorTone();
      setSelectedMember(found);
      setErrorMessage(`Patron ${found.fullName} (${found.memberId}) has no currently active or overdue borrowed books to return.`);
      return;
    }

    playSuccessBeep();
    setSelectedMember(found);
    setSelectedLoan(memberLoans[0] || null); // preselect first
    setCurrentStep(2);
  };

  // =========================================================================
  // STEP 2: SELECT BOOK TO RETURN
  // =========================================================================
  const handleSelectLoanToReturn = (loan: CirculationTransaction) => {
    setSelectedLoan(loan);
    setErrorMessage(null);
  };

  const handleProceedToBarcodeScan = () => {
    if (!selectedLoan) {
      setErrorMessage('Please select a borrowed book from the list to return.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(3);
  };

  // =========================================================================
  // STEP 3: SCAN PHYSICAL BOOK BARCODE & EXECUTE RETURN
  // =========================================================================
  const handleProcessBookBarcode = async (detectedBarcode: string) => {
    if (!selectedLoan) return;
    setErrorMessage(null);

    const rawScanned = (detectedBarcode || '').trim();
    const normScanned = normAlnum(rawScanned);
    const normExpectedBarcode = normAlnum(selectedLoan.barcode);
    const normExpectedAccession = normAlnum(selectedLoan.accessionNumber || '');

    // Physical verification check
    const isBarcodeMatch =
      normScanned === normExpectedBarcode ||
      (normExpectedAccession && normScanned === normExpectedAccession) ||
      rawScanned.toUpperCase() === String(selectedLoan.barcode).toUpperCase() ||
      rawScanned.toUpperCase() === String(selectedLoan.accessionNumber).toUpperCase();

    if (!isBarcodeMatch) {
      playErrorTone();
      setErrorMessage(
        `Barcode Mismatch! Scanned "${rawScanned}" does not match the selected book "${selectedLoan.bookTitle}". (Expected Barcode: ${selectedLoan.barcode}). Please scan the exact physical copy being returned.`
      );
      return;
    }

    // Barcode matched! Execute return
    try {
      setIsSubmitting(true);

      const overdueInfo = computeLoanOverdueInfo(selectedLoan);
      const res = await onConfirmReturn(selectedLoan.barcode);

      if (res && !res.success) {
        playErrorTone();
        setErrorMessage(res.message || 'Failed to process book return in library inventory.');
        return;
      }

      playSuccessBeep();

      // Find shelf location if available
      const matchedBook = books.find((b) => b.id === selectedLoan.bookId || b.title === selectedLoan.bookTitle);
      const matchedCopy = matchedBook?.copies?.find((c) => c.barcode === selectedLoan.barcode);
      const restockedShelf = matchedCopy?.shelfLocation || 'General Reference Stacks';

      setLastReturnedRecord({
        loan: selectedLoan,
        returnedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        fineAmount: overdueInfo.fine,
        daysLate: overdueInfo.daysLate,
        isOverdue: overdueInfo.isOverdue,
        restockedShelf
      });

      // Advance to Step 4: Modal Successful Overlay!
      setCurrentStep(4);
    } catch (err: unknown) {
      playErrorTone();
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while confirming the book return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hardware Scanner (USB Keyboard Wedge) Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 120) {
        barcodeBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        const buffer = barcodeBufferRef.current.trim();
        if (buffer.length >= 3) {
          e.preventDefault();
          if (currentStep === 1) {
            handleProcessMemberCode(buffer);
          } else if (currentStep === 3) {
            handleProcessBookBarcode(buffer);
          }
        }
        barcodeBufferRef.current = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, selectedLoan, onClose]);

  if (!isOpen) return null;

  // Step 4 actions
  const remainingLoansForMember = selectedMember
    ? (transactions || []).filter(
        (t) =>
          (String(t.memberId).toUpperCase() === String(selectedMember.memberId).toUpperCase() ||
           String(t.memberId).toUpperCase() === String(selectedMember.id).toUpperCase()) &&
          (t.status === 'Active' || t.status === 'Overdue') &&
          t.barcode !== lastReturnedRecord?.loan.barcode
      )
    : [];

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
        className="modal-dialog animate-modal-fade-in return-book-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: currentStep === 4 ? '620px' : '720px',
          backgroundColor: isDark ? 'var(--bg-surface, #121e16)' : 'var(--bg-surface, #FFFFFF)',
          color: isDark ? 'var(--text-primary, #f1f5f9)' : 'var(--text-primary, #0F172A)',
          borderRadius: '20px',
          border: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)',
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(74, 222, 128, 0.2)'
            : '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(22, 101, 52, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative',
          overflow: 'hidden',
          transition: 'max-width 0.25s ease'
        }}
      >
        {/* ==================================================== */}
        {/* MODAL HEADER WITH BREADCRUMB STEPPER                 */}
        {/* ==================================================== */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)',
            backgroundColor: isDark ? 'var(--bg-surface, #121e16)' : 'var(--bg-subtle, #F8FAFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7',
                border: isDark ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid #86EFAC',
                color: isDark ? '#4ade80' : '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {currentStep === 4 ? (
                <CheckCircle2 size={22} color={isDark ? '#4ade80' : '#166534'} />
              ) : currentStep === 3 ? (
                <Barcode size={22} />
              ) : currentStep === 2 ? (
                <BookOpen size={22} />
              ) : (
                <QrCode size={22} />
              )}
            </div>
            <div>
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: 800,
                  margin: 0,
                  color: isDark ? 'var(--text-primary, #f1f5f9)' : 'var(--text-primary, #0F172A)'
                }}
              >
                {currentStep === 4
                  ? 'Return Successful Overlay'
                  : currentStep === 3
                  ? 'Step 3: Scan Book Physical Barcode'
                  : currentStep === 2
                  ? 'Step 2: Select Borrowed Book to Return'
                  : 'Step 1: Scan Member Library QR'}
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  color: isDark ? 'var(--text-muted, #94a3b8)' : 'var(--text-muted, #64748B)',
                  margin: '2px 0 0'
                }}
              >
                {currentStep === 4
                  ? 'Official check-in verification & shelf restock confirmation'
                  : currentStep === 3
                  ? `Verifying physical barcode for "${selectedLoan?.bookTitle}"`
                  : currentStep === 2
                  ? `Choose which book patron ${selectedMember?.fullName} is handing in`
                  : 'Scan patron digital QR card or physical membership pass'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{
              padding: '6px',
              borderRadius: '8px',
              color: isDark ? 'var(--text-muted, #94a3b8)' : undefined
            }}
            title="Close Wizard"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar (Only during Steps 1-3) */}
        {currentStep < 4 && (
          <div
            style={{
              padding: '10px 24px',
              borderBottom: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-subtle, #E2E8F0)',
              backgroundColor: isDark ? 'var(--bg-subtle, #16241b)' : '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            {[
              { num: 1, label: '1. Scan Member QR' },
              { num: 2, label: '2. Select Book' },
              { num: 3, label: '3. Scan Barcode' }
            ].map((s) => {
              const isCurrent = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent
                      ? (isDark ? '#4ade80' : '#166534')
                      : isCompleted
                      ? (isDark ? '#86efac' : '#15803D')
                      : (isDark ? '#64748b' : '#94a3b8')
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: isCompleted
                        ? (isDark ? '#22c55e' : '#166534')
                        : isCurrent
                        ? (isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7')
                        : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'),
                      color: isCompleted
                        ? (isDark ? '#0b130e' : '#FFFFFF')
                        : isCurrent
                        ? (isDark ? '#4ade80' : '#166534')
                        : (isDark ? '#94a3b8' : '#64748B'),
                      border: isCurrent ? (isDark ? '1px solid #4ade80' : '1px solid #166534') : 'none'
                    }}
                  >
                    {isCompleted ? <Check size={12} strokeWidth={3} /> : s.num}
                  </div>
                  <span>{s.label}</span>
                  {s.num < 3 && <ChevronRight size={14} style={{ opacity: 0.4, margin: '0 2px' }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Error Alert Message */}
        {errorMessage && (
          <div
            style={{
              margin: '14px 24px 0',
              padding: '10px 14px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FCA5A5',
              color: isDark ? '#fca5a5' : '#991B1B',
              borderRadius: '8px',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={16} color={isDark ? '#f87171' : '#DC2626'} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* MODAL BODY (STEP CONTENT)                            */}
        {/* ==================================================== */}
        <div className="modal-body" style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* ========================================================= */}
          {/* STEP 1: SCAN MEMBER LIBRARY QR                            */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-modal-fade-in">
              <CameraScanner
                scannerId="return-wizard-member-qr-cam"
                mode="qr"
                reticleShape="square"
                isActive={isOpen && currentStep === 1}
                label="Align patron library QR code inside the viewfinder"
                onScan={(code) => handleProcessMemberCode(code)}
              />

              {/* Quick Member Test Chips */}
              {members && members.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isDark ? 'var(--text-secondary, #cbd5e1)' : '#475569',
                      marginBottom: '6px'
                    }}
                  >
                    Quick Patron Test Chips (Borrowers with Active Loans):
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {members
                      .filter((m) => getMemberActiveLoans(m).length > 0)
                      .slice(0, 6)
                      .map((m) => {
                        const loansCount = getMemberActiveLoans(m).length;
                        return (
                          <button
                            key={m.id || m.memberId}
                            type="button"
                            onClick={() => handleProcessMemberCode(m.memberId)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '11.5px',
                              padding: '5px 10px',
                              gap: '4px',
                              borderRadius: '8px'
                            }}
                          >
                            <span>{m.fullName.split(' ')[0]}</span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: '4px',
                                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
                                color: isDark ? '#4ade80' : '#166534'
                              }}
                            >
                              {loansCount} book{loansCount !== 1 ? 's' : ''}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Manual Member ID Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (memberManualInput.trim()) {
                    handleProcessMemberCode(memberManualInput);
                  }
                }}
                style={{ marginTop: '4px' }}
              >
                <label
                  className="form-label"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isDark ? 'var(--text-secondary, #cbd5e1)' : '#475569'
                  }}
                >
                  Or enter Member ID / QR code data:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BPL-2026-0001 or patron full name"
                    value={memberManualInput}
                    onChange={(e) => setMemberManualInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ minWidth: '90px' }}>
                    Verify
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: SELECT BORROWED BOOK TO RETURN                    */}
          {/* ========================================================= */}
          {currentStep === 2 && selectedMember && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-modal-fade-in">
              {/* Verified Member Header Summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'var(--bg-subtle, #16241b)' : 'var(--bg-subtle, #F8FAFC)',
                  border: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
                      color: isDark ? '#4ade80' : '#166534',
                      border: isDark ? '2px solid rgba(74, 222, 128, 0.4)' : '2px solid #86EFAC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}
                  >
                    {selectedMember.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0F172A' }}>
                        {selectedMember.fullName}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
                          color: isDark ? '#4ade80' : '#166534'
                        }}
                      >
                        {selectedMember.membershipType}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748B', marginTop: '2px' }}>
                      Member ID: <code style={{ color: isDark ? '#4ade80' : '#166534' }}>{selectedMember.memberId}</code> • Active Loans: <strong>{currentMemberLoans.length}</strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setCurrentStep(1);
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11.5px', gap: '4px' }}
                >
                  <RotateCcw size={12} />
                  <span>Change Patron</span>
                </button>
              </div>

              {/* Book Selection Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#334155' }}>
                  Mamili kung unsa nga libro ang i-uli ({currentMemberLoans.length} kasamtangang gi-hulam):
                </span>
                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748B' }}>
                  Click a book card to select
                </span>
              </div>

              {/* List of Borrowed Books Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {currentMemberLoans.map((loan) => {
                  const isSelected = selectedLoan?.id === loan.id;
                  const overdueInfo = computeLoanOverdueInfo(loan);

                  return (
                    <div
                      key={loan.id}
                      onClick={() => handleSelectLoanToReturn(loan)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isSelected
                          ? isDark
                            ? '2px solid #22c55e'
                            : '2px solid #166534'
                          : isDark
                          ? '1px solid var(--border-main, #1f3527)'
                          : '1px solid var(--border-main, #E2E8F0)',
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(34, 197, 94, 0.12)'
                            : '#F0FDF4'
                          : isDark
                          ? 'var(--bg-subtle, #16241b)'
                          : '#FFFFFF',
                        boxShadow: isSelected ? '0 4px 12px rgba(22, 101, 52, 0.12)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                          {/* Radio circle selector */}
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              border: isSelected
                                ? isDark
                                  ? '6px solid #22c55e'
                                  : '6px solid #166534'
                                : isDark
                                ? '2px solid #64748b'
                                : '2px solid #CBD5E1',
                              backgroundColor: isDark ? 'var(--bg-surface, #121e16)' : '#FFFFFF',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}
                          />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0F172A', lineHeight: 1.3 }}>
                              {loan.bookTitle}
                            </div>
                            <div style={{ fontSize: '12.5px', color: isDark ? '#cbd5e1' : '#475569', marginTop: '2px' }}>
                              Author: {loan.bookAuthor}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748B' }}>
                              <span>Barcode: <code style={{ fontFamily: 'monospace', color: isDark ? '#4ade80' : '#166534' }}>{loan.barcode}</code></span>
                              {loan.accessionNumber && (
                                <span>Accession: <code style={{ fontFamily: 'monospace' }}>{loan.accessionNumber}</code></span>
                              )}
                              <span>Due: <strong>{loan.dueDate}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Status & Fine Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: overdueInfo.isOverdue
                                ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')
                                : (isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7'),
                              color: overdueInfo.isOverdue
                                ? (isDark ? '#f87171' : '#DC2626')
                                : (isDark ? '#4ade80' : '#166534'),
                              border: overdueInfo.isOverdue
                                ? (isDark ? '1px solid rgba(248, 113, 113, 0.35)' : 'none')
                                : (isDark ? '1px solid rgba(74, 222, 128, 0.35)' : 'none')
                            }}
                          >
                            {overdueInfo.isOverdue ? `Overdue (${overdueInfo.daysLate}d late)` : 'On Schedule'}
                          </span>
                          {overdueInfo.isOverdue && (
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#f87171' : '#DC2626' }}>
                              Fine: ₱{overdueInfo.fine.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: SCAN PHYSICAL BOOK BARCODE TO VERIFY              */}
          {/* ========================================================= */}
          {currentStep === 3 && selectedLoan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-modal-fade-in">
              {/* Selected Target Book Card */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4',
                  border: isDark ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid #BBF7D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: isDark ? '#4ade80' : '#166534' }}>
                    Target Book Being Returned:
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0F172A', marginTop: '2px' }}>
                    {selectedLoan.bookTitle}
                  </div>
                  <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569' }}>
                    Author: {selectedLoan.bookAuthor} • Expected Barcode: <strong style={{ color: isDark ? '#4ade80' : '#166534', fontFamily: 'monospace' }}>{selectedLoan.barcode}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '11.5px', gap: '4px' }}
                >
                  <ArrowLeft size={12} />
                  <span>Choose Another</span>
                </button>
              </div>

              {/* Barcode Camera Viewfinder */}
              <CameraScanner
                scannerId="return-wizard-book-barcode-cam"
                mode="barcode"
                reticleShape="barcode"
                isActive={isOpen && currentStep === 3}
                label="Align laser across physical barcode on the book cover or title page"
                onScan={(code) => handleProcessBookBarcode(code)}
              />

              {/* Quick Simulate Barcode Scan Button (For browser / mouse users) */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: isDark ? 'var(--bg-subtle, #16241b)' : 'var(--bg-subtle, #F8FAFC)',
                  border: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '12px', color: isDark ? '#cbd5e1' : '#475569' }}>
                  Quick Verification Simulation (Expected Barcode):
                </div>
                <button
                  type="button"
                  onClick={() => handleProcessBookBarcode(selectedLoan.barcode)}
                  disabled={isSubmitting}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    gap: '6px',
                    color: isDark ? '#4ade80' : '#166534'
                  }}
                >
                  <Barcode size={14} />
                  <span>Verify Barcode ({selectedLoan.barcode})</span>
                </button>
              </div>

              {/* Manual Barcode Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (bookManualInput.trim()) {
                    handleProcessBookBarcode(bookManualInput);
                  }
                }}
              >
                <label
                  className="form-label"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isDark ? 'var(--text-secondary, #cbd5e1)' : '#475569'
                  }}
                >
                  Or enter scanned book barcode manually:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`e.g. ${selectedLoan.barcode}`}
                    value={bookManualInput}
                    onChange={(e) => setBookManualInput(e.target.value)}
                  />
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ minWidth: '90px' }}>
                    {isSubmitting ? 'Verifying...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: MODAL SUCCESSFUL OVERLAY                          */}
          {/* ========================================================= */}
          {currentStep === 4 && lastReturnedRecord && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '16px',
                padding: '8px 4px'
              }}
              className="animate-modal-fade-in"
            >
              {/* Pulsing Success Ring Badge */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
                  border: isDark ? '3px solid #22c55e' : '3px solid #166534',
                  color: isDark ? '#4ade80' : '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDark
                    ? '0 0 30px rgba(34, 197, 94, 0.4)'
                    : '0 0 25px rgba(22, 101, 52, 0.25)',
                  animation: 'modalScaleUp 0.35s ease'
                }}
              >
                <CheckCircle2 size={44} strokeWidth={2.6} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
                    color: isDark ? '#4ade80' : '#166534',
                    border: isDark ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid #86EFAC'
                  }}
                >
                  Return Verified & Restocked
                </span>
                <h3
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: isDark ? 'var(--text-primary, #f1f5f9)' : '#0F172A',
                    margin: '8px 0 4px',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Book Return Completed Successfully!
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: isDark ? 'var(--text-muted, #94a3b8)' : '#64748B',
                    margin: 0
                  }}
                >
                  Malamposong na-check in ug na-ibalik ang libro sa sirkulasyon sa Balingasag Public Library.
                </p>
              </div>

              {/* Complete Return Receipt Card */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '14px',
                  backgroundColor: isDark ? 'var(--bg-subtle, #16241b)' : 'var(--bg-subtle, #F8FAFC)',
                  border: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)',
                  padding: '16px 18px',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#94a3b8' : '#64748B', textTransform: 'uppercase' }}>
                    Returned Book Title:
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#0F172A' }}>
                    {lastReturnedRecord.loan.bookTitle}
                  </div>
                  <div style={{ fontSize: '12.5px', color: isDark ? '#cbd5e1' : '#475569' }}>
                    by {lastReturnedRecord.loan.bookAuthor}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px 14px',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                    paddingTop: '10px',
                    fontSize: '12px'
                  }}
                >
                  <div>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748B' }}>Returned by Patron:</span>
                    <div style={{ fontWeight: 700, color: isDark ? '#f1f5f9' : '#0F172A' }}>
                      {lastReturnedRecord.loan.memberName} (<code style={{ color: isDark ? '#4ade80' : '#166534' }}>{lastReturnedRecord.loan.memberId}</code>)
                    </div>
                  </div>

                  <div>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748B' }}>Verified Barcode:</span>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: isDark ? '#4ade80' : '#166534' }}>
                      {lastReturnedRecord.loan.barcode}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748B' }}>Return Timestamp:</span>
                    <div style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0F172A' }}>
                      {new Date().toLocaleDateString()} at {lastReturnedRecord.returnedAt}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: isDark ? '#94a3b8' : '#64748B' }}>Restocked Shelf Location:</span>
                    <div style={{ fontWeight: 600, color: isDark ? '#f1f5f9' : '#0F172A' }}>
                      {lastReturnedRecord.restockedShelf}
                    </div>
                  </div>
                </div>

                {/* Overdue Fine Status Box */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: lastReturnedRecord.isOverdue
                      ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2')
                      : (isDark ? 'rgba(34, 197, 94, 0.14)' : '#F0FDF4'),
                    border: lastReturnedRecord.isOverdue
                      ? (isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FECACA')
                      : (isDark ? '1px solid rgba(74, 222, 128, 0.35)' : '1px solid #BBF7D0'),
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={16} color={lastReturnedRecord.isOverdue ? (isDark ? '#f87171' : '#DC2626') : (isDark ? '#4ade80' : '#166534')} />
                    <span style={{ fontWeight: 700, color: lastReturnedRecord.isOverdue ? (isDark ? '#fca5a5' : '#991B1B') : (isDark ? '#86efac' : '#166534') }}>
                      {lastReturnedRecord.isOverdue
                        ? `Overdue Fine: ₱${lastReturnedRecord.fineAmount.toFixed(2)} (${lastReturnedRecord.daysLate} day(s) late)`
                        : 'Overdue Fines: ₱0.00 • Returned on Schedule'}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: lastReturnedRecord.isOverdue ? (isDark ? '#f87171' : '#DC2626') : (isDark ? '#4ade80' : '#166534')
                    }}
                  >
                    {lastReturnedRecord.isOverdue ? 'Settled at Counter' : 'Account in Good Standing'}
                  </span>
                </div>

                {/* Restored Quota Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: isDark ? '#4ade80' : '#166534',
                    fontWeight: 600
                  }}
                >
                  <CheckCheck size={16} />
                  <span>1 borrowing slot restored to patron account ({selectedMember?.fullName})</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER ACTIONS                                 */}
        {/* ==================================================== */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 24px',
            borderTop: isDark ? '1px solid var(--border-main, #1f3527)' : '1px solid var(--border-main, #E2E8F0)',
            backgroundColor: isDark ? 'var(--bg-surface, #121e16)' : 'var(--bg-subtle, #F8FAFC)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}
        >
          {/* Left button: Back or Reset */}
          <div>
            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="btn btn-secondary btn-sm"
                style={{ height: '36px', fontSize: '12.5px', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Member Scan</span>
              </button>
            )}
            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary btn-sm"
                style={{ height: '36px', fontSize: '12.5px', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                <span>Back to Book List</span>
              </button>
            )}
          </div>

          {/* Right buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {currentStep === 1 && (
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ height: '38px', fontSize: '13px' }}
              >
                Cancel
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={handleProceedToBarcodeScan}
                disabled={!selectedLoan}
                className="btn btn-primary"
                style={{
                  height: '38px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: isDark ? '#22c55e' : '#166534',
                  color: isDark ? '#0b130e' : '#FFFFFF',
                  gap: '6px'
                }}
              >
                <span>Proceed to Barcode Scan</span>
                <ArrowRight size={15} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedLoan) {
                    handleProcessBookBarcode(selectedLoan.barcode);
                  }
                }}
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  height: '38px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: isDark ? '#22c55e' : '#166534',
                  color: isDark ? '#0b130e' : '#FFFFFF',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isSubmitting ? 'Confirming Return...' : 'Confirm Book Return'}</span>
              </button>
            )}

            {currentStep === 4 && (
              <>
                {remainingLoansForMember.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLoan(remainingLoansForMember[0] || null);
                      setErrorMessage(null);
                      setCurrentStep(2);
                    }}
                    className="btn btn-secondary"
                    style={{ height: '38px', fontSize: '13px', gap: '6px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Return Another Book for This Member ({remainingLoansForMember.length} left)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setSelectedLoan(null);
                    setCurrentStep(1);
                  }}
                  className="btn btn-secondary"
                  style={{ height: '38px', fontSize: '13px', gap: '6px' }}
                >
                  <RefreshCw size={14} />
                  <span>Return Books for Another Patron</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{
                    height: '38px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor: isDark ? '#22c55e' : '#166534',
                    color: isDark ? '#0b130e' : '#FFFFFF',
                    gap: '6px'
                  }}
                >
                  <Check size={16} />
                  <span>Done / Close</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
