import React, { useEffect, useRef } from 'react';
import {
  WifiOff,
  Database,
  TimerOff,
  ServerCrash,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import type { ApiErrorType } from '../../services/api';

export interface LoginErrorInfo {
  type: ApiErrorType;
  title: string;
  message: string;
  canRetry: boolean;
}

interface LoginLoadingOverlayProps {
  isOpen: boolean;
  status: 'loading' | 'error';
  error: LoginErrorInfo | null;
  onRetry: () => void;
  onBackToLogin: () => void;
}

export const LoginLoadingOverlay: React.FC<LoginLoadingOverlayProps> = ({
  isOpen,
  status,
  error,
  onRetry,
  onBackToLogin,
}) => {
  const retryBtnRef = useRef<HTMLButtonElement>(null);
  const backBtnRef = useRef<HTMLButtonElement>(null);

  // Auto focus the primary action when an error appears
  useEffect(() => {
    if (isOpen && status === 'error') {
      if (error?.canRetry && retryBtnRef.current) {
        retryBtnRef.current.focus();
      } else if (backBtnRef.current) {
        backBtnRef.current.focus();
      }
    }
  }, [isOpen, status, error]);

  // Handle keyboard shortcuts (Escape -> Back to Login, Enter -> Retry if focused)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onBackToLogin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onBackToLogin]);

  if (!isOpen) return null;

  const isError = status === 'error' && error !== null;

  // Render appropriate error icon & tones based on error scenario
  const renderErrorIcon = () => {
    if (!error) return null;

    switch (error.type) {
      case 'connection_error':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)',
            }}
          >
            <WifiOff size={32} color="#DC2626" strokeWidth={2.2} />
          </div>
        );

      case 'database_error':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)',
            }}
          >
            <Database size={32} color="#DC2626" strokeWidth={2.2} />
          </div>
        );

      case 'timeout_error':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FFFBEB',
              border: '2px solid #FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.12)',
            }}
          >
            <TimerOff size={32} color="#D97706" strokeWidth={2.2} />
          </div>
        );

      case 'server_error':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)',
            }}
          >
            <ServerCrash size={32} color="#DC2626" strokeWidth={2.2} />
          </div>
        );

      case 'auth_error':
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)',
            }}
          >
            <ShieldAlert size={32} color="#DC2626" strokeWidth={2.2} />
          </div>
        );

      case 'unexpected_error':
      default:
        return (
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.12)',
            }}
          >
            <AlertCircle size={32} color="#DC2626" strokeWidth={2.2} />
          </div>
        );
    }
  };

  return (
    <div
      role={isError ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-busy={status === 'loading'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-labelledby="login-overlay-title"
      aria-describedby="login-overlay-desc"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          padding: '36px 30px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(22, 101, 52, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          border: '1px solid #E2E8F0',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle brand stripe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            backgroundColor: isError
              ? error.type === 'timeout_error'
                ? '#D97706'
                : '#DC2626'
              : '#166534',
          }}
        />

        {/* LOADING STATE */}
        {!isError && (
          <>
            {/* Loading Spinner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px',
              }}
            >
              <div className="loader" role="status" aria-label="Connecting" />
            </div>

            {/* Title & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3
                id="login-overlay-title"
                style={{
                  fontSize: '19px',
                  fontWeight: 700,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.015em',
                }}
              >
                Connecting to Library System
              </h3>
              <p
                id="login-overlay-desc"
                style={{
                  fontSize: '13.5px',
                  color: '#64748B',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                Verifying credentials with the library management system...
              </p>
            </div>

            {/* Subtle security indicator */}
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#166534',
                backgroundColor: '#F0FDF4',
                padding: '4px 12px',
                borderRadius: '999px',
                border: '1px solid #BBF7D0',
                marginTop: '4px',
              }}
            >
              🔒 256-Bit Encrypted Portal Session
            </div>
          </>
        )}

        {/* ERROR STATE */}
        {isError && (
          <>
            {/* Appropriate Icon */}
            {renderErrorIcon()}

            {/* Error Title & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <h3
                id="login-overlay-title"
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {error.title}
              </h3>
              <p
                id="login-overlay-desc"
                style={{
                  fontSize: '14px',
                  color: '#475569',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {error.message}
              </p>
            </div>

            {/* Actions: Retry & Back to Login */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                marginTop: '8px',
              }}
            >
              {error.canRetry && (
                <button
                  type="button"
                  ref={retryBtnRef}
                  onClick={onRetry}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '11px 18px',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    backgroundColor: '#166534',
                    borderColor: '#166534',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <RefreshCw size={15} />
                  <span>
                    {error.type === 'connection_error' ? 'Retry Connection' : 'Retry'}
                  </span>
                </button>
              )}

              <button
                type="button"
                ref={backBtnRef}
                onClick={onBackToLogin}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '11px 18px',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  borderRadius: '10px',
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #CBD5E1',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowLeft size={15} />
                <span>Back to Login</span>
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.12); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
