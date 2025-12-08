import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from './Card';

interface CustomerSegmentProps {
  title: string;
  description: string;
  icon: string;
}

const StyledCard = styled(Card)`
  height: 100%;
  text-align: center;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    transform: scale(1.02);
  }
`;

const IconWrapper = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.h3};
  line-height: ${({ theme }) => theme.typography.lineHeight.h3};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary.main};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

export const CustomerSegment: React.FC<CustomerSegmentProps> = ({
  title,
  description,
  icon,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      <StyledCard>
        <IconWrapper>{icon}</IconWrapper>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </StyledCard>
    </motion.div>
  );
};
