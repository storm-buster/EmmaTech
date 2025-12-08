import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';

const SectionContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background.secondary};
  position: relative;
  text-align: center;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['4xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const SectionTitle = styled.h2`
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};

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

const Message = styled(motion.p)`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  max-width: 600px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};

  ${breakpoints.tablet} {
    font-size: 20px;
  }
`;

export const TeamSection: React.FC = () => {
  return (
    <SectionContainer id="team">
      <SectionTitle>Meet Our Team</SectionTitle>
      <Message
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        We will introduce you to our team as soon as possible.
      </Message>
    </SectionContainer>
  );
};
