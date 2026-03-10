import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/marketplace/agent/:slug/reviews — public
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const sb = createAdminClient();

  // Resolve slug to agent id
  const { data: agent } = await sb
    .from('agents')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const page = parseInt(request.nextUrl.searchParams.get('page') ?? '1', 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: reviews, error, count } = await sb
    .from('agent_reviews')
    .select('id, user_id, rating, comment, created_at, profiles!user_id(display_name)', { count: 'exact' })
    .eq('agent_id', agent.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    reviews: reviews ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}

// POST /api/marketplace/agent/:slug/reviews — requires auth + active rental
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const sb = createAdminClient();

  // Resolve slug to agent id
  const { data: agent } = await sb
    .from('agents')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Verify user has an active rental
  const { data: rental } = await sb
    .from('rentals')
    .select('id')
    .eq('agent_id', agent.id)
    .eq('renter_org_id', auth.orgId)
    .eq('status', 'active')
    .single();

  if (!rental) {
    return NextResponse.json({ error: 'You must have an active rental to review this agent' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const rating = body.rating;
    const comment = body.comment;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || comment.length > 5000) {
      return NextResponse.json({ error: 'Comment is required (max 5000 chars)' }, { status: 400 });
    }

    // Check for existing review
    const { data: existing } = await sb
      .from('agent_reviews')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('user_id', auth.user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this agent' }, { status: 409 });
    }

    const { data: review, error } = await sb
      .from('agent_reviews')
      .insert({
        agent_id: agent.id,
        user_id: auth.user.id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update agent avg_rating
    const { data: allReviews } = await sb
      .from('agent_reviews')
      .select('rating')
      .eq('agent_id', agent.id);

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await sb
        .from('agents')
        .update({ avg_rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
        .eq('id', agent.id);
    }

    return NextResponse.json({ review });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to submit review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
