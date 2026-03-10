import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/:id — get agent detail (owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  const { data: agent, error } = await sb
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Allow if user is the creator or has an active rental
  if (agent.creator_id !== auth.user.id) {
    if (!auth.orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const { data: rental } = await sb
      .from('rentals')
      .select('id')
      .eq('agent_id', params.id)
      .eq('renter_org_id', auth.orgId)
      .eq('status', 'active')
      .single();

    if (!rental) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  return NextResponse.json({ agent });
}

// PUT /api/agents/:id — update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sb = createAdminClient();

  // Verify ownership
  const { data: existing } = await sb
    .from('agents')
    .select('creator_id')
    .eq('id', params.id)
    .single();

  if (!existing || existing.creator_id !== auth.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: agent, error } = await sb
    .from('agents')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ agent });
}

// DELETE /api/agents/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  const { error } = await sb
    .from('agents')
    .delete()
    .eq('id', params.id)
    .eq('creator_id', auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
