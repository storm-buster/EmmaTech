import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { retryProvisioning } from '../../auth/authClient';
import type { OrgStatus } from '../../auth/authClient';
import type { Route } from '../../App';
import { AuthCard, AuthPage, AuthTitle } from './authStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

const Row = styled.div`
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
  word-break: break-word;
`;

const Badge = styled.span<{ $status: OrgStatus }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.neutral.white};
  background: ${({ $status, theme }) =>
    $status === 'active'
      ? theme.colors.semantic.success
      : $status === 'failed'
        ? theme.colors.semantic.error
        : theme.colors.semantic.warning};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const STATUS_LABEL: Record<OrgStatus, string> = {
  active: 'Active',
  pending: 'Provisioning pending',
  failed: 'Provisioning failed',
};

export function AccountPage({ onNavigate }: Props) {
  const { account, loading, logout, refresh } = useAuth();
  const [retrying, setRetrying] = useState(false);

  // Protected route: redirect unauthenticated users to login.
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

  const { user, organization, role } = account;
  const entitlement = account.entitlement;
  const sensorAllowance =
    entitlement == null
      ? '—'
      : entitlement.sensorLimit === null
        ? 'Unlimited'
        : String(entitlement.sensorLimit);

  const onRetry = async () => {
    setRetrying(true);
    try {
      await retryProvisioning();
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  const onLogout = async () => {
    await logout();
    onNavigate('home');
  };

  return (
    <AuthPage>
      <AuthCard>
        <AuthTitle>Account</AuthTitle>
        <Row>
          <Key>Name</Key>
          <Val>{user.name}</Val>
        </Row>
        <Row>
          <Key>Email</Key>
          <Val>{user.email}</Val>
        </Row>
        {organization && (
          <>
            <Row>
              <Key>Organization</Key>
              <Val>{organization.name}</Val>
            </Row>
            <Row>
              <Key>Role</Key>
              <Val>{role}</Val>
            </Row>
            {entitlement && (
              <>
                <Row>
                  <Key>Plan</Key>
                  <Val>{entitlement.planName}</Val>
                </Row>
                <Row>
                  <Key>Sensor allowance</Key>
                  <Val>{sensorAllowance}</Val>
                </Row>
                <Row>
                  <Key>Decoys</Key>
                  <Val>{entitlement.decoysEnabled ? 'Included' : 'Not included'}</Val>
                </Row>
              </>
            )}
            <Row>
              <Key>RAPHA tenant</Key>
              <Val>
                <Badge $status={organization.status}>{STATUS_LABEL[organization.status]}</Badge>
              </Val>
            </Row>
            {organization.rapha_tenant_id && (
              <Row>
                <Key>Tenant ID</Key>
                <Val>{organization.rapha_tenant_id}</Val>
              </Row>
            )}
          </>
        )}
        <Actions>
          {organization && organization.status === 'active' && (
            <Button variant="secondary" onClick={() => onNavigate('deploy')}>
              RAPHA deployment
            </Button>
          )}
          {organization && organization.status !== 'active' && role === 'owner' && (
            <Button variant="secondary" onClick={onRetry} disabled={retrying}>
              {retrying ? 'Retrying…' : 'Retry RAPHA provisioning'}
            </Button>
          )}
          <Button variant="primary" onClick={onLogout}>
            Log out
          </Button>
        </Actions>
      </AuthCard>
    </AuthPage>
  );
}
