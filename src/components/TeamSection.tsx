import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  position: relative;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
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

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};
  max-width: 1000px;
  margin: 0 auto;
  text-align: left;

  ${breakpoints.tablet} {
    grid-template-columns: 0.8fr 1.2fr;
    align-items: stretch;
  }
`;

const FounderCard = styled(Card)`
  padding: ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ theme }) => theme.gradients.primary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
  box-shadow: 0 0 20px ${({ theme }) => theme.colors.primary.glow};
`;

const FounderName = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: 4px;
`;

const FounderTitle = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.primary.main};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 24px;
`;

const BioContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  justify-content: center;
`;

const BioText = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const HighlightBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: rgba(63, 191, 127, 0.05);
  border: 1px dashed rgba(63, 191, 127, 0.2);
  border-radius: 8px;
  color: #3FBF7F;
  font-size: 14px;
  line-height: 1.6;
  font-weight: 500;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

export const TeamSection: React.FC = () => {
  return (
    <SectionContainer id="team">
      <SectionPrefix>§05 / TEAM</SectionPrefix>
      <SectionTitle>Team</SectionTitle>
      <SectionSubtitle>
        <HighlightSub>Solo founder. Hands on every layer.</HighlightSub>
      </SectionSubtitle>

      <TeamGrid>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          style={{ display: 'flex' }}
        >
          <FounderCard>
            <Avatar>👨‍💻</Avatar>
            <FounderName>Avinash Yaduvanshi</FounderName>
            <FounderTitle>Founder · CEO</FounderTitle>
            <Button
              variant="primary"
              onClick={() => window.open('mailto:adamas.avinash@gmail.com')}
            >
              Email Avinash
            </Button>
          </FounderCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ display: 'flex' }}
        >
          <BioContainer>
            <BioText>
              I'm building RAPHA because Indian SMEs especially fintechs and NBFCs are forced to choose between paying for enterprise tooling they can't afford or going undefended.
            </BioText>
            <BioText>
              The Windows sensor agent is live, behavioral telemetry is being collected, and the Isolation Forest baseline is being calibrated. Next: honeypot redirection and the first pilot in a regulated fintech.
            </BioText>
            <HighlightBox>
              Currently hiring a technical co-founder (ML / data engineering) on equity. If you've built anomaly detection at scale — let's talk.
            </HighlightBox>
          </BioContainer>
        </motion.div>
      </TeamGrid>
    </SectionContainer>
  );
};
