/**
 * Minimal structured logger.
 *
 * Only safe, non-sensitive fields are ever logged. Never pass passwords,
 * hashes, session secrets, cookies, the RAPHA service token, or API keys.
 */
export interface SafeLogFields {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  raphaTenantId?: string | null;
  operation?: string;
  status?: 'success' | 'failure';
  outcome?: string; // short machine token, e.g. 'rapha_conflict'
}

export function logInfo(fields: SafeLogFields): void {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', ...fields }));
}

export function logError(fields: SafeLogFields): void {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', ...fields }));
}
