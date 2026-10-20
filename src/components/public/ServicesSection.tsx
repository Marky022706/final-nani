import React from 'react';
import { BookOpen, Library, Search, GraduationCap, Users2, ShieldCheck, ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
  onNavigateToLogin?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigateToLogin }) => {
  const services = [
    {
      id: 'reading-learning',
      icon: BookOpen,
      title: 'Reading & Study Space',
      badge: 'On-Site Facility',
      description:
        'A quiet, comfortable environment dedicated to reading, textbook review, and independent self-study for learners of all ages.',
      actionText: 'Visitor Guidelines',
      actionType: 'scroll',
      actionTarget: 'visit',
    },
    {
      id: 'book-collection',
      icon: Library,
      title: 'Physical Book Collection',
      badge: 'Cataloged Volumes',
      description:
        'Access printed reference books, general non-fiction, literature, Filipiniana materials, children’s storybooks, and encyclopedias.',
      actionText: 'Browse In Person',
      actionType: 'scroll',
      actionTarget: 'visit',
    },
    {
      id: 'research-info',
      icon: Search,
      title: 'Research & Learning Support',
      badge: 'Staff Assisted',
      description:
        'Guidance from library personnel in locating reference materials, government records, and educational resources for academic projects.',
      actionText: 'Contact Librarian',
      actionType: 'scroll',
      actionTarget: 'visit',
    },
    {
      id: 'student-support',
      icon: GraduationCap,
      title: 'Student Learning Support',
      badge: 'Youth & Academia',
      description:
        'Supplementary learning resources and a safe study haven designed to support primary, junior, and senior high school students in Balingasag.',
      actionText: 'About Our Support',
      actionType: 'scroll',
      actionTarget: 'about',
    },
    {
      id: 'community-outreach',
      icon: Users2,
      title: 'Community Outreach',
      badge: 'Barangay Partnerships',
      description:
        'Partnership programs bringing storytelling, book donation drives, and reading appreciation days to schools and barangay centers.',
      actionText: 'View Programs',
      actionType: 'scroll',
      actionTarget: 'programs',
    },
    {
      id: 'system-access',
      icon: ShieldCheck,
      title: 'Library System Portal',
      badge: 'Staff & Admin Only',
      description:
        'Modernized internal management portal enabling authorized library staff to catalog books, log attendance, and manage book circulation.',
      actionText: 'Sign In to Portal',
      actionType: 'login',
    },
  ];

  const handleAction = (e: React.MouseEvent, service: typeof services[0]) => {
    e.preventDefault();
    if (service.actionType === 'login') {
      onNavigateToLogin?.();
    } else if (service.actionTarget) {
      const el = document.getElementById(service.actionTarget);
      if (el) {
        const navOffset = 76;
        const pos = el.getBoundingClientRect().top + window.pageYOffset - navOffset;
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      id="services"
      aria-label="Library Services and Public Resources"
      style={{
        padding: '72px 24px',
        backgroundColor: '#F5F1E8',
        borderBottom: '1px solid #E8F3E8',
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
              marginBottom: '8px',
            }}
          >
            What We Offer
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
            Library Services
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Providing essential educational resources, quiet study spaces, and research assistance to the Balingasag community.
          </p>
        </div>

        {/* 6-Card Services Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E8F3E8',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 14px rgba(23, 77, 50, 0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(23, 77, 50, 0.12)';
                  e.currentTarget.style.borderColor = '#228B22';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(23, 77, 50, 0.05)';
                  e.currentTarget.style.borderColor = '#E8F3E8';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        backgroundColor: '#E8F3E8',
                        color: '#174D32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: '#F5F1E8',
                        color: '#174D32',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {service.badge}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#174D32',
                      marginBottom: '10px',
                      lineHeight: 1.3,
                    }}
                  >
                    {service.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14.5px',
                      color: '#667166',
                      lineHeight: 1.6,
                      marginBottom: '20px',
                    }}
                  >
                    {service.description}
                  </p>
                </div>

                <div>
                  <button
                    onClick={(e) => handleAction(e, service)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#228B22',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#174D32')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#228B22')}
                  >
                    <span>{service.actionText}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
