import { Fragment } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';

/**
 * Homepage positioning/curiosity section (below the hero). Communicates the
 * conceptual difference between RAPHA and conventional detection WITHOUT
 * revealing model internals, architecture, algorithms, deployment details, or
 * any metrics. Positioning only.
 */

const Section = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.primary};
  position: relative;
  z-index: 2;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const Inner = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
`;

const Eyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 11px;
  font-weight: 700;
  color: #3fbf7f;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Headline = styled.h2`
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${breakpoints.tablet} {
    font-size: 42px;
  }
`;

const Body = styled.p`
  font-size: 17px;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  max-width: 760px;
  margin: 0 auto ${({ theme }) => theme.spacing['3xl']};
`;

const Sequence = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;

  ${breakpoints.tablet} {
    gap: 16px;
  }
`;

const Stepp = styled(motion.span)<{ $highlight?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1px solid
    ${({ $highlight, theme }) => ($highlight ? theme.colors.primary.main : theme.colors.neutral.border)};
  color: ${({ $highlight, theme }) =>
    $highlight ? theme.colors.primary.main : theme.colors.neutral.lightGray};
  background: ${({ $highlight }) => ($highlight ? 'rgba(0, 240, 255, 0.06)' : 'rgba(255,255,255,0.02)')};

  ${breakpoints.tablet} {
    font-size: 15px;
  }
`;

const Arrow = styled.span`
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  font-weight: bold;
`;

const STEPS = ['Detect', 'Decide', 'Redirect', 'Observe'];

export const CuriositySection: React.FC = () => {
  return (
    <Section id="how-rapha-thinks">
      <Inner>
        <Eyebrow>The RAPHA difference</Eyebrow>
        <Headline>Detection is not the end of the response.</Headline>
        <Body>
          Most security systems focus on identifying hostile behavior. RAPHA is designed to
          determine what happens next — autonomously redirecting hostile activity into controlled
          deception environments while preserving the organization's real systems.
        </Body>
        <Sequence aria-label="Detect, decide, redirect, observe">
          {STEPS.map((step, i) => (
            <Fragment key={step}>
              <Stepp
                $highlight={step === 'Redirect'}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                {step}
              </Stepp>
              {i < STEPS.length - 1 && <Arrow aria-hidden="true">→</Arrow>}
            </Fragment>
          ))}
        </Sequence>
      </Inner>
    </Section>
  );
};
