import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight, ChevronDown, Lock } from 'lucide-react';

interface LandingNavbarProps {
  onNavigateToLogin: () => void;
  onOpenVerification?: () => void;
  onOpenHelp?: () => void;
}

interface DropdownItem {
  label: string;
  target?: string;
  action?: 'scroll' | 'help' | 'verification';
  description?: string;
}

interface NavCategory {
  id: string;
  label: string;
  target?: string;
  children?: DropdownItem[];
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onNavigateToLogin,
  onOpenVerification,
  onOpenHelp,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDropdown(null);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const navOffset = 76;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const navCategories: NavCategory[] = [
    {
      id: 'home',
      label: 'Home',
      target: 'hero',
    },
    {
      id: 'about',
      label: 'About the Library',
      target: 'about',
      children: [
        { label: 'Overview', target: 'about', action: 'scroll', description: 'Institutional foundation and public role' },
        { label: 'History & Community', target: 'about-history', action: 'scroll', description: 'Serving Balingasag’s 36 barangays' },
        { label: 'Mission, Vision & Goals', target: 'mission-vision', action: 'scroll', description: 'Guiding literacy, goals and objectives' },
      ],
    },
    {
      id: 'services',
      label: 'Services',
      target: 'services',
      children: [
        { label: 'Reading & Study Space', target: 'services', action: 'scroll', description: 'Quiet on-site reading environment' },
        { label: 'Book Collection & Catalog', target: 'services', action: 'scroll', description: 'Physical reference and Filipiniana' },
        { label: 'Research & Learning Support', target: 'services', action: 'scroll', description: 'Staff-assisted student research' },
      ],
    },
    {
      id: 'programs',
      label: 'Programs & Events',
      target: 'programs',
      children: [
        { label: 'Library Activities', target: 'programs', action: 'scroll', description: 'Reading Month and national campaigns' },
        { label: 'Community Outreach', target: 'programs', action: 'scroll', description: 'Barangay and school collaborations' },
        { label: 'Announcements', target: 'programs-announcements', action: 'scroll', description: 'Current schedules and updates' },
      ],
    },
    {
      id: 'visit',
      label: 'Visit Us',
      target: 'visit',
      children: [
        { label: 'Location & Directions', target: 'visit', action: 'scroll', description: 'Municipal Hall Compound, Poblacion' },
        { label: 'Opening Hours', target: 'visit-hours', action: 'scroll', description: 'Mon – Fri: 8:00 AM – 5:00 PM' },
        { label: 'Contact & Guidelines', target: 'visit-contact', action: 'scroll', description: 'Librarian contact and etiquette' },
      ],
    },
    {
      id: 'resources',
      label: 'Resources & Help',
      target: 'faq',
      children: [
        { label: 'Frequently Asked Questions', target: 'faq', action: 'scroll', description: 'Quick answers for visitors' },
        { label: 'Visitor Guide & Quick Links', action: 'help', description: 'Practical tips and directory' },
        { label: 'Data Verification Checklist', action: 'verification', description: 'Review institutional compliance' },
      ],
    },
  ];

  const handleDropdownItemClick = (item: DropdownItem) => {
    if (item.action === 'help') {
      setActiveDropdown(null);
      setIsMobileMenuOpen(false);
      onOpenHelp?.();
    } else if (item.action === 'verification') {
      setActiveDropdown(null);
      setIsMobileMenuOpen(false);
      onOpenVerification?.();
    } else if (item.target) {
      scrollToSection(item.target);
    }
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main Navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: `1px solid ${isScrolled ? '#E8F3E8' : 'rgba(232, 243, 232, 0.7)'}`,
        boxShadow: isScrolled ? '0 4px 20px -2px rgba(23, 77, 50, 0.08)' : 'none',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 20px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Brand / Logo Emblem */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('hero');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'inherit',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#E8F3E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: '2px solid #228B22',
              flexShrink: 0,
            }}
          >
            <img
              src="/balingasag-logo.png"
              alt="Balingasag Municipal Library Emblem"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: '15.5px',
                fontWeight: 800,
                color: '#174D32',
                letterSpacing: '-0.015em',
                lineHeight: 1.2,
              }}
            >
              Balingasag Public Library
            </div>
            <div
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#667166',
                letterSpacing: '0.02em',
              }}
            >
              Balingasag, Misamis Oriental
            </div>
          </div>
        </a>

        {/* Primary Desktop Navigation Hierarchy */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px',
            flexWrap: 'nowrap',
          }}
          className="desktop-nav-group"
        >
          {navCategories.map((category) => {
            const hasChildren = category.children && category.children.length > 0;
            const isOpen = activeDropdown === category.id;

            if (!hasChildren) {
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => category.target && scrollToSection(category.target)}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#202820',
                    background: 'none',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#174D32';
                    e.currentTarget.style.backgroundColor = '#F5F1E8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#202820';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {category.label}
                </button>
              );
            }

            return (
              <div
                key={category.id}
                style={{ position: 'relative', flexShrink: 0 }}
                onMouseEnter={() => setActiveDropdown(category.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() => {
                    if (category.target) scrollToSection(category.target);
                    setActiveDropdown(isOpen ? null : category.id);
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isOpen ? '#174D32' : '#202820',
                    backgroundColor: isOpen ? '#F5F1E8' : 'transparent',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap' }}>{category.label}</span>
                  <ChevronDown
                    size={13}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      color: isOpen ? '#174D32' : '#667166',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Dropdown Flyout Panel */}
                {isOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      minWidth: '260px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E8F3E8',
                      boxShadow: '0 12px 30px -4px rgba(23, 77, 50, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05)',
                      padding: '8px',
                      zIndex: 60,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    {category.children?.map((child, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDropdownItemClick(child)}
                        style={{
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'background-color 0.15s ease',
                          width: '100%',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F5F1E8')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#174D32',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {child.label}
                        </div>
                        {child.description && (
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#667166',
                              lineHeight: 1.3,
                            }}
                          >
                            {child.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Utility: Staff Sign In (Visually Separated) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={onNavigateToLogin}
            aria-label="Staff Sign In to Library System"
            style={{
              backgroundColor: '#174D32',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(23, 77, 50, 0.22)',
              transition: 'background-color 0.15s ease, transform 0.1s ease',
              minHeight: '40px',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#228B22';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#174D32';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <Lock size={14} />
            <span style={{ whiteSpace: 'nowrap' }}>Staff Sign In</span>
            <ArrowRight size={14} />
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: '1px solid #E8F3E8',
              borderRadius: '8px',
              width: '44px',
              height: '44px',
              cursor: 'pointer',
              color: '#174D32',
            }}
            className="mobile-hamburger-btn"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid #E8F3E8',
            backgroundColor: '#FFFFFF',
            padding: '16px 20px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {navCategories.map((category) => {
            const hasChildren = category.children && category.children.length > 0;
            const isExpanded = mobileExpandedGroup === category.id;

            if (!hasChildren) {
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => category.target && scrollToSection(category.target)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#202820',
                    borderBottom: '1px solid #F5F1E8',
                    cursor: 'pointer',
                  }}
                >
                  {category.label}
                </button>
              );
            }

            return (
              <div key={category.id} style={{ borderBottom: '1px solid #F5F1E8' }}>
                <button
                  type="button"
                  onClick={() => setMobileExpandedGroup(isExpanded ? null : category.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    padding: '12px 8px',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#174D32',
                    cursor: 'pointer',
                  }}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    size={16}
                    style={{
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {isExpanded && (
                  <div
                    style={{
                      paddingLeft: '16px',
                      paddingBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {category.children?.map((child, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDropdownItemClick(child)}
                        style={{
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: '8px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#202820' }}>
                          {child.label}
                        </span>
                        {child.description && (
                          <span style={{ fontSize: '11.5px', color: '#667166' }}>
                            {child.description}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigateToLogin();
              }}
              style={{
                backgroundColor: '#174D32',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                minHeight: '44px',
              }}
            >
              <Lock size={16} />
              <span>Staff Sign In</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav-group {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
};
