'use client';

import { create } from 'zustand';
import {
  getBillingInfo,
  getUsage,
  getEarnings,
  type BillingInfo,
  type EarningsSummary,
} from '@/lib/api/billing';
import type { UsageAllowance } from '@agentspark/shared';

interface BillingState {
  plan: string;
  usage: UsageAllowance | null;
  billingInfo: BillingInfo | null;
  earnings: EarningsSummary | null;
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  fetchEarnings: () => Promise<void>;
}

export const useBillingStore = create<BillingState>((set) => ({
  plan: 'free',
  usage: null,
  billingInfo: null,
  earnings: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const [info, usage] = await Promise.all([
        getBillingInfo(),
        getUsage(),
      ]);
      set({
        billingInfo: info,
        plan: info.plan,
        usage,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load billing', loading: false });
    }
  },

  fetchEarnings: async () => {
    try {
      const data = await getEarnings();
      set({ earnings: data.earnings });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load earnings' });
    }
  },
}));
