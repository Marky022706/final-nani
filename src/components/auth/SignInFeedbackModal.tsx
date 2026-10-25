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
  const onWelcomeCompleteRef = useRef(onWelcomeComplete);

  useEffect(() => {
    onWelcomeCompleteRef.current = onWelcomeComplete;
  }, [onWelcomeComplete]);

  // When in 'welcome' state, automatically trigger onWelcomeComplete after ~1.8s
  useEffect(() => {
    if (status === 'welcome' && !hasTriggeredRef.current) {
      completeTimerRef.current = setTimeout(() => {
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onWelcomeCompleteRef.current?.();
        }
      }, 1800);
    }

    return () => {
      if (completeTimerRef.current) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, [status]);

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
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
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
          maxWidth: '430px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          border: '1px solid var(--border-main, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(22, 101, 52, 0.08)',
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
            backgroundColor: 'var(--brand-forest, #166534)',
            background:
              status === 'loading'
                ? 'linear-gradient(90deg, #166534, #22c55e, #166534)'
                : 'var(--brand-forest, #166534)'
          }}
        />

        {status === 'loading' ? (
          <div
            key="signin-loading-panel"
            className="animate-modal-fade-in"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Logo with Animated Orbital Spinner */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '88px',
                height: '88px',
                marginBottom: '18px'
              }}
            >
              {/* Outer rotating gradient accent ring */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#16a34a',
                  borderRightColor: '#22c55e',
                  borderBottomColor: 'rgba(34, 197, 94, 0.2)',
                  animation: 'spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite'
                }}
                aria-hidden="true"
              />

              {/* Ambient green breathing pulse glow */}
              <div
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 197, 94, 0.16)',
                  filter: 'blur(8px)',
                  animation: 'pulseGlowGreen 2s infinite ease-in-out'
                }}
                aria-hidden="true"
              />

              {/* Centered Logo Badge */}
              <div
                style={{
                  position: 'relative',
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface, #ffffff)',
                  border: '2px solid rgba(22, 101, 52, 0.15)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '7px',
                  overflow: 'hidden'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Balingasag Seal"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('balingasag-logo.png')) {
                      target.src = '/balingasag-logo.png';
                    }
                  }}
                />
              </div>
            </div>

            {/* Municipality Tag */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--light-green, #f0fdf4)',
                border: '1px solid var(--light-green-border, #bbf7d0)',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand-forest, #166534)',
                marginBottom: '10px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e'
                }}
              />
              Municipality of Balingasag
            </div>

            {/* Heading & Supporting Text */}
            <h2
              id="signin-feedback-title"
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
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
                color: 'var(--text-secondary, #475569)',
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
                backgroundColor: 'var(--bg-subtle, #f1f5f9)',
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
                backgroundColor: 'var(--bg-subtle, #f8fafc)',
                border: '1px solid var(--border-main, #e2e8f0)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary, #64748b)'
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
                backgroundColor: 'var(--light-green, #dcfce7)',
                border: '3px solid var(--light-green-border, #bbf7d0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-forest, #166534)',
                marginBottom: '18px',
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
                color: 'var(--text-primary, #0f172a)',
                letterSpacing: '-0.02em',
                marginBottom: '6px'
              }}
            >
              Welcome Back!
            </h2>

            {/* Personalized greeting */}
            <div
              style={{
                fontSize: '16.5px',
                fontWeight: 700,
                color: 'var(--brand-forest, #166534)',
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
                backgroundColor: 'var(--light-green, #f0fdf4)',
                border: '1px solid var(--light-green-border, #bbf7d0)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--brand-forest, #166534)',
                marginBottom: '14px'
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
                color: 'var(--text-secondary, #475569)',
                lineHeight: 1.5,
                margin: '0 0 18px',
                padding: '0 8px'
              }}
            >
              You have successfully signed in to the Balingasag Public Library Management System.
            </p>

            {/* Preparing workspace transition bar */}
            <div style={{ width: '100%', marginBottom: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: 'var(--brand-forest, #166534)',
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
                  backgroundColor: 'var(--light-green, #dcfce7)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  className="animate-welcome-progress"
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--brand-forest, #166534)',
                    borderRadius: '9999px'
                  }}
                />
              </div>
            </div>

            {/* Continue to Dashboard Button */}
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '10px 18px',
                fontSize: '13.5px',
                fontWeight: 600,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
              onClick={() => {
                if (completeTimerRef.current) {
                  clearTimeout(completeTimerRef.current);
                }
                if (!hasTriggeredRef.current) {
                  hasTriggeredRef.current = true;
                  onWelcomeCompleteRef.current?.();
                }
              }}
            >
              <span>Continue to Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
