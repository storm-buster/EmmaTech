import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { SkipToContent } from './components/SkipToContent';
import { Navigation } from './components/Navigation';
import { ComingSoonBanner } from './components/ComingSoonBanner';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { WorkflowSection } from './components/WorkflowSection';
import { CustomerSection } from './components/CustomerSection';
import { TeamSection } from './components/TeamSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

// Lazy load modals since they're not needed on initial page load
const WaitlistModal = lazy(() =>
  import('./components/WaitlistModal').then((module) => ({
    default: module.WaitlistModal,
  }))
);
const InvestorModal = lazy(() =>
  import('./components/InvestorModal').then((module) => ({
    default: module.InvestorModal,
  }))
);

function App() {
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);

  const handleWaitlistOpen = () => setIsWaitlistModalOpen(true);
  const handleWaitlistClose = () => setIsWaitlistModalOpen(false);

  const handleInvestorOpen = () => setIsInvestorModalOpen(true);
  const handleInvestorClose = () => setIsInvestorModalOpen(false);

  const handleContactClick = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <SkipToContent />
      <Navigation onContactClick={handleContactClick} />
      <ComingSoonBanner />
      <main id="main-content">
        <div id="home">
          <HeroSection
            onWaitlistClick={handleWaitlistOpen}
            onInvestorClick={handleInvestorOpen}
          />
        </div>
        <AboutSection />
        <ProblemSection />
        <div id="solution">
          <SolutionSection />
        </div>
        <WorkflowSection />
        <CustomerSection />
        <TeamSection />
        <ContactSection onWaitlistClick={handleWaitlistOpen} />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onClose={handleWaitlistClose}
        />
        <InvestorModal
          isOpen={isInvestorModalOpen}
          onClose={handleInvestorClose}
        />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
