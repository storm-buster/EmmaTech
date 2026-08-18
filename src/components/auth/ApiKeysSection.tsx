import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Button } from '../Button';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  rotateApiKey,
  type ApiKeyCreated,
  type ApiKeyMetadata,
} from '../../auth/apiKeysClient';
import { AuthApiError } from '../../auth/authClient';

const Section = styled.section`
  margin-top: ${({ theme }) => theme.spacing.xl};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.neutral.border};
`;

const Heading = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.neutral.white};
  margin-bottom: 4px;
`;

const Description = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const KeyRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral.border};
  flex-wrap: wrap;
`;

const KeyMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const KeyName = styled.span`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.neutral.white};
  font-weight: 600;
`;

const KeySub = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const StatusPill = styled.span<{ $revoked: boolean }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.neutral.white};
  background: ${({ $revoked, theme }) =>
    $revoked ? theme.colors.semantic.error : theme.colors.semantic.success};
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

const CreateRow = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.neutral.border};
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.neutral.white};
  font-size: 14px;
`;

const RevealBox = styled.div`
  margin: ${({ theme }) => theme.spacing.md} 0;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.primary.main};
  border-radius: 12px;
  background: ${({ theme }) => theme.gradients.card};
`;

const RawKey = styled.code`
  display: block;
  word-break: break-all;
  font-family: ${({ theme }) => theme.typography.fontFamily.monospace};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.primary.main};
  background: rgba(0, 0, 0, 0.35);
  padding: 10px 12px;
  border-radius: 8px;
  margin: ${({ theme }) => theme.spacing.sm} 0;
`;

const Warn = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.semantic.warning};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.semantic.error};
  margin: ${({ theme }) => theme.spacing.sm} 0 0;
`;

const Muted = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.neutral.mediumGray};
`;

const ConfirmBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`;

function fmtDate(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso : new Date(t).toLocaleString();
}

interface Reveal {
  rawKey: string;
  name: string;
  rotated: boolean;
}

type Confirm = { action: 'rotate' | 'revoke'; keyId: string; name: string } | null;

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyMetadata[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await listApiKeys());
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Unable to load API keys');
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyCreated = (created: ApiKeyCreated, rotated: boolean) => {
    // Raw key lives ONLY in transient state for the immediate reveal; it is
    // never written to localStorage/sessionStorage/URL and is dropped on dismiss.
    setReveal({ rawKey: created.raw_key, name: created.api_key.name, rotated });
    setCopied(false);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('A key name is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createApiKey({ name: trimmed, scopes: ['ingest'] });
      applyCreated(created, false);
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Unable to create API key');
    } finally {
      setBusy(false);
    }
  };

  const doRotate = async (keyId: string) => {
    setBusy(true);
    setError(null);
    try {
      const created = await rotateApiKey(keyId);
      applyCreated(created, true);
      await load();
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Unable to rotate API key');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const doRevoke = async (keyId: string) => {
    setBusy(true);
    setError(null);
    try {
      await revokeApiKey(keyId);
      await load();
    } catch (err) {
      setError(err instanceof AuthApiError ? err.message : 'Unable to revoke API key');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const copyRaw = async () => {
    if (!reveal) return;
    try {
      await navigator.clipboard?.writeText(reveal.rawKey);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const active = (keys ?? []).filter((k) => !k.revoked_at);

  return (
    <Section aria-label="API Keys">
      <Heading>API Keys</Heading>
      <Description>Use API keys to connect your RAPHA deployment to external systems.</Description>

      {reveal && (
        <RevealBox role="dialog" aria-modal="true" aria-label="New API key">
          <Warn>
            {reveal.rotated
              ? 'Key rotated. The previous key is no longer usable. Copy the new key now — it will not be shown again.'
              : 'Copy this key now — it will not be shown again.'}
          </Warn>
          <KeySub>{reveal.name}</KeySub>
          <RawKey data-testid="raw-key">{reveal.rawKey}</RawKey>
          <Actions>
            <Button variant="secondary" onClick={copyRaw} type="button">
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button variant="primary" onClick={() => setReveal(null)} type="button">
              Done
            </Button>
          </Actions>
        </RevealBox>
      )}

      {loading && <Muted>Loading API keys…</Muted>}

      {!loading && active.length === 0 && !reveal && (
        <Muted>No API keys yet. Create one to integrate with the RAPHA API.</Muted>
      )}

      {!loading &&
        (keys ?? []).map((k) => {
          const revoked = Boolean(k.revoked_at);
          const isConfirming = confirm?.keyId === k.id;
          return (
            <KeyRow key={k.id}>
              <KeyMeta>
                <KeyName>{k.name}</KeyName>
                <KeySub>
                  {(k.scopes ?? []).join(', ') || '—'} · created {fmtDate(k.created_at)}
                </KeySub>
              </KeyMeta>
              <Actions>
                <StatusPill $revoked={revoked}>{revoked ? 'Revoked' : 'Active'}</StatusPill>
                {!revoked && !isConfirming && (
                  <>
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirm({ action: 'rotate', keyId: k.id, name: k.name })}
                    >
                      Rotate
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={busy}
                      onClick={() => setConfirm({ action: 'revoke', keyId: k.id, name: k.name })}
                    >
                      Revoke
                    </Button>
                  </>
                )}
                {!revoked && isConfirming && (
                  <ConfirmBar>
                    <KeySub>
                      {confirm.action === 'rotate'
                        ? 'Rotate this key? The current key stops working.'
                        : 'Revoke this key? This cannot be undone.'}
                    </KeySub>
                    <Button
                      variant="primary"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        confirm.action === 'rotate' ? doRotate(k.id) : doRevoke(k.id)
                      }
                    >
                      {busy ? 'Working…' : `Confirm ${confirm.action}`}
                    </Button>
                    <Button variant="secondary" type="button" disabled={busy} onClick={() => setConfirm(null)}>
                      Cancel
                    </Button>
                  </ConfirmBar>
                )}
              </Actions>
            </KeyRow>
          );
        })}

      <CreateRow onSubmit={onCreate}>
        <label htmlFor="api-key-name" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          API key name
        </label>
        <NameInput
          id="api-key-name"
          type="text"
          placeholder="Key name (e.g. SIEM integration)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create API key'}
        </Button>
      </CreateRow>

      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Section>
  );
}
