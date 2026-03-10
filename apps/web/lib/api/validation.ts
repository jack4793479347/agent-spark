import { z } from 'zod';

export const agentCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  category: z.string().min(1).max(50).optional(),
  system_prompt: z.string().max(50_000).optional(),
  model: z.string().max(100).optional(),
  pricing_model: z.enum(['free', 'monthly', 'per_use', 'tiered']).optional(),
  price_cents: z.number().int().min(0).max(100_000).optional(),
});

export const agentExecuteSchema = z.object({
  input: z.string().min(1).max(50_000),
});

export const scrapeSchema = z.object({
  url: z.string().url().max(2_000),
});

export const checkoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']).optional(),
  type: z.enum(['platform_subscription', 'agent_rental']).optional(),
  agent_id: z.string().uuid().optional(),
  allowed_connection_ids: z.array(z.string().uuid()).max(50).optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(5_000),
});
