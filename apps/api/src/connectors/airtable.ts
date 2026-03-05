import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential } from '../services/credential-vault.js';

const AIRTABLE_AUTH_URL = 'https://airtable.com/oauth2/v1/authorize';
const AIRTABLE_TOKEN_URL = 'https://airtable.com/oauth2/v1/token';
const AIRTABLE_API = 'https://api.airtable.com/v0';

export const airtableConnector: Connector = {
  id: 'airtable',
  name: 'Airtable',
  description: 'Read and write Airtable bases and records',
  authType: 'oauth2',
  category: 'productivity',
  icon: 'database',

  getOAuthURL(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.AIRTABLE_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
      scope: 'data.records:read data.records:write schema.bases:read',
      code_challenge_method: 'plain',
      code_challenge: state, // simplified; production should use S256
    });
    return `${AIRTABLE_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string) {
    const res = await fetch(AIRTABLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.API_URL}/connections/oauth/airtable/callback`,
        code_verifier: code, // simplified
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Airtable OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'airtable', {
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
    return { credentialVaultId: vaultId };
  },

  async refreshToken(credentialVaultId: string) {
    const cred = await getCredential(credentialVaultId);
    if (!cred.refresh_token) throw new Error('No refresh token');

    const res = await fetch(AIRTABLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: cred.refresh_token,
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Airtable refresh failed: ${tokens.error}`);

    const { updateCredential: update } = await import('../services/credential-vault.js');
    await update(credentialVaultId, {
      ...cred,
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      const res = await fetch('https://api.airtable.com/v0/meta/bases', {
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
        name: 'list_records',
        description: 'List records from an Airtable table',
        input_schema: {
          type: 'object',
          properties: {
            base_id: { type: 'string', description: 'Airtable base ID' },
            table_name: { type: 'string', description: 'Table name' },
            max_records: { type: 'number', description: 'Max records (default 20)' },
          },
          required: ['base_id', 'table_name'],
        },
      },
      {
        name: 'create_record',
        description: 'Create a record in an Airtable table',
        input_schema: {
          type: 'object',
          properties: {
            base_id: { type: 'string', description: 'Airtable base ID' },
            table_name: { type: 'string', description: 'Table name' },
            fields: { type: 'string', description: 'JSON object of field values' },
          },
          required: ['base_id', 'table_name', 'fields'],
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const cred = await getCredential(credentialVaultId);
      const headers = { Authorization: `Bearer ${cred.access_token}`, 'Content-Type': 'application/json' };
      const baseId = params.base_id as string;
      const table = encodeURIComponent(params.table_name as string);

      switch (toolName) {
        case 'list_records': {
          const max = (params.max_records as number) || 20;
          const res = await fetch(`${AIRTABLE_API}/${baseId}/${table}?maxRecords=${max}`, { headers });
          if (!res.ok) return { success: false, error: `List failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'create_record': {
          const fields = JSON.parse(params.fields as string);
          const res = await fetch(`${AIRTABLE_API}/${baseId}/${table}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ fields }),
          });
          if (!res.ok) return { success: false, error: `Create failed: ${res.status}` };
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
