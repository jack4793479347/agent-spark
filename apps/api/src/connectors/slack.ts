import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential } from '../services/credential-vault.js';

const SLACK_AUTH_URL = 'https://slack.com/oauth/v2/authorize';
const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access';
const SLACK_API = 'https://slack.com/api';
const SCOPES = 'channels:read,channels:history,chat:write,groups:read,groups:history';

async function slackApi(method: string, vaultId: string, body?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const cred = await getCredential(vaultId);
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cred.access_token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<Record<string, unknown>>;
}

export const slackConnector: Connector = {
  id: 'slack',
  name: 'Slack',
  description: 'Send messages and read channels in Slack',
  authType: 'oauth2',
  category: 'communication',
  icon: 'message-square',

  getOAuthURL(orgId: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID ?? '',
      redirect_uri: redirectUri,
      scope: SCOPES,
      state: orgId,
    });
    return `${SLACK_AUTH_URL}?${params}`;
  },

  async handleOAuthCallback(code: string, orgId: string): Promise<{ credentialVaultId: string }> {
    const res = await fetch(SLACK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.SLACK_CLIENT_ID ?? '',
        client_secret: process.env.SLACK_CLIENT_SECRET ?? '',
        redirect_uri: `${process.env.API_URL}/connections/oauth/slack/callback`,
      }),
    });

    const tokens = await res.json() as Record<string, unknown>;
    // Slack v2 OAuth: check ok field, not HTTP status
    if (tokens.ok === false) {
      throw new Error(`Slack OAuth failed: ${tokens.error}`);
    }

    const vaultId = await storeCredential(orgId, 'slack', {
      access_token: tokens.access_token as string,
      token_type: 'Bearer',
      scope: tokens.scope as string,
      raw: {
        team_id: (tokens.team as Record<string, unknown>)?.id,
        team_name: (tokens.team as Record<string, unknown>)?.name,
        bot_user_id: tokens.bot_user_id,
      },
    });

    return { credentialVaultId: vaultId };
  },

  // Slack bot tokens don't expire — no refresh needed
  async refreshToken(): Promise<void> {
    // No-op: Slack bot tokens never expire
  },

  async testConnection(credentialVaultId: string): Promise<boolean> {
    try {
      const data = await slackApi('auth.test', credentialVaultId);
      return data.ok === true;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'send_message',
        description: 'Send a message to a Slack channel',
        input_schema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID or name (e.g. #general or C012345)' },
            text: { type: 'string', description: 'Message text (supports Slack markdown)' },
          },
          required: ['channel', 'text'],
        },
      },
      {
        name: 'read_channel',
        description: 'Read recent messages from a Slack channel',
        input_schema: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel ID' },
            limit: { type: 'number', description: 'Number of messages to fetch (default 20)' },
          },
          required: ['channel'],
        },
      },
      {
        name: 'create_channel',
        description: 'Create a new Slack channel',
        input_schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Channel name (lowercase, no spaces)' },
            is_private: { type: 'boolean', description: 'Whether the channel is private (default false)' },
          },
          required: ['name'],
        },
      },
    ];
  },

  async executeTool(toolName: string, params: Record<string, unknown>, credentialVaultId: string): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'send_message': {
          const data = await slackApi('chat.postMessage', credentialVaultId, {
            channel: params.channel,
            text: params.text,
          });
          if (!data.ok) return { success: false, error: `Slack error: ${data.error}` };
          return { success: true, data: { ts: data.ts, channel: data.channel } };
        }

        case 'read_channel': {
          const data = await slackApi('conversations.history', credentialVaultId, {
            channel: params.channel,
            limit: (params.limit as number) || 20,
          });
          if (!data.ok) return { success: false, error: `Slack error: ${data.error}` };
          return { success: true, data: data.messages };
        }

        case 'create_channel': {
          const data = await slackApi('conversations.create', credentialVaultId, {
            name: params.name,
            is_private: params.is_private ?? false,
          });
          if (!data.ok) return { success: false, error: `Slack error: ${data.error}` };
          return { success: true, data: data.channel };
        }

        default:
          return { success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  },
};
