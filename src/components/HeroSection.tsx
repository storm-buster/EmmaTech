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
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) =>
    theme.spacing.md};
  padding-top: calc(${({ theme }) => theme.spacing['3xl']} + 60px);
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;

  ${breakpoints.tablet} {
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
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing['2xl']};
  align-items: center;

  ${breakpoints.desktop} {
    grid-template-columns: 1.2fr 0.8fr;
  }
`;

const TextContent = styled(motion.div)`
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 60vh;
  position: relative;
  z-index: 2;
`;

const Headline = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.display};
  font-size: 32px;
  line-height: 1.1;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  letter-spacing: -0.02em;
  word-wrap: break-word;

  .word-wrapper {
    display: inline-block;
    overflow: hidden;
  }

  ${breakpoints.tablet} {
    font-size: 96px;
  }

  ${breakpoints.desktop} {
    font-size: 110px;
  }
`;

const SubHeadline = styled.h2`
  font-size: 12px;
  line-height: 1.4;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  letter-spacing: 0.2em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 16px;

  &::before {
    content: '';
    display: block;
    width: 40px;
    height: 1px;
    background: ${({ theme }) => theme.colors.neutral.mediumGray};
  }
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 500px;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  font-weight: 300;
  
  ${breakpoints.tablet} {
    font-size: 22px;
    margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  }
`;

const CTAButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`;

const VisualContent = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -50vw;
  width: 100vw;
  height: 100%;
  opacity: 0.04;
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${breakpoints.desktop} {
    position: relative;
    top: auto;
    left: auto;
    margin-left: 0;
    width: auto;
    height: auto;
    opacity: 1;
    z-index: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const LogoWrapper = styled.div`
  width: 100%;
  max-width: 650px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWaitlistClick,
  onInvestorClick,
}) => {
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
            <Logo />
          </LogoWrapper>
        </VisualContent>
      </ContentWrapper>
    </HeroContainer>
  );
};
