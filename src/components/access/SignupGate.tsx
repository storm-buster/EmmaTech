import styled from 'styled-components';
import { Button } from '../Button';
import { breakpoints } from '../../styles/breakpoints';

/**
 * Access-controlled notice shown when an ANONYMOUS visitor navigates directly to
 * the signup route. RAPHA is now private-access: there is no public self-service
 * sign-up. This preserves the underlying SignupPage component (still used by the
 * authenticated/approved onboarding flow) while ensuring no anonymous public path
 * reaches new RAPHA tenant provisioning. Existing customers use Sign In.
 */

interface SignupGateProps {
  onRequestAccess: () => void;
  onSignIn: () => void;
}

const Page = styled.section`
  max-width: 640px;
  margin: 0 auto;
  padding: 160px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['4xl']};
  text-align: center;

  ${breakpoints.tablet} {
    padding: 180px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Eyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 12px;
  font-weight: 700;
  color: #3fbf7f;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Body = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;
  justify-content: center;

  ${breakpoints.tablet} {
    flex-direction: row;
  }
`;

export function SignupGate({ onRequestAccess, onSignIn }: SignupGateProps) {
  return (
    <Page>
      <Eyebrow>RAPHA · Private Deployment</Eyebrow>
      <Title>Access is by request</Title>
      <Body>
        RAPHA is not available through public self-service sign-up. Organizations are reviewed
        individually for deployment fit. Request private access to begin, or sign in if you already
        have an account.
      </Body>
      <Actions>
        <Button variant="primary" onClick={onRequestAccess} aria-label="Request private access to RAPHA">
          Request Private Access
        </Button>
        <Button variant="secondary" onClick={onSignIn} aria-label="Sign in to your account">
          Sign In
        </Button>
      </Actions>
    </Page>
  );
}
