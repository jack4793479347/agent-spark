import type { ToolResult } from '../connectors/interface.js';
import { loadConnector, hasConnector } from './connector-manager.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { EXECUTION_LIMITS, type PlanTier } from '@agentspark/shared';
import { selectModel, type RoutingDecision } from './model-router.js';

// ─── Types ──────────────────────────────────────────────────────

export interface ExecutionContext {
  executionId: string;
  agent: {
    id: string;
    system_prompt: string;
    model: string;
    required_connectors: string[];
    optional_connectors: string[];
  };
  rental: {
    id: string;
    allowed_connection_ids: string[];
  };
  orgId: string;
  plan: PlanTier;
  connections: {
    id: string;
    connector_type_id: string;
    credential_vault_id: string;
    status: string;
  }[];
  userInput: string;
}

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface AnthropicToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[] | AnthropicToolResultBlock[];
}

// ─── Emit interface (injected by caller) ────────────────────────

export type EmitFn = (orgId: string, event: string, data: unknown) => void;

let _emitFn: EmitFn = () => {};

export function setEmitFunction(fn: EmitFn): void {
  _emitFn = fn;
}

// ─── Actions that require human approval ────────────────────────

const APPROVAL_REQUIRED_ACTIONS = new Set([
  'gmail__send_email',
  'shopify__process_refund',
  'slack__send_message',
]);

export function requiresApproval(toolName: string, _input: Record<string, unknown>): boolean {
  return APPROVAL_REQUIRED_ACTIONS.has(toolName);
}

// ─── Guardrails ─────────────────────────────────────────────────

function checkGuardrails(
  plan: PlanTier,
  currentIteration: number,
  totalTokens: number,
  a2aCalls: number
): { allowed: boolean; reason?: string } {
  const limits = EXECUTION_LIMITS[plan];

  if (currentIteration >= limits.max_iterations) {
    return { allowed: false, reason: 'Maximum steps reached for your plan. Upgrade for longer workflows.' };
  }
  if (totalTokens >= limits.max_tokens_per_run) {
    return { allowed: false, reason: 'Token limit reached for this execution.' };
  }
  if (a2aCalls >= limits.max_a2a_calls) {
    return { allowed: false, reason: 'A2A call limit reached. Upgrade for more agent collaboration.' };
  }
  return { allowed: true };
}

// ─── Tool gathering ─────────────────────────────────────────────

export async function gatherConnectorTools(
  requiredConnectors: string[],
  orgConnections: ExecutionContext['connections'],
  allowedConnectionIds: string[]
): Promise<AnthropicTool[]> {
  const tools: AnthropicTool[] = [];

  for (const connectorId of requiredConnectors) {
    if (!hasConnector(connectorId)) continue;

    const connection = orgConnections.find(
      (c) =>
        c.connector_type_id === connectorId &&
        allowedConnectionIds.includes(c.id) &&
        c.status === 'active'
    );

    if (!connection) continue;

    const connector = loadConnector(connectorId);
    const connectorTools = connector.getTools();

    for (const tool of connectorTools) {
      tools.push({
        name: `${connectorId}__${tool.name}`,
        description: tool.description,
        input_schema: tool.input_schema,
      });
    }
  }

  return tools;
}

// ─── A2A Orchestration ──────────────────────────────────────────

import { discoverAgents, delegateToAgent, type A2ACallContext } from '../connectors/a2a-orchestrator.js';
import { buildRAGSystemPrompt } from './knowledge-base.js';

function getA2AOrchestratorTools(): AnthropicTool[] {
  return [
    {
      name: 'discover_agents',
      description: 'Search the Agent Spark marketplace for agents with specific capabilities. Returns a list of matching agents with their pricing and ratings.',
      input_schema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Describe what you need another agent to do, e.g., "process Shopify refunds" or "analyze spreadsheet data"',
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of agents to return (default: 5)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'delegate_to_agent',
      description: 'Send a task to another agent on the platform. The target agent will execute the task using its own capabilities and return the result.',
      input_schema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            description: 'The ID of the agent to delegate to (from discover_agents results)',
          },
          task: {
            type: 'string',
            description: 'Clear description of what you need the target agent to do',
          },
          context: {
            type: 'object',
            description: 'Any relevant data the target agent needs to complete the task',
          },
        },
        required: ['agent_id', 'task'],
      },
    },
  ];
}

async function handleA2AToolCall(
  toolCall: AnthropicToolUseBlock,
  ctx: ExecutionContext
): Promise<ToolResult> {
  const a2aCtx: A2ACallContext = {
    callerAgentId: ctx.agent.id,
    callerExecutionId: ctx.executionId,
    callerOrgId: ctx.orgId,
    callerPlan: ctx.plan,
  };

  if (toolCall.name === 'discover_agents') {
    return discoverAgents(toolCall.input as { query: string; max_results?: number });
  }

  if (toolCall.name === 'delegate_to_agent') {
    return delegateToAgent(
      toolCall.input as { agent_id: string; task: string; context?: Record<string, unknown> },
      a2aCtx
    );
  }

  return { success: false, error: `Unknown A2A tool: ${toolCall.name}` };
}

// ─── Connector tool execution ───────────────────────────────────

async function handleConnectorToolCall(
  toolCall: AnthropicToolUseBlock,
  connections: ExecutionContext['connections'],
  rental: ExecutionContext['rental'],
  executionId: string,
  orgId: string,
  agentId: string
): Promise<ToolResult> {
  // Parse namespaced tool name: "gmail__send_email" → ["gmail", "send_email"]
  const separatorIndex = toolCall.name.indexOf('__');
  if (separatorIndex === -1) {
    return { success: false, error: `Invalid tool name format: ${toolCall.name}` };
  }

  const connectorId = toolCall.name.slice(0, separatorIndex);
  const toolName = toolCall.name.slice(separatorIndex + 2);

  if (!hasConnector(connectorId)) {
    return { success: false, error: `Unknown connector: ${connectorId}` };
  }

  const connection = connections.find(
    (c) =>
      c.connector_type_id === connectorId &&
      rental.allowed_connection_ids.includes(c.id) &&
      c.status === 'active'
  );

  if (!connection) {
    return { success: false, error: `No active connection for ${connectorId}` };
  }

  const connector = loadConnector(connectorId);
  return connector.executeTool(toolName, toolCall.input, connection.credential_vault_id, {
    executionId,
    orgId,
    agentId,
  });
}

// ─── Execution logging ──────────────────────────────────────────

async function logExecutionStep(
  executionId: string,
  step: {
    tool_name?: string;
    input?: unknown;
    output?: unknown;
    text?: string;
    duration_ms?: number;
    type: 'tool_call' | 'text' | 'approval_pause';
  }
): Promise<void> {
  // Append step to the steps JSONB array
  const { data: execution } = await supabaseAdmin
    .from('agent_executions')
    .select('steps')
    .eq('id', executionId)
    .single();

  const steps = (execution?.steps as Record<string, unknown>[]) ?? [];
  steps.push({ ...step, timestamp: new Date().toISOString() });

  await supabaseAdmin
    .from('agent_executions')
    .update({ steps })
    .eq('id', executionId);
}

async function updateExecutionMetrics(
  executionId: string,
  metrics: {
    total_tokens?: number;
    total_tool_calls?: number;
    total_a2a_calls?: number;
  }
): Promise<void> {
  await supabaseAdmin
    .from('agent_executions')
    .update(metrics)
    .eq('id', executionId);
}

export async function completeExecution(
  executionId: string,
  result: { result?: string; error?: string }
): Promise<void> {
  const status = result.error ? 'failed' : 'completed';
  await supabaseAdmin
    .from('agent_executions')
    .update({
      status,
      result: result.result ? { text: result.result } : undefined,
      error: result.error,
      completed_at: new Date().toISOString(),
    })
    .eq('id', executionId);
}

function emitAgentActivity(
  orgId: string,
  executionId: string,
  event: string,
  data: unknown
): void {
  _emitFn(orgId, event, { executionId, ...data as Record<string, unknown> });
}

// ─── Approval system ────────────────────────────────────────────

async function pauseForApproval(
  ctx: ExecutionContext,
  toolCall: AnthropicToolUseBlock,
  messages: AnthropicMessage[]
): Promise<void> {
  // Update execution status
  await supabaseAdmin
    .from('agent_executions')
    .update({
      status: 'awaiting_approval',
      result: { paused_messages: messages, paused_tool_call: toolCall },
    })
    .eq('id', ctx.executionId);

  // Create approval queue entry
  await supabaseAdmin.from('approval_queue').insert({
    execution_id: ctx.executionId,
    org_id: ctx.orgId,
    action_type: toolCall.name,
    action_details: toolCall.input,
    status: 'pending',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  // Emit approval event
  emitAgentActivity(ctx.orgId, ctx.executionId, 'agent:approval', {
    action_type: toolCall.name,
    action_details: toolCall.input,
  });
}

// ─── Resume after approval ──────────────────────────────────────

export async function resumeAfterApproval(
  executionId: string,
  approved: boolean
): Promise<void> {
  if (!approved) {
    await completeExecution(executionId, { error: 'Action rejected by user' });

    const { data: exec } = await supabaseAdmin
      .from('agent_executions')
      .select('org_id')
      .eq('id', executionId)
      .single();

    if (exec) {
      emitAgentActivity(exec.org_id, executionId, 'agent:error', {
        error: 'Action rejected by user',
      });
    }
    return;
  }

  // Fetch the paused execution
  const { data: execution } = await supabaseAdmin
    .from('agent_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (!execution) return;

  const resultData = execution.result as Record<string, unknown> | null;
  const pausedMessages = resultData?.paused_messages as AnthropicMessage[] | undefined;
  const pausedToolCall = resultData?.paused_tool_call as AnthropicToolUseBlock | undefined;

  if (!pausedMessages || !pausedToolCall) {
    await completeExecution(executionId, { error: 'Cannot resume: missing paused state' });
    return;
  }

  // Get rental and agent data
  const { data: rental } = await supabaseAdmin
    .from('rentals')
    .select('*')
    .eq('id', execution.rental_id)
    .single();

  const { data: agent } = await supabaseAdmin
    .from('agents')
    .select('*')
    .eq('id', execution.agent_id)
    .single();

  if (!rental || !agent) {
    await completeExecution(executionId, { error: 'Cannot resume: missing rental or agent' });
    return;
  }

  // Get org connections
  const { data: connections } = await supabaseAdmin
    .from('connections')
    .select('id, connector_type_id, credential_vault_id, status')
    .eq('org_id', execution.org_id)
    .eq('status', 'active');

  // Get org plan
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('plan')
    .eq('id', execution.org_id)
    .single();

  // Execute the approved tool call
  const toolResult = await handleConnectorToolCall(
    pausedToolCall,
    connections ?? [],
    { id: rental.id, allowed_connection_ids: rental.allowed_connection_ids ?? [] },
    executionId,
    execution.org_id,
    execution.agent_id
  );

  const ctx: ExecutionContext = {
    executionId,
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
    orgId: execution.org_id,
    plan: (org?.plan as PlanTier) ?? 'free',
    connections: connections ?? [],
    userInput: execution.input_text,
  };

  // Update status back to running
  await supabaseAdmin
    .from('agent_executions')
    .update({ status: 'running', result: null })
    .eq('id', executionId);

  // Build resumed messages with tool result
  const resumedMessages: AnthropicMessage[] = [
    ...pausedMessages,
    {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: pausedToolCall.id,
          content: JSON.stringify(toolResult),
        },
      ],
    },
  ];

  await executeAgentLoop(ctx, resumedMessages, execution.total_tokens ?? 0, execution.total_tool_calls ?? 0, execution.total_a2a_calls ?? 0);
}

// ─── Core agentic loop ──────────────────────────────────────────

async function executeAgentLoop(
  ctx: ExecutionContext,
  messages: AnthropicMessage[],
  totalTokens: number,
  totalToolCalls: number,
  totalA2ACalls: number
): Promise<void> {
  const { agent, orgId } = ctx;

  // Gather tools
  const connectorTools = await gatherConnectorTools(
    agent.required_connectors,
    ctx.connections,
    ctx.rental.allowed_connection_ids
  );
  const a2aTools = getA2AOrchestratorTools();
  const allTools: AnthropicTool[] = [...connectorTools, ...a2aTools];

  // Smart Model Routing — classify task and pick optimal model
  let routing: RoutingDecision | null = null;
  try {
    const toolNames = allTools.map((t) => t.name);
    routing = await selectModel(ctx.userInput, toolNames);
  } catch {
    // Fallback to agent's configured model if router fails
  }
  const selectedModel = routing?.model ?? agent.model;

  // RAG: retrieve relevant knowledge chunks and augment system prompt
  let systemPromptText = agent.system_prompt;
  try {
    systemPromptText = await buildRAGSystemPrompt(agent.system_prompt, agent.id, ctx.userInput);
  } catch (err) {
    // If RAG fails (no VOYAGE_API_KEY, no chunks, etc.), fall back to base prompt
    console.warn('RAG retrieval skipped:', err instanceof Error ? err.message : err);
  }

  // Prompt caching — wrap system prompt with cache_control
  const cachedSystemPrompt = [
    {
      type: 'text' as const,
      text: systemPromptText,
      cache_control: { type: 'ephemeral' as const },
    },
  ];

  let iterationCount = 0;

  while (true) {
    iterationCount++;

    // Check guardrails
    const guardrail = checkGuardrails(ctx.plan, iterationCount, totalTokens, totalA2ACalls);
    if (!guardrail.allowed) {
      await logExecutionStep(ctx.executionId, {
        type: 'text',
        text: guardrail.reason,
      });
      await completeExecution(ctx.executionId, { error: guardrail.reason });
      emitAgentActivity(orgId, ctx.executionId, 'agent:error', { error: guardrail.reason });
      return;
    }

    // Call Claude with routed model + prompt caching
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic();

    const response = await anthropic.messages.create({
      model: selectedModel,
      max_tokens: 4096,
      system: cachedSystemPrompt,
      tools: allTools,
      messages: messages as Parameters<typeof anthropic.messages.create>[0]['messages'],
    }) as unknown as AnthropicResponse;

    // Track tokens
    totalTokens += response.usage.input_tokens + response.usage.output_tokens;
    await updateExecutionMetrics(ctx.executionId, { total_tokens: totalTokens });

    // Emit activity
    emitAgentActivity(orgId, ctx.executionId, 'agent:activity', {
      step: iterationCount,
      content: response.content,
      stop_reason: response.stop_reason,
    });

    // If no tool use, agent is done
    if (response.stop_reason === 'end_turn') {
      const finalText = response.content
        .filter((b): b is AnthropicTextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      await logExecutionStep(ctx.executionId, { type: 'text', text: finalText });
      await completeExecution(ctx.executionId, { result: finalText });
      emitAgentActivity(orgId, ctx.executionId, 'agent:completed', { result: finalText });
      return;
    }

    // Process tool calls
    if (response.stop_reason === 'tool_use') {
      const toolBlocks = response.content.filter(
        (b): b is AnthropicToolUseBlock => b.type === 'tool_use'
      );

      const toolResults: AnthropicToolResultBlock[] = [];

      for (const toolCall of toolBlocks) {
        const startTime = Date.now();

        // Check if action needs approval
        if (requiresApproval(toolCall.name, toolCall.input)) {
          messages.push({ role: 'assistant', content: response.content });

          await logExecutionStep(ctx.executionId, {
            type: 'approval_pause',
            tool_name: toolCall.name,
            input: toolCall.input,
          });

          await pauseForApproval(ctx, toolCall, messages);
          return;
        }

        let result: ToolResult;

        if (toolCall.name === 'delegate_to_agent' || toolCall.name === 'discover_agents') {
          result = await handleA2AToolCall(toolCall, ctx);
          totalA2ACalls++;
        } else {
          result = await handleConnectorToolCall(
            toolCall, ctx.connections, ctx.rental,
            ctx.executionId, orgId, agent.id
          );
        }

        totalToolCalls++;
        const durationMs = Date.now() - startTime;

        await logExecutionStep(ctx.executionId, {
          type: 'tool_call',
          tool_name: toolCall.name,
          input: toolCall.input,
          output: result,
          duration_ms: durationMs,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      await updateExecutionMetrics(ctx.executionId, {
        total_tool_calls: totalToolCalls,
        total_a2a_calls: totalA2ACalls,
      });

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }
}

// ─── Public entry point ─────────────────────────────────────────

export async function executeAgent(ctx: ExecutionContext): Promise<void> {
  try {
    await supabaseAdmin
      .from('agent_executions')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', ctx.executionId);

    emitAgentActivity(ctx.orgId, ctx.executionId, 'agent:activity', {
      step: 0,
      status: 'running',
      message: 'Agent starting...',
    });

    const messages: AnthropicMessage[] = [
      { role: 'user', content: ctx.userInput },
    ];

    await executeAgentLoop(ctx, messages, 0, 0, 0);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await completeExecution(ctx.executionId, { error: errorMessage });
    emitAgentActivity(ctx.orgId, ctx.executionId, 'agent:error', { error: errorMessage });
  }
}
