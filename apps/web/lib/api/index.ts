import type { IconType } from '@/components/ui/agent-icon';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// ═══════════════════════════════════════════════════════════════
// TYPES — API response shapes (match Hono backend / Supabase)
// ═══════════════════════════════════════════════════════════════

export interface ApiAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  long_description?: string;
  category: string;
  tags: string[];
  icon_url?: string;
  pricing_model: 'free' | 'monthly' | 'per_use' | 'tiered';
  price_cents: number;
  per_use_price_cents?: number;
  avg_rating: number;
  review_count: number;
  total_rentals: number;
  stats?: { speed: number; accuracy: number; reliability: number; popularity: number; versatility: number };
  profiles?: { display_name: string; avatar_url?: string };
  created_at: string;
  published_at?: string;
}

export interface RecommendedAgent {
  agent_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rating: number;
  price_per_call_cents: number;
  total_calls: number;
  match_reason: string;
  already_rented: boolean;
}

export interface AssemblyResult {
  workflow_summary: string;
  recommended_agents: RecommendedAgent[];
  total_cost_cents: number;
  capabilities_covered: string[];
  connectors_needed: string[];
}

// ═══════════════════════════════════════════════════════════════
// TYPES — Display shapes (used by marketplace + landing pages)
// ═══════════════════════════════════════════════════════════════

export interface MarketplaceAgent {
  id: string;
  slug: string;
  name: string;
  desc: string;
  rating: number;
  reviews: number;
  rentals: string;
  price: string;
  creator: string;
  featured: boolean;
  iconType: IconType;
}

export interface TeamAgent {
  agent_id: string;
  name: string;
  slug: string;
  role: string;
  stats: { speed: number; accuracy: number; reliability: number };
  price: string;
  iconType: IconType;
  already_rented: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ICON RESOLUTION — maps category/tags to AgentIcon types
// ═══════════════════════════════════════════════════════════════

const CATEGORY_TO_ICON: Record<string, IconType> = {
  'ecommerce': 'truck',
  'e-commerce': 'truck',
  'customer-support': 'email',
  'support': 'email',
  'sales': 'target',
  'marketing': 'share',
  'finance': 'dollar',
  'productivity': 'chat',
  'hr': 'user',
  'human-resources': 'user',
  'data': 'chart',
  'analytics': 'chart',
  'development': 'code',
  'engineering': 'code',
  'content': 'pen',
  'operations': 'box',
  'utility': 'link',
  'security': 'shield',
  'legal': 'shield',
  'scheduling': 'calendar',
  'communication': 'chat',
};

const TAG_TO_ICON: Record<string, IconType> = {
  'email': 'email',
  'gmail': 'email',
  'slack': 'chat',
  'standup': 'chat',
  'calendar': 'calendar',
  'invoice': 'document',
  'invoices': 'document',
  'document': 'document',
  'ocr': 'document',
  'code': 'code',
  'code-review': 'code',
  'github': 'code',
  'shopify': 'truck',
  'shipping': 'truck',
  'tracking': 'truck',
  'fulfillment': 'truck',
  'stripe': 'dollar',
  'payment': 'dollar',
  'accounting': 'dollar',
  'hubspot': 'target',
  'leads': 'target',
  'crm': 'target',
  'scoring': 'target',
  'social': 'share',
  'seo': 'pen',
  'writing': 'pen',
  'blog': 'pen',
  'recruiting': 'user',
  'resume': 'user',
  'screening': 'user',
  'monitoring': 'alert',
  'alerts': 'alert',
  'webhook': 'link',
  'api': 'link',
  'transform': 'link',
};

export function resolveIconType(agent: { category?: string; tags?: string[]; name?: string }): IconType {
  if (agent.category && CATEGORY_TO_ICON[agent.category]) {
    return CATEGORY_TO_ICON[agent.category];
  }
  if (agent.tags) {
    for (const tag of agent.tags) {
      if (TAG_TO_ICON[tag]) return TAG_TO_ICON[tag];
    }
  }
  return 'box';
}

// ═══════════════════════════════════════════════════════════════
// FORMATTERS
// ═══════════════════════════════════════════════════════════════

export function formatPrice(model: string, cents: number, perUseCents?: number): string {
  if (model === 'free' || (cents === 0 && !perUseCents)) return 'Free';
  if (model === 'per_use') {
    const c = perUseCents ?? cents;
    const dollars = c / 100;
    return `$${dollars < 1 ? dollars.toFixed(2) : Math.round(dollars)}/use`;
  }
  return `$${Math.round(cents / 100)}/mo`;
}

export function formatRentals(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toString();
}

export function formatCallPrice(cents: number): string {
  if (cents === 0) return 'Free';
  const dollars = cents / 100;
  return dollars < 1 ? `$${dollars.toFixed(2)}/call` : `$${Math.round(dollars)}/call`;
}

export function formatTotalCents(cents: number): string {
  if (cents === 0) return '$0';
  if (cents % 100 === 0) return `$${cents / 100}`;
  return `$${(cents / 100).toFixed(2)}`;
}

// ═══════════════════════════════════════════════════════════════
// MAPPERS
// ═══════════════════════════════════════════════════════════════

export function apiAgentToMarketplace(agent: ApiAgent, featured = false): MarketplaceAgent {
  return {
    id: agent.id,
    slug: agent.slug,
    name: agent.name,
    desc: agent.description,
    rating: Number(agent.avg_rating) || 0,
    reviews: agent.review_count ?? 0,
    rentals: formatRentals(agent.total_rentals ?? 0),
    price: formatPrice(agent.pricing_model, agent.price_cents, agent.per_use_price_cents),
    creator: agent.profiles?.display_name ?? 'Unknown',
    featured,
    iconType: resolveIconType(agent),
  };
}

/** Generate deterministic stats from agent name (used when API doesn't return stats) */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function recommendedAgentToTeam(agent: RecommendedAgent): TeamAgent {
  const h = hashString(agent.name);
  return {
    agent_id: agent.agent_id,
    name: agent.name,
    slug: agent.slug,
    role: agent.match_reason || agent.description,
    stats: {
      speed: 70 + (h % 25),
      accuracy: 75 + ((h >> 8) % 22),
      reliability: 78 + ((h >> 16) % 18),
    },
    price: formatCallPrice(agent.price_per_call_cents),
    iconType: resolveIconType({ category: agent.category }),
    already_rented: agent.already_rented,
  };
}

// ═══════════════════════════════════════════════════════════════
// API CALLS
// ═══════════════════════════════════════════════════════════════

export async function fetchMarketplaceAgents(params?: {
  sortBy?: string;
  q?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ agents: ApiAgent[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.sortBy) qs.set('sortBy', params.sortBy);
  if (params?.q) qs.set('q', params.q);
  if (params?.category) qs.set('category', params.category);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize));

  let res: Response;
  try {
    res = await fetch(`/api/marketplace/browse?${qs}`, { credentials: 'include' });
  } catch {
    // Fallback to external API
    res = await fetch(`${API_URL}/api/marketplace/browse?${qs}`, { credentials: 'include' });
  }
  if (!res.ok) throw new Error(`Failed to fetch agents (${res.status})`);
  const data = await res.json();
  if (!data.agents) throw new Error('Invalid response format');
  return data;
}

export async function fetchFeaturedAgents(limit = 4): Promise<ApiAgent[]> {
  let res: Response;
  try {
    res = await fetch(`/api/marketplace/featured?limit=${limit}`, { credentials: 'include' });
  } catch {
    res = await fetch(`${API_URL}/api/marketplace/featured?limit=${limit}`, { credentials: 'include' });
  }
  if (!res.ok) throw new Error(`Failed to fetch featured (${res.status})`);
  const data = await res.json();
  return data.agents ?? data;
}

export async function assembleWorkflow(prompt: string): Promise<AssemblyResult> {
  const body = JSON.stringify({ prompt });
  const headers = { 'Content-Type': 'application/json' };

  let res: Response;
  try {
    res = await fetch('/api/workflows/assemble', {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  } catch {
    res = await fetch(`${API_URL}/api/workflows/assemble`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Assembly failed (${res.status})`);
  }
  const data = await res.json();
  return data.assembly;
}

export async function rentAgent(
  agentId: string,
): Promise<{ success?: boolean; rental_id?: string; checkout_url?: string; url?: string }> {
  const body = JSON.stringify({ agent_id: agentId, allowed_connection_ids: [] });
  const headers = { 'Content-Type': 'application/json' };

  let res: Response;
  try {
    res = await fetch('/api/rentals', {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  } catch {
    res = await fetch(`${API_URL}/api/rentals`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Rental failed (${res.status})`);
  }
  return res.json();
}

export async function createCheckout(
  agentId: string,
  opts?: { successUrl?: string; cancelUrl?: string },
): Promise<{ url?: string; demo?: boolean }> {
  const body = JSON.stringify({
    type: 'agent_rental',
    agent_id: agentId,
    allowed_connection_ids: [],
    success_url: opts?.successUrl,
    cancel_url: opts?.cancelUrl,
  });
  const headers = { 'Content-Type': 'application/json' };

  let res: Response;
  try {
    res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  } catch {
    res = await fetch(`${API_URL}/api/billing/create-checkout`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS — typed API client modules
// ═══════════════════════════════════════════════════════════════

export * from './client';
export * as authApi from './auth';
export * as agentsApi from './agents';
export * as connectionsApi from './connections';
export * as billingApi from './billing';
export * as workflowsApi from './workflows';
export * as rentalsApi from './rentals';
export * as marketplaceApi from './marketplace';

export async function createTeamCheckout(
  agentIds: string[],
  opts?: { successUrl?: string; cancelUrl?: string },
): Promise<{ url?: string; demo?: boolean }> {
  const body = JSON.stringify({
    type: 'team_rental',
    agent_ids: agentIds,
    success_url: opts?.successUrl,
    cancel_url: opts?.cancelUrl,
  });
  const headers = { 'Content-Type': 'application/json' };

  let res: Response;
  try {
    res = await fetch('/api/billing/create-checkout', {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  } catch {
    res = await fetch(`${API_URL}/api/billing/create-checkout`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body,
    });
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }
  return res.json();
}
