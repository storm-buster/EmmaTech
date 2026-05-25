import styled, { keyframes } from 'styled-components';
import { breakpoints } from '../styles/breakpoints';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.75;
  }
`;

const BannerContainer = styled.div`
  position: fixed;
  top: 64px; /* Sits perfectly below navbar on mobile */
  left: 0;
  right: 0;
  background: linear-gradient(
    90deg,
    rgba(63, 191, 127, 0.12) 0%,
    rgba(0, 240, 255, 0.08) 100%
  );
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(63, 191, 127, 0.25);
  padding: 8px 12px;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${breakpoints.tablet} {
    top: 70px; /* Sits perfectly below navbar on desktop */
    padding: 10px 24px;
    gap: 12px;
  }
`;

const Badge = styled.span`
  background: linear-gradient(135deg, #3FBF7F 0%, #10B981 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: ${pulse} 2s ease-in-out infinite;
  flex-shrink: 0;

  ${breakpoints.tablet} {
    font-size: 12px;
    padding: 6px 14px;
  }
`;

const Message = styled.p`
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 12px;
  font-weight: 500;
  margin: 0;
  text-align: center;
  line-height: 1.4;

  ${breakpoints.tablet} {
    font-size: 14px;
  }
`;

const Highlight = styled.span`
  color: #3FBF7F;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(63, 191, 127, 0.3);
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
