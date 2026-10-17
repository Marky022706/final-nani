import React, { useState } from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { ServicesSection } from './ServicesSection';
import { MissionVisionSection } from './MissionVisionSection';
import { ProgramsSection } from './ProgramsSection';
import { LearningBenefitsSection } from './LearningBenefitsSection';
import { GallerySection } from './GallerySection';
import { ContactSection } from './ContactSection';
import { FinalCTASection } from './FinalCTASection';
import { Footer } from './Footer';
import { AdminVerificationModal } from './AdminVerificationModal';
import { HelpSupportModal } from './HelpSupportModal';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister?: () => void;
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToLogin,
  isMaintenanceMode = false,
  maintenanceMessage
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
        overflowX: 'hidden'
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
            zIndex: 60
          }}
        >
          <span>⚠️ Scheduled System Maintenance:</span>
          <span>{maintenanceMessage || 'Borrowing and reservation services are temporarily paused.'}</span>
        </div>
      )}

      {/* Sticky Navbar */}
      <LandingNavbar
        onNavigateToLogin={onNavigateToLogin}
        onOpenVerification={() => setIsVerificationOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Page Sections — assembled in flow */}
      <main style={{ flex: 1 }}>
        <HeroSection onNavigateToLogin={onNavigateToLogin} />
        <AboutSection />
        <ServicesSection onNavigateToLogin={onNavigateToLogin} />
        <ProgramsSection />
        <MissionVisionSection onOpenVerification={() => setIsVerificationOpen(true)} />
        <LearningBenefitsSection />
        <GallerySection />
        <ContactSection />
        <FinalCTASection onNavigateToLogin={onNavigateToLogin} />
      </main>

      {/* Footer */}
      <Footer onOpenHelp={() => setIsHelpOpen(true)} />

      {/* Admin Verification Overlay */}
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
