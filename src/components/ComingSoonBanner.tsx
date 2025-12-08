import styled, { keyframes } from 'styled-components';
import { breakpoints } from '../styles/breakpoints';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
`;

const BannerContainer = styled.div`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.15) 0%,
    rgba(6, 182, 212, 0.15) 100%
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  }
`;

const Badge = styled.span`
  background: ${({ theme }) => theme.gradients.primary};
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s ease-in-out infinite;

  ${breakpoints.tablet} {
    font-size: 13px;
    padding: 6px 16px;
  }
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 13px;
  font-weight: 500;
  margin: 0;
  text-align: center;

  ${breakpoints.tablet} {
    font-size: 15px;
  }
`;

const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.primary.main};
  font-weight: 700;
  text-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
`;

export const ComingSoonBanner: React.FC = () => {
  return (
    <BannerContainer>
      <Badge>Coming Soon</Badge>
      <Message>
        RAPHA is currently in <Highlight>development</Highlight>. Join our waitlist for early access!
      </Message>
    </BannerContainer>
  );
};
