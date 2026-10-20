import React from 'react';
import { MapPin, Clock, ShieldCheck, BookOpen } from 'lucide-react';

export const VisitorQuickInfoSection: React.FC = () => {
  const quickDetails = [
    {
      icon: MapPin,
      title: 'Location',
      value: 'Municipal Hall Compound',
      subtext: 'Poblacion, Balingasag, Misamis Oriental',
      target: 'visit',
    },
    {
      icon: Clock,
      title: 'Opening Hours',
      value: 'Mon – Fri: 8:00 AM – 5:00 PM',
      subtext: 'Closed weekends and official holidays',
      target: 'visit',
    },
    {
      icon: ShieldCheck,
      title: 'Free Admission',
      value: 'Open to All Readers',
      subtext: 'Students, researchers, educators, and citizens',
      target: 'about',
    },
    {
      icon: BookOpen,
      title: 'Facilities & Resources',
      value: 'Quiet Study & Books',
      subtext: 'Reference volumes, storybooks, and study desks',
      target: 'services',
    },
  ];

  const handleScroll = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      const navOffset = 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      aria-label="Quick Visitor Information"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E8F3E8',
        padding: '36px 24px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          {quickDetails.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                onClick={() => handleScroll(item.target)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleScroll(item.target);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 18px',
                  backgroundColor: '#FDFBF7',
                  borderRadius: '12px',
                  border: '1px solid #E8F3E8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8F3E8';
                  e.currentTarget.style.borderColor = '#228B22';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FDFBF7';
                  e.currentTarget.style.borderColor = '#E8F3E8';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    backgroundColor: '#E8F3E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#174D32',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#228B22',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '2px',
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#174D32',
                      lineHeight: 1.3,
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#667166',
                      marginTop: '3px',
                      lineHeight: 1.4,
                    }}
                  >
                    {item.subtext}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
