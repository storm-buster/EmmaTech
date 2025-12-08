import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div`
  display: inline-block;
`;

const Spinner = styled.div<{ $size: 'small' | 'medium' | 'large' }>`
  border: ${({ $size }) => ($size === 'small' ? '2px' : $size === 'medium' ? '3px' : '4px')}
    solid ${({ theme }) => theme.colors.neutral.lightGray};
  border-top: ${({ $size }) => ($size === 'small' ? '2px' : $size === 'medium' ? '3px' : '4px')}
    solid ${({ theme }) => theme.colors.primary.main};
  border-radius: 50%;
  width: ${({ $size }) => ($size === 'small' ? '16px' : $size === 'medium' ? '32px' : '48px')};
  height: ${({ $size }) => ($size === 'small' ? '16px' : $size === 'medium' ? '32px' : '48px')};
  animation: ${spin} 0.8s linear infinite;
`;

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
}) => {
  return (
    <SpinnerContainer role="status" aria-label="Loading">
      <Spinner $size={size} />
    </SpinnerContainer>
  );
};
