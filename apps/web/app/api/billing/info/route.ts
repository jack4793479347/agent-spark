import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getOrgBillingInfo } from '@/lib/billing/engine';

export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const info = await getOrgBillingInfo(auth.orgId);
    return NextResponse.json(info);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get billing info';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
