import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import { ParticleNetwork } from './ParticleNetwork';
import { HexagonalGrid } from './HexagonalGrid';
import { Logo } from './Logo';

interface HeroSectionProps {
  onWaitlistClick: () => void;
  onInvestorClick: () => void;
}

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  padding-top: calc(${({ theme }) => theme.spacing['4xl']} + 140px);
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(0, 240, 255, 0.1) 0%,
      transparent 50%
    );
    animation: pulse 8s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${({ theme }) => theme.gradients.mesh};
    opacity: 0.5;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1) rotate(0deg);
      opacity: 0.3;
    }
    50% {
      transform: scale(1.1) rotate(180deg);
      opacity: 0.5;
    }
  }

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
      theme.spacing['2xl']};
  }
`;

const HeroContent = styled(motion.div)`
  max-width: 1000px;
  text-align: center;
  position: relative;
  z-index: 1;
`;

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  font-size: 56px;
  line-height: 1.1;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 30px ${({ theme }) => theme.colors.primary.glow},
    0 0 60px ${({ theme }) => theme.colors.primary.glow};
  
  background: ${({ theme }) => theme.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  ${breakpoints.tablet} {
    font-size: 80px;
  }

  ${breakpoints.desktop} {
    font-size: 96px;
  }
`;

const SubHeadline = styled.h2`
  font-size: 24px;
  line-height: 1.3;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-shadow: 0 0 20px ${({ theme }) => theme.colors.primary.glow};

  ${breakpoints.tablet} {
    font-size: 32px;
  }

  ${breakpoints.desktop} {
    font-size: 40px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;

  ${breakpoints.tablet} {
    font-size: 18px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
  flex-wrap: wrap;

  ${breakpoints.tablet} {
    flex-direction: row;
  }
`;

const glitch = keyframes`
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
`;

const LogoContainer = styled(motion.div)`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  position: relative;
  display: flex;
  justify-content: center;
  
  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    right: -20px;
    bottom: -20px;
    background: radial-gradient(circle, rgba(0, 240, 255, 0.2) 0%, transparent 70%);
    filter: blur(20px);
    animation: ${glitch} 3s infinite;
  }
`;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWaitlistClick,
  onInvestorClick,
}) => {
  return (
    <HeroContainer>
      <ParticleNetwork />
      <HexagonalGrid />
      <HeroContent
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <LogoContainer
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
        >
          <Logo />
        </LogoContainer>
        <Headline>EmmaTech</Headline>
        <SubHeadline>
          Introducing RAPHA: The Future of Autonomous Cyber Defense
        </SubHeadline>
        <Description>
          (Real-time Autonomous Proactive Honeypot Architecture) A new class of
          high-assurance security, built on a resilient, decentralized
          architecture to protect your most critical assets. We are creating
          the foundation for trust, innovation, and long-term digital
          resilience.
        </Description>
        <CTAButtons>
          <Button variant="primary" onClick={onWaitlistClick}>
            Join Our Waitlist
          </Button>
          <Button variant="secondary" onClick={onInvestorClick}>
            Become an Investor
          </Button>
        </CTAButtons>
      </HeroContent>
    </HeroContainer>
  );
};
