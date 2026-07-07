import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  position: relative;
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const Inner = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
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
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  line-height: 1.2;

  ${breakpoints.tablet} {
    font-size: 40px;
  }
`;

const Paragraph = styled.p`
  font-size: 16px;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${breakpoints.tablet} {
    font-size: 18px;
  }

  strong {
    color: ${({ theme }) => theme.colors.neutral.white};
    font-weight: 600;
  }

  em {
    color: #3FBF7F;
    font-style: normal;
  }
`;

export const FoundingStage: React.FC = () => {
  return (
    <SectionContainer>
      <Inner
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <SectionPrefix>§02 / FOUNDING STAGE</SectionPrefix>
        <Title>What it's like to join at the founding stage</Title>
        <Paragraph>
          We're pre-seed, forming the founding team. That means <strong>real equity</strong> — not a token grant, 
          but meaningful ownership that reflects your role in building this from zero. It also means 
          <strong> ambiguity</strong>: job descriptions are starting points, not boundaries. You'll wear multiple hats, 
          make decisions with incomplete information, and ship things that matter within your first week.
        </Paragraph>
        <Paragraph>
          You'll work <em>directly with the founder</em>. No middle management, no approval chains. If you've 
          been waiting for the right moment to do the best work of your career — with people who care as 
          deeply as you do — this is it.
        </Paragraph>
      </Inner>
    </SectionContainer>
  );
};
