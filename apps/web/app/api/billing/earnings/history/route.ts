import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getEarningsHistory } from '@/lib/billing/engine';

export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') ?? '20', 10);

  try {
    const result = await getEarningsHistory(auth.user.id, page, pageSize);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get earnings history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
