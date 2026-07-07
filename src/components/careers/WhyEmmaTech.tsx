import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
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
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: block;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};

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

const CardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }

  ${breakpoints.desktop} {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const Card = styled(motion.div)`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: rgba(226, 232, 240, 0.15);
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const CardIcon = styled.div`
  font-size: 28px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-transform: none;
`;

const CardDesc = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const missionCards = [
  {
    icon: '⚡',
    title: 'The Problem',
    desc: 'Threats move faster than human defenders. Legacy tools alert; they don\'t act. Attackers win by default.',
  },
  {
    icon: '🛡️',
    title: 'Our Approach',
    desc: 'RAPHA uses behavioral baselines and autonomous detection to catch zero-days — with forensic-grade, hash-chained evidence.',
  },
  {
    icon: '📈',
    title: 'The Opportunity',
    desc: 'Founding-team equity, real ownership, and the chance to shape a category-defining product from day one.',
  },
  {
    icon: '🚀',
    title: 'How We Work',
    desc: 'Small, senior, high-trust. Ship fast, iterate faster. No layers, no politics — just impact.',
  },
];

export const WhyEmmaTech: React.FC = () => {
  return (
    <SectionContainer>
      <SectionPrefix>§01 / WHY EMMATECH</SectionPrefix>
      <SectionTitle>Why EmmaTech</SectionTitle>
      <CardsGrid>
        {missionCards.map((card, i) => (
          <Card
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <CardIcon>{card.icon}</CardIcon>
            <CardTitle>{card.title}</CardTitle>
            <CardDesc>{card.desc}</CardDesc>
          </Card>
        ))}
      </CardsGrid>
    </SectionContainer>
  );
};
