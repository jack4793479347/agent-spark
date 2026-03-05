import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabase.js';
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
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  }
  return _stripe;
}

export { getStripe };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

// Resolve Stripe price IDs from env at runtime
function getPlanPriceId(tier: PlanTier): string | null {
  switch (tier) {
    case 'starter':
      return process.env.STRIPE_STARTER_PRICE_ID ?? null;
    case 'pro':
      return process.env.STRIPE_PRO_PRICE_ID ?? null;
    case 'business':
      return process.env.STRIPE_BUSINESS_PRICE_ID ?? null;
    default:
      return null;
  }
}

// ─── Usage Allowance Check ──────────────────────────────────────

export async function checkUsageAllowance(orgId: string): Promise<UsageAllowance> {
  const { data: org } = await supabaseAdmin
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
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('tasks_used_this_period')
    .eq('id', orgId)
    .single();

  if (!org) return;

  await supabaseAdmin
    .from('organizations')
    .update({ tasks_used_this_period: (org.tasks_used_this_period ?? 0) + 1 })
    .eq('id', orgId);
}

export async function incrementA2AUsage(orgId: string): Promise<void> {
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('a2a_calls_used_this_period')
    .eq('id', orgId)
    .single();

  if (!org) return;

  await supabaseAdmin
    .from('organizations')
    .update({ a2a_calls_used_this_period: (org.a2a_calls_used_this_period ?? 0) + 1 })
    .eq('id', orgId);
}

// ─── Reset Period Usage ─────────────────────────────────────────

export async function resetPeriodUsage(orgId: string): Promise<void> {
  await supabaseAdmin
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

  // Get or create Stripe customer for the org
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

// ─── Agent Rental Checkout ──────────────────────────────────────

export async function createRentalCheckout(
  orgId: string,
  userId: string,
  agentId: string,
  allowedConnectionIds: string[]
): Promise<{ url: string; rentalId?: string }> {
  // Fetch agent details
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, name, pricing_model, price_cents, creator_id, slug')
    .eq('id', agentId)
    .single();

  if (!agent) {
    throw new Error('Agent not found');
  }

  // Check for existing active rental
  const { data: existingRental } = await supabaseAdmin
    .from('rentals')
    .select('id')
    .eq('agent_id', agentId)
    .eq('renter_org_id', orgId)
    .eq('status', 'active')
    .single();

  if (existingRental) {
    throw new Error('You already have an active rental for this agent');
  }

  // Free agents: create rental directly, no Stripe
  if (agent.pricing_model === 'free') {
    const rental = await createFreeRental(orgId, agentId, userId, allowedConnectionIds);
    return { url: `${BASE_URL}/dashboard?rental=success`, rentalId: rental.id as string };
  }

  // Get or create Stripe customer for the org
  const customerId = await getOrCreateOrgCustomer(orgId, userId);

  // Fetch creator's Stripe Connect account
  const { data: creator } = await supabaseAdmin
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', agent.creator_id)
    .single();

  // Build checkout session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: agent.pricing_model === 'monthly' ? 'subscription' : 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `Agent Rental: ${agent.name}` },
        unit_amount: agent.price_cents,
        ...(agent.pricing_model === 'monthly' ? { recurring: { interval: 'month' } } : {}),
      },
      quantity: 1,
    }],
    success_url: `${BASE_URL}/dashboard?rental=success&agent=${agent.slug}`,
    cancel_url: `${BASE_URL}/agent/${agent.slug}?rental=cancelled`,
    metadata: {
      type: 'agent_rental',
      org_id: orgId,
      user_id: userId,
      agent_id: agentId,
      allowed_connection_ids: JSON.stringify(allowedConnectionIds),
    },
  };

  // If creator has Stripe Connect, apply 85/15 split
  if (creator?.stripe_connect_account_id) {
    sessionParams.payment_intent_data = agent.pricing_model !== 'monthly'
      ? {
          application_fee_amount: Math.round(agent.price_cents * PLATFORM_FEE_PERCENTAGE),
          transfer_data: { destination: creator.stripe_connect_account_id },
        }
      : undefined;

    if (agent.pricing_model === 'monthly') {
      sessionParams.subscription_data = {
        application_fee_percent: PLATFORM_FEE_PERCENTAGE * 100,
        transfer_data: { destination: creator.stripe_connect_account_id },
      };
    }
  }

  const session = await getStripe().checkout.sessions.create(sessionParams);

  if (!session.url) {
    throw new Error('Failed to create rental checkout session');
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
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const { data: rental, error } = await supabaseAdmin
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

  // Increment agent rental count
  await supabaseAdmin.rpc('increment_agent_rentals', { agent_uuid: agentId });

  return rental;
}

// ─── Create Rental from Stripe Session ──────────────────────────

async function createRentalFromSession(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};
  const orgId = meta.org_id;
  const userId = meta.user_id;
  const agentId = meta.agent_id;
  const allowedConnectionIds = meta.allowed_connection_ids
    ? JSON.parse(meta.allowed_connection_ids)
    : [];

  if (!orgId || !agentId) return;

  // Get agent price
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('price_cents')
    .eq('id', agentId)
    .single();

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabaseAdmin
    .from('rentals')
    .insert({
      agent_id: agentId,
      renter_org_id: orgId,
      renter_user_id: userId,
      status: 'active',
      stripe_subscription_id: session.subscription as string | null,
      monthly_price_cents: agent?.price_cents ?? 0,
      allowed_connection_ids: allowedConnectionIds,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .select()
    .single();

  // Increment agent rental count
  await supabaseAdmin.rpc('increment_agent_rentals', { agent_uuid: agentId });

  // Record creator earning
  const { data: agentData } = await supabaseAdmin
    .from('agents')
    .select('creator_id, price_cents')
    .eq('id', agentId)
    .single();

  if (agentData && agentData.price_cents > 0) {
    const gross = agentData.price_cents;
    const fee = Math.round(gross * PLATFORM_FEE_PERCENTAGE);
    const net = gross - fee;

    await supabaseAdmin.from('creator_earnings').insert({
      creator_id: agentData.creator_id,
      source: 'rental',
      agent_id: agentId,
      gross_amount_cents: gross,
      platform_fee_cents: fee,
      net_amount_cents: net,
      payout_status: 'pending',
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    });
  }
}

// ─── Cancel Rental ──────────────────────────────────────────────

export async function cancelRental(rentalId: string, orgId: string): Promise<void> {
  const { data: rental } = await supabaseAdmin
    .from('rentals')
    .select('id, agent_id, stripe_subscription_id, status')
    .eq('id', rentalId)
    .eq('renter_org_id', orgId)
    .single();

  if (!rental) {
    throw new Error('Rental not found');
  }

  if (rental.status !== 'active') {
    throw new Error('Rental is not active');
  }

  // Cancel Stripe subscription if exists
  if (rental.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.cancel(rental.stripe_subscription_id);
    } catch {
      // Subscription may already be cancelled
    }
  }

  // Update rental status
  await supabaseAdmin
    .from('rentals')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', rentalId);

  // Decrement active rentals count
  await supabaseAdmin.rpc('decrement_active_rentals', { agent_uuid: rental.agent_id });
}

// ─── Update Rental Permissions ──────────────────────────────────

export async function updateRentalPermissions(
  rentalId: string,
  orgId: string,
  allowedConnectionIds: string[]
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('rentals')
    .update({ allowed_connection_ids: allowedConnectionIds })
    .eq('id', rentalId)
    .eq('renter_org_id', orgId)
    .eq('status', 'active');

  if (error) {
    throw new Error(error.message);
  }
}

// ─── Get Active Rentals ─────────────────────────────────────────

export async function getActiveRentals(orgId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabaseAdmin
    .from('rentals')
    .select('*, agents(id, name, slug, category, pricing_model, price_cents, avg_rating, creator_id, profiles!creator_id(display_name))')
    .eq('renter_org_id', orgId)
    .eq('status', 'active')
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ─── Stripe Webhook Handler ─────────────────────────────────────

export async function handleStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    // ── Checkout completed (new subscription or one-time payment)
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata ?? {};

      if (meta.type === 'platform_subscription') {
        await handlePlatformSubscriptionCreated(session);
      } else if (meta.type === 'agent_rental') {
        await createRentalFromSession(session);
      }
      break;
    }

    // ── Invoice paid (subscription renewed)
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await handleSubscriptionRenewed(invoice);
      }
      break;
    }

    // ── Subscription cancelled
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    // ── Payment failed
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }
  }
}

// ─── Webhook Helpers ────────────────────────────────────────────

async function handlePlatformSubscriptionCreated(session: Stripe.Checkout.Session): Promise<void> {
  const meta = session.metadata ?? {};
  const orgId = meta.org_id;
  const plan = meta.plan as PlanTier;

  if (!orgId || !plan) return;

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await supabaseAdmin
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
}

async function handleSubscriptionRenewed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;

  // Check if it's a platform subscription
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (org) {
    // Reset usage counters for new billing period
    await resetPeriodUsage(org.id);
    return;
  }

  // Check if it's a rental subscription — renew period
  const { data: rental } = await supabaseAdmin
    .from('rentals')
    .select('id, agent_id')
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'active')
    .single();

  if (rental) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from('rentals')
      .update({
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
      .eq('id', rental.id);

    // Record creator earning for renewal
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('creator_id, price_cents')
      .eq('id', rental.agent_id)
      .single();

    if (agent && agent.price_cents > 0) {
      const gross = agent.price_cents;
      const fee = Math.round(gross * PLATFORM_FEE_PERCENTAGE);

      await supabaseAdmin.from('creator_earnings').insert({
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
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  // Check platform subscription
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (org) {
    await supabaseAdmin
      .from('organizations')
      .update({ plan: 'free', stripe_subscription_id: null })
      .eq('id', org.id);
    return;
  }

  // Check rental subscription
  const { data: rental } = await supabaseAdmin
    .from('rentals')
    .select('id, agent_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (rental) {
    await supabaseAdmin
      .from('rentals')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', rental.id);

    await supabaseAdmin.rpc('decrement_active_rentals', { agent_uuid: rental.agent_id });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Pause rental if payment fails
  await supabaseAdmin
    .from('rentals')
    .update({ status: 'paused' })
    .eq('stripe_subscription_id', subscriptionId)
    .eq('status', 'active');
}

// ─── Helpers ────────────────────────────────────────────────────

async function getOrCreateOrgCustomer(orgId: string, userId: string): Promise<string> {
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('stripe_customer_id, name')
    .eq('id', orgId)
    .single();

  if (org?.stripe_customer_id) {
    return org.stripe_customer_id;
  }

  // Get user email for customer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name')
    .eq('id', userId)
    .single();

  const customer = await getStripe().customers.create({
    email: profile?.email ?? undefined,
    name: org?.name ?? profile?.display_name ?? undefined,
    metadata: { org_id: orgId, user_id: userId },
  });

  await supabaseAdmin
    .from('organizations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', orgId);

  return customer.id;
}

// ─── Get Org Billing Info ───────────────────────────────────────

export async function getOrgBillingInfo(orgId: string): Promise<{
  plan: PlanTier;
  usage: UsageAllowance;
  subscription_id: string | null;
  current_period_end: string | null;
}> {
  const { data: org } = await supabaseAdmin
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

// ─── Stripe Connect Creator Onboarding ──────────────────────────

export async function onboardCreator(userId: string): Promise<{ url: string }> {
  // Check if user already has a Connect account
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_connect_account_id, email, display_name')
    .eq('id', userId)
    .single();

  if (!profile) {
    throw new Error('User profile not found');
  }

  let accountId = profile.stripe_connect_account_id;

  if (!accountId) {
    // Create new Stripe Connect Express account
    const account = await getStripe().accounts.create({
      type: 'express',
      email: profile.email ?? undefined,
      metadata: {
        user_id: userId,
        platform: 'agentspark',
      },
      capabilities: {
        transfers: { requested: true },
      },
    });

    accountId = account.id;

    // Save account ID and upgrade role to creator
    await supabaseAdmin
      .from('profiles')
      .update({
        stripe_connect_account_id: accountId,
        role: 'creator',
      })
      .eq('id', userId);
  }

  // Create account link for onboarding
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${BASE_URL}/creator?onboarding=refresh`,
    return_url: `${BASE_URL}/creator/earnings?onboarding=complete`,
    type: 'account_onboarding',
  });

  return { url: accountLink.url };
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
  // Lifetime totals
  const { data: totals } = await supabaseAdmin
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
    if (row.payout_status === 'pending') {
      pendingPayout += row.net_amount_cents ?? 0;
    }
    if (row.source === 'rental') rentalCount++;
    if (row.source === 'a2a_call') a2aCallCount++;
  }

  // Current month earnings
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: monthRows } = await supabaseAdmin
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

export async function getEarningsHistory(
  creatorId: string,
  page = 1,
  pageSize = 20
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from('creator_earnings')
    .select(
      'id, source, agent_id, gross_amount_cents, platform_fee_cents, net_amount_cents, payout_status, stripe_transfer_id, created_at, agents!agent_id(name, slug)',
      { count: 'exact' }
    )
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return {
    success: true as const,
    earnings: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── Request Payout ─────────────────────────────────────────────

const MINIMUM_PAYOUT_CENTS = 1000; // $10.00

export async function requestPayout(creatorId: string): Promise<{
  success: boolean;
  transfer_id?: string;
  amount_cents?: number;
  error?: string;
}> {
  // Get creator's Stripe Connect account
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', creatorId)
    .single();

  if (!profile?.stripe_connect_account_id) {
    return { success: false, error: 'Stripe Connect account not set up. Complete onboarding first.' };
  }

  // Get pending earnings
  const { data: pendingRows } = await supabaseAdmin
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

  // Mark rows as processing
  const earningIds = pendingRows.map((r) => r.id);
  await supabaseAdmin
    .from('creator_earnings')
    .update({ payout_status: 'processing' })
    .in('id', earningIds);

  try {
    // Create Stripe transfer
    const transfer = await getStripe().transfers.create({
      amount: totalAmount,
      currency: 'usd',
      destination: profile.stripe_connect_account_id,
      metadata: {
        creator_id: creatorId,
        earning_count: String(earningIds.length),
      },
    });

    // Mark as paid
    await supabaseAdmin
      .from('creator_earnings')
      .update({
        payout_status: 'paid',
        stripe_transfer_id: transfer.id,
      })
      .in('id', earningIds);

    return {
      success: true,
      transfer_id: transfer.id,
      amount_cents: totalAmount,
    };
  } catch (err) {
    // Revert to pending on failure
    await supabaseAdmin
      .from('creator_earnings')
      .update({ payout_status: 'pending' })
      .in('id', earningIds);

    const message = err instanceof Error ? err.message : 'Transfer failed';
    return { success: false, error: message };
  }
}

// ─── Batch A2A Payout Processing ────────────────────────────────

export async function processA2APayouts(): Promise<{
  processed: number;
  skipped: number;
  failed: number;
}> {
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  // Get all creators with pending A2A earnings
  const { data: pendingEarnings } = await supabaseAdmin
    .from('creator_earnings')
    .select('creator_id, id, net_amount_cents')
    .eq('payout_status', 'pending')
    .eq('source', 'a2a_call');

  if (!pendingEarnings || pendingEarnings.length === 0) {
    return { processed: 0, skipped: 0, failed: 0 };
  }

  // Group by creator
  const byCreator = new Map<string, { ids: string[]; total: number }>();
  for (const row of pendingEarnings) {
    const existing = byCreator.get(row.creator_id) ?? { ids: [], total: 0 };
    existing.ids.push(row.id);
    existing.total += row.net_amount_cents ?? 0;
    byCreator.set(row.creator_id, existing);
  }

  for (const [creatorId, data] of byCreator) {
    // Check minimum threshold
    if (data.total < MINIMUM_PAYOUT_CENTS) {
      skipped++;
      continue;
    }

    // Get Connect account
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_connect_account_id')
      .eq('id', creatorId)
      .single();

    if (!profile?.stripe_connect_account_id) {
      skipped++;
      continue;
    }

    try {
      const transfer = await getStripe().transfers.create({
        amount: data.total,
        currency: 'usd',
        destination: profile.stripe_connect_account_id,
        metadata: {
          creator_id: creatorId,
          source: 'a2a_batch_payout',
          earning_count: String(data.ids.length),
        },
      });

      await supabaseAdmin
        .from('creator_earnings')
        .update({
          payout_status: 'paid',
          stripe_transfer_id: transfer.id,
        })
        .in('id', data.ids);

      processed++;
    } catch {
      failed++;
    }
  }

  return { processed, skipped, failed };
}
