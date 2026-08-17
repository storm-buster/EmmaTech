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
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { AccountPage } from './components/auth/AccountPage';
import { DeploymentPage } from './components/auth/DeploymentPage';
import { DocsPage } from './components/docs/DocsPage';
import { ConsolePage } from './components/console/ConsolePage';
import { setIntendedPlan } from './auth/planIntent';
import type { PlanId } from './shared/plans';

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
  | 'deploy'
  | 'docs'
  | 'console';

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
    case 'docs':
      return 'docs';
    case 'console':
      return 'console';
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
  const { account } = useAuth();

  const navigate = (to: Route) => {
    window.location.hash = to === 'home' ? '#/' : `#/${to}`;
  };

  // Primary product CTAs (demo / pilot / pricing) route to the contact page.
  const handleCtaClick = () => navigate('contact');

  // Pricing-card CTAs: FREE/STARTER/GROWTH enter the authenticated flow and the
  // selected plan is recorded as a client UX intent (server stays
  // authoritative); the perpetual/custom notice routes to contact. No CTA
  // performs a purchase or grants entitlement. An already-authenticated user is
  // sent straight to their account/portal (never back through account creation).
  const handlePlanCta = (action: 'signup' | 'contact', planId: PlanId) => {
    if (action === 'contact') {
      navigate('contact');
      return;
    }
    // action === 'signup'
    if (account) {
      // Already authenticated — skip signup; go to the account/portal. Server
      // remains authoritative for plan/entitlement; nothing is activated here.
      navigate('account');
    } else {
      setIntendedPlan(planId);
      navigate('signup');
    }
  };

  const isAuthRoute =
    route === 'login' ||
    route === 'signup' ||
    route === 'account' ||
    route === 'deploy' ||
    route === 'console';

  return (
    <ThemeProvider theme={theme}>
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
            <CustomerSection onCtaAction={handlePlanCta} />
          )}

          {route === 'careers' && <CareersPage />}

          {route === 'contact' && <ContactSection />}

          {route === 'privacy' && <PrivacyPolicy />}

          {route === 'terms' && <TermsOfService />}

          {route === 'docs' && <DocsPage />}

          {route === 'console' && <ConsolePage onNavigate={navigate} />}
        </main>

        {!isAuthRoute && <Footer onNavigate={navigate} />}
    </ThemeProvider>
  );
}

export default App;
