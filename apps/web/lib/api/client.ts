import { useAuthStore } from '@/lib/store/auth';

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await useAuthStore.getState().getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const org = useAuthStore.getState().org;
  if (org?.id) {
    headers['X-Org-Id'] = org.id;
  }

  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body.error ?? body.message ?? `Request failed (${res.status})`;
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
  }
  return res.json();
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, { headers });
  return handleResponse<T>(res);
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    method: 'PUT',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(path, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<T>(res);
}
