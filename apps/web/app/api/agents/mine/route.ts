import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/mine — list agents created by the current user
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  const { data: agents, error } = await sb
    .from('agents')
    .select('id, name, slug, category, status, avg_rating, review_count, active_rentals, total_a2a_calls, version, pricing_model, price_cents, per_use_price_cents, created_at, updated_at')
    .eq('creator_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!agents || agents.length === 0) {
    return NextResponse.json({ agents: [] });
  }

  // Single grouped query for execution counts instead of N+1
  const agentIds = agents.map((a) => a.id);
  const { data: execCounts } = await sb
    .from('agent_executions')
    .select('agent_id')
    .in('agent_id', agentIds);

  const countMap = new Map<string, number>();
  for (const row of execCounts ?? []) {
    countMap.set(row.agent_id, (countMap.get(row.agent_id) ?? 0) + 1);
  }

  const agentsWithExecs = agents.map((agent) => ({
    ...agent,
    total_executions: countMap.get(agent.id) ?? 0,
  }));

  return NextResponse.json({ agents: agentsWithExecs });
}
