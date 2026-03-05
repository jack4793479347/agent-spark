import { apiGet, apiPost, apiPut } from './client';

export interface ActiveRental {
  id: string;
  agent_id: string;
  status: string;
  monthly_price_cents: number;
  total_executions: number;
  started_at: string;
  cancelled_at?: string;
  agents?: { name: string; slug: string };
}

export function createRental(agentIdOrSlug: string, allowedConnectionIds: string[] = []) {
  // If it looks like a UUID use agent_id, otherwise use agent_slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(agentIdOrSlug);
  return apiPost<{ success?: boolean; rental_id?: string; checkout_url?: string }>('/api/rentals', {
    ...(isUuid ? { agent_id: agentIdOrSlug } : { agent_slug: agentIdOrSlug }),
    allowed_connection_ids: allowedConnectionIds,
  });
}

export function cancelRental(id: string) {
  return apiPost<{ success: boolean }>(`/api/rentals/${id}/cancel`);
}

export function getActiveRentals() {
  return apiGet<{ rentals: ActiveRental[] }>('/api/rentals/active');
}

export function updateRentalPermissions(id: string, connectionIds: string[]) {
  return apiPut<{ success: boolean }>(`/api/rentals/${id}/permissions`, {
    allowed_connection_ids: connectionIds,
  });
}
