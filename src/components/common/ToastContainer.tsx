import React from 'react';
import type { ToastMessage } from '../../types';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = Info;
        let iconColor = 'var(--info)';
        let borderColor = 'var(--border-main)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          iconColor = 'var(--success)';
          borderColor = 'var(--success-border)';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'var(--warning)';
          borderColor = 'var(--warning-border)';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          iconColor = 'var(--danger)';
          borderColor = 'var(--danger-border)';
        }

        return (
          <div
            key={toast.id}
            className="toast"
            style={{ borderColor }}
            role="alert"
          >
            <Icon size={20} color={iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)' }}>
                {toast.title}
              </div>
              {toast.message && (
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-subtle)',
                padding: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 4
              }}
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
