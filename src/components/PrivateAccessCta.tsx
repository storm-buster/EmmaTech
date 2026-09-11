import styled from 'styled-components';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';

/**
 * Reusable private-access CTA band. Used on informational pages (e.g. the RAPHA
 * product page) to route interest into the selective-access application rather
 * than any purchase/signup path. Never implies instant provisioning.
 */

interface PrivateAccessCtaProps {
  onRequestAccess: () => void;
  heading?: string;
  body?: string;
}

const Band = styled.section`
  max-width: 1000px;
  margin: ${({ theme }) => theme.spacing['3xl']} auto 0;
  padding: ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  background: ${({ theme }) => theme.gradients.card};
  text-align: center;

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const Heading = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  ${breakpoints.tablet} {
    font-size: 30px;
  }
`;

const Body = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  max-width: 620px;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`;

export function PrivateAccessCta({
  onRequestAccess,
  heading = 'RAPHA is deployed privately.',
  body = 'Access is granted through an individual review of deployment fit. Request private access to begin an evaluation.',
}: PrivateAccessCtaProps) {
  return (
    <Band aria-label="Request private access">
      <Heading>{heading}</Heading>
      <Body>{body}</Body>
      <Button variant="primary" onClick={onRequestAccess} aria-label="Request private access to RAPHA">
        Request Private Access
      </Button>
    </Band>
  );
}
