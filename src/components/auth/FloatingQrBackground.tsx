import React, { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';


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
  const domRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spritesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);
  const frameRef = useRef<number | null>(null);

  // Fixed per-icon config, chosen once so it stays stable across re-renders
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
    const getBounds = () => {
      const container = containerRef.current;
      const w = container?.clientWidth || window.innerWidth || 1400;
      const h = container?.clientHeight || window.innerHeight || 900;
      return { width: Math.max(w, 320), height: Math.max(h, 320) };
    };

    const { width, height } = getBounds();
    spritesRef.current = configs.map(({ size }) => {
      const speed = 1.0 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      return {
        size,
        x: Math.random() * Math.max(width - size, 20),
        y: Math.random() * Math.max(height - size, 20),
        vx: (Math.cos(angle) || 0.7) * speed,
        vy: (Math.sin(angle) || 0.7) * speed,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.2 || 0.5
      };
    });

    const tick = () => {
      const { width, height } = getBounds();
      for (let i = 0; i < spritesRef.current.length; i++) {
        const sprite = spritesRef.current[i];
        const el = domRefs.current[i];
        if (!sprite || !el) continue;

        sprite.x += sprite.vx;
        sprite.y += sprite.vy;
        sprite.rotation += sprite.rotationSpeed;

        const maxX = Math.max(width - sprite.size, 10);
        const maxY = Math.max(height - sprite.size, 10);

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

        el.style.transform = `translate3d(${sprite.x}px, ${sprite.y}px, 0) rotate(${sprite.rotation}deg)`;
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
            domRefs.current[i] = el;
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
