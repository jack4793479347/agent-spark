import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { checkUsageAllowance } from '@/lib/billing/engine';

// GET /api/billing/usage
export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const usage = await checkUsageAllowance(auth.orgId);
    return NextResponse.json(usage);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to check usage';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
