import React from 'react';
import { MapPin, Users, HeartHandshake } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      aria-label="About Balingasag Public Library"
      style={{
        padding: '72px 24px',
        backgroundColor: '#FFFFFF',
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
            About the Library
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
            Knowledge for Every Generation
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            The Balingasag Municipal Library serves as an educational and cultural cornerstone for the municipality of Balingasag, Misamis Oriental.
          </p>
        </div>

        {/* Two-Column Story Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'center'
          }}
          className="about-grid"
        >
          {/* Authentic Imagery Card */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 16px 32px -8px rgba(23, 77, 50, 0.15)',
                border: '1px solid #E8F3E8'
              }}
            >
              <img
                src="/library-books-corner.png"
                alt="Balingasag Municipal Library book collection shelves"
                style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/balingasag-library-bg.jpg';
                }}
              />
            </div>

            {/* Quick Fact Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '24px',
                backgroundColor: '#F5F1E8',
                border: '1px solid #E8F3E8',
                borderRadius: '12px',
                padding: '14px 20px',
                boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                maxWidth: '260px'
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#174D32', textTransform: 'uppercase' }}>
                Affiliation
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#202820', marginTop: '2px' }}>
                National Library of the Philippines Affiliated Public Library
              </div>
            </div>
          </div>

          {/* Text Story & Pillars */}
          <div>
            <h3
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: '#174D32',
                marginBottom: '16px'
              }}
            >
              Fostering Literacy Across 36 Barangays
            </h3>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: '#202820',
                marginBottom: '16px'
              }}
            >
              Established under the Local Government Unit of Balingasag, the library provides a safe, peaceful, and resource-rich environment where elementary, secondary, and college students, educators, and citizens can discover books, study quietly, and conduct research.
            </p>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.65,
                color: '#667166',
                marginBottom: '28px'
              }}
            >
              Operating in close coordination with provincial library programs in Misamis Oriental and national reading initiatives, the facility champions reading habits, basic literacy development, and community learning outreach.
            </p>

            {/* 3 Value Points */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#202820' }}>
                    Central Municipal Location
                  </div>
                  <div style={{ fontSize: '13px', color: '#667166', marginTop: '2px' }}>
                    Conveniently situated at the Municipal Hall compound in Poblacion, accessible to students and community members.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0
                  }}
                >
                  <Users size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#202820' }}>
                    Inclusive Community Access
                  </div>
                  <div style={{ fontSize: '13px', color: '#667166', marginTop: '2px' }}>
                    Open to learners of all ages, with specialized support for local children, youth, and independent researchers.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0
                  }}
                >
                  <HeartHandshake size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#202820' }}>
                    Educational & Academic Outreach
                  </div>
                  <div style={{ fontSize: '13px', color: '#667166', marginTop: '2px' }}>
                    Collaborates with local schools, universities, and regional institutions to promote community-wide reading advocacy.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .about-grid {
            grid-template-columns: 1fr 1.1fr !important;
            gap: 56px !important;
          }
        }
      `}</style>
    </section>
  );
};
