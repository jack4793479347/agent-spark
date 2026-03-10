import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createPlatformCheckout } from '@/lib/billing/engine';
import { checkRateLimit, rateLimitKey } from '@/lib/api/rate-limit';
import { type PlanTier } from '@agentspark/shared';

export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const rl = checkRateLimit(rateLimitKey(auth.user.id, 'checkout'), 5);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  try {
    const body = await request.json();
    const plan = body.plan as PlanTier;

    if (!plan || !['starter', 'pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const result = await createPlatformCheckout(auth.orgId, auth.user.id, plan);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
