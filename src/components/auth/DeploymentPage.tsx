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

/** Stable, public EmmaTech installer URL (served as a static asset). The
 *  enrollment token is NEVER part of this URL or the command below. */
const INSTALLER_URL = 'https://emmatech.in/install-rapha.ps1';
const SERVER_NAME_RE = /^[A-Za-z0-9_.-]{1,200}$/;

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
`;
const PlaceholderText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  line-height: 1.6;
  margin: 0;
`;

export function DeploymentPage({ onNavigate }: Props) {
  const { account, loading } = useAuth();
  const [serverName, setServerName] = useState('');
  const [credential, setCredential] = useState<EnrollmentCredential | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

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
  const trimmedName = serverName.trim();
  const nameValid = SERVER_NAME_RE.test(trimmedName);

  const onGenerate = async () => {
    setError(null);
    setCopied(false);
    if (!nameValid) {
      setError('Enter a server name (letters, digits, dot, underscore or hyphen; up to 200 characters).');
      return;
    }
    setWorking(true);
    try {
      // sensor_name is carried to the server; tenant is derived server-side.
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

  // NOTE: the enrollment token is intentionally NOT included in this command.
  // The installer securely prompts for it (no-echo) at runtime.
  const installCommand =
    `Invoke-WebRequest ${INSTALLER_URL} -OutFile install-rapha.ps1\n` +
    `.\\install-rapha.ps1 -SensorName "${trimmedName || 'WEB-SERVER-01'}"`;

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

        {/* STEP 1 — Server name */}
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

        {/* STEP 2 — Generate */}
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
                organization. It is shown <strong>once</strong>, is sensitive, expires
                {credential.expires_at ? ` (${new Date(credential.expires_at).toLocaleString()})` : ''},
                and is not an API key. Copy it now — you will paste it into the installer prompt.
              </Warn>
            </TokenBox>

            {/* STEP 3 — Installation instructions */}
            <StepTitle>2. Install the RAPHA agent on your Windows server</StepTitle>
            <Steps>
              <li>On the server, open <strong>PowerShell as Administrator</strong>.</li>
              <li>Download and run the EmmaTech installer:</li>
            </Steps>
            <CodeBlock aria-label="installer command">{installCommand}</CodeBlock>
            <Steps start={3}>
              <li>When prompted, <strong>paste the enrollment token above</strong> (input is hidden).</li>
              <li>The installer verifies the download, installs the agent + service, and enrolls this server.</li>
              <li>Return to the <strong>RAPHA Console</strong> — your server appears once telemetry begins.</li>
            </Steps>
            <Hint>
              The installer is downloaded from EmmaTech ({INSTALLER_URL}); no GitHub access is
              required. The enrollment token is never part of the command or any URL.
            </Hint>
          </>
        )}

        <Placeholder>
          <PlaceholderTitle>RAPHA Console</PlaceholderTitle>
          <PlaceholderText>
            Manage your deployment in the RAPHA Console, including <strong>API Keys</strong> for REST
            integrations. Open it from the <strong>Console</strong> link in your navigation.
          </PlaceholderText>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>API access is live</PlaceholderTitle>
          <PlaceholderText>
            Programmatic API-key management is available now in the RAPHA Console under{' '}
            <strong>API Keys</strong>. API keys are a separate credential type from enrollment
            tokens.
          </PlaceholderText>
        </Placeholder>
      </AuthCard>
    </AuthPage>
  );
}
