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
import { PrivateAccessCta } from './components/PrivateAccessCta';
import { PrivateDeployment } from './components/PrivateDeployment';
import { ContactSection } from './components/ContactSection';
import { HiringBanner } from './components/HiringBanner';
import { Footer } from './components/Footer';
import { CareersPage } from './components/careers/CareersPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AccountPage } from './components/auth/AccountPage';
import { DeploymentPage } from './components/auth/DeploymentPage';
import { DocsPage } from './components/docs/DocsPage';
import { ConsolePage } from './components/console/ConsolePage';
import { RequestAccessPage } from './components/access/RequestAccessPage';
import { SignupGate } from './components/access/SignupGate';

// ── Hash-based multi-page router ──
// Each page is its own route. The site used to be a single scroll page; it is
// now split so every nav item is a distinct page.
//
// Phase 1 (commercial repositioning): RAPHA is presented as a private/selective
// deployment. The former public self-service `pricing` page is replaced by the
// `private-deployment` page (the legacy `#/pricing` hash still resolves there),
// and a new `request-access` application route is the primary commercial entry.
export type Route =
  | 'home'
  | 'product'
  | 'compliance'
  | 'private-deployment'
  | 'request-access'
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
    // Legacy `#/pricing` links resolve to the new private-deployment page so
    // old bookmarks/inbound links do not break.
    case 'pricing':
    case 'private-deployment':
      return 'private-deployment';
    case 'request-access':
      return 'request-access';
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

  // Primary commercial action across the public site: the private-access
  // application. NO public CTA routes an anonymous visitor into account
  // creation / RAPHA tenant provisioning anymore.
  const goRequestAccess = () => navigate('request-access');
  // Secondary hero/marketing action: the RAPHA product page (a real route, so
  // the CTA is never a dead scroll-to-missing-element).
  const goExplore = () => navigate('product');

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
          {/* Signup is no longer a public self-service path. Anonymous visitors
              see an access-controlled notice routing to Request Private Access;
              an already-authenticated user is sent to their account. The
              underlying provisioning/auth backend is preserved unchanged. */}
          {route === 'signup' &&
            (account ? <AccountPage onNavigate={navigate} /> : (
              <SignupGate onRequestAccess={goRequestAccess} onSignIn={() => navigate('login')} />
            ))}
          {route === 'account' && <AccountPage onNavigate={navigate} />}
          {route === 'deploy' && <DeploymentPage onNavigate={navigate} />}

          {/* ── Public marketing site ── */}
          {route === 'home' && (
            <>
              <div id="home">
                <HeroSection onRequestAccess={goRequestAccess} onExplore={goExplore} />
              </div>
              <HiringBanner />
            </>
          )}

          {route === 'product' && (
            <div id="solution">
              <SolutionSection />
              <WhyRaphaSection />
              <PrivateAccessCta onRequestAccess={goRequestAccess} />
            </div>
          )}

          {route === 'compliance' && <ProblemSection />}

          {/* Private-deployment page replaces the former public pricing page. */}
          {route === 'private-deployment' && (
            <PrivateDeployment onRequestAccess={goRequestAccess} onLearnMore={goExplore} />
          )}

          {route === 'request-access' && <RequestAccessPage />}

          {route === 'careers' && <CareersPage />}

          {route === 'contact' && <ContactSection onRequestAccess={goRequestAccess} />}

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
