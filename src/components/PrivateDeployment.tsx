import { useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import { trackEvent } from '../analytics/events';

/**
 * Public "Private Deployment" page — replaces the former self-service pricing
 * page. Communicates genuine, process-based selectivity: no public prices, no
 * "Free"/"Most popular", no internal margins, no self-service purchase path.
 * Exclusivity comes from the actual review process, not manufactured scarcity.
 */

interface PrivateDeploymentProps {
  onRequestAccess: () => void;
  onLearnMore: () => void;
}

const Section = styled.section`
  padding: 140px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['4xl']};
  background: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.neutral.white};

  ${breakpoints.tablet} {
    padding: 160px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Inner = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Eyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 12px;
  font-weight: 700;
  color: #3fbf7f;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const Title = styled.h1`
  font-size: 40px;
  line-height: 1.15;
  font-weight: 700;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${breakpoints.tablet} {
    font-size: 52px;
  }
`;

const Lead = styled.p`
  font-size: 18px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  max-width: 760px;
  margin: 0 auto ${({ theme }) => theme.spacing['3xl']};
`;

const Statements = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 900px;
  margin: 0 auto ${({ theme }) => theme.spacing['3xl']};

  ${breakpoints.tablet} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatementCard = styled(motion.div)`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 14px;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const StatementTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StatementBody = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const ProcessTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Steps = styled.ol`
  list-style: none;
  counter-reset: step;
  padding: 0;
  max-width: 760px;
  margin: 0 auto ${({ theme }) => theme.spacing['3xl']};
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Step = styled.li`
  counter-increment: step;
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);

  &::before {
    content: counter(step);
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary.main};
    border: 1px solid ${({ theme }) => theme.colors.primary.main};
  }
`;

const StepText = styled.div`
  font-size: 15px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.neutral.lightGray};

  strong {
    color: ${({ theme }) => theme.colors.neutral.white};
    display: block;
    margin-bottom: 2px;
  }
`;

const CtaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  justify-content: center;

  ${breakpoints.tablet} {
    flex-direction: row;
  }
`;

const STATEMENTS = [
  {
    title: 'Not self-service',
    body: 'RAPHA is not offered as a public self-service subscription. It is deployed privately, with EmmaTech involved in every deployment.',
  },
  {
    title: 'Individually scoped',
    body: 'Deployments are scoped to each organization — size, infrastructure, security requirements, deployment environment, and operational needs.',
  },
  {
    title: 'Terms discussed privately',
    body: 'Commercial terms are provided during the private evaluation, once deployment fit is established. There are no public price lists.',
  },
];

const PROCESS = [
  { t: 'Request private access', d: 'Tell us about your organization and security requirements.' },
  { t: 'Organization review', d: 'We assess deployment fit against your infrastructure and needs.' },
  { t: 'Private briefing & evaluation', d: 'Selected organizations receive a private briefing and scoped evaluation.' },
  { t: 'Pilot & deployment', d: 'A pilot precedes an individually scoped production deployment.' },
];

export function PrivateDeployment({ onRequestAccess, onLearnMore }: PrivateDeploymentProps) {
  useEffect(() => {
    trackEvent('private_deployment_view');
  }, []);

  return (
    <Section id="private-deployment">
      <Inner>
        <Eyebrow>RAPHA · Private Deployment</Eyebrow>
        <Title>Private Deployment</Title>
        <Lead>
          RAPHA is not offered as a public self-service subscription. Deployments are individually
          scoped based on organization size, infrastructure, security requirements, deployment
          environment, and operational needs. Commercial terms are provided during the private
          evaluation process.
        </Lead>

        <Statements>
          {STATEMENTS.map((s, i) => (
            <StatementCard
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <StatementTitle>{s.title}</StatementTitle>
              <StatementBody>{s.body}</StatementBody>
            </StatementCard>
          ))}
        </Statements>

        <ProcessTitle>How access works</ProcessTitle>
        <Steps>
          {PROCESS.map((p) => (
            <Step key={p.t}>
              <StepText>
                <strong>{p.t}</strong>
                {p.d}
              </StepText>
            </Step>
          ))}
        </Steps>

        <CtaRow>
          <Button variant="primary" onClick={onRequestAccess} aria-label="Request private access to RAPHA">
            Request Private Access
          </Button>
          <Button variant="secondary" onClick={onLearnMore} aria-label="Learn about RAPHA">
            Learn About RAPHA
          </Button>
        </CtaRow>
      </Inner>
    </Section>
  );
}
