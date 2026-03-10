import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';

import { marketplaceRoutes } from './routes/marketplace.js';
import { agentRoutes } from './routes/agents.js';
import { rentalRoutes } from './routes/rentals.js';
import { connectionRoutes } from './routes/connections.js';
import { workflowRoutes } from './routes/workflows.js';
import { a2aRoutes } from './routes/a2a.js';
import { billingRoutes } from './routes/billing.js';
import { authRoutes } from './routes/auth.js';
import { demoRoutes } from './routes/demo.js';
import { setupSocketIO } from './realtime/socket.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { validateEnv } from './lib/env-check.js';

// Validate required environment variables on startup
validateEnv();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use('/api/*', rateLimitMiddleware);

// Health check
app.get('/health', async (c) => {
  const checks: Record<string, string> = { api: 'ok' };

  // DB connectivity check
  try {
    const { supabaseAdmin } = await import('./lib/supabase.js');
    const { error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'unreachable';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return c.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, allOk ? 200 : 503);
});

// Routes
app.route('/api/marketplace', marketplaceRoutes);
app.route('/api/agents', agentRoutes);
app.route('/api/rentals', rentalRoutes);
app.route('/api/connections', connectionRoutes);
app.route('/api/workflows', workflowRoutes);
app.route('/api/a2a', a2aRoutes);
app.route('/api/billing', billingRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/demo', demoRoutes);

const port = Number(process.env.PORT) || 4000;

console.log(`Agent Spark API starting on port ${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

// Setup Socket.io on the same HTTP server
setupSocketIO(server as import('http').Server);

console.log(`Socket.io attached to port ${port}`);

export default app;
