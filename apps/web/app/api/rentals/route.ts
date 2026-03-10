import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createFreeRental } from '@/lib/billing/engine';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const body = await request.json();
    const agentId = body.agent_id;
    const allowedConnectionIds = body.allowed_connection_ids ?? [];

    if (!agentId) {
      return NextResponse.json({ error: 'agent_id is required' }, { status: 400 });
    }

    // Verify agent exists and is free
    const sb = createAdminClient();
    const { data: agent } = await sb
      .from('agents')
      .select('id, pricing_model')
      .eq('id', agentId)
      .single();

    if (!agent) {
      // Try by slug
      const { data: agentBySlug } = await sb
        .from('agents')
        .select('id, pricing_model')
        .eq('slug', agentId)
        .single();

      if (!agentBySlug) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      const rental = await createFreeRental(auth.orgId, agentBySlug.id, auth.user.id, allowedConnectionIds);
      return NextResponse.json({ success: true, rental_id: rental.id });
    }

    const rental = await createFreeRental(auth.orgId, agent.id, auth.user.id, allowedConnectionIds);
    return NextResponse.json({ success: true, rental_id: rental.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to create rental';
    const status = message.includes('already have') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
