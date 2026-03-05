import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential, updateCredential } from '../services/credential-vault.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

async function fetchWithToken(url: string, vaultId: string, init?: RequestInit): Promise<Response> {
  const cred = await getCredential(vaultId);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${cred.access_token}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 401 && cred.refresh_token) {
    await googleSheetsConnector.refreshToken(vaultId);
    const refreshed = await getCredential(vaultId);
    return fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${refreshed.access_token}`, 'Content-Type': 'application/json', ...init?.headers },
    });
  }
  return res;
}

export const googleSheetsConnector: Connector = {
  id: 'google-sheets',
  name: 'Google Sheets',
  description: 'Read and write spreadsheet data',
  authType: 'oauth2',
  category: 'productivity',
  icon: 'table',

  getOAuthURL(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    return `${GOOGLE_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string) {
    const res = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        redirect_uri: `${process.env.API_URL}/connections/oauth/google-sheets/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Google Sheets OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'google-sheets', {
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string | undefined,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
    return { credentialVaultId: vaultId };
  },

  async refreshToken(credentialVaultId: string) {
    const cred = await getCredential(credentialVaultId);
    if (!cred.refresh_token) throw new Error('No refresh token');

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
    if (tokens.error) throw new Error(`Sheets refresh failed: ${tokens.error}`);

    await updateCredential(credentialVaultId, {
      ...cred,
      access_token: tokens.access_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      const res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType%3D%27application/vnd.google-apps.spreadsheet%27&pageSize=1', {
        headers: { Authorization: `Bearer ${cred.access_token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'read_range',
        description: 'Read data from a spreadsheet range',
        input_schema: {
          type: 'object',
          properties: {
            spreadsheet_id: { type: 'string', description: 'Spreadsheet ID' },
            range: { type: 'string', description: 'A1 notation range (e.g. Sheet1!A1:D10)' },
          },
          required: ['spreadsheet_id', 'range'],
        },
      },
      {
        name: 'write_range',
        description: 'Write data to a spreadsheet range',
        input_schema: {
          type: 'object',
          properties: {
            spreadsheet_id: { type: 'string', description: 'Spreadsheet ID' },
            range: { type: 'string', description: 'A1 notation range' },
            values: { type: 'string', description: 'JSON array of arrays (rows)' },
          },
          required: ['spreadsheet_id', 'range', 'values'],
        },
      },
      {
        name: 'append_rows',
        description: 'Append rows to the end of a sheet',
        input_schema: {
          type: 'object',
          properties: {
            spreadsheet_id: { type: 'string', description: 'Spreadsheet ID' },
            range: { type: 'string', description: 'Sheet name (e.g. Sheet1)' },
            values: { type: 'string', description: 'JSON array of arrays (rows)' },
          },
          required: ['spreadsheet_id', 'range', 'values'],
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const sid = params.spreadsheet_id as string;
      switch (toolName) {
        case 'read_range': {
          const range = encodeURIComponent(params.range as string);
          const res = await fetchWithToken(`${SHEETS_API}/${sid}/values/${range}`, credentialVaultId);
          if (!res.ok) return { success: false, error: `Read failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'write_range': {
          const range = encodeURIComponent(params.range as string);
          const values = JSON.parse(params.values as string);
          const res = await fetchWithToken(
            `${SHEETS_API}/${sid}/values/${range}?valueInputOption=USER_ENTERED`,
            credentialVaultId,
            { method: 'PUT', body: JSON.stringify({ values }) }
          );
          if (!res.ok) return { success: false, error: `Write failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'append_rows': {
          const range = encodeURIComponent(params.range as string);
          const values = JSON.parse(params.values as string);
          const res = await fetchWithToken(
            `${SHEETS_API}/${sid}/values/${range}:append?valueInputOption=USER_ENTERED`,
            credentialVaultId,
            { method: 'POST', body: JSON.stringify({ values }) }
          );
          if (!res.ok) return { success: false, error: `Append failed: ${res.status}` };
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
