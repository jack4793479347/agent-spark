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

// ─── POST /training-chat — AI trainer conversation ────────────
const trainingChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  phase: z.string().default('purpose'),
});

const TRAINER_SYSTEM_PROMPT = `You are an expert AI agent product designer for Agent Spark — a marketplace where creators build and SELL AI agents to customers.

CRITICAL FRAMING: The creator is building a PRODUCT to sell on a marketplace. Every question should be framed around the buyer/customer experience, not the creator's personal use. Think "What will your customers need?" not "What do you want?"

Your job is to interview the creator through a structured conversation, then we will generate a production-quality system prompt from the answers.

## SUGGESTED ANSWERS

After EVERY question, provide 3-5 clickable suggested answers. Format them as:
__SUGGESTIONS:["suggestion 1", "suggestion 2", "suggestion 3"]__

Make suggestions specific and opinionated — not generic. They should be the most likely good answers for the context. The creator can click one OR type their own answer.

## Your Conversation Flow

At the END of each message, include metadata:
__PHASE:current_phase__
__PROGRESS:number__ (0-100)
__SUGGESTIONS:["option1", "option2", "option3"]__

### Phase 1: PURPOSE (start here)
Frame around the PRODUCT and MARKET:
- "What type of agent do you want to sell?" (with suggestions based on popular categories)
- "Who's the target customer? What's their job title and pain point?"
- "What will customers get from this agent that they can't easily do themselves?"
Move fast — 1-2 exchanges max.

### Phase 2: BEHAVIOR
Quick decisions about agent personality and rules. These should be mostly clickable:
- Tone (professional, friendly, technical, casual)
- When unsure (ask clarifying questions, best guess with disclaimer, escalate)
- Output format (structured reports, conversational, bullet points, step-by-step)
- Hard rules / things to never do
1-2 exchanges max.

### Phase 3: KNOWLEDGE
- "What expertise makes this agent worth paying for?"
- "What domain knowledge should this agent have?"
Do NOT ask about uploading documents or knowledge base files — that happens in a separate Setup step after training. Focus on the conceptual expertise and domain knowledge the agent should have.
1 exchange max.

### Phase 4: EXAMPLES
Provide 1-2 EXAMPLE scenarios yourself based on what you've learned, and ask if they look right. Don't ask the creator to come up with examples from scratch — that's friction. Show them what good looks like and let them adjust.
1 exchange.

### Phase 5: REVIEW
Present a tight summary. Ask for confirmation.
1 exchange.

## Rules
- MARKETPLACE MINDSET: Always frame questions as "your customers" and "buyers", never "you personally"
- SPEED IS EVERYTHING: The ENTIRE training should be 4-6 exchanges. Move FAST. Combine related questions. Skip what you can infer.
- SUGGESTED ANSWERS: Every single message MUST end with __SUGGESTIONS:[...]__. Make them specific, smart, and clickable. Most users should be able to complete training by ONLY clicking suggestions.
- Keep messages SHORT: 1-2 sentences + the question. NO walls of text. NO bullet lists of sub-questions. ONE question.
- Be opinionated — suggest what you think is best, let them override
- Skip phases that are already answered from context
- After 3-4 exchanges, you should have enough. Move to review quickly.`;

agentRoutes.post('/training-chat', zValidator('json', trainingChatSchema), async (c) => {
  const { messages, phase } = c.req.valid('json');

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  // Ensure conversation starts with a user message (required by Claude API)
  // If the first message is from the assistant (our trainer), prepend the implicit user greeting
  let apiMessages = messages.length > 0 ? [...messages] : [];
  if (apiMessages.length === 0 || apiMessages[0].role !== 'user') {
    apiMessages = [{ role: 'user' as const, content: 'Hi, I want to create a new agent.' }, ...apiMessages];
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    system: TRAINER_SYSTEM_PROMPT,
    messages: apiMessages,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return c.json({ error: 'AI did not return text' }, 500);
  }

  const text = textBlock.text;

  // Parse metadata from response
  const phaseMatch = text.match(/__PHASE:\s*(\w+)__/i);
  const progressMatch = text.match(/__PROGRESS:\s*(\d+)__/i);

  // Parse suggestions from Claude
  const suggestionsMatch = text.match(/__SUGGESTIONS:\s*(\[[\s\S]*?\])__/i);
  let suggestions: string[] = [];
  if (suggestionsMatch) {
    try {
      suggestions = JSON.parse(suggestionsMatch[1]);
    } catch {
      // Ignore parse errors
    }
  }

  // Clean display text (remove metadata markers)
  const displayText = text
    .replace(/__PHASE:\s*\w+__/gi, '')
    .replace(/__PROGRESS:\s*\d+__/gi, '')
    .replace(/__SUGGESTIONS:\s*\[[\s\S]*?\]__/gi, '')
    .trim();

  const detectedPhase = (phaseMatch?.[1] ?? phase).toLowerCase();
  const detectedProgress = progressMatch ? parseInt(progressMatch[1], 10) : 0;

  // Guaranteed fallback suggestions per phase if Claude didn't provide any
  if (suggestions.length === 0) {
    const messageCount = apiMessages.length;
    const fallbacks: Record<string, string[][]> = {
      purpose: [
        ['Customer support agent', 'Content creation assistant', 'Sales outreach agent', 'Data analysis agent', 'HR onboarding assistant'],
        ['Small business owners', 'Marketing teams', 'Developers', 'Freelancers', 'Enterprise teams'],
        ['Saves them hours of manual work', 'Gives expert-level output without hiring', 'Automates a repetitive workflow', 'Provides 24/7 availability'],
      ],
      behavior: [
        ['Professional and helpful', 'Friendly and casual', 'Technical and precise', 'Bold and direct'],
        ['Ask clarifying questions first', 'Give best answer with disclaimer', 'Provide multiple options to choose from'],
        ['Structured reports with sections', 'Conversational and natural', 'Step-by-step instructions', 'Bullet point summaries'],
      ],
      knowledge: [
        ['Yes, I have docs to upload', 'No, general knowledge is fine', 'I\'ll add docs later'],
      ],
      examples: [
        ['Looks good, move on', 'Adjust the tone a bit', 'Add more detail to the output', 'Change the format'],
      ],
      review: [
        ['Looks great, generate my agent!', 'I want to adjust something', 'Add one more thing'],
      ],
      complete: [
        ['Looks great, generate my agent!'],
      ],
    };
    const phaseFallbacks = fallbacks[detectedPhase] ?? fallbacks.purpose;
    const fallbackIdx = Math.min(Math.floor(messageCount / 2), phaseFallbacks.length - 1);
    suggestions = phaseFallbacks[fallbackIdx] ?? phaseFallbacks[0];
  }

  const result: Record<string, unknown> = {
    message: displayText,
    phase: detectedPhase,
    progress: detectedProgress,
    suggestions,
  };

  // When training is complete (progress >= 95 and phase is review/complete),
  // make a dedicated call to generate the system prompt with enough tokens
  if (detectedProgress >= 95 && (detectedPhase === 'review' || detectedPhase === 'complete')) {
    // Build a summary of the conversation for prompt generation
    const conversationSummary = apiMessages
      .map((m) => `${m.role === 'user' ? 'Creator' : 'Trainer'}: ${m.content}`)
      .join('\n\n');

    const promptGenResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Based on this training conversation between a creator and an AI agent trainer, generate two things:

1. A complete, production-ready SYSTEM PROMPT for the AI agent. This should be detailed, well-structured with clear sections, and include all the behavior rules, knowledge requirements, output formats, and constraints discussed. Make it comprehensive enough that the agent works great out of the box.

CRITICAL BEHAVIORAL RULES to include in every system prompt:
- The agent must be ACTION-ORIENTED. It should DO things immediately, not ask endless clarifying questions.
- If the agent has enough context to start working, it should start working and deliver a result.
- The agent should ask AT MOST one clarifying question before producing output. If the user's request is reasonably clear, skip questions entirely and deliver value.
- When the agent has a knowledge base (RAG context will be injected below the system prompt), it MUST actively reference and use that knowledge in its responses. Never say "I don't have access to a knowledge base" — if knowledge context appears below, USE IT.
- The agent should produce concrete, specific, actionable output — not generic advice.

2. A JSON metadata object with: name (catchy 2-4 word agent name), description (one sentence, max 200 chars), category (one of: customer-support, sales, ecommerce, marketing, finance, hr, productivity, development, content, operations, utility), tags (array of 3-5 lowercase tags), suggested_pricing (number, 0 for free, or reasonable monthly price in dollars).

Here is the training conversation:

${conversationSummary}

Respond in EXACTLY this format:

__SYSTEM_PROMPT_START__
(the complete system prompt here)
__SYSTEM_PROMPT_END__

__AGENT_META_START__
(the JSON metadata object here)
__AGENT_META_END__`,
      }],
    });

    const genText = promptGenResponse.content.find((b) => b.type === 'text');
    if (genText && genText.type === 'text') {
      const systemPromptMatch = genText.text.match(/__SYSTEM_PROMPT_START__\n?([\s\S]*?)\n?__SYSTEM_PROMPT_END__/);
      const metaMatch = genText.text.match(/__AGENT_META_START__\n?([\s\S]*?)\n?__AGENT_META_END__/);

      if (systemPromptMatch) {
        result.system_prompt = systemPromptMatch[1].trim();
      }
      if (metaMatch) {
        try {
          result.agent_meta = JSON.parse(metaMatch[1].trim());
        } catch {
          // Ignore parse errors for meta
        }
      }
    }

    result.progress = 100;
  }

  return c.json(result);
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

// ─── GET /:id — Get agent details ─────────────────────────────
// NOTE: Must be after /mine, /executions, /approvals to avoid wildcard conflicts
agentRoutes.get('/:id', async (c) => {
  const agentId = c.req.param('id');
  const auth = c.get('auth');

  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, category, system_prompt, model, required_connectors, optional_connectors, status, creator_id, avg_rating, review_count, pricing_model, price_cents, per_use_price_cents, tags, created_at')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Only allow creator or published agents
  if (agent.status !== 'published' && agent.creator_id !== auth.userId) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Don't expose system_prompt to non-creators
  if (agent.creator_id !== auth.userId) {
    agent.system_prompt = '';
  }

  return c.json({ agent });
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
