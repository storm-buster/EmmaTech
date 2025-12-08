import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';

interface ProblemCardProps {
  headline: string;
  description: string;
  index: number;
}

const StyledCard = styled(Card)`
  height: 100%;
`;

const Headline = styled.h3`
  font-size: 24px;
  line-height: 1.3;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.semantic.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-shadow: 0 0 10px rgba(255, 51, 102, 0.3);
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

export const ProblemCard: React.FC<ProblemCardProps> = ({
  headline,
  description,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <StyledCard>
        <Headline>{headline}</Headline>
        <Description>{description}</Description>
      </StyledCard>
    </motion.div>
  );
};
