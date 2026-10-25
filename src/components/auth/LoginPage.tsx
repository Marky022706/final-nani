import React, { useState } from 'react';
import type { User } from '../../types';
import { api, ApiError, type ApiErrorType } from '../../services/api';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  HelpCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Loader2,
  BookOpen,
  MapPin,
  Clock,
  WifiOff,
  Database,
  TimerOff,
  ServerCrash,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { SignInFeedbackModal } from './SignInFeedbackModal';

export interface LoginInlineError {
  type: ApiErrorType | 'validation_error';
  title: string;
  message: string;
  canRetry: boolean;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBackToLanding }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState<LoginInlineError | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bgImageError, setBgImageError] = useState(false);

  // Auth feedback state: 'idle' | 'loading' | 'welcome'
  const [authFeedbackStatus, setAuthFeedbackStatus] = useState<'idle' | 'loading' | 'welcome'>('idle');
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);

  // Credentials are verified server-side against the Laravel API;
  // a Sanctum token is issued and stored for all subsequent requests.
  const performLogin = async (loginIdentifier: string, loginPassword: string) => {
    if (isLoading || authFeedbackStatus !== 'idle') return;

    setInlineError(null);
    setIsLoading(true);
    setAuthFeedbackStatus('loading');

    const startTime = Date.now();
    try {
      const { user } = await api.login(loginIdentifier, loginPassword, 10000);

      // Ensure loading animation is cleanly visible for at least 700ms so user sees system connecting
      const elapsed = Date.now() - startTime;
      if (elapsed < 700) {
        await new Promise((resolve) => setTimeout(resolve, 700 - elapsed));
      }

      if (user.status === 'inactive') {
        setAuthFeedbackStatus('idle');
        setIsLoading(false);
        setInlineError({
          type: 'auth_error',
          title: 'Account Inactive',
          message: 'Your library account is currently inactive. Please contact the library administrator.',
          canRetry: false
        });
        return;
      }

      if (user.status === 'suspended') {
        setAuthFeedbackStatus('idle');
        setIsLoading(false);
        setInlineError({
          type: 'auth_error',
          title: 'Account Suspended',
          message: 'Your library account is currently suspended. Please contact the library administrator.',
          canRetry: false
        });
        return;
      }

      // Smooth transition to Welcome Message!
      setAuthenticatedUser(user);
      setAuthFeedbackStatus('welcome');
      setIsLoading(false);
    } catch (err: unknown) {
      setAuthFeedbackStatus('idle');
      setIsLoading(false);

      if (err instanceof ApiError) {
        switch (err.errorType) {
          case 'connection_error':
            setInlineError({
              type: 'connection_error',
              title: 'Connection Error',
              message: 'Unable to connect to the library server. Please check your internet connection and try again.',
              canRetry: true
            });
            break;

          case 'database_error':
            setInlineError({
              type: 'database_error',
              title: 'Database Connection Error',
              message: 'The library database is temporarily unavailable. Please try again later.',
              canRetry: true
            });
            break;

          case 'timeout_error':
            setInlineError({
              type: 'timeout_error',
              title: 'Request Timeout',
              message: 'The server took too long to respond. Please try again.',
              canRetry: true
            });
            break;

          case 'server_error':
            setInlineError({
              type: 'server_error',
              title: 'Server Error',
              message: 'The library system is temporarily unavailable. Please try again later.',
              canRetry: true
            });
            break;

          case 'auth_error':
            setInlineError({
              type: 'auth_error',
              title: 'Sign In Failed',
              message: err.message || 'Invalid credentials. Please verify your email / username and password.',
              canRetry: true
            });
            break;

          default:
            setInlineError({
              type: 'unexpected_error',
              title: 'Sign In Error',
              message: err.message || 'An unexpected error occurred during sign in. Please try again.',
              canRetry: true
            });
            break;
        }
      } else {
        setInlineError({
          type: 'unexpected_error',
          title: 'Sign In Error',
          message:
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred during sign in. Please try again.',
          canRetry: true
        });
      }
    }
  };

  const handleRetry = () => {
    const trimmed = identifier.trim();
    if (trimmed && password) {
      performLogin(trimmed, password);
    }
  };

  const handleWelcomeComplete = () => {
    if (authenticatedUser) {
      setAuthFeedbackStatus('idle');
      onLogin(authenticatedUser);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      setInlineError({
        type: 'validation_error',
        title: 'Missing Required Fields',
        message: 'Please enter both your email / username and password.',
        canRetry: false
      });
      return;
    }
    await performLogin(trimmedIdentifier, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        backgroundColor: '#0A2518',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* ========================================================================= */}
      {/* 1. AUTHENTIC BALINGASAG LIBRARY PHOTOGRAPHIC BACKGROUND                   */}
      {/* ========================================================================= */}
      {!bgImageError && (
        <div
          id="login-bg-photo"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/balingasag-library-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            backgroundRepeat: 'no-repeat',
            zIndex: 0
          }}
          aria-hidden="true"
        >
          {/* Hidden image element to detect asset loading failures */}
          <img
            src="/balingasag-library-bg.jpg"
            alt=""
            style={{ display: 'none' }}
            onError={() => setBgImageError(true)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESTRAINED FOREST-GREEN DIRECTIONAL OVERLAY                            */}
      {/* Left side remains sunlit and clear showing the building; right has depth  */}
      {/* ========================================================================= */}
      <div
        className="login-directional-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(105deg, rgba(8, 30, 18, 0.60) 0%, rgba(9, 35, 21, 0.72) 48%, rgba(6, 24, 15, 0.88) 100%)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      {/* Subtle organic vignette for photographic framing */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.35)',
          zIndex: 1,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* 3. TOP NAVIGATION / ESCAPE HATCH                                          */}
      {/* ========================================================================= */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            aria-label="Return to Balingasag Public Library Home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '999px',
              color: '#FFFFFF',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.22)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </button>
        ) : (
          <div />
        )}

        {/* Municipal Seal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '999px',
            padding: '6px 14px'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#4ADE80',
              boxShadow: '0 0 8px #4ADE80'
            }}
          />
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#D1FAE5',
              letterSpacing: '0.02em'
            }}
          >
            Official Public Portal
          </span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 4. MAIN TWO-COLUMN BALANCED COMPOSITION                                   */}
      {/* Left side showcases library identity; Right side holds clean white card    */}
      {/* ========================================================================= */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 24px 40px',
          maxWidth: '1360px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box'
        }}
      >
        <div className="login-unified-card">
          {/* LEFT PANE: Institutional Branding & Public Library Mission */}
          <section
            className="login-card-brand-side"
            aria-label="Library Identity and Purpose"
          >
            {/* Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.28)',
                borderRadius: '999px',
                padding: '6px 14px',
                width: 'fit-content'
              }}
            >
              <img
                src="/logo.png"
                alt=""
                style={{ width: '18px', height: '18px', objectFit: 'contain' }}
              />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#A7F3D0',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                Municipality of Balingasag
              </span>
            </div>

            {/* Main Headline & Identity */}
            <div>
              <h1
                style={{
                  fontSize: 'clamp(24px, 2.4vw, 32px)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  lineHeight: 1.2,
                  letterSpacing: '-0.025em',
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.35)'
                }}
              >
                Balingasag Public Library
              </h1>

              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#A7F3D0',
                  marginBottom: '14px',
                  letterSpacing: '-0.01em'
                }}
              >
                Library Management System
              </div>

              <p
                style={{
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'rgba(255, 255, 255, 0.90)',
                  margin: 0,
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.25)'
                }}
              >
                A unified municipal portal serving readers, students, educators, and citizens across 36 barangays in Poblacion, Balingasag, Misamis Oriental.
              </p>
            </div>

            {/* Core Pillars / Location / Hours / Affiliation */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.16)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(34, 139, 34, 0.35)',
                    color: '#A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                    Balay Silangan Municipal Compound
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#D1FAE5' }}>
                    Poblacion, Balingasag, Misamis Oriental
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.16)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(34, 139, 34, 0.35)',
                    color: '#A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                    Service Hours: Mon – Fri, 8:00 AM – 5:00 PM
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#D1FAE5' }}>
                    Free public admission for all registered patrons
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.10)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.16)'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(34, 139, 34, 0.35)',
                    color: '#A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>
                    National Library of the Philippines Affiliated
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#D1FAE5' }}>
                    Physical volumes, research references & study facilities
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT PANE: Unified Login Form */}
          <section
            className="login-card-form-side"
            aria-label="Staff and Member Sign In Form"
          >
              {/* Indeterminate Animated Progress Bar on Form Submission */}
              {isLoading && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    backgroundColor: '#E2E8F0',
                    overflow: 'hidden'
                  }}
                >
                  <div className="login-top-progress" />
                </div>
              )}

              {/* Form Card Header */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px'
                  }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      padding: '3px',
                      boxShadow: '0 4px 14px rgba(23, 77, 50, 0.16)',
                      border: '1.5px solid #E8F3E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="Balingasag Municipal Library"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#228B22', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Balingasag Public Library
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                      Library Management System
                    </div>
                  </div>
                </div>

                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#174D32',
                    letterSpacing: '-0.02em',
                    margin: '0 0 6px 0'
                  }}
                >
                  Welcome Back
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  Sign in to access the library management system.
                </p>
              </div>

              {/* Inline Error State Banner */}
              {inlineError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    backgroundColor: inlineError.type === 'timeout_error' ? '#FFFBEB' : '#FEF2F2',
                    border: inlineError.type === 'timeout_error' ? '1px solid #FDE68A' : '1px solid #FECACA',
                    color: inlineError.type === 'timeout_error' ? '#92400E' : '#991B1B',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: inlineError.type === 'timeout_error' ? '#FEF3C7' : '#FEE2E2',
                          color: inlineError.type === 'timeout_error' ? '#D97706' : '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}
                      >
                        {inlineError.type === 'connection_error' && <WifiOff size={18} />}
                        {inlineError.type === 'database_error' && <Database size={18} />}
                        {inlineError.type === 'timeout_error' && <TimerOff size={18} />}
                        {inlineError.type === 'server_error' && <ServerCrash size={18} />}
                        {inlineError.type === 'auth_error' && <ShieldAlert size={18} />}
                        {(inlineError.type === 'unexpected_error' || inlineError.type === 'validation_error') && <AlertCircle size={18} />}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '2px', color: inlineError.type === 'timeout_error' ? '#92400E' : '#991B1B' }}>
                          {inlineError.title}
                        </div>
                        <div style={{ color: inlineError.type === 'timeout_error' ? '#B45309' : '#B91C1C', fontSize: '12.5px' }}>
                          {inlineError.message}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInlineError(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: inlineError.type === 'timeout_error' ? '#B45309' : '#991B1B',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.7
                      }}
                      aria-label="Dismiss error"
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {inlineError.canRetry && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginLeft: '42px', marginTop: '2px' }}>
                      <button
                        type="button"
                        onClick={handleRetry}
                        disabled={isLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: inlineError.type === 'timeout_error' ? '#D97706' : '#DC2626',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          transition: 'opacity 0.15s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      >
                        <RefreshCw size={13} className={isLoading ? 'animate-spin-smooth' : ''} />
                        <span>{inlineError.type === 'connection_error' ? 'Retry Connection' : 'Retry'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Email or Username Field */}
                <div style={{ marginBottom: '18px' }}>
                  <label
                    htmlFor="login-identifier"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: '6px'
                    }}
                  >
                    Email Address or Username
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#94A3B8"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                      aria-hidden="true"
                    />
                    <input
                      id="login-identifier"
                      name="identifier"
                      type="text"
                      required
                      disabled={isLoading}
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (inlineError) setInlineError(null);
                      }}
                      placeholder="name@example.ph or username"
                      className="form-input login-input-custom"
                      aria-required="true"
                      aria-invalid={!!inlineError}
                      style={{
                        width: '100%',
                        height: '44px',
                        paddingLeft: '40px',
                        paddingRight: '14px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: inlineError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                        boxShadow: inlineError ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <label
                      htmlFor="login-password"
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#1E293B'
                      }}
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      disabled={isLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#228B22',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        padding: 0,
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                        opacity: isLoading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#166534')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#228B22')}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      color="#94A3B8"
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none'
                      }}
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (inlineError) setInlineError(null);
                      }}
                      placeholder="Enter your password"
                      className="form-input login-input-custom"
                      aria-required="true"
                      aria-invalid={!!inlineError}
                      style={{
                        width: '100%',
                        height: '44px',
                        paddingLeft: '40px',
                        paddingRight: '42px',
                        fontSize: '14px',
                        borderRadius: '10px',
                        border: inlineError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                        boxShadow: inlineError ? '0 0 0 3px rgba(239, 68, 68, 0.12)' : 'none',
                        backgroundColor: '#FFFFFF',
                        color: '#0F172A',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                        opacity: isLoading ? 0.7 : 1,
                        cursor: isLoading ? 'not-allowed' : 'text'
                      }}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label={showPassword ? 'Hide password text' : 'Show password text'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
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
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <input
                      type="checkbox"
                      disabled={isLoading}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{
                        accentColor: '#174D32',
                        width: '16px',
                        height: '16px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <span>Remember me on this browser</span>
                  </label>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    height: '46px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    justifyContent: 'center',
                    backgroundColor: '#174D32',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    boxShadow: '0 4px 14px rgba(23, 77, 50, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.8 : 1,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#14402A';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.backgroundColor = '#174D32';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin-smooth" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Administrative Registration Notice */}
              <div
                style={{
                  marginTop: '24px',
                  paddingTop: '18px',
                  borderTop: '1px solid #F1F5F9',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#64748B',
                  lineHeight: 1.55
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginBottom: '4px',
                    fontWeight: 700,
                    color: '#174D32'
                  }}
                >
                  <ShieldCheck size={14} color="#228B22" />
                  <span>Admin-Issued Credentials</span>
                </div>
                <div>
                  Member accounts are issued exclusively by library administration. Please visit the front desk with a valid ID for account creation.
                </div>

                {/* Quick Staff Testing Access */}
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-subtle, #F8FAFC)',
                    border: '1px solid var(--border-main, #E2E8F0)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Quick Staff Testing Access
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={isLoading || authFeedbackStatus !== 'idle'}
                      onClick={() => {
                        setIdentifier('admin.arquita@balingasag.gov.ph');
                        setPassword('admin123');
                        performLogin('admin.arquita@balingasag.gov.ph', 'admin123');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minWidth: '120px', justifyContent: 'center', fontSize: '11.5px', padding: '6px 8px' }}
                    >
                      👤 Admin (Ms. Arquita)
                    </button>
                    <button
                      type="button"
                      disabled={isLoading || authFeedbackStatus !== 'idle'}
                      onClick={() => {
                        setIdentifier('admin1@balingasag.gov.ph');
                        setPassword('admin123');
                        performLogin('admin1@balingasag.gov.ph', 'admin123');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minWidth: '120px', justifyContent: 'center', fontSize: '11.5px', padding: '6px 8px' }}
                    >
                      🤝 Volunteer (Balong)
                    </button>
                    <button
                      type="button"
                      disabled={isLoading || authFeedbackStatus !== 'idle'}
                      onClick={() => {
                        setIdentifier('superadmin@balingasag.gov.ph');
                        setPassword('admin123');
                        performLogin('superadmin@balingasag.gov.ph', 'admin123');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minWidth: '120px', justifyContent: 'center', fontSize: '11.5px', padding: '6px 8px' }}
                    >
                      🛡️ Superadmin
                    </button>
                  </div>
                </div>
              </div>
          </section>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 5. PASSWORD ASSISTANCE MODAL                                              */}
      {/* ========================================================================= */}
      {isForgotPasswordOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          className="modal-overlay"
          onClick={() => setIsForgotPasswordOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: '440px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FAFAF9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h3 id="forgot-password-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#174D32' }}>
                    Password Assistance
                  </h3>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Balingasag Library Administration
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="btn btn-ghost btn-sm"
                style={{ padding: 6, color: '#94A3B8' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px 22px', fontSize: '13.5px', color: '#475569', lineHeight: 1.6 }}>
              <p style={{ marginTop: 0, marginBottom: '14px' }}>
                To maintain municipal data security, member password resets are handled directly by the <strong>Library Administrator</strong>.
              </p>
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  marginBottom: '14px',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                  Front Desk Contact Information:
                </div>
                <div style={{ color: '#334155', lineHeight: 1.6 }}>
                  • Visit the Balingasag Municipal Library Circulation Desk<br />
                  • Present your Library Card or valid Government Photo ID<br />
                  • Email: <code style={{ backgroundColor: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>admin.arquita@balingasag.gov.ph</code><br />
                  • Municipal Contact: <code style={{ backgroundColor: '#E2E8F0', padding: '1px 5px', borderRadius: '4px' }}>+63 88 123 4567</code>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                The library administrator will verify your patron record and issue a temporary credential.
              </p>
            </div>

            <div
              style={{
                padding: '14px 22px',
                borderTop: '1px solid #E2E8F0',
                backgroundColor: '#FAFAF9',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
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

      {/* ========================================================================= */}
      {/* 6. SIGN IN FEEDBACK MODAL (LOADING SPINNER & WELCOME FEEDBACK)            */}
      {/* ========================================================================= */}
      <SignInFeedbackModal
        status={authFeedbackStatus}
        user={authenticatedUser}
        onWelcomeComplete={handleWelcomeComplete}
      />

      {/* ========================================================================= */}
      {/* 6. RESPONSIVE CSS STYLES                                                  */}
      {/* ========================================================================= */}
      <style>{`
        .login-unified-card {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          width: 100%;
          max-width: 1040px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.25);
          box-sizing: border-box;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .login-card-brand-side {
          background: linear-gradient(155deg, #072214 0%, #0d3820 45%, #166534 100%);
          color: #ffffff;
          padding: clamp(28px, 4.5vh, 44px) clamp(24px, 3.5vw, 40px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 24px;
          position: relative;
          box-sizing: border-box;
        }

        .login-card-form-side {
          background: #ffffff;
          padding: clamp(28px, 4.5vh, 44px) clamp(24px, 3.5vw, 40px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          box-sizing: border-box;
        }

        .login-input-custom:focus {
          outline: none !important;
          border-color: #166534 !important;
          box-shadow: 0 0 0 3px rgba(22, 101, 52, 0.20) !important;
        }

        .login-top-progress {
          height: 100%;
          background: linear-gradient(90deg, #166534, #4ADE80, #166534);
          animation: loginProgressBar 1.5s infinite ease-in-out;
          width: 50%;
        }

        @keyframes loginProgressBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }

        @media (max-width: 940px) {
          .login-unified-card {
            grid-template-columns: 1fr !important;
            max-width: 520px !important;
            margin: 16px auto !important;
          }

          .login-card-brand-side {
            padding: 26px 22px !important;
            gap: 18px !important;
          }

          .login-card-form-side {
            padding: 28px 22px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-top-progress {
            animation: none !important;
          }
          * {
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};
