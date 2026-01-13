import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import type { WaitlistFormData } from '../types/forms';
import { Button } from './Button';

interface WaitlistFormProps {
  onSubmit: (data: WaitlistFormData) => Promise<void>;
  isSubmitting: boolean;
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
`;

const Input = styled.input<{ $hasError?: boolean }>`
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  border: 1px solid
    ${({ theme, $hasError }) =>
    $hasError ? theme.colors.semantic.error : theme.colors.neutral.border};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: ${({ theme }) => theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${({ theme, $hasError }) =>
    $hasError ? theme.colors.semantic.error : theme.colors.primary.main};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.neutral.mediumGray};
  }
`;

const ErrorMessage = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.small};
  color: ${({ theme }) => theme.colors.semantic.error};
  display: block;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const RequiredIndicator = styled.span`
  color: ${({ theme }) => theme.colors.semantic.error};
`;

// Honeypot field - hidden from users but visible to bots
const HoneypotField = styled.input`
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
`;

export const WaitlistForm: React.FC<WaitlistFormProps> = ({
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WaitlistFormData>();

  const honeypot = watch('website');

  const handleFormSubmit = (data: WaitlistFormData) => {
    // If honeypot field is filled, it's likely a bot
    if (honeypot) {
      console.log('Bot detected, ignoring submission');
      return;
    }
    onSubmit(data);
  };

  return (
    <Form onSubmit={handleSubmit(handleFormSubmit)}>
      {/* Honeypot field */}
      <HoneypotField
        type="text"
        {...register('website')}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <FormGroup>
        <Label htmlFor="fullName">
          Full Name <RequiredIndicator>*</RequiredIndicator>
        </Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your Namre"
          $hasError={!!errors.fullName}
          {...register('fullName', {
            required: 'Please enter your full name',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters',
            },
            maxLength: {
              value: 100,
              message: 'Name must be less than 100 characters',
            },
          })}
        />
        {errors.fullName && (
          <ErrorMessage role="alert">{errors.fullName.message}</ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="email">
          Email Address <RequiredIndicator>*</RequiredIndicator>
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="@example.com"
          $hasError={!!errors.email}
          {...register('email', {
            required: 'Please enter your email address',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Please enter a valid email address',
            },
          })}
        />
        {errors.email && (
          <ErrorMessage role="alert">{errors.email.message}</ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
        <Input
          id="contactNumber"
          type="tel"
          placeholder="+1 (555) 123-4567"
          $hasError={!!errors.contactNumber}
          {...register('contactNumber')}
        />
        {errors.contactNumber && (
          <ErrorMessage role="alert">
            {errors.contactNumber.message}
          </ErrorMessage>
        )}
      </FormGroup>

      <FormGroup>
        <Label htmlFor="organization">
          Organization / Company <RequiredIndicator>*</RequiredIndicator>
        </Label>
        <Input
          id="organization"
          type="text"
          placeholder="Acme Corporation"
          $hasError={!!errors.organization}
          {...register('organization', {
            required: 'Please enter your organization name',
            minLength: {
              value: 2,
              message: 'Organization name must be at least 2 characters',
            },
            maxLength: {
              value: 200,
              message: 'Organization name must be less than 200 characters',
            },
          })}
        />
        {errors.organization && (
          <ErrorMessage role="alert">{errors.organization.message}</ErrorMessage>
        )}
      </FormGroup>

      <Button type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Request Access'}
      </Button>
    </Form>
  );
};
