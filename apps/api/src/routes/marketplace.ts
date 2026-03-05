import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  searchMarketplace,
  getAgentBySlug,
  getCategoriesWithCounts,
  getFeaturedAgents,
  getReviews,
  createReview,
  incrementHelpfulCount,
} from '../services/marketplace.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';

export const marketplaceRoutes = new Hono<{
  Variables: {
    auth: AuthContext | null;
  };
}>();

// ─── GET /browse — Browse with filters & pagination ─────────────
marketplaceRoutes.get('/browse', async (c) => {
  const query = c.req.query('q');
  const category = c.req.query('category');
  const sortBy = c.req.query('sortBy') as 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high' | undefined;
  const pricingFilter = c.req.query('pricing') as 'all' | 'free' | 'paid' | undefined;
  const minRating = c.req.query('minRating') ? Number(c.req.query('minRating')) : undefined;
  const page = Number(c.req.query('page') ?? 1);
  const pageSize = Number(c.req.query('pageSize') ?? 24);

  try {
    const result = await searchMarketplace({
      query,
      category,
      sortBy,
      pricingFilter,
      minRating,
      page,
      pageSize,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /search — Text + semantic search ───────────────────────
marketplaceRoutes.get('/search', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  try {
    const result = await searchMarketplace({
      query,
      sortBy: 'popular',
      page: 1,
      pageSize: 24,
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /categories — List categories with counts ──────────────
marketplaceRoutes.get('/categories', async (c) => {
  try {
    const categories = await getCategoriesWithCounts();
    return c.json({ categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load categories';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /featured — Featured/trending agents ───────────────────
marketplaceRoutes.get('/featured', async (c) => {
  const limit = Number(c.req.query('limit') ?? 6);

  try {
    const agents = await getFeaturedAgents(limit);
    return c.json({ agents });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load featured agents';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /agent/:slug — Agent detail page data ──────────────────
marketplaceRoutes.get('/agent/:slug', async (c) => {
  const slug = c.req.param('slug');

  const agent = await getAgentBySlug(slug);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  return c.json({ agent });
});

// ─── GET /agent/:slug/reviews — Get reviews ─────────────────────
marketplaceRoutes.get('/agent/:slug/reviews', async (c) => {
  const slug = c.req.param('slug');
  const page = Number(c.req.query('page') ?? 1);

  // Get agent ID from slug
  const agent = await getAgentBySlug(slug);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  try {
    const result = await getReviews(agent.id as string, page);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load reviews';
    return c.json({ error: message }, 500);
  }
});

// ─── POST /agent/:slug/reviews — Create review (auth required) ──
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});

marketplaceRoutes.post(
  '/agent/:slug/reviews',
  authMiddleware,
  zValidator('json', createReviewSchema),
  async (c) => {
    const slug = c.req.param('slug');
    const auth = c.get('auth') as AuthContext;
    const { rating, title, body } = c.req.valid('json');

    // Get agent ID from slug
    const agent = await getAgentBySlug(slug);
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    try {
      const review = await createReview(agent.id as string, auth.userId, rating, title, body);
      return c.json({ review }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create review';
      const status = message.includes('already reviewed') ? 409 : 500;
      return c.json({ error: message }, status);
    }
  }
);

// ─── POST /agent/:slug/reviews/:id/helpful — Increment helpful ──
marketplaceRoutes.post('/agent/:slug/reviews/:id/helpful', async (c) => {
  const reviewId = c.req.param('id');

  try {
    await incrementHelpfulCount(reviewId);
    return c.json({ message: 'Helpful count incremented' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update helpful count';
    return c.json({ error: message }, 500);
  }
});
