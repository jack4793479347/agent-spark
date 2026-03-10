import { NextResponse } from 'next/server';

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(e: unknown) {
  console.error('Route error:', e);
  const message = e instanceof Error ? e.message : 'Internal server error';
  return apiError(message, 500);
}
