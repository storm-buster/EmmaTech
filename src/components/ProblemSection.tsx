import styled from 'styled-components';
import { ProblemCard } from './ProblemCard';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) =>
    theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
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
    background: linear-gradient(135deg, rgba(255, 51, 102, 0.05) 0%, transparent 50%);
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
  position: relative;

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

const ProblemsGrid = styled.div`
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

const problems = [
  {
    headline: 'Catastrophic Breaches',
    description:
      'With over 4 in 10 small businesses breached annually and average costs reaching $4.45 million, the financial and reputational risks are unacceptable. Traditional defenses are failing.',
  },
  {
    headline: 'Architectural Single Point of Failure',
    description:
      'Centralized security platforms are a high-value target. A sophisticated attacker can disable your entire defense by targeting one central point, rendering your security useless.',
  },
  {
    headline: 'Crippling Compliance Burden',
    description:
      'Meeting intricate compliance demands requires immense time and capital, diverting focus and resources from core business goals and innovation.',
  },
];

export const ProblemSection: React.FC = () => {
  return (
    <SectionContainer>
      <SectionTitle>Today's Security Is Built on a Fragile Foundation</SectionTitle>
      <SectionSubtitle>
        Modern defenses have a critical flaw: centralization. We solve the core
        problems that keep security leaders awake at night.
      </SectionSubtitle>
      <ProblemsGrid>
        {problems.map((problem, index) => (
          <ProblemCard
            key={index}
            headline={problem.headline}
            description={problem.description}
            index={index}
          />
        ))}
      </ProblemsGrid>
    </SectionContainer>
  );
};
