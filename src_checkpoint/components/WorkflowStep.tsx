import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';

interface WorkflowStepProps {
  title: string;
  description: string;
  stepNumber: number;
  isLast: boolean;
}

const StepContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  flex: 1;
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.neutral.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.h3};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  z-index: 2;
`;

import { keyframes } from 'styled-components';

const dataFlow = keyframes`
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
`;

const Connector = styled.div<{ $isLast: boolean }>`
  display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
  position: absolute;
  top: 30px;
  left: 50%;
  width: 100%;
  height: 3px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primary.main} 0%,
    transparent 50%,
    ${({ theme }) => theme.colors.primary.main} 100%
  );
  background-size: 200% 100%;
  animation: ${dataFlow} 2s linear infinite;
  z-index: 1;
  filter: drop-shadow(0 0 4px ${({ theme }) => theme.colors.primary.glow});

  ${breakpoints.tablet} {
    display: ${({ $isLast }) => ($isLast ? 'none' : 'block')};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    display: none;
  }
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.h3};
  line-height: ${({ theme }) => theme.typography.lineHeight.h3};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

export const WorkflowStep: React.FC<WorkflowStepProps> = ({
  title,
  description,
  stepNumber,
  isLast,
}) => {
  return (
    <StepContainer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: stepNumber * 0.1 }}
    >
      <StepNumber>{stepNumber}</StepNumber>
      {!isLast && <Connector $isLast={isLast} />}
      <Title>{title}</Title>
      <Description>{description}</Description>
    </StepContainer>
  );
};
