import styled from 'styled-components';
import { motion } from 'framer-motion';
import { breakpoints } from '../styles/breakpoints';
import { roles } from '../data/careersData';

const BannerContainer = styled.section`
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.lg};
  background: rgba(63, 191, 127, 0.04);
  border-top: 1px solid rgba(63, 191, 127, 0.1);
  border-bottom: 1px solid rgba(63, 191, 127, 0.1);

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['2xl']};
  }
`;

const Inner = styled(motion.div)`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  text-align: center;

  ${breakpoints.tablet} {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
  }
`;

const TextBlock = styled.div``;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: 4px;
  text-transform: none;
  letter-spacing: 0;

  ${breakpoints.tablet} {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const JoinLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #3FBF7F;
  border: 1px solid rgba(63, 191, 127, 0.3);
  background: rgba(63, 191, 127, 0.08);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(63, 191, 127, 0.15);
    border-color: rgba(63, 191, 127, 0.5);
    transform: translateY(-1px);
    color: #3FBF7F;
  }
`;

export const HiringBanner: React.FC = () => (
  <BannerContainer>
    <Inner
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <TextBlock>
        <Title>We're hiring — {roles.length} open roles</Title>
        <Subtitle>Join the founding team building autonomous cyber-defense.</Subtitle>
      </TextBlock>
      <JoinLink href="#/careers">
        Join the founding team →
      </JoinLink>
    </Inner>
  </BannerContainer>
);
