import React, { useState, useRef, useEffect, useId } from 'react';
import type { Book } from '../../types';
import type { ValidatedImportRow, ImportValidationSummary } from '../../types/import';
import {
  parseAndValidateSpreadsheet,
  downloadSampleTemplate
} from '../../services/bookImportService';
import { api } from '../../services/api';
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Database,
  Download,
  X,
  RefreshCw,
  Info,
  Check,
  AlertCircle,
  FileText,
  Table
} from 'lucide-react';

interface BulkImportBooksModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingBooks: Book[];
  onImportSuccess: (importedBooks: Book[], message: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const BulkImportBooksModal: React.FC<BulkImportBooksModalProps> = ({
  isOpen,
  onClose,
  existingBooks,
  onImportSuccess,
  onShowToast
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validation Results
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [summary, setSummary] = useState<ImportValidationSummary | null>(null);

  // Filters & Settings
  const [filterTab, setFilterTab] = useState<'all' | 'valid' | 'issues'>('all');
  const [importMode, setImportMode] = useState<'all_or_nothing' | 'skip_errors'>('all_or_nothing');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useId();

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  // Keyboard navigation (Esc key to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleReset = () => {
    setSelectedFile(null);
    setValidatedRows([]);
    setSummary(null);
    setSchemaError(null);
    setSubmitError(null);
    setFilterTab('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setIsValidating(true);
    setSchemaError(null);
    setSubmitError(null);
    setSelectedFile(file);

    try {
      const result = await parseAndValidateSpreadsheet(file, existingBooks);
      if (!result.success) {
        setSchemaError(result.message || 'File validation failed.');
        setValidatedRows([]);
        setSummary(null);
      } else {
        setValidatedRows(result.rows);
        setSummary(result.summary);
      }
    } catch (err: any) {
      setSchemaError(err?.message || 'An unexpected error occurred while parsing the file.');
      setValidatedRows([]);
      setSummary(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Filtered rows for the preview table
  const filteredRows = validatedRows.filter((r) => {
    if (filterTab === 'valid') return r.status === 'valid';
    if (filterTab === 'issues') return r.status !== 'valid';
    return true;
  });

  const hasIssues = (summary?.invalidRows ?? 0) > 0 || (summary?.duplicateFileRows ?? 0) > 0 || (summary?.duplicateDbRows ?? 0) > 0;
  const isImportDisabled =
    !selectedFile ||
    isValidating ||
    isSubmitting ||
    !!schemaError ||
    !summary ||
    summary.validRows === 0 ||
    (importMode === 'all_or_nothing' && hasIssues);

  const handleConfirmImport = async () => {
    if (!selectedFile || isImportDisabled) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.bulkImportBooks(selectedFile, importMode);

      if (response && response.success) {
        if (onShowToast) {
          onShowToast(
            'success',
            'Bulk Import Completed',
            `Successfully cataloged ${response.imported_count} book(s) with ${response.total_copies_created} physical copies.`
          );
        }
        onImportSuccess(response.books || [], response.message);
        onClose();
      } else {
        const errorMsg = response?.message || 'Server rejected the import transaction.';
        setSubmitError(errorMsg);
        if (onShowToast) {
          onShowToast('error', 'Import Failed', errorMsg);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to complete book import. Check server connection.';
      setSubmitError(msg);
      if (onShowToast) {
        onShowToast('error', 'Import Transaction Failed', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '1020px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px solid var(--border-main, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-main, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 id={titleId} style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-main, #0f172a)' }}>
                Bulk Book Import
              </h2>
              <p style={{ fontSize: '13px', margin: '2px 0 0', color: 'var(--text-secondary, #64748b)' }}>
                Upload .csv or .xlsx spreadsheets to catalog multiple publications and accession copies
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => downloadSampleTemplate('csv')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Download CSV sample file with proper headers"
            >
              <Download size={14} />
              <span>CSV Template</span>
            </button>
            <button
              onClick={() => downloadSampleTemplate('xlsx')}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
              title="Download Excel sample file with proper headers"
            >
              <Download size={14} />
              <span>Excel (.xlsx) Template</span>
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost btn-sm"
              style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-secondary, #64748b)' }}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Template Design & Schema Guide Card (Visible when no file selected) */}
          {!selectedFile && (
            <div
              style={{
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-main, #e2e8f0)',
                borderRadius: '10px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Table size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main, #0f172a)' }}>
                        Official Cataloging Spreadsheet Template
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(16, 185, 129, 0.12)',
                          color: '#059669'
                        }}
                      >
                        v2026.1 Schema
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', marginTop: '2px' }}>
                      Download pre-formatted templates or structure your spreadsheet to match the 4 required headers below.
                    </div>
                  </div>
                </div>

                {/* Template Download Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => downloadSampleTemplate('xlsx')}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      backgroundColor: '#15803d',
                      borderColor: '#15803d'
                    }}
                    title="Download Excel template with formatted column widths and guidelines sheet"
                  >
                    <Download size={14} />
                    <span>Download Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() => downloadSampleTemplate('csv')}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                    title="Download standard CSV template with UTF-8 BOM"
                  >
                    <Download size={14} />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Column Specification Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-main, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <code style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>ISBN</code>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      Required
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', lineHeight: 1.35 }}>
                    10 or 13-digit standard ISBN. Hyphens are supported. Must be unique per title.
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-main, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <code style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Title</code>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      Required
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', lineHeight: 1.35 }}>
                    Official bibliographic title. Trim redundant leading and trailing spaces.
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-main, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <code style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Author</code>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      Required
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', lineHeight: 1.35 }}>
                    Primary author(s), editor, or organization responsible for work.
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--border-main, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '10px 12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <code style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>Quantity</code>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                      Integer &gt; 0
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748b)', lineHeight: 1.35 }}>
                    Positive whole number. Automatically generates accession &amp; barcode labels.
                  </div>
                </div>
              </div>

              {/* Mini Spreadsheet Design Preview */}
              <div
                style={{
                  border: '1px solid var(--border-main, #cbd5e1)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                {/* Excel-like sheet tab bar */}
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderBottom: '1px solid #cbd5e1',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileSpreadsheet size={13} color="#15803d" />
                  <span style={{ fontWeight: 600 }}>Template Layout Preview</span>
                  <span style={{ color: '#94a3b8' }}>•</span>
                  <span style={{ color: '#64748b' }}>Sheet 1: Books_Catalog</span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#15803d', color: '#ffffff', borderBottom: '1px solid #166534' }}>
                      <th style={{ padding: '6px 10px', fontWeight: 600, width: '40px', textAlign: 'center', color: '#dcfce7' }}>#</th>
                      <th style={{ padding: '6px 12px', fontWeight: 600, width: '150px' }}>ISBN</th>
                      <th style={{ padding: '6px 12px', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '6px 12px', fontWeight: 600, width: '160px' }}>Author</th>
                      <th style={{ padding: '6px 10px', fontWeight: 600, width: '70px', textAlign: 'center' }}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>1</td>
                      <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#0f172a' }}>978-0132350884</td>
                      <td style={{ padding: '6px 12px', color: '#0f172a', fontWeight: 500 }}>Clean Code: A Handbook of Agile Software Craftsmanship</td>
                      <td style={{ padding: '6px 12px', color: '#475569' }}>Robert C. Martin</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>3</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>2</td>
                      <td style={{ padding: '6px 12px', fontFamily: 'monospace', color: '#0f172a' }}>978-0201616224</td>
                      <td style={{ padding: '6px 12px', color: '#0f172a', fontWeight: 500 }}>The Pragmatic Programmer: Your Journey to Mastery</td>
                      <td style={{ padding: '6px 12px', color: '#475569' }}>David Thomas, Andrew Hunt</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#15803d' }}>2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Informational Guidelines Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  fontSize: '11.5px',
                  color: 'var(--text-secondary, #64748b)',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '6px',
                  padding: '8px 12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46' }}>
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span><strong>Multiple copies:</strong> Set <code>Quantity = 5</code> on a single row. Do not create duplicate rows for the same ISBN.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46' }}>
                  <Check size={14} style={{ flexShrink: 0 }} />
                  <span><strong>Safe Protection:</strong> Duplicates within the file or existing in the library catalog are automatically flagged.</span>
                </div>
              </div>
            </div>
          )}

          {/* File Upload Drop Area */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? '#10b981' : 'var(--border-main, #cbd5e1)'}`,
                backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-subtle, #f8fafc)',
                borderRadius: '10px',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Upload size={24} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main, #0f172a)' }}>
                Ready to import? Drop your completed file here, or <span style={{ color: '#10b981', textDecoration: 'underline' }}>browse files</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', maxWidth: '440px', lineHeight: 1.4 }}>
                Supports <strong>.CSV</strong> and <strong>.XLSX</strong> formats up to 5 MB.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-main, #e2e8f0)',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main, #0f172a)' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.name.endsWith('.xlsx') ? 'Excel Workbook' : 'CSV Spreadsheet'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => processFile(selectedFile)}
                  disabled={isValidating || isSubmitting}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Re-validate file against current catalog"
                >
                  <RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} />
                  <span>Re-check</span>
                </button>
                <button
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '12px', color: '#ef4444' }}
                >
                  Remove File
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {isValidating && (
            <div
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                borderRadius: '8px',
                color: 'var(--text-secondary, #64748b)',
                fontSize: '14px'
              }}
            >
              <RefreshCw size={18} className="animate-spin" style={{ color: '#10b981' }} />
              <span>Analyzing spreadsheet headers, verifying ISBN checksums, and scanning duplicate records…</span>
            </div>
          )}

          {/* Schema or General File Error Banner */}
          {schemaError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#b91c1c'
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                  Spreadsheet Schema Verification Failed
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                  {schemaError}
                </div>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#7f1d1d' }}>
                  Please ensure your file headers exactly include: <strong>ISBN</strong>, <strong>Title</strong>, <strong>Author</strong>, and <strong>Quantity</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Submission Error Banner */}
          {submitError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: '#b91c1c'
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                  Import Transaction Error
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
                  {submitError}
                </div>
              </div>
            </div>
          )}

          {/* Summary Metric Badges */}
          {summary && !isValidating && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px'
                }}
              >
                {/* Total */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle, #f8fafc)',
                    border: '1px solid var(--border-main, #e2e8f0)',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>
                    Total Rows Detected
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: 'var(--text-main, #0f172a)' }}>
                    {summary.totalRows}
                  </div>
                </div>

                {/* Valid */}
                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#047857', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    <span>Valid Records</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: '#065f46' }}>
                    {summary.validRows}
                  </div>
                </div>

                {/* Invalid */}
                <div
                  style={{
                    backgroundColor: summary.invalidRows > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-subtle, #f8fafc)',
                    border: `1px solid ${summary.invalidRows > 0 ? 'rgba(239, 68, 68, 0.25)' : 'var(--border-main, #e2e8f0)'}`,
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: summary.invalidRows > 0 ? '#b91c1c' : 'var(--text-secondary, #64748b)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={13} />
                    <span>Invalid / Incomplete</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: summary.invalidRows > 0 ? '#b91c1c' : 'var(--text-main, #0f172a)' }}>
                    {summary.invalidRows}
                  </div>
                </div>

                {/* File Duplicates */}
                <div
                  style={{
                    backgroundColor: summary.duplicateFileRows > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-subtle, #f8fafc)',
                    border: `1px solid ${summary.duplicateFileRows > 0 ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-main, #e2e8f0)'}`,
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: summary.duplicateFileRows > 0 ? '#b45309' : 'var(--text-secondary, #64748b)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Copy size={13} />
                    <span>File Duplicates</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: summary.duplicateFileRows > 0 ? '#b45309' : 'var(--text-main, #0f172a)' }}>
                    {summary.duplicateFileRows}
                  </div>
                </div>

                {/* DB Duplicates */}
                <div
                  style={{
                    backgroundColor: summary.duplicateDbRows > 0 ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-subtle, #f8fafc)',
                    border: `1px solid ${summary.duplicateDbRows > 0 ? 'rgba(99, 102, 241, 0.25)' : 'var(--border-main, #e2e8f0)'}`,
                    borderRadius: '8px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: summary.duplicateDbRows > 0 ? '#4338ca' : 'var(--text-secondary, #64748b)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={13} />
                    <span>Exists in Catalog</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px', color: summary.duplicateDbRows > 0 ? '#4338ca' : 'var(--text-main, #0f172a)' }}>
                    {summary.duplicateDbRows}
                  </div>
                </div>
              </div>

              {/* Mode Selection and Filter Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  paddingTop: '6px'
                }}
              >
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px' }}
                  >
                    All Rows ({validatedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('valid')}
                    className={`btn btn-sm ${filterTab === 'valid' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px' }}
                  >
                    Valid Only ({summary.validRows})
                  </button>
                  <button
                    onClick={() => setFilterTab('issues')}
                    className={`btn btn-sm ${filterTab === 'issues' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '12px', color: hasIssues ? '#b91c1c' : undefined }}
                  >
                    Issues & Duplicates ({summary.invalidRows + summary.duplicateFileRows + summary.duplicateDbRows})
                  </button>
                </div>

                {/* Import Strategy Option */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <label htmlFor="import-mode-select" style={{ color: 'var(--text-secondary, #64748b)', fontWeight: 500 }}>
                    Processing Mode:
                  </label>
                  <select
                    id="import-mode-select"
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="form-input"
                    style={{
                      padding: '4px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-main, #cbd5e1)',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      color: 'var(--text-main, #0f172a)'
                    }}
                  >
                    <option value="all_or_nothing">All-or-Nothing (Strict: requires 100% valid records)</option>
                    <option value="skip_errors">Selective (Import valid records, skip issues)</option>
                  </select>
                </div>
              </div>

              {/* Preview Table */}
              <div
                style={{
                  border: '1px solid var(--border-main, #e2e8f0)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-surface, #ffffff)'
                }}
              >
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '13px',
                      textAlign: 'left'
                    }}
                  >
                    <thead
                      style={{
                        position: 'sticky',
                        top: 0,
                        backgroundColor: 'var(--bg-subtle, #f8fafc)',
                        borderBottom: '1px solid var(--border-main, #e2e8f0)',
                        zIndex: 1
                      }}
                    >
                      <tr>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', width: '65px' }}>Row</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', width: '150px' }}>ISBN</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>Title</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', width: '160px' }}>Author</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', width: '80px', textAlign: 'center' }}>Copies</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', width: '130px' }}>Status</th>
                        <th style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>Validation Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary, #64748b)' }}>
                            No records match the current filter tab.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isRowValid = row.status === 'valid';
                          const isFileDup = row.status === 'duplicate_file';
                          const isDbDup = row.status === 'duplicate_db';

                          return (
                            <tr
                              key={row.rowNumber}
                              style={{
                                borderBottom: '1px solid var(--border-main, #f1f5f9)',
                                backgroundColor: !isRowValid ? 'rgba(239, 68, 68, 0.02)' : undefined
                              }}
                            >
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)' }}>
                                #{row.rowNumber}
                              </td>
                              <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px' }}>
                                {row.isbn || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing</span>}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text-main, #0f172a)' }}>
                                {row.title || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing</span>}
                              </td>
                              <td style={{ padding: '10px 12px', color: 'var(--text-secondary, #475569)' }}>
                                {row.author || <span style={{ color: '#ef4444', fontStyle: 'italic' }}>Missing</span>}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>
                                {row.quantity !== null ? (
                                  row.quantity
                                ) : (
                                  <span style={{ color: '#ef4444' }}>{row.rawQuantity || 'Empty'}</span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {isRowValid && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                      color: '#059669'
                                    }}
                                  >
                                    <Check size={11} /> Valid
                                  </span>
                                )}
                                {isFileDup && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'rgba(245, 158, 11, 0.12)',
                                      color: '#b45309'
                                    }}
                                  >
                                    <Copy size={11} /> File Duplicate
                                  </span>
                                )}
                                {isDbDup && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'rgba(99, 102, 241, 0.12)',
                                      color: '#4338ca'
                                    }}
                                  >
                                    <Database size={11} /> Exists in DB
                                  </span>
                                )}
                                {row.status === 'invalid' && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                      color: '#dc2626'
                                    }}
                                  >
                                    <XCircle size={11} /> Invalid
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '12px', color: isRowValid ? '#059669' : '#b91c1c' }}>
                                {isRowValid ? (
                                  'Ready for insertion'
                                ) : (
                                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                    {row.errors.map((err, i) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mode Guidance Message */}
              {importMode === 'all_or_nothing' && hasIssues && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#b45309',
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Info size={14} style={{ flexShrink: 0 }} />
                  <span>
                    All-or-Nothing mode is active: Confirm Import is locked until all errors and duplicates are corrected, or switch to <strong>Selective Mode</strong> above.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-main, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)' }}>
            {summary && summary.validRows > 0 ? (
              <span>
                Ready to catalog <strong>{importMode === 'all_or_nothing' ? summary.totalRows : summary.validRows}</strong> book title(s)
              </span>
            ) : (
              <span>Select a valid spreadsheet to preview</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary btn-sm"
              style={{ minWidth: '85px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isImportDisabled}
              className="btn btn-primary btn-sm"
              style={{
                minWidth: '135px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: isImportDisabled ? 0.55 : 1,
                cursor: isImportDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Confirm Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
