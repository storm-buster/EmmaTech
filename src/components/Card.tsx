import styled from 'styled-components';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

import { keyframes } from 'styled-components';

const borderRotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledCard = styled.div`
  background: ${({ theme }) => theme.gradients.card};
  backdrop-filter: blur(10px);
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      ${({ theme }) => theme.colors.primary.main} 60deg,
      transparent 120deg
    );
    opacity: 0;
    transition: opacity 0.4s;
    animation: ${borderRotate} 4s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    background: ${({ theme }) => theme.gradients.card};
    border-radius: 15px;
    z-index: 0;
  }

  & > * {
    position: relative;
    z-index: 1;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: ${({ theme }) => theme.shadows.cardHover};
    border-color: ${({ theme }) => theme.colors.primary.main};
  }

  &:hover::before {
    opacity: 0.8;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`;

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return <StyledCard className={className}>{children}</StyledCard>;
};
