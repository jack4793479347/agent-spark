import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { tenantScopeMiddleware } from '../middleware/tenant-scope.js';
import type { AuthContext, OrgContext } from '../middleware/auth.js';
import { runSandbox } from '../services/sandbox.js';
import { enqueueAgentExecution } from '../queues/agent-execution.js';
import { resumeAfterApproval } from '../services/agent-runtime.js';
import { checkUsageAllowance, incrementTaskUsage } from '../services/billing-engine.js';
import { processDocument, deleteDocument, deleteAllDocuments, getKnowledgeBaseStats } from '../services/knowledge-base.js';
import type { PlanTier } from '@agentspark/shared';

export const agentRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
    org: OrgContext;
  };
}>();

// All routes require auth + tenant scope
agentRoutes.use('*', authMiddleware, tenantScopeMiddleware);

// ─── Schemas ──────────────────────────────────────────────────

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1).max(500),
  long_description: z.string().max(5000).optional(),
  category: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  system_prompt: z.string().min(1),
  model: z.string().default('claude-sonnet-4-5-20250929'),
  required_connectors: z.array(z.string()).default([]),
  optional_connectors: z.array(z.string()).default([]),
  pricing_model: z.enum(['free', 'monthly', 'per_use', 'tiered']).default('free'),
  price_cents: z.number().int().min(0).default(0),
  per_use_price_cents: z.number().int().min(0).default(0),
  a2a_call_price_cents: z.number().int().min(0).default(0),
});

const updateAgentSchema = createAgentSchema.partial();

const generateListingSchema = z.object({
  input: z.string().min(1, 'Please provide a system prompt or description'),
});

// ─── POST /generate-listing — AI-powered listing generation ───
agentRoutes.post('/generate-listing', zValidator('json', generateListingSchema), async (c) => {
  const { input } = c.req.valid('json');

  // Dynamic import to avoid requiring the SDK at build time
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a marketplace listing generator for an AI agent marketplace called Agent Spark. Given a system prompt or description of an AI agent, generate a complete marketplace listing.

Return a JSON object with these fields:
- name: Catchy agent name (2-4 words)
- slug: URL-friendly slug (lowercase, hyphens)
- description: One-paragraph marketplace description (max 200 chars)
- long_description: Detailed description (2-3 paragraphs, max 1000 chars)
- category: One of: customer-support, sales, ecommerce, marketing, finance, hr, productivity, data, development, content, operations, utility
- tags: Array of 3-5 relevant tags (lowercase)
- required_connectors: Array of connector IDs needed (from: gmail, slack, shopify, hubspot, stripe, notion, google-calendar, google-sheets, airtable, webhook)
- optional_connectors: Array of optional connector IDs
- pricing_model: Suggested pricing model (free, monthly, per_use)
- price_cents: Suggested price in cents (0 for free, or reasonable amount)
- capabilities: Array of 2-4 skill objects with { name, description }

Input from creator:
${input}

Respond with ONLY the JSON object, no markdown fences or other text.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return c.json({ error: 'AI did not return text' }, 500);
  }

  try {
    const listing = JSON.parse(textBlock.text);
    return c.json({ listing });
  } catch {
    return c.json({ error: 'Failed to parse AI response', raw: textBlock.text }, 500);
  }
});

// ─── POST / — Create new agent ────────────────────────────────
agentRoutes.post('/', zValidator('json', createAgentSchema), async (c) => {
  const auth = c.get('auth');
  const body = c.req.valid('json');

  // Calculate initial versatility stat from connector count
  const connectorCount = body.required_connectors.length + body.optional_connectors.length;
  const versatility = Math.min(99, connectorCount * 16);

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .insert({
      creator_id: auth.userId,
      ...body,
      status: 'draft',
      visibility: 'private',
      version: '1.0.0',
      stats: {
        speed: 50,
        accuracy: 50,
        reliability: 50,
        popularity: 0,
        versatility,
      },
      stats_updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return c.json({ error: 'An agent with this slug already exists' }, 409);
    }
    return c.json({ error: error.message }, 500);
  }

  return c.json({ agent }, 201);
});

// ─── GET /mine — List creator's agents ─────────────────────────
agentRoutes.get('/mine', async (c) => {
  const auth = c.get('auth');

  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('creator_id', auth.userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ agents: agents ?? [] });
});

// ─── PUT /:id — Update agent ──────────────────────────────────
agentRoutes.put('/:id', zValidator('json', updateAgentSchema), async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');
  const body = c.req.valid('json');

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('agents')
    .select('creator_id, status')
    .eq('id', agentId)
    .single();

  if (!existing) return c.json({ error: 'Agent not found' }, 404);
  if (existing.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  // Recalculate versatility if connectors changed
  const updates: Record<string, unknown> = { ...body };
  if (body.required_connectors || body.optional_connectors) {
    const reqCount = (body.required_connectors ?? []).length;
    const optCount = (body.optional_connectors ?? []).length;
    const versatility = Math.min(99, (reqCount + optCount) * 16);
    updates.stats = { speed: 50, accuracy: 50, reliability: 50, popularity: 0, versatility };
  }

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .update(updates)
    .eq('id', agentId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ agent });
});

// ─── POST /:id/publish — Publish agent to marketplace ─────────
agentRoutes.post('/:id/publish', async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id, status, name, description, category, system_prompt')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  // Validate required fields for publishing
  if (!agent.name || !agent.description || !agent.category || !agent.system_prompt) {
    return c.json({ error: 'Agent must have name, description, category, and system prompt to publish' }, 400);
  }

  const { data: published, error } = await supabaseAdmin
    .from('agents')
    .update({
      status: 'published',
      visibility: 'public',
      published_at: new Date().toISOString(),
    })
    .eq('id', agentId)
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ agent: published });
});

// ─── DELETE /:id — Archive agent ──────────────────────────────
agentRoutes.delete('/:id', async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  const { error } = await supabaseAdmin
    .from('agents')
    .update({ status: 'archived', visibility: 'private' })
    .eq('id', agentId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: 'Agent archived' });
});

// ─── POST /:id/sandbox — Sandbox test ────────────────────────
const sandboxSchema = z.object({
  input: z.string().min(1, 'Please provide a task for the agent'),
});

agentRoutes.post('/:id/sandbox', zValidator('json', sandboxSchema), async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');
  const org = c.get('org');
  const { input } = c.req.valid('json');

  try {
    const { executionId } = await runSandbox({
      agentId,
      userId: auth.userId,
      orgId: org.orgId,
      input,
    });
    return c.json({ executionId, status: 'queued' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sandbox failed';
    return c.json({ error: message }, 400);
  }
});

// ─── POST /:id/execute — Execute a rented agent ─────────────────
const executeSchema = z.object({
  rental_id: z.string().uuid(),
  input: z.string().min(1, 'Please provide a task for the agent'),
});

agentRoutes.post('/:id/execute', zValidator('json', executeSchema), async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');
  const org = c.get('org');
  const { rental_id, input } = c.req.valid('json');

  // Verify rental exists and is active
  const { data: rental } = await supabaseAdmin
    .from('rentals')
    .select('*')
    .eq('id', rental_id)
    .eq('agent_id', agentId)
    .eq('renter_org_id', org.orgId)
    .eq('status', 'active')
    .single();

  if (!rental) {
    return c.json({ error: 'No active rental found for this agent' }, 404);
  }

  // Check usage allowance before execution
  const usage = await checkUsageAllowance(org.orgId);
  if (!usage.allowed) {
    return c.json({
      error: 'Task limit reached for your current plan',
      usage,
      upgrade_url: '/settings?tab=billing',
    }, 429);
  }

  // Fetch agent
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('id, system_prompt, model, required_connectors, optional_connectors')
    .eq('id', agentId)
    .single();

  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Fetch org connections
  const { data: connections } = await supabaseAdmin
    .from('connections')
    .select('id, connector_type_id, credential_vault_id, status')
    .eq('org_id', org.orgId)
    .eq('status', 'active');

  // Get org plan
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', org.orgId)
    .single();

  // Create execution record
  const { data: execution, error: execError } = await supabaseAdmin
    .from('agent_executions')
    .insert({
      rental_id,
      agent_id: agentId,
      org_id: org.orgId,
      input_text: input,
      status: 'queued',
      total_tokens: 0,
      total_tool_calls: 0,
      total_a2a_calls: 0,
      cost_cents: 0,
    })
    .select('id')
    .single();

  if (execError || !execution) {
    return c.json({ error: 'Failed to create execution' }, 500);
  }

  // Enqueue for async execution
  await enqueueAgentExecution({
    executionId: execution.id,
    agent: {
      id: agent.id,
      system_prompt: agent.system_prompt,
      model: agent.model,
      required_connectors: agent.required_connectors ?? [],
      optional_connectors: agent.optional_connectors ?? [],
    },
    rental: {
      id: rental.id,
      allowed_connection_ids: rental.allowed_connection_ids ?? [],
    },
    orgId: org.orgId,
    plan: (orgData?.plan as PlanTier) ?? 'free',
    connections: connections ?? [],
    userInput: input,
  });

  // Increment task usage for the org
  await incrementTaskUsage(org.orgId);

  return c.json({ executionId: execution.id, status: 'queued', usage }, 201);
});

// ─── GET /executions — List org's executions ────────────────────
agentRoutes.get('/executions', async (c) => {
  const org = c.get('org');
  const status = c.req.query('status');
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 50);

  let query = supabaseAdmin
    .from('agent_executions')
    .select('*')
    .eq('org_id', org.orgId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: executions, error } = await query;

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ executions: executions ?? [] });
});

// ─── GET /executions/:executionId — Get execution detail ─────────
agentRoutes.get('/executions/:executionId', async (c) => {
  const executionId = c.req.param('executionId');
  const org = c.get('org');

  const { data: execution, error } = await supabaseAdmin
    .from('agent_executions')
    .select('*')
    .eq('id', executionId)
    .eq('org_id', org.orgId)
    .single();

  if (error || !execution) {
    return c.json({ error: 'Execution not found' }, 404);
  }

  return c.json({ execution });
});

// ─── GET /approvals — List pending approvals ────────────────────
agentRoutes.get('/approvals', async (c) => {
  const org = c.get('org');

  const { data: approvals, error } = await supabaseAdmin
    .from('approval_queue')
    .select('*, agent_executions(agent_id, input_text)')
    .eq('org_id', org.orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ approvals: approvals ?? [] });
});

// ─── POST /approvals/:id/respond — Approve or reject ────────────
const approvalResponseSchema = z.object({
  approved: z.boolean(),
});

agentRoutes.post('/approvals/:id/respond', zValidator('json', approvalResponseSchema), async (c) => {
  const approvalId = c.req.param('id');
  const auth = c.get('auth');
  const org = c.get('org');
  const { approved } = c.req.valid('json');

  // Verify approval belongs to org
  const { data: approval } = await supabaseAdmin
    .from('approval_queue')
    .select('*')
    .eq('id', approvalId)
    .eq('org_id', org.orgId)
    .eq('status', 'pending')
    .single();

  if (!approval) {
    return c.json({ error: 'Approval not found or already processed' }, 404);
  }

  // Update approval
  await supabaseAdmin
    .from('approval_queue')
    .update({
      status: approved ? 'approved' : 'rejected',
      reviewed_by: auth.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', approvalId);

  // Resume or cancel the execution
  await resumeAfterApproval(approval.execution_id, approved);

  return c.json({
    message: approved ? 'Action approved — execution resuming' : 'Action rejected — execution cancelled',
  });
});

// ─── Knowledge Base Endpoints ─────────────────────────────────

// POST /:id/knowledge — Upload a document to the knowledge base
const uploadKBSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
});

agentRoutes.post('/:id/knowledge', zValidator('json', uploadKBSchema), async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');
  const { filename, content } = c.req.valid('json');

  // Verify ownership
  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  try {
    const result = await processDocument(agentId, filename, content);
    return c.json({
      success: true,
      filename,
      chunks: result.chunkCount,
      tokens: result.totalTokens,
    }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process document';
    return c.json({ error: message }, 500);
  }
});

// DELETE /:id/knowledge/:filename — Remove a document from KB
agentRoutes.delete('/:id/knowledge/:filename', async (c) => {
  const agentId = c.req.param('id');
  const filename = decodeURIComponent(c.req.param('filename'));
  const auth = c.get('auth');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  await deleteDocument(agentId, filename);
  return c.json({ success: true });
});

// DELETE /:id/knowledge — Clear entire KB
agentRoutes.delete('/:id/knowledge', async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  await deleteAllDocuments(agentId);
  return c.json({ success: true });
});

// GET /:id/knowledge — Get KB stats
agentRoutes.get('/:id/knowledge', async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('creator_id')
    .eq('id', agentId)
    .single();

  if (!agent) return c.json({ error: 'Agent not found' }, 404);
  if (agent.creator_id !== auth.userId) return c.json({ error: 'Not authorized' }, 403);

  try {
    const stats = await getKnowledgeBaseStats(agentId);
    return c.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get KB stats';
    return c.json({ error: message }, 500);
  }
});
