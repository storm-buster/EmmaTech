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

export function SignupPage({ onNavigate }: Props) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({ name, organizationName, email, password });
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
        <AuthTitle>Create your account</AuthTitle>
        <AuthSubtitle>Set up your EmmaTech organization.</AuthSubtitle>
        <Form onSubmit={onSubmit} noValidate>
          <Field>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="organizationName">Organization name</Label>
            <Input
              id="organizationName"
              type="text"
              autoComplete="organization"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              required
            />
          </Field>
          <Field>
            <Label htmlFor="email">Work email</Label>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </Form>
        <MutedRow>
          Already have an account?{' '}
          <LinkButton onClick={() => onNavigate('login')}>Sign in</LinkButton>
        </MutedRow>
      </AuthCard>
    </AuthPage>
  );
}
