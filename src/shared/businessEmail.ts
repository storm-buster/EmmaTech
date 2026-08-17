/**
 * Business (work) email heuristic — shared by the browser (UX hint) and the
 * server (authoritative check for Growth signup).
 *
 * IMPORTANT / LIMITATION: this only rejects *obvious consumer* email domains.
 * It does NOT prove company identity or verify employment. A domain that is not
 * on the consumer denylist is treated as "not an obvious consumer email" — not
 * as a verified enterprise. Real enterprise verification (domain ownership,
 * SSO/SCIM, DNS TXT, etc.) is out of scope and must not be implied.
 *
 * Design: a maintainable denylist of well-known consumer/free mailbox providers
 * (NOT an allowlist of companies). Corporate Google Workspace / Microsoft 365
 * identities use the company's own domain (e.g. employee@acme.com) and are
 * therefore accepted; only mailbox-provider domains (gmail.com, outlook.com…)
 * are rejected.
 */

/** Well-known consumer / free mailbox provider domains (extend as needed). */
export const CONSUMER_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'ymail.com',
  'rocketmail.com',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'gmx.net',
  'mail.com',
  'yandex.com',
  'yandex.ru',
  'zoho.com',
  'pm.me',
  'hey.com',
  'fastmail.com',
  'tutanota.com',
  'rediffmail.com',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercased domain part of an email, or null if the email is malformed. */
export function emailDomain(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized)) return null;
  const at = normalized.lastIndexOf('@');
  const domain = normalized.slice(at + 1);
  return domain || null;
}

/** True if the email uses an obvious consumer mailbox provider. */
export function isConsumerEmailDomain(email: unknown): boolean {
  const domain = emailDomain(email);
  return domain !== null && CONSUMER_EMAIL_DOMAINS.has(domain);
}

/**
 * True if the email looks like a work/business email — i.e. it is a
 * syntactically valid email whose domain is NOT an obvious consumer provider.
 * (Not proof of company identity — see file header.)
 */
export function isBusinessEmail(email: unknown): boolean {
  const domain = emailDomain(email);
  return domain !== null && !CONSUMER_EMAIL_DOMAINS.has(domain);
}

/** Customer-facing message for the Growth work-email requirement. */
export const WORK_EMAIL_REQUIRED_MESSAGE = 'Work email required for Growth';
