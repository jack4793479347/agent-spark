import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/executions/:id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const { data: execution, error } = await sb
    .from('agent_executions')
    .select('*, agents(name)')
    .eq('id', params.id)
    .eq('org_id', auth.orgId)
    .single();

  if (error || !execution) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    execution: {
      ...execution,
      agent_name: (execution as Record<string, unknown>).agents
        ? ((execution as Record<string, unknown>).agents as Record<string, unknown>).name
        : undefined,
      agents: undefined,
    },
  });
}
