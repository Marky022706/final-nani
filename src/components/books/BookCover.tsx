import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverImage?: string | null;
  title: string;
  author?: string;
  aspectRatio?: '2/3' | '3/4' | '1/1' | 'full';
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg' | 'detail';
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverImage,
  title,
  author,
  size = 'md',
  className = '',
  style = {}
}) => {
  const [imageError, setImageError] = useState(false);

  // If image exists and hasn't errored
  const hasValidImage = Boolean(coverImage && coverImage.trim() !== '' && !imageError);

  if (hasValidImage) {
    return (
      <img
        src={coverImage!}
        alt={title}
        onError={() => setImageError(true)}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...style
        }}
        loading="lazy"
      />
    );
  }

  // Elegant procedural hardcover styling fallback
  const isSmall = size === 'sm';
  const isLarge = size === 'lg' || size === 'detail';

  return (
    <div
      className={`procedural-book-cover ${className}`}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0f3e26 0%, #166534 55%, #064e3b 100%)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isSmall ? '6px 4px' : isLarge ? '20px 16px' : '12px 10px',
        color: '#ffffff',
        overflow: 'hidden',
        userSelect: 'none',
        ...style
      }}
    >
      {/* Decorative Book Spine Shadow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: isSmall ? '4px' : '8px',
          background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)',
          zIndex: 1
        }}
      />

      {/* Decorative embossed frame */}
      <div
        style={{
          position: 'absolute',
          top: isSmall ? '3px' : '8px',
          left: isSmall ? '7px' : '14px',
          right: isSmall ? '3px' : '8px',
          bottom: isSmall ? '3px' : '8px',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          borderRadius: '2px',
          pointerEvents: 'none'
        }}
      />

      {/* Top Header / Emblem */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BookOpen size={isSmall ? 10 : isLarge ? 18 : 14} style={{ opacity: 0.85, color: '#86efac' }} />
        <span
          style={{
            fontSize: isSmall ? '7px' : isLarge ? '10px' : '8.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          BPL
        </span>
      </div>

      {/* Middle: Title & Author */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', margin: 'auto 0' }}>
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 700,
            fontSize: isSmall ? '9px' : isLarge ? '15px' : '12px',
            lineHeight: 1.25,
            color: '#f8fafc',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            display: '-webkit-box',
            WebkitLineClamp: isSmall ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {title}
        </div>
        {author && !isSmall && (
          <div
            style={{
              fontSize: isLarge ? '11px' : '9.5px',
              color: 'rgba(255,255,255,0.75)',
              marginTop: '4px',
              fontStyle: 'italic',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {author}
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: isSmall ? '6px' : isLarge ? '9px' : '7.5px',
          color: 'rgba(255,255,255,0.6)',
          textAlign: 'center',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}
      >
        Municipal Library
      </div>
    </div>
  );
};
