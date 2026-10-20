import React, { useEffect, useRef, useState } from 'react';

interface ScrollFadeProps {
  children: React.ReactNode;
  threshold?: number;
  direction?: 'up' | 'down' | 'none';
  delay?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollFade: React.FC<ScrollFadeProps> = ({
  children,
  threshold = 0.08,
  direction = 'up',
  delay = 0,
  duration = 450,
  className = '',
  style = {},
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = domRef.current;
    if (!current) return;

    // Immediately display elements already within or near the initial viewport
    // so sections never get stuck hidden waiting for a window resize or scratchpad interaction
    const checkInitialVisibility = () => {
      const rect = current.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      if (rect.top < vh && rect.bottom > 0) {
        setIsVisible(true);
      }
    };
    checkInitialVisibility();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Smooth bidirectional fade in when scrolling into view, and fade out when leaving
          setIsVisible(entry.isIntersecting);
        });
      },
      {
        threshold: [0, threshold, 0.1],
        rootMargin: '30px 0px 30px 0px',
      }
    );

    observer.observe(current);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getYOffset = () => {
    if (direction === 'up') return '24px';
    if (direction === 'down') return '-24px';
    return '0px';
  };

  return (
    <div
      ref={domRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : `translateY(${getYOffset()})`,
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
