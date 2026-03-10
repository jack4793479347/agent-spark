import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// DELETE /api/agents/:id/knowledge/:filename — delete a specific file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createAdminClient();
  const filename = decodeURIComponent(params.filename);

  const { error } = await sb
    .from('knowledge_chunks')
    .delete()
    .eq('agent_id', params.id)
    .eq('source_filename', filename);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
