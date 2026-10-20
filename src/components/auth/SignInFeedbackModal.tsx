import React, { useEffect, useRef } from 'react';
import type { User } from '../../types';
import { Check, ShieldCheck, Loader2 } from 'lucide-react';

export interface SignInFeedbackModalProps {
  status: 'idle' | 'loading' | 'welcome';
  user?: User | null;
  onWelcomeComplete?: () => void;
}

export const SignInFeedbackModal: React.FC<SignInFeedbackModalProps> = ({
  status,
  user,
  onWelcomeComplete
}) => {
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  // When in 'welcome' state, automatically trigger onWelcomeComplete after ~1.5s
  useEffect(() => {
    if (status === 'welcome' && !hasTriggeredRef.current) {
      completeTimerRef.current = setTimeout(() => {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onWelcomeComplete?.();
        }
      }, 1500);
    }

    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, [status, onWelcomeComplete]);

  // Reset trigger ref if status goes back to idle or loading
  useEffect(() => {
    if (status !== 'welcome') {
      hasTriggeredRef.current = false;
    }
  }, [status]);

  if (status === 'idle') {
    return null;
  }

  // Determine user display name and role badge
  const fullName = user?.name?.trim() || '';
  const firstName = fullName.split(' ')[0] || 'User';
  const roleDisplay =
    user?.role === 'super_admin'
      ? 'Super Administrator'
      : user?.role === 'admin'
      ? 'Library Administrator'
      : user?.role === 'volunteer'
      ? 'Staff Volunteer'
      : 'Library Staff';

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.70)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-labelledby="signin-feedback-title"
      aria-describedby="signin-feedback-desc"
    >
      <div
        className="modal-dialog animate-modal-fade-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-main, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '36px 30px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Forest Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#166534',
            background:
              status === 'loading'
                ? 'linear-gradient(90deg, #166534, #22c55e, #166534)'
                : '#166534'
          }}
        />

        {status === 'loading' ? (
          <div
            key="signin-loading-panel"
            className="animate-modal-fade-in"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Elegant Forest Green Loading Indicator with Library Logo */}
            <div
              style={{
                position: 'relative',
                width: '76px',
                height: '76px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Outer pulsing ring */}
              <div
                className="animate-pulse-glow"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(22, 101, 52, 0.08)'
                }}
              />

              {/* Rotating outer spinner ring */}
              <div
                className="animate-spin-smooth"
                style={{
                  position: 'absolute',
                  inset: '-3px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#166534',
                  borderRightColor: '#22c55e'
                }}
              />

              {/* Inner Logo Badge */}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(22, 101, 52, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  zIndex: 2
                }}
              >
                <img
                  src="/logo.png"
                  alt="Balingasag Library Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
                />
              </div>
            </div>

            {/* Heading & Supporting Text per specification */}
            <h2
              id="signin-feedback-title"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '8px'
              }}
            >
              Signing you in...
            </h2>
            <p
              id="signin-feedback-desc"
              style={{
                fontSize: '13.5px',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 0 24px'
              }}
            >
              Please wait while we securely verify your account.
            </p>

            {/* Indeterminate linear loading bar */}
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#f1f5f9',
                borderRadius: '9999px',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '20px'
              }}
            >
              <div className="animate-login-progress" />
            </div>

            {/* Security Assurance Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b'
              }}
            >
              <ShieldCheck size={14} color="#166534" />
              <span>Secure Municipal Verification</span>
            </div>
          </div>
        ) : (
          <div
            key="signin-welcome-panel"
            className="animate-modal-fade-in"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Animated Checkmark / Success Icon */}
            <div
              className="animate-success-pop animate-pulse-glow"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                border: '3px solid #bbf7d0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#166534',
                marginBottom: '20px',
                boxShadow: '0 10px 25px -4px rgba(22, 101, 52, 0.25)'
              }}
            >
              <Check size={38} strokeWidth={3} />
            </div>

            {/* Heading per specification */}
            <h2
              id="signin-feedback-title"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '6px'
              }}
            >
              Welcome Back!
            </h2>

            {/* Personalized greeting */}
            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#166534',
                marginBottom: '10px'
              }}
            >
              Welcome back, {fullName || firstName}!
            </div>

            {/* Role Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                fontSize: '12px',
                fontWeight: 600,
                color: '#166534',
                marginBottom: '16px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a'
                }}
              />
              <span>{roleDisplay}</span>
            </div>

            {/* Message per specification */}
            <p
              id="signin-feedback-desc"
              style={{
                fontSize: '13.5px',
                color: '#475569',
                lineHeight: 1.5,
                margin: '0 0 22px',
                padding: '0 8px'
              }}
            >
              You have successfully signed in to the Balingasag Public Library Management System.
            </p>

            {/* Preparing workspace transition bar */}
            <div style={{ width: '100%', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#166534',
                  marginBottom: '8px'
                }}
              >
                <Loader2 size={14} className="animate-spin-smooth" />
                <span>Preparing your workspace...</span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="animate-welcome-progress"
                  style={{
                    height: '100%',
                    backgroundColor: '#166534',
                    borderRadius: '9999px'
                  }}
                />
              </div>
            </div>

            {/* Manual continue fallback if user clicks */}
            <button
              type="button"
              onClick={() => {
                if (completeTimerRef.current) {
                  clearTimeout(completeTimerRef.current);
                }
                if (!hasTriggeredRef.current) {
                  hasTriggeredRef.current = true;
                  onWelcomeComplete?.();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                fontSize: '11.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 8px',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#166534')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              Click here to proceed immediately
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
