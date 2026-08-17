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
  const { signup } = useAuth();
  // Plan the user chose on the pricing page (UX intent only; server-authoritative).
  const [plan] = useState(() => getIntendedPlan());
  const growthIntent = plan === 'growth';
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
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
      await signup({ name, organizationName, email, password, requestedPlan: plan ?? undefined });
      clearIntendedPlan();
      onNavigate('account');
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthPage>
      <AuthCard>
        <AuthTitle>
          Create your account
          {plan && <PlanBadge>{getPlan(plan).displayName}</PlanBadge>}
        </AuthTitle>
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

        <Form onSubmit={onSubmit} noValidate>
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
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </Form>

        <MutedRow>
          Already have an account? <LinkButton onClick={() => onNavigate('login')}>Sign in</LinkButton>
        </MutedRow>
      </AuthCard>
    </AuthPage>
  );
}
