import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/connections
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  // Get org
  const { data: membership } = await sb
    .from('org_members')
    .select('org_id')
    .eq('user_id', auth.user.id)
    .limit(1)
    .single();

  if (!membership) {
    return NextResponse.json({ connections: [] });
  }

  const { data, error } = await sb
    .from('connections')
    .select('*')
    .eq('org_id', membership.org_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections: data || [] });
}
