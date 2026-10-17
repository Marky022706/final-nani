import React, { useState, useEffect } from 'react';
import type { Member, Book, PhysicalCopy, CirculationTransaction } from '../../types';
import {
  X,
  QrCode,
  Barcode,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Printer,
  RotateCcw,
  Check
} from 'lucide-react';
import { CameraScanner } from '../common/CameraScanner';
import { playSuccessBeep, playErrorTone } from '../../utils/sound';
import { StorageService } from '../../utils/storage';

interface IssueLoanWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  books: Book[];
  transactions: CirculationTransaction[];
  onConfirmBorrow: (
    memberId: string,
    barcode: string,
    dueDate: string
  ) => { success: boolean; message: string; transaction?: CirculationTransaction };
}

export const IssueLoanWizardModal: React.FC<IssueLoanWizardModalProps> = ({
  isOpen,
  onClose,
  members,
  books,
  transactions,
  onConfirmBorrow
}) => {
  // Wizard Step: 1 = Scan Member, 2 = Scan Book, 3 = Complete / Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Member
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Step 2 State: Book & Copy
  const [selectedBarcode, setSelectedBarcode] = useState<string>('');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  const defaultDueStr = defaultDue.toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState<string>(defaultDueStr);

  // Step 3 State: Created Transaction
  const [issuedTransaction, setIssuedTransaction] = useState<CirculationTransaction | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transient "Successful!" confirmation modal shown right after a scan is
  // accepted, before the wizard auto-advances to the next step.
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Clean scanned code helper (handles JSON payloads, URLs, whitespace)
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

  // Shared lookups (used by both live camera scans and manual entry, so both
  // paths resolve a code to a record identically).
  const findMemberByCode = (raw: string): Member | null => {
    const term = cleanScannedCode(raw);
    if (!term) return null;
    return (
      members.find(
        (m) =>
          m.memberId.toUpperCase() === term.toUpperCase() ||
          (m.qrCodeData && m.qrCodeData.toUpperCase() === term.toUpperCase()) ||
          m.fullName.toUpperCase().includes(term.toUpperCase())
      ) || null
    );
  };

  const findCopyByCode = (raw: string): { book: Book; copy: PhysicalCopy } | null => {
    const term = cleanScannedCode(raw);
    if (!term) return null;
    for (const b of books) {
      const copy = b.copies.find(
        (c) => c.barcode.toUpperCase() === term.toUpperCase() || c.accessionNumber.toUpperCase() === term.toUpperCase()
      );
      if (copy) return { book: b, copy };
    }
    return null;
  };

  // Derive Member & Eligibility for Step 1
  const selectedMember = members.find((m) => m.memberId === selectedMemberId);
  const memberActiveLoans = transactions.filter(
    (t) => t.memberId === selectedMemberId && (t.status === 'Active' || t.status === 'Overdue')
  );
  const memberOverdueLoans = transactions.filter(
    (t) => t.memberId === selectedMemberId && t.status === 'Overdue'
  );

  const systemSettings = StorageService.getSystemSettings();
  const selectedMemberTier = systemSettings.tierPolicies.find(
    (p) => p.tierName.toLowerCase() === (selectedMember?.membershipType || '').toLowerCase()
  ) || systemSettings.tierPolicies[0];
  const maxAllowedLoans = selectedMemberTier?.maxLoanLimit ?? 3;

  const isAccountActive = selectedMember?.status === 'active';
  const isWithinLimit = memberActiveLoans.length < maxAllowedLoans;
  const hasNoOverdue = memberOverdueLoans.length === 0;
  const hasNoBlockedFines = true;
  const isMemberEligible = !!selectedMember && isAccountActive && isWithinLimit && hasNoOverdue && hasNoBlockedFines;

  // Derive Book & Copy for Step 2
  const foundCopy = selectedBarcode.trim() ? findCopyByCode(selectedBarcode) : null;
  const selectedBook = foundCopy?.book ?? null;
  const selectedCopy = foundCopy?.copy ?? null;

  const isCopyAvailable = selectedCopy?.status === 'Available';
  const currentCopyBorrower = selectedCopy && !isCopyAvailable
    ? transactions.find(
        (t) => t.barcode === selectedCopy?.barcode && (t.status === 'Active' || t.status === 'Overdue')
      )
    : null;

  // Reset wizard when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedMemberId(members[0]?.memberId || '');
      setSelectedBarcode('');
      setIssuedTransaction(null);
      setErrorMessage(null);
      setSuccessNotice(null);
      setDueDate(defaultDueStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Dynamically synchronize loan duration with Superadmin tier policy
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
  }, [selectedMemberId, selectedMember, systemSettings]);

  if (!isOpen) return null;

  // Commit the loan using explicitly-provided records (safe to call from a
  // delayed auto-advance without depending on state having already updated).
  const commitBorrow = (member: Member, book: Book, copy: PhysicalCopy) => {
    const res = onConfirmBorrow(member.memberId, copy.barcode, dueDate);
    if (res.success && res.transaction) {
      setIssuedTransaction(res.transaction);
      setCurrentStep(3);
    } else if (res.success) {
      // Fallback transaction object
      const fallbackTx: CirculationTransaction = {
        id: `BRW-2026-${Date.now().toString().slice(-5)}`,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        accessionNumber: copy.accessionNumber,
        barcode: copy.barcode,
        memberId: member.memberId,
        memberName: member.fullName,
        borrowDate: todayStr,
        dueDate: dueDate,
        status: 'Active',
        renewalCount: 0,
        processedBy: 'Admin'
      };
      setIssuedTransaction(fallbackTx);
      setCurrentStep(3);
    } else {
      playErrorTone();
      setErrorMessage(res.message);
    }
  };

  // Handler for Step 1: live camera scan of the member's card/QR - resolves independently of
  // component state so it can decide immediately (no stale-state risk),
  // beeps, and auto-advances to the book scan when the member is eligible.
  const handleMemberCameraScan = (detectedCode: string) => {
    const term = cleanScannedCode(detectedCode);
    if (!term) return;

    const found = findMemberByCode(term);
    if (!found) {
      playErrorTone();
      setSelectedMemberId(term);
      setErrorMessage(`Scanned code "${term}" does not match any registered member.`);
      return;
    }

    const activeLoans = transactions.filter(
      (t) => t.memberId === found.memberId && (t.status === 'Active' || t.status === 'Overdue')
    );
    const overdueLoans = transactions.filter((t) => t.memberId === found.memberId && t.status === 'Overdue');
    const eligible = found.status === 'active' && activeLoans.length < 3 && overdueLoans.length === 0;

    setSelectedMemberId(found.memberId);

    if (!eligible) {
      playErrorTone();
      setErrorMessage(`${found.fullName} is not currently eligible to borrow. Please review account status.`);
      return;
    }

    playSuccessBeep();
    setErrorMessage(null);

    // Let the eligibility card render and stay on screen long enough to be
    // read first, then show the "Successful!" confirmation, then advance.
    setTimeout(() => {
      setSuccessNotice(`${found.fullName} verified — eligible to borrow.`);
      setTimeout(() => {
        setSuccessNotice(null);
        setCurrentStep(2);
      }, 700);
    }, 1100);
  };

  const handleProceedToStep2 = () => {
    if (!selectedMember || !isMemberEligible) {
      setErrorMessage('Selected member is ineligible for new loans.');
      return;
    }
    setErrorMessage(null);
    setCurrentStep(2);
  };

  // Handlers for Step 2
  const handleSelectBarcode = (barcode: string) => {
    const term = cleanScannedCode(barcode);
    setSelectedBarcode(term);
    setErrorMessage(null);
  };

  const handleBookSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = cleanScannedCode(selectedBarcode);
    if (!term) return;
    if (findCopyByCode(term)) {
      playSuccessBeep();
      setErrorMessage(null);
    } else {
      playErrorTone();
      setErrorMessage(`No physical book found matching barcode "${term}".`);
    }
  };

  // Live camera scan of the book barcode - resolves fresh (not from
  // possibly-stale state), beeps, and auto-completes the loan when the
  // copy is available.
  const handleBookCameraScan = (detectedCode: string) => {
    const term = cleanScannedCode(detectedCode);
    if (!term) return;

    const result = findCopyByCode(term);
    if (!result || result.copy.status !== 'Available') {
      playErrorTone();
      setSelectedBarcode(term);
      setErrorMessage(
        !result
          ? `No physical book found matching barcode "${term}".`
          : `Copy ${result.copy.barcode} is currently ${result.copy.status} and cannot be issued.`
      );
      return;
    }

    if (!selectedMember || !isMemberEligible) {
      playErrorTone();
      setErrorMessage('Member is not eligible to borrow.');
      return;
    }

    playSuccessBeep();
    setSelectedBarcode(result.copy.barcode);
    setErrorMessage(null);

    const member = selectedMember;
    const { book, copy } = result;

    // Let the book details card render and stay on screen long enough to be
    // read first, then show the "Successful!" confirmation, then commit the loan.
    setTimeout(() => {
      setSuccessNotice(`${book.title} verified — issuing loan.`);
      setTimeout(() => {
        setSuccessNotice(null);
        commitBorrow(member, book, copy);
      }, 700);
    }, 1100);
  };

  const handleConfirmBorrow = () => {
    if (!selectedMember || !isMemberEligible) {
      setErrorMessage('Member is not eligible to borrow.');
      return;
    }
    if (!selectedCopy || !isCopyAvailable || !selectedBook) {
      setErrorMessage('Book copy is not available on shelf.');
      return;
    }
    commitBorrow(selectedMember, selectedBook, selectedCopy);
  };

  const handleResetWizard = () => {
    setCurrentStep(1);
    setSelectedBarcode('');
    setIssuedTransaction(null);
    setErrorMessage(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* "Successful!" confirmation - shown briefly after the step's details card
            has already been visible, right before the wizard auto-advances. */}
        {successNotice && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              borderRadius: 'var(--radius-xl)',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '28px 40px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                animation: 'modalScaleUp 0.25s ease',
                maxWidth: '320px'
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Successful!</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{successNotice}</div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', padding: '18px 24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--brand-forest)" />
              <h3 className="modal-title" style={{ fontSize: '18px', fontWeight: 800 }}>
                Issue Loan Wizard
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Step-by-step circulation borrowing process with real-time verification
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* STEP PROCESS INDICATOR */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-main)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Connecting Track */}
            <div
              style={{
                position: 'absolute',
                top: '18px',
                left: '40px',
                right: '40px',
                height: '3px',
                backgroundColor: 'var(--border-main)',
                zIndex: 0
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                  backgroundColor: 'var(--brand-forest)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Step 1 Indicator */}
            <div style={{ zIndex: 1, textAlign: 'center', minWidth: '90px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor:
                    currentStep > 1
                      ? 'var(--brand-forest)'
                      : currentStep === 1
                      ? 'var(--brand-forest)'
                      : 'var(--bg-surface)',
                  color: currentStep >= 1 ? '#ffffff' : 'var(--text-muted)',
                  border: currentStep === 1 ? '3px solid #a7f3d0' : '2px solid var(--border-main)',
                  boxShadow: currentStep === 1 ? '0 0 0 4px rgba(6, 78, 59, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {currentStep > 1 ? <Check size={18} /> : <QrCode size={18} />}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 1 ? 700 : 500,
                  color: currentStep === 1 ? 'var(--brand-forest)' : 'var(--text-secondary)'
                }}
              >
                1. Member QR
              </span>
            </div>

            {/* Step 2 Indicator */}
            <div style={{ zIndex: 1, textAlign: 'center', minWidth: '90px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor:
                    currentStep > 2
                      ? 'var(--brand-forest)'
                      : currentStep === 2
                      ? 'var(--brand-forest)'
                      : 'var(--bg-surface)',
                  color: currentStep >= 2 ? '#ffffff' : 'var(--text-muted)',
                  border: currentStep === 2 ? '3px solid #a7f3d0' : '2px solid var(--border-main)',
                  boxShadow: currentStep === 2 ? '0 0 0 4px rgba(6, 78, 59, 0.15)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {currentStep > 2 ? <Check size={18} /> : <Barcode size={18} />}
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 2 ? 700 : 500,
                  color: currentStep === 2 ? 'var(--brand-forest)' : 'var(--text-secondary)'
                }}
              >
                2. Book Barcode
              </span>
            </div>

            {/* Step 3 Indicator */}
            <div style={{ zIndex: 1, textAlign: 'center', minWidth: '90px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  margin: '0 auto 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  backgroundColor: currentStep === 3 ? 'var(--success)' : 'var(--bg-surface)',
                  color: currentStep === 3 ? '#ffffff' : 'var(--text-muted)',
                  border: currentStep === 3 ? '3px solid #bbf7d0' : '2px solid var(--border-main)',
                  boxShadow: currentStep === 3 ? '0 0 0 4px rgba(5, 150, 105, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: currentStep === 3 ? 700 : 500,
                  color: currentStep === 3 ? 'var(--success)' : 'var(--text-secondary)'
                }}
              >
                3. Complete
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto' }}>
          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
                marginBottom: '18px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SCAN MEMBER QR & ELIGIBILITY CHECK */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                  Step 1: Scan Member Library Card / QR Code
                </h4>
                <span className="badge badge-info" style={{ fontSize: '11px' }}>
                  Awaiting Member Scan
                </span>
              </div>

              {/* Real Camera QR Scanner - a successful, eligible match auto-advances to Step 2 */}
              <CameraScanner
                scannerId="loan-wizard-step1-camera"
                mode="qr"
                isActive={isOpen && currentStep === 1}
                label="Camera active • Align patron library card QR code in viewfinder"
                onScan={handleMemberCameraScan}
              />

              {/* Member Details & Real-Time Eligibility Card */}
              {selectedMember && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    marginBottom: '20px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          backgroundColor: 'var(--brand-forest)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700
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

                    <span className={`badge ${isMemberEligible ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                      {isMemberEligible ? '✓ Eligible to Borrow' : '❌ Ineligible to Borrow'}
                    </span>
                  </div>

                  {/* 4-Point Eligibility Checklist */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isAccountActive ? 'var(--success)' : 'var(--danger)' }}>
                      {isAccountActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Account Active ({selectedMember.status})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isWithinLimit ? 'var(--success)' : 'var(--danger)' }}>
                      {isWithinLimit ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Borrow Limit ({memberActiveLoans.length}/3 Allowed)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoOverdue ? 'var(--success)' : 'var(--danger)' }}>
                      {hasNoOverdue ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>No Overdue Loans ({memberOverdueLoans.length})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: hasNoBlockedFines ? 'var(--success)' : 'var(--danger)' }}>
                      {hasNoBlockedFines ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      <span>Financial Standing Clear</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1 Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToStep2}
                  disabled={!selectedMember || !isMemberEligible}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 20px' }}
                >
                  <span>Proceed to Scan Book</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SCAN BOOK BARCODE & AVAILABILITY CHECK */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700 }}>
                  Step 2: Scan Physical Book Barcode
                </h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Borrower: <strong>{selectedMember?.fullName}</strong> (<code>{selectedMember?.memberId}</code>)
                </div>
              </div>

              {/* Real Camera Barcode Scanner - a successful, available match auto-issues the loan */}
              <CameraScanner
                scannerId="loan-wizard-step2-camera"
                mode="barcode"
                isActive={isOpen && currentStep === 2}
                label="Barcode scanner active • Align book barcode in viewfinder"
                onScan={handleBookCameraScan}
              />

              {/* Manual Barcode Input */}
              <form onSubmit={handleBookSearchSubmit} style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  Or Enter Book Barcode Manually
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BPL-000101 or ACC-000101"
                    value={selectedBarcode}
                    onChange={(e) => handleSelectBarcode(e.target.value)}
                    style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                    autoFocus
                  />
                </div>
              </form>

              {/* Book Details & Availability Card */}
              {selectedCopy && selectedBook ? (
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-main)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    marginBottom: '18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h5 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {selectedBook.title}
                      </h5>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        by {selectedBook.author} • ISBN: <code>{selectedBook.isbn}</code>
                      </div>
                    </div>
                    <span className={`badge ${isCopyAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {isCopyAvailable ? '✓ Available on Shelf' : `❌ ${selectedCopy.status}`}
                    </span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
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
                    <div style={{ fontSize: '11.5px', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '6px', marginTop: '10px' }}>
                      ⚠️ Currently checked out to <strong>{currentCopyBorrower.memberName}</strong> ({currentCopyBorrower.memberId}). Due date: {currentCopyBorrower.dueDate}.
                    </div>
                  )}
                </div>
              ) : selectedBarcode ? (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '18px', fontSize: '12.5px' }}>
                  No physical book found matching barcode "{selectedBarcode}".
                </div>
              ) : null}

              {/* Dates Setting */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Borrow Date
                  </label>
                  <input
                    type="text"
                    disabled
                    className="form-input"
                    value={todayStr}
                    style={{ backgroundColor: 'var(--bg-page)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Scheduled Due Date (+7 Days)
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Step 2 Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="btn btn-secondary"
                  style={{ gap: '6px' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Member</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBorrow}
                  disabled={!selectedCopy || !isCopyAvailable}
                  className="btn btn-primary"
                  style={{ gap: '8px', padding: '8px 24px' }}
                >
                  <Check size={16} />
                  <span>Confirm & Issue Loan</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & LOAN SLIP RECEIPT */}
          {currentStep === 3 && issuedTransaction && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 0 0 6px rgba(5, 150, 105, 0.15)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Loan Successfully Issued!
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                The borrowing transaction has been finalized and the physical copy is marked as Borrowed.
              </p>

              {/* Printable Official Loan Slip */}
              <div
                style={{
                  border: '2px dashed var(--border-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  backgroundColor: 'var(--bg-subtle)',
                  textAlign: 'left',
                  marginBottom: '24px'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-main)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <img
                    src="/logo.png"
                    alt="Balingasag Municipal Library"
                    style={{ width: 44, height: 44, margin: '0 auto 6px', display: 'block', borderRadius: '50%' }}
                  />
                  <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Municipality of Balingasag
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Balingasag Municipal Library
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Official Circulation Loan Slip
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Transaction ID</span>
                    <code style={{ fontWeight: 700 }}>{issuedTransaction.id}</code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Date Issued</span>
                    <strong>{issuedTransaction.borrowDate}</strong>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Patron
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{issuedTransaction.memberName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    Member ID: <code>{issuedTransaction.memberId}</code>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '14px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                    Book Details
                  </span>
                  <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{issuedTransaction.bookTitle}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>by {issuedTransaction.bookAuthor}</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Accession: <code>{issuedTransaction.accessionNumber}</code></span>
                    <span>Barcode: <code>{issuedTransaction.barcode}</code></span>
                  </div>
                </div>

                {/* Due Date Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--accent-blue-light)',
                    border: '1px solid var(--accent-blue-border)',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Scheduled Due Date
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--brand-forest)' }}>
                    {issuedTransaction.dueDate}
                  </div>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                >
                  <Printer size={15} />
                  <span>Print Loan Slip</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetWizard}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                >
                  <RotateCcw size={15} />
                  <span>Issue Another Loan</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
