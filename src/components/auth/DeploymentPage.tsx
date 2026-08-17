import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError, generateEnrollmentToken } from '../../auth/authClient';
import type { EnrollmentCredential } from '../../auth/authClient';
import type { Route } from '../../App';
import { AuthCard, AuthPage, AuthTitle } from './authStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

const Section = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const Key = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Val = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: right;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const TokenBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.warning};
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.08);
`;

const TokenValue = styled.code`
  display: block;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.white};
  word-break: break-all;
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const Warn = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  line-height: 1.6;
  margin: 0;
`;

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: 14px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Placeholder = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px dashed ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
`;

const PlaceholderTitle = styled.h3`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ComingSoon = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 8px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  background: rgba(255, 255, 255, 0.06);
`;

const PlaceholderText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  line-height: 1.6;
  margin: 0;
`;

export function DeploymentPage({ onNavigate }: Props) {
  const { account, loading } = useAuth();
  const [credential, setCredential] = useState<EnrollmentCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!loading && !account) onNavigate('login');
  }, [loading, account, onNavigate]);

  if (loading) {
    return (
      <AuthPage>
        <AuthCard>Loading…</AuthCard>
      </AuthPage>
    );
  }
  if (!account) return null;

  const org = account.organization;
  const entitlement = account.entitlement;
  const provisioned = org?.status === 'active';

  const onGenerate = async () => {
    setError(null);
    setWorking(true);
    try {
      setCredential(await generateEnrollmentToken());
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    } finally {
      setWorking(false);
    }
  };

  return (
    <AuthPage>
      <AuthCard>
        <AuthTitle>RAPHA Deployment</AuthTitle>

        <Section>
          <Key>Current plan</Key>
          <Val>{entitlement ? entitlement.planName : '—'}</Val>
        </Section>
        <Section>
          <Key>RAPHA status</Key>
          <Val>{provisioned ? 'Provisioned' : 'Not provisioned'}</Val>
        </Section>

        <Actions>
          <Button variant="primary" onClick={onGenerate} disabled={working || !provisioned}>
            {working ? 'Generating…' : 'Generate enrollment credential'}
          </Button>
          <Button variant="secondary" onClick={() => onNavigate('account')}>
            Back to account
          </Button>
        </Actions>

        {!provisioned && (
          <ErrorText role="status">
            Your RAPHA deployment is still being prepared. Please try again shortly.
          </ErrorText>
        )}

        {error && <ErrorText role="alert">{error}</ErrorText>}

        {credential && (
          <TokenBox>
            <Key>Enrollment credential generated</Key>
            <TokenValue>{credential.enrollment_token}</TokenValue>
            <Warn>
              An <strong>enrollment token authorizes a single RAPHA sensor to join your
              organization</strong>. It is shown <strong>once</strong>, is sensitive, expires
              {credential.expires_at ? ` (${new Date(credential.expires_at).toLocaleString()})` : ''},
              and is not an API key. Use it now and do not share it publicly.
            </Warn>
          </TokenBox>
        )}

        <Placeholder>
          <PlaceholderTitle>
            RAPHA Web Console <ComingSoon>Coming soon</ComingSoon>
          </PlaceholderTitle>
          <PlaceholderText>
            Your real-time SOC dashboard will be available at{' '}
            <code>rapha.emmatech.in</code>. This console is not yet live; a link will appear
            here once it is deployed.
          </PlaceholderText>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>
            API Access <ComingSoon>Coming soon</ComingSoon>
          </PlaceholderTitle>
          <PlaceholderText>
            Programmatic API-key management for REST/WebSocket integrations will appear here.
            It is not available yet: it will be enabled once the RAPHA control plane exposes a
            service-level API-key contract. API keys are a separate credential type from
            enrollment tokens.
          </PlaceholderText>
        </Placeholder>
      </AuthCard>
    </AuthPage>
  );
}
