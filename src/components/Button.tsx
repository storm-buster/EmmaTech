import styled from 'styled-components';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const StyledButton = styled.button<{ $variant: 'primary' | 'secondary' }>`
  padding: 16px 48px;
  font-size: 16px;
  font-weight: 600;
  font-family: ${({ theme }) => theme.typography.fontFamily.primary};
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;

  ${({ theme, $variant }) =>
    $variant === 'primary'
      ? `
    background: ${theme.gradients.primary};
    color: ${theme.colors.neutral.white};
    border: 2px solid ${theme.colors.primary.main};
    box-shadow: ${theme.shadows.glow};

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: ${theme.shadows.glowLarge};
      border-color: ${theme.colors.primary.light};
    }

    &:hover:not(:disabled)::before {
      left: 100%;
    }
  `
      : `
    background: transparent;
    color: ${theme.colors.primary.main};
    border: 2px solid ${theme.colors.primary.main};
    box-shadow: inset 0 0 0 0 ${theme.colors.primary.main};

    &:hover:not(:disabled) {
      color: ${theme.colors.background.primary};
      box-shadow: inset 0 0 0 50px ${theme.colors.primary.main}, ${theme.shadows.glow};
      transform: translateY(-2px);
    }
  `}

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 4px;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  ...props
}) => {
  return (
    <StyledButton $variant={variant} {...props}>
      {children}
    </StyledButton>
  );
};
