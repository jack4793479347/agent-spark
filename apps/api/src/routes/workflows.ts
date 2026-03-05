import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthContext } from '../middleware/auth.js';
import {
  assembleWorkflow,
  saveWorkflow,
  listWorkflows,
  executeWorkflow,
  getWorkflowStatus,
} from '../services/workflow-assembler.js';

export const workflowRoutes = new Hono<{
  Variables: {
    auth: AuthContext;
  };
}>();

// All workflow routes require auth
workflowRoutes.use('*', authMiddleware);

// Helper: get user's org
async function getUserOrgId(userId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .single();
  return data?.org_id ?? null;
}

// ─── POST /assemble — AI Workflow Assembler ─────────────────────

const assembleSchema = z.object({
  prompt: z.string().min(3).max(1000),
});

workflowRoutes.post('/assemble', zValidator('json', assembleSchema), async (c) => {
  const auth = c.get('auth') as AuthContext;
  const { prompt } = c.req.valid('json');

  const orgId = await getUserOrgId(auth.userId);
  if (!orgId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  try {
    const result = await assembleWorkflow({
      prompt,
      orgId,
      userId: auth.userId,
    });

    return c.json({ assembly: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assembly failed';
    return c.json({ error: message }, 500);
  }
});

// ─── POST / — Save a workflow ───────────────────────────────────

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  agent_ids: z.array(z.string().uuid()).min(1),
  trigger_type: z.enum(['manual', 'schedule', 'webhook', 'event']).optional(),
  trigger_config: z.record(z.unknown()).optional(),
  assembled_by_ai: z.boolean().optional(),
  assembly_prompt: z.string().optional(),
});

workflowRoutes.post('/', zValidator('json', createWorkflowSchema), async (c) => {
  const auth = c.get('auth') as AuthContext;
  const body = c.req.valid('json');

  const orgId = await getUserOrgId(auth.userId);
  if (!orgId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const result = await saveWorkflow({
    orgId,
    userId: auth.userId,
    name: body.name,
    description: body.description,
    agentIds: body.agent_ids,
    triggerType: body.trigger_type,
    triggerConfig: body.trigger_config,
    assembledByAi: body.assembled_by_ai,
    assemblyPrompt: body.assembly_prompt,
  });

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ workflow: result.workflow }, 201);
});

// ─── GET / — List org's workflows ───────────────────────────────

workflowRoutes.get('/', async (c) => {
  const auth = c.get('auth') as AuthContext;

  const orgId = await getUserOrgId(auth.userId);
  if (!orgId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const page = Number(c.req.query('page') ?? 1);
  const result = await listWorkflows(orgId, page);

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({
    workflows: result.workflows,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
});

// ─── POST /:id/execute — Run a workflow ─────────────────────────

workflowRoutes.post('/:id/execute', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const workflowId = c.req.param('id');

  const orgId = await getUserOrgId(auth.userId);
  if (!orgId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const result = await executeWorkflow(workflowId, orgId, auth.userId);

  if (!result.success) {
    return c.json({ error: result.error }, result.error === 'Workflow not found' ? 404 : 400);
  }

  return c.json({
    execution_id: result.execution_id,
    primary_agent: result.primary_agent,
    agent_count: result.agent_count,
  }, 201);
});

// ─── GET /:id/status — Get workflow status ──────────────────────

workflowRoutes.get('/:id/status', async (c) => {
  const auth = c.get('auth') as AuthContext;
  const workflowId = c.req.param('id');

  const orgId = await getUserOrgId(auth.userId);
  if (!orgId) {
    return c.json({ error: 'No organization found' }, 400);
  }

  const result = await getWorkflowStatus(workflowId, orgId);

  if (!result.success) {
    return c.json({ error: result.error }, 404);
  }

  return c.json({
    workflow: result.workflow,
    recent_executions: result.recent_executions,
  });
});
