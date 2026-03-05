import { apiGet, apiPost } from './client';

export interface SessionResponse {
  user: { id: string; email: string };
  org: { id: string; name: string; plan: string; is_creator: boolean };
}

export function getSession() {
  return apiGet<SessionResponse>('/api/auth/session');
}

export function becomeCreator() {
  return apiPost<{ url: string }>('/api/auth/become-creator');
}
