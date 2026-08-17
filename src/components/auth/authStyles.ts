import styled from 'styled-components';

export const AuthPage = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['3xl']};
  background: ${({ theme }) => theme.colors.background.primary};
`;

export const AuthCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  padding: ${({ theme }) => theme.spacing['2xl']};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

export const AuthTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const AuthSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

export const Input = styled.input`
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 15px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
  }
`;

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: 13px;
  margin: 0;
`;

export const MutedRow = styled.p`
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-align: center;
`;

export const LinkButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary.main};
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  text-decoration: underline;
`;

/** Full-width provider button (Continue with Google / Microsoft). */
export const OAuthButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 12px 14px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary.main};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 2px;
  }
`;

export const OAuthList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

/** Horizontal "OR" divider between OAuth and email/password. */
export const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: ${({ theme }) => theme.spacing.md} 0;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.neutral.border};
  }
`;

/** Small badge showing the plan the user is signing up for. */
export const PlanBadge = styled.span`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(0, 240, 255, 0.1);
  margin-left: ${({ theme }) => theme.spacing.xs};
`;
