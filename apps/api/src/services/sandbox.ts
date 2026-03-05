import { supabaseAdmin } from '../lib/supabase.js';
import { executeAgent, type ExecutionContext } from './agent-runtime.js';
import type { PlanTier } from '@agentspark/shared';

interface SandboxOptions {
  agentId: string;
  userId: string;
  orgId: string;
  input: string;
}

/**
 * Run an agent in sandbox mode for testing before renting.
 * - Uses a synthetic "sandbox" rental with no real connections
 * - Limited to 3 iterations (sandbox guardrail)
 * - Does not log to rental/execution billing
 */
export async function runSandbox(options: SandboxOptions): Promise<{
  executionId: string;
}> {
  const { agentId, userId, orgId, input } = options;

  // Fetch agent
  const { data: agent, error } = await supabaseAdmin
    .from('agents')
    .select('id, system_prompt, model, required_connectors, optional_connectors, status')
    .eq('id', agentId)
    .single();

  if (error || !agent) {
    throw new Error('Agent not found');
  }

  if (agent.status !== 'published') {
    // Allow creators to sandbox their own draft agents
    const { data: profile } = await supabaseAdmin
      .from('agents')
      .select('creator_id')
      .eq('id', agentId)
      .single();

    if (!profile || profile.creator_id !== userId) {
      throw new Error('Agent is not published');
    }
  }

  // Create a sandbox execution record
  const { data: execution, error: execError } = await supabaseAdmin
    .from('agent_executions')
    .insert({
      agent_id: agentId,
      org_id: orgId,
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
    throw new Error('Failed to create sandbox execution');
  }

  // Build sandbox execution context
  // Sandbox mode: no real connections, free plan guardrails
  const ctx: ExecutionContext = {
    executionId: execution.id,
    agent: {
      id: agent.id,
      system_prompt: agent.system_prompt +
        '\n\n[SANDBOX MODE] This is a test environment. Tool calls will be simulated. Do not perform real actions.',
      model: agent.model,
      required_connectors: [], // No real connectors in sandbox
      optional_connectors: [],
    },
    rental: {
      id: 'sandbox',
      allowed_connection_ids: [],
    },
    orgId,
    plan: 'free' as PlanTier, // Sandbox uses free tier limits
    connections: [],
    userInput: input,
  };

  // Execute async (fire and forget — status tracked via Socket.io)
  executeAgent(ctx).catch((err) => {
    console.error(`[sandbox] Execution ${execution.id} failed:`, err);
  });

  return { executionId: execution.id };
}
