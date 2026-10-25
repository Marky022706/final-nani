import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

export interface GlobalPageLoaderProps {
  isVisible: boolean;
  isExiting?: boolean;
  title?: string;
  subtitle?: string;
  destinationName?: string;
  error?: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const GlobalPageLoader: React.FC<GlobalPageLoaderProps> = ({
  isVisible,
  isExiting = false,
  title = 'Loading Library System...',
  subtitle = 'Please wait while we prepare your page.',
  destinationName,
  error = null,
  onRetry,
  onDismiss
}) => {
  // Prevent keyboard actions and background interaction while transitioning
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow escape to dismiss only if in an error state
      if (e.key === 'Escape' && error && onDismiss) {
        onDismiss();
        return;
      }
      // Trap common navigation keys during blocking route loading
      if (!error && (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isVisible, error, onDismiss]);

  if (!isVisible && !isExiting) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!error}
      aria-label="Loading destination view"
      className={`global-page-loader-overlay ${isExiting ? 'is-exiting' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        pointerEvents: isExiting ? 'none' : 'auto',
        userSelect: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="global-page-loader-card"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '16px',
          padding: '32px 28px 24px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Close/Dismiss button when in error state */}
        {error && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error overlay"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #64748B)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s, color 0.15s'
            }}
          >
            <X size={18} />
          </button>
        )}

        {/* 1. ANIMATED SPINNER OR ERROR ICON */}
        {!error ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '6px'
            }}
          >
            <div className="loader" role="status" aria-label="Loading" />
          </div>
        ) : (
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(239, 68, 68, 0.3)',
              marginBottom: '2px'
            }}
          >
            <AlertTriangle size={28} />
          </div>
        )}

        {/* 2. TITLE AND SUBTITLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: error ? '#DC2626' : 'var(--brand-forest, #166534)',
              margin: 0,
              letterSpacing: '-0.015em',
              lineHeight: 1.3
            }}
          >
            {error ? 'Navigation Interrupted' : title}
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: error ? '#DC2626' : 'var(--text-secondary, #64748B)',
              lineHeight: 1.5,
              margin: 0
            }}
          >
            {error || subtitle}
          </p>

          {/* Contextual destination pill if provided and not in error state */}
          {!error && destinationName && (
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--bg-subtle, #F0FDF4)',
                  color: 'var(--brand-forest, #166534)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  border: '1px solid var(--border-main, #DCFCE7)'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#22C55E'
                  }}
                  aria-hidden="true"
                />
                {destinationName}
              </span>
            </div>
          )}
        </div>

        {/* 3. SHIMMER PROGRESS BAR (DURING NORMAL LOADING) */}
        {!error ? (
          <div
            style={{
              width: '100%',
              height: '3.5px',
              backgroundColor: 'var(--bg-subtle, #F1F5F9)',
              borderRadius: '999px',
              overflow: 'hidden',
              marginTop: '2px'
            }}
          >
            <div
              className="bpl-skeleton-shimmer"
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, #166534 0%, #22C55E 50%, #166534 100%)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>
        ) : (
          /* Error recovery actions */
          <div
            style={{
              display: 'flex',
              gap: '10px',
              marginTop: '6px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#166534',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, transform 0.1s'
                }}
              >
                <RotateCcw size={14} />
                Try Again
              </button>
            )}

            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                  color: 'var(--text-primary, #475569)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-main, #E2E8F0)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s'
                }}
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* 4. MUNICIPAL BRANDING FOOTER */}
        <div
          style={{
            fontSize: '10.5px',
            color: 'var(--text-muted, #94A3B8)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: '2px'
          }}
        >
          Balingasag Municipal Library
        </div>
      </div>
    </div>
  );
};
