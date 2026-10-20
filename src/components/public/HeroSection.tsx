import React from 'react';
import { ArrowDown, Calendar, BookOpen, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const scrollToSection = (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const quickDetails = [
    {
      icon: MapPin,
      title: 'Location',
      value: 'Municipal Hall Compound',
      subtext: 'Poblacion, Balingasag, Misamis Oriental',
      target: 'visit',
    },
    {
      icon: Clock,
      title: 'Opening Hours',
      value: 'Mon – Fri: 8:00 AM – 5:00 PM',
      subtext: 'Closed weekends and official holidays',
      target: 'visit-hours',
    },
    {
      icon: ShieldCheck,
      title: 'Free Admission',
      value: 'Open to All Readers',
      subtext: 'Students, researchers, educators, and citizens',
      target: 'about',
    },
    {
      icon: BookOpen,
      title: 'Facilities & Resources',
      value: 'Quiet Study & Books',
      subtext: 'Reference volumes, storybooks, and study desks',
      target: 'services',
    },
  ];

  return (
    <section
      id="hero"
      aria-label="Welcome to Balingasag Public Library"
      style={{
        position: 'relative',
        backgroundColor: 'transparent',
        padding: 'clamp(72px, 8.5vh, 108px) 24px clamp(28px, 3.5vh, 44px)',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 76px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flex: 1,
        gap: 'clamp(28px, 3.5vh, 44px)',
        boxSizing: 'border-box',
      }}
    >
      {/* Blurred Photographic Background of Balingasag Public Library */}
      <div
        id="hero-background-image"
        style={{
          position: 'absolute',
          top: '-20px',
          left: '-20px',
          right: '-20px',
          bottom: '-20px',
          backgroundImage: 'url(/balingasag-library-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(5px)',
          transform: 'scale(1.04)',
          opacity: 0.95,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Atmospheric Left-Weighted Gradient Overlay for Crystal Clear Text Contrast */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(7, 30, 18, 0.90) 0%, rgba(11, 45, 27, 0.78) 50%, rgba(15, 61, 38, 0.50) 100%)',
          zIndex: 1,
        }}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        {/* Left-Aligned Hero Message Content (NO WHITE CARD BACKGROUND) */}
        <div
          style={{
            maxWidth: '700px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingTop: 'clamp(28px, 4.5vh, 56px)',
          }}
        >
          {/* Institutional Identification Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.32)',
              borderRadius: '999px',
              padding: '7px 16px',
              marginBottom: '20px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4ADE80',
                boxShadow: '0 0 8px #4ADE80',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#A7F3D0',
                letterSpacing: '0.02em',
              }}
            >
              Municipality of Balingasag • Misamis Oriental
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: '48px',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              marginBottom: '18px',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.5)',
            }}
            className="hero-headline"
          >
            A Place to Read, Learn, and Grow.
          </h1>

          {/* Supporting Text */}
          <p
            style={{
              fontSize: '17.5px',
              lineHeight: 1.65,
              color: 'rgba(255, 255, 255, 0.92)',
              marginBottom: '32px',
              maxWidth: '620px',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.45)',
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
              marginBottom: '36px',
            }}
          >
            {/* Primary CTA */}
            <a
              href="#services"
              onClick={(e) => scrollToSection(e, 'services')}
              aria-label="Explore Library Services"
              style={{
                backgroundColor: '#228B22',
                color: '#FFFFFF',
                border: 'none',
                padding: '13px 28px',
                borderRadius: '999px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.15s ease',
                minHeight: '46px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#166534';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#228B22';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Explore Library Services</span>
              <ArrowDown size={16} />
            </a>

            {/* Secondary CTA */}
            <a
              href="#visit"
              onClick={(e) => scrollToSection(e, 'visit')}
              aria-label="Plan Your Visit to Balingasag Public Library"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                color: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.65)',
                padding: '12px 26px',
                borderRadius: '999px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.15s ease',
                minHeight: '46px',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Calendar size={16} />
              <span>Plan Your Visit</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4 Quick Visitor Information Cards directly on the blurred background */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          maxWidth: '1240px',
          width: '100%',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
        }}
      >
        {quickDetails.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              onClick={(e) => scrollToSection(e, item.target)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  scrollToSection(e as unknown as React.MouseEvent, item.target);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px 18px',
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.22)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#228B22';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 16px 32px -6px rgba(0, 0, 0, 0.32)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.94)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.85)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 24px -6px rgba(0, 0, 0, 0.22)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: '#E8F3E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#174D32',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: '#228B22',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '2px',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 700,
                    color: '#174D32',
                    lineHeight: 1.3,
                  }}
                >
                  {item.value}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#667166',
                    marginTop: '3px',
                    lineHeight: 1.4,
                  }}
                >
                  {item.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media (min-width: 900px) {
          .hero-headline {
            font-size: 52px !important;
          }
        }
      `}</style>
    </section>
  );
};
