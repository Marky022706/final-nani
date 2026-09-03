import React, { useState } from 'react';
import type { User } from '../../types';
import { Library, Lock, Mail, Eye, EyeOff, AlertCircle, HelpCircle, X, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, users }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedIdentifier = identifier.trim().toLowerCase();
    if (!trimmedIdentifier || !password) {
      setErrorMessage('Please enter both your email / username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      // Find matching user by email, username, or memberId
      const foundUser = users.find(
        (u) =>
          u.email.toLowerCase() === trimmedIdentifier ||
          (u.username && u.username.toLowerCase() === trimmedIdentifier) ||
          (u.memberId && u.memberId.toLowerCase() === trimmedIdentifier)
      );

      if (!foundUser) {
        setIsLoading(false);
        setErrorMessage('Invalid credentials. Please verify your email / username and password.');
        return;
      }

      // Check account status
      if (foundUser.status === 'inactive') {
        setIsLoading(false);
        setErrorMessage('Your library account is currently inactive. Please contact the library administrator.');
        return;
      }

      if (foundUser.status === 'suspended') {
        setIsLoading(false);
        setErrorMessage('Your library account is currently suspended. Please contact the library administrator.');
        return;
      }

      // Simple password check (supports user's password or demo default)
      if (foundUser.password && foundUser.password !== password && password !== 'password123') {
        setIsLoading(false);
        setErrorMessage('Incorrect password. Please try again.');
        return;
      }

      setIsLoading(false);
      onLogin(foundUser);
    }, 400);
  };

  const handleQuickFill = (userEmail: string, pass = 'password123') => {
    const user = users.find((u) => u.email === userEmail);
    if (user) {
      setIdentifier(user.email);
      setPassword(pass);
      setErrorMessage(null);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#032b22',
        backgroundImage: 'radial-gradient(circle at 20% 20%, #064e3b 0%, #02241c 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle Background Pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage:
            'radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          backgroundPosition: '0 0, 16px 16px',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              backgroundColor: 'var(--brand-forest)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.3)',
              marginBottom: '16px'
            }}
          >
            <Library size={28} strokeWidth={2.2} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '6px'
            }}
          >
            Balingasag Public Library
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Library Management System Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 14px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '13px',
              lineHeight: 1.45
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{errorMessage}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email / Username */}
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="login-identifier"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="#94a3b8"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-identifier"
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or username"
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  height: '42px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155'
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-forest)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="#94a3b8"
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  paddingRight: '38px',
                  height: '42px',
                  fontSize: '14px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#475569',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: 'var(--brand-forest)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span>Remember Me</span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%',
              height: '44px',
              fontSize: '14px',
              fontWeight: 600,
              justifyContent: 'center',
              boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.25)'
            }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Note on Admin-Controlled Accounts */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '12px',
            color: '#64748b',
            lineHeight: 1.5
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '4px', fontWeight: 600, color: '#334155' }}>
            <ShieldCheck size={14} color="var(--brand-forest)" />
            <span>Admin-Controlled Registration</span>
          </div>
          <div>
            Member accounts are issued exclusively by library administration. Please visit the front desk to obtain your credentials.
          </div>
        </div>

        {/* Demo Fast Logins for Testing */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '11.5px'
          }}
        >
          <div style={{ fontWeight: 600, color: '#475569', marginBottom: '8px', textAlign: 'center' }}>
            Quick Demo Credentials:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleQuickFill('superadmin@balingasag.gov.ph')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px', justifyContent: 'center' }}
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin.roberto@balingasag.gov.ph')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px', justifyContent: 'center' }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('juan.delacruz@gmail.com')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px', justifyContent: 'center' }}
            >
              Active Member
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('david.inactive@gmail.com')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 6px', justifyContent: 'center', color: '#dc2626' }}
            >
              Inactive Member
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="modal-overlay" onClick={() => setIsForgotPasswordOpen(false)}>
          <div
            className="modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="stat-icon" style={{ backgroundColor: 'var(--accent-blue-light)', color: 'var(--brand-forest)' }}>
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Password Assistance</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Balingasag Library Administration
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>
                To maintain municipal security standards, member password resets are issued through the <strong>Library Administrator</strong>.
              </p>
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-main)',
                  marginBottom: '14px'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Front Desk Contact:
                </div>
                <div>• Visit the Balingasag Municipal Library Circulation Desk</div>
                <div>• Present your Member Card or Valid Photo ID</div>
                <div>• Email: <code>admin.roberto@balingasag.gov.ph</code></div>
                <div>• Municipal Hotline: <code>+63 88 123 4567</code></div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                The administrator will verify your identity and generate a temporary password for your account.
              </p>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Check size={16} />
                <span>Understood</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
