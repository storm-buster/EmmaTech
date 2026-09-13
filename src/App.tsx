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
import { CuriositySection } from './components/CuriositySection';
import { PrivateDeployment } from './components/PrivateDeployment';
import { ContactSection } from './components/ContactSection';
import { HiringBanner } from './components/HiringBanner';
import { Footer } from './components/Footer';
import { CareersPage } from './components/careers/CareersPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { NotFoundPage } from './components/NotFoundPage';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AccountPage } from './components/auth/AccountPage';
import { DeploymentPage } from './components/auth/DeploymentPage';
import { DocsPage } from './components/docs/DocsPage';
import { ConsolePage } from './components/console/ConsolePage';
import { RequestAccessPage } from './components/access/RequestAccessPage';
import { SignupGate } from './components/access/SignupGate';
import { Seo } from './components/seo/Seo';
import { parsePath, routePath, navigateTo, subscribeLocation } from './routing';

// ── Pathname multi-page router (Phase 2A) ──
// Public marketing routes are real pathnames (`/rapha`, `/compliance`, …) served
// via the SPA + Vercel rewrites, so they are crawlable/linkable. Authenticated
// app routes stay client-rendered and are excluded from indexing. Legacy `#/…`
// URLs are redirected to their pathname equivalent by the bootstrap shim
// (see `applyLegacyHashRedirect` in main.tsx and `src/routing.ts`).
//
// Phase 1 commercial positioning is unchanged: RAPHA is a private/selective
// deployment; `/private-deployment` replaces public pricing; `/request-access`
// is the primary commercial entry.
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
  | 'console'
  | 'notfound';

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname));

  useEffect(
    () =>
      subscribeLocation(() => {
        setRoute(parsePath(window.location.pathname));
        // Every navigation lands at the top of the new page.
        window.scrollTo({ top: 0, behavior: 'auto' });
      }),
    [],
  );

  return route;
}

function App() {
  const route = useRoute();
  const { account } = useAuth();

  const navigate = (to: Route) => {
    navigateTo(routePath(to));
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
        <Seo />
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
              <CuriositySection />
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

          {/* Unknown public pathname → simple 404 (no longer silently Home). */}
          {route === 'notfound' && <NotFoundPage onNavigate={navigate} />}
        </main>

        {!isAuthRoute && <Footer onNavigate={navigate} />}
    </ThemeProvider>
  );
}

export default App;
