import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ProblemSection } from './ProblemSection';
import { theme } from '../styles/theme';

function renderCompliance() {
  const { container } = render(
    <ThemeProvider theme={theme}>
      <ProblemSection />
    </ThemeProvider>,
  );
  return container.textContent ?? '';
}

describe('ProblemSection (/compliance) — unsupported-claim guard', () => {
  const text = renderCompliance();

  it('makes no unsupported certification / readiness / audit claims', () => {
    for (const forbidden of [
      /ISO ?27001 ready/i,
      /SOC ?2 roadmap/i,
      /ISO ?27001 certified/i,
      /SOC ?2 certified/i,
      /SOC ?2 compliant/i,
      /ISO ?27001 compliant/i,
      /audit completed/i,
      /audit certified/i,
      /NVIDIA certified/i,
      /CERT-In aligned/i,
      /\bcertified\b/i,
      /\bcertification\b/i,
      /\baccredited\b/i,
      /\battested\b/i,
      /maps directly to/i, // prior overstatement — must not return
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('preserves the legitimate regulatory-support content (page not gutted)', () => {
    // The page still explains how RAPHA supports regulated organizations.
    expect(text).toMatch(/RBI/);
    expect(text).toMatch(/DPDP/);
    expect(text).toMatch(/SEBI/);
    expect(text).toMatch(/tamper-evident/i);
    expect(text).toMatch(/align/i); // "align with" posture, not certification
  });
});
