import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError, startOAuth } from '../../auth/authClient';
import { getIntendedPlan, clearIntendedPlan } from '../../auth/planIntent';
import { getPlan } from '../../shared/plans';
import { isBusinessEmail, WORK_EMAIL_REQUIRED_MESSAGE } from '../../shared/businessEmail';
import type { Route } from '../../App';
import {
  AuthCard,
  AuthPage,
  AuthSubtitle,
  AuthTitle,
  ErrorText,
  Field,
  Form,
  Input,
  Label,
  LinkButton,
  MutedRow,
  OAuthButton,
  OAuthList,
  OrDivider,
  PlanBadge,
} from './authStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

export function SignupPage({ onNavigate }: Props) {
  const { requestSignupOtp, verifySignupOtp } = useAuth();
  // Plan the user chose on the pricing page (UX intent only; server-authoritative).
  const [plan] = useState(() => getIntendedPlan());
  const growthIntent = plan === 'growth';
  // Two-phase email/password signup: collect details → verify emailed OTP.
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmitDetails = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    // Growth is B2B — require a work (non-consumer) email. The server enforces
    // this authoritatively too; this is the fast-feedback UX check.
    if (growthIntent && !isBusinessEmail(email)) {
      setError(WORK_EMAIL_REQUIRED_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await requestSignupOtp({ name, organizationName, email, password, requestedPlan: plan ?? undefined });
      setNotice(`We sent a 6-digit verification code to ${email}.`);
      setStep('otp');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifySignupOtp({ email, code: code.trim() });
      // Plan (if any) was applied server-side at account creation. The generic
      // (no-plan) path lands on the account page, which shows the plan modal.
      clearIntendedPlan();
      onNavigate('account');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setNotice(null);
    try {
      await requestSignupOtp({ name, organizationName, email, password, requestedPlan: plan ?? undefined });
      setNotice('A new code has been sent. The previous code is no longer valid.');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    }
  };

  return (
    <AuthPage>
      <AuthCard>
        <AuthTitle>
          Create your account
          {plan && <PlanBadge>{getPlan(plan).displayName}</PlanBadge>}
        </AuthTitle>

        {step === 'details' && (
          <>
            <AuthSubtitle>
              {growthIntent
                ? 'Set up your EmmaTech organization. Growth requires a work email.'
                : 'Set up your EmmaTech organization.'}
            </AuthSubtitle>

            <OAuthList>
              <OAuthButton type="button" onClick={() => startOAuth('google', { plan: plan ?? undefined })}>
                Continue with Google
              </OAuthButton>
              <OAuthButton type="button" onClick={() => startOAuth('microsoft', { plan: plan ?? undefined })}>
                Continue with Microsoft
              </OAuthButton>
            </OAuthList>
            <OrDivider>or</OrDivider>

            <Form onSubmit={onSubmitDetails} noValidate>
              <Field>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
              <Field>
                <Label htmlFor="organizationName">Organization name</Label>
                <Input id="organizationName" type="text" autoComplete="organization" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} required />
              </Field>
              <Field>
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <ErrorText role="alert">{error}</ErrorText>}
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Sending code…' : 'Create account'}
              </Button>
            </Form>
          </>
        )}

        {step === 'otp' && (
          <>
            <AuthSubtitle>{notice ?? `Enter the 6-digit code sent to ${email}.`}</AuthSubtitle>
            <Form onSubmit={onSubmitOtp} noValidate>
              <Field>
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </Field>
              {error && <ErrorText role="alert">{error}</ErrorText>}
              <Button type="submit" variant="primary" disabled={submitting || code.length !== 6}>
                {submitting ? 'Verifying…' : 'Verify & create account'}
              </Button>
            </Form>
            <MutedRow>
              Didn’t get a code? <LinkButton onClick={onResend}>Resend code</LinkButton>
            </MutedRow>
          </>
        )}

        <MutedRow>
          Already have an account? <LinkButton onClick={() => onNavigate('login')}>Sign in</LinkButton>
        </MutedRow>
      </AuthCard>
    </AuthPage>
  );
}
