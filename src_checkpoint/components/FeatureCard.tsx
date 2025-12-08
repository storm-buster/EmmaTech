import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';

interface FeatureCardProps {
  headline: string;
  description: string;
  icon: string;
  index: number;
}

const StyledCard = styled(Card)`
  height: 100%;
  text-align: center;
`;

const IconWrapper = styled.div`
  font-size: 56px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  filter: drop-shadow(0 0 10px ${({ theme }) => theme.colors.primary.glow});
`;

const Headline = styled.h3`
  font-size: 22px;
  line-height: 1.3;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

const Description = styled.p`
  font-size: 16px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

export const FeatureCard: React.FC<FeatureCardProps> = ({
  headline,
  description,
  icon,
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
        <IconWrapper>{icon}</IconWrapper>
        <Headline>{headline}</Headline>
        <Description>{description}</Description>
      </StyledCard>
    </motion.div>
  );
};
