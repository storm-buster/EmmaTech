import styled from 'styled-components';
import { WorkflowStep } from './WorkflowStep';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
  theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.neutral.white};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
  theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.h2Mobile};
  line-height: ${({ theme }) => theme.typography.lineHeight.h2Mobile};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.h2Desktop};
    line-height: ${({ theme }) => theme.typography.lineHeight.h2Desktop};
  }
`;

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyLarge};
  line-height: ${({ theme }) => theme.typography.lineHeight.bodyLarge};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const WorkflowContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing['2xl']};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    flex-direction: row;
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

const steps = [
  {
    title: 'Threat Detection',
    description:
      'Our ML-driven engine proactively identifies potential threats in real-time, instantly triggering an automated response.',
  },
  {
    title: 'Containment & Analysis',
    description:
      'Malicious traffic is seamlessly diverted into a dynamic, high-interaction honeypot for safe containment and in-depth analysis of attacker TTPs.',
  },
  {
    title: 'Forensic Integrity',
    description:
      'Every detail of the attack is captured and secured on a tamper-proof blockchain ledger, ensuring reliable, immutable evidence.',
  },
  {
    title: 'Unified Visibility',
    description:
      'Security teams gain real-time insights through a single, intuitive dashboard, enabling faster, smarter decision-making.',
  },
];

export const WorkflowSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Streamlined Workflow, Enhanced Efficiency</SectionTitle>
      <SectionSubtitle>
        RAPHA transforms complex security operations into a simple, automated
        lifecycle.
      </SectionSubtitle>
      <WorkflowContainer>
        {steps.map((step, index) => (
          <WorkflowStep
            key={index}
            title={step.title}
            description={step.description}
            stepNumber={index + 1}
            isLast={index === steps.length - 1}
          />
        ))}
      </WorkflowContainer>
    </SectionContainer>
  );
};
