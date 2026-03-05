import { supabaseAdmin } from '../lib/supabase.js';

// ─── Types ──────────────────────────────────────────────────────

export interface AssemblyRequest {
  prompt: string;
  orgId: string;
  userId: string;
}

export interface IntentAnalysis {
  workflow_summary: string;
  capabilities_needed: string[];
  connectors_needed: string[];
  agent_count_hint: number;
}

export interface RecommendedAgent {
  agent_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rating: number;
  price_per_call_cents: number;
  total_calls: number;
  match_reason: string;
  already_rented: boolean;
}

export interface AssemblyResult {
  workflow_summary: string;
  recommended_agents: RecommendedAgent[];
  total_cost_cents: number;
  capabilities_covered: string[];
  connectors_needed: string[];
}

// ─── Pass 1: Intent Analysis ────────────────────────────────────

const INTENT_SYSTEM_PROMPT = `You are an AI workflow planning assistant for Agent Spark, an AI agent marketplace.

Given a user's natural-language description of what they want to automate, analyze their intent and extract:

1. workflow_summary: A concise 1-2 sentence summary of the workflow
2. capabilities_needed: Array of capability keywords (e.g., "email_automation", "data_analysis", "code_review", "social_media", "customer_support", "shopify", "slack_integration")
3. connectors_needed: Array of specific service connectors needed (e.g., "shopify", "gmail", "slack", "github", "stripe")
4. agent_count_hint: Estimated number of agents needed (1-5)

Respond with ONLY valid JSON, no markdown fences or extra text.`;

async function analyzeIntent(prompt: string): Promise<IntentAnalysis> {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: INTENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('');

  try {
    return JSON.parse(text) as IntentAnalysis;
  } catch {
    return {
      workflow_summary: prompt,
      capabilities_needed: [],
      connectors_needed: [],
      agent_count_hint: 3,
    };
  }
}

// ─── Pass 2: Agent Selection ────────────────────────────────────

const SELECTION_SYSTEM_PROMPT = `You are an AI agent team selector for Agent Spark marketplace.

Given:
- A workflow intent analysis (capabilities needed, connectors needed)
- A list of available agents from the marketplace

Select the best team of agents to fulfill the workflow. For each selected agent, provide a brief match_reason explaining why it's a good fit.

Respond with ONLY a JSON array of objects, each with:
- agent_id: the agent's ID
- match_reason: 1-sentence explanation of why this agent fits

Select only the agents that are truly needed. Do not select more than the agent_count_hint suggests unless necessary.
Respond with ONLY valid JSON, no markdown fences or extra text.`;

interface AgentSelection {
  agent_id: string;
  match_reason: string;
}

async function selectAgents(
  intent: IntentAnalysis,
  candidateAgents: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    tags: string[] | null;
    avg_rating: number;
    a2a_call_price_cents: number;
    total_a2a_calls: number;
  }>
): Promise<AgentSelection[]> {
  if (candidateAgents.length === 0) return [];

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  const agentList = candidateAgents.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    category: a.category,
    tags: a.tags ?? [],
    rating: a.avg_rating,
    price_cents: a.a2a_call_price_cents,
    calls: a.total_a2a_calls,
  }));

  const userMessage = `Intent Analysis:
${JSON.stringify(intent, null, 2)}

Available Agents:
${JSON.stringify(agentList, null, 2)}

Select the best team (up to ${intent.agent_count_hint} agents).`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SELECTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('');

  try {
    return JSON.parse(text) as AgentSelection[];
  } catch {
    // Fallback: return top agents by rating
    return candidateAgents
      .slice(0, intent.agent_count_hint)
      .map((a) => ({ agent_id: a.id, match_reason: 'Top-rated agent in relevant category' }));
  }
}

// ─── Main Assembler ─────────────────────────────────────────────

export async function assembleWorkflow(req: AssemblyRequest): Promise<AssemblyResult> {
  // Pass 1: Analyze user intent
  const intent = await analyzeIntent(req.prompt);

  // Search for candidate agents matching the intent
  const searchTerms = [
    ...intent.capabilities_needed,
    ...intent.connectors_needed,
  ];

  // Build an OR condition for searching agents
  const orConditions = searchTerms.length > 0
    ? searchTerms
        .map((term) => `name.ilike.%${term}%,description.ilike.%${term}%,tags.cs.{${term}}`)
        .join(',')
    : `name.ilike.%${intent.workflow_summary.split(' ').slice(0, 3).join('%')}%`;

  const { data: candidates } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, category, tags, avg_rating, a2a_call_price_cents, total_a2a_calls')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .or(orConditions)
    .order('avg_rating', { ascending: false })
    .limit(20);

  const candidateAgents = candidates ?? [];

  // Pass 2: AI selects best team
  const selections = await selectAgents(intent, candidateAgents);

  // Get current rentals to mark already-rented agents
  const { data: rentals } = await supabaseAdmin
    .from('agent_rentals')
    .select('agent_id')
    .eq('org_id', req.orgId)
    .eq('status', 'active');

  const rentedIds = new Set((rentals ?? []).map((r) => r.agent_id));

  // Build recommended agents list
  const recommended: RecommendedAgent[] = [];
  let totalCost = 0;

  for (const sel of selections) {
    const agent = candidateAgents.find((a) => a.id === sel.agent_id);
    if (!agent) continue;

    const alreadyRented = rentedIds.has(agent.id);
    recommended.push({
      agent_id: agent.id,
      name: agent.name,
      slug: agent.slug,
      description: agent.description,
      category: agent.category,
      rating: agent.avg_rating,
      price_per_call_cents: agent.a2a_call_price_cents,
      total_calls: agent.total_a2a_calls,
      match_reason: sel.match_reason,
      already_rented: alreadyRented,
    });

    if (!alreadyRented) {
      totalCost += agent.a2a_call_price_cents;
    }
  }

  return {
    workflow_summary: intent.workflow_summary,
    recommended_agents: recommended,
    total_cost_cents: totalCost,
    capabilities_covered: intent.capabilities_needed,
    connectors_needed: intent.connectors_needed,
  };
}

// ─── Save Workflow ──────────────────────────────────────────────

export interface SaveWorkflowInput {
  orgId: string;
  userId: string;
  name: string;
  description?: string;
  agentIds: string[];
  triggerType?: 'manual' | 'schedule' | 'webhook' | 'event';
  triggerConfig?: Record<string, unknown>;
  assembledByAi?: boolean;
  assemblyPrompt?: string;
}

export async function saveWorkflow(input: SaveWorkflowInput) {
  const { data, error } = await supabaseAdmin
    .from('workflows')
    .insert({
      org_id: input.orgId,
      created_by: input.userId,
      name: input.name,
      description: input.description ?? '',
      agent_ids: input.agentIds,
      trigger_type: input.triggerType ?? 'manual',
      trigger_config: input.triggerConfig ?? {},
      assembled_by_ai: input.assembledByAi ?? false,
      assembly_prompt: input.assemblyPrompt,
      status: 'active',
    })
    .select('id, name, status, created_at')
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, workflow: data };
}

// ─── List Workflows ─────────────────────────────────────────────

export async function listWorkflows(orgId: string, page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseAdmin
    .from('workflows')
    .select('id, name, description, agent_ids, trigger_type, status, assembled_by_ai, created_at, updated_at', { count: 'exact' })
    .eq('org_id', orgId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .range(from, to);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return {
    success: true as const,
    workflows: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─── Execute Workflow ───────────────────────────────────────────

export async function executeWorkflow(workflowId: string, orgId: string, userId: string) {
  // Fetch workflow
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('org_id', orgId)
    .single();

  if (!workflow) {
    return { success: false as const, error: 'Workflow not found' };
  }

  if (workflow.status !== 'active') {
    return { success: false as const, error: 'Workflow is not active' };
  }

  const agentIds: string[] = workflow.agent_ids ?? [];
  if (agentIds.length === 0) {
    return { success: false as const, error: 'Workflow has no agents' };
  }

  // Fetch the primary agent with full details for execution context
  const { data: primaryAgent } = await supabaseAdmin
    .from('agents')
    .select('id, name, system_prompt, model, required_connectors, optional_connectors')
    .eq('id', agentIds[0])
    .single();

  if (!primaryAgent) {
    return { success: false as const, error: 'Primary agent not found' };
  }

  // Get the rental for this agent + org
  const { data: rental } = await supabaseAdmin
    .from('agent_rentals')
    .select('id, allowed_connection_ids')
    .eq('agent_id', primaryAgent.id)
    .eq('org_id', orgId)
    .eq('status', 'active')
    .single();

  if (!rental) {
    return { success: false as const, error: 'You must rent the primary agent before executing a workflow' };
  }

  // Get org plan
  const { data: orgData } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  // Get connections
  const { data: connections } = await supabaseAdmin
    .from('connections')
    .select('id, connector_type_id, credential_vault_id, status')
    .eq('org_id', orgId)
    .eq('status', 'active');

  const inputText = `Workflow execution: ${workflow.name}. ${workflow.description ?? ''}\n\nYou have access to ${agentIds.length} agents in this workflow. Use A2A calls to delegate subtasks to other agents as needed.`;

  // Create an execution record
  const { data: execution, error: execError } = await supabaseAdmin
    .from('agent_executions')
    .insert({
      rental_id: rental.id,
      agent_id: primaryAgent.id,
      org_id: orgId,
      input_text: inputText,
      status: 'queued',
      total_tokens: 0,
      total_tool_calls: 0,
      total_a2a_calls: 0,
      cost_cents: 0,
    })
    .select('id')
    .single();

  if (execError || !execution) {
    return { success: false as const, error: 'Failed to create execution' };
  }

  // Enqueue for async execution with full context
  const { enqueueAgentExecution } = await import('../queues/agent-execution.js');
  await enqueueAgentExecution({
    executionId: execution.id,
    agent: {
      id: primaryAgent.id,
      system_prompt: primaryAgent.system_prompt,
      model: primaryAgent.model,
      required_connectors: primaryAgent.required_connectors ?? [],
      optional_connectors: primaryAgent.optional_connectors ?? [],
    },
    rental: {
      id: rental.id,
      allowed_connection_ids: rental.allowed_connection_ids ?? [],
    },
    orgId,
    plan: ((orgData?.plan as string) ?? 'free') as import('@agentspark/shared').PlanTier,
    connections: connections ?? [],
    userInput: inputText,
  });

  return {
    success: true as const,
    execution_id: execution.id,
    primary_agent: primaryAgent.name,
    agent_count: agentIds.length,
  };
}

// ─── Get Workflow Status ────────────────────────────────────────

export async function getWorkflowStatus(workflowId: string, orgId: string) {
  const { data: workflow } = await supabaseAdmin
    .from('workflows')
    .select('id, name, status, agent_ids, trigger_type, created_at, updated_at')
    .eq('id', workflowId)
    .eq('org_id', orgId)
    .single();

  if (!workflow) {
    return { success: false as const, error: 'Workflow not found' };
  }

  // Get recent executions for this workflow's primary agent
  const agentIds: string[] = workflow.agent_ids ?? [];
  const { data: executions } = await supabaseAdmin
    .from('agent_executions')
    .select('id, status, started_at, completed_at, total_tokens, total_tool_calls, total_a2a_calls')
    .in('agent_id', agentIds)
    .eq('org_id', orgId)
    .order('started_at', { ascending: false })
    .limit(5);

  return {
    success: true as const,
    workflow,
    recent_executions: executions ?? [],
  };
}
