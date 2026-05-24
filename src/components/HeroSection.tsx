import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import { FluidBackground } from './react-bits/FluidBackground';
import { SplitText } from './react-bits/SplitText';
import { Magnet } from './react-bits/Magnet';
import { Logo } from './Logo';

interface HeroSectionProps {
  onWaitlistClick: () => void;
  onInvestorClick: () => void;
}

const HeroContainer = styled.section`
  min-height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) =>
    theme.spacing.md};
  padding-top: calc(70px + 40px + ${({ theme }) => theme.spacing.sm});
  padding-bottom: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;

  ${breakpoints.tablet} {
    min-height: 100vh;
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing['2xl']};
    padding-top: calc(${({ theme }) => theme.spacing['4xl']} + 60px);
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  width: 100%;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: flex-start;

  ${breakpoints.desktop} {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: ${({ theme }) => theme.spacing['2xl']};
    align-items: center;
  }
`;

const TextContent = styled(motion.div)`
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: auto;
  position: relative;
  z-index: 2;

  ${breakpoints.desktop} {
    justify-content: flex-end;
    min-height: 60vh;
  }
`;

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  font-size: 28px;
  line-height: 1.15;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  letter-spacing: -0.02em;
  word-wrap: break-word;

  .word-wrapper {
    display: inline-block;
    overflow: hidden;
  }

  ${breakpoints.tablet} {
    font-size: 96px;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
  }

  ${breakpoints.desktop} {
    font-size: 110px;
  }
`;

const SubHeadline = styled.h2`
  font-size: 11px;
  line-height: 1.4;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 12px;

  &::before {
    content: '';
    display: block;
    width: 30px;
    height: 1px;
    background: ${({ theme }) => theme.colors.neutral.mediumGray};
  }

  ${breakpoints.tablet} {
    font-size: 12px;
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    gap: 16px;

    &::before {
      width: 40px;
    }
  }
`;

const Description = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  max-width: 500px;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-weight: 300;
  
  ${breakpoints.tablet} {
    font-size: 22px;
    line-height: 1.6;
    margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-direction: column;

  & > * {
    display: block;
    width: 100%;
    max-width: 300px;
  }

  & > * > div,
  & > * button {
    width: 100%;
  }

  ${breakpoints.tablet} {
    flex-direction: row;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.spacing.md};

    & > * {
      display: inline-block;
      width: auto;
      max-width: none;
    }

    & > * > div,
    & > * button {
      width: auto;
    }
  }
`;

const VisualContent = styled(motion.div)`
  display: none;
  pointer-events: none;
  
  ${breakpoints.desktop} {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    width: auto;
    height: auto;
    opacity: 1;
    z-index: 1;
  }
`;

const LogoWrapper = styled.div`
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;

  ${breakpoints.tablet} {
    width: 280px;
    height: 280px;
  }

  ${breakpoints.desktop} {
    width: 100%;
    max-width: 650px;
    height: auto;
    aspect-ratio: 1;
  }
`;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWaitlistClick,
  onInvestorClick,
}) => {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const check = () => setIsMobile(window.innerWidth < 1024);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }
  }, []);

  return (
    <HeroContainer>
      <FluidBackground />
      <ContentWrapper>
        <TextContent
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <SubHeadline>
            Autonomous Defense System
          </SubHeadline>
          <Headline>
            <SplitText text="Silence the Noise." delay={0.4} />
            <br />
            <SplitText text="Secure the Future." delay={0.6} />
          </Headline>
          <Description>
            RAPHA represents a paradigm shift in cybersecurity.
            High-assurance protection for the decentralized age.
          </Description>
          <CTAButtons>
            <Magnet>
              <Button variant="primary" onClick={onWaitlistClick}>
                Request Access
              </Button>
            </Magnet>
            <Magnet>
              <Button variant="secondary" onClick={onInvestorClick}>
                View Documentation
              </Button>
            </Magnet>
          </CTAButtons>
        </TextContent>

        <VisualContent
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
        >
          <LogoWrapper>
            <Logo hideText={isMobile} />
          </LogoWrapper>
        </VisualContent>
      </ContentWrapper>
    </HeroContainer>
  );
};
