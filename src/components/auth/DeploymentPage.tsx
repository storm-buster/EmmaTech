import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError, generateEnrollmentToken } from '../../auth/authClient';
import type { EnrollmentCredential } from '../../auth/authClient';
import { fetchConsoleSensors } from '../../auth/consoleClient';
import type { SensorRow } from '../../auth/consoleClient';
import type { Route } from '../../App';
import { AuthCard, AuthPage, AuthTitle } from './authStyles';
import { deriveConnectionState, formatExpiry, isExpired } from './deployment';
import type { ConnectionState } from './deployment';

interface Props {
  onNavigate: (to: Route) => void;
}

/** Stable, public EmmaTech installer URL (static asset). Token is NEVER in it. */
const INSTALLER_URL = 'https://emmatech.in/install-rapha.ps1';
const SERVER_NAME_RE = /^[A-Za-z0-9_.-]{1,200}$/;
const POLL_MS = 15000;

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
const StepBar = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  list-style: none;
  margin: ${({ theme }) => theme.spacing.lg} 0 0;
  padding: 0;
`;
const Step = styled.li<{ $active: boolean; $done: boolean }>`
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid
    ${({ theme, $active, $done }) =>
      $done ? theme.colors.semantic.success : $active ? theme.colors.primary.main : theme.colors.neutral.border};
  color: ${({ theme, $active, $done }) =>
    $done ? theme.colors.semantic.success : $active ? theme.colors.neutral.white : theme.colors.neutral.mediumGray};
`;
const StepTitle = styled.h3`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.sm};
`;
const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.md};
`;
const Label = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;
const Input = styled.input`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  background: rgba(255, 255, 255, 0.03);
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 15px;
`;
const Hint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: 0;
`;
const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;
const TokenBox = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.semantic.warning};
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.08);
`;
const TokenRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;
const TokenValue = styled.code`
  flex: 1;
  min-width: 220px;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.white};
  word-break: break-all;
`;
const Warn = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  line-height: 1.6;
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
`;
const CodeBlock = styled.pre`
  margin: ${({ theme }) => theme.spacing.sm} 0;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background.secondary};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.neutral.white};
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
`;
const Steps = styled.ol`
  margin: ${({ theme }) => theme.spacing.sm} 0 0 ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  font-size: 14px;
  line-height: 1.7;
  li { margin-bottom: ${({ theme }) => theme.spacing.xs}; }
`;
const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: 14px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;
const StatusPanel = styled.div<{ $online: boolean }>`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: 12px;
  border: 1px solid
    ${({ theme, $online }) => ($online ? theme.colors.semantic.success : theme.colors.neutral.border)};
  background: ${({ $online }) => ($online ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)')};
`;
const StatusTitle = styled.h3`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
`;

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  waiting: 'Waiting for your server to connect…',
  connected: 'Server connected — waiting for it to come online…',
  online: 'ONLINE',
};

export function DeploymentPage({ onNavigate }: Props) {
  const { account, loading } = useAuth();
  const [serverName, setServerName] = useState('');
  const [credential, setCredential] = useState<EnrollmentCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sensors, setSensors] = useState<SensorRow[]>([]);
  const [checking, setChecking] = useState(false);
  const nameRef = useRef('');

  useEffect(() => {
    if (!loading && !account) onNavigate('login');
  }, [loading, account, onNavigate]);

  const org = account?.organization;
  const entitlement = account?.entitlement;
  const provisioned = org?.status === 'active';
  const trimmedName = serverName.trim();
  const nameValid = SERVER_NAME_RE.test(trimmedName);

  const connState: ConnectionState | null = credential
    ? deriveConnectionState(sensors, nameRef.current)
    : null;
  const online = connState === 'online';

  // Poll the authoritative sensors API (existing endpoint; no new backend) to
  // detect that the newly-enrolled server has actually connected. Enrollment
  // success alone is NOT treated as ONLINE.
  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetchConsoleSensors();
      setSensors(res.sensors ?? []);
    } catch {
      /* transient — keep prior state; the manual "Check now" can retry */
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!credential || online) return;
    void checkConnection();
    const id = window.setInterval(() => void checkConnection(), POLL_MS);
    return () => window.clearInterval(id);
  }, [credential, online, checkConnection]);

  if (loading) {
    return (
      <AuthPage>
        <AuthCard>Loading…</AuthCard>
      </AuthPage>
    );
  }
  if (!account) return null;

  const onGenerate = async () => {
    setError(null);
    setCopied(false);
    if (!nameValid) {
      setError('Enter a server name (letters, digits, dot, underscore or hyphen; up to 200 characters).');
      return;
    }
    setWorking(true);
    try {
      nameRef.current = trimmedName;
      setSensors([]);
      setCredential(await generateEnrollmentToken(trimmedName));
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    } finally {
      setWorking(false);
    }
  };

  const onCopyToken = async () => {
    if (!credential) return;
    try {
      await navigator.clipboard.writeText(credential.enrollment_token);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // The token is intentionally NOT in this command; the installer prompts for it.
  const installCommand =
    `Invoke-WebRequest ${INSTALLER_URL} -OutFile install-rapha.ps1\n` +
    `.\\install-rapha.ps1 -SensorName "${trimmedName || 'WEB-SERVER-01'}"`;
  const fallbackCommand =
    `powershell -ExecutionPolicy Bypass -File .\\install-rapha.ps1 -SensorName "${trimmedName || 'WEB-SERVER-01'}"`;

  const expiryText = credential ? formatExpiry(credential.expires_at) : '';
  const expired = credential ? isExpired(credential.expires_at) : false;

  // Step bar state (1..5).
  const stepIndex = online ? 4 : credential ? 3 : 0; // name → generate → install → wait → online
  const stepLabels = ['Name server', 'Generate credential', 'Install agent', 'Wait for connection', 'Server online'];

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

        <StepBar aria-label="deployment steps">
          {stepLabels.map((label, i) => (
            <Step key={label} $active={i === stepIndex} $done={i < stepIndex || (online && i === 4)}>
              {i + 1}. {label}
            </Step>
          ))}
        </StepBar>

        {/* STEP 1 — name */}
        <StepTitle>1. Name your server</StepTitle>
        <Field>
          <Label htmlFor="serverName">Server name</Label>
          <Input
            id="serverName"
            type="text"
            placeholder="WEB-SERVER-01"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            autoComplete="off"
          />
          <Hint>This identifies the server/sensor in your RAPHA Console.</Hint>
        </Field>

        {/* STEP 2 — generate */}
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
        {error && (
          <ErrorText role="alert">
            {error}
            {/^(the enrollment request was rejected|malformed|invalid|expired)/i.test(error)
              ? ' — generate a new enrollment credential and try again.'
              : ''}
          </ErrorText>
        )}

        {credential && (
          <>
            <TokenBox>
              <Key>Enrollment credential generated</Key>
              <TokenRow>
                <TokenValue>{credential.enrollment_token}</TokenValue>
                <Button variant="secondary" onClick={onCopyToken}>
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </TokenRow>
              <Warn>
                This token authorizes a <strong>single RAPHA sensor</strong> to join your
                organization. It is shown <strong>once</strong> and is sensitive.{' '}
                {expiryText ? (
                  <>
                    {expired ? 'It EXPIRED at ' : 'It expires at '}
                    <strong>{expiryText}</strong> (your local time).
                  </>
                ) : (
                  'It is short-lived.'
                )}{' '}
                Copy it now — you will paste it into the installer prompt.
              </Warn>
            </TokenBox>

            {/* STEP 3 — install */}
            <StepTitle>2. Install the RAPHA agent on your Windows server</StepTitle>
            <Steps>
              <li>On the server (Windows 10/11), open <strong>PowerShell as Administrator</strong>.</li>
              <li>Download and run the EmmaTech installer:</li>
            </Steps>
            <CodeBlock aria-label="installer command">{installCommand}</CodeBlock>
            <Hint>
              If script execution is blocked by policy, use:
            </Hint>
            <CodeBlock aria-label="installer fallback command">{fallbackCommand}</CodeBlock>
            <Steps start={3}>
              <li>When prompted, <strong>paste the enrollment token above</strong> and press Enter.</li>
              <li>The installer verifies the download, installs the agent + service, and enrolls this server.</li>
            </Steps>
            <Hint>
              Works on Windows PowerShell 5.1 and PowerShell 7+. The installer is downloaded from
              EmmaTech ({INSTALLER_URL}); no GitHub access is required. The enrollment token is never
              part of the command or any URL.
            </Hint>

            {/* STEP 4/5 — wait for connection / online */}
            <StepTitle>3. Wait for your server to come online</StepTitle>
            <StatusPanel $online={online} role="status">
              <StatusTitle>{online ? 'RAPHA Agent installed successfully' : CONNECTION_LABEL[connState ?? 'waiting']}</StatusTitle>
              {online ? (
                <>
                  <Section>
                    <Key>Server</Key>
                    <Val>{nameRef.current}</Val>
                  </Section>
                  <Section>
                    <Key>Status</Key>
                    <Val>ONLINE</Val>
                  </Section>
                  <Actions>
                    <Button variant="primary" onClick={() => onNavigate('console')}>
                      Open Console
                    </Button>
                  </Actions>
                </>
              ) : (
                <>
                  <Hint>
                    This page checks automatically. Enrollment succeeding on the server is not the same
                    as the sensor being online — we wait until it actually connects.
                  </Hint>
                  <Actions>
                    <Button variant="secondary" onClick={() => void checkConnection()} disabled={checking}>
                      {checking ? 'Checking…' : 'Check now'}
                    </Button>
                  </Actions>
                </>
              )}
            </StatusPanel>
          </>
        )}
      </AuthCard>
    </AuthPage>
  );
}
