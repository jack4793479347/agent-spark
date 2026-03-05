import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential, updateCredential } from '../services/credential-vault.js';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_API = 'https://api.hubapi.com';
const SCOPES = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read';

export const hubspotConnector: Connector = {
  id: 'hubspot',
  name: 'HubSpot',
  description: 'Manage CRM contacts and deals',
  authType: 'oauth2',
  category: 'crm',
  icon: 'hubspot',

  getOAuthURL(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.HUBSPOT_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      scope: SCOPES,
      state,
    });
    return `${HUBSPOT_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string) {
    const res = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID ?? '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET ?? '',
        redirect_uri: `${process.env.API_URL}/connections/oauth/hubspot/callback`,
        code,
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`HubSpot OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'hubspot', {
      access_token: tokens.access_token as string,
      refresh_token: tokens.refresh_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
    return { credentialVaultId: vaultId };
  },

  async refreshToken(credentialVaultId: string) {
    const cred = await getCredential(credentialVaultId);
    if (!cred.refresh_token) throw new Error('No refresh token');

    const res = await fetch(HUBSPOT_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID ?? '',
        client_secret: process.env.HUBSPOT_CLIENT_SECRET ?? '',
        refresh_token: cred.refresh_token,
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`HubSpot refresh failed: ${tokens.error}`);

    await updateCredential(credentialVaultId, {
      ...cred,
      access_token: tokens.access_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts?limit=1`, {
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
        name: 'search_contacts',
        description: 'Search HubSpot contacts',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results (default 10)' },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_contact',
        description: 'Create a new HubSpot contact',
        input_schema: {
          type: 'object',
          properties: {
            email: { type: 'string', description: 'Contact email' },
            firstname: { type: 'string', description: 'First name' },
            lastname: { type: 'string', description: 'Last name' },
          },
          required: ['email'],
        },
      },
      {
        name: 'get_deals',
        description: 'List recent deals from HubSpot',
        input_schema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Max results (default 10)' },
          },
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const cred = await getCredential(credentialVaultId);
      const headers = { Authorization: `Bearer ${cred.access_token}`, 'Content-Type': 'application/json' };

      switch (toolName) {
        case 'search_contacts': {
          const limit = (params.limit as number) || 10;
          const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: params.query, limit }),
          });
          if (!res.ok) return { success: false, error: `Search failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'create_contact': {
          const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ properties: params }),
          });
          if (!res.ok) return { success: false, error: `Create failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'get_deals': {
          const limit = (params.limit as number) || 10;
          const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/deals?limit=${limit}`, { headers });
          if (!res.ok) return { success: false, error: `Failed: ${res.status}` };
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
