'use client';

import { create } from 'zustand';
import {
  getActiveRentals,
  cancelRental,
  type ActiveRental,
} from '@/lib/api/rentals';

interface RentalsState {
  rentals: ActiveRental[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  isRented: (agentId: string) => boolean;
  cancel: (id: string) => Promise<void>;
}

export const useRentalsStore = create<RentalsState>((set, get) => ({
  rentals: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getActiveRentals();
      set({ rentals: data.rentals, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load rentals', loading: false });
    }
  },

  isRented: (agentId: string) => {
    return get().rentals.some((r) => r.agent_id === agentId && r.status === 'active');
  },

  cancel: async (id: string) => {
    try {
      await cancelRental(id);
      set({ rentals: get().rentals.filter((r) => r.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to cancel rental' });
    }
  },
}));
