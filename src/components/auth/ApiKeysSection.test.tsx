import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { ApiKeysSection } from './ApiKeysSection';
import { theme } from '../../styles/theme';

vi.mock('../../auth/apiKeysClient', () => ({
  listApiKeys: vi.fn(),
  createApiKey: vi.fn(),
  rotateApiKey: vi.fn(),
  revokeApiKey: vi.fn(),
}));
import {
  listApiKeys,
  createApiKey,
  rotateApiKey,
  revokeApiKey,
} from '../../auth/apiKeysClient';

const listMock = vi.mocked(listApiKeys);
const createMock = vi.mocked(createApiKey);
const rotateMock = vi.mocked(rotateApiKey);
const revokeMock = vi.mocked(revokeApiKey);

const KEY = {
  id: 'k1',
  name: 'CI',
  scopes: ['ingest'],
  created_at: '2026-01-01T00:00:00Z',
  revoked_at: null as string | null,
};

function renderSection() {
  return render(
    <ThemeProvider theme={theme}>
      <ApiKeysSection />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  listMock.mockReset().mockResolvedValue([]);
  createMock.mockReset();
  rotateMock.mockReset();
  revokeMock.mockReset();
});

describe('ApiKeysSection', () => {
  it('renders heading + description and shows a loading then empty state', async () => {
    renderSection();
    expect(screen.getByText('API Keys')).toBeInTheDocument();
    expect(screen.getByText(/connect your RAPHA deployment/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading API keys/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument());
  });

  it('renders sanitized key metadata + Active status', async () => {
    listMock.mockResolvedValue([KEY]);
    renderSection();
    await waitFor(() => expect(screen.getByText('CI')).toBeInTheDocument());
    expect(screen.getByText(/ingest/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not reveal a raw key before create', async () => {
    listMock.mockResolvedValue([KEY]);
    renderSection();
    await waitFor(() => expect(screen.getByText('CI')).toBeInTheDocument());
    expect(screen.queryByTestId('raw-key')).not.toBeInTheDocument();
  });

  it('create flow reveals the raw key exactly once with a copy action', async () => {
    createMock.mockResolvedValue({
      api_key: { ...KEY, id: 'k2', name: 'SIEM' },
      raw_key: 'rapha_raw_ABC123',
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderSection();
    await waitFor(() => expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('API key name'), { target: { value: 'SIEM' } });
    fireEvent.click(screen.getByRole('button', { name: /create api key/i }));

    await waitFor(() => expect(screen.getByTestId('raw-key')).toBeInTheDocument());
    expect(screen.getByTestId('raw-key').textContent).toBe('rapha_raw_ABC123');
    expect(screen.getByText(/will not be shown again/i)).toBeInTheDocument();
    expect(createMock).toHaveBeenCalledWith({ name: 'SIEM', scopes: ['ingest'] });

    // Copy uses the clipboard, not web storage.
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByRole('button', { name: /^copy$/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('rapha_raw_ABC123'));

    // Dismiss → raw key gone.
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }));
    await waitFor(() => expect(screen.queryByTestId('raw-key')).not.toBeInTheDocument());

    // No secret ever written to localStorage/sessionStorage.
    expect(setItem).not.toHaveBeenCalled();
  });

  it('rotate requires confirmation and reveals the new key once', async () => {
    listMock.mockResolvedValue([KEY]);
    rotateMock.mockResolvedValue({
      api_key: { ...KEY, id: 'k1', name: 'CI' },
      raw_key: 'rapha_raw_NEW999',
    });
    renderSection();
    await waitFor(() => expect(screen.getByText('CI')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^rotate$/i }));
    expect(screen.getByText(/Rotate this key\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirm rotate/i }));

    await waitFor(() => expect(screen.getByTestId('raw-key')).toBeInTheDocument());
    expect(screen.getByTestId('raw-key').textContent).toBe('rapha_raw_NEW999');
    expect(screen.getByText(/previous key is no longer usable/i)).toBeInTheDocument();
    expect(rotateMock).toHaveBeenCalledWith('k1');
  });

  it('revoke requires confirmation and updates the list', async () => {
    listMock.mockResolvedValueOnce([KEY]); // initial
    revokeMock.mockResolvedValue(undefined);
    listMock.mockResolvedValueOnce([{ ...KEY, revoked_at: '2026-02-01T00:00:00Z' }]); // after revoke
    renderSection();
    await waitFor(() => expect(screen.getByText('CI')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /^revoke$/i }));
    expect(screen.getByText(/Revoke this key\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /confirm revoke/i }));

    await waitFor(() => expect(revokeMock).toHaveBeenCalledWith('k1'));
    await waitFor(() => expect(screen.getByText('Revoked')).toBeInTheDocument());
  });

  it('shows an error state when listing fails', async () => {
    listMock.mockRejectedValue(new Error('boom'));
    renderSection();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});
