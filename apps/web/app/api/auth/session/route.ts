import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/auth/session — get current user + org
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ user: null, org: null });
  }

  const sb = createAdminClient();

  // Get user's org membership
  const { data: membership } = await sb
    .from('org_members')
    .select('org_id, role, organizations(id, name, plan, owner_id)')
    .eq('user_id', auth.user.id)
    .limit(1)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orgData = membership?.organizations as any;
  const org = orgData
    ? {
        id: orgData.id as string,
        name: orgData.name as string,
        plan: orgData.plan as string,
        is_creator: orgData.owner_id === auth.user.id,
      }
    : null;

  // Get profile
  const { data: profile } = await sb
    .from('profiles')
    .select('display_name, role')
    .eq('id', auth.user.id)
    .single();

  return NextResponse.json({
    user: {
      id: auth.user.id,
      email: auth.user.email,
      display_name: profile?.display_name,
      role: profile?.role,
    },
    org,
  });
}
