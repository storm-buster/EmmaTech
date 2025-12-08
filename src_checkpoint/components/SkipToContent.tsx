import styled from 'styled-components';

const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.neutral.white};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) =>
  theme.spacing.md};
  text-decoration: none;
  z-index: 9999;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};

  &:focus {
    top: 0;
  }
`;

export const SkipToContent: React.FC = () => {
  return <SkipLink href="#main-content">Skip to main content</SkipLink>;
};
