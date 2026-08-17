import { describe, it, expect } from 'vitest';
import {
  isBusinessEmail,
  isConsumerEmailDomain,
  emailDomain,
  WORK_EMAIL_REQUIRED_MESSAGE,
} from './businessEmail';

describe('businessEmail', () => {
  it('rejects obvious consumer domains for Growth', () => {
    expect(isBusinessEmail('employee@gmail.com')).toBe(false);
    expect(isBusinessEmail('employee@yahoo.com')).toBe(false);
    expect(isBusinessEmail('someone@outlook.com')).toBe(false);
    expect(isBusinessEmail('someone@icloud.com')).toBe(false);
    expect(isConsumerEmailDomain('employee@gmail.com')).toBe(true);
  });

  it('accepts corporate domains (incl. Google Workspace / Microsoft 365 custom domains)', () => {
    expect(isBusinessEmail('employee@acme.com')).toBe(true); // e.g. Google Workspace on acme.com
    expect(isBusinessEmail('employee@company.in')).toBe(true);
    expect(isBusinessEmail('user@contoso.com')).toBe(true); // e.g. Microsoft 365 on contoso.com
    expect(isConsumerEmailDomain('employee@acme.com')).toBe(false);
  });

  it('treats malformed emails as neither business nor consumer', () => {
    expect(isBusinessEmail('not-an-email')).toBe(false);
    expect(isConsumerEmailDomain('not-an-email')).toBe(false);
    expect(emailDomain('not-an-email')).toBeNull();
    expect(emailDomain('a@b.com')).toBe('b.com');
  });

  it('is case-insensitive on the domain', () => {
    expect(isConsumerEmailDomain('Person@GMAIL.com')).toBe(true);
    expect(isBusinessEmail('Person@Acme.COM')).toBe(true);
  });

  it('exposes the customer-facing message', () => {
    expect(WORK_EMAIL_REQUIRED_MESSAGE).toBe('Work email required for Growth');
  });
});
