import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  createPlatformCheckout,
  createRentalCheckout,
  handleStripeWebhook,
  getOrgBillingInfo,
  checkUsageAllowance,
  getCreatorEarnings,
  getEarningsHistory,
  requestPayout,
  getStripe,
} from '../services/billing-engine.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export const billingRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
  };
}>();

// ─── POST /create-checkout — Stripe checkout session ────────────

const checkoutSchema = z.object({
  type: z.enum(['platform_subscription', 'agent_rental']),
  plan: z.enum(['starter', 'pro', 'business']).optional(),
  agent_id: z.string().uuid().optional(),
  allowed_connection_ids: z.array(z.string().uuid()).optional(),
});

billingRoutes.post(
  '/create-checkout',
  authMiddleware,
  zValidator('json', checkoutSchema),
  async (c) => {
    const auth = c.get('auth') as AuthContext;
    const body = c.req.valid('json');

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
      if (body.type === 'platform_subscription') {
        if (!body.plan) {
          return c.json({ error: 'Plan is required for subscription checkout' }, 400);
        }

        const result = await createPlatformCheckout(membership.org_id, auth.userId, body.plan);
        return c.json(result);
      }

      if (body.type === 'agent_rental') {
        if (!body.agent_id) {
          return c.json({ error: 'Agent ID is required for rental checkout' }, 400);
        }

        const result = await createRentalCheckout(
          membership.org_id,
          auth.userId,
          body.agent_id,
          body.allowed_connection_ids ?? []
        );
        return c.json(result);
      }

      return c.json({ error: 'Invalid checkout type' }, 400);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      return c.json({ error: message }, 400);
    }
  }
);

// ─── POST /webhook — Stripe webhook handler ─────────────────────

billingRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return c.json({ error: 'Missing signature or webhook secret' }, 400);
  }

  try {
    const body = await c.req.text();
    const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    await handleStripeWebhook(event);
    return c.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    console.error('Stripe webhook error:', message);
    return c.json({ error: message }, 400);
  }
});

// ─── GET /info — Current org billing info ───────────────────────

billingRoutes.get('/info', authMiddleware, async (c) => {
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
    const info = await getOrgBillingInfo(membership.org_id);
    return c.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get billing info';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /usage — Current usage allowance ───────────────────────

billingRoutes.get('/usage', authMiddleware, async (c) => {
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
    const usage = await checkUsageAllowance(membership.org_id);
    return c.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get usage';
    return c.json({ error: message }, 500);
  }
});

// ─── POST /downgrade — Downgrade to free plan ───────────────────

billingRoutes.post('/downgrade', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;

  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', auth.userId)
    .single();

  if (!membership) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('stripe_subscription_id, plan')
    .eq('id', membership.org_id)
    .single();

  if (!org || org.plan === 'free') {
    return c.json({ error: 'Already on free plan' }, 400);
  }

  if (org.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(org.stripe_subscription_id);
    } catch {
      // May already be cancelled
    }
  }

  await supabaseAdmin
    .from('organizations')
    .update({ plan: 'free', stripe_subscription_id: null })
    .eq('id', membership.org_id);

  return c.json({ message: 'Downgraded to free plan' });
});

// ─── GET /earnings — Creator earnings summary ───────────────────

billingRoutes.get('/earnings', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;

  try {
    const summary = await getCreatorEarnings(auth.userId);
    return c.json({ earnings: summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch earnings';
    return c.json({ error: message }, 500);
  }
});

// ─── GET /earnings/history — Earnings history ───────────────────

billingRoutes.get('/earnings/history', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;
  const page = Number(c.req.query('page') ?? 1);

  const result = await getEarningsHistory(auth.userId, page);

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({
    earnings: result.earnings,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

// ─── POST /payouts/request — Request payout ─────────────────────

billingRoutes.post('/payouts/request', authMiddleware, async (c) => {
  const auth = c.get('auth') as AuthContext;

  const result = await requestPayout(auth.userId);

  if (!result.success) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({
    transfer_id: result.transfer_id,
    amount_cents: result.amount_cents,
  });
});
