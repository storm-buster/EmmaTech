import { useState, lazy, Suspense } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { SkipToContent } from './components/SkipToContent';
import { Navigation } from './components/Navigation';
import { ComingSoonBanner } from './components/ComingSoonBanner';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { WhyRaphaSection } from './components/WhyRaphaSection';
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

function App() {
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);

  const handleWaitlistOpen = () => setIsWaitlistModalOpen(true);
  const handleWaitlistClose = () => setIsWaitlistModalOpen(false);

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
          />
        </div>
        <div id="solution">
          <SolutionSection />
          <WhyRaphaSection />
        </div>
        <ProblemSection />
        <CustomerSection onWaitlistClick={handleWaitlistOpen} />
        <TeamSection />
        <ContactSection onWaitlistClick={handleWaitlistOpen} />
      </main>
      <Footer />
      <Suspense fallback={null}>
        <WaitlistModal
          isOpen={isWaitlistModalOpen}
          onClose={handleWaitlistClose}
        />
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
