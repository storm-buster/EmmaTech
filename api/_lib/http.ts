/**
 * Small HTTP helpers shared by the api/ serverless handlers.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';

export function sendJson(res: VercelResponse, status: number, body: unknown): void {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  // No-store: authenticated responses must not be cached by shared caches.
  res.setHeader('Cache-Control', 'no-store');
  res.json(body);
}

export function methodNotAllowed(res: VercelResponse, allow: string): void {
  res.setHeader('Allow', allow);
  sendJson(res, 405, { error: 'Method Not Allowed' });
}

/** Vercel parses JSON bodies, but be defensive about strings / missing bodies. */
export function readJsonBody(req: VercelRequest): Record<string, unknown> {
  const body = req.body;
  if (body == null) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') return body as Record<string, unknown>;
  return {};
}

export function newRequestId(): string {
  return randomUUID();
}
