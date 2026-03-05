import { Hono } from 'hono';
import { setCookie, getCookie, deleteCookie } from 'hono/cookie';
import { randomBytes } from 'node:crypto';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { tenantScopeMiddleware } from '../middleware/tenant-scope.js';
import { loadConnector, hasConnector } from '../services/connector-manager.js';
import { revokeCredential } from '../services/credential-vault.js';
import type { AuthContext, OrgContext } from '../middleware/auth.js';

export const connectionRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
    org: OrgContext;
  };
}>();

// All routes require auth + tenant scope
connectionRoutes.use('*', authMiddleware, tenantScopeMiddleware);

// ─── GET /available — List available connector types ───────────
connectionRoutes.get('/available', async (c) => {
  const { data: types, error } = await supabaseAdmin
    .from('connector_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ connector_types: types });
});

// ─── GET / — List org's connections ────────────────────────────
connectionRoutes.get('/', async (c) => {
  const { orgId } = c.get('org');

  const { data: connections, error } = await supabaseAdmin
    .from('connections')
    .select('id, org_id, connector_type_id, status, scopes, connected_at, expires_at, last_used_at')
    .eq('org_id', orgId)
    .order('connected_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ connections: connections ?? [] });
});

// ─── GET /oauth/:type/start-url — Return OAuth URL as JSON ───
connectionRoutes.get('/oauth/:type/start-url', async (c) => {
  const connectorType = c.req.param('type');

  if (!hasConnector(connectorType)) {
    return c.json({ error: `Unknown connector type: ${connectorType}` }, 400);
  }

  const { orgId } = c.get('org');
  const connector = loadConnector(connectorType);

  if (connector.authType !== 'oauth2') {
    return c.json({ error: 'This connector does not use OAuth' }, 400);
  }

  const state = randomBytes(32).toString('hex');
  const statePayload = JSON.stringify({ csrf: state, orgId });

  setCookie(c, 'oauth_state', statePayload, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  });

  const redirectUri = `${process.env.API_URL}/connections/oauth/${connectorType}/callback`;
  const url = connector.getOAuthURL(state, redirectUri);

  return c.json({ url });
});

// ─── GET /oauth/:type/start — Start OAuth flow (redirect) ────
connectionRoutes.get('/oauth/:type/start', async (c) => {
  const connectorType = c.req.param('type');

  if (!hasConnector(connectorType)) {
    return c.json({ error: `Unknown connector type: ${connectorType}` }, 400);
  }

  const { orgId } = c.get('org');
  const connector = loadConnector(connectorType);

  if (connector.authType !== 'oauth2') {
    return c.json({ error: 'This connector does not use OAuth' }, 400);
  }

  // CSRF protection: generate state, store in httpOnly cookie
  const state = randomBytes(32).toString('hex');
  const statePayload = JSON.stringify({ csrf: state, orgId });

  setCookie(c, 'oauth_state', statePayload, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  const redirectUri = `${process.env.API_URL}/connections/oauth/${connectorType}/callback`;
  const authUrl = connector.getOAuthURL(state, redirectUri);

  return c.redirect(authUrl);
});

// ─── GET /oauth/:type/callback — OAuth callback ───────────────
connectionRoutes.get('/oauth/:type/callback', async (c) => {
  const connectorType = c.req.param('type');
  const code = c.req.query('code');
  const returnedState = c.req.query('state');

  if (!code) {
    return c.json({ error: 'Missing authorization code' }, 400);
  }

  // Verify CSRF state
  const cookieState = getCookie(c, 'oauth_state');
  if (!cookieState) {
    return c.json({ error: 'Missing OAuth state cookie — please try again' }, 400);
  }

  let statePayload: { csrf: string; orgId: string };
  try {
    statePayload = JSON.parse(cookieState);
  } catch {
    return c.json({ error: 'Invalid state cookie' }, 400);
  }

  if (statePayload.csrf !== returnedState) {
    return c.json({ error: 'OAuth state mismatch — possible CSRF attack' }, 403);
  }

  // Clear the state cookie
  deleteCookie(c, 'oauth_state', { path: '/' });

  if (!hasConnector(connectorType)) {
    return c.json({ error: `Unknown connector type: ${connectorType}` }, 400);
  }

  const connector = loadConnector(connectorType);

  try {
    await connector.handleOAuthCallback(code, statePayload.orgId);

    // Redirect back to connections page with success indicator
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return c.redirect(`${appUrl}/connections?connected=${connectorType}`);
  } catch (err) {
    console.error(`OAuth callback error for ${connectorType}:`, err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    return c.redirect(`${appUrl}/connections?error=${encodeURIComponent(err instanceof Error ? err.message : 'OAuth failed')}`);
  }
});

// ─── DELETE /:id — Disconnect ──────────────────────────────────
connectionRoutes.delete('/:id', async (c) => {
  const connectionId = c.req.param('id');
  const { orgId } = c.get('org');

  // Verify the connection belongs to this org
  const { data: connection, error } = await supabaseAdmin
    .from('connections')
    .select('id, org_id')
    .eq('id', connectionId)
    .eq('org_id', orgId)
    .single();

  if (error || !connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  await revokeCredential(connectionId);
  return c.json({ message: 'Disconnected' });
});

// ─── POST /:id/test — Test connection health ───────────────────
connectionRoutes.post('/:id/test', async (c) => {
  const connectionId = c.req.param('id');
  const { orgId } = c.get('org');

  const { data: connection, error } = await supabaseAdmin
    .from('connections')
    .select('id, org_id, connector_type_id, credential_vault_id, status')
    .eq('id', connectionId)
    .eq('org_id', orgId)
    .single();

  if (error || !connection) {
    return c.json({ error: 'Connection not found' }, 404);
  }

  if (connection.status === 'revoked') {
    return c.json({ healthy: false, reason: 'Connection has been revoked' });
  }

  if (!hasConnector(connection.connector_type_id)) {
    return c.json({ healthy: false, reason: 'Connector type not supported' });
  }

  const connector = loadConnector(connection.connector_type_id);
  const healthy = await connector.testConnection(connection.credential_vault_id);

  // Update last_used_at
  if (healthy) {
    await supabaseAdmin
      .from('connections')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', connectionId);
  }

  return c.json({ healthy });
});
