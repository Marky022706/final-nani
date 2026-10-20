import React from 'react';
import { Phone, MapPin, Heart, HelpCircle, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  onOpenHelp?: () => void;
  onOpenVerification?: () => void;
  onNavigateToLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenHelp,
  onOpenVerification,
  onNavigateToLogin,
}) => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 76;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <footer
      id="site-footer"
      aria-label="Site Footer"
      style={{
        position: 'relative',
        zIndex: 50,
        backgroundColor: '#0B2D1B',
        color: 'rgba(255, 255, 255, 0.8)',
        padding: '0',
        fontSize: '14px',
        boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.45)',
        isolation: 'isolate',
      }}
    >
      {/* Main Footer Content */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '64px 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '40px',
        }}
      >
        {/* Column 1: Brand & Institutional Info */}
        <div style={{ maxWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '2px solid #228B22',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                flexShrink: 0,
              }}
            >
              <img
                src="/balingasag-logo.png"
                alt="Balingasag Municipal Library Emblem"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/balingasag-logo.jpg';
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: '15.5px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                Balingasag Public Library
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#A7F3D0', letterSpacing: '0.04em' }}>
                Municipality of Balingasag
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'rgba(255,255,255,0.65)', marginBottom: '18px' }}>
            Serving the reading, literacy, and lifelong learning needs of students and citizens across the 36 barangays of Balingasag, Misamis Oriental.
          </p>
          {/* Quick Contact Line */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)' }}>
              <MapPin size={14} color="#A7F3D0" style={{ flexShrink: 0 }} />
              <span>Municipal Hall Compound, Poblacion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.7)' }}>
              <Phone size={14} color="#A7F3D0" style={{ flexShrink: 0 }} />
              <a href="tel:+639161535744" style={{ color: 'inherit', textDecoration: 'none' }}>0916 153 5744</a>
            </div>
          </div>
        </div>

        {/* Column 2: About the Library */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            About
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Overview & Story', target: 'about' },
              { label: 'History & Community', target: 'about-history' },
              { label: 'Mission & Vision', target: 'mission-vision' },
              { label: 'Learning Benefits', target: 'benefits' },
              { label: 'Photo Gallery', target: 'gallery' },
            ].map((link, idx) => (
              <a
                key={idx}
                href={`#${link.target}`}
                onClick={(e) => scrollToSection(e, link.target)}
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Column 3: Services */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            Services
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Reading & Study Space', target: 'services' },
              { label: 'Physical Book Collection', target: 'services' },
              { label: 'Research & Learning Support', target: 'services' },
              { label: 'Student Learning Support', target: 'services' },
              { label: 'Community Outreach', target: 'services' },
            ].map((link, idx) => (
              <a
                key={idx}
                href={`#${link.target}`}
                onClick={(e) => scrollToSection(e, link.target)}
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Column 4: Visit & Programs */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            Visit Us
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Location & Map', target: 'visit-location' },
              { label: 'Opening Hours', target: 'visit-hours' },
              { label: 'Librarian Contact', target: 'visit-contact' },
              { label: 'Programs & Outreach', target: 'programs' },
              { label: 'Noticeboard', target: 'programs-announcements' },
            ].map((link, idx) => (
              <a
                key={idx}
                href={`#${link.target}`}
                onClick={(e) => scrollToSection(e, link.target)}
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Column 5: Resources & Contact */}
        <div>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px',
            }}
          >
            Resources & Help
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              style={{
                color: 'rgba(255,255,255,0.65)',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontWeight: 500,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
            >
              Frequently Asked Questions
            </a>

            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '13.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                <HelpCircle size={14} color="#228B22" />
                <span>Visitor Guide & Help Desk</span>
              </button>
            )}

            {onOpenVerification && (
              <button
                type="button"
                onClick={onOpenVerification}
                style={{
                  color: 'rgba(255,255,255,0.65)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '13.5px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
              >
                <ShieldCheck size={14} color="#228B22" />
                <span>Verification Checklist</span>
              </button>
            )}

            {onNavigateToLogin && (
              <button
                type="button"
                onClick={onNavigateToLogin}
                style={{
                  color: '#A7F3D0',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <Lock size={13} color="#228B22" />
                <span>Staff Portal Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>



      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#05180E',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)' }}>
            © {currentYear} Balingasag Public Library, Misamis Oriental, Philippines. All rights reserved.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            Built with <Heart size={12} color="#EF4444" style={{ margin: '0 2px' }} /> for the community
          </div>
        </div>
      </div>
    </footer>
  );
};
