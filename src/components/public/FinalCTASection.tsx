import React from 'react';
import { LogIn, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onNavigateToLogin: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onNavigateToLogin }) => {
  return (
    <section
      id="final-cta"
      aria-label="Start Your Library Journey"
      style={{
        position: 'relative',
        padding: '96px 24px',
        backgroundColor: '#174D32',
        backgroundImage: `
          radial-gradient(ellipse 120% 60% at 50% -10%, rgba(34, 139, 34, 0.35) 0%, transparent 70%),
          radial-gradient(circle at 90% 80%, rgba(34, 139, 34, 0.15) 0%, transparent 50%)
        `,
        overflow: 'hidden'
      }}
    >
      {/* Subtle animated gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-80px',
          width: '380px',
          height: '380px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,139,34,0.12) 0%, transparent 70%)',
          animation: 'ctaOrb 12s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-60px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 60%)',
          animation: 'ctaOrb 14s ease-in-out infinite alternate-reverse',
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Decorative badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '999px',
            padding: '6px 16px',
            marginBottom: '24px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Sparkles size={14} color="#A7F3D0" />
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Join Our Community
          </span>
        </div>

        {/* Main Heading */}
        <h2
          style={{
            fontSize: '42px',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            marginBottom: '20px'
          }}
        >
          Ready to Begin Your<br />
          <span
            style={{
              background: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Learning Journey?
          </span>
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '17px',
            lineHeight: 1.65,
            color: 'rgba(255, 255, 255, 0.75)',
            maxWidth: '600px',
            margin: '0 auto 40px'
          }}
        >
          Access our catalog, borrow books, explore programs, and connect with
          the Balingasag community through the power of reading and education.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Primary: Staff / Admin Login */}
          <button
            onClick={onNavigateToLogin}
            id="cta-staff-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 36px',
              backgroundColor: '#FFFFFF',
              color: '#174D32',
              fontSize: '16px',
              fontWeight: 700,
              borderRadius: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 8px 28px -4px rgba(0, 0, 0, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 36px -4px rgba(0, 0, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 28px -4px rgba(0, 0, 0, 0.25)';
            }}
          >
            <LogIn size={20} />
            Staff Login
            <ArrowRight size={16} />
          </button>

          {/* Secondary: Explore Catalog */}
          <button
            onClick={() => {
              const servicesEl = document.getElementById('services');
              if (servicesEl) {
                const navOffset = 76;
                const elementPosition = servicesEl.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navOffset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
              }
            }}
            id="cta-explore-catalog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '14px',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <BookOpen size={18} />
            Explore Our Services
          </button>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            marginTop: '60px',
            flexWrap: 'wrap'
          }}
        >
          {[
            { value: '5,000+', label: 'Books Available' },
            { value: '1,200+', label: 'Active Members' },
            { value: '30+', label: 'Years Serving' }
          ].map((stat, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#A7F3D0',
                  letterSpacing: '-0.02em',
                  marginBottom: '4px'
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
