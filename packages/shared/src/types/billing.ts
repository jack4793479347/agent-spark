export interface PlatformPlan {
  name: string;
  stripe_price_id: string | null;
  monthly_tasks: number;
  monthly_a2a_calls: number;
  price_cents: number;
}

export const PLATFORM_PLANS = {
  free: {
    name: 'Free',
    stripe_price_id: null,
    monthly_tasks: 50,
    monthly_a2a_calls: 10,
    price_cents: 0,
  },
  starter: {
    name: 'Starter',
    stripe_price_id: null, // Set via env
    monthly_tasks: 500,
    monthly_a2a_calls: 100,
    price_cents: 2900,
  },
  pro: {
    name: 'Pro',
    stripe_price_id: null, // Set via env
    monthly_tasks: 2000,
    monthly_a2a_calls: 500,
    price_cents: 7900,
  },
  business: {
    name: 'Business',
    stripe_price_id: null, // Set via env
    monthly_tasks: 10000,
    monthly_a2a_calls: 2500,
    price_cents: 19900,
  },
} as const;

export type PlanTier = keyof typeof PLATFORM_PLANS;

export const PLATFORM_FEE_PERCENTAGE = 0.15;

export interface UsageAllowance {
  allowed: boolean;
  remaining_tasks: number;
  remaining_a2a_calls: number;
  plan: string;
}

export interface Rental {
  id: string;
  agent_id: string;
  renter_org_id: string;
  renter_user_id?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  monthly_price_cents: number;
  total_executions: number;
  total_a2a_calls_made: number;
  total_a2a_calls_received: number;
  allowed_connection_ids: string[];
  started_at: string;
  cancelled_at?: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  source: 'rental' | 'a2a_call' | 'bonus';
  source_id?: string;
  agent_id?: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  payout_status: 'pending' | 'processing' | 'paid' | 'failed';
  stripe_transfer_id?: string;
  period_start?: string;
  period_end?: string;
  created_at: string;
}

export interface ExecutionLimits {
  max_iterations: number;
  max_tokens_per_run: number;
  max_a2a_calls: number;
}

export const EXECUTION_LIMITS: Record<PlanTier, ExecutionLimits> = {
  free: { max_iterations: 5, max_tokens_per_run: 10000, max_a2a_calls: 1 },
  starter: { max_iterations: 10, max_tokens_per_run: 25000, max_a2a_calls: 3 },
  pro: { max_iterations: 15, max_tokens_per_run: 50000, max_a2a_calls: 5 },
  business: { max_iterations: 25, max_tokens_per_run: 100000, max_a2a_calls: 10 },
};
