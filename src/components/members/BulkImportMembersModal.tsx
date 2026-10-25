import React, { useState, useRef, useEffect, useId } from 'react';
import type { Member } from '../../types';
import type {
  ValidatedMemberImportRow,
  MemberImportValidationSummary,
  MemberImportExecutionResult
} from '../../types/memberImport';
import {
  parseAndValidateMemberSpreadsheet,
  downloadSampleMemberTemplate
} from '../../services/memberImportService';
import { api } from '../../services/api';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  X,
  RefreshCw,
  Check,
  AlertCircle,
  FileText,
  Users,
  Key
} from 'lucide-react';
import { useActionLoading } from '../../context/ActionLoadingContext';

interface BulkImportMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportSuccess: (importedMembers: Member[], message: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BulkImportMembersModal: React.FC<BulkImportMembersModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportSuccess,
  onShowToast
}) => {
  const { showActionLoading, hideActionLoading } = useActionLoading();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validation Results
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedMemberImportRow[]>([]);
  const [summary, setSummary] = useState<MemberImportValidationSummary | null>(null);

  // Filters & Import Options
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'issues'>('all');
  const [importMode, setImportMode] = useState<'all_or_nothing' | 'skip_errors'>('all_or_nothing');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Success Confirmation State
  const [successData, setSuccessData] = useState<{
    fileName: string;
    importedCount: number;
    skippedCount: number;
    members: Member[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  const handleReset = () => {
    setSelectedFile(null);
    setValidatedRows([]);
    setSummary(null);
    setSchemaError(null);
    setSubmitError(null);
    setFilterTab('all');
    setSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Keyboard navigation (Esc key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting && !successData) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, successData, onClose]);

  // File processing pipeline
  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsValidating(true);
    setSchemaError(null);
    setSubmitError(null);
    setValidatedRows([]);
    setSummary(null);

    try {
      // 1. Fast client-side parsing & validation
      const clientResult = await parseAndValidateMemberSpreadsheet(file, existingMembers);
      setValidatedRows(clientResult.rows);
      setSummary(clientResult.summary);

      // 2. Cross-validate with backend for server-side integrity
      try {
        const serverResult = await api.validateMemberImport(file);
        if (serverResult && serverResult.summary) {
          // If server reports specific DB conflicts, merge
          setSummary({
            totalRows: serverResult.summary.total_rows ?? clientResult.summary.totalRows,
            validRows: serverResult.summary.valid_rows ?? clientResult.summary.validRows,
            invalidRows: serverResult.summary.issue_rows ?? clientResult.summary.invalidRows,
            duplicateFileRows: clientResult.summary.duplicateFileRows,
            duplicateDbRows: serverResult.summary.duplicate_email_count ?? clientResult.summary.duplicateDbRows,
            canImport: serverResult.summary.can_import_all ?? clientResult.summary.canImport,
            canImportValid: serverResult.summary.can_import_valid ?? clientResult.summary.canImportValid
          });
        }
      } catch (srvErr: any) {
        // Client validation is already present, log server hint if any
        console.warn('Server validation feedback:', srvErr?.message);
      }
    } catch (err: any) {
      setSchemaError(err?.message || 'Failed to process spreadsheet file. Please check file formatting.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Perform bulk import
  const handleExecuteImport = async () => {
    if (!selectedFile && validatedRows.length === 0) return;
    setIsSubmitting(true);
    setSubmitError(null);
    showActionLoading({
      title: 'Importing Members',
      message: 'Registering member accounts and generating optical QR credentials...'
    });

    try {
      let result: MemberImportExecutionResult;

      if (selectedFile) {
        result = await api.bulkImportMembers(selectedFile, importMode);
      } else {
        const rowsPayload = validatedRows.map(r => ({
          file_row_num: r.rowNumber,
          first_name: r.firstName,
          last_name: r.lastName,
          middle_name: r.middleName,
          suffix: r.suffix,
          email: r.email,
          phone: r.phone,
          address: r.address,
          date_of_birth: r.dateOfBirth,
          gender: r.gender,
          membership_type: r.membershipType,
          status: r.status,
          member_id: r.memberId,
          temporary_password: r.temporaryPassword
        }));
        result = await api.bulkImportMembers(rowsPayload, importMode);
      }

      hideActionLoading();

      if (result.success) {
        const importedMembers: Member[] = (result.imported_members || []).map((m: any) => ({
          id: String(m.id || m.memberId || m.member_id),
          memberId: String(m.member_id || m.memberId),
          fullName: m.full_name || m.fullName,
          firstName: m.first_name || m.firstName,
          middleName: m.middle_name || m.middleName,
          lastName: m.last_name || m.lastName,
          suffix: m.suffix,
          username: m.username,
          dateOfBirth: m.date_of_birth || m.dateOfBirth,
          gender: m.gender,
          sex: m.gender === 'Male' ? 'Male' : m.gender === 'Female' ? 'Female' : 'Other',
          email: m.email,
          phone: m.phone || '+63 9',
          address: m.address || 'Poblacion, Balingasag, Misamis Oriental',
          membershipType: m.membership_type || m.membershipType || 'Student',
          status: (m.status || m.membershipStatus || 'active') as any,
          photoUrl: m.photo_url || m.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          qrCodeData: m.qr_code_data || m.qrCodeData || m.member_id,
          joinDate: m.join_date || m.dateRegistered || m.joinDate || new Date().toISOString().split('T')[0],
          totalBorrows: m.total_borrows || m.totalBorrows || 0,
          isArchived: false
        }));

        setSuccessData({
          fileName: selectedFile?.name || 'Bulk_Members.csv',
          importedCount: result.imported_count,
          skippedCount: result.skipped_count || 0,
          members: importedMembers
        });

        onImportSuccess(importedMembers, result.message);
        if (onShowToast) {
          onShowToast('success', 'Bulk Import Completed', result.message);
        }
      } else {
        setSubmitError(result.message || 'Bulk import failed. Please review the errors.');
      }
    } catch (err: any) {
      hideActionLoading();
      setSubmitError(
        err?.message || 'Server error occurred during member import. Database transaction was safely rolled back.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter rows for preview tab
  const displayRows = validatedRows.filter(r => {
    if (filterTab === 'valid') return r.rowStatus === 'valid';
    if (filterTab === 'issues') return r.rowStatus !== 'valid';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: successData ? '580px' : '960px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--modal-bg, var(--bg-surface, #FFFFFF))',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-xl, 0 25px 50px -12px rgba(0, 0, 0, 0.25))',
          border: '1px solid var(--modal-border, var(--border-main, #E2E8F0))',
          overflow: 'hidden'
        }}
      >
        {/* ========================================================= */}
        {/* SUCCESS VIEW                                             */}
        {/* ========================================================= */}
        {successData ? (
          <div style={{ padding: '32px 28px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--success-bg, #DCFCE7)',
                color: 'var(--success, #16A34A)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '18px'
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <h2
              id={titleId}
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: 'var(--brand-forest, #174D32)',
                marginBottom: '8px'
              }}
            >
              Member Bulk Upload Complete!
            </h2>

            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary, #475569)', marginBottom: '24px', lineHeight: 1.5 }}>
              Successfully registered <strong>{successData.importedCount}</strong> library member account(s) into the system.
              {successData.skippedCount > 0 && (
                <span style={{ display: 'block', color: 'var(--warning, #D97706)', marginTop: '4px', fontSize: '13.5px' }}>
                  ({successData.skippedCount} invalid rows were skipped per import mode settings)
                </span>
              )}
            </p>

            {/* Quick credentials card */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                border: '1px solid var(--border-main, #E2E8F0)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-forest, #174D32)', fontWeight: 600, fontSize: '13.5px', marginBottom: '8px' }}>
                <Key size={16} />
                <span>Account Access & Optical QR Credentials</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.6 }}>
                <li>Default initial temporary password: <code style={{ backgroundColor: 'var(--bg-muted, #E2E8F0)', color: 'var(--text-primary, #0F172A)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>P@ssword123</code></li>
                <li>Optical QR codes have been generated for all registered members for attendance check-in and book borrowing.</li>
                <li>Members are immediately visible in the <strong>Manage Members</strong> roster.</li>
              </ul>
            </div>

            <button
              onClick={() => {
                onClose();
                handleReset();
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              View Updated Members Roster
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* UPLOAD & PREVIEW VIEW                                     */
          /* ========================================================= */
          <>
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-main, #E2E8F0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-subtle, #FAFAF9)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--success-bg, #E8F3E8)',
                    color: 'var(--brand-forest, #174D32)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <h2
                    id={titleId}
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--brand-forest, #174D32)',
                      margin: 0,
                      lineHeight: 1.3
                    }}
                  >
                    Bulk Import Members
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>
                    Upload standard CSV or Excel spreadsheets to register multiple students, faculty, or community patrons
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94A3B8)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s ease'
                }}
                aria-label="Close dialog"
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary, #0F172A)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted, #94A3B8)')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div
              style={{
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}
            >
              {/* Template Download Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'var(--success-bg, #F0FDF4)',
                  border: '1px solid var(--success-border, #BBF7D0)',
                  borderRadius: '12px',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileSpreadsheet size={20} color="var(--primary-green, #16A34A)" />
                  <span style={{ fontSize: '13.5px', color: 'var(--brand-forest, #166534)', fontWeight: 500 }}>
                    Need the standard column layout? Download our pre-formatted template with example rows.
                  </span>
                </div>
                <button
                  onClick={downloadSampleMemberTemplate}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    gap: '6px',
                    borderColor: 'var(--success-border, #86EFAC)',
                    backgroundColor: 'var(--bg-surface, #FFFFFF)',
                    color: 'var(--brand-forest, #166534)',
                    fontWeight: 600
                  }}
                >
                  <Download size={14} />
                  <span>Download Template (.csv)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragging ? 'var(--primary-green, #228B22)' : 'var(--border-main, #CBD5E1)'}`,
                    backgroundColor: isDragging ? 'var(--success-bg, #F0FDF4)' : 'var(--bg-subtle, #F8FAFC)',
                    borderRadius: '16px',
                    padding: '44px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-bg, #E8F3E8)',
                      color: 'var(--brand-forest, #174D32)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px'
                    }}
                  >
                    <Upload size={26} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary, #1E293B)', marginBottom: '4px' }}>
                    Click to select file or drag and drop spreadsheet here
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748B)' }}>
                    Accepts <strong>.csv</strong> or <strong>.xlsx</strong> files (up to 5 MB or 1,000 records)
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                    border: '1px solid var(--border-main, #E2E8F0)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-muted, #E2E8F0)',
                        color: 'var(--text-primary, #0F172A)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)' }}>
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.endsWith('.xlsx') ? 'Excel Spreadsheet' : 'CSV File'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger, #DC2626)', gap: '6px' }}
                    disabled={isSubmitting}
                  >
                    <X size={14} />
                    <span>Choose Different File</span>
                  </button>
                </div>
              )}

              {/* Validation Loader */}
              {isValidating && (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-secondary, #64748B)' }}>
                  <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary-green, #228B22)' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary, #1E293B)' }}>
                    Analyzing spreadsheet & checking duplicate records...
                  </div>
                </div>
              )}

              {/* Schema Error Banner */}
              {schemaError && (
                <div
                  role="alert"
                  style={{
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <XCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                      Spreadsheet Format Error
                    </div>
                    <div style={{ fontSize: '13px', color: '#B91C1C', lineHeight: 1.5 }}>
                      {schemaError}
                    </div>
                  </div>
                </div>
              )}

              {/* Submission Error Banner */}
              {submitError && (
                <div
                  role="alert"
                  style={{
                    padding: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                >
                  <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                      Import Execution Failed
                    </div>
                    <div style={{ fontSize: '13px', color: '#B91C1C', lineHeight: 1.5 }}>
                      {submitError}
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Metrics & Preview Table */}
              {summary && (
                <>
                  {/* Summary Metric Cards */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '12px'
                    }}
                  >
                    {/* Total */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                        border: '1px solid var(--border-main, #E2E8F0)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>Total Records</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #0F172A)', marginTop: '2px' }}>
                        {summary.totalRows}
                      </div>
                    </div>

                    {/* Valid */}
                    <div
                      style={{
                        backgroundColor: 'var(--success-bg, #F0FDF4)',
                        border: '1px solid var(--success-border, #BBF7D0)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--brand-forest, #166534)', fontWeight: 600 }}>Valid to Import</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success, #16A34A)', marginTop: '2px' }}>
                        {summary.validRows}
                      </div>
                    </div>

                    {/* Issues */}
                    <div
                      style={{
                        backgroundColor: summary.invalidRows > 0 ? 'var(--danger-bg, #FEF2F2)' : 'var(--bg-subtle, #F8FAFC)',
                        border: `1px solid ${summary.invalidRows > 0 ? 'var(--danger-border, #FCA5A5)' : 'var(--border-main, #E2E8F0)'}`,
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: summary.invalidRows > 0 ? 'var(--danger-text, #991B1B)' : 'var(--text-secondary, #64748B)', fontWeight: 600 }}>
                        Records with Issues
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: summary.invalidRows > 0 ? 'var(--danger, #DC2626)' : 'var(--text-primary, #0F172A)', marginTop: '2px' }}>
                        {summary.invalidRows}
                      </div>
                    </div>

                    {/* Duplicate Emails */}
                    <div
                      style={{
                        backgroundColor: 'var(--warning-bg, #FFFBEB)',
                        border: '1px solid var(--warning-border, #FDE68A)',
                        borderRadius: '12px',
                        padding: '12px 16px'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: 'var(--warning-text, #92400E)', fontWeight: 600 }}>Duplicate / Registered</div>
                      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--warning, #D97706)', marginTop: '2px' }}>
                        {summary.duplicateFileRows + summary.duplicateDbRows}
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs & Mode Selector */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingTop: '8px'
                    }}
                  >
                    {/* Filter Tabs */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFilterTab('all')}
                        className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        All ({validatedRows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTab('valid')}
                        className={`btn btn-sm ${filterTab === 'valid' ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        Valid Only ({summary.validRows})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTab('issues')}
                        className={`btn btn-sm ${filterTab === 'issues' ? 'btn-primary' : 'btn-ghost'}`}
                      >
                        Issues Only ({summary.invalidRows})
                      </button>
                    </div>

                    {/* Import Strategy Mode */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>Mode:</span>
                      <select
                        className="form-select"
                        value={importMode}
                        onChange={e => setImportMode(e.target.value as any)}
                        style={{ fontSize: '13px', padding: '6px 12px', width: 'auto' }}
                      >
                        <option value="all_or_nothing">All or Nothing (Strict transaction)</option>
                        <option value="skip_errors">Skip Errors (Import valid records only)</option>
                      </select>
                    </div>
                  </div>

                  {/* Data Preview Table */}
                  <div
                    style={{
                      border: '1px solid var(--border-main, #E2E8F0)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      maxHeight: '340px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--bg-surface, #FFFFFF)'
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead style={{ backgroundColor: 'var(--table-header-bg, #F8FAFC)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr style={{ borderBottom: '1px solid var(--border-main, #E2E8F0)', textAlign: 'left', color: 'var(--text-secondary, #475569)' }}>
                          <th style={{ padding: '10px 14px', width: '60px' }}>Row</th>
                          <th style={{ padding: '10px 14px' }}>Full Name</th>
                          <th style={{ padding: '10px 14px' }}>Email Address</th>
                          <th style={{ padding: '10px 14px' }}>Contact</th>
                          <th style={{ padding: '10px 14px' }}>Type</th>
                          <th style={{ padding: '10px 14px' }}>Status</th>
                          <th style={{ padding: '10px 14px', width: '180px' }}>Validation Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted, #94A3B8)' }}>
                              No records match the selected filter.
                            </td>
                          </tr>
                        ) : (
                          displayRows.map(row => {
                            const isRowValid = row.rowStatus === 'valid';
                            return (
                              <tr
                                key={row.rowNumber}
                                style={{
                                  borderBottom: '1px solid var(--border-main, #F1F5F9)',
                                  backgroundColor: isRowValid ? 'transparent' : 'var(--danger-bg, rgba(239, 68, 68, 0.08))'
                                }}
                              >
                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary, #64748B)', fontWeight: 600 }}>
                                  #{row.rowNumber}
                                </td>
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary, #0F172A)' }}>
                                  {row.fullName}
                                </td>
                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary, #334155)' }}>
                                  {row.email || '—'}
                                </td>
                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary, #64748B)' }}>
                                  {row.phone || '—'}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'var(--success-bg, #E8F3E8)',
                                      color: 'var(--brand-forest, #174D32)'
                                    }}
                                  >
                                    {row.membershipType}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '999px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: row.status === 'active' ? 'var(--success-bg, #DCFCE7)' : 'var(--bg-subtle, #F1F5F9)',
                                      color: row.status === 'active' ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #64748B)'
                                    }}
                                  >
                                    {row.status}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  {isRowValid ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--primary-green, #16A34A)',
                                        fontWeight: 600,
                                        fontSize: '12px'
                                      }}
                                    >
                                      <CheckCircle2 size={14} />
                                      <span>Ready to import</span>
                                    </span>
                                  ) : (
                                    <div>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          color: 'var(--danger, #DC2626)',
                                          fontWeight: 600,
                                          fontSize: '12px'
                                        }}
                                      >
                                        <AlertTriangle size={14} />
                                        <span>Issue detected</span>
                                      </span>
                                      <div style={{ fontSize: '11px', color: 'var(--danger-text, #B91C1C)', marginTop: '2px', lineHeight: 1.3 }}>
                                        {row.errors.join(' ')}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-main, #E2E8F0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-subtle, #FAFAF9)'
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn btn-secondary"
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {summary && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={
                      isSubmitting ||
                      (importMode === 'all_or_nothing' && !summary.canImport) ||
                      (importMode === 'skip_errors' && !summary.canImportValid)
                    }
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      fontWeight: 600
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Importing Records...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>
                          Confirm & Import ({importMode === 'skip_errors' ? summary.validRows : summary.totalRows} Members)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
