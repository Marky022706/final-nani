import React, { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';

interface Sprite {
  el: HTMLDivElement | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

interface SpriteConfig {
  size: number;
  pulseDuration: number;
  pulseDelay: number;
  scanDuration: number;
  scanDelay: number;
}

interface FloatingQrBackgroundProps {
  /** Number of QR icons drifting across the background. */
  count?: number;
}

/**
 * Decorative full-bleed layer of QR-code icons that drift around and bounce
 * off the edges of the screen (DVD-logo style), each also animated in place
 * with a pulsing glow and a sweeping "scan line" so they read as actively
 * scanning rather than just static glyphs sliding around. Sits behind the
 * login card and never intercepts clicks.
 */
export const FloatingQrBackground: React.FC<FloatingQrBackgroundProps> = ({ count = 16 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const spritesRef = useRef<Sprite[]>([]);
  const frameRef = useRef<number | null>(null);

  // Fixed per-icon config, chosen once so it stays stable across re-renders
  // (and so the rendered icon size always matches the size used for the
  // bounce/boundary math - randomizing per-render would desync them).
  const [configs] = useState<SpriteConfig[]>(() =>
    Array.from({ length: count }, () => ({
      size: 28 + Math.random() * 40,
      pulseDuration: 1.6 + Math.random() * 1.4,
      pulseDelay: Math.random() * 2,
      scanDuration: 1.8 + Math.random() * 1.6,
      scanDelay: Math.random() * 2.5
    }))
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const bounds = () => ({
      width: container.clientWidth,
      height: container.clientHeight
    });

    // Initialize each sprite with a random position, velocity and spin.
    const { width, height } = bounds();
    spritesRef.current = configs.map(({ size }, i) => {
      const speed = 1.4 + Math.random() * 1.8;
      const angle = Math.random() * Math.PI * 2;
      return {
        el: spritesRef.current[i]?.el ?? null,
        size,
        x: Math.random() * Math.max(width - size, 1),
        y: Math.random() * Math.max(height - size, 1),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.6
      };
    });

    const applyTransform = (sprite: Sprite) => {
      if (!sprite.el) return;
      sprite.el.style.transform = `translate(${sprite.x}px, ${sprite.y}px) rotate(${sprite.rotation}deg)`;
    };

    if (prefersReducedMotion) {
      // Respect reduced-motion preference: place icons statically, no drift/spin.
      // The CSS pulse/scan animations are separately skipped via a media query.
      spritesRef.current.forEach(applyTransform);
      return;
    }

    const tick = () => {
      const { width, height } = bounds();
      for (const sprite of spritesRef.current) {
        sprite.x += sprite.vx;
        sprite.y += sprite.vy;
        sprite.rotation += sprite.rotationSpeed;

        const maxX = Math.max(width - sprite.size, 0);
        const maxY = Math.max(height - sprite.size, 0);

        // Bounce back off every edge, DVD-logo style.
        if (sprite.x <= 0) {
          sprite.x = 0;
          sprite.vx = Math.abs(sprite.vx);
        } else if (sprite.x >= maxX) {
          sprite.x = maxX;
          sprite.vx = -Math.abs(sprite.vx);
        }

        if (sprite.y <= 0) {
          sprite.y = 0;
          sprite.vy = Math.abs(sprite.vy);
        } else if (sprite.y >= maxY) {
          sprite.y = maxY;
          sprite.vy = -Math.abs(sprite.vy);
        }

        applyTransform(sprite);
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [configs]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {configs.map((config, i) => (
        <div
          key={i}
          ref={(el) => {
            const existing = spritesRef.current[i];
            if (existing) {
              existing.el = el;
            } else {
              spritesRef.current[i] = {
                el,
                x: 0,
                y: 0,
                vx: 0,
                vy: 0,
                size: config.size,
                rotation: 0,
                rotationSpeed: 0
              };
            }
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            willChange: 'transform'
          }}
        >
          {/* Clipped wrapper so the scan line sweeps within the icon's own bounds */}
          <div
            style={{
              position: 'relative',
              width: config.size,
              height: config.size,
              overflow: 'hidden'
            }}
          >
            <QrCode
              size={config.size}
              strokeWidth={1.4}
              className="qr-bg-icon"
              style={{
                color: 'rgba(255, 255, 255, 0.42)',
                animation: `qrPulse ${config.pulseDuration}s ease-in-out ${config.pulseDelay}s infinite`
              }}
            />
            {/* Sweeping scan line, like a QR code actively being read */}
            <div
              className="qr-bg-scanline"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: '20%',
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(134, 239, 172, 0.95) 50%, transparent 100%)',
                animation: `qrScan ${config.scanDuration}s linear ${config.scanDelay}s infinite`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
