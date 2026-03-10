import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/agents/approvals/:id — approve or reject
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { approved } = await request.json();
  const sb = createAdminClient();

  const { error } = await sb
    .from('approval_queue')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
