import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/approvals
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: approvals, error } = await sb
    .from('approval_queue')
    .select('*')
    .eq('org_id', auth.orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ approvals: approvals || [] });
}
