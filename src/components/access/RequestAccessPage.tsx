import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Button } from '../Button';
import { breakpoints } from '../../styles/breakpoints';
import { submitAccessRequest, type AccessRequestForm } from '../../access/accessClient';
import { trackEvent } from '../../analytics/events';

/**
 * Public "Request Private Access" application. Feels like an application to a
 * serious security program, not a newsletter signup. Submits to the durable,
 * backend-backed `/api/access-requests` endpoint — it NEVER creates an account,
 * organization, or RAPHA tenant.
 */

const Page = styled.section`
  max-width: 900px;
  margin: 0 auto;
  padding: 140px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['4xl']};

  ${breakpoints.tablet} {
    padding: 160px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

const Eyebrow = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 12px;
  font-weight: 700;
  color: #3fbf7f;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Title = styled.h1`
  font-size: 38px;
  line-height: 1.15;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    font-size: 48px;
  }
`;

const Lead = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  max-width: 680px;
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 16px;
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  ${breakpoints.tablet} {
    padding: ${({ theme }) => theme.spacing['2xl']};
  }
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  ${breakpoints.tablet} {
    grid-template-columns: 1fr 1fr;
  }
`;

const Group = styled.div<{ $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  ${({ $full }) => ($full ? 'grid-column: 1 / -1;' : '')}
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const fieldStyles = `
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
`;

const Input = styled.input`
  ${fieldStyles}
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.neutral.white};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const Select = styled.select`
  ${fieldStyles}
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.neutral.white};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
  }
  option {
    background: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.neutral.white};
  }
`;

const TextArea = styled.textarea`
  ${fieldStyles}
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  color: ${({ theme }) => theme.colors.neutral.white};
  min-height: 110px;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary.main};
    box-shadow: 0 0 10px ${({ theme }) => theme.colors.primary.glow};
  }
`;

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.semantic.error};
  font-size: 12px;
`;

const FormError = styled.div`
  grid-column: 1 / -1;
  color: ${({ theme }) => theme.colors.semantic.error};
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.25);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
`;

const Actions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const FinePrint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  line-height: 1.5;
`;

const Success = styled(motion.div)`
  border: 1px solid rgba(63, 191, 127, 0.3);
  background: rgba(63, 191, 127, 0.08);
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const SuccessTitle = styled.h2`
  font-size: 24px;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SuccessBody = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

const INDUSTRIES = [
  'Financial services / Fintech',
  'Banking / NBFC',
  'Healthcare',
  'Government / PSU',
  'Technology / SaaS',
  'Manufacturing / Industrial',
  'Retail / E-commerce',
  'Telecommunications',
  'Education',
  'Other',
];

const ORG_SIZES = ['1–50', '51–200', '201–1,000', '1,001–5,000', '5,000+'];

const DEPLOY_ENVS = [
  'On-premises',
  'Private cloud',
  'Public cloud (AWS / Azure / GCP)',
  'Hybrid',
  'Air-gapped / isolated',
  'Not sure yet',
];

export function RequestAccessPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccessRequestForm>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    trackEvent('request_access_start');
  }, []);

  const onSubmit = async (data: AccessRequestForm) => {
    setFormError(null);
    trackEvent('request_access_submit');
    const result = await submitAccessRequest(data);
    if (result.state === 'ok') {
      setSubmitted(true);
      return;
    }
    if (result.state === 'invalid') {
      const entries = Object.entries(result.fields);
      if (entries.length === 0) {
        setFormError('Please review your entries and try again.');
      } else {
        for (const [field, message] of entries) {
          setError(field as keyof AccessRequestForm, { type: 'server', message });
        }
      }
      return;
    }
    if (result.state === 'rate_limited') {
      setFormError('You have submitted several requests recently. Please try again later.');
      return;
    }
    setFormError(result.message);
  };

  if (submitted) {
    return (
      <Page>
        <Eyebrow>RAPHA · Private Deployment</Eyebrow>
        <Success initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <SuccessTitle>Request received</SuccessTitle>
          <SuccessBody>
            Thank you. Your request has been recorded and the EmmaTech team will review your
            organization's requirements and deployment fit. If there is a match, we will contact
            you privately to arrange a briefing. This is a review process — no account has been
            created.
          </SuccessBody>
        </Success>
      </Page>
    );
  }

  return (
    <Page>
      <Eyebrow>RAPHA · Private Deployment</Eyebrow>
      <Title>Request Private Access</Title>
      <Lead>
        RAPHA deployments are evaluated individually. Tell us about your organization and security
        requirements, and the EmmaTech team will review your request for deployment fit.
      </Lead>

      <Card>
        <Form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Request private access">
          {formError && <FormError role="alert">{formError}</FormError>}

          <Group>
            <Label htmlFor="full_name">Full name *</Label>
            <Input id="full_name" type="text" autoComplete="name"
              aria-invalid={errors.full_name ? 'true' : 'false'}
              {...register('full_name', { required: 'Full name is required' })} />
            {errors.full_name && <ErrorText role="alert">{errors.full_name.message}</ErrorText>}
          </Group>

          <Group>
            <Label htmlFor="work_email">Work email *</Label>
            <Input id="work_email" type="email" autoComplete="email" placeholder="you@organization.com"
              aria-invalid={errors.work_email ? 'true' : 'false'}
              {...register('work_email', {
                required: 'Work email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
              })} />
            {errors.work_email && <ErrorText role="alert">{errors.work_email.message}</ErrorText>}
          </Group>

          <Group>
            <Label htmlFor="organization">Organization *</Label>
            <Input id="organization" type="text" autoComplete="organization"
              aria-invalid={errors.organization ? 'true' : 'false'}
              {...register('organization', { required: 'Organization is required' })} />
            {errors.organization && <ErrorText role="alert">{errors.organization.message}</ErrorText>}
          </Group>

          <Group>
            <Label htmlFor="job_title">Job title / role</Label>
            <Input id="job_title" type="text" autoComplete="organization-title"
              {...register('job_title')} />
          </Group>

          <Group>
            <Label htmlFor="industry">Industry *</Label>
            <Select id="industry" defaultValue=""
              aria-invalid={errors.industry ? 'true' : 'false'}
              {...register('industry', { required: 'Industry is required' })}>
              <option value="" disabled>Select an industry…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
            {errors.industry && <ErrorText role="alert">{errors.industry.message}</ErrorText>}
          </Group>

          <Group>
            <Label htmlFor="organization_size">Organization size</Label>
            <Select id="organization_size" defaultValue="" {...register('organization_size')}>
              <option value="">Prefer not to say</option>
              {ORG_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
            </Select>
          </Group>

          <Group>
            <Label htmlFor="country">Country / region</Label>
            <Input id="country" type="text" autoComplete="country-name" {...register('country')} />
          </Group>

          <Group>
            <Label htmlFor="deployment_environment">Deployment environment</Label>
            <Select id="deployment_environment" defaultValue="" {...register('deployment_environment')}>
              <option value="">Select an environment…</option>
              {DEPLOY_ENVS.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Group>

          <Group $full>
            <Label htmlFor="security_challenge">Primary security challenge *</Label>
            <TextArea id="security_challenge"
              placeholder="What are you trying to protect, and what threats are most pressing?"
              aria-invalid={errors.security_challenge ? 'true' : 'false'}
              {...register('security_challenge', { required: 'Please describe your primary security challenge' })} />
            {errors.security_challenge && <ErrorText role="alert">{errors.security_challenge.message}</ErrorText>}
          </Group>

          <Group $full>
            <Label htmlFor="current_stack">Current security stack</Label>
            <TextArea id="current_stack"
              placeholder="Existing tools (EDR/XDR, SIEM, firewalls, etc.) — optional"
              {...register('current_stack')} />
          </Group>

          <Group $full>
            <Label htmlFor="evaluation_reason">Why are you evaluating RAPHA? *</Label>
            <TextArea id="evaluation_reason"
              placeholder="What prompted this evaluation, and what outcome are you hoping for?"
              aria-invalid={errors.evaluation_reason ? 'true' : 'false'}
              {...register('evaluation_reason', { required: 'Please tell us why you are evaluating RAPHA' })} />
            {errors.evaluation_reason && <ErrorText role="alert">{errors.evaluation_reason.message}</ErrorText>}
          </Group>

          <Group $full>
            <Label htmlFor="additional_context">Additional context</Label>
            <TextArea id="additional_context"
              placeholder="Anything else that would help us assess deployment fit — optional"
              {...register('additional_context')} />
          </Group>

          <Actions>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit request'}
            </Button>
            <FinePrint>
              Submitting this form does not create an account or grant access. Requests are reviewed
              individually; commercial terms are discussed privately with selected organizations.
            </FinePrint>
          </Actions>
        </Form>
      </Card>
    </Page>
  );
}
