import styled from 'styled-components';
import { Button } from '../Button';
import { breakpoints } from '../../styles/breakpoints';
import type { Route } from '../../App';
import { routePath } from '../../routing';

/**
 * Public resource (Phase 2D): "How to Evaluate a Cyber Deception Platform".
 *
 * People-first, vendor-neutral buyer/evaluation guide. Conceptual only — it must
 * NOT contain private RAPHA implementation details (models, features, thresholds,
 * firewall/routing mechanics, specific decoy software, control-plane/agent URLs,
 * installers, manifests, credentials) or unsupported performance claims. RAPHA's
 * public conceptual workflow (Detect → Decide → Redirect → Observe → Preserve)
 * is allowed. SEO metadata + JSON-LD live in src/seo/routeSeo.ts.
 */

interface Props {
  onNavigate: (to: Route) => void;
}

const Page = styled.article`
  max-width: 820px;
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
  margin: 0 0 ${({ theme }) => theme.spacing['2xl']};
`;

const H2 = styled.h2`
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: ${({ theme }) => theme.spacing['2xl']} 0 ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} { font-size: 28px; }
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

const OL = styled.ol`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  list-style: decimal;
`;

const LI = styled.li`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: 6px;
`;

const Flow = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 10px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.lg};
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

export function HowToEvaluateDeceptionPlatform({ onNavigate }: Props) {
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
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
        >
          Home
        </a>
        <span aria-hidden="true">/</span>
        <span>Resources</span>
        <span aria-hidden="true">/</span>
        <span>How to Evaluate a Cyber Deception Platform</span>
      </Breadcrumb>

      <Eyebrow>Resource · Buyer&rsquo;s guide</Eyebrow>
      <H1>How to Evaluate a Cyber Deception Platform</H1>
      <Lead>
        Cyber deception has moved from a niche research idea to a practical detection and
        investigation capability. But not all deception is equal, and the number of decoys a
        product can deploy tells you very little about the value it will deliver. This guide is a
        vendor-neutral framework for evaluating a deception platform on operational merit — the
        questions to ask, the tradeoffs to weigh, and how to run an evaluation that produces a
        confident decision.
      </Lead>

      <H2>Why evaluate deception on operational value, not decoy counts</H2>
      <P>
        It is tempting to compare deception products by counting features: how many decoy types,
        how many templates, how many protocols. Those numbers are easy to market and easy to
        misread. A platform that can spin up hundreds of decoys but produces noisy, low-context
        alerts can create more work than it removes. Conversely, a smaller, well-placed deception
        footprint that generates high-confidence signals and preserves useful evidence can change
        how a security team operates.
      </P>
      <P>
        Evaluate deception the way you would evaluate any detection capability: by the quality of
        the signal it produces, the decisions it enables, and the operational cost of running it.
        The questions below are designed to surface exactly that.
      </P>

      <H2>What is a cyber deception platform?</H2>
      <P>
        A cyber deception platform places believable, monitored assets — decoys, lures, and
        traps — inside or alongside your real environment. Because legitimate users have no reason
        to touch these assets, interaction with them is inherently suspicious and produces a
        high-confidence signal. A modern platform goes well beyond a single standalone honeypot: it
        manages deception at scale, correlates interactions, and connects detection to a response
        and investigation workflow.
      </P>
      <P>
        The distinction matters. A basic honeypot is a single trap you deploy and watch. A
        deception <em>platform</em> treats deception as a managed capability: it provisions decoys
        that fit the environment, observes attacker behaviour against them, and turns that
        observation into evidence and action. When you evaluate, keep that difference in mind — you
        are assessing a system, not a script.
      </P>

      <H2>Question 1 — What problem are you trying to solve?</H2>
      <P>
        Start with intent, not features. Deception can serve several distinct goals, and the right
        platform depends on which ones matter most to you:
      </P>
      <UL>
        <LI><strong>High-confidence detection</strong> — reducing false positives by generating signals that are suspicious by definition.</LI>
        <LI><strong>Attacker-interaction visibility</strong> — seeing what an adversary actually does, not just that something triggered.</LI>
        <LI><strong>Lateral-movement detection</strong> — catching an intruder who is already inside and moving between systems.</LI>
        <LI><strong>Investigation support</strong> — producing context that shortens triage and response.</LI>
        <LI><strong>Reducing ambiguity</strong> — turning &ldquo;this looks odd&rdquo; into &ldquo;this is hostile.&rdquo;</LI>
      </UL>
      <P>
        Write your top two or three goals down before you talk to any vendor. They become the
        yardstick for everything that follows.
      </P>

      <H2>Question 2 — How realistic are the decoys?</H2>
      <P>
        A decoy only works if an attacker engages with it, and attackers engage with things that
        look real and relevant. Evaluate realism along three dimensions: <strong>fidelity</strong>{' '}
        (does it behave like the real asset it imitates?), <strong>relevance</strong> (does it fit
        your actual environment and naming, rather than looking like an obvious trap?), and{' '}
        <strong>engagement depth</strong> (how far can an attacker interact before the illusion
        breaks?). Shallow decoys detect only the most casual probing; more convincing decoys sustain
        interaction long enough to reveal intent — at the cost of more careful design and
        maintenance.
      </P>

      <H2>Question 3 — What environments can it cover?</H2>
      <P>
        Deception can, in principle, span several layers: network, endpoint, identity, cloud, and
        application. Few platforms cover all of them equally well, and you rarely need them to. Map
        your priority attack surfaces first, then ask each vendor precisely which environments they
        support in production today — and ask for the distinction between what is generally
        available and what is roadmap. Do not assume breadth; confirm it against your own priorities.
      </P>

      <H2>Question 4 — How is the platform deployed?</H2>
      <P>Deployment model shapes both security posture and operational cost. Ask about:</P>
      <UL>
        <LI><strong>Deployment options</strong> — cloud, on-premises, or hybrid, and which is supported for your environment.</LI>
        <LI><strong>Isolation</strong> — how deception assets and attacker interaction are kept separated from production systems.</LI>
        <LI><strong>Infrastructure requirements</strong> — what has to be installed, and where.</LI>
        <LI><strong>Operational footprint</strong> — how much of your team&rsquo;s time the running system consumes.</LI>
      </UL>
      <P>
        Some organizations specifically require a private, individually-scoped deployment rather
        than a shared public service. If that describes you, evaluate the vendor&rsquo;s{' '}
        {link('private-deployment', 'private deployment model')} early — it constrains everything
        else.
      </P>

      <H2>Question 5 — What happens after detection?</H2>
      <P>
        Detection is the beginning, not the end. A trap that fires an alert and stops there leaves
        your team doing all the work. The more valuable question is what the platform does with a
        confirmed interaction. A useful conceptual model for the full loop is:
      </P>
      <Flow>Detect → Decide → Redirect → Observe → Preserve</Flow>
      <P>
        In other words: identify suspicious behaviour, decide whether it warrants a response,
        redirect the activity into a controlled environment where it can do no harm, observe what
        the adversary attempts, and preserve the resulting evidence. Ask each vendor which of these
        steps they automate, which require an analyst, and how much control you retain over the
        response.
      </P>

      <H2>Question 6 — What evidence can be preserved?</H2>
      <P>
        The investigative value of deception comes from the record it leaves behind. Ask what is
        captured, how completely an interaction is recorded, and whether the record is
        tamper-evident so it can be trusted later. Good evidence answers &ldquo;what did the
        attacker do, in what order, and can we prove it?&rdquo; When a vendor describes evidence
        capabilities, hold them to what is actually supported in the shipping product rather than
        aspirational descriptions.
      </P>

      <H2>Question 7 — How does it integrate with existing security tools?</H2>
      <P>
        Deception is a complement to your existing controls, not a replacement for them. It should
        strengthen — not duplicate — the stack you already run. Ask how the platform works alongside:
      </P>
      <UL>
        <LI><strong>SIEM</strong> — can high-confidence deception events enrich correlation and reduce alert fatigue?</LI>
        <LI><strong>EDR</strong> — does endpoint deception complement endpoint detection and response?</LI>
        <LI><strong>NDR</strong> — how does it relate to network detection and response signals?</LI>
        <LI><strong>XDR</strong> — can events feed a broader detection and response fabric?</LI>
        <LI><strong>SOAR</strong> — can confirmed interactions trigger automated playbooks?</LI>
      </UL>
      <P>
        A platform that claims to replace all of these should raise a flag. The right role for
        deception is to add a high-confidence layer that makes the rest of your tooling more
        effective.
      </P>

      <H2>Question 8 — How much operational work does it create?</H2>
      <P>Every capability has a running cost. Estimate the true operational load before you commit:</P>
      <UL>
        <LI><strong>Deployment</strong> — initial setup effort and expertise required.</LI>
        <LI><strong>Decoy maintenance</strong> — how often decoys must be refreshed to stay believable.</LI>
        <LI><strong>Alert triage</strong> — the volume and quality of alerts your team will handle.</LI>
        <LI><strong>Integrations</strong> — the effort to connect and maintain links to your stack.</LI>
        <LI><strong>Ongoing administration</strong> — routine care and feeding over months, not the demo.</LI>
      </UL>

      <H2>Question 9 — How should a pilot or evaluation be structured?</H2>
      <P>A good evaluation is designed, not improvised. Use a simple, repeatable framework:</P>
      <OL>
        <LI><strong>Define objectives</strong> — tie the pilot to the goals from Question 1.</LI>
        <LI><strong>Establish a test environment</strong> — representative but safely isolated.</LI>
        <LI><strong>Define the signals and evidence</strong> you expect to see.</LI>
        <LI><strong>Set success criteria</strong> up front, in measurable terms you agree on.</LI>
        <LI><strong>Validate integrations</strong> with your existing tools, not just the standalone product.</LI>
        <LI><strong>Review the operational workload</strong> honestly, as your team would run it day to day.</LI>
        <LI><strong>Document findings</strong> so the decision is evidence-based and repeatable.</LI>
      </OL>

      <H2>A vendor questions checklist</H2>
      <P>Concise questions you can put to any deception vendor:</P>
      <UL>
        <LI>Which detection goals is your platform designed for, and which is it not?</LI>
        <LI>How do you make decoys believable and relevant to our environment?</LI>
        <LI>Which environments do you support in production today, versus on the roadmap?</LI>
        <LI>What deployment models do you offer, and how is deception isolated from production?</LI>
        <LI>What happens automatically after a confirmed interaction, and what needs an analyst?</LI>
        <LI>What evidence is captured, and is it tamper-evident?</LI>
        <LI>How do you integrate with SIEM, EDR, NDR, XDR, and SOAR?</LI>
        <LI>What is the realistic ongoing operational workload?</LI>
        <LI>How do you support a structured pilot with clear success criteria?</LI>
      </UL>

      <H2>How RAPHA approaches these requirements</H2>
      <P>
        {link('product', 'RAPHA')} is a privately deployable cyber deception platform that combines
        behavioural detection, controlled attacker redirection, decoy observation, and forensic
        evidence. Rather than only raising an alert, RAPHA is designed around the full conceptual
        loop above — detect suspicious behaviour, decide on a response, redirect the activity into a
        controlled deception environment, observe what the adversary does, and preserve a
        tamper-evident forensic record.
      </P>
      <P>
        RAPHA is deployed privately: organizations are evaluated individually for deployment fit
        rather than signing up for a shared, public, self-service service. If you are weighing the
        deployment questions in this guide, the {link('private-deployment', 'private deployment')}{' '}
        page explains how that evaluation works. This section is intentionally high-level; specific
        deployment details are shared with qualified organizations during a private evaluation.
      </P>

      <H2>Conclusion</H2>
      <P>
        Cyber deception is most valuable when it is evaluated as part of an overall security
        architecture — a high-confidence detection and investigation layer that complements the
        controls you already run — rather than as a standalone &ldquo;honeypot feature.&rdquo; If
        you keep the focus on operational value, integration, and the quality of the evidence and
        response a platform produces, you will make a decision you can defend long after the demo
        ends.
      </P>

      <CtaCard>
        <CtaTitle>Evaluating deception for your organization?</CtaTitle>
        <P style={{ marginBottom: 0 }}>
          RAPHA is deployed privately and scoped to each organization. Request access to start a
          private evaluation conversation.
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
