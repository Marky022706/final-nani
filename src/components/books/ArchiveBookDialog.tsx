import React, { useEffect, useRef } from 'react';
import type { Book } from '../../types';
import { Archive, ArchiveRestore, X, Loader2 } from 'lucide-react';

interface ArchiveBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  mode: 'archive' | 'restore';
  books: Book[];
  isSubmitting?: boolean;
}

export const ArchiveBookDialog: React.FC<ArchiveBookDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  books,
  isSubmitting = false
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const timeout = setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || books.length === 0) return null;

  const isSingle = books.length === 1;
  const targetTitle = isSingle ? books[0].title : `${books.length} Books`;

  const dialogTitle =
    mode === 'archive'
      ? isSingle
        ? 'Archive Book'
        : `Archive ${books.length} Books`
      : isSingle
      ? 'Restore Book'
      : `Restore ${books.length} Books`;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-dialog-title"
    >
      <div
        className="modal-dialog"
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: mode === 'archive' ? '#fef3c7' : '#dcfce7',
                color: mode === 'archive' ? '#d97706' : '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {mode === 'archive' ? <Archive size={17} /> : <ArchiveRestore size={17} />}
            </div>
            <h3 id="archive-dialog-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {dialogTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px', fontSize: '14px', lineHeight: 1.5 }}>
          {mode === 'archive' ? (
            <>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to archive {isSingle ? <strong>"{targetTitle}"</strong> : `the selected ${books.length} books`}?
              </p>
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Archived books are retired from active circulation and borrowing requests, but their bibliographic records remain preserved in the archived catalog.
              </div>
            </>
          ) : (
            <>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Are you sure you want to restore {isSingle ? <strong>"{targetTitle}"</strong> : `the selected ${books.length} books`} back to the active catalog?
              </p>
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                Restored books will immediately become visible in the active public catalog and available for borrowing and reservations.
              </div>
            </>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ gap: '6px' }}
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            <span>{mode === 'archive' ? 'Archive' : 'Restore'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
