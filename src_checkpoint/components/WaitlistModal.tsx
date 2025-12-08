import { useState } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { WaitlistForm } from './WaitlistForm';
import type { WaitlistFormData } from '../types/forms';
import { submitWaitlist } from '../api/waitlist';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.h2Mobile};
  line-height: ${({ theme }) => theme.typography.lineHeight.h2Mobile};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.neutral.darkGray};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  text-align: center;
`;

const ModalSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  line-height: ${({ theme }) => theme.typography.lineHeight.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const SuccessIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SuccessTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.h3};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.semantic.success};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.body};
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const ErrorMessage = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.semantic.error}15;
  border: 1px solid ${({ theme }) => theme.colors.semantic.error};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  color: ${({ theme }) => theme.colors.semantic.error};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-align: center;
`;

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await submitWaitlist(data);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after modal closes
    setTimeout(() => {
      setIsSuccess(false);
      setError(null);
    }, 300);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      {isSuccess ? (
        <SuccessMessage role="status" aria-live="polite">
          <SuccessIcon aria-hidden="true">✓</SuccessIcon>
          <SuccessTitle>You're on the list!</SuccessTitle>
          <SuccessText>
            Thank you for your interest in RAPHA. We'll be in touch soon with
            updates and early access information.
          </SuccessText>
        </SuccessMessage>
      ) : (
        <>
          <ModalTitle>Join the Waitlist</ModalTitle>
          <ModalSubtitle>
            Be among the first to get access to RAPHA. Leave your details
            below, and we'll be in touch.
          </ModalSubtitle>
          {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
          <WaitlistForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </>
      )}
    </Modal>
  );
};
