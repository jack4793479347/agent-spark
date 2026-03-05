import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential, updateCredential } from '../services/credential-vault.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1';
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

async function fetchWithToken(url: string, vaultId: string, init?: RequestInit): Promise<Response> {
  const cred = await getCredential(vaultId);
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${cred.access_token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (res.status === 401 && cred.refresh_token) {
    await gmailConnector.refreshToken(vaultId);
    const refreshed = await getCredential(vaultId);
    return fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${refreshed.access_token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }

  return res;
}

export const gmailConnector: Connector = {
  id: 'gmail',
  name: 'Gmail',
  description: 'Send and read emails via Gmail',
  authType: 'oauth2',
  category: 'communication',
  icon: 'mail',

  getOAuthURL(orgId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: orgId,
    });
    return `${GOOGLE_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string): Promise<{ credentialVaultId: string }> {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${process.env.API_URL}/connections/oauth/gmail/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Gmail OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'gmail', {
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string | undefined,
      token_type: tokens.token_type as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
      scope: tokens.scope as string,
    });

    return { credentialVaultId: vaultId };
  },

  async refreshToken(credentialVaultId: string): Promise<void> {
    const cred = await getCredential(credentialVaultId);
    if (!cred.refresh_token) throw new Error('No refresh token available');

    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: cred.refresh_token,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
      }),
    });

    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Gmail refresh failed: ${tokens.error}`);

    await updateCredential(credentialVaultId, {
      ...cred,
      access_token: tokens.access_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
  },

  async testConnection(credentialVaultId: string): Promise<boolean> {
    try {
      const res = await fetchWithToken(`${GMAIL_API}/users/me/profile`, credentialVaultId);
      return res.ok;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'send_email',
        description: 'Send an email via Gmail',
        input_schema: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            subject: { type: 'string', description: 'Email subject line' },
            body: { type: 'string', description: 'Email body (plain text)' },
          },
          required: ['to', 'subject', 'body'],
        },
      },
      {
        name: 'read_emails',
        description: 'Read recent emails from Gmail inbox',
        input_schema: {
          type: 'object',
          properties: {
            max_results: { type: 'number', description: 'Number of emails to fetch (default 10)' },
            label: { type: 'string', description: 'Label to filter by (default INBOX)' },
          },
        },
      },
      {
        name: 'search_emails',
        description: 'Search emails using Gmail search query syntax',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Gmail search query' },
            max_results: { type: 'number', description: 'Max results (default 10)' },
          },
          required: ['query'],
        },
      },
    ];
  },

  async executeTool(toolName: string, params: Record<string, unknown>, credentialVaultId: string): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'send_email': {
          const raw = btoa(
            `To: ${params.to}\r\nSubject: ${params.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${params.body}`
          ).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

          const res = await fetchWithToken(`${GMAIL_API}/users/me/messages/send`, credentialVaultId, {
            method: 'POST',
            body: JSON.stringify({ raw }),
          });
          if (!res.ok) return { success: false, error: `Send failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }

        case 'read_emails': {
          const max = (params.max_results as number) || 10;
          const label = (params.label as string) || 'INBOX';
          const listRes = await fetchWithToken(
            `${GMAIL_API}/users/me/messages?maxResults=${max}&labelIds=${label}`,
            credentialVaultId
          );
          if (!listRes.ok) return { success: false, error: 'Failed to list emails' };

          const list = await listRes.json() as { messages?: Array<{ id: string }> };
          const emails = await Promise.all(
            (list.messages ?? []).slice(0, max).map(async (msg) => {
              const r = await fetchWithToken(
                `${GMAIL_API}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
                credentialVaultId
              );
              return r.ok ? r.json() : null;
            })
          );
          return { success: true, data: emails.filter(Boolean) };
        }

        case 'search_emails': {
          const max = (params.max_results as number) || 10;
          const q = encodeURIComponent(params.query as string);
          const res = await fetchWithToken(
            `${GMAIL_API}/users/me/messages?maxResults=${max}&q=${q}`,
            credentialVaultId
          );
          if (!res.ok) return { success: false, error: 'Search failed' };
          return { success: true, data: await res.json() };
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
