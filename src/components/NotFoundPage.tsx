import styled from 'styled-components';
import { Button } from './Button';
import { breakpoints } from '../styles/breakpoints';
import type { Route } from '../App';

/**
 * Simple 404 for unknown public pathnames. Uses the existing design language.
 * (Proper 404 HTTP status + noindex is handled by prerender/headers in Phase 2B;
 * this is the client-rendered fallback so unknown paths no longer silently show
 * Home.)
 */
interface NotFoundPageProps {
  onNavigate: (to: Route) => void;
}

const Page = styled.section`
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 160px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['4xl']};

  ${breakpoints.tablet} {
    padding: 180px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Code = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: ${({ theme }) => theme.colors.primary.main};
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: 42px;
  }
`;

const Body = styled.p`
  font-size: 16px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  max-width: 520px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  align-items: center;

  ${breakpoints.tablet} {
    flex-direction: row;
  }
`;

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <Page>
      <Code>404</Code>
      <Title>This page could not be found.</Title>
      <Body>The page you are looking for doesn’t exist or may have moved.</Body>
      <Actions>
        <Button variant="primary" onClick={() => onNavigate('home')} aria-label="Go to the homepage">
          Back to home
        </Button>
        <Button variant="secondary" onClick={() => onNavigate('product')} aria-label="Explore RAPHA">
          Explore RAPHA
        </Button>
      </Actions>
    </Page>
  );
}
