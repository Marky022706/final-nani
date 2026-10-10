import React from 'react';
import { BookOpen, UserCheck, Clock, Users, ChevronRight, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister?: () => void;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  onNavigateToRegister,
  isMaintenanceMode = false,
  maintenanceMessage
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        color: '#1e293b'
      }}
    >
      {/* Maintenance Announcement Banner if Active */}
      {isMaintenanceMode && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            borderBottom: '1px solid #fde68a',
            color: '#92400e',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>⚠️ Scheduled System Maintenance:</span>
          <span>{maintenanceMessage || 'Borrowing and reservation services are temporarily paused while maintenance is conducted.'}</span>
        </div>
      )}

      {/* Top Navbar Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 48px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/balingasag-logo.png"
            alt="Balingasag Municipal Library"
            style={{ width: '42px', height: '42px', objectFit: 'contain' }}
            onError={(e) => {
              // Fallback to /logo.png if balingasag-logo not available
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: '15px',
              letterSpacing: '0.04em',
              color: '#166534',
              textTransform: 'uppercase'
            }}
          >
            Balingasag Municipal Library
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onNavigateToLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#334155',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '9999px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#166534')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
          >
            Login
          </button>
          <button
            onClick={onNavigateToRegister || onNavigateToLogin}
            style={{
              backgroundColor: '#166534',
              color: '#ffffff',
              border: 'none',
              fontWeight: 600,
              fontSize: '14px',
              padding: '9px 22px',
              borderRadius: '9999px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)',
              transition: 'background-color 0.15s ease, transform 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#14532d';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#166534';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main style={{ flex: 1, maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '48px 32px 64px' }}>
        {/* Hero Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 420px) 1fr',
            gap: '64px',
            alignItems: 'center',
            marginBottom: '64px'
          }}
        >
          {/* Hero Seal Image */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div
              style={{
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(22,101,52,0.08) 0%, rgba(255,255,255,0) 70%)',
                padding: '16px'
              }}
            >
              <img
                src="/balingasag-logo.png"
                alt="Balingasag Municipal Library Seal 1991"
                style={{
                  width: '280px',
                  height: '280px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 12px 24px rgba(22, 101, 52, 0.18))'
                }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </div>
          </div>

          {/* Hero Text Content */}
          <div style={{ maxWidth: '620px' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#475569',
                marginBottom: '8px'
              }}
            >
              Welcome to
            </div>
            <h1
              style={{
                fontSize: '46px',
                lineHeight: 1.15,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '18px'
              }}
            >
              Balingasag Municipal Library
            </h1>
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#475569',
                marginBottom: '28px'
              }}
            >
              Your gateway to knowledge and learning. Browse thousands of books, manage your borrowing, and explore our digital catalog.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={onNavigateToRegister || onNavigateToLogin}
                style={{
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '15px',
                  padding: '12px 28px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(22, 101, 52, 0.28)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#14532d';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#166534';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span>Get Started</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onNavigateToLogin}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#166534',
                  border: '1.5px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: '15px',
                  padding: '12px 26px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#166534';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                Member Login
              </button>
            </div>
          </div>
        </div>

        {/* 4 Feature Highlights Grid */}
        <section aria-label="Library Features" style={{ marginBottom: '64px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Card 1 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <BookOpen size={22} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Vast Collection
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Access thousands of books across various genres and categories
              </p>
            </div>

            {/* Card 2 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <UserCheck size={22} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Easy Management
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Track your borrowed books, reservations, and due dates online
              </p>
            </div>

            {/* Card 3 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <Clock size={22} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                24/7 Access
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Browse and reserve books anytime, anywhere
              </p>
            </div>

            {/* Card 4 */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '28px 24px',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <Users size={22} />
              </div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                Community Hub
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
                Serving Balingasag with quality literature and resources
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section aria-label="How It Works" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: '36px'
            }}
          >
            How It Works
          </h2>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              maxWidth: '960px',
              margin: '0 auto'
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                flex: '1 1 240px',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)'
                }}
              >
                1
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Create Account
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
                Sign up with your details to become a library member
              </div>
            </div>

            {/* Chevron Divider */}
            <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={28} />
            </div>

            {/* Step 2 */}
            <div
              style={{
                flex: '1 1 240px',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)'
                }}
              >
                2
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Browse & Borrow
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
                Search our catalog and borrow books online or in person
              </div>
            </div>

            {/* Chevron Divider */}
            <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }}>
              <ChevronRight size={28} />
            </div>

            {/* Step 3 */}
            <div
              style={{
                flex: '1 1 240px',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#166534',
                  color: '#ffffff',
                  fontSize: '20px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  boxShadow: '0 4px 10px rgba(22, 101, 52, 0.25)'
                }}
              >
                3
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Return on Time
              </div>
              <div style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.5 }}>
                Keep track of due dates and return books to avoid fines
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Full-Width Footer */}
      <footer
        style={{
          backgroundColor: '#166534',
          color: '#ffffff',
          textAlign: 'center',
          padding: '18px 24px',
          fontSize: '13.5px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          marginTop: 'auto'
        }}
      >
        © 2026 Balingasag Municipal Library, Misamis Oriental. All rights reserved.
      </footer>
    </div>
  );
};
