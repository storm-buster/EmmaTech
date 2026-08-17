import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError, startOAuth } from '../../auth/authClient';
import { getIntendedPlan } from '../../auth/planIntent';
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
} from './authStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

export function LoginPage({ onNavigate }: Props) {
  const { login } = useAuth();
  // Preserve any pricing plan intent through OAuth sign-in as well.
  const [plan] = useState(() => getIntendedPlan());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
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
        <AuthTitle>Sign in</AuthTitle>
        <AuthSubtitle>Access your EmmaTech account.</AuthSubtitle>

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
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Form>

        <MutedRow>
          <LinkButton onClick={() => onNavigate('contact')}>Forgot password?</LinkButton>
        </MutedRow>
        <MutedRow>
          Don&rsquo;t have an account?{' '}
          <LinkButton onClick={() => onNavigate('signup')}>Create account</LinkButton>
        </MutedRow>
      </AuthCard>
    </AuthPage>
  );
}
