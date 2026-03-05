import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createRentalCheckout,
  cancelRental,
  getActiveRentals,
  updateRentalPermissions,
} from '../services/billing-engine.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const rentalRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
  };
}>();

// ─── POST / — Rent an agent (redirect to Stripe checkout) ──────

const createRentalSchema = z.object({
  agent_id: z.string().uuid().optional(),
  agent_slug: z.string().min(1).optional(),
  allowed_connection_ids: z.array(z.string().uuid()).optional(),
}).refine((d) => d.agent_id || d.agent_slug, {
  message: 'Either agent_id or agent_slug is required',
});

rentalRoutes.post(
  '/',
  authMiddleware,
  zValidator('json', createRentalSchema),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const { agent_id, agent_slug, allowed_connection_ids } = c.req.valid('json');

    // Resolve agent_id from slug if needed
    let resolvedAgentId = agent_id;
    if (!resolvedAgentId && agent_slug) {
      const { data: agent } = await supabaseAdmin
        .from('agents')
        .select('id')
        .eq('slug', agent_slug)
        .eq('status', 'published')
        .single();

      if (!agent) {
        return c.json({ error: `Agent "${agent_slug}" not found in marketplace` }, 404);
      }
      resolvedAgentId = agent.id;
    }

    // Get user's org
    const { data: membership } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', auth.userId)
      .single();

    if (!membership) {
      return c.json({ error: 'No organization found' }, 400);
    }

    try {
      const result = await createRentalCheckout(
        membership.org_id,
        auth.userId,
        resolvedAgentId!,
        allowed_connection_ids ?? []
      );
      // Normalize response shape for frontend
      return c.json({
        success: true,
        rental_id: result.rentalId ?? null,
        checkout_url: result.rentalId ? null : result.url,
      }, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rental';
      const status = message.includes('already have') ? 409 : 400;
      return c.json({ error: message }, status);
    }
  }
);

// ─── DELETE /:id — Cancel rental ────────────────────────────────

rentalRoutes.delete('/:id', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;
  const rentalId = c.req.param('id');

  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', auth.userId)
    .single();

  if (!membership) {
    return c.json({ error: 'No organization found' }, 400);
  }

  try {
    await cancelRental(rentalId, membership.org_id);
    return c.json({ message: 'Rental cancelled' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to cancel rental';
    return c.json({ error: message }, 400);
  }
});

// ─── GET /active — List org's active rentals ────────────────────

rentalRoutes.get('/active', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;

  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', auth.userId)
    .single();

  if (!membership) {
    return c.json({ error: 'No organization found' }, 400);
  }

  try {
    const rentals = await getActiveRentals(membership.org_id);
    return c.json({ rentals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load rentals';
    return c.json({ error: message }, 500);
  }
});

// ─── PUT /:id/permissions — Update allowed connections ──────────

const updatePermissionsSchema = z.object({
  allowed_connection_ids: z.array(z.string().uuid()),
});

rentalRoutes.put(
  '/:id/permissions',
  authMiddleware,
  zValidator('json', updatePermissionsSchema),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const rentalId = c.req.param('id');
    const { allowed_connection_ids } = c.req.valid('json');

    const { data: membership } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', auth.userId)
      .single();

    if (!membership) {
      return c.json({ error: 'No organization found' }, 400);
    }

    try {
      await updateRentalPermissions(rentalId, membership.org_id, allowed_connection_ids);
      return c.json({ message: 'Permissions updated' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions';
      return c.json({ error: message }, 400);
    }
  }
);
