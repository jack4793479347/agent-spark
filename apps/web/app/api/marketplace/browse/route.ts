import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/marketplace/browse — public, paginated, filterable agent listing
export async function GET(request: NextRequest) {
  const sb = createAdminClient();
  const params = request.nextUrl.searchParams;

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sortBy = params.get('sortBy') ?? 'popular';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(params.get('pageSize') ?? '24', 10)));

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = sb
    .from('agents')
    .select(
      'id, name, slug, description, category, tags, pricing_model, price_cents, per_use_price_cents, avg_rating, review_count, active_rentals, total_a2a_calls, creator_id, created_at, published_at, profiles!creator_id(display_name)',
      { count: 'exact' }
    )
    .eq('status', 'published');

  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  switch (sortBy) {
    case 'popular':
      query = query.order('active_rentals', { ascending: false });
      break;
    case 'highest_rated':
      query = query.order('avg_rating', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'price_low':
      query = query.order('price_cents', { ascending: true });
      break;
    default:
      query = query.order('active_rentals', { ascending: false });
  }

  const { data: agents, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map active_rentals to total_rentals for API compat
  const mapped = (agents ?? []).map((a) => ({
    ...a,
    total_rentals: a.active_rentals ?? 0,
  }));

  return NextResponse.json({
    agents: mapped,
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
