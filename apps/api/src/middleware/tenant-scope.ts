import { createMiddleware } from 'hono/factory';
import { supabaseAdmin } from '../lib/supabase.js';
import type { AuthContext, OrgContext } from './auth.js';

// Extracts org_id from header or resolves the user's default org.
// Must be used after authMiddleware.
export const tenantScopeMiddleware = createMiddleware<{
  Variables: {
    auth: AuthContext;
    org: OrgContext;
  };
}>(async (c, next) => {
  const auth = c.get('auth');
  if (!auth) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Allow client to specify org via header (for multi-org support)
  const orgIdHeader = c.req.header('X-Org-Id');

  let orgId: string;
  let orgRole: string;

  if (orgIdHeader) {
    // Verify user is a member of the specified org
    const { data: membership, error } = await supabaseAdmin
      .from('org_members')
      .select('role')
      .eq('org_id', orgIdHeader)
      .eq('user_id', auth.userId)
      .single();

    if (error || !membership) {
      return c.json({ error: 'Not a member of the specified organization' }, 403);
    }

    orgId = orgIdHeader;
    orgRole = membership.role;
  } else {
    // Default: use the user's first (owner) org
    const { data: membership, error } = await supabaseAdmin
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !membership) {
      return c.json({ error: 'No organization found for user' }, 404);
    }

    orgId = membership.org_id;
    orgRole = membership.role;
  }

  c.set('org', { orgId, orgRole });
  await next();
});
