import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './auth/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { applyLegacyHashRedirect } from './routing';

// Compatibility shim: rewrite any legacy `#/…` URL to its pathname equivalent
// (e.g. `#/product` → `/rapha`, `#/pricing` → `/private-deployment`) before the
// app renders. Uses replaceState (no history entry, no navigation loop). Hash
// fragments never reach the server, so this must run client-side at bootstrap.
applyLegacyHashRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
