import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { SolutionSection } from './SolutionSection';
import { theme } from '../styles/theme';

/**
 * Phase 3: the PUBLIC /rapha page must not expose PRIVATE implementation —
 * exact model/algorithm, firewall/routing mechanics, the specific decoy
 * software, exact monitored-feature counts, or response-time specifics — and
 * must not overstate ("tamper-proof").
 */
describe('SolutionSection — public disclosure boundary', () => {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <SolutionSection />
    </ThemeProvider>,
  );
  const text = container.textContent ?? '';

  it('does not name the exact detection algorithm', () => {
    expect(text).not.toMatch(/Isolation Forest/i);
  });
  it('does not expose firewall/routing implementation or the specific decoy software', () => {
    expect(text).not.toMatch(/iptables/i);
    expect(text).not.toMatch(/Cowrie/i);
  });
  it('does not disclose an exact monitored-feature count', () => {
    expect(text).not.toMatch(/\b50\+?\s*(system\s+)?features?/i);
  });
  it('does not make a specific response-time claim (milliseconds)', () => {
    expect(text).not.toMatch(/millisecond/i);
  });
  it('uses "tamper-evident", not "tamper-proof"', () => {
    expect(text).not.toMatch(/tamper-proof/i);
    expect(text).toMatch(/tamper-evident/i);
  });
  it('still communicates the conceptual story', () => {
    expect(text).toMatch(/behavioural/i);
    expect(text).toMatch(/decoy/i);
  });
});
