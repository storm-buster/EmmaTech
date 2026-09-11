import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { RequestAccessPage } from './RequestAccessPage';
import { theme } from '../../styles/theme';

vi.mock('../../access/accessClient', () => ({ submitAccessRequest: vi.fn() }));
import { submitAccessRequest } from '../../access/accessClient';
const submitMock = vi.mocked(submitAccessRequest);

function renderPage() {
  return render(
    <ThemeProvider theme={theme}>
      <RequestAccessPage />
    </ThemeProvider>,
  );
}

// Synchronous fills (deterministic under full-suite load; react-hook-form
// registers a plain onChange, so fireEvent.change is sufficient).
function fillRequired() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Ada Lovelace' } });
  fireEvent.change(screen.getByLabelText(/work email/i), { target: { value: 'ada@acme.com' } });
  fireEvent.change(screen.getByLabelText(/organization \*/i), { target: { value: 'Acme Corp' } });
  fireEvent.change(screen.getByLabelText(/industry/i), { target: { value: 'Technology / SaaS' } });
  fireEvent.change(screen.getByLabelText(/primary security challenge/i), { target: { value: 'Lateral movement detection.' } });
  fireEvent.change(screen.getByLabelText(/why are you evaluating rapha/i), { target: { value: 'Autonomous response for the SOC.' } });
}

beforeEach(() => {
  submitMock.mockReset();
});

describe('RequestAccessPage', () => {
  it('renders the application form', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: /request private access/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit request/i })).toBeInTheDocument();
  });

  it('blocks submission and shows validation errors when required fields are empty', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submits a valid application and shows the success state', async () => {
    submitMock.mockResolvedValue({ state: 'ok', id: 'ar-1', status: 'submitted' });
    renderPage();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText(/request received/i)).toBeInTheDocument();
    expect(submitMock).toHaveBeenCalledTimes(1);
  });

  it('maps server-side field errors onto the form', async () => {
    submitMock.mockResolvedValue({ state: 'invalid', fields: { work_email: 'Please use a valid work email.' } });
    renderPage();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    await waitFor(() => expect(screen.getByText(/please use a valid work email/i)).toBeInTheDocument());
  });

  it('shows a general error message on transport failure', async () => {
    submitMock.mockResolvedValue({ state: 'error', message: 'Unable to reach the server. Please try again.' });
    renderPage();
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));
    expect(await screen.findByText(/unable to reach the server/i)).toBeInTheDocument();
  });
});
