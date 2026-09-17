import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { SplitText } from './react-bits/SplitText';
import { Magnet } from './react-bits/Magnet';
import { Logo } from './Logo';
import { breakpoints } from '../styles/breakpoints';

interface HeroSectionProps {
  onRequestAccess: () => void;
  onExplore: () => void;
}

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 150px ${({ theme }) => theme.spacing.lg} 80px;
  background: ${({ theme }) => theme.colors.background.primary};

  ${breakpoints.tablet} {
    padding: 170px ${({ theme }) => theme.spacing['2xl']} 100px;
  }
`;

const ContentGrid = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing['3xl']};
  width: 100%;
  position: relative;
  z-index: 2;

  ${breakpoints.desktop} {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: center;
  }
`;

const TextContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  ${breakpoints.desktop} {
    align-items: flex-start;
    text-align: left;
  }
`;

const SubHeadline = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};

  ${breakpoints.tablet} {
    font-size: 16px;
  }
`;

const Headline = styled.h1`
  font-size: 42px;
  line-height: 1.1;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  letter-spacing: -1px;

  ${breakpoints.tablet} {
    font-size: 64px;
  }

  ${breakpoints.desktop} {
    font-size: 72px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;

  ${breakpoints.tablet} {
    font-size: 18px;
  }
`;

const CTAButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 400px;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};

  ${breakpoints.tablet} {
    flex-direction: row;
    max-width: none;
    justify-content: center;
  }

  ${breakpoints.desktop} {
    justify-content: flex-start;
  }
`;

const VisualContent = styled(motion.div)`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const BrandWatermark = styled(motion.div)`
  position: absolute;
  top: 15%;
  left: 5%;
  font-size: 70px;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.neutral.white};
  opacity: 0.02;
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  pointer-events: none;
  user-select: none;
  z-index: 1;
  display: none;

  ${breakpoints.desktop} {
    display: block;
    font-size: 140px;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  animation: pulse 4s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 15px rgba(0, 240, 255, 0.1));
    }
    50% {
      transform: scale(1.03);
      filter: drop-shadow(0 0 30px rgba(0, 240, 255, 0.25));
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 800px;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(4, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }
`;

const StatItem = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 4px 20px rgba(0, 240, 255, 0.1);
  }
`;

const StatNumber = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  margin-bottom: 4px;

  ${breakpoints.tablet} {
    font-size: 36px;
  }
`;

const StatLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  line-height: 1.3;
`;

const BadgeTicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(63, 191, 127, 0.1);
  border: 1px solid rgba(63, 191, 127, 0.2);
  border-radius: 20px;
  color: #3FBF7F;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const AccessNote = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  border-left: 2px solid ${({ theme }) => theme.colors.primary.main};
  padding-left: 12px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 520px;
  text-align: left;
`;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onRequestAccess,
  onExplore,
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  return (
    <HeroContainer>
      {!isMobile && (
        <BrandWatermark
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 0.02, x: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          EmmaTech™
        </BrandWatermark>
      )}
      <ContentGrid>
        <TextContent
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <BadgeTicker>
            autonomous · behavioral · india-built
          </BadgeTicker>
          <SubHeadline>
            RAPHA · Realtime Autonomous Protection & Honeypot Architecture
          </SubHeadline>
          <Headline>
            <SplitText text="Autonomous Cyber Defense." delay={0.4} />
            <br />
            <SplitText text="Privately Deployed." delay={0.6} />
          </Headline>
          <Description>
            RAPHA detects hostile behavior and autonomously redirects threats into controlled
            deception environments — without requiring a human in the loop for every response. Built
            for organizations facing meaningful security risk.
          </Description>
          <AccessNote>
            Private deployment only. Organizations are evaluated individually for deployment fit.
          </AccessNote>
          <CTAButtons>
            <Magnet>
              <Button variant="primary" onClick={onRequestAccess}>
                Request Private Access
              </Button>
            </Magnet>
            <Magnet>
              <Button variant="secondary" onClick={onExplore}>
                Explore RAPHA
              </Button>
            </Magnet>
          </CTAButtons>

          <StatsGrid>
            <StatItem
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <StatNumber>0</StatNumber>
              <StatLabel>human actions required for autonomous response</StatLabel>
            </StatItem>
          </StatsGrid>
        </TextContent>

        <VisualContent
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <LogoWrapper>
            <Logo />
          </LogoWrapper>
        </VisualContent>
      </ContentGrid>
    </HeroContainer>
  );
};
