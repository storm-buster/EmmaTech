import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';
import { Logo } from './Logo';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  overflow: hidden;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }

  &::before {
    content: '';
    position: absolute;
    top: 20%;
    right: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }
`;

const ContentGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing['3xl']};
  position: relative;
  z-index: 1;

  ${breakpoints.tablet} {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
`;

const TextContent = styled(motion.div)`
  order: 2;

  ${breakpoints.tablet} {
    order: 1;
  }
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: ${({ theme }) => theme.gradients.primary};
    margin-top: ${({ theme }) => theme.spacing.md};
    border-radius: 2px;
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${breakpoints.tablet} {
    font-size: 18px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.xl};
`;

const StatItem = styled(motion.div)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.card};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
  }
`;

const StatNumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary.main};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  margin-bottom: ${({ theme }) => theme.spacing.xs};

  ${breakpoints.tablet} {
    font-size: 40px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;

  ${breakpoints.tablet} {
    font-size: 14px;
  }
`;

const WatermarkContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 50%;
  margin-left: -50vw;
  width: 100vw;
  height: 100%;
  opacity: 0.01;
  z-index: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;

  ${breakpoints.tablet} {
    display: none;
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

const ImageContainer = styled(motion.div)`
  order: 1;
  display: none;
  justify-content: center;
  align-items: center;
  position: relative;

  ${breakpoints.tablet} {
    display: flex;
    order: 2;
  }
`;

const TechVisualization = styled.div`
  width: 280px;
  height: 280px;
  position: relative;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  ${breakpoints.tablet} {
    width: 350px;
    height: 350px;
  }

  &::before {
    content: '';
    position: absolute;
    width: 70%;
    height: 70%;
    border: 2px solid ${({ theme }) => theme.colors.primary.main};
    border-radius: 50%;
    opacity: 0.3;
    animation: rotate 20s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 40%;
    height: 40%;
    border: 2px solid ${({ theme }) => theme.colors.secondary.main};
    border-radius: 50%;
    opacity: 0.5;
    animation: rotate 15s linear infinite reverse;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const CenterIcon = styled.div`
  font-size: 64px;
  z-index: 1;
  filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5));

  ${breakpoints.tablet} {
    font-size: 80px;
  }
`;

const stats = [
  { number: 'Live', label: 'Product Status' },
  { number: 'P2P', label: 'Network Architecture' },
  { number: 'High', label: 'Assurance Level' },
  { number: '24/7', label: 'Autonomous Defense' },
];

export const AboutSection: React.FC = () => {
  return (
    <SectionContainer id="about">
      <WatermarkContainer
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 0.01, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <LogoWrapper>
          <Logo />
        </LogoWrapper>
      </WatermarkContainer>
      <ContentGrid>
        <TextContent
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <SectionTitle>About EmmaTech™</SectionTitle>
          <Description>
            Founded by cybersecurity experts, EmmaTech™ is pioneering the next
            generation of autonomous cyber defense systems. Our mission is to
            create unbreachable digital fortresses through innovative
            decentralized security architecture.
          </Description>
          <Description>
            RAPHA™ represents years of research in machine learning, blockchain
            technology, and advanced threat detection. We're not just building
            another security tool – we're revolutionizing how organizations
            defend against cyber threats.
          </Description>

          <StatsGrid>
            {stats.map((stat, index) => (
              <StatItem
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatItem>
            ))}
          </StatsGrid>
        </TextContent>

        <ImageContainer
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <TechVisualization>
            <CenterIcon>🛡️</CenterIcon>
          </TechVisualization>
        </ImageContainer>
      </ContentGrid>
    </SectionContainer>
  );
};
