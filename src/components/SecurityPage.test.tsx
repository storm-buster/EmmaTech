import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { SecurityPage } from './SecurityPage';
import { theme } from '../styles/theme';

function renderPage(onNavigate = vi.fn()) {
  render(
    <ThemeProvider theme={theme}>
      <SecurityPage onNavigate={onNavigate} />
    </ThemeProvider>,
  );
  return onNavigate;
}

describe('SecurityPage — rendering & structure', () => {
  it('renders the H1', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Security at EmmaTech' })).toBeInTheDocument();
  });

  it('contains the core practice sections', () => {
    renderPage();
    for (const s of [
      /Authentication .* access control/i,
      /Protected software delivery/i,
      /Logging .* traceability/i,
      /dependency practices/i,
      /Secret scanning/i,
      /Responsible disclosure/i,
      /NVIDIA Inception/i,
      /What this page does not claim/i,
    ]) {
      expect(screen.getByRole('heading', { name: s })).toBeInTheDocument();
    }
  });

  it('provides the responsible-disclosure contact', () => {
    renderPage();
    expect(document.querySelector('a[href="mailto:avinash@emmatech.in"]')).not.toBeNull();
  });

  it('links to RAPHA, private deployment, the resource, and request access', async () => {
    const onNavigate = renderPage();
    const user = userEvent.setup();
    expect(document.querySelector('a[href="/rapha"]')).not.toBeNull();
    expect(document.querySelector('a[href="/private-deployment"]')).not.toBeNull();
    expect(document.querySelector('a[href="/resources/how-to-evaluate-a-cyber-deception-platform"]')).not.toBeNull();
    await user.click(screen.getByText('Request Private Access'));
    expect(onNavigate).toHaveBeenCalledWith('request-access');
  });

  it('states NVIDIA membership only (no endorsement/partnership/certification)', () => {
    renderPage();
    const text = document.body.textContent ?? '';
    expect(text).toMatch(/member of the NVIDIA Inception program/i);
    expect(text).not.toMatch(/NVIDIA (endorse|partner|certif|approv|back|select|validat)/i);
    expect(text).not.toMatch(/NVIDIA-(approved|certified|backed)/i);
  });
});

describe('SecurityPage — disclosure & claim guard', () => {
  it('exposes no private RAPHA implementation, secrets, or internal URLs', () => {
    renderPage();
    const text = document.body.textContent ?? '';
    for (const forbidden of [
      /Isolation Forest/i,
      /iptables/i,
      /Cowrie/i,
      /\b50\+/,
      /<\s*2s/,
      /43%/,
      /zero-day/i,
      /zero false positive/i,
      /threshold/i,
      /public\.blob\.vercel-storage/i,
      /private\.blob\.vercel-storage/i,
      /BLOB_STORE_ID/i,
      /BLOB_READ_WRITE/i,
      /rapha\.emmatech\.in/i,
      /install-rapha/i,
      /agent-package\?dt=/i,
      /renr_/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('makes no absolute-security or leadership claims', () => {
    renderPage();
    const text = document.body.textContent ?? '';
    for (const forbidden of [
      /\bbest\b/i,
      /market leader|industry-leading|number one/i,
      /military-grade|enterprise-grade|unbreakable|fully secure|100% secure|immune to attack/i,
      /guarantee(s|d)? (complete|confidentiality|security)/i,
    ]) {
      expect(text).not.toMatch(forbidden);
    }
    // The page uses careful negations rather than boasts.
    expect(text).toMatch(/do not imply zero vulnerabilities or complete security/i);
    expect(text).toMatch(/do not imply the absence of all vulnerabilities/i);
  });

  it('does not claim any certification/compliance (only disclaims it)', () => {
    renderPage();
    const text = document.body.textContent ?? '';
    // No positive certification/compliance claims.
    expect(text).not.toMatch(/SOC ?2|ISO ?27001/i);
    expect(text).not.toMatch(/(we are|is|are|fully)\s+(SOC|ISO|certified|compliant)/i);
    expect(text).not.toMatch(/certification badge|compliance certified/i);
    // The page explicitly disclaims certification.
    expect(text).toMatch(/do not constitute a security certification/i);
  });
});
