import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getActiveRentals } from '@/lib/billing/engine';

export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  try {
    const rentals = await getActiveRentals(auth.orgId);
    return NextResponse.json({ rentals });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get rentals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
