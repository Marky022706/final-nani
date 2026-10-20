import React, { useEffect, useRef } from 'react';
import {
  Check,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Copy,
  BookOpen,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react';
import type { ImportValidationSummary } from '../../types/import';

export interface BulkUploadSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewRecords?: () => void;
  fileName?: string;
  importedCount: number;
  totalCopiesCreated?: number;
  summary?: ImportValidationSummary | {
    total_rows?: number;
    valid_rows?: number;
    invalid_rows?: number;
    duplicate_file_rows?: number;
    duplicate_db_rows?: number;
    totalRows?: number;
    validRows?: number;
    invalidRows?: number;
    duplicateFileRows?: number;
    duplicateDbRows?: number;
  } | null;
  importMode?: 'all_or_nothing' | 'skip_errors';
}

export const BulkUploadSuccessModal: React.FC<BulkUploadSuccessModalProps> = ({
  isOpen,
  onClose,
  onViewRecords,
  fileName,
  importedCount,
  totalCopiesCreated,
  summary,
  importMode = 'all_or_nothing'
}) => {
  const doneButtonRef = useRef<HTMLButtonElement | null>(null);

  // Normalize summary numbers
  const totalRows = (summary as any)?.total_rows ?? (summary as any)?.totalRows ?? importedCount;
  const validRows = (summary as any)?.valid_rows ?? (summary as any)?.validRows ?? importedCount;
  const invalidRows = (summary as any)?.invalid_rows ?? (summary as any)?.invalidRows ?? 0;
  const duplicateFileRows = (summary as any)?.duplicate_file_rows ?? (summary as any)?.duplicateFileRows ?? 0;
  const duplicateDbRows = (summary as any)?.duplicate_db_rows ?? (summary as any)?.duplicateDbRows ?? 0;
  const skippedDuplicates = duplicateFileRows + duplicateDbRows;

  // Determine if this is a 100% full success or a partial success with skipped/invalid records
  const isPartial = importMode === 'skip_errors' && (skippedDuplicates > 0 || invalidRows > 0);

  // Handle Escape key and autofocus on open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      doneButtonRef.current?.focus();
    }, 60);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-success-title"
      aria-describedby="bulk-success-desc"
      onClick={onClose}
    >
      <div
        className="modal-dialog animate-modal-fade-in"
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-main, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent Bar */}
        <div
          style={{
            height: '5px',
            width: '100%',
            backgroundColor: isPartial ? '#d97706' : '#166534',
            background: isPartial
              ? 'linear-gradient(90deg, #d97706, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #166534, #22c55e, #166534)'
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '16px 22px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: isPartial ? '#fef3c7' : '#dcfce7',
                color: isPartial ? '#92400e' : '#166534'
              }}
            >
              {isPartial ? 'Partial Import Notice' : 'Import Complete'}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              • Balingasag Municipal Library
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close success dialog"
            className="btn btn-ghost btn-sm"
            style={{
              padding: '6px',
              borderRadius: '50%',
              color: '#64748b'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          {/* Animated Success or Partial Icon */}
          <div
            className="animate-success-pop animate-pulse-glow"
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: isPartial ? '#fef3c7' : '#dcfce7',
              border: `3px solid ${isPartial ? '#fde68a' : '#bbf7d0'}`,
              color: isPartial ? '#b45309' : '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: isPartial
                ? '0 10px 25px -4px rgba(217, 119, 6, 0.25)'
                : '0 10px 25px -4px rgba(22, 101, 52, 0.25)'
            }}
          >
            {isPartial ? (
              <AlertTriangle size={36} strokeWidth={2.5} />
            ) : (
              <Check size={38} strokeWidth={3} />
            )}
          </div>

          {/* Heading */}
          <h2
            id="bulk-success-title"
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '6px'
            }}
          >
            Successful
          </h2>

          {/* Descriptive message per requirement */}
          <p
            id="bulk-success-desc"
            style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: 1.5,
              margin: '0 0 20px',
              maxWidth: '460px'
            }}
          >
            {isPartial
              ? 'Your upload completed. Valid records were successfully cataloged into the library inventory.'
              : 'Your upload completed successfully. All records have been cataloged and processed into the library inventory.'}
          </p>

          {/* File details pill */}
          {fileName && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12.5px',
                color: '#334155',
                marginBottom: '20px',
                maxWidth: '100%',
                overflow: 'hidden'
              }}
            >
              <FileSpreadsheet size={15} color="#166534" style={{ flexShrink: 0 }} />
              <span
                style={{
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {fileName}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#e2e8f0',
                  color: '#475569'
                }}
              >
                {importMode === 'all_or_nothing' ? 'All-or-Nothing' : 'Skip Errors'}
              </span>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            {/* 1. Imported Book Titles */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#166534',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
              >
                <BookOpen size={14} />
                <span>Titles Imported</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#166534', lineHeight: 1.1 }}>
                {importedCount}
              </div>
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
                Catalog titles
              </div>
            </div>

            {/* 2. Physical Copies Created */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#0369a1',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
              >
                <Copy size={14} />
                <span>Physical Copies</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {totalCopiesCreated ?? importedCount}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Accession barcodes
              </div>
            </div>

            {/* 3. Processed Rows Summary */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#475569',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '4px'
                }}
              >
                <CheckCircle2 size={14} />
                <span>Processed Rows</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
                {totalRows}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                {validRows} valid rows
              </div>
            </div>
          </div>

          {/* Partial Summary Breakdown (if skipped or failed rows exist) */}
          {(skippedDuplicates > 0 || invalidRows > 0) && (
            <div
              style={{
                width: '100%',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#92400e',
                marginBottom: '16px',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} color="#b45309" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Import Adjustments:</strong>{' '}
                  {skippedDuplicates > 0 && `${skippedDuplicates} duplicate records skipped`}
                  {skippedDuplicates > 0 && invalidRows > 0 && ', '}
                  {invalidRows > 0 && `${invalidRows} invalid records excluded`}
                </span>
              </div>
            </div>
          )}

          {/* Catalog Sync Confirmation Badge */}
          <div
            style={{
              width: '100%',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#166534',
              textAlign: 'left'
            }}
          >
            <Sparkles size={16} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              The catalog list has been refreshed automatically. Newly accessioned books are now ready for circulation and borrowing.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          {onViewRecords && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewRecords();
              }}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13.5px',
                fontWeight: 600,
                padding: '8px 16px',
                minHeight: '40px'
              }}
            >
              <span>View Imported Records</span>
              <ArrowRight size={15} />
            </button>
          )}

          <button
            ref={doneButtonRef}
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '13.5px',
              fontWeight: 600,
              padding: '8px 24px',
              minWidth: '105px',
              minHeight: '40px',
              boxShadow: '0 4px 6px -1px rgba(22, 101, 52, 0.25)'
            }}
          >
            <Check size={16} />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
