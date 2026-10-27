import React, { useEffect } from 'react';
import { BookOpen } from 'lucide-react';

export interface ActionLoadingModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  showIcon?: boolean;
  useLogo?: boolean;
}

export const ActionLoadingModal: React.FC<ActionLoadingModalProps> = ({
  isOpen,
  title = 'Processing Request',
  message = 'Please wait while the library system completes your request...',
  showIcon = true,
  useLogo
}) => {
  const isLogoActive = useLogo ?? (title.toLowerCase().includes('sign') || title.toLowerCase().includes('auth'));
  // Trap escape and keyboard interaction during processing to prevent corrupting state
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Escape or accidental form submission during critical action processing
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-labelledby="action-loading-title"
      aria-describedby="action-loading-desc"
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-dialog modal-content action-loading-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--bg-surface-elevated, #FFFFFF)',
          color: 'var(--text-primary, #0F172A)',
          borderRadius: '16px',
          padding: '32px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          border: '1px solid var(--border-main, #E2E8F0)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Icon Container */}
        {showIcon && (
          <div
            style={{
              position: 'relative',
              width: isLogoActive ? '72px' : '64px',
              height: isLogoActive ? '72px' : '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}
          >
            {/* Outer subtle pulse glow ring for logo mode */}
            {isLogoActive && (
              <div
                className="animate-pulse-glow"
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(22, 101, 52, 0.08)'
                }}
                aria-hidden="true"
              />
            )}

            {/* Outer spinning green track ring */}
            <div
              className="bpl-spinner"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px solid rgba(22, 101, 52, 0.15)',
                borderTopColor: '#166534',
                borderRightColor: '#228B22'
              }}
              aria-hidden="true"
            />

            {/* Inner Brand Crest / Logo */}
            {isLogoActive ? (
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(22, 101, 52, 0.16), 0 0 0 1px rgba(22, 101, 52, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  zIndex: 2,
                  overflow: 'hidden'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Balingasag Municipal Library Logo"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '50%'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <BookOpen size={20} strokeWidth={2.2} />
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <BookOpen size={20} strokeWidth={2.2} />
              </div>
            )}
          </div>
        )}

        {/* Action Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3
            id="action-loading-title"
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text-primary, #0F172A)',
              margin: 0,
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h3>
          <p
            id="action-loading-desc"
            style={{
              fontSize: '13.5px',
              color: 'var(--text-muted, #64748B)',
              lineHeight: 1.5,
              margin: 0,
              maxWidth: '340px'
            }}
          >
            {message}
          </p>
        </div>

        {/* Linear progress pulsing indicator */}
        <div
          style={{
            width: '100%',
            height: '4px',
            backgroundColor: 'var(--bg-muted, #F1F5F9)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginTop: '4px'
          }}
        >
          <div
            className="bpl-skeleton-shimmer"
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, #166534 0%, #4ADE80 50%, #166534 100%)',
              backgroundSize: '200% 100%'
            }}
          />
        </div>

        <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
          Balingasag Municipal Library Management System
        </div>
      </div>
    </div>
  );
};
