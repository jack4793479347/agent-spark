import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/marketplace/agent/:slug — public, no auth required
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const sb = createAdminClient();

  const { data: agent, error } = await sb
    .from('agents')
    .select('id, name, slug, description, category, tags, pricing_model, price_cents, per_use_price_cents, avg_rating, review_count, active_rentals, total_a2a_calls, creator_id, version, model, required_connectors, optional_connectors, created_at, published_at, profiles!creator_id(display_name, avatar_url)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (error || !agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json({ agent });
}
