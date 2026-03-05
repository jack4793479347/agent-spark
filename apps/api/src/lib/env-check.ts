// ─── Startup Environment Variable Validation ───────────────────

const REQUIRED_VARS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
] as const;

const RECOMMENDED_VARS = [
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'REDIS_URL',
  'CREDENTIAL_ENCRYPTION_KEY',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of RECOMMENDED_VARS) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[env] FATAL: Missing required environment variables: ${missing.join(', ')}`
    );
    console.error('[env] Copy .env.example to .env and fill in the required values.');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn(
      `[env] WARNING: Missing recommended environment variables: ${warnings.join(', ')}`
    );
    console.warn('[env] Some features will not work without these.');
  }
}
