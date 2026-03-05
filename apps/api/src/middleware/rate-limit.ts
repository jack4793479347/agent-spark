import { createMiddleware } from 'hono/factory';

// ─── In-memory sliding window rate limiter ──────────────────────
// Uses a simple token bucket per IP. Upgradeable to Redis in production.

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_MAX_TOKENS = 100;    // requests per window
const DEFAULT_REFILL_RATE = 100;   // tokens refilled per window
const DEFAULT_WINDOW_MS = 60_000;  // 1 minute

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > DEFAULT_WINDOW_MS * 5) {
      store.delete(key);
    }
  }
}, 5 * 60_000);

function getClientIP(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  );
}

/**
 * General rate limiter — 100 requests per minute per IP.
 */
export const rateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = getClientIP(c);
  const now = Date.now();

  let entry = store.get(ip);

  if (!entry) {
    entry = { tokens: DEFAULT_MAX_TOKENS, lastRefill: now };
    store.set(ip, entry);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refill = Math.floor((elapsed / DEFAULT_WINDOW_MS) * DEFAULT_REFILL_RATE);
  if (refill > 0) {
    entry.tokens = Math.min(DEFAULT_MAX_TOKENS, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    c.header('Retry-After', String(Math.ceil(DEFAULT_WINDOW_MS / 1000)));
    c.header('X-RateLimit-Limit', String(DEFAULT_MAX_TOKENS));
    c.header('X-RateLimit-Remaining', '0');
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  entry.tokens--;

  c.header('X-RateLimit-Limit', String(DEFAULT_MAX_TOKENS));
  c.header('X-RateLimit-Remaining', String(entry.tokens));

  await next();
});

/**
 * Strict rate limiter for sensitive endpoints (auth, webhooks).
 * 20 requests per minute per IP.
 */
const STRICT_MAX = 20;
const strictStore = new Map<string, RateLimitEntry>();

export const strictRateLimitMiddleware = createMiddleware(async (c, next) => {
  const ip = getClientIP(c);
  const now = Date.now();

  let entry = strictStore.get(ip);

  if (!entry) {
    entry = { tokens: STRICT_MAX, lastRefill: now };
    strictStore.set(ip, entry);
  }

  const elapsed = now - entry.lastRefill;
  const refill = Math.floor((elapsed / DEFAULT_WINDOW_MS) * STRICT_MAX);
  if (refill > 0) {
    entry.tokens = Math.min(STRICT_MAX, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    c.header('Retry-After', String(Math.ceil(DEFAULT_WINDOW_MS / 1000)));
    return c.json({ error: 'Too many requests. Please try again later.' }, 429);
  }

  entry.tokens--;
  await next();
});
