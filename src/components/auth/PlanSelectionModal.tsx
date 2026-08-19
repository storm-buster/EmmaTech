import { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../auth/AuthContext';
import { AuthApiError } from '../../auth/authClient';
import { PUBLIC_PLANS, formatSensorLimit } from '../../shared/plans';
import { ErrorText } from './authStyles';

/**
 * Post-signup plan-selection modal for the GENERIC (no-plan) path. Shown by the
 * AccountPage exactly when `organization.plan_selected` is false, so it appears
 * once and never re-appears after a choice (the server marks plan_selected and
 * the account is re-fetched). The server validates the choice (public-only;
 * Growth requires a work email) — this UI is not authoritative.
 */
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: rgba(0, 0, 0, 0.6);
`;

const Card = styled.div`
  width: 100%;
  max-width: 520px;
  background: ${({ theme }) => theme.colors.neutral.darkGray};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 22px;
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const Sub = styled.p`
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  font-size: 14px;
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
`;

const PlanList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const PlanOption = styled.button`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  background: rgba(255, 255, 255, 0.03);
  color: ${({ theme }) => theme.colors.neutral.white};
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary.main};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PlanName = styled.span`
  font-weight: 600;
  font-size: 16px;
`;

const PlanMeta = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

export function PlanSelectionModal() {
  const { selectPlan } = useAuth();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (planId: string) => {
    setError(null);
    setSubmitting(planId);
    try {
      // On success the account is re-fetched (plan_selected = true), which
      // unmounts this modal. On failure we surface the message and re-enable.
      await selectPlan(planId);
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Could not apply the selected plan');
      setSubmitting(null);
    }
  };

  return (
    <Overlay role="dialog" aria-modal="true" aria-labelledby="plan-modal-title">
      <Card>
        <Title id="plan-modal-title">Choose your plan</Title>
        <Sub>Select a plan to finish setting up your organization.</Sub>
        <PlanList>
          {PUBLIC_PLANS.map((p) => (
            <PlanOption
              key={p.id}
              type="button"
              onClick={() => choose(p.id)}
              disabled={submitting !== null}
            >
              <PlanName>
                {p.displayName} — {p.price}
                {p.period}
              </PlanName>
              <PlanMeta>
                {formatSensorLimit(p.sensorLimit)} sensors · {p.decoysEnabled ? 'decoys included' : 'no decoys'}
              </PlanMeta>
            </PlanOption>
          ))}
        </PlanList>
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </Card>
    </Overlay>
  );
}
