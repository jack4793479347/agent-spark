import { useAuthStore } from '@/lib/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

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

function baseUrl(): string {
  // When mocking, use Next.js API routes (relative path)
  return USE_MOCK ? '' : API_URL;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? body.message ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${baseUrl()}${path}`, { headers });
  return handleResponse<T>(res);
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T = unknown>(path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'PUT',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<T>(res);
}
