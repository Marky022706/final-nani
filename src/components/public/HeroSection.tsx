import React from 'react';
import { ArrowDown, LogIn, BookOpen, Compass, Award } from 'lucide-react';

interface HeroSectionProps {
  onNavigateToLogin: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateToLogin }) => {
  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    const servicesEl = document.getElementById('services');
    if (servicesEl) {
      const navOffset = 76;
      const elementPosition = servicesEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section
      id="hero"
      aria-label="Welcome to Balingasag Public Library"
      style={{
        position: 'relative',
        backgroundColor: '#F5F1E8',
        backgroundImage: 'linear-gradient(180deg, #F5F1E8 0%, #FFFFFF 100%)',
        padding: '56px 24px 72px',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '48px',
          alignItems: 'center'
        }}
        className="hero-grid"
      >
        {/* Left Content Column */}
        <div>
          {/* Institutional Identification Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#E8F3E8',
              border: '1px solid rgba(34, 139, 34, 0.25)',
              borderRadius: '999px',
              padding: '6px 14px',
              marginBottom: '20px'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#228B22'
              }}
            />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#174D32',
                letterSpacing: '0.02em'
              }}
            >
              Municipality of Balingasag • Misamis Oriental
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: '44px',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#174D32',
              letterSpacing: '-0.025em',
              marginBottom: '18px'
            }}
            className="hero-headline"
          >
            A Place to Read, Learn, and Grow.
          </h1>

          {/* Supporting Text */}
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: '#202820',
              marginBottom: '32px',
              maxWidth: '560px'
            }}
          >
            Discover a welcoming community space for reading, knowledge, research, and lifelong learning in Balingasag, Misamis Oriental.
          </p>

          {/* CTAs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              marginBottom: '40px'
            }}
          >
            {/* Primary CTA */}
            <button
              onClick={scrollToServices}
              aria-label="Explore Library Services"
              style={{
                backgroundColor: '#228B22',
                color: '#FFFFFF',
                border: 'none',
                padding: '13px 26px',
                borderRadius: '999px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(34, 139, 34, 0.28)',
                transition: 'all 0.15s ease',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#174D32';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#228B22';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explore Our Library</span>
              <ArrowDown size={16} />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={onNavigateToLogin}
              aria-label="Sign In to Staff and System Portal"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#174D32',
                border: '1.5px solid #174D32',
                padding: '12px 24px',
                borderRadius: '999px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E8F3E8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          </div>

          {/* Quick Institutional Highlights */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              paddingTop: '20px',
              borderTop: '1px solid #E8F3E8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} style={{ color: '#228B22' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#667166' }}>
                Municipal Hall Compound
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} style={{ color: '#228B22' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#667166' }}>
                Public Reading & Study Space
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: '#228B22' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#667166' }}>
                National Library Affiliate
              </span>
            </div>
          </div>
        </div>

        {/* Right Visual Image Card Column */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(23, 77, 50, 0.22)',
              border: '4px solid #FFFFFF',
              position: 'relative',
              backgroundColor: '#174D32',
              maxHeight: '440px'
            }}
          >
            <img
              src="/balingasag-library-bg.jpg"
              alt="Balingasag Municipal Library reading area and book collections"
              style={{
                width: '100%',
                height: '440px',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                // Fallback to library-books-corner.png if banner unavailable
                (e.currentTarget as HTMLImageElement).src = '/library-books-corner.png';
              }}
            />

            {/* Subtle Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, transparent 60%, rgba(23, 77, 50, 0.85) 100%)'
              }}
            />

            {/* Image Caption Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '16px',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 600,
                textShadow: '0 1px 3px rgba(0,0,0,0.6)'
              }}
            >
              Balingasag Municipal Library • Learning space serving the youth and citizens of Balingasag
            </div>
          </div>

          {/* Decorative Corner Foliage / Seal Badge */}
          <div
            style={{
              position: 'absolute',
              top: '-16px',
              right: '-16px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '8px 14px',
              boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
              border: '1px solid #E8F3E8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#228B22'
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#174D32' }}>
              Open to the Public
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1.1fr 0.9fr !important;
          }
          .hero-headline {
            fontSize: 50px !important;
          }
        }
      `}</style>
    </section>
  );
};
