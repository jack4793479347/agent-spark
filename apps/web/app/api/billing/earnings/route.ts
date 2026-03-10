import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { getCreatorEarnings } from '@/lib/billing/engine';

export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const earnings = await getCreatorEarnings(auth.user.id);
    return NextResponse.json({ earnings });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to get earnings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
