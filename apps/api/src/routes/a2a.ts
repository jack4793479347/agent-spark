import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { generateAgentCard } from '../connectors/a2a-orchestrator.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';

export const a2aRoutes = new Hono();

// ─── GET /agents/:slug/.well-known/agent.json — Agent Card ──────

a2aRoutes.get('/agents/:slug/.well-known/agent.json', async (c) => {
  const slug = c.req.param('slug');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, version, creator_id, tags, a2a_call_price_cents, avg_rating, total_a2a_calls, capabilities')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .single();

  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const card = generateAgentCard({
    ...agent,
    capabilities: (agent.capabilities as Array<{
      skill_id: string;
      name: string;
      description: string;
      input_schema?: Record<string, unknown>;
      output_schema?: Record<string, unknown>;
    }>) ?? [],
  });

  return c.json(card);
});

// ─── GET /agents/:slug/card — Human-readable Agent Card ─────────

a2aRoutes.get('/agents/:slug/card', async (c) => {
  const slug = c.req.param('slug');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, category, a2a_call_price_cents, avg_rating, total_a2a_calls, profiles!creator_id(display_name)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  return c.json({
    agent_id: agent.id,
    name: agent.name,
    description: agent.description,
    category: agent.category,
    price_per_call_cents: agent.a2a_call_price_cents,
    rating: agent.avg_rating,
    total_calls: agent.total_a2a_calls,
    creator: agent.profiles,
  });
});

// ─── GET /calls — List A2A calls for the org ────────────────────

a2aRoutes.get(
  '/calls',
  authMiddleware,
  async (c) => {
    const auth = c.get('auth') as AuthContext;

    const { data: membership } = await supabaseAdmin
      .from('org_members')
      .select('org_id')
      .eq('user_id', auth.userId)
      .single();

    if (!membership) {
      return c.json({ error: 'No organization found' }, 400);
    }

    const page = Number(c.req.query('page') ?? 1);
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: calls, error, count } = await supabaseAdmin
      .from('a2a_calls')
      .select(`
        *,
        caller_agent:agents!caller_agent_id(name, slug),
        target_agent:agents!target_agent_id(name, slug)
      `, { count: 'exact' })
      .eq('caller_org_id', membership.org_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({
      calls: calls ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    });
  }
);

// ─── GET /calls/:id — Get A2A call detail ───────────────────────

a2aRoutes.get('/calls/:id', authMiddleware, async (c) => {
  const callId = c.req.param('id');
  const auth = c.get('auth') as AuthContext;

  const { data: membership } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', auth.userId)
    .single();

  if (!membership) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const { data: call } = await supabaseAdmin
    .from('a2a_calls')
    .select(`
      *,
      caller_agent:agents!caller_agent_id(name, slug, category),
      target_agent:agents!target_agent_id(name, slug, category)
    `)
    .eq('id', callId)
    .eq('caller_org_id', membership.org_id)
    .single();

  if (!call) {
    return c.json({ error: 'A2A call not found' }, 404);
  }

  return c.json({ call });
});

// ─── POST /agents/:slug/tasks — External A2A task (platform auth)

const createTaskSchema = z.object({
  task_description: z.string().min(1),
  input_payload: z.record(z.unknown()).optional(),
  caller_agent_id: z.string().uuid(),
  caller_execution_id: z.string().uuid(),
  caller_org_id: z.string().uuid(),
});

a2aRoutes.post(
  '/agents/:slug/tasks',
  zValidator('json', createTaskSchema),
  async (c) => {
    const slug = c.req.param('slug');
    const body = c.req.valid('json');

    // Verify platform token
    const platformToken = c.req.header('x-platform-token');
    const expectedToken = process.env.A2A_PLATFORM_TOKEN;

    if (!platformToken || !expectedToken || platformToken !== expectedToken) {
      return c.json({ error: 'Invalid platform token' }, 401);
    }

    // Fetch target agent
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('id, name, slug')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    // Import and call delegateToAgent
    const { delegateToAgent } = await import('../connectors/a2a-orchestrator.js');

    const result = await delegateToAgent(
      {
        agent_id: agent.id,
        task: body.task_description,
        context: body.input_payload,
      },
      {
        callerAgentId: body.caller_agent_id,
        callerExecutionId: body.caller_execution_id,
        callerOrgId: body.caller_org_id,
        callerPlan: 'pro', // External calls default to pro limits
      }
    );

    return c.json({ result }, result.success ? 200 : 500);
  }
);

// ─── GET /agents/:slug/tasks/:taskId — Task status ──────────────

a2aRoutes.get('/agents/:slug/tasks/:taskId', async (c) => {
  const taskId = c.req.param('taskId');

  const { data: call } = await supabaseAdmin
    .from('a2a_calls')
    .select('id, status, output_payload, duration_ms, created_at, completed_at')
    .eq('id', taskId)
    .single();

  if (!call) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json({ task: call });
});
