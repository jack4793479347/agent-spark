import { supabaseAdmin } from '../lib/supabase.js';
import { AGENT_CATEGORIES } from '@agentspark/shared';

// ─── Types ──────────────────────────────────────────────────────

export interface MarketplaceSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  priceRange?: { min: number; max: number };
  minRating?: number;
  pricingFilter?: 'all' | 'free' | 'paid';
  sortBy?: 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high';
  page?: number;
  pageSize?: number;
}

export interface MarketplaceResult {
  agents: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Search / Browse ────────────────────────────────────────────

export async function searchMarketplace(params: MarketplaceSearchParams): Promise<MarketplaceResult> {
  const page = params.page ?? 1;
  const pageSize = Math.min(params.pageSize ?? 24, 48);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from('agents')
    .select('*, profiles!creator_id(display_name, avatar_url)', { count: 'exact' })
    .eq('status', 'published')
    .eq('visibility', 'public');

  // Category filter
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }

  // Tag filter
  if (params.tags && params.tags.length > 0) {
    query = query.overlaps('tags', params.tags);
  }

  // Price range filter
  if (params.priceRange) {
    query = query.gte('price_cents', params.priceRange.min).lte('price_cents', params.priceRange.max);
  }

  // Pricing model filter
  if (params.pricingFilter === 'free') {
    query = query.eq('pricing_model', 'free');
  } else if (params.pricingFilter === 'paid') {
    query = query.neq('pricing_model', 'free');
  }

  // Minimum rating filter
  if (params.minRating) {
    query = query.gte('avg_rating', params.minRating);
  }

  // Text search (ilike on name + description)
  if (params.query) {
    query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
  }

  // Sort
  switch (params.sortBy) {
    case 'rating':
      query = query.order('avg_rating', { ascending: false });
      break;
    case 'newest':
      query = query.order('published_at', { ascending: false });
      break;
    case 'price_low':
      query = query.order('price_cents', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price_cents', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('total_rentals', { ascending: false });
      break;
  }

  // Pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    agents: data ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Agent Detail ───────────────────────────────────────────────

export async function getAgentBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('*, profiles!creator_id(display_name, avatar_url)')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Categories with Counts ─────────────────────────────────────

export async function getCategoriesWithCounts(): Promise<{ id: string; name: string; icon: string; count: number }[]> {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('category')
    .eq('status', 'published')
    .eq('visibility', 'public');

  if (error || !data) {
    return AGENT_CATEGORIES.map((cat) => ({ ...cat, count: 0 }));
  }

  const countMap = new Map<string, number>();
  for (const agent of data) {
    const cat = agent.category as string;
    countMap.set(cat, (countMap.get(cat) ?? 0) + 1);
  }

  return AGENT_CATEGORIES.map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    count: countMap.get(cat.id) ?? 0,
  }));
}

// ─── Featured / Trending ────────────────────────────────────────

export async function getFeaturedAgents(limit = 6): Promise<Record<string, unknown>[]> {
  // Trending: high recent rentals + good rating + recently published
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('*, profiles!creator_id(display_name, avatar_url)')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .gte('avg_rating', 4.0)
    .order('total_rentals', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data ?? [];
}

// ─── Reviews ────────────────────────────────────────────────────

export async function getReviews(
  agentId: string,
  page = 1,
  pageSize = 10
): Promise<{
  reviews: Record<string, unknown>[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from('agent_reviews')
    .select('*, profiles!reviewer_id(display_name, avatar_url)', { count: 'exact' })
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    reviews: data ?? [],
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function createReview(
  agentId: string,
  reviewerId: string,
  rating: number,
  title?: string,
  body?: string
): Promise<Record<string, unknown>> {
  // Insert review
  const { data: review, error } = await supabaseAdmin
    .from('agent_reviews')
    .insert({
      agent_id: agentId,
      reviewer_id: reviewerId,
      rating,
      title,
      body,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reviewed this agent');
    }
    throw new Error(error.message);
  }

  // Recalculate agent avg_rating and review_count
  await recalculateAgentRating(agentId);

  return review;
}

export async function incrementHelpfulCount(reviewId: string): Promise<void> {
  // Use RPC or manual increment
  const { data: review } = await supabaseAdmin
    .from('agent_reviews')
    .select('helpful_count')
    .eq('id', reviewId)
    .single();

  if (!review) return;

  await supabaseAdmin
    .from('agent_reviews')
    .update({ helpful_count: (review.helpful_count ?? 0) + 1 })
    .eq('id', reviewId);
}

async function recalculateAgentRating(agentId: string): Promise<void> {
  const { data } = await supabaseAdmin
    .from('agent_reviews')
    .select('rating')
    .eq('agent_id', agentId);

  if (!data || data.length === 0) {
    await supabaseAdmin
      .from('agents')
      .update({ avg_rating: 0, review_count: 0 })
      .eq('id', agentId);
    return;
  }

  const sum = data.reduce((acc, r) => acc + (r.rating as number), 0);
  const avg = Number((sum / data.length).toFixed(2));

  await supabaseAdmin
    .from('agents')
    .update({ avg_rating: avg, review_count: data.length })
    .eq('id', agentId);
}

// ─── Semantic Search Stub (Pinecone + Voyage) ───────────────────

export async function semanticAgentSearch(
  _query: string,
  _maxResults = 10
): Promise<string[]> {
  // Stub — requires PINECONE_API_KEY and VOYAGE_API_KEY env vars
  // Full implementation involves:
  // 1. Generate embedding with Voyage AI: await voyageClient.embed({ input: query })
  // 2. Query Pinecone: await pinecone.query({ vector: embedding, topK: maxResults })
  // 3. Return matching agent IDs
  //
  // For now, return empty array (text search via ilike handles queries)
  return [];
}
