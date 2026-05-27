import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  clip-path: polygon(0 5%, 100% 0, 100% 95%, 0 100%);
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
    background: linear-gradient(135deg, rgba(63, 191, 127, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  ${breakpoints.tablet} {
    padding-left: ${({ theme }) => theme.spacing['2xl']};
    padding-right: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionPrefix = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: #3FBF7F;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: block;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;

  &::after {
    content: '';
    display: block;
    width: 80px;
    height: 4px;
    background: ${({ theme }) => theme.gradients.primary};
    margin: ${({ theme }) => theme.spacing.lg} auto 0;
    border-radius: 2px;
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const SectionSubtitle = styled.div`
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const HighlightSub = styled.h3`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 600;
`;

const SubText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyLarge};
  line-height: ${({ theme }) => theme.typography.lineHeight.bodyLarge};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const ComplianceGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

const ComplianceCard = styled(Card)`
  height: 100%;
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 8px 24px rgba(0, 240, 255, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h4`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
`;

const CardBadge = styled.span`
  background: rgba(0, 240, 255, 0.1);
  border: 1px solid rgba(0, 240, 255, 0.2);
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
`;

const CardDescription = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  text-align: left;
`;

const marqueeAnim = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

const MarqueeContainer = styled.div`
  margin-top: 60px;
  overflow: hidden;
  width: 100%;
  position: relative;
  background: rgba(255, 255, 255, 0.01);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 18px 0;
`;

const MarqueeTrack = styled.div`
  display: flex;
  width: max-content;
  animation: ${marqueeAnim} 20s linear infinite;
`;

const MarqueeItem = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 40px;
  display: inline-flex;
  align-items: center;

  &::after {
    content: '•';
    color: ${({ theme }) => theme.colors.primary.main};
    margin-left: 80px;
  }
`;

const complianceItems = [
  {
    id: 'RBI',
    badge: 'Cybersecurity Framework',
    description: 'Real-time monitoring, incident response, forensic audit trail RAPHA maps directly to the RBI master direction on IT governance for NBFCs.',
  },
  {
    id: 'DPDP',
    badge: 'Privacy Act 2023',
    description: 'Per-device baseline + federated training means personal data never leaves the data fiduciary\'s machine. Privacy by design.',
  },
  {
    id: 'SEBI',
    badge: 'Circular 2024',
    description: 'Tamper-proof SHA-256 hash chains and exportable forensic timelines satisfy SEBI\'s audit-trail mandate for capital market entities.',
  },
];

const marqueeStandards = [
  'ISO 27001 ready',
  'DPDP Act 2023',
  'RBI master direction',
  'SEBI 2024 circular',
  'CERT-In aligned',
  'Made in India',
  'On-prem option',
  'Federated learning',
  'SOC 2 roadmap',
];

export const ProblemSection: React.FC = () => {
  return (
    <SectionContainer id="compliance">
      <SectionPrefix>§03 / COMPLIANCE</SectionPrefix>
      <SectionTitle>Compliance & GTM</SectionTitle>
      <SectionSubtitle>
        <HighlightSub>Compliance is not a feature. It's our wedge.</HighlightSub>
        <SubText>
          Regulated fintechs and NBFCs aren't asking "do I need security?" They're asking "how do I pass the next audit without paying enterprise prices?"
        </SubText>
      </SectionSubtitle>

      <ComplianceGrid>
        {complianceItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ComplianceCard>
              <CardHeader>
                <CardTitle>{item.id}</CardTitle>
                <CardBadge>{item.badge}</CardBadge>
              </CardHeader>
              <CardDescription>{item.description}</CardDescription>
            </ComplianceCard>
          </motion.div>
        ))}
      </ComplianceGrid>

      <MarqueeContainer>
        <MarqueeTrack>
          {/* Double array for infinite seamless looping */}
          {[...marqueeStandards, ...marqueeStandards].map((standard, index) => (
            <MarqueeItem key={index}>{standard}</MarqueeItem>
          ))}
        </MarqueeTrack>
      </MarqueeContainer>
    </SectionContainer>
  );
};
