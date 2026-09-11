/**
 * Lightweight, provider-agnostic analytics event abstraction (Phase 1).
 *
 * NO analytics provider is configured in this phase (see the audit). This module
 * exists so commercial-funnel events can be emitted from the UI now and wired to
 * a real provider (GA4 / GTM / privacy-friendly analytics) in Phase 2/3 WITHOUT
 * touching call sites.
 *
 * Behavior:
 * - If a `window.dataLayer` array exists (e.g. GTM installed later), the event
 *   is pushed there.
 * - Otherwise it is a safe no-op (a dev-only console.debug aids local testing).
 *
 * PRIVACY: never pass PII (names, emails, free-text) as event properties. Only
 * coarse, non-identifying context (e.g. a source label) is allowed.
 */

export type AnalyticsEventName =
  | 'request_access_click'
  | 'request_access_start'
  | 'request_access_submit'
  | 'private_deployment_view'
  | 'sign_in_click';

type EventProps = Record<string, string | number | boolean | undefined>;

interface DataLayerWindow {
  dataLayer?: Array<Record<string, unknown>>;
}

export function trackEvent(name: AnalyticsEventName, props: EventProps = {}): void {
  try {
    if (typeof window === 'undefined') return;
    const w = window as unknown as DataLayerWindow;
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...props });
      return;
    }
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[analytics:noop]', name, props);
    }
  } catch {
    /* analytics must never break the UI */
  }
}
