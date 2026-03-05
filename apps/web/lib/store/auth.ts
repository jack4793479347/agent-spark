'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface Org {
  id: string;
  name: string;
  plan: string;
  is_creator: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  org: Org | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  setOrg: (org: Org | null) => void;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  org: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    const supabase = createClient();

    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        session,
        user: session?.user ?? null,
        loading: false,
      });
      // Clear org when user signs out
      if (!session) {
        set({ org: null });
      }
    });
  },

  setOrg: (org) => set({ org }),

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, session: null, org: null });
  },

  getToken: async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
}));
