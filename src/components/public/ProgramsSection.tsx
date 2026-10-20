import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpenCheck,
  Bell,
  Info,
  ExternalLink,
  Calendar,
  Award,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  LayoutGrid,
  Presentation,
  Sparkles,
  Users
} from 'lucide-react';

export interface ProgramItem {
  id: string;
  title: string;
  partner: string;
  category: 'students' | 'community' | 'digital' | 'civic';
  categoryLabel: string;
  badge: string;
  description: string;
  highlight: string;
  image: string;
  alt: string;
  schedule: string;
}

export const ProgramsSection: React.FC = () => {
  const allPrograms: ProgramItem[] = [
    {
      id: 'student-reading-tutorials',
      title: 'Student Reading Assistance & Tutorials',
      partner: 'Balingasag Municipal Library On-Site Program',
      category: 'students',
      categoryLabel: 'Youth & Students',
      badge: 'On-Site Learning',
      description:
        'Dedicated one-on-one and small-group reading tutorials conducted by library personnel, assisting elementary and secondary students with reading comprehension, textbook review, and literacy skills.',
      highlight: 'Direct librarian guidance in an air-conditioned, supportive study environment.',
      image: '/programs/student-reading-session.jpg',
      alt: 'Balingasag Municipal Librarian assisting a student with reading a book at the library table',
      schedule: 'Regular Weekdays • 1:00 PM – 4:30 PM',
    },
    {
      id: 'youth-literacy-circles',
      title: 'Youth Literacy Circles & Collaborative Study',
      partner: 'Municipal Youth & Student Reading Advocacy',
      category: 'students',
      categoryLabel: 'Youth & Students',
      badge: 'Youth Engagement',
      description:
        'Collaborative reading circles where young readers from Balingasag schools gather around library study tables to explore children’s storybooks, textbooks, Filipiniana volumes, and group academic research.',
      highlight: 'Fostering peer learning, lifelong reading habits, and academic confidence.',
      image: '/programs/collaborative-reading.jpg',
      alt: 'Students engaged in group reading at Balingasag Library study tables',
      schedule: 'Weekly Study Sessions • Tuesday & Thursday',
    },
    {
      id: 'summer-reading-camp',
      title: 'Balingasag Municipal Summer Reading Camp',
      partner: 'DepEd Balingasag Districts & Municipal Library',
      category: 'students',
      categoryLabel: 'Youth & Students',
      badge: 'Summer Special',
      description:
        'An engaging summer reading festival designed to prevent vacation learning loss. Features guided book reading, vocabulary games, phonics drills, and character illustration workshops for young learners.',
      highlight: 'Fun-filled reading quests with certificates of accomplishment for graduates.',
      image: '/programs/summer-reading-camp.jpg',
      alt: 'Students and teachers gathered for the municipal summer reading camp in Balingasag',
      schedule: 'Summer Break (July – August) • 9:00 AM – 11:30 AM',
    },
    {
      id: 'storytelling-hour',
      title: "Children's Storytelling & Creative Arts Hour",
      partner: "Balingasag Children's Literature Guild",
      category: 'students',
      categoryLabel: 'Youth & Students',
      badge: 'Early Literacy',
      description:
        'Interactive oral storytelling sessions featuring local folk tales, Filipino values stories, and moral fables, followed by arts and crafts activities where children draw their favorite book scenes.',
      highlight: 'Inspires boundless imagination, active listening, and social cooperation.',
      image: '/programs/storytelling-hour.jpg',
      alt: 'Children and educators engaging in interactive storytelling activities',
      schedule: 'Every Friday Afternoon • 2:00 PM – 4:00 PM',
    },
    {
      id: 'elderly-filipino-week',
      title: 'Pagpasidungog sa Atong mga Katigulangan (Elderly Filipino Week)',
      partner: 'LGU Balingasag & Municipal Library Community Outreach',
      category: 'community',
      categoryLabel: 'Community Outreach',
      badge: 'Community Outreach',
      description:
        'Municipal-wide celebration bringing together senior citizens across all 36 barangays of Balingasag, promoting intergenerational literacy, civic celebration, and inclusive community support.',
      highlight: 'Empowering senior citizens and celebrating community heritage with the LGU.',
      image: '/programs/elderly-community-celebration.jpg',
      alt: 'Elderly Filipino Week municipal gathering in Balingasag covered court',
      schedule: 'Annual Municipal Celebration • October',
    },
    {
      id: 'barangay-capacity-building',
      title: 'Literacy Orientation & Barangay Capacity Building',
      partner: 'Barangay Leaders & Community Stakeholders',
      category: 'community',
      categoryLabel: 'Community Outreach',
      badge: 'Institutional Partnership',
      description:
        'Multi-sectoral orientation and strategy seminars conducted with barangay officials, educators, and community partners to coordinate reading programs, literacy extension, and information access for all sectors.',
      highlight: 'Strengthening community ties and educational outreach in Balingasag barangays.',
      image: '/programs/library-seminar-workshop.jpg',
      alt: 'Library orientation and community partnership seminar with municipal stakeholders',
      schedule: 'Quarterly Stakeholder Strategy Seminars',
    },
    {
      id: 'starbooks-orientation',
      title: 'DOST STARBOOKS Digital Science & Tech Orientation',
      partner: 'DOST Region X & Balingasag Municipal Library',
      category: 'digital',
      categoryLabel: 'Digital & Science',
      badge: 'Digital Innovation',
      description:
        'Interactive digital science orientations introducing students, researchers, and out-of-school youth to the DOST STARBOOKS offline digital science library pods without needing internet access.',
      highlight: 'Offline digital encyclopedias, interactive STEM simulations, and research papers.',
      image: '/programs/starbooks-orientation.jpg',
      alt: 'DOST STARBOOKS digital orientation with students using offline scientific computers',
      schedule: 'Bi-weekly Hands-On Sessions • Wednesday Mornings',
    },
    {
      id: 'digital-literacy-training',
      title: 'Basic Computer & Digital Literacy Workshop for Patrons',
      partner: 'LGU ICT Division & Municipal Library Staff',
      category: 'digital',
      categoryLabel: 'Digital & Science',
      badge: 'Digital Inclusion',
      description:
        'Free hands-on workshops teaching senior citizens, homemakers, and students how to navigate computers, use search engines safely, type documents, and access e-government services.',
      highlight: 'Bridging the municipal digital divide with patient step-by-step guidance.',
      image: '/programs/digital-literacy-training.jpg',
      alt: 'Patrons learning computer operations and internet search techniques at workstations',
      schedule: 'Monthly Weekend Cohorts • 9:00 AM – 12:00 PM',
    },
    {
      id: 'national-book-week',
      title: 'National Book Development Month & Reading Quiz Bee',
      partner: 'Municipal Education Board & Balingasag Schools',
      category: 'civic',
      categoryLabel: 'Civic Partnerships',
      badge: 'Academic Contest',
      description:
        'A municipal-wide reading competition and literary quiz bee testing students on classic literature, Philippine history, regional culture, and General Information with book prizes.',
      highlight: 'Promotes academic excellence, healthy contest, and municipal pride.',
      image: '/programs/national-book-week.jpg',
      alt: 'Students participating in literacy quiz bee and book week celebration',
      schedule: 'Annual November Festivity',
    },
    {
      id: 'book-donation-drive',
      title: '"Aklat Para Sa Balingasag" Community Book Donation Drive',
      partner: 'Balingasag Civic Groups, Alumni & Book Donors',
      category: 'civic',
      categoryLabel: 'Civic Partnerships',
      badge: 'Civic Giving',
      description:
        'An ongoing municipal campaign encouraging alumni, overseas residents, and civic organizations to donate quality reference books, encyclopedias, and children’s literature to expand our library collection.',
      highlight: 'Over 800+ citizen-donated volumes integrated into the official catalog.',
      image: '/programs/book-donation-drive.jpg',
      alt: 'Community volunteers sorting and organizing donated books for the municipal library',
      schedule: 'Year-Round Civic Initiative',
    },
  ];

  // States: View Mode, Filter, Page in Grid Mode, Slide in Presentation Mode
  const [viewMode, setViewMode] = useState<'grid' | 'presentation'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ITEMS_PER_PAGE = 4;

  // Filtered Programs
  const filteredPrograms = allPrograms.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const totalPages = Math.max(1, Math.ceil(filteredPrograms.length / ITEMS_PER_PAGE));
  const currentGridPrograms = filteredPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page and slide when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setCurrentSlideIndex(0);
  };

  // Next / Previous for Grid Page
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : 1));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : totalPages));
  };

  // Next / Previous for Presentation Slide
  const handleNextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % filteredPrograms.length);
  }, [filteredPrograms.length]);

  const handlePrevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + filteredPrograms.length) % filteredPrograms.length);
  }, [filteredPrograms.length]);

  // Autoplay presentation timer
  useEffect(() => {
    if (viewMode === 'presentation' && isPlaying) {
      autoplayTimerRef.current = setInterval(() => {
        handleNextSlide();
      }, 4500);
    } else {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    }
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [viewMode, isPlaying, handleNextSlide]);

  const activeSlide = filteredPrograms[currentSlideIndex] || filteredPrograms[0];

  return (
    <section
      id="programs"
      aria-label="Community Outreach and Programs"
      style={{
        padding: '76px 24px',
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E8F3E8',
      }}
    >
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 36px' }}>
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
            <Award size={16} />
            <span>Activities & Community Engagements</span>
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
            Programs & Events Showcase
          </h2>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#667166', margin: 0 }}>
            Real-world educational programs, reading tutorials, and community outreach actively conducted by the
            Balingasag Municipal Library to empower learners and citizens across all 36 barangays.
          </p>
        </div>

        {/* Presentation & Filter Control Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
            padding: '14px 20px',
            backgroundColor: '#F8FAF8',
            borderRadius: '16px',
            border: '1px solid #E2EBE2',
          }}
        >
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All Programs (${allPrograms.length})` },
              { id: 'students', label: `Youth & Students (${allPrograms.filter(p => p.category === 'students').length})` },
              { id: 'community', label: `Community (${allPrograms.filter(p => p.category === 'community').length})` },
              { id: 'digital', label: `Digital & Science (${allPrograms.filter(p => p.category === 'digital').length})` },
              { id: 'civic', label: `Civic Drives (${allPrograms.filter(p => p.category === 'civic').length})` },
            ].map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleCategoryChange(tab.id)}
                  style={{
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '999px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: active ? '#166534' : 'rgba(22, 101, 52, 0.08)',
                    color: active ? '#FFFFFF' : '#166534',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Presentation Mode Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
              View Mode:
            </span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                padding: '3px',
                gap: '2px',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Paginated Grid View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'grid' ? '#166534' : 'transparent',
                  color: viewMode === 'grid' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={14} />
                <span>Page Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('presentation')}
                title="Full Presentation Slide Showcase"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'presentation' ? '#166534' : 'transparent',
                  color: viewMode === 'presentation' ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <Presentation size={14} />
                <span>Slide Presentation</span>
              </button>
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: PRESENTATION SLIDE SHOWCASE */}
        {viewMode === 'presentation' && activeSlide && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '2px solid #166534',
              boxShadow: '0 20px 40px -8px rgba(22, 101, 52, 0.15)',
              overflow: 'hidden',
              marginBottom: '40px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Top Slide Meta Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 24px',
                backgroundColor: '#166534',
                color: '#FFFFFF',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="#4ADE80" />
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  PROGRAM PRESENTATION SLIDE #{currentSlideIndex + 1} OF {filteredPrograms.length}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 600,
                  }}
                >
                  {activeSlide.categoryLabel}
                </span>
              </div>

              {/* Presentation Slide Nav Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    backgroundColor: isPlaying ? '#22C55E' : 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlaying ? 'Pause' : 'Autoplay'}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    aria-label="Previous Slide"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextSlide}
                    aria-label="Next Slide"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Presentation Body: Widescreen Two-Column Layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '0px',
              }}
            >
              {/* Slide Image Stage */}
              <div
                style={{
                  height: '420px',
                  position: 'relative',
                  backgroundColor: '#0F172A',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={activeSlide.image}
                  alt={activeSlide.alt}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'all 0.4s ease',
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/balingasag-library-bg.jpg';
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    backgroundColor: 'rgba(22, 101, 52, 0.92)',
                    backdropFilter: 'blur(6px)',
                    color: '#FFFFFF',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  {activeSlide.badge}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    bottom: '16px',
                    left: '16px',
                    right: '16px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  <Calendar size={15} color="#4ADE80" />
                  <span>{activeSlide.schedule}</span>
                </div>
              </div>

              {/* Slide Content Details */}
              <div
                style={{
                  padding: '36px 32px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: '#FDFBF7',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#228B22',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <Users size={15} />
                    <span>{activeSlide.partner}</span>
                  </div>

                  <h3
                    style={{
                      fontSize: '26px',
                      fontWeight: 800,
                      color: '#174D32',
                      lineHeight: 1.3,
                      marginBottom: '16px',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {activeSlide.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '15.5px',
                      lineHeight: 1.7,
                      color: '#334155',
                      marginBottom: '24px',
                    }}
                  >
                    {activeSlide.description}
                  </p>
                </div>

                <div>
                  {/* Institutional Highlight Box */}
                  <div
                    style={{
                      backgroundColor: '#E8F3E8',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      borderLeft: '4px solid #166534',
                      fontSize: '13.5px',
                      color: '#174D32',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontWeight: 600,
                      marginBottom: '24px',
                    }}
                  >
                    <BookOpenCheck size={18} style={{ flexShrink: 0, color: '#166534' }} />
                    <span>{activeSlide.highlight}</span>
                  </div>

                  {/* Slide Stepper Indicator Bar */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {filteredPrograms.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentSlideIndex(idx)}
                          aria-label={`Jump to slide ${idx + 1}`}
                          style={{
                            width: idx === currentSlideIndex ? '28px' : '9px',
                            height: '9px',
                            borderRadius: '999px',
                            border: 'none',
                            backgroundColor: idx === currentSlideIndex ? '#166534' : '#CBD5E1',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handlePrevSlide}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#334155',
                          cursor: 'pointer',
                        }}
                      >
                        ← Prev
                      </button>

                      <button
                        type="button"
                        onClick={handleNextSlide}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#166534',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        Next Slide →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: PAGINATED GRID (4 Cards Per Page) */}
        {viewMode === 'grid' && (
          <div>
            <div
              id="programs-outreach"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
                gap: '28px',
                marginBottom: '36px',
              }}
            >
              {currentGridPrograms.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#FDFBF7',
                    borderRadius: '18px',
                    border: '1px solid #E8F3E8',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px -2px rgba(23, 77, 50, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  className="program-card"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(23, 77, 50, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px -2px rgba(23, 77, 50, 0.06)';
                  }}
                >
                  {/* Image Banner */}
                  <div style={{ height: '220px', overflow: 'hidden', position: 'relative', backgroundColor: '#174D32' }}>
                    <img
                      src={item.image}
                      alt={item.alt}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/balingasag-library-bg.jpg';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(23, 77, 50, 0.92)',
                        backdropFilter: 'blur(4px)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '999px',
                      }}
                    >
                      {item.badge}
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '12px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(3px)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Calendar size={13} color="#4ADE80" />
                      <span>{item.schedule}</span>
                    </div>
                  </div>

                  {/* Content Body */}
                  <div
                    style={{
                      padding: '24px',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#228B22', marginBottom: '6px' }}>
                        {item.partner}
                      </div>
                      <h3
                        style={{
                          fontSize: '18px',
                          fontWeight: 700,
                          color: '#174D32',
                          marginBottom: '10px',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '14px',
                          lineHeight: 1.6,
                          color: '#202820',
                          marginBottom: '16px',
                        }}
                      >
                        {item.description}
                      </p>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#E8F3E8',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12.5px',
                        color: '#174D32',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                      }}
                    >
                      <BookOpenCheck size={16} style={{ flexShrink: 0 }} />
                      <span>{item.highlight}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '16px 20px',
                backgroundColor: '#F8FAF8',
                borderRadius: '16px',
                border: '1px solid #E2EBE2',
                marginBottom: '40px',
              }}
            >
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                Showing Page <strong style={{ color: '#166534' }}>{currentPage}</strong> of{' '}
                <strong style={{ color: '#166534' }}>{totalPages}</strong> ({filteredPrograms.length} total engagements)
              </div>

              {/* Page Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: currentPage <= 1 ? '#94A3B8' : '#166534',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous Page</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: pageNum === currentPage ? '#166534' : '#FFFFFF',
                      color: pageNum === currentPage ? '#FFFFFF' : '#334155',
                      boxShadow: pageNum === currentPage ? '0 2px 6px rgba(22, 101, 52, 0.3)' : 'none',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: currentPage >= totalPages ? '#94A3B8' : '#166534',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>Next Page</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcements & Official Facebook Noticeboard */}
        <div
          id="programs-announcements"
          style={{
            backgroundColor: '#F5F1E8',
            borderRadius: '16px',
            border: '1px solid #E8F3E8',
            padding: '28px 32px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '20px',
            flexWrap: 'wrap',
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
              flexShrink: 0,
            }}
          >
            <Bell size={24} />
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#174D32', margin: 0 }}>
                Library Noticeboard & Social Media Updates
              </h3>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                Official Page
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#475549', lineHeight: 1.6, margin: '0 0 12px 0' }}>
              The Balingasag Municipal Library is located at the community plaza beside the street food area. It is
              fully air-conditioned, has free Wi-Fi, and is open to all for reading, studying, and research (Mon–Fri,
              8:00 AM – 5:00 PM). Real-time event schedules, photo updates, and municipal reading drives are regularly
              posted on our official Facebook page.
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                paddingTop: '8px',
                borderTop: '1px solid rgba(23, 77, 50, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12.5px',
                  color: '#174D32',
                  fontWeight: 600,
                }}
              >
                <Info size={15} color="#228B22" />
                <span>Visit our Facebook page for live activity updates and photo galleries.</span>
              </div>

              <a
                href="https://www.facebook.com/atina2022"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#1877F2',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#165ec9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1877F2';
                }}
              >
                <span>Follow on Facebook (@atina2022)</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
