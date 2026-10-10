import React, { useEffect, useRef } from 'react';
import { LogOut, X, AlertTriangle } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  // Focus cancel button upon opening & handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      aria-describedby="logout-modal-desc"
    >
      <div
        className="modal-dialog logout-confirmation-modal"
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
            <h3 id="logout-modal-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
              Logout Confirmation
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', borderRadius: '50%' }}
            aria-label="Close modal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px', fontSize: '14px', lineHeight: 1.5 }}>
          <p id="logout-modal-desc" style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to log out of your account
            {userName ? <strong style={{ color: 'var(--text-primary)' }}> ({userName})</strong> : ''}?
          </p>
          <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
            You will need to enter your credentials again to access the library dashboard.
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '14px 24px' }}>
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
            style={{ gap: '6px' }}
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
