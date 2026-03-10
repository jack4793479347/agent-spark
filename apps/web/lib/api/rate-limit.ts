// In-memory sliding window rate limiter.
// Swap to Upstash @upstash/ratelimit for production multi-instance.

const windows = new Map<string, number[]>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs * 2;
  for (const [key, timestamps] of windows) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) windows.delete(key);
    else windows.set(key, filtered);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  cleanup(windowMs);

  const timestamps = windows.get(key) ?? [];
  const windowStart = now - windowMs;
  const recent = timestamps.filter((t) => t > windowStart);

  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + windowMs - now,
    };
  }

  recent.push(now);
  windows.set(key, recent);

  return {
    allowed: true,
    remaining: maxRequests - recent.length,
    resetMs: windowMs,
  };
}

export function rateLimitKey(userId: string, endpoint: string): string {
  return `${endpoint}:${userId}`;
}
