/**
 * Email delivery abstraction for transactional messages (currently: signup OTP).
 *
 * SECURITY / OPERATIONS:
 * - The OTP code is passed to `sendOtp` but is NEVER logged by any adapter and
 *   NEVER returned to the caller/client.
 * - The Resend API key is read ONLY from an environment variable (by name);
 *   it is never hardcoded, returned, or logged.
 * - In production, if email is not configured, `getEmailSender` returns null so
 *   the caller FAILS CLOSED (surfaces a server error) rather than pretending an
 *   OTP was sent.
 * - In non-production without configuration, a dev sender is used that logs only
 *   that a message was dispatched (never the code) so local flows work.
 */
import type { AppConfig } from './config.js';
import { logInfo } from './log.js';

export interface EmailSender {
  /** Deliver a signup OTP to `to`. Must never log or echo `code`. */
  sendOtp(to: string, code: string): Promise<void>;
}

const OTP_SUBJECT = 'Your EmmaTech verification code';

function otpText(code: string): string {
  return [
    'Your EmmaTech verification code is:',
    '',
    `    ${code}`,
    '',
    'It expires in 10 minutes. If you did not request this, you can ignore this email.',
  ].join('\n');
}

/** Production adapter — delivers via the Resend HTTP API. */
export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async sendOtp(to: string, code: string): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [to],
        subject: OTP_SUBJECT,
        text: otpText(code),
      }),
    });
    if (!res.ok) {
      // Never include the code or the API key in the error.
      throw new Error(`email_send_failed:${res.status}`);
    }
  }
}

/**
 * Dev/local sender. Confirms dispatch WITHOUT ever logging the code. Used only
 * outside production when no provider is configured, so local signup works.
 */
export class DevLogEmailSender implements EmailSender {
  async sendOtp(to: string): Promise<void> {
    logInfo({ operation: 'email.otp_dispatch', status: 'success', outcome: 'dev_sender' });
    void to;
  }
}

/**
 * Resolve the email sender for the current environment.
 * - Configured (RESEND_API_KEY + OTP_EMAIL_FROM): Resend adapter.
 * - Not configured + NOT production: dev sender (local flows work).
 * - Not configured + production: null → caller must FAIL CLOSED.
 */
export function getEmailSender(cfg: AppConfig): EmailSender | null {
  if (cfg.resendApiKey && cfg.otpEmailFrom) {
    return new ResendEmailSender(cfg.resendApiKey, cfg.otpEmailFrom);
  }
  if (!cfg.isProduction) {
    return new DevLogEmailSender();
  }
  return null;
}
