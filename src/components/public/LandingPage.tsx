import React, { useState } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';
import { ProgramsSection } from './ProgramsSection';
import { AboutSection } from './AboutSection';
import { MissionVisionSection } from './MissionVisionSection';
import { LearningBenefitsSection } from './LearningBenefitsSection';
import { GallerySection } from './GallerySection';
import { ContactSection } from './ContactSection';
import { FaqSection } from './FaqSection';
import { FinalCTASection } from './FinalCTASection';
import { Footer } from './Footer';
import { AdminVerificationModal } from './AdminVerificationModal';
import { HelpSupportModal } from './HelpSupportModal';
import { ScrollFade } from './ScrollFade';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister?: () => void;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  isMaintenanceMode = false,
  maintenanceMessage,
}) => {
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        color: '#1e293b',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      {/* Maintenance Banner */}
      {isMaintenanceMode && (
        <div
          role="alert"
          style={{
            backgroundColor: '#FEF3C7',
            borderBottom: '1px solid #FDE68A',
            color: '#92400E',
            padding: '10px 24px',
            textAlign: 'center',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            zIndex: 60,
          }}
        >
          <span>⚠️ Scheduled System Maintenance:</span>
          <span>{maintenanceMessage || 'Borrowing and reservation services are temporarily paused.'}</span>
        </div>
      )}

      {/* Sticky Header with 6 Primary Categories and distinct Staff Sign In */}
      <LandingNavbar
        onNavigateToLogin={onNavigateToLogin}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Homepage Flow with Scroll Fade In & Fade Out Animations */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Section 1 — Hero & Quick Visitor Information on Blurred Background */}
        <ScrollFade threshold={0.05} duration={400} style={{ minHeight: 'calc(100vh - 76px)', display: 'flex', flexDirection: 'column' }}>
          <HeroSection />
        </ScrollFade>

        {/* Section 2 — Library Services */}
        <ScrollFade threshold={0.08} duration={450}>
          <ServicesSection onNavigateToLogin={onNavigateToLogin} />
        </ScrollFade>

        {/* Section 4 — Programs and Community Activities */}
        <ScrollFade threshold={0.08} duration={450}>
          <ProgramsSection />
        </ScrollFade>

        {/* Section 5 — About the Library (Overview, History, Mission & Vision) */}
        <ScrollFade threshold={0.08} duration={450}>
          <AboutSection />
        </ScrollFade>
        <ScrollFade threshold={0.08} duration={450}>
          <MissionVisionSection onOpenVerification={() => setIsVerificationOpen(true)} />
        </ScrollFade>
        <ScrollFade threshold={0.08} duration={450}>
          <LearningBenefitsSection />
        </ScrollFade>
        <ScrollFade threshold={0.08} duration={450}>
          <GallerySection />
        </ScrollFade>

        {/* Section 6 — Visit the Library (Location, Hours, Librarian Contact, Guidelines) */}
        <ScrollFade threshold={0.08} duration={450}>
          <ContactSection />
        </ScrollFade>

        {/* Section 7 — Frequently Asked Questions or Helpful Resources */}
        <ScrollFade threshold={0.08} duration={450}>
          <FaqSection
            onOpenHelp={() => setIsHelpOpen(true)}
            onOpenVerification={() => setIsVerificationOpen(true)}
          />
        </ScrollFade>

        {/* Final Community CTA */}
        <FinalCTASection onNavigateToLogin={onNavigateToLogin} />
      </main>

      {/* Section 8 — Footer */}
      <Footer
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onNavigateToLogin={onNavigateToLogin}
      />

      {/* Verification Checklist Modal */}
      <AdminVerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
      />

      {/* Public Help Desk & Quick Links Modal */}
      <HelpSupportModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onNavigateToLogin={onNavigateToLogin}
      />
    </div>
  );
};
