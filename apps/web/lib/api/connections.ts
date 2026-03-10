import { apiGet, apiPost, apiDelete } from './client';

export interface ConnectorType {
  id: string;
  name: string;
  description: string;
  auth_type: string;
  is_active: boolean;
  icon_url?: string;
}

export interface Connection {
  id: string;
  org_id?: string;
  connector_type_id: string;
  status: string;
  scopes?: string[];
  connected_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface ComposioConnectionStatus {
  connector_type: string;
  name: string;
  logo?: string;
  connected: boolean;
  isNoAuth: boolean;
}

export function getAvailableConnectors() {
  return apiGet<{ connector_types: ConnectorType[] }>('/api/connections/available');
}

export function getConnections() {
  return apiGet<{ connections: Connection[] }>('/api/connections');
}

export function getConnectionStatus() {
  return apiGet<{ connections: ComposioConnectionStatus[] }>('/api/connections/status');
}

export function authorizeConnection(connectorType: string) {
  return apiPost<{ redirectUrl: string; connectionId: string }>('/api/connections/authorize', {
    connector_type: connectorType,
  });
}

export function deleteConnection(id: string) {
  return apiDelete<{ message: string }>(`/api/connections/${id}`);
}

export function testConnection(id: string) {
  return apiPost<{ healthy: boolean; reason?: string }>(`/api/connections/${id}/test`);
}

export function getOAuthStartUrl(type: string) {
  return apiGet<{ url: string }>(`/api/connections/oauth/${type}/start-url`);
}
