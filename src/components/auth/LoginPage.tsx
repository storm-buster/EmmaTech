import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../Button';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError } from '../../auth/authClient';
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
} from './authStyles';

interface Props {
  onNavigate: (to: Route) => void;
}

export function LoginPage({ onNavigate }: Props) {
  const { login } = useAuth();
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
        <Form onSubmit={onSubmit} noValidate>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </Form>
        <MutedRow>
          No account? <LinkButton onClick={() => onNavigate('signup')}>Create one</LinkButton>
        </MutedRow>
      </AuthCard>
    </AuthPage>
  );
}
