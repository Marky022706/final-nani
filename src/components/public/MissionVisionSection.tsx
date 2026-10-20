import React from 'react';
import {
  Target,
  Compass,
  Building2,
  BookOpen,
  Users2,
  Leaf,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Database,
  HeartHandshake,
  Laptop,
  MessageSquare,
} from 'lucide-react';

interface MissionVisionSectionProps {
  onOpenVerification?: () => void;
}

export const MissionVisionSection: React.FC<MissionVisionSectionProps> = ({ onOpenVerification }) => {
  const goals = [
    {
      num: '01',
      title: 'Enhance Access to Information',
      description:
        'Provide inclusive and up-to-date library services to support lifelong learning, research, and literacy.',
      icon: BookOpen,
      tag: 'Lifelong Learning',
    },
    {
      num: '02',
      title: 'Promote Community Engagement',
      description:
        'Foster a culture of learning, innovation, and collaboration through partnerships with government and non-government organizations.',
      icon: Users2,
      tag: 'Collaboration',
    },
    {
      num: '03',
      title: 'Support Sustainable Development',
      description:
        'Align library programs with the municipality’s goal of becoming an agri-industrial and eco-tourism center while maintaining environmental responsibility.',
      icon: Leaf,
      tag: 'Sustainability',
    },
    {
      num: '04',
      title: 'Empower Citizens',
      description:
        'Equip individuals from all walks of life with knowledge and skills that contribute to an informed, engaged, and progressive society.',
      icon: GraduationCap,
      tag: 'Citizen Empowerment',
    },
    {
      num: '05',
      title: 'Strengthen Institutional Capacity',
      description:
        'Enhance library facilities, resources, and staff development to provide excellent and efficient services.',
      icon: Building2,
      tag: 'Capacity Building',
    },
  ];

  const objectives = [
    {
      num: 1,
      title: 'Ensure Accessibility and Inclusivity',
      description:
        'Expand library services to reach students, professionals, senior citizens, out-of-school youth, and all community members.',
      icon: Users2,
    },
    {
      num: 2,
      title: 'Develop a Strong Resource Collection',
      description:
        'Continuously update books, digital resources, and research materials to meet diverse educational and informational needs.',
      icon: Database,
    },
    {
      num: 3,
      title: 'Promote Literacy and Lifelong Learning',
      description:
        'Organize reading programs, literacy workshops, and research assistance services for all ages.',
      icon: BookOpen,
    },
    {
      num: 4,
      title: 'Build Partnerships for Community Development',
      description:
        'Collaborate with local government, educational institutions, NGOs, and other organizations to strengthen library programs.',
      icon: HeartHandshake,
    },
    {
      num: 5,
      title: 'Integrate Technology in Library Services',
      description:
        'Improve access to digital tools, online databases, and e-learning platforms to modernize information delivery.',
      icon: Laptop,
    },
    {
      num: 6,
      title: 'Support Environmental Awareness',
      description:
        'Advocate for sustainability through eco-friendly initiatives and educational programs related to environmental conservation.',
      icon: Leaf,
    },
    {
      num: 7,
      title: 'Enhance Library Infrastructure',
      description:
        'Upgrade facilities, reading spaces, and technology to create a more conducive learning environment.',
      icon: Building2,
    },
    {
      num: 8,
      title: 'Encourage Civic Participation',
      description:
        'Host forums, discussions, and community engagement activities that empower citizens to actively contribute to local development.',
      icon: MessageSquare,
    },
  ];

  return (
    <section
      id="mission-vision"
      aria-label="Official Mission, Vision, Goals, and Objectives"
      style={{
        padding: '76px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E8F3E8',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 48px' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#228B22',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={16} />
            <span>Official Institutional Framework</span>
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
            Mission, Vision, Goals & Objectives
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166', margin: 0 }}>
            The official guiding mandate of the Balingasag Public Municipal Library, dedicated to empowering every
            citizen through accessible knowledge, inclusive lifelong learning, and sustainable community progress.
          </p>
        </div>

        {/* Part 1: Official Mission & Vision Statements */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '28px',
            marginBottom: '56px',
          }}
        >
          {/* Mission Card */}
          <div
            style={{
              backgroundColor: '#FDFBF7',
              borderRadius: '20px',
              border: '1.5px solid #E8F3E8',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px -4px rgba(23, 77, 50, 0.06)',
              position: 'relative',
            }}
          >
            <div>
              {/* Header Icon & Official Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '22px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#E8F3E8',
                    color: '#174D32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Target size={24} />
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Official Mission Statement</span>
                </span>
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#174D32',
                  marginBottom: '16px',
                }}
              >
                Mission Statement
              </h3>

              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#202820',
                  margin: '0 0 20px',
                  borderLeft: '3px solid #228B22',
                  paddingLeft: '18px',
                  backgroundColor: 'rgba(232, 243, 232, 0.25)',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '0 10px 10px 0',
                }}
              >
                “Guided by the Local Government Unit of Balingasag’s vision for sustainable development, the Public
                Municipal Library is dedicated to providing inclusive access to knowledge, research, and lifelong
                learning. Through strong partnerships with government agencies, non-government organizations, and
                community groups, we empower individuals from all walks of life with quality information and resources.
                Committed to excellence, we foster education, innovation, and engagement to support the community’s
                growth and progress.”
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#667166',
                paddingTop: '16px',
                borderTop: '1px solid rgba(23, 77, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Building2 size={14} style={{ color: '#228B22', flexShrink: 0 }} />
              <span>Adopted Mandate • Local Government Unit of Balingasag, Misamis Oriental</span>
            </div>
          </div>

          {/* Vision Card */}
          <div
            style={{
              backgroundColor: '#FDFBF7',
              borderRadius: '20px',
              border: '1.5px solid #E8F3E8',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px -4px rgba(23, 77, 50, 0.06)',
              position: 'relative',
            }}
          >
            <div>
              {/* Header Icon & Official Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '22px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#E8F3E8',
                    color: '#174D32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Compass size={24} />
                </div>

                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: '#DCFCE7',
                    color: '#166534',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Official Vision Statement</span>
                </span>
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#174D32',
                  marginBottom: '16px',
                }}
              >
                Vision Statement
              </h3>

              <div
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: '#202820',
                  margin: '0 0 20px',
                  borderLeft: '3px solid #228B22',
                  paddingLeft: '18px',
                  backgroundColor: 'rgba(232, 243, 232, 0.25)',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '0 10px 10px 0',
                }}
              >
                “Inspired with Balingasag’s vision of a thriving agri-industrial and eco-tourism municipality with a
                strong economy, a safe and sustainable environment, and an empowered, God-centered citizenry, the Public
                Municipal Library aspires to be a dynamic and inclusive knowledge hub. Through accessible, innovative,
                and high-quality services, we foster lifelong learning, research, and literacy-empowering individuals
                to contribute to a well-informed, engaged, and progressive community.”
              </div>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#667166',
                paddingTop: '16px',
                borderTop: '1px solid rgba(23, 77, 50, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Sparkles size={14} style={{ color: '#228B22', flexShrink: 0 }} />
              <span>Civic Aspiration • Agri-Industrial & Eco-Tourism Center of Excellence</span>
            </div>
          </div>
        </div>

        {/* Part 2: Goals (5 Goals) */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#228B22',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              Strategic Pillars
            </div>
            <h3
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#174D32',
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Library Strategic Goals
            </h3>
            <p style={{ fontSize: '14.5px', color: '#667166', marginTop: '6px', margin: '6px 0 0' }}>
              Five fundamental goals establishing the strategic direction of library services, literacy initiatives,
              and community development.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {goals.map((goal) => {
              const Icon = goal.icon;
              return (
                <div
                  key={goal.num}
                  style={{
                    backgroundColor: '#F5F1E8',
                    borderRadius: '16px',
                    border: '1px solid #E8F3E8',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(23, 77, 50, 0.1)';
                    e.currentTarget.style.borderColor = '#228B22';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#E8F3E8';
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          backgroundColor: '#E8F3E8',
                          color: '#174D32',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: '#174D32',
                          backgroundColor: '#E8F3E8',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Goal {goal.num}
                      </span>
                    </div>

                    <h4
                      style={{
                        fontSize: '17px',
                        fontWeight: 800,
                        color: '#174D32',
                        marginBottom: '8px',
                        lineHeight: 1.3,
                      }}
                    >
                      {goal.title}
                    </h4>

                    <p
                      style={{
                        fontSize: '14px',
                        lineHeight: 1.55,
                        color: '#475549',
                        margin: 0,
                      }}
                    >
                      {goal.description}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(23, 77, 50, 0.08)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#228B22',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    • {goal.tag}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Part 3: Objectives (8 Objectives) */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#228B22',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              Actionable Targets
            </div>
            <h3
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: '#174D32',
                letterSpacing: '-0.015em',
                margin: 0,
              }}
            >
              Library Objectives
            </h3>
            <p style={{ fontSize: '14.5px', color: '#667166', marginTop: '6px', margin: '6px 0 0' }}>
              Eight concrete operational objectives ensuring comprehensive public service delivery across all 36
              barangays of Balingasag.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '18px',
            }}
          >
            {objectives.map((obj) => {
              const Icon = obj.icon;
              return (
                <div
                  key={obj.num}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1.5px solid #E8F3E8',
                    padding: '22px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(23, 77, 50, 0.03)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#228B22';
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(23, 77, 50, 0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E8F3E8';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(23, 77, 50, 0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#174D32',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {obj.num}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <h4
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#174D32',
                            margin: 0,
                            lineHeight: 1.35,
                          }}
                        >
                          {obj.title}
                        </h4>
                        <Icon size={16} style={{ color: '#228B22', flexShrink: 0 }} />
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          lineHeight: 1.5,
                          color: '#475549',
                          margin: 0,
                        }}
                      >
                        {obj.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Municipal Alignment Callout Banner */}
        <div
          style={{
            backgroundColor: '#E8F3E8',
            borderRadius: '16px',
            border: '1px solid rgba(34, 139, 34, 0.25)',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '18px',
          }}
        >
          <Building2 size={24} style={{ color: '#174D32', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#174D32',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Local Government Unit • Municipality of Balingasag, Misamis Oriental
            </div>
            <div style={{ fontSize: '14px', color: '#202820', marginTop: '6px', lineHeight: 1.55 }}>
              The Balingasag Public Municipal Library’s Mission, Vision, Goals, and Objectives operate in full synergy
              with the municipal priority of building a prosperous, safe, and environmentally sustainable agro-industrial
              and eco-tourism center with an empowered, educated citizenry.
            </div>
            {onOpenVerification && (
              <button
                onClick={onOpenVerification}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginTop: '10px',
                  color: '#174D32',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View Public Transparency & Verification Details</span>
                <span>&rarr;</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
