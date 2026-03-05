import { supabaseAdmin } from '../lib/supabase.js';
import { PLATFORM_FEE_PERCENTAGE } from '@agentspark/shared';
import type { ToolResult } from '../connectors/interface.js';
import { emitToOrg, emitToCreator, SocketEvents } from '../realtime/socket.js';
import { incrementA2AUsage } from '../services/billing-engine.js';

// ─── Types ──────────────────────────────────────────────────────

export interface A2ACallContext {
  callerAgentId: string;
  callerExecutionId: string;
  callerOrgId: string;
  callerPlan: string;
}

interface DiscoverInput {
  query: string;
  max_results?: number;
}

interface DelegateInput {
  agent_id: string;
  task: string;
  context?: Record<string, unknown>;
}

// ─── Discover Agents ────────────────────────────────────────────

export async function discoverAgents(input: DiscoverInput): Promise<ToolResult> {
  const maxResults = input.max_results ?? 5;

  // Text search via ilike (Pinecone semantic search to be added in future)
  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, category, tags, avg_rating, a2a_call_price_cents, total_a2a_calls')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .or(`name.ilike.%${input.query}%,description.ilike.%${input.query}%,tags.cs.{${input.query}}`)
    .order('avg_rating', { ascending: false })
    .limit(maxResults);

  if (error) {
    return { success: false, error: `Discovery failed: ${error.message}` };
  }

  if (!agents || agents.length === 0) {
    return {
      success: true,
      data: {
        agents: [],
        message: `No agents found matching "${input.query}". Try a broader search.`,
      },
    };
  }

  return {
    success: true,
    data: {
      agents: agents.map((a) => ({
        agent_id: a.id,
        name: a.name,
        slug: a.slug,
        description: a.description,
        category: a.category,
        rating: a.avg_rating,
        price_per_call_cents: a.a2a_call_price_cents,
        total_calls: a.total_a2a_calls,
      })),
      count: agents.length,
    },
  };
}

// ─── Delegate to Agent ──────────────────────────────────────────

export async function delegateToAgent(
  input: DelegateInput,
  ctx: A2ACallContext
): Promise<ToolResult> {
  const startTime = Date.now();

  // Fetch target agent
  const { data: targetAgent } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, system_prompt, model, creator_id, a2a_call_price_cents, required_connectors, optional_connectors')
    .eq('id', input.agent_id)
    .eq('status', 'published')
    .single();

  if (!targetAgent) {
    return { success: false, error: `Agent not found or not published: ${input.agent_id}` };
  }

  // Calculate billing
  const costCents = targetAgent.a2a_call_price_cents ?? 1;
  const platformFeeCents = Math.round(costCents * PLATFORM_FEE_PERCENTAGE);
  const creatorEarningCents = costCents - platformFeeCents;

  // Create A2A call record
  const { data: a2aCall, error: insertError } = await supabaseAdmin
    .from('a2a_calls')
    .insert({
      caller_agent_id: ctx.callerAgentId,
      caller_execution_id: ctx.callerExecutionId,
      caller_org_id: ctx.callerOrgId,
      target_agent_id: targetAgent.id,
      task_description: input.task,
      input_payload: input.context ?? {},
      status: 'running',
      cost_cents: costCents,
      platform_fee_cents: platformFeeCents,
      creator_earning_cents: creatorEarningCents,
    })
    .select('id')
    .single();

  if (insertError || !a2aCall) {
    return { success: false, error: 'Failed to create A2A call record' };
  }

  // Emit A2A call started
  emitToOrg(ctx.callerOrgId, SocketEvents.A2A_CALL_STARTED, {
    a2aCallId: a2aCall.id,
    callerAgentId: ctx.callerAgentId,
    targetAgentId: targetAgent.id,
    targetAgentName: targetAgent.name,
    task: input.task,
    executionId: ctx.callerExecutionId,
  });

  try {
    // Execute the target agent inline (synchronous A2A call)
    const result = await executeA2ATask(targetAgent, input.task, input.context, ctx.callerOrgId);

    const durationMs = Date.now() - startTime;

    // Update A2A call record
    await supabaseAdmin
      .from('a2a_calls')
      .update({
        status: 'completed',
        output_payload: result,
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', a2aCall.id);

    // Record creator earning
    await supabaseAdmin.from('creator_earnings').insert({
      creator_id: targetAgent.creator_id,
      source: 'a2a_call',
      source_id: a2aCall.id,
      agent_id: targetAgent.id,
      gross_amount_cents: costCents,
      platform_fee_cents: platformFeeCents,
      net_amount_cents: creatorEarningCents,
      payout_status: 'pending',
    });

    // Increment A2A usage for the org
    await incrementA2AUsage(ctx.callerOrgId);

    // Increment total_a2a_calls on the target agent
    const { data: agentStats } = await supabaseAdmin
      .from('agents')
      .select('total_a2a_calls')
      .eq('id', targetAgent.id)
      .single();

    if (agentStats) {
      await supabaseAdmin
        .from('agents')
        .update({ total_a2a_calls: (agentStats.total_a2a_calls ?? 0) + 1 })
        .eq('id', targetAgent.id);
    }

    // Emit A2A call completed
    emitToOrg(ctx.callerOrgId, SocketEvents.A2A_CALL_COMPLETED, {
      a2aCallId: a2aCall.id,
      callerAgentId: ctx.callerAgentId,
      targetAgentId: targetAgent.id,
      targetAgentName: targetAgent.name,
      status: 'completed',
      durationMs,
      executionId: ctx.callerExecutionId,
    });

    // Emit earning notification to creator
    emitToCreator(targetAgent.creator_id, SocketEvents.EARNING_RECEIVED, {
      source: 'a2a_call',
      agentName: targetAgent.name,
      netAmountCents: creatorEarningCents,
    });

    return {
      success: true,
      data: {
        agent_name: targetAgent.name,
        result,
        cost_cents: costCents,
        duration_ms: durationMs,
      },
    };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'A2A call failed';

    // Update A2A call as failed
    await supabaseAdmin
      .from('a2a_calls')
      .update({
        status: 'failed',
        output_payload: { error: errorMessage },
        duration_ms: durationMs,
        completed_at: new Date().toISOString(),
      })
      .eq('id', a2aCall.id);

    // Emit failure
    emitToOrg(ctx.callerOrgId, SocketEvents.A2A_CALL_COMPLETED, {
      a2aCallId: a2aCall.id,
      callerAgentId: ctx.callerAgentId,
      targetAgentId: targetAgent.id,
      status: 'failed',
      error: errorMessage,
      executionId: ctx.callerExecutionId,
    });

    return { success: false, error: `A2A call to ${targetAgent.name} failed: ${errorMessage}` };
  }
}

// ─── Execute A2A Task (target agent execution) ──────────────────

async function executeA2ATask(
  targetAgent: {
    id: string;
    system_prompt: string;
    model: string;
    required_connectors: string[] | null;
    optional_connectors: string[] | null;
  },
  task: string,
  context: Record<string, unknown> | undefined,
  callerOrgId: string
): Promise<Record<string, unknown>> {
  // Build prompt for the target agent
  const prompt = context
    ? `${task}\n\nContext: ${JSON.stringify(context)}`
    : task;

  // Simple single-turn execution for A2A calls (no agentic loop to avoid recursion complexity)
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic();

  const a2aSystemPrompt = `${targetAgent.system_prompt}\n\n[A2A MODE] You are being called by another agent. Complete the requested task and return your result concisely.`;

  const response = await anthropic.messages.create({
    model: targetAgent.model,
    max_tokens: 2048,
    system: a2aSystemPrompt,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as unknown as { text: string }).text)
    .join('\n');

  return {
    text: textContent,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens,
  };
}

// ─── Agent Card Generator ───────────────────────────────────────

export function generateAgentCard(agent: {
  id: string;
  name: string;
  slug: string;
  description: string;
  version?: string;
  creator_id: string;
  tags?: string[];
  a2a_call_price_cents: number;
  avg_rating: number;
  total_a2a_calls: number;
  capabilities?: Array<{
    skill_id: string;
    name: string;
    description: string;
    input_schema?: Record<string, unknown>;
    output_schema?: Record<string, unknown>;
  }>;
}) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

  return {
    name: agent.name,
    description: agent.description,
    url: `${apiUrl}/api/a2a/agents/${agent.slug}`,
    version: agent.version ?? '1.0.0',
    capabilities: {
      streaming: true,
      pushNotifications: false,
    },
    skills: (agent.capabilities ?? []).map((cap) => ({
      id: cap.skill_id,
      name: cap.name,
      description: cap.description,
      tags: agent.tags ?? [],
      inputSchema: cap.input_schema ?? {},
      outputSchema: cap.output_schema ?? {},
    })),
    authentication: {
      schemes: ['platform_token'],
    },
    pricing: {
      perCallCents: agent.a2a_call_price_cents,
    },
    agentId: agent.id,
    creatorId: agent.creator_id,
    rating: agent.avg_rating,
    totalCalls: agent.total_a2a_calls,
  };
}
