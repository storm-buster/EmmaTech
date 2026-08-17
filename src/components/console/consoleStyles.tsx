import styled from 'styled-components';
import { breakpoints } from '../../styles/breakpoints';

/**
 * RAPHA Customer Console presentational primitives (Phase 7A).
 * Reuses the existing EmmaTech theme tokens and the DocsPage shell layout so
 * the console feels like part of the product, not a separate app. No charts,
 * no fake metrics, no decorative "live" values.
 */

export const ConsoleLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 96px ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing['3xl']};
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  ${breakpoints.tablet} {
    grid-template-columns: 240px 1fr;
    padding: 120px ${({ theme }) => theme.spacing['2xl']} ${({ theme }) => theme.spacing['4xl']};
  }
`;

export const Sidebar = styled.nav<{ $open: boolean }>`
  display: ${({ $open }) => ($open ? 'block' : 'none')};

  ${breakpoints.tablet} {
    display: block;
    position: sticky;
    top: 96px;
    align-self: start;
  }
`;

export const SidebarInner = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.gradients.card};
`;

export const SidebarTitle = styled.p`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${({ theme }) => theme.colors.primary.main};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const NavLink = styled.a<{ $active: boolean }>`
  display: block;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.neutral.white : theme.colors.neutral.lightGray};
  background: ${({ $active }) => ($active ? 'rgba(0, 240, 255, 0.12)' : 'transparent')};
  border-left: 3px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary.main : 'transparent')};

  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    background: rgba(255, 255, 255, 0.04);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary.main};
    outline-offset: 2px;
  }
`;

export const MobileToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: ${({ theme }) => theme.colors.primary.main};
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  ${breakpoints.tablet} {
    display: none;
  }
`;

export const ConsoleContent = styled.section`
  min-width: 0;
`;

export const ConsoleHeader = styled.header`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const ConsoleTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin: 0 0 4px;

  ${breakpoints.tablet} {
    font-size: 30px;
  }
`;

export const ConsoleSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: 0;
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};

  ${breakpoints.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const ConsoleCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.gradients.card};
`;

export const CardHeading = styled.h2`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

export const DefRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};

  &:last-child {
    border-bottom: none;
  }
`;

export const DefKey = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

export const DefVal = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.neutral.white};
  text-align: right;
  word-break: break-word;
`;

type PillState = 'operational' | 'down' | 'loading' | 'error' | 'neutral';

export const StatusPill = styled.span<{ $state: PillState }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.neutral.white};
  background: ${({ $state, theme }) =>
    $state === 'operational'
      ? theme.colors.semantic.success
      : $state === 'down' || $state === 'error'
        ? theme.colors.semantic.error
        : $state === 'loading'
          ? theme.colors.semantic.warning
          : 'rgba(255,255,255,0.12)'};
`;

export const ActionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

/** Honest "API integration pending" panel for deferred data sections. */
export const DeferredPanel = styled.div`
  border: 1px dashed ${({ theme }) => theme.colors.neutral.border};
  border-radius: 12px;
  padding: ${({ theme }) => theme.spacing['2xl']};
  background: rgba(255, 255, 255, 0.02);
  text-align: center;
`;

export const DeferredBadge = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 3px 10px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  background: rgba(255, 255, 255, 0.06);
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const DeferredText = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
  max-width: 520px;
  margin: 0 auto;
`;

export const CenterState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
  color: ${({ theme }) => theme.colors.neutral.lightGray};
`;
