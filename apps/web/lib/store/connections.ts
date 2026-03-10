'use client';

import { create } from 'zustand';
import {
  getConnectionStatus,
  authorizeConnection,
  type ComposioConnectionStatus,
} from '@/lib/api/connections';

interface ConnectionsState {
  connections: ComposioConnectionStatus[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  connect: (connectorType: string) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>((set) => ({
  connections: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const result = await getConnectionStatus();
      set({ connections: result.connections, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load connections', loading: false });
    }
  },

  connect: async (connectorType: string) => {
    try {
      const { redirectUrl } = await authorizeConnection(connectorType);
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to start connection' });
    }
  },
}));
