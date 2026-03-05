import { apiGet, apiPost } from './client';
import type { UsageAllowance, CreatorEarning } from '@agentspark/shared';

export interface BillingInfo {
  plan: string;
  usage: UsageAllowance;
  subscription_id?: string;
  current_period_end?: string;
}

export interface EarningsSummary {
  total_gross_cents: number;
  total_net_cents: number;
  total_fee_cents: number;
  pending_payout_cents: number;
  current_month_net_cents: number;
  rental_count: number;
  a2a_call_count: number;
}

export interface EarningsHistoryEntry extends CreatorEarning {
  agents?: { name: string; slug: string };
}

export function getBillingInfo() {
  return apiGet<BillingInfo>('/api/billing/info');
}

export function getUsage() {
  return apiGet<UsageAllowance>('/api/billing/usage');
}

export function createSubscriptionCheckout(priceId: string) {
  return apiPost<{ url: string }>('/api/billing/create-checkout', {
    type: 'subscription',
    price_id: priceId,
  });
}

export function downgradeToFree() {
  return apiPost<{ success: boolean }>('/api/billing/downgrade');
}

export function getEarnings() {
  return apiGet<{ earnings: EarningsSummary }>('/api/billing/earnings');
}

export function getEarningsHistory(params?: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiGet<{ earnings: EarningsHistoryEntry[]; total: number; page: number; totalPages: number }>(
    `/api/billing/earnings/history${qs ? `?${qs}` : ''}`
  );
}

export function requestPayout() {
  return apiPost<{ transfer_id: string; amount_cents: number }>('/api/billing/payouts/request');
}
