import React from 'react';
import { BookOpen, GraduationCap, Globe, Lightbulb, Users } from 'lucide-react';

export const LearningBenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: BookOpen,
      title: 'Cultivating Reading Habits',
      description:
        'Early exposure to books and literature nurtures vocabulary, analytical thought, and a lasting lifelong enjoyment of reading.',
    },
    {
      icon: GraduationCap,
      title: 'Supporting Academic Excellence',
      description:
        'Provides local students with reference volumes, quiet study desks, and curated materials that complement formal classroom curricula.',
    },
    {
      icon: Globe,
      title: 'Equal Access to Knowledge',
      description:
        'Public libraries ensure that every resident, regardless of socio-economic background, has free access to educational and informational resources.',
    },
    {
      icon: Lightbulb,
      title: 'Promoting Lifelong Learning',
      description:
        'Learning extends beyond graduation; our collections enable citizens of all ages to explore new ideas, history, and personal growth.',
    },
    {
      icon: Users,
      title: 'Strengthening Civic Engagement',
      description:
        'As an inclusive municipal institution, the library connects neighbors, promotes civic pride, and preserves local Misamis Oriental heritage.',
    },
  ];

  return (
    <section
      id="benefits"
      aria-label="Reading and Learning Benefits"
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
            The Power of Public Libraries
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
            Why Community Libraries Matter
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Investing in reading and municipal library access creates lasting positive impacts across every barangay in Balingasag.
          </p>
        </div>

        {/* 5-Card Balanced Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}
        >
          {benefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: '#F5F1E8',
                  borderRadius: '16px',
                  border: '1px solid #E8F3E8',
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.15s ease'
                }}
                className="benefit-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8F3E8';
                  e.currentTarget.style.borderColor = '#228B22';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F1E8';
                  e.currentTarget.style.borderColor = '#E8F3E8';
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    color: '#228B22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    marginBottom: '18px'
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: '#174D32',
                    marginBottom: '10px'
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.6,
                    color: '#202820',
                    margin: 0
                  }}
                >
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
