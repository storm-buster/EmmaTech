import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { DocsPage } from './DocsPage';
import { Footer } from '../Footer';
import { theme } from '../../styles/theme';

function renderDocsAt(path: string) {
  window.history.pushState({}, '', path);
  return render(
    <ThemeProvider theme={theme}>
      <DocsPage />
    </ThemeProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('DocsPage routing + rendering', () => {
  it('resolves the /docs route to the Overview page by default', () => {
    renderDocsAt('/docs');
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
  });

  it('renders the documentation navigation (sections + all pages)', () => {
    renderDocsAt('/docs');
    for (const section of ['Getting Started', 'Installation', 'Sensors', 'Integrations']) {
      expect(screen.getAllByText(section).length).toBeGreaterThan(0);
    }
    for (const item of [
      'Overview',
      'Architecture',
      'Requirements',
      'Quick Start',
      'Windows',
      'Linux',
      'Register a Sensor',
      'Connect to Web Console',
      'Web Services',
    ]) {
      expect(screen.getAllByText(item).length).toBeGreaterThan(0);
    }
  });

  it('renders each core page by deep-link hash', () => {
    const cases: Array<[string, string]> = [
      ['/docs/overview', 'Overview'],
      ['/docs/architecture', 'Architecture'],
      ['/docs/requirements', 'Requirements'],
      ['/docs/quick-start', 'Quick Start'],
      ['/docs/windows', 'Windows Installation'],
      ['/docs/register-sensor', 'Register a Sensor'],
      ['/docs/web-services', 'Web Services'],
    ];
    for (const [hash, title] of cases) {
      const { unmount } = renderDocsAt(hash);
      // Content <article> is always visible; there is exactly one <h1>.
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
      unmount();
      window.history.replaceState({}, '', '/');
    }
  });

  it('shows a breadcrumb and prev/next navigation', () => {
    renderDocsAt('/docs/architecture');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    // Architecture is preceded by Overview and followed by Requirements.
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('renders the correct page for a mixed-case doc id (regression: no fallback to Overview)', () => {
    // Edge middleware 308-redirects case variants to lowercase in production;
    // this guards the client path so the rendered page always matches the id.
    for (const [path, title] of [
      ['/docs/ARCHITECTURE', 'Architecture'],
      ['/Docs/Web-Services', 'Web Services'],
    ] as Array<[string, string]>) {
      const { unmount } = renderDocsAt(path);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title);
      unmount();
      window.history.replaceState({}, '', '/');
    }
  });
});

describe('DocsPage accuracy constraints', () => {
  it('Linux page states installation is NOT generally available and gives no command', () => {
    const { container } = renderDocsAt('/docs/linux');
    expect(screen.getByRole('heading', { level: 1, name: 'Linux' })).toBeInTheDocument();
    expect(screen.getByText(/not generally available/i)).toBeInTheDocument();
    // No fake install command.
    expect(container.textContent).not.toMatch(/curl\s+.*\|\s*bash/i);
    expect(container.textContent).not.toMatch(/systemctl/i);
  });

  it('Web Console page does NOT expose the control-plane hostname (uses the org console URL wording)', () => {
    const { container } = renderDocsAt('/docs/web-console');
    expect(container.textContent).not.toMatch(/rapha\.emmatech\.in/i);
    expect(screen.getByText(/organization console URL provided/i)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/open https:\/\/rapha\.emmatech\.in/i);
  });

  it('Web Services page is conceptual and routes API-key operations to the authenticated Console (no operational workflow/service token)', () => {
    const { container } = renderDocsAt('/docs/web-services');
    expect(container.textContent).not.toMatch(/X-Service-Token/i);
    expect(container.textContent).not.toMatch(/create api key/i);
    expect(container.textContent).not.toMatch(/not enabled yet|not available yet|coming soon/i);
    expect(screen.getByText(/API-key management requires authorized access/i)).toBeInTheDocument();
    expect(container.textContent).toMatch(/RAPHA Console/i);
  });

  it('Windows page is conceptual — no installer command, control-plane URL, service internals; points to authenticated Deployment', () => {
    const { container } = renderDocsAt('/docs/windows');
    const t = container.textContent ?? '';
    expect(t).not.toMatch(/install-rapha\.ps1/i);
    expect(t).not.toMatch(/rapha\.emmatech\.in/i);
    expect(t).not.toMatch(/RAPHAAgent/);
    expect(t).not.toMatch(/uninstall-rapha/i);
    expect(t).toMatch(/RAPHA Deployment/i);
    expect(t).toMatch(/Request Private Access/i);
  });

  it('Quick Start distinguishes enrollment token from API key', () => {
    const { container } = renderDocsAt('/docs/quick-start');
    expect(container.textContent).toMatch(/enrollment token/i);
    expect(container.textContent).toMatch(/api key/i);
    expect(container.textContent).toMatch(/not.*an api key|different credential/i);
  });

  it('does not present any raw enrollment token as a real credential', () => {
    const { container } = renderDocsAt('/docs/register-sensor');
    // Placeholder-only; no realistic long token string.
    expect(container.textContent).not.toMatch(/renr_[A-Za-z0-9]{20,}/);
  });
});

describe('Footer documentation link', () => {
  it('exposes a Documentation link that navigates to the docs route', async () => {
    const onNavigate = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Footer onNavigate={onNavigate} />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByText('Documentation'));
    expect(onNavigate).toHaveBeenCalledWith('docs');
  });
});
