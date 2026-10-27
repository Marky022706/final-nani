import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  BookOpen,
  Headphones,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  MapPin,
  Landmark,
  GraduationCap,
  Library,
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToLogin: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  onNavigateToLogin
}) => {
  const [activeTab, setActiveTab] = useState<'guides' | 'helpdesk' | 'shortcuts'>('guides');
  const [selectedGuideIndex, setSelectedGuideIndex] = useState<number>(0);

  if (!isOpen) return null;

  const userGuides = [
    {
      title: 'Patron Membership & Digital Library Card Registration',
      category: 'Registration & Access',
      badge: 'Public Guide',
      summary: 'Guidelines for residents, students, and educators of Balingasag to register as library patrons.',
      steps: [
        'Visit the Balingasag Municipal Library front desk at the Municipal Hall Compound, Poblacion.',
        'Present 1 valid Government-issued ID, Barangay Clearance, or Student School ID confirming residency or school enrollment in Balingasag.',
        'The librarian registers your profile into the automated library system and prints/issues your official Balingasag Public Library Card complete with a personal barcode and QR code.',
        'Use your card for all physical book loans, computer station usage, and daily attendance scanning.'
      ],
      tip: 'Tip: Membership is completely free for all residents of Balingasag as part of the municipal public education initiative.'
    },
    {
      title: 'Book Borrowing, Loan Limits & Return Procedures',
      category: 'Borrowing SOP',
      badge: 'Circulation Policy',
      summary: 'Standard operating rules for checking out physical books, reference volumes, and returning borrowed materials.',
      steps: [
        'Registered patrons may borrow up to 3 circulation books simultaneously for a duration of 7 calendar days.',
        'Reference books, Filipiniana historical records, and encyclopedias are marked "On-Site Reading Only" and may not be removed from the library reading room.',
        'To renew a loan: Bring the book or your library card to the front desk before the due date, provided no other patron has reserved the volume.',
        'Returns must be checked in at the designated Return Desk where staff will scan the accession barcode and inspect the physical condition.'
      ],
      tip: 'Tip: Please handle books with clean hands and use bookmarks instead of folding page corners (dog-earing).'
    },
    {
      title: 'Reading Room, Wi-Fi & Study Desk Guidelines',
      category: 'Facilities',
      badge: 'On-Site Conduct',
      summary: 'Rules to maintain a conducive, peaceful environment for study, research, and collaborative literacy sessions.',
      steps: [
        'Scan your digital library card QR code at the entrance attendance scanner to log your visit.',
        'Maintain a quiet environment; cell phones should be placed on silent mode before entering the study area.',
        'Free Wi-Fi access is available for students conducting academic research and accessing online educational portals.',
        'Return all chairs to their desks and dispose of waste in designated recycling bins before leaving.'
      ],
      tip: 'Tip: Group study or review sessions can be coordinated in advance with the librarian to reserve designated tables.'
    },
    {
      title: 'Local Studies, Genealogy & Balingasag Historical Archives',
      category: 'Research',
      badge: 'Special Collections',
      summary: 'How to request access to local municipal history documents, municipal resolutions, and cultural heritage records.',
      steps: [
        'Submit a research topic request to Head Librarian Anita L. Arquita at the reference desk.',
        'Archival documents must be examined under staff supervision at the reference research table.',
        'Digital scanning or non-flash photography of non-restricted historical documents is permitted for academic citations.',
        'Cite the "Balingasag Municipal Public Library Local Studies Collection" in your research papers.'
      ],
      tip: 'Tip: Researchers from partner universities (such as Liceo de Cagayan) may request assistance for regional studies.'
    }
  ];

  const externalLinks = [
    {
      title: 'National Library of the Philippines (NLP)',
      category: 'National Portal',
      desc: 'Official website of the National Library of the Philippines, public library directories, and national bibliographic standards.',
      url: 'https://web.nlp.gov.ph/',
      badge: 'Official NLP',
      icon: Landmark
    },
    {
      title: 'DOST STARBOOKS Digital Library',
      category: 'Science & Technology',
      desc: 'Science and Technology Academic and Research-Based Openly Operated Kiosks for offline and online science learning.',
      url: 'https://starbooks.ph/',
      badge: 'DOST Portal',
      icon: GraduationCap
    },
    {
      title: 'LGU Municipality of Balingasag',
      category: 'Local Government',
      desc: 'Official municipal government portal for public ordinances, municipal news, and local community services in Misamis Oriental.',
      url: 'https://balingasag.gov.ph/',
      badge: 'LGU Portal',
      icon: Library
    },
    {
      title: 'DepEd Commons Learning Portal',
      category: 'Basic Education',
      desc: 'Online repository of Open Educational Resources (OER) and textbook references for elementary and high school learners.',
      url: 'https://commons.deped.gov.ph/',
      badge: 'DepEd OER',
      icon: GraduationCap
    },
    {
      title: 'Open Library / Internet Archive',
      category: 'Global Library',
      desc: 'Over 20 million cataloged books and open-access digitized literature records for student researchers worldwide.',
      url: 'https://openlibrary.org/',
      badge: 'Open Metadata',
      icon: Globe
    }
  ];

  const currentGuide = userGuides[selectedGuideIndex];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(23, 77, 50, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-dialog modal-content help-support-modal"
        style={{
          backgroundColor: 'var(--bg-surface, #FFFFFF)',
          color: 'var(--text-primary)',
          borderRadius: '16px',
          maxWidth: '860px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-main)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            backgroundColor: '#174D32',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A7F3D0'
              }}
            >
              <HelpCircle size={22} />
            </div>
            <div>
              <h2
                id="help-modal-title"
                style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}
              >
                Help & Support Resources
              </h2>
              <div style={{ fontSize: '12.5px', color: '#A7F3D0', marginTop: '2px' }}>
                Balingasag Municipal Public Library • User Guides & Directory Shortcuts
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Help Modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#F5F1E8',
            borderBottom: '1px solid #E8F3E8',
            padding: '0 24px'
          }}
        >
          {[
            { id: 'guides', label: 'User Guides & SOPs', icon: BookOpen },
            { id: 'helpdesk', label: 'Help Desk Resources', icon: Headphones },
            { id: 'shortcuts', label: 'Quick Links & Shortcuts', icon: ExternalLink }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2.5px solid ${isActive ? '#228B22' : 'transparent'}`,
                  color: isActive ? '#174D32' : '#667166',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: USER GUIDES */}
          {activeTab === 'guides' && (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
              {/* Guides List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#667166', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Select Topic
                </div>
                {userGuides.map((guide, idx) => {
                  const isSelected = selectedGuideIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedGuideIndex(idx)}
                      style={{
                        padding: '12px 14px',
                        textAlign: 'left',
                        backgroundColor: isSelected ? '#E8F3E8' : '#FFFFFF',
                        border: `1px solid ${isSelected ? '#228B22' : '#E8F3E8'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#228B22', textTransform: 'uppercase' }}>
                        {guide.category}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#202820', marginTop: '2px', lineHeight: 1.3 }}>
                        {guide.title}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Guide Content Display */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8F3E8',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ display: 'inline-block', backgroundColor: '#E8F3E8', color: '#174D32', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', marginBottom: '8px' }}>
                    {currentGuide.badge}
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#174D32', margin: 0, lineHeight: 1.3 }}>
                    {currentGuide.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#667166', marginTop: '6px', lineHeight: 1.5 }}>
                    {currentGuide.summary}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid #F5F1E8', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#202820', marginBottom: '10px' }}>
                    Standard Procedure Steps:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {currentGuide.steps.map((step, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#174D32',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {sIdx + 1}
                        </span>
                        <span style={{ fontSize: '13px', lineHeight: 1.6, color: '#202820' }}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#F5F1E8',
                    border: '1px solid #E8F3E8',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    fontSize: '12.5px',
                    color: '#174D32'
                  }}
                >
                  <Sparkles size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#228B22' }} />
                  <span>{currentGuide.tip}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HELP DESK RESOURCES */}
          {activeTab === 'helpdesk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: '#E8F3E8',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid #C8E6C9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#228B22', textTransform: 'uppercase' }}>
                    Official Municipal Help Desk
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#174D32', marginTop: '2px' }}>
                    Librarian Anita L. Arquita
                  </div>
                  <div style={{ fontSize: '13px', color: '#388E3C' }}>
                    Head Librarian • Listed in NLP Public Library Directory
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <a
                    href="tel:+639161535744"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#174D32',
                      color: '#FFFFFF',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <Phone size={15} />
                    <span>0916 153 5744</span>
                  </a>
                  <a
                    href="mailto:anita.arquita@yahoo.com"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#FFFFFF',
                      color: '#174D32',
                      border: '1px solid #228B22',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <Mail size={15} />
                    <span>Send Email</span>
                  </a>
                </div>
              </div>

              {/* Station Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F3E8', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#174D32', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                    <Clock size={16} color="#228B22" />
                    <span>Help Desk Hours</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#202820', lineHeight: 1.6 }}>
                    <strong>Mon to Fri:</strong> 8:00 AM – 5:00 PM<br />
                    <strong>Weekends:</strong> Closed for Municipal Maintenance
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F3E8', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#174D32', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                    <MapPin size={16} color="#228B22" />
                    <span>Physical Help Desk</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#202820', lineHeight: 1.6 }}>
                    Municipal Hall Compound, Poblacion,<br />
                    Balingasag, Misamis Oriental 9005
                  </div>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8F3E8', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#174D32', fontWeight: 700, fontSize: '13.5px', marginBottom: '8px' }}>
                    <ShieldCheck size={16} color="#228B22" />
                    <span>Staff Portal Support</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#202820', lineHeight: 1.6 }}>
                    For password resets or circulation scanner issues, authorized staff can contact the administrator.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ESSENTIAL QUICK LINKS & SHORTCUTS */}
          {activeTab === 'shortcuts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Internal Shortcuts */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#174D32', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Internal System Shortcuts
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  <button
                    onClick={() => {
                      onClose();
                      const el = document.getElementById('services');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8F3E8',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#202820' }}>Library Services Overview</div>
                      <div style={{ fontSize: '12px', color: '#667166' }}>Lending, quiet review, Wi-Fi</div>
                    </div>
                    <ArrowRight size={16} color="#228B22" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      const el = document.getElementById('contact');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8F3E8',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#202820' }}>Map & Driving Directions</div>
                      <div style={{ fontSize: '12px', color: '#667166' }}>Poblacion Municipal Hall Compound</div>
                    </div>
                    <ArrowRight size={16} color="#228B22" />
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToLogin();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      backgroundColor: '#174D32',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      color: '#FFFFFF'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF' }}>Staff & Admin Portal</div>
                      <div style={{ fontSize: '12px', color: '#A7F3D0' }}>Circulation, cataloging, login</div>
                    </div>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </button>
                </div>
              </div>

              {/* External Shortcuts */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#174D32', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Essential External Educational Portals
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {externalLinks.map((link, idx) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E8F3E8',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#228B22';
                          e.currentTarget.style.backgroundColor = '#F5F1E8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#E8F3E8';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: '#E8F3E8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#174D32',
                            flexShrink: 0
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#174D32' }}>
                              {link.title}
                            </span>
                            <span style={{ fontSize: '10.5px', fontWeight: 700, backgroundColor: '#E8F3E8', color: '#228B22', padding: '1px 6px', borderRadius: '4px' }}>
                              {link.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#667166', marginTop: '2px' }}>
                            {link.desc}
                          </div>
                        </div>
                        <ExternalLink size={16} color="#667166" style={{ flexShrink: 0 }} />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#F5F1E8',
            borderTop: '1px solid #E8F3E8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#667166' }}>
            <CheckCircle2 size={16} color="#228B22" />
            <span>Verified against National Library of the Philippines (NLP) public directory records.</span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#174D32',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
