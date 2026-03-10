import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/executions
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const agentId = searchParams.get('agent_id');

  const sb = createAdminClient();

  let query = sb
    .from('agent_executions')
    .select('*, agents!inner(name)', { count: 'exact' })
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (agentId) query = query.eq('agent_id', agentId);

  // Filter by user's org
  if (auth.orgId) {
    query = query.eq('org_id', auth.orgId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const executions = (data || []).map((e) => ({
    ...e,
    agent_name: (e as Record<string, unknown>).agents
      ? ((e as Record<string, unknown>).agents as Record<string, unknown>).name
      : undefined,
    agents: undefined,
  }));

  return NextResponse.json({ executions, total: count || 0 });
}
