'use client';

import { create } from 'zustand';
import {
  getAvailableConnectors,
  getConnections,
  deleteConnection,
  getOAuthStartUrl,
  type ConnectorType,
  type Connection,
} from '@/lib/api/connections';

interface ConnectionsState {
  connections: Connection[];
  availableTypes: ConnectorType[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  startOAuth: (type: string) => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  availableTypes: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const [conns, types] = await Promise.all([
        getConnections(),
        getAvailableConnectors(),
      ]);
      set({
        connections: conns.connections,
        availableTypes: types.connector_types,
        loading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load connections', loading: false });
    }
  },

  disconnect: async (id: string) => {
    try {
      await deleteConnection(id);
      set({ connections: get().connections.filter((c) => c.id !== id) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to disconnect' });
    }
  },

  startOAuth: async (type: string) => {
    try {
      const { url } = await getOAuthStartUrl(type);
      window.location.href = url;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to start OAuth' });
    }
  },
}));
