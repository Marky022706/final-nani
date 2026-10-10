import React, { useEffect, useRef } from 'react';
import type { Book } from '../../types';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteBookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  books: Book[];
  isSubmitting?: boolean;
}

export const DeleteBookDialog: React.FC<DeleteBookDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
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
  const singleBook = books[0];
  const hasActiveBooks = books.some((b) => !b.isArchived);

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
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
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 id="delete-dialog-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              {isSingle ? 'Delete Book' : `Delete ${books.length} Books`}
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
          {/* Safeguard: Reject if active book is selected */}
          {hasActiveBooks ? (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                color: '#b91c1c',
                fontSize: '13px'
              }}
            >
              <strong>Cannot Delete Active Records:</strong>
              <div style={{ marginTop: '4px' }}>
                Active books cannot be directly deleted. In accordance with library policy, please archive the book first before permanent deletion.
              </div>
            </div>
          ) : (
            <>
              {isSingle ? (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Are you sure you want to delete this book{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>"{singleBook.title}"</strong>?
                </p>
              ) : (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Are you sure you want to delete the{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{books.length} selected archived books</strong>?
                </p>
              )}

              <div
                style={{
                  marginTop: '12px',
                  fontSize: '12.5px',
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #fee2e2',
                  fontWeight: 500
                }}
              >
                This action cannot be undone. All associated accession and physical copy records will be permanently removed.
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
          {!hasActiveBooks && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--danger, #dc2626)',
                borderColor: 'var(--danger, #dc2626)',
                gap: '6px'
              }}
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
              <span>{isSingle ? 'Delete Book' : `Delete ${books.length} Books`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
