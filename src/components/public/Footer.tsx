import React from 'react';
import { BookOpen, Globe, Mail, Phone, MapPin, ExternalLink, Heart, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHelp }) => {
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
      aria-label="Site Footer"
      style={{
        backgroundColor: '#0B2D1B',
        color: 'rgba(255, 255, 255, 0.75)',
        padding: '0',
        fontSize: '14px'
      }}
    >
      {/* Main Footer Content */}
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '64px 24px 48px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '48px'
        }}
      >
        {/* Column 1: Brand / About */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #228B22 0%, #174D32 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={20} color="#A7F3D0" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
                Balingasag Municipal
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#A7F3D0', letterSpacing: '0.04em' }}>
                Public Library
              </div>
            </div>
          </div>
          <p style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', marginBottom: '20px', maxWidth: '280px' }}>
            Serving the reading, literacy, and lifelong learning needs of
            Balingasag, Misamis Oriental since the establishment of the
            municipality's public library service.
          </p>
          {/* Social Links */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://www.facebook.com/MunicipalityOfBalingasag"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Municipality of Balingasag Facebook Page"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 139, 34, 0.3)';
                e.currentTarget.style.color = '#A7F3D0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              <Globe size={16} />
            </a>
            <a
              href="mailto:anita.arquita@yahoo.com"
              aria-label="Email the Municipal Librarian"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(34, 139, 34, 0.3)';
                e.currentTarget.style.color = '#A7F3D0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              <Mail size={16} />
            </a>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}
          >
            Quick Links
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Home', target: 'hero' },
              { label: 'About the Library', target: 'about' },
              { label: 'Our Services', target: 'services' },
              { label: 'Programs & Activities', target: 'programs' },
              { label: 'Mission & Vision', target: 'mission-vision' },
              { label: 'Photo Gallery', target: 'gallery' },
              { label: 'Contact Us', target: 'contact' }
            ].map((link, idx) => (
              <a
                key={idx}
                href={`#${link.target}`}
                onClick={(e) => scrollToSection(e, link.target)}
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  transition: 'color 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                {link.label}
              </a>
            ))}

            {onOpenHelp && (
              <button
                type="button"
                onClick={onOpenHelp}
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
                  marginTop: '4px'
                }}
              >
                <HelpCircle size={14} color="#228B22" />
                <span>Help Desk & User Guides</span>
              </button>
            )}
          </div>
        </div>

        {/* Column 3: Contact Info */}
        <div>
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}
          >
            Contact Info
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <MapPin size={15} style={{ marginTop: '3px', flexShrink: 0, color: '#228B22' }} />
              <span style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'rgba(255,255,255,0.6)' }}>
                Municipal Hall Compound, Poblacion,<br />
                Balingasag, Misamis Oriental 9005
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={15} style={{ flexShrink: 0, color: '#228B22' }} />
              <a
                href="tel:+639161535744"
                style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                0916 153 5744
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={15} style={{ flexShrink: 0, color: '#228B22' }} />
              <a
                href="mailto:anita.arquita@yahoo.com"
                style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                anita.arquita@yahoo.com
              </a>
            </div>
          </div>
        </div>

        {/* Column 4: Governance */}
        <div>
          <h4
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#A7F3D0',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '16px'
            }}
          >
            Governance
          </h4>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '16px'
            }}
          >
            The Balingasag Municipal Library operates under the Local Government
            Unit (LGU) of Balingasag and is listed in the National Library of the
            Philippines (NLP) Public Library Directory.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Essential External Portals
            </div>
            {[
              { label: 'National Library of the Philippines', url: 'https://web.nlp.gov.ph' },
              { label: 'DOST STARBOOKS Library', url: 'https://starbooks.ph/' },
              { label: 'LGU Balingasag Portal', url: 'https://balingasag.gov.ph/' },
              { label: 'DepEd Commons OER', url: 'https://commons.deped.gov.ph/' }
            ].map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#A7F3D0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              >
                <ExternalLink size={12} color="#228B22" />
                <span>{p.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '20px 24px',
          maxWidth: '1240px',
          margin: '0 auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.4)' }}>
            © {currentYear} Balingasag Municipal Library, Misamis Oriental, Philippines. All rights reserved.
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.35)'
            }}
          >
            Built with <Heart size={12} color="#EF4444" style={{ margin: '0 2px' }} /> for the community
          </div>
        </div>
      </div>
    </footer>
  );
};
