import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToHomeButtonProps {
  threshold?: number;
}

export const ScrollToHomeButton: React.FC<ScrollToHomeButtonProps> = ({ threshold = 180 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled down past threshold or when an anchor hash is present
      const scrolled = window.scrollY > threshold || (window.location.hash !== '' && window.scrollY > 60);
      setIsVisible(scrolled);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleScroll);
    };
  }, [threshold]);

  const handleScrollToHome = () => {
    const heroElement = document.getElementById('hero');
    if (heroElement) {
      heroElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Clean up URL hash so that the browser treats it as home
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 99,
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(12px)',
        transition: 'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Tooltip on Hover */}
      <div
        id="scroll-to-home-tooltip"
        role="tooltip"
        aria-hidden={!isHovered && !isFocused}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          right: '50%',
          transform: isHovered || isFocused ? 'translateX(50%) translateY(0)' : 'translateX(50%) translateY(4px)',
          opacity: isHovered || isFocused ? 1 : 0,
          pointerEvents: 'none',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 600,
          padding: '6px 12px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
          transition: 'opacity 160ms ease, transform 160ms ease',
          letterSpacing: '0.01em',
        }}
      >
        Go to Home
        {/* Subtle tooltip downward caret */}
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #0f172a',
          }}
        />
      </div>

      {/* Floating Action Button */}
      <button
        type="button"
        id="btn-scroll-to-home"
        onClick={handleScrollToHome}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Go to Home"
        aria-describedby="scroll-to-home-tooltip"
        title="Go to Home"
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: isHovered ? '#14532d' : '#166534',
          color: '#ffffff',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          boxShadow: isHovered
            ? '0 10px 22px rgba(22, 101, 52, 0.45), 0 4px 8px rgba(0, 0, 0, 0.12)'
            : '0 6px 18px rgba(22, 101, 52, 0.35), 0 2px 6px rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          outline: 'none',
          boxSizing: 'border-box',
          transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
          outlineOffset: '2px',
          outlineStyle: isFocused ? 'solid' : 'none',
          outlineColor: '#22c55e',
          outlineWidth: '3px',
          transition: 'background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',
        }}
      >
        <ArrowUp size={24} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
};
