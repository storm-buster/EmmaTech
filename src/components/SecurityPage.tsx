import styled from 'styled-components';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import type { Route } from '../App';
import { routePath } from '../routing';
import inceptionBadge from '../assets/nvidia-inception-badge.png';

/**
 * Public `/security` page (Phase 4). A factual security-PRACTICES statement,
 * sourced only from evidence established in PHASE_4_EVIDENCE_TRUST_AUDIT.md and
 * the current implementation. It is NOT a certification/compliance page, NOT a
 * guarantee, NOT a benchmark/customer page. Wording avoids absolutes and never
 * exposes private RAPHA implementation details (models, features, thresholds,
 * firewall/routing mechanics, decoy software, control-plane/storage URLs,
 * download tokens, installers, manifests, credentials).
 */

interface Props {
  onNavigate: (to: Route) => void;
}

const Page = styled.main`
  max-width: 840px;
  margin: 0 auto;
  padding: 120px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['4xl']};

  ${breakpoints.tablet} {
    padding: 140px ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Breadcrumb = styled.nav`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  a {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
    text-decoration: none;
    &:hover { color: ${({ theme }) => theme.colors.primary.main}; }
  }
  span[aria-hidden='true'] { margin: 0 8px; opacity: 0.6; }
`;

const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #3fbf7f;
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const H1 = styled.h1`
  font-size: 34px;
  line-height: 1.15;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  ${breakpoints.tablet} { font-size: 46px; }
`;

const Lead = styled.p`
  font-size: 19px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`;

const Steps = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 12px;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 10px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin: 0 0 ${({ theme }) => theme.spacing['2xl']};
`;

const H2 = styled.h2`
  font-size: 23px;
  line-height: 1.25;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: ${({ theme }) => theme.spacing['2xl']} 0 ${({ theme }) => theme.spacing.md};
  ${breakpoints.tablet} { font-size: 26px; }
`;

const P = styled.p`
  font-size: 16px;
  line-height: 1.75;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  a {
    color: ${({ theme }) => theme.colors.primary.main};
    text-decoration: underline;
    text-underline-offset: 2px;
    &:hover { color: ${({ theme }) => theme.colors.primary.light}; }
  }
`;

const UL = styled.ul`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  list-style: disc;
`;

const LI = styled.li`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: 6px;
`;

const Disclaimer = styled.section`
  margin-top: ${({ theme }) => theme.spacing['2xl']};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-left: 3px solid ${({ theme }) => theme.colors.neutral.mediumGray};
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
`;

const InceptionRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const InceptionBadge = styled.img`
  max-width: 140px;
  width: 100%;
  height: auto;
`;

const CtaCard = styled.section`
  margin-top: ${({ theme }) => theme.spacing['3xl']};
  padding: ${({ theme }) => theme.spacing['2xl']};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 14px;
  background: ${({ theme }) => theme.gradients.card};
  text-align: center;
`;

const CtaTitle = styled.h2`
  font-size: 22px;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const CtaActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export function SecurityPage({ onNavigate }: Props) {
  const link = (route: Route, label: string) => (
    <a
      href={routePath(route)}
      onClick={(e) => {
        e.preventDefault();
        onNavigate(route);
      }}
    >
      {label}
    </a>
  );

  return (
    <Page>
      <Breadcrumb aria-label="Breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>Home</a>
        <span aria-hidden="true">/</span>
        <span>Security</span>
      </Breadcrumb>

      <Eyebrow>Security practices</Eyebrow>
      <H1>Security at EmmaTech</H1>
      <Lead>
        EmmaTech builds security-focused software. This page describes the security practices
        currently implemented across the EmmaTech platform and its supporting systems. It is a
        factual practices statement — not a certification, a compliance attestation, or a guarantee.
      </Lead>
      <Steps>Access control → Protected delivery → Traceability → Software practices → Responsible disclosure</Steps>

      <H2>Authentication &amp; access control</H2>
      <P>
        Access to authenticated areas of the platform is protected by server-side sessions. Sessions
        use an HttpOnly cookie that browser JavaScript cannot read, marked Secure in production and
        SameSite=Lax to reduce cross-site request risk. Requests to protected endpoints are checked
        server-side before any privileged action, and account operations are organization-scoped so a
        user acts only within their own organization.
      </P>
      <P>
        Authentication and authorization behaviour is exercised by the application&rsquo;s automated
        test suite, including tests that assert unauthenticated requests are rejected and that access
        is limited to the correct organization. Automated tests reduce the chance of regressions; they
        do not imply the absence of all vulnerabilities.
      </P>

      <H2>Protected software delivery</H2>
      <P>
        Sensitive RAPHA delivery is not published as a permanent public frontend asset. Authorized
        delivery is handled through authenticated, server-side access: the download is provided only
        to a signed-in customer, the authorization is short-lived and scoped to a single object, and
        the underlying storage credentials remain on the server and are never sent to the browser.
        This keeps the operational agent material out of the public build while preserving a
        legitimate, authorized path for customers. See {link('private-deployment', 'private deployment')}{' '}
        for how deployment is scoped per organization.
      </P>

      <H2>Logging &amp; traceability</H2>
      <P>
        The application emits structured JSON logs and attaches a request correlation identifier to
        server-side operations, so related requests and events can be traced and correlated during
        investigation and debugging. Logs are structured and correlated; we do not claim they are
        immutable, tamper-proof, or a guarantee of complete forensic coverage.
      </P>

      <H2>Software supply &amp; dependency practices</H2>
      <P>
        Dependencies are managed explicitly. The project uses a committed lockfile and version-managed
        packages so builds are reproducible and dependency changes are reviewable. This is a software
        practice for managing supply-chain risk — it is not a claim that the software is free of
        vulnerabilities or CVEs.
      </P>
      <UL>
        <LI>Explicit, version-managed dependencies with a committed lockfile.</LI>
        <LI>Dependency changes are reviewed through the normal pull-request process.</LI>
        <LI>Security-relevant checks run automatically on pull requests (see below).</LI>
      </UL>

      <H2>Secret scanning</H2>
      <P>
        Automated secret scanning (GitGuardian) runs on the repository&rsquo;s pull requests to help
        catch credentials or secrets before they are merged. Automated scanning reduces risk; it
        cannot guarantee that every possible secret is always detected.
      </P>

      <H2>Responsible disclosure &amp; security contact</H2>
      <P>
        If you believe you have found a security issue affecting EmmaTech or RAPHA, please report it
        responsibly to{' '}
        <a href="mailto:avinash@emmatech.in">avinash@emmatech.in</a>. Please include enough detail to
        reproduce the issue, and allow reasonable time for us to investigate and respond before any
        public disclosure. We appreciate reports made in good faith.
      </P>

      <H2>NVIDIA Inception</H2>
      <P>EmmaTech is a member of the NVIDIA Inception program.</P>
      <InceptionRow>
        <InceptionBadge src={inceptionBadge} alt="NVIDIA Inception Program member badge" />
      </InceptionRow>

      <Disclaimer>
        <H2 style={{ marginTop: 0 }}>What this page does not claim</H2>
        <UL>
          <LI>The practices described here do not constitute a security certification or a compliance attestation.</LI>
          <LI>Security controls and automated testing reduce risk but do not imply zero vulnerabilities or complete security.</LI>
          <LI>
            RAPHA detection accuracy, performance figures, and customer outcomes are not represented on this
            page. For how to assess a platform&rsquo;s detection and evidence claims, see{' '}
            {link('resources', 'How to Evaluate a Cyber Deception Platform')}.
          </LI>
        </UL>
      </Disclaimer>

      <CtaCard>
        <CtaTitle>Evaluating RAPHA for your organization?</CtaTitle>
        <P style={{ marginBottom: 0 }}>
          RAPHA is deployed privately and scoped to each organization. You can learn more about{' '}
          {link('product', 'RAPHA')} or request access to start a private evaluation.
        </P>
        <CtaActions>
          <Button variant="primary" onClick={() => onNavigate('request-access')}>
            Request Private Access
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('product')}>
            Explore RAPHA
          </Button>
        </CtaActions>
      </CtaCard>
    </Page>
  );
}
