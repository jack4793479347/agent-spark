import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  PLATFORM_PLANS,
  PLATFORM_FEE_PERCENTAGE,
  type PlanTier,
  type UsageAllowance,
} from '@agentspark/shared';

// ─── Stripe Client (lazy — dev can start without Stripe key) ────

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is required for billing operations');
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion });
  }
  return _stripe;
}

export { getStripe };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

function getPlanPriceId(tier: PlanTier): string | null {
  switch (tier) {
    case 'starter': return process.env.STRIPE_STARTER_PRICE_ID ?? null;
    case 'pro': return process.env.STRIPE_PRO_PRICE_ID ?? null;
    case 'business': return process.env.STRIPE_BUSINESS_PRICE_ID ?? null;
    default: return null;
  }
}

// ─── Usage Allowance Check ──────────────────────────────────────

export async function checkUsageAllowance(orgId: string): Promise<UsageAllowance> {
  const sb = createAdminClient();
  const { data: org } = await sb
    .from('organizations')
    .select('plan, current_period_start, tasks_used_this_period, a2a_calls_used_this_period')
    .eq('id', orgId)
    .single();

  if (!org) {
    return { allowed: false, remaining_tasks: 0, remaining_a2a_calls: 0, plan: 'free' };
  }

  const plan = PLATFORM_PLANS[org.plan as PlanTier] ?? PLATFORM_PLANS.free;
  const tasksUsed = org.tasks_used_this_period ?? 0;
  const a2aUsed = org.a2a_calls_used_this_period ?? 0;

  return {
    allowed: tasksUsed < plan.monthly_tasks,
    remaining_tasks: Math.max(0, plan.monthly_tasks - tasksUsed),
    remaining_a2a_calls: Math.max(0, plan.monthly_a2a_calls - a2aUsed),
    plan: org.plan as string,
  };
}

// ─── Increment Usage ────────────────────────────────────────────

export async function incrementTaskUsage(orgId: string): Promise<void> {
  const sb = createAdminClient();
  const { data: org } = await sb
    .from('organizations')
    .select('tasks_used_this_period')
    .eq('id', orgId)
    .single();

  if (!org) return;

  await sb
    .from('organizations')
    .update({ tasks_used_this_period: (org.tasks_used_this_period ?? 0) + 1 })
    .eq('id', orgId);
}

export async function incrementA2AUsage(orgId: string): Promise<void> {
  const sb = createAdminClient();
  const { data: org } = await sb
    .from('organizations')
    .select('a2a_calls_used_this_period')
    .eq('id', orgId)
    .single();

  if (!org) return;

  await sb
    .from('organizations')
    .update({ a2a_calls_used_this_period: (org.a2a_calls_used_this_period ?? 0) + 1 })
    .eq('id', orgId);
}

// ─── Reset Period Usage ─────────────────────────────────────────

async function resetPeriodUsage(orgId: string): Promise<void> {
  const sb = createAdminClient();
  await sb
    .from('organizations')
    .update({
      tasks_used_this_period: 0,
      a2a_calls_used_this_period: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', orgId);
}

// ─── Platform Subscription Checkout ─────────────────────────────

export async function createPlatformCheckout(
  orgId: string,
  userId: string,
  targetPlan: PlanTier
): Promise<{ url: string }> {
  if (targetPlan === 'free') {
    throw new Error('Cannot checkout for free plan');
  }

  const priceId = getPlanPriceId(targetPlan);
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${targetPlan}`);
  }

  const customerId = await getOrCreateOrgCustomer(orgId, userId);

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL}/settings?billing=success&plan=${targetPlan}`,
    cancel_url: `${BASE_URL}/settings?billing=cancelled`,
    metadata: {
      org_id: orgId,
      user_id: userId,
      plan: targetPlan,
      type: 'platform_subscription',
    },
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session');
  }

  return { url: session.url };
}

// ─── Free Rental ────────────────────────────────────────────────

export async function createFreeRental(
  orgId: string,
  agentId: string,
  userId: string,
  allowedConnectionIds: string[]
): Promise<Record<string, unknown>> {
  const sb = createAdminClient();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: rental, error } = await sb
    .from('rentals')
    .insert({
      agent_id: agentId,
      renter_org_id: orgId,
      renter_user_id: userId,
      status: 'active',
      monthly_price_cents: 0,
      allowed_connection_ids: allowedConnectionIds,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('You already have an active rental for this agent');
    }
    throw new Error(error.message);
  }

  await sb.rpc('increment_agent_rentals', { agent_uuid: agentId });

  return rental;
}

// ─── Get Active Rentals ─────────────────────────────────────────

export async function getActiveRentals(orgId: string): Promise<Record<string, unknown>[]> {
  const sb = createAdminClient();
  const { data, error } = await sb
    .from('rentals')
    .select('*, agents(id, name, slug, category, pricing_model, price_cents, avg_rating, creator_id)')
    .eq('renter_org_id', orgId)
    .eq('status', 'active')
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Stripe Webhook Handler ─────────────────────────────────────

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  const sb = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};

      if (meta.type === 'platform_subscription') {
        const orgId = meta.org_id;
        const plan = meta.plan as PlanTier;
        if (!orgId || !plan) return;

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await sb
          .from('organizations')
          .update({
            plan,
            stripe_subscription_id: session.subscription as string,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            tasks_used_this_period: 0,
            a2a_calls_used_this_period: 0,
          })
          .eq('id', orgId);
      } else if (meta.type === 'agent_rental') {
        const orgId = meta.org_id;
        const userId = meta.user_id;
        const agentId = meta.agent_id;
        const allowedConnectionIds = meta.allowed_connection_ids
          ? JSON.parse(meta.allowed_connection_ids)
          : [];

        if (!orgId || !agentId) return;

        const { data: agent } = await sb
          .from('agents')
          .select('price_cents, creator_id')
          .eq('id', agentId)
          .single();

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await sb.from('rentals').insert({
          agent_id: agentId,
          renter_org_id: orgId,
          renter_user_id: userId,
          status: 'active',
          stripe_subscription_id: session.subscription as string | null,
          monthly_price_cents: agent?.price_cents ?? 0,
          allowed_connection_ids: allowedConnectionIds,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
        });

        await sb.rpc('increment_agent_rentals', { agent_uuid: agentId });

        if (agent && agent.price_cents > 0) {
          const gross = agent.price_cents;
          const fee = Math.round(gross * PLATFORM_FEE_PERCENTAGE);
          await sb.from('creator_earnings').insert({
            creator_id: agent.creator_id,
            source: 'rental',
            agent_id: agentId,
            gross_amount_cents: gross,
            platform_fee_cents: fee,
            net_amount_cents: gross - fee,
            payout_status: 'pending',
            period_start: now.toISOString(),
            period_end: periodEnd.toISOString(),
          });
        }
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) return;

      const { data: org } = await sb
        .from('organizations')
        .select('id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (org) {
        await resetPeriodUsage(org.id);
        return;
      }

      const { data: rental } = await sb
        .from('rentals')
        .select('id, agent_id')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('status', 'active')
        .single();

      if (rental) {
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        await sb
          .from('rentals')
          .update({
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq('id', rental.id);

        const { data: agent } = await sb
          .from('agents')
          .select('creator_id, price_cents')
          .eq('id', rental.agent_id)
          .single();

        if (agent && agent.price_cents > 0) {
          const gross = agent.price_cents;
          const fee = Math.round(gross * PLATFORM_FEE_PERCENTAGE);
          await sb.from('creator_earnings').insert({
            creator_id: agent.creator_id,
            source: 'rental',
            agent_id: rental.agent_id,
            gross_amount_cents: gross,
            platform_fee_cents: fee,
            net_amount_cents: gross - fee,
            payout_status: 'pending',
            period_start: now.toISOString(),
            period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;

      const { data: org } = await sb
        .from('organizations')
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (org) {
        await sb
          .from('organizations')
          .update({ plan: 'free', stripe_subscription_id: null })
          .eq('id', org.id);
        return;
      }

      const { data: rental } = await sb
        .from('rentals')
        .select('id, agent_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (rental) {
        await sb
          .from('rentals')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', rental.id);
        await sb.rpc('decrement_active_rentals', { agent_uuid: rental.agent_id });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) return;

      await sb
        .from('rentals')
        .update({ status: 'paused' })
        .eq('stripe_subscription_id', subscriptionId)
        .eq('status', 'active');
      break;
    }
  }
}

// ─── Get Org Billing Info ───────────────────────────────────────

export async function getOrgBillingInfo(orgId: string) {
  const sb = createAdminClient();
  const { data: org } = await sb
    .from('organizations')
    .select('plan, stripe_subscription_id, current_period_end')
    .eq('id', orgId)
    .single();

  const usage = await checkUsageAllowance(orgId);

  return {
    plan: (org?.plan ?? 'free') as PlanTier,
    usage,
    subscription_id: org?.stripe_subscription_id ?? null,
    current_period_end: org?.current_period_end ?? null,
  };
}

// ─── Downgrade to Free ──────────────────────────────────────────

export async function downgradeToFree(orgId: string): Promise<void> {
  const sb = createAdminClient();
  const { data: org } = await sb
    .from('organizations')
    .select('stripe_subscription_id')
    .eq('id', orgId)
    .single();

  if (org?.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(org.stripe_subscription_id);
    } catch {
      // May already be cancelled
    }
  }

  await sb
    .from('organizations')
    .update({ plan: 'free', stripe_subscription_id: null })
    .eq('id', orgId);
}

// ─── Creator Earnings Summary ───────────────────────────────────

export interface CreatorEarningsSummary {
  total_gross_cents: number;
  total_net_cents: number;
  total_fee_cents: number;
  pending_payout_cents: number;
  current_month_net_cents: number;
  rental_count: number;
  a2a_call_count: number;
}

export async function getCreatorEarnings(creatorId: string): Promise<CreatorEarningsSummary> {
  const sb = createAdminClient();
  const { data: totals } = await sb
    .from('creator_earnings')
    .select('gross_amount_cents, net_amount_cents, platform_fee_cents, payout_status, source')
    .eq('creator_id', creatorId);

  const rows = totals ?? [];

  let totalGross = 0;
  let totalNet = 0;
  let totalFee = 0;
  let pendingPayout = 0;
  let rentalCount = 0;
  let a2aCallCount = 0;

  for (const row of rows) {
    totalGross += row.gross_amount_cents ?? 0;
    totalNet += row.net_amount_cents ?? 0;
    totalFee += row.platform_fee_cents ?? 0;
    if (row.payout_status === 'pending') pendingPayout += row.net_amount_cents ?? 0;
    if (row.source === 'rental') rentalCount++;
    if (row.source === 'a2a_call') a2aCallCount++;
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthRows } = await sb
    .from('creator_earnings')
    .select('net_amount_cents')
    .eq('creator_id', creatorId)
    .gte('created_at', monthStart.toISOString());

  const currentMonthNet = (monthRows ?? []).reduce((sum, r) => sum + (r.net_amount_cents ?? 0), 0);

  return {
    total_gross_cents: totalGross,
    total_net_cents: totalNet,
    total_fee_cents: totalFee,
    pending_payout_cents: pendingPayout,
    current_month_net_cents: currentMonthNet,
    rental_count: rentalCount,
    a2a_call_count: a2aCallCount,
  };
}

// ─── Creator Earnings History ───────────────────────────────────

export async function getEarningsHistory(creatorId: string, page = 1, pageSize = 20) {
  const sb = createAdminClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await sb
    .from('creator_earnings')
    .select(
      'id, source, agent_id, gross_amount_cents, platform_fee_cents, net_amount_cents, payout_status, stripe_transfer_id, created_at, agents!agent_id(name, slug)',
      { count: 'exact' }
    )
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    earnings: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── Request Payout ─────────────────────────────────────────────

const MINIMUM_PAYOUT_CENTS = 1000;

export async function requestPayout(creatorId: string): Promise<{
  success: boolean;
  transfer_id?: string;
  amount_cents?: number;
  error?: string;
}> {
  const sb = createAdminClient();

  const { data: profile } = await sb
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', creatorId)
    .single();

  if (!profile?.stripe_connect_account_id) {
    return { success: false, error: 'Stripe Connect account not set up. Complete onboarding first.' };
  }

  const { data: pendingRows } = await sb
    .from('creator_earnings')
    .select('id, net_amount_cents')
    .eq('creator_id', creatorId)
    .eq('payout_status', 'pending');

  if (!pendingRows || pendingRows.length === 0) {
    return { success: false, error: 'No pending earnings to pay out.' };
  }

  const totalAmount = pendingRows.reduce((sum, r) => sum + (r.net_amount_cents ?? 0), 0);

  if (totalAmount < MINIMUM_PAYOUT_CENTS) {
    return {
      success: false,
      error: `Minimum payout is $${(MINIMUM_PAYOUT_CENTS / 100).toFixed(2)}. Current pending: $${(totalAmount / 100).toFixed(2)}.`,
    };
  }

  const earningIds = pendingRows.map((r) => r.id);
  await sb
    .from('creator_earnings')
    .update({ payout_status: 'processing' })
    .in('id', earningIds);

  try {
    const transfer = await getStripe().transfers.create({
      amount: totalAmount,
      currency: 'usd',
      destination: profile.stripe_connect_account_id,
      metadata: {
        creator_id: creatorId,
        earning_count: String(earningIds.length),
      },
    });

    await sb
      .from('creator_earnings')
      .update({ payout_status: 'paid', stripe_transfer_id: transfer.id })
      .in('id', earningIds);

    return { success: true, transfer_id: transfer.id, amount_cents: totalAmount };
  } catch (err) {
    await sb
      .from('creator_earnings')
      .update({ payout_status: 'pending' })
      .in('id', earningIds);

    const message = err instanceof Error ? err.message : 'Transfer failed';
    return { success: false, error: message };
  }
}

// ─── Helpers ────────────────────────────────────────────────────

async function getOrCreateOrgCustomer(orgId: string, userId: string): Promise<string> {
  const sb = createAdminClient();

  const { data: org } = await sb
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', orgId)
    .single();

  if (org?.stripe_customer_id) return org.stripe_customer_id;

  const { data: profile } = await sb
    .from('profiles')
    .select('email, display_name')
    .eq('id', userId)
    .single();

  const customer = await getStripe().customers.create({
    email: profile?.email ?? undefined,
    name: org?.name ?? profile?.display_name ?? undefined,
    metadata: { org_id: orgId, user_id: userId },
  });

  await sb
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', orgId);

  return customer.id;
}
