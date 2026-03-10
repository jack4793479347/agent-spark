import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getAgentEmails, agentEmailAddress } from '@/lib/email/agent-mail';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/agents/:id/emails — get agent's email inbox
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();

  // Verify agent exists and user has access
  const { data: agent } = await sb
    .from('agents')
    .select('id, slug, name, creator_id')
    .eq('id', params.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit')) || 20;
  const emails = await getAgentEmails(params.id, limit);

  return NextResponse.json({
    emails,
    address: agentEmailAddress(agent.slug),
  });
}
