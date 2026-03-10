import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/marketplace/featured — public, top agents by rating + rentals
export async function GET(request: NextRequest) {
  const sb = createAdminClient();
  const limit = Math.min(20, parseInt(request.nextUrl.searchParams.get('limit') ?? '4', 10));

  const { data: agents, error } = await sb
    .from('agents')
    .select(
      'id, name, slug, description, category, tags, pricing_model, price_cents, per_use_price_cents, avg_rating, review_count, active_rentals, total_a2a_calls, creator_id, created_at, published_at, profiles!creator_id(display_name)'
    )
    .eq('status', 'published')
    .order('avg_rating', { ascending: false })
    .order('active_rentals', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped = (agents ?? []).map((a) => ({
    ...a,
    total_rentals: a.active_rentals ?? 0,
  }));

  return NextResponse.json({ agents: mapped });
}
