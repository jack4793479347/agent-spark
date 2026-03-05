import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential, updateCredential } from '../services/credential-vault.js';

const NOTION_AUTH_URL = 'https://api.notion.com/v1/oauth/authorize';
const NOTION_TOKEN_URL = 'https://api.notion.com/v1/oauth/token';
const NOTION_API = 'https://api.notion.com/v1';

export const notionConnector: Connector = {
  id: 'notion',
  name: 'Notion',
  description: 'Read and write Notion pages and databases',
  authType: 'oauth2',
  category: 'productivity',
  icon: 'notion',

  getOAuthURL(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.NOTION_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      response_type: 'code',
      owner: 'user',
      state,
    });
    return `${NOTION_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string) {
    const credentials = btoa(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`);
    const res = await fetch(NOTION_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.API_URL}/connections/oauth/notion/callback`,
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Notion OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'notion', {
      access_token: tokens.access_token as string,
      raw: { workspace_id: tokens.workspace_id as string },
    });
    return { credentialVaultId: vaultId };
  },

  async refreshToken() {
    // Notion uses non-expiring tokens — no refresh needed
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      const res = await fetch(`${NOTION_API}/users/me`, {
        headers: {
          Authorization: `Bearer ${cred.access_token}`,
          'Notion-Version': '2022-06-28',
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'search_pages',
        description: 'Search Notion pages by title',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_page',
        description: 'Create a new Notion page',
        input_schema: {
          type: 'object',
          properties: {
            parent_page_id: { type: 'string', description: 'Parent page ID' },
            title: { type: 'string', description: 'Page title' },
            content: { type: 'string', description: 'Page content (markdown)' },
          },
          required: ['title'],
        },
      },
      {
        name: 'query_database',
        description: 'Query a Notion database',
        input_schema: {
          type: 'object',
          properties: {
            database_id: { type: 'string', description: 'Database ID' },
            page_size: { type: 'number', description: 'Max results (default 10)' },
          },
          required: ['database_id'],
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const cred = await getCredential(credentialVaultId);
      const headers = {
        Authorization: `Bearer ${cred.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      };

      switch (toolName) {
        case 'search_pages': {
          const res = await fetch(`${NOTION_API}/search`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: params.query, page_size: 10 }),
          });
          if (!res.ok) return { success: false, error: `Search failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'create_page': {
          const parent = params.parent_page_id
            ? { page_id: params.parent_page_id as string }
            : { page_id: '' }; // requires a parent
          const res = await fetch(`${NOTION_API}/pages`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              parent,
              properties: {
                title: { title: [{ text: { content: params.title as string } }] },
              },
            }),
          });
          if (!res.ok) return { success: false, error: `Create failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'query_database': {
          const res = await fetch(`${NOTION_API}/databases/${params.database_id}/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ page_size: (params.page_size as number) || 10 }),
          });
          if (!res.ok) return { success: false, error: `Query failed: ${res.status}` };
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
