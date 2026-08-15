import { useState, useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyles } from './styles/GlobalStyles';
import { theme } from './styles/theme';
import { SkipToContent } from './components/SkipToContent';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { WhyRaphaSection } from './components/WhyRaphaSection';
import { CustomerSection } from './components/CustomerSection';
import { ContactSection } from './components/ContactSection';
import { HiringBanner } from './components/HiringBanner';
import { Footer } from './components/Footer';
import { CareersPage } from './components/careers/CareersPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { AuthProvider } from './auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { AccountPage } from './components/auth/AccountPage';
import { DeploymentPage } from './components/auth/DeploymentPage';

// ── Hash-based multi-page router ──
// Each page is its own route. The site used to be a single scroll page; it is
// now split so every nav item is a distinct page.
export type Route =
  | 'home'
  | 'product'
  | 'compliance'
  | 'pricing'
  | 'careers'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'login'
  | 'signup'
  | 'account'
  | 'deploy';

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').split(/[/?#]/)[0].toLowerCase();
  switch (path) {
    case 'product':
      return 'product';
    case 'compliance':
      return 'compliance';
    case 'pricing':
      return 'pricing';
    case 'careers':
      return 'careers';
    case 'contact':
      return 'contact';
    case 'privacy':
      return 'privacy';
    case 'terms':
      return 'terms';
    case 'login':
      return 'login';
    case 'signup':
      return 'signup';
    case 'account':
      return 'account';
    case 'deploy':
      return 'deploy';
    default:
      return 'home';
  }
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(parseRoute(window.location.hash));
      // Every navigation lands at the top of the new page.
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}

function App() {
  const route = useRoute();

  const navigate = (to: Route) => {
    window.location.hash = to === 'home' ? '#/' : `#/${to}`;
  };

  // Primary product CTAs (demo / pilot / pricing) route to the contact page.
  const handleCtaClick = () => navigate('contact');

  const isAuthRoute =
    route === 'login' || route === 'signup' || route === 'account' || route === 'deploy';

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <GlobalStyles />
        <SkipToContent />
        <Navigation currentRoute={route} onNavigate={navigate} />

        <main id="main-content">
          {/* ── Identity foundation (Phase 1) ── */}
          {route === 'login' && <LoginPage onNavigate={navigate} />}
          {route === 'signup' && <SignupPage onNavigate={navigate} />}
          {route === 'account' && <AccountPage onNavigate={navigate} />}
          {route === 'deploy' && <DeploymentPage onNavigate={navigate} />}

          {/* ── Public marketing site (unchanged) ── */}
          {route === 'home' && (
            <>
              <div id="home">
                <HeroSection onDemoClick={handleCtaClick} />
              </div>
              <HiringBanner />
            </>
          )}

          {route === 'product' && (
            <div id="solution">
              <SolutionSection />
              <WhyRaphaSection />
            </div>
          )}

          {route === 'compliance' && <ProblemSection />}

          {route === 'pricing' && (
            <CustomerSection onCtaClick={handleCtaClick} />
          )}

          {route === 'careers' && <CareersPage />}

          {route === 'contact' && <ContactSection />}

          {route === 'privacy' && <PrivacyPolicy />}

          {route === 'terms' && <TermsOfService />}
        </main>

        {!isAuthRoute && <Footer onNavigate={navigate} />}
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
