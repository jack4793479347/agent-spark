import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential } from '../services/credential-vault.js';

export const webhookConnector: Connector = {
  id: 'webhook',
  name: 'Webhook',
  description: 'Send HTTP requests to external services',
  authType: 'webhook',
  category: 'utility',
  icon: 'link',

  getOAuthURL(): string {
    throw new Error('Webhook connector does not use OAuth');
  },

  async handleOAuthCallback(_code: string, _orgId: string) {
    throw new Error('Webhook connector does not use OAuth');
  },

  async refreshToken() {
    // Webhooks don't have tokens to refresh
  },

  async testConnection(credentialVaultId: string) {
    try {
      const cred = await getCredential(credentialVaultId);
      // Test by sending a HEAD request to the stored webhook URL
      const webhookUrl = cred.raw?.webhook_url as string;
      if (!webhookUrl) return false;
      const res = await fetch(webhookUrl, { method: 'HEAD' });
      return res.ok || res.status === 405; // 405 means URL exists but HEAD not allowed
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'send_webhook',
        description: 'Send an HTTP POST request to a webhook URL',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Webhook URL (overrides stored URL)' },
            method: { type: 'string', description: 'HTTP method (default POST)' },
            headers: { type: 'string', description: 'JSON object of custom headers' },
            body: { type: 'string', description: 'Request body (JSON string)' },
          },
        },
      },
      {
        name: 'fetch_url',
        description: 'Fetch data from a URL via GET request',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' },
            headers: { type: 'string', description: 'JSON object of custom headers' },
          },
          required: ['url'],
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      const cred = await getCredential(credentialVaultId);

      switch (toolName) {
        case 'send_webhook': {
          const url = (params.url as string) || (cred.raw?.webhook_url as string);
          if (!url) return { success: false, error: 'No webhook URL configured' };

          const method = ((params.method as string) || 'POST').toUpperCase();
          const customHeaders = params.headers ? JSON.parse(params.headers as string) : {};
          const apiKey = cred.raw?.api_key as string | undefined;

          const res = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
              ...customHeaders,
            },
            body: method !== 'GET' ? (params.body as string) || '{}' : undefined,
          });

          const text = await res.text();
          let data: unknown;
          try { data = JSON.parse(text); } catch { data = text; }

          return { success: res.ok, data, error: res.ok ? undefined : `HTTP ${res.status}` };
        }
        case 'fetch_url': {
          const url = params.url as string;
          const customHeaders = params.headers ? JSON.parse(params.headers as string) : {};

          const fetchApiKey = cred.raw?.api_key as string | undefined;
          const res = await fetch(url, {
            headers: {
              ...(fetchApiKey ? { Authorization: `Bearer ${fetchApiKey}` } : {}),
              ...customHeaders,
            },
          });

          const text = await res.text();
          let data: unknown;
          try { data = JSON.parse(text); } catch { data = text; }

          return { success: res.ok, data, error: res.ok ? undefined : `HTTP ${res.status}` };
        }
        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
