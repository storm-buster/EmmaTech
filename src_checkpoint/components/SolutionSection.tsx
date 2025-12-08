import styled from 'styled-components';
import { FeatureCard } from './FeatureCard';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  clip-path: polygon(0 0, 100% 5%, 100% 100%, 0 95%);
  margin: -80px 0;
  padding-top: calc(${({ theme }) => theme.spacing['4xl']} + 80px);
  padding-bottom: calc(${({ theme }) => theme.spacing['4xl']} + 80px);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 20%, rgba(0, 240, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  ${breakpoints.tablet} {
    padding-left: ${({ theme }) => theme.spacing['2xl']};
    padding-right: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: ${({ theme }) => theme.gradients.primary};
    margin: ${({ theme }) => theme.spacing.lg} auto 0;
    border-radius: 2px;
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.tablet} {
    font-size: 20px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

const features = [
  {
    headline: 'Decentralized Architecture',
    description:
      'An autonomous network of agents ensures there is no single point of failure, providing unmatched operational resilience and survivability.',
    icon: '🔗',
  },
  {
    headline: 'ML-Powered Detection',
    description:
      'Proactively hunts for known and unknown threats, acting as an intelligent trigger for automated, real-time responses.',
    icon: '🤖',
  },
  {
    headline: 'Dynamic Full-System Honeypots',
    description:
      'Lures attackers into fully interactive virtual machine decoys to capture the richest possible forensic data for deep analysis.',
    icon: '🍯',
  },
  {
    headline: 'Tamper-Proof Blockchain Logging',
    description:
      'Creates an immutable audit trail of all security events, guaranteeing evidence integrity for compliance, legal, and recovery needs.',
    icon: '⛓️',
  },
];

export const SolutionSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Our Solution: A New Paradigm in Security</SectionTitle>
      <SectionSubtitle>
        RAPHA is not an incremental improvement—it's a fundamentally different
        approach. We are the first to unify four breakthrough innovations into
        one platform.
      </SectionSubtitle>
      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            headline={feature.headline}
            description={feature.description}
            icon={feature.icon}
            index={index}
          />
        ))}
      </FeaturesGrid>
    </SectionContainer>
  );
};
