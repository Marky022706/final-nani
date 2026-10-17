import React from 'react';

export const GallerySection: React.FC = () => {
  const galleryItems = [
    {
      src: '/balingasag-library-bg.jpg',
      alt: 'Balingasag Municipal Library reading area and study desks',
      title: 'Reading & Study Room',
      category: 'Library Interior',
      attribution: 'Municipality of Balingasag'
    },
    {
      src: '/library-books-corner.png',
      alt: 'Physical collection shelves and cataloged reference books',
      title: 'Cataloged Book Shelves',
      category: 'Collections',
      attribution: 'Balingasag Municipal Library'
    },
    {
      src: '/login-books.jpg',
      alt: 'Student reference textbooks and educational reading material',
      title: 'Academic References',
      category: 'Educational Resources',
      attribution: 'Library Reading Resource'
    },
  ];

  return (
    <section
      id="gallery"
      aria-label="Photo Gallery"
      style={{
        padding: '72px 24px',
        backgroundColor: '#F5F1E8',
        borderBottom: '1px solid #E8F3E8'
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 48px' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#228B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px'
            }}
          >
            Visual Glimpse
          </div>
          <h2
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#174D32',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              marginBottom: '14px'
            }}
          >
            Inside Our Community Library
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            A visual overview of the learning spaces, physical book collections, and quiet reading environment in Balingasag.
          </p>
        </div>

        {/* 3-Column Responsive Image Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px'
          }}
        >
          {galleryItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #E8F3E8',
                boxShadow: '0 4px 16px -2px rgba(23, 77, 50, 0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(23, 77, 50, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(23, 77, 50, 0.06)';
              }}
            >
              <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                <img
                  src={item.src}
                  alt={item.alt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/balingasag-library-bg.jpg';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(23, 77, 50, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px'
                  }}
                >
                  {item.category}
                </span>
              </div>
              <div style={{ padding: '18px 20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', margin: '0 0 6px' }}>
                  {item.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#667166' }}>
                  Photo Source: {item.attribution}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
