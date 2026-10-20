import React, { useRef } from 'react';
import { Upload, Link2, X, Image as ImageIcon } from 'lucide-react';
import { BookCover } from './BookCover';

interface BookCoverSelectorProps {
  value: string;
  onChange: (url: string) => void;
  title?: string;
  author?: string;
}

const COVER_PRESETS = [
  {
    label: 'Tech & Code',
    url: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
    category: 'tech'
  },
  {
    label: 'Classic Fiction',
    url: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
    category: 'fiction'
  },
  {
    label: 'Science & Math',
    url: 'https://covers.openlibrary.org/b/isbn/9780262033848-L.jpg',
    category: 'science'
  },
  {
    label: 'History & Archive',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=800&auto=format&fit=crop&q=80',
    category: 'history'
  },
  {
    label: 'Engineering & Data',
    url: 'https://covers.openlibrary.org/b/isbn/9781449373320-L.jpg',
    category: 'data'
  },
  {
    label: 'General Literature',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    category: 'general'
  }
];

export const BookCoverSelector: React.FC<BookCoverSelectorProps> = ({
  value,
  onChange,
  title = 'Untitled Book',
  author = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-subtle, #f8fafc)',
        border: '1px solid var(--border-color, #e2e8f0)',
        borderRadius: 'var(--radius-md, 8px)',
        padding: '16px',
        marginBottom: '18px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={16} color="var(--brand-forest, #166534)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
            Book Cover Image
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '11.5px', color: '#dc2626', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <X size={13} />
            <span>Remove Cover</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '84px 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Cover Preview Box */}
        <div
          style={{
            width: '84px',
            height: '116px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid var(--border-color, #cbd5e1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            backgroundColor: '#0f2d1f',
            flexShrink: 0
          }}
        >
          <BookCover
            coverImage={value}
            title={title || 'Book Title'}
            author={author}
            size="sm"
          />
        </div>

        {/* Input Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* URL Input */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Link2
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted, #94a3b8)'
                }}
              />
              <input
                type="url"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '12.5px', height: '36px' }}
                placeholder="Paste web image URL (e.g. Open Library, Unsplash, Google Books)..."
                value={value.startsWith('data:') ? 'Local uploaded file (Image loaded)' : value}
                onChange={(e) => onChange(e.target.value)}
                disabled={value.startsWith('data:')}
              />
            </div>

            {/* Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              style={{
                height: '36px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 12px'
              }}
            >
              <Upload size={14} />
              <span>Browse Image</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginBottom: '5px' }}>
              Quick Presets / Curated Covers:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COVER_PRESETS.map((p) => {
                const isSelected = value === p.url;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => onChange(p.url)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: isSelected ? '1px solid var(--brand-forest, #166534)' : '1px solid var(--border-color, #cbd5e1)',
                      backgroundColor: isSelected ? 'rgba(22, 101, 52, 0.08)' : '#ffffff',
                      color: isSelected ? 'var(--brand-forest, #166534)' : 'var(--text-secondary, #475569)',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
