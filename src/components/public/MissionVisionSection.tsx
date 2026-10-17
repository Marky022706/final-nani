import React from 'react';
import { Target, Compass, AlertCircle, Building2 } from 'lucide-react';

interface MissionVisionSectionProps {
  onOpenVerification?: () => void;
}

export const MissionVisionSection: React.FC<MissionVisionSectionProps> = ({ onOpenVerification }) => {
  return (
    <section
      id="mission-vision"
      aria-label="Official Mission and Vision"
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
            Guiding Principles
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
            Mission & Vision
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Guiding educational development, intellectual empowerment, and community literacy across the municipality.
          </p>
        </div>

        {/* Two Balanced Cards for Mission & Vision */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            marginBottom: '36px'
          }}
        >
          {/* Mission Card */}
          <div
            style={{
              backgroundColor: '#F5F1E8',
              borderRadius: '20px',
              border: '1.5px solid #E8F3E8',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px -4px rgba(23, 77, 50, 0.06)',
              position: 'relative'
            }}
          >
            <div>
              {/* Header Icon & Status Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#E8F3E8',
                    color: '#174D32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Target size={24} />
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <AlertCircle size={12} />
                  <span>Pending Official Confirmation</span>
                </span>
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#174D32',
                  marginBottom: '16px'
                }}
              >
                Proposed Library Mission
              </h3>

              <blockquote
                style={{
                  fontSize: '17px',
                  lineHeight: 1.6,
                  color: '#202820',
                  fontStyle: 'italic',
                  margin: '0 0 20px',
                  borderLeft: '3px solid #228B22',
                  paddingLeft: '16px'
                }}
              >
                “To support access to knowledge, encourage reading, and promote learning opportunities for the community.”
              </blockquote>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#667166',
                paddingTop: '16px',
                borderTop: '1px solid rgba(23, 77, 50, 0.1)',
                lineHeight: 1.45
              }}
            >
              Draft proposed text submitted for administrative review and confirmation with the Sangguniang Bayan of Balingasag.
            </div>
          </div>

          {/* Vision Card */}
          <div
            style={{
              backgroundColor: '#F5F1E8',
              borderRadius: '20px',
              border: '1.5px solid #E8F3E8',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 6px 20px -4px rgba(23, 77, 50, 0.06)',
              position: 'relative'
            }}
          >
            <div>
              {/* Header Icon & Status Pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#E8F3E8',
                    color: '#174D32',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Compass size={24} />
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <AlertCircle size={12} />
                  <span>Pending Official Confirmation</span>
                </span>
              </div>

              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#174D32',
                  marginBottom: '16px'
                }}
              >
                Proposed Library Vision
              </h3>

              <blockquote
                style={{
                  fontSize: '17px',
                  lineHeight: 1.6,
                  color: '#202820',
                  fontStyle: 'italic',
                  margin: '0 0 20px',
                  borderLeft: '3px solid #228B22',
                  paddingLeft: '16px'
                }}
              >
                “To help foster a community that values knowledge, literacy, and lifelong learning.”
              </blockquote>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: '#667166',
                paddingTop: '16px',
                borderTop: '1px solid rgba(23, 77, 50, 0.1)',
                lineHeight: 1.45
              }}
            >
              Draft proposed text aligned with public library frameworks. Subject to final adoption by the Library Board.
            </div>
          </div>
        </div>

        {/* Clear Municipal Demarcation Box */}
        <div
          style={{
            backgroundColor: '#E8F3E8',
            borderRadius: '14px',
            border: '1px solid rgba(34, 139, 34, 0.25)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}
        >
          <Building2 size={22} style={{ color: '#174D32', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#174D32', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Distinct Municipal Vision • Municipality of Balingasag
            </div>
            <div style={{ fontSize: '14px', color: '#202820', marginTop: '4px', lineHeight: 1.5 }}>
              Separately, the overarching vision of the <strong>Municipality of Balingasag</strong> is to be a peaceful, progressive, and self-reliant eco-cultural community in Misamis Oriental. The Municipal Library operates in support of this broader civic goal.
            </div>
            {onOpenVerification && (
              <button
                onClick={onOpenVerification}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginTop: '8px',
                  color: '#174D32',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Review Library Verification Checklist &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
