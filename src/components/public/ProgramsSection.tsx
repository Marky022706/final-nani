import React from 'react';
import { BookOpenCheck } from 'lucide-react';

export const ProgramsSection: React.FC = () => {
  const programs = [
    {
      id: 'national-book-week',
      title: 'National Book Week & Reading Celebrations',
      partner: 'National Library of the Philippines Affiliated Network',
      badge: 'Annual Campaign',
      description:
        'Participating in nationwide public library campaigns to inspire a love of reading, encourage youth literacy, and foster community-wide appreciation for literature.',
      highlight: 'Promoting reading culture in elementary and secondary schools across Balingasag.',
      image: '/balingasag-library-bg.jpg',
      alt: 'Balingasag Municipal Library reading books celebration',
    },
    {
      id: 'academic-extension',
      title: 'Academic & University Extension Outreach',
      partner: 'Liceo de Cagayan University & Regional Extension Partners',
      badge: 'Educational Extension',
      description:
        'Collaborative community learning initiatives including book donation drives, storytelling workshops, and library organizational enrichment for rural barangays.',
      highlight: 'Strengthening resource collections through accredited university community extensions.',
      image: '/library-books-corner.png',
      alt: 'Library book donation and cataloging collection',
    },
    {
      id: 'local-institute-engagement',
      title: 'Youth & Science Literacy Engagements',
      partner: 'MOIST (Misamis Oriental Institute of Science and Technology)',
      badge: 'Local Community Partnership',
      description:
        'Local community-based literacy advocacy and knowledge sharing conducted in partnership with higher learning institutes based in Balingasag.',
      highlight: 'Bridging science, foundational reading, and technical education for municipal youth.',
      image: '/login-books.jpg',
      alt: 'Books and reference materials for students',
    },
    {
      id: 'provincial-library-network',
      title: 'Provincial Library Resource Coordination',
      partner: 'Misamis Oriental Provincial Library Network',
      badge: 'Provincial Alignment',
      description:
        'Coordinated inter-library alignment with the Provincial Government of Misamis Oriental to update municipal reference materials and maintain public library standards.',
      highlight: 'Ensuring public access to updated government publications and regional archives.',
      image: '/balingasag-library-bg.jpg',
      alt: 'Municipal library study environment',
    },
  ];

  return (
    <section
      id="programs"
      aria-label="Community Outreach and Programs"
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
            Community Outreach & Initiatives
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
            Learning Beyond the Bookshelves
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Extending literacy, education, and knowledge through verified institutional partnerships and active community engagements.
          </p>
        </div>

        {/* 2x2 Programs Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px'
          }}
        >
          {programs.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '18px',
                border: '1px solid #E8F3E8',
                overflow: 'hidden',
                boxShadow: '0 4px 16px -2px rgba(23, 77, 50, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
              className="program-card"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(23, 77, 50, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(23, 77, 50, 0.06)';
              }}
            >
              {/* Image Banner */}
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={item.image}
                  alt={item.alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/balingasag-library-bg.jpg';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(23, 77, 50, 0.9)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px'
                  }}
                >
                  {item.badge}
                </div>
              </div>

              {/* Content Body */}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#228B22', marginBottom: '6px' }}>
                    {item.partner}
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#174D32',
                      marginBottom: '10px',
                      lineHeight: 1.3
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#202820',
                      marginBottom: '16px'
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#E8F3E8',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '12.5px',
                    color: '#174D32',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600
                  }}
                >
                  <BookOpenCheck size={16} style={{ flexShrink: 0 }} />
                  <span>{item.highlight}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
