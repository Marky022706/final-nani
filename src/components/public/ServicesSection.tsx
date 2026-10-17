import React from 'react';
import { BookOpen, Library, Search, GraduationCap, Users2, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ServicesSectionProps {
  onNavigateToLogin?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigateToLogin }) => {
  const services = [
    {
      id: 'reading-learning',
      icon: BookOpen,
      title: 'Reading & Learning Space',
      badge: 'On-Site Service',
      description:
        'A quiet, comfortable environment dedicated to reading, textbook review, and independent self-study for learners of all ages.',
      actionText: 'Visit Reading Area',
      actionType: 'scroll',
      actionTarget: 'contact',
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
      actionTarget: 'contact',
    },
    {
      id: 'research-info',
      icon: Search,
      title: 'Research & Information',
      badge: 'Staff Assisted',
      description:
        'Guidance from library personnel in locating reference materials, government records, and educational resources for academic projects.',
      actionText: 'Ask Librarian',
      actionType: 'scroll',
      actionTarget: 'contact',
    },
    {
      id: 'student-support',
      icon: GraduationCap,
      title: 'Student Learning Support',
      badge: 'Youth & Academia',
      description:
        'Supplementary learning resources and a safe study haven designed to support primary, junior, and senior high school students in Balingasag.',
      actionText: 'Student Guidelines',
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
      title: 'Library System Access',
      badge: 'Staff & Admin Portal',
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
            Public Services & Facilities
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
            Serving the Readers of Balingasag
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Discover the verified services, collections, and educational facilities available to all municipal residents and visitors.
          </p>
        </div>

        {/* Services 3x2 Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}
        >
          {services.map((svc) => {
            const Icon = svc.icon;
            const isSystemPortal = svc.id === 'system-access';

            return (
              <div
                key={svc.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: isSystemPortal ? '2px solid #228B22' : '1px solid #E8F3E8',
                  padding: '28px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px -2px rgba(23, 77, 50, 0.05)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}
                className="service-card"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(23, 77, 50, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(23, 77, 50, 0.05)';
                }}
              >
                <div>
                  {/* Top Icon & Badge Row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '18px'
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#E8F3E8',
                        color: '#174D32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backgroundColor: isSystemPortal ? '#DCFCE7' : '#F5F1E8',
                        color: isSystemPortal ? '#14532D' : '#667166'
                      }}
                    >
                      {svc.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#174D32',
                      marginBottom: '10px'
                    }}
                  >
                    {svc.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#202820',
                      marginBottom: '20px'
                    }}
                  >
                    {svc.description}
                  </p>
                </div>

                {/* Card Action Link */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid #F5F1E8' }}>
                  <button
                    onClick={(e) => handleAction(e, svc)}
                    aria-label={`${svc.actionText} for ${svc.title}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#228B22',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: 0,
                      transition: 'gap 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#174D32';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#228B22';
                    }}
                  >
                    <span>{svc.actionText}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Factual Disclaimer Notice */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #E8F3E8',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#667166',
            fontSize: '12.5px',
            lineHeight: 1.5
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#228B22', flexShrink: 0 }} />
          <span>
            <strong>Service Accuracy Notice:</strong> Physical services and reading access are provided on-site at the Municipal Hall Compound, Poblacion. Digital cataloging and circulation are managed internally by designated staff.
          </span>
        </div>
      </div>
    </section>
  );
};
