import styled from 'styled-components';
import { breakpoints } from '../../styles/breakpoints';

/**
 * Presentational primitives for the RAPHA customer documentation. These are
 * plain, accessible, dependency-free building blocks (no docs framework) that
 * match the existing EmmaTech design tokens.
 */

export const DocH1 = styled.h1`
  font-size: 30px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  line-height: 1.2;

  ${breakpoints.tablet} {
    font-size: 36px;
  }
`;

export const DocLead = styled.p`
  font-size: 17px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`;

export const DocH2 = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

export const DocP = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

export const DocUl = styled.ul`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

export const DocOl = styled.ol`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  padding-left: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;

export const DocLi = styled.li`
  font-size: 15px;
  line-height: 1.7;
  margin-bottom: 6px;
`;

export const InlineCode = styled.code`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: ${({ theme }) => theme.colors.primary.main};
  word-break: break-word;
`;

const Pre = styled.pre`
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.white};
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 10px;
  padding: ${({ theme }) => theme.spacing.lg};
  overflow-x: auto;
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  white-space: pre;
`;

/** A fenced code block. `label` is an accessible caption (e.g. "PowerShell"). */
export function CodeBlock({ label, children }: { label?: string; children: string }) {
  return (
    <figure style={{ margin: 0 }}>
      {label && (
        <figcaption
          style={{
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: 0.6,
            marginBottom: 6,
          }}
        >
          {label}
        </figcaption>
      )}
      <Pre>
        <code>{children}</code>
      </Pre>
    </figure>
  );
}

type CalloutVariant = 'note' | 'warning' | 'unavailable';

const CalloutBox = styled.div<{ $variant: CalloutVariant }>`
  border-left: 4px solid
    ${({ $variant, theme }) =>
      $variant === 'warning'
        ? theme.colors.semantic.warning
        : $variant === 'unavailable'
          ? theme.colors.semantic.error
          : theme.colors.primary.main};
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
`;

const CalloutTitle = styled.p`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 6px;
  color: ${({ theme }) => theme.colors.neutral.white};
`;

const CalloutBody = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};

  & > p {
    margin: 0 0 8px;
  }
  & > p:last-child {
    margin-bottom: 0;
  }
`;

const DEFAULT_TITLES: Record<CalloutVariant, string> = {
  note: 'Note',
  warning: 'Important',
  unavailable: 'Not yet available',
};

export function Callout({
  variant = 'note',
  title,
  children,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}) {
  const resolved = title ?? DEFAULT_TITLES[variant];
  const role = variant === 'note' ? 'note' : 'alert';
  return (
    <CalloutBox $variant={variant} role={role}>
      <CalloutTitle>{resolved}</CalloutTitle>
      <CalloutBody>{children}</CalloutBody>
    </CalloutBox>
  );
}

const FlowFigure = styled.figure`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const FlowNode = styled.div`
  width: 100%;
  max-width: 420px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  background: ${({ theme }) => theme.gradients.card};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 10px;
  padding: 10px 14px;
`;

const FlowArrow = styled.span`
  color: ${({ theme }) => theme.colors.primary.main};
  font-size: 18px;
  line-height: 1;
`;

/**
 * A simple, accessible top-to-bottom flow diagram. The ordered list is the
 * semantic source of truth (screen readers read "1, 2, 3…"); the arrows are
 * decorative.
 */
export function Flow({ steps, caption }: { steps: string[]; caption?: string }) {
  return (
    <FlowFigure aria-label={caption ?? 'Flow diagram'}>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%' }}>
        {steps.map((step, i) => (
          <li key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <FlowNode>{step}</FlowNode>
            {i < steps.length - 1 && <FlowArrow aria-hidden="true">↓</FlowArrow>}
          </li>
        ))}
      </ol>
      {caption && (
        <figcaption style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>{caption}</figcaption>
      )}
    </FlowFigure>
  );
}
