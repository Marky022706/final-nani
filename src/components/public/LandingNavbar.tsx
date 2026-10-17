import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

interface LandingNavbarProps {
  onNavigateToLogin: () => void;
  onOpenVerification?: () => void;
  onOpenHelp?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onNavigateToLogin,
  onOpenVerification,
  onOpenHelp
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 76;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const navLinks = [
    { label: 'Home', target: 'hero' },
    { label: 'About', target: 'about' },
    { label: 'Services', target: 'services' },
    { label: 'Programs & Activities', target: 'programs' },
    { label: 'Mission & Vision', target: 'mission-vision' },
    { label: 'Benefits', target: 'benefits' },
    { label: 'Gallery', target: 'gallery' },
    { label: 'Contact', target: 'contact' },
  ];

  return (
    <nav
      aria-label="Main Navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: `1px solid ${isScrolled ? '#E8F3E8' : 'rgba(232, 243, 232, 0.6)'}`,
        boxShadow: isScrolled ? '0 4px 20px -2px rgba(23, 77, 50, 0.08)' : 'none',
        transition: 'all 0.25s ease'
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '0 24px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        {/* Brand / Logo Emblem */}
        <a
          href="#hero"
          onClick={(e) => scrollToSection(e, 'hero')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#E8F3E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid #228B22',
              flexShrink: 0
            }}
          >
            <img
              src="/balingasag-logo.png"
              alt="Balingasag Municipal Library Emblem"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback to book icon container
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#174D32',
                letterSpacing: '-0.01em',
                lineHeight: 1.2
              }}
            >
              Balingasag Public Library
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#667166',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Misamis Oriental, Philippines
            </div>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '24px'
          }}
          className="desktop-nav-group"
        >
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => scrollToSection(e, link.target)}
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#202820',
                textDecoration: 'none',
                padding: '6px 2px',
                transition: 'color 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#228B22')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#202820')}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Admin Verification Pill Trigger */}
          {onOpenVerification && (
            <button
              onClick={onOpenVerification}
              title="View verification status checklist"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#F5F1E8',
                border: '1px solid #E8F3E8',
                color: '#174D32',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '999px',
                cursor: 'pointer',
                transition: 'background-color 0.15s'
              }}
              className="desktop-verification-btn"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8F3E8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F1E8')}
            >
              <ShieldCheck size={14} style={{ color: '#228B22' }} />
              <span>Verified Data</span>
            </button>
          )}

          {/* Help & Support / Quick Links button */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              aria-label="Open Help Desk and Quick Links"
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#F5F1E8',
                color: '#174D32',
                border: '1px solid #E8F3E8',
                padding: '8px 14px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '44px'
              }}
              className="desktop-verification-btn"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8F3E8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F5F1E8')}
            >
              <HelpCircle size={14} style={{ color: '#228B22' }} />
              <span>Help & Quick Links</span>
            </button>
          )}

          {/* Primary Sign In Button (opens existing login page) */}
          <button
            onClick={onNavigateToLogin}
            aria-label="Sign In to Staff and System Portal"
            style={{
              backgroundColor: '#174D32',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '999px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(23, 77, 50, 0.25)',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
              minHeight: '44px',
              minWidth: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#228B22';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#174D32';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Sign In</span>
            <ArrowRight size={15} />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid #E8F3E8',
              borderRadius: '8px',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              color: '#174D32'
            }}
            className="mobile-hamburger-btn"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid #E8F3E8',
            backgroundColor: '#FFFFFF',
            padding: '20px 24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)'
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              onClick={(e) => scrollToSection(e, link.target)}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#202820',
                textDecoration: 'none',
                padding: '8px 0',
                borderBottom: '1px solid #F5F1E8'
              }}
            >
              {link.label}
            </a>
          ))}

          {onOpenVerification && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenVerification();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#174D32',
                fontSize: '13.5px',
                fontWeight: 600,
                padding: '8px 0',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <ShieldCheck size={16} color="#228B22" />
              <span>Review Content Verification Checklist</span>
            </button>
          )}

          {onOpenHelp && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenHelp();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'none',
                border: 'none',
                color: '#174D32',
                fontSize: '13.5px',
                fontWeight: 600,
                padding: '8px 0',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <HelpCircle size={16} color="#228B22" />
              <span>Help & Support (User Guides & Quick Links)</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onNavigateToLogin();
            }}
            style={{
              backgroundColor: '#174D32',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px',
              minHeight: '44px'
            }}
          >
            <span>Sign In to System</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 960px) {
          .desktop-nav-group {
            display: flex !important;
          }
          .desktop-verification-btn {
            display: inline-flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};
