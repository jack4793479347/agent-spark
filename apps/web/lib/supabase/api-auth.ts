import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createAdminClient } from './admin';

/**
 * Extract authenticated user from request's Bearer token.
 * Validates org membership via x-org-id header (falls back to user's first org).
 * Returns { user, orgId, supabase } or null if unauthenticated.
 */
export async function getApiUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const admin = createAdminClient();
  const requestedOrgId = request.headers.get('x-org-id');

  let orgId: string | null = null;

  if (requestedOrgId) {
    // Verify user is a member of the requested org
    const { data: membership } = await admin
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', requestedOrgId)
      .single();

    orgId = membership?.org_id ?? null;
  }

  if (!orgId) {
    // Fall back to user's first org
    const { data: firstMembership } = await admin
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    orgId = firstMembership?.org_id ?? null;
  }

  return { user, orgId, supabase };
}
