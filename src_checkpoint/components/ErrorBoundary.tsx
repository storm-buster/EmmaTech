import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  background-color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const ErrorTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.h1Mobile};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorMessage = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.bodyLarge};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 600px;
`;

const ReloadButton = styled.button`
  padding: 12px 32px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background-color: ${({ theme }) => theme.colors.primary.main};
  color: ${({ theme }) => theme.colors.neutral.white};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.default};

  &:hover {
    background-color: #0052a3;
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>
            We're sorry, but something unexpected happened. Please try
            reloading the page. If the problem persists, contact our support
            team.
          </ErrorMessage>
          <ReloadButton onClick={this.handleReload}>Reload Page</ReloadButton>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}
