import React from 'react';
import { MapPin, Phone, Mail, Clock, Globe, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ContactSection: React.FC = () => {
  return (
    <section
      id="visit"
      aria-label="Visit the Library and Contact Information"
      style={{
        padding: '80px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E8F3E8',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 56px' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#228B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
            }}
          >
            Planning Your Visit
          </div>
          <h2
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#174D32',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              marginBottom: '14px',
            }}
          >
            Visit the Library
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            We welcome all students, researchers, teachers, and community members. Drop by during regular hours or reach out through our verified contact channels below.
          </p>
        </div>

        {/* Contact & Visit Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left: Contact Details & Hours */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Location Card */}
            <div
              id="visit-location"
              style={{
                backgroundColor: '#F5F1E8',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #E8F3E8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                    Library Address & Location
                  </h3>
                  <p style={{ fontSize: '14px', color: '#667166', margin: '4px 0 0', lineHeight: 1.5 }}>
                    Balingasag Municipal Library<br />
                    Municipal Hall Compound, Poblacion<br />
                    Balingasag, Misamis Oriental 9005<br />
                    Philippines
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Methods */}
            <div
              id="visit-contact"
              style={{
                backgroundColor: '#F5F1E8',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #E8F3E8',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', marginBottom: '16px' }}>
                Verified Contact Information
              </h3>

              {/* Librarian Info from NLP Directory */}
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(34, 139, 34, 0.06)',
                  borderRadius: '10px',
                  border: '1px solid rgba(34, 139, 34, 0.12)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#228B22', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Municipal Librarian
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#174D32' }}>
                  Anita L. Arquita
                </div>
                <div style={{ fontSize: '12px', color: '#667166', marginTop: '2px' }}>
                  Source: NLP Public Library Directory (June 2025)
                </div>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#667166', marginBottom: '2px' }}>Mobile Phone</div>
                  <a
                    href="tel:+639161535744"
                    style={{ fontSize: '14.5px', fontWeight: 600, color: '#174D32', textDecoration: 'none' }}
                  >
                    0916 153 5744
                  </a>
                </div>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#228B22',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#667166', marginBottom: '2px' }}>Email Address</div>
                  <a
                    href="mailto:anita.arquita@yahoo.com"
                    style={{ fontSize: '14.5px', fontWeight: 600, color: '#174D32', textDecoration: 'none' }}
                  >
                    anita.arquita@yahoo.com
                  </a>
                </div>
              </div>

              {/* NLP Verification Note */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#FFF9E6',
                  borderRadius: '8px',
                  border: '1px solid #FDECC8',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '11.5px',
                  color: '#92400E',
                  lineHeight: 1.5,
                }}
              >
                <AlertTriangle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>
                  Official contact details confirmed via National Library of the Philippines public records.
                </span>
              </div>
            </div>

            {/* Operating Hours */}
            <div
              id="visit-hours"
              style={{
                backgroundColor: '#F5F1E8',
                borderRadius: '16px',
                padding: '28px',
                border: '1px solid #E8F3E8',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Clock size={20} color="#228B22" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                  Opening Hours
                </h3>
              </div>

              {/* Schedule Rows */}
              {[
                { day: 'Monday – Friday', time: '8:00 AM – 5:00 PM', status: 'open' },
                { day: 'Saturday & Sunday', time: 'Closed', status: 'closed' },
                { day: 'Public Holidays', time: 'Closed (follows official municipal calendar)', status: 'note' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: idx < 2 ? '1px solid rgba(34, 139, 34, 0.08)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#174D32' }}>
                    {item.day}
                  </span>
                  <span
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: item.status === 'closed' ? '#B91C1C' : item.status === 'note' ? '#92400E' : '#228B22',
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Map Embed, Guidelines & Directions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Map Embed */}
            <div
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid #E8F3E8',
                boxShadow: '0 4px 16px -2px rgba(23, 77, 50, 0.06)',
                aspectRatio: '16/10',
                backgroundColor: '#E8F3E8',
                position: 'relative',
              }}
            >
              <iframe
                title="Balingasag Municipal Library Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3926.0!2d124.773!3d8.577!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sMunicipal+Hall+Balingasag+Misamis+Oriental!5e0!3m2!1sen!2sph!4v1"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  pointerEvents: 'none',
                  zIndex: -1,
                }}
              >
                <Globe size={40} color="#228B22" style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '14px', color: '#667166' }}>
                  Loading interactive map…
                </span>
              </div>
            </div>

            {/* Directions Link */}
            <a
              href="https://www.google.com/maps/search/Municipal+Hall+Balingasag+Misamis+Oriental"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '14px 24px',
                backgroundColor: '#174D32',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 700,
                borderRadius: '12px',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease, transform 0.15s ease',
                boxShadow: '0 4px 12px -2px rgba(23, 77, 50, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0F3D26';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#174D32';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <MapPin size={18} />
              <span>Get Directions on Google Maps</span>
              <ExternalLink size={14} />
            </a>

            {/* Visitor Guidelines Card */}
            <div
              style={{
                backgroundColor: '#FDFBF7',
                borderRadius: '16px',
                border: '1px solid #E8F3E8',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <ShieldCheck size={20} color="#228B22" />
                <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                  Visitor Etiquette & Guidelines
                </h3>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', color: '#667166', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Sign-In on Entry:</strong> Log your name and purpose of visit in the attendance log at the front desk.</li>
                <li><strong>Quiet Study Atmosphere:</strong> Please keep mobile phones on silent mode to ensure a conducive learning environment for everyone.</li>
                <li><strong>Care for Materials:</strong> Handle reference books, historical records, and computers with care. Return reading materials to designated book carts.</li>
                <li><strong>Assistance:</strong> Feel free to ask the municipal librarian or assistant for guidance in finding research topics.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
