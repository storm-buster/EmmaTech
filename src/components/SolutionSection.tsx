import styled from 'styled-components';
import { motion } from 'framer-motion';
import { SpotlightCard } from './react-bits/SpotlightCard';
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
  z-index: 2;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 20%, rgba(45, 226, 230, 0.05) 0%, transparent 50%);
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

const CardContent = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const IconWrapper = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  filter: drop-shadow(0 0 10px ${({ theme }) => theme.colors.primary.glow});
`;

const Headline = styled.h3`
  font-size: 22px;
  line-height: 1.3;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  letter-spacing: 0.02em;
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
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
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <SpotlightCard spotlightColor="rgba(255, 255, 255, 0.03)">
              <CardContent>
                <IconWrapper>{feature.icon}</IconWrapper>
                <Headline>{feature.headline}</Headline>
                <Description>{feature.description}</Description>
              </CardContent>
            </SpotlightCard>
          </motion.div>
        ))}
      </FeaturesGrid>
    </SectionContainer>
  );
};
