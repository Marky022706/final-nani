import React, { useState } from 'react';
import { HelpCircle, ChevronDown, BookOpen, ShieldCheck, ExternalLink } from 'lucide-react';

interface FaqSectionProps {
  onOpenHelp?: () => void;
  onOpenVerification?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  onOpenHelp,
  onOpenVerification,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Who can visit and read at the Balingasag Public Library?',
      a: 'The library is open to all students, researchers, educators, children, and community residents of Balingasag and surrounding municipalities in Misamis Oriental.',
    },
    {
      q: 'Is there an entrance fee or membership charge to access the library?',
      a: 'No. Admission and on-site use of the reading room, study tables, and cataloged reference books are completely free of charge under the public library service of the Local Government Unit.',
    },
    {
      q: 'What are the library’s regular operating hours?',
      a: 'The library operates Monday through Friday from 8:00 AM to 5:00 PM. The facility is closed on weekends and official national or municipal holidays.',
    },
    {
      q: 'Can books be borrowed for take-home reading?',
      a: 'Reference books, encyclopedias, and Filipiniana collections are primarily dedicated for on-site reading and study. Borrowing privileges for circulating items are managed directly by the municipal librarian at the front desk.',
    },
    {
      q: 'Where inside Balingasag is the public library located?',
      a: 'The library is centrally located within the Balingasag Municipal Hall Compound in Poblacion, making it easily accessible from local elementary schools, high schools, and municipal offices.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions and Helpful Resources"
      style={{
        padding: '72px 24px',
        backgroundColor: '#FFFFFF',
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
            Visitor Assistance
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
            Frequently Asked Questions & Resources
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166' }}>
            Find quick answers to common visitor questions and access helpful digital resources before planning your visit.
          </p>
        </div>

        {/* 2-Column Layout: Accordion (Left) + Helpful Resource Cards (Right) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '36px',
            alignItems: 'start',
          }}
          className="faq-grid"
        >
          {/* FAQ Accordion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {faqs.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#FDFBF7',
                    borderRadius: '14px',
                    border: `1.5px solid ${isOpen ? '#228B22' : '#E8F3E8'}`,
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '15.5px',
                        fontWeight: 700,
                        color: isOpen ? '#174D32' : '#202820',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        color: isOpen ? '#228B22' : '#667166',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        fontSize: '14.5px',
                        lineHeight: 1.65,
                        color: '#475569',
                        borderTop: '1px solid #E8F3E8',
                        paddingTop: '14px',
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Helpful Guides & External Portals */}
          <div id="resources-external" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Visitor Guide Card */}
            {onOpenHelp && (
              <div
                style={{
                  backgroundColor: '#F5F1E8',
                  borderRadius: '16px',
                  border: '1px solid #E8F3E8',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#E8F3E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#174D32',
                    }}
                  >
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                      Visitor Guide & Quick Directory
                    </h3>
                    <div style={{ fontSize: '12px', color: '#667166' }}>
                      Comprehensive library handbook
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '13.5px', color: '#667166', lineHeight: 1.5, marginBottom: '16px' }}>
                  Need assistance finding books, understanding circulation guidelines, or reading on-site? Browse our detailed visitor guide.
                </p>
                <button
                  type="button"
                  onClick={onOpenHelp}
                  style={{
                    backgroundColor: '#174D32',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#228B22')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#174D32')}
                >
                  <HelpCircle size={15} />
                  <span>Open Visitor Guide</span>
                </button>
              </div>
            )}

            {/* Verification Checklist Card */}
            {onOpenVerification && (
              <div
                style={{
                  backgroundColor: '#FDFBF7',
                  borderRadius: '16px',
                  border: '1px solid #E8F3E8',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#E8F3E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#228B22',
                    }}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                      Institutional Verification
                    </h3>
                    <div style={{ fontSize: '12px', color: '#667166' }}>
                      NLP Directory & Municipal Data
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '13.5px', color: '#667166', lineHeight: 1.5, marginBottom: '16px' }}>
                  View the official NLP Directory records, LGU affiliation details, and confirmed administrative contacts.
                </p>
                <button
                  type="button"
                  onClick={onOpenVerification}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#174D32',
                    border: '1.5px solid #174D32',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E8F3E8')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <ShieldCheck size={14} color="#228B22" />
                  <span>View Verification Checklist</span>
                </button>
              </div>
            )}

            {/* External Links */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E8F3E8',
                padding: '20px 24px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#228B22', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Useful External Portals
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'National Library of the Philippines (NLP)', url: 'https://web.nlp.gov.ph' },
                  { label: 'DOST STARBOOKS Digital Science Library', url: 'https://starbooks.ph/' },
                  { label: 'LGU Municipality of Balingasag', url: 'https://balingasag.gov.ph/' },
                ].map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '13px',
                      color: '#174D32',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: i < 2 ? '1px solid #F5F1E8' : 'none',
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#228B22')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#174D32')}
                  >
                    <span>{item.label}</span>
                    <ExternalLink size={13} color="#228B22" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .faq-grid {
            grid-template-columns: 1.25fr 0.75fr !important;
            gap: 48px !important;
          }
        }
      `}</style>
    </section>
  );
};
