import type { Connector, MCPToolDefinition, ToolResult } from './interface.js';
import { getCredential, storeCredential, updateCredential } from '../services/credential-vault.js';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

async function fetchWithToken(url: string, vaultId: string, init?: RequestInit): Promise<Response> {
  const cred = await getCredential(vaultId);
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${cred.access_token}`, 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 401 && cred.refresh_token) {
    await googleCalendarConnector.refreshToken(vaultId);
    const refreshed = await getCredential(vaultId);
    return fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${refreshed.access_token}`, 'Content-Type': 'application/json', ...init?.headers },
    });
  }
  return res;
}

export const googleCalendarConnector: Connector = {
  id: 'google-calendar',
  name: 'Google Calendar',
  description: 'Create, read, and manage calendar events',
  authType: 'oauth2',
  category: 'productivity',
  icon: 'calendar',

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
        redirect_uri: `${process.env.API_URL}/connections/oauth/google-calendar/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await res.json() as Record<string, unknown>;
    if (tokens.error) throw new Error(`Google Calendar OAuth failed: ${tokens.error}`);

    const vaultId = await storeCredential(orgId, 'google-calendar', {
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
    if (tokens.error) throw new Error(`Calendar refresh failed: ${tokens.error}`);

    await updateCredential(credentialVaultId, {
      ...cred,
      access_token: tokens.access_token as string,
      expires_at: new Date(Date.now() + (tokens.expires_in as number) * 1000).toISOString(),
    });
  },

  async testConnection(credentialVaultId: string) {
    try {
      const res = await fetchWithToken(`${CALENDAR_API}/users/me/calendarList?maxResults=1`, credentialVaultId);
      return res.ok;
    } catch {
      return false;
    }
  },

  getTools(): MCPToolDefinition[] {
    return [
      {
        name: 'list_events',
        description: 'List upcoming calendar events',
        input_schema: {
          type: 'object',
          properties: {
            max_results: { type: 'number', description: 'Max events to return (default 10)' },
            calendar_id: { type: 'string', description: 'Calendar ID (default primary)' },
          },
        },
      },
      {
        name: 'create_event',
        description: 'Create a new calendar event',
        input_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Event title' },
            start: { type: 'string', description: 'Start time (ISO 8601)' },
            end: { type: 'string', description: 'End time (ISO 8601)' },
            description: { type: 'string', description: 'Event description' },
            attendees: { type: 'string', description: 'Comma-separated attendee emails' },
          },
          required: ['summary', 'start', 'end'],
        },
      },
    ];
  },

  async executeTool(toolName, params, credentialVaultId): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'list_events': {
          const calId = (params.calendar_id as string) || 'primary';
          const max = (params.max_results as number) || 10;
          const now = new Date().toISOString();
          const res = await fetchWithToken(
            `${CALENDAR_API}/calendars/${encodeURIComponent(calId)}/events?maxResults=${max}&timeMin=${encodeURIComponent(now)}&orderBy=startTime&singleEvents=true`,
            credentialVaultId
          );
          if (!res.ok) return { success: false, error: `List failed: ${res.status}` };
          return { success: true, data: await res.json() };
        }
        case 'create_event': {
          const attendees = params.attendees
            ? (params.attendees as string).split(',').map((e) => ({ email: e.trim() }))
            : undefined;
          const body = {
            summary: params.summary,
            description: params.description,
            start: { dateTime: params.start, timeZone: 'UTC' },
            end: { dateTime: params.end, timeZone: 'UTC' },
            attendees,
          };
          const res = await fetchWithToken(`${CALENDAR_API}/calendars/primary/events`, credentialVaultId, {
            method: 'POST',
            body: JSON.stringify(body),
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
