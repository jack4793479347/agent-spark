import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUsageAllowance, incrementTaskUsage } from '@/lib/billing/engine';
import { checkRateLimit, rateLimitKey } from '@/lib/api/rate-limit';
import { getComposio, CONNECTOR_TO_TOOLKIT, composioUserId } from '@/lib/composio/client';
import { getAgentEmailTools, sendAgentEmail, getAgentEmails, agentEmailAddress } from '@/lib/email/agent-mail';
import Anthropic from '@anthropic-ai/sdk';

const EMAIL_TOOL_NAMES = new Set(['send_email', 'check_inbox']);

// POST /api/agents/:id/execute — run an agent execution with full tool loop
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const rl = checkRateLimit(rateLimitKey(auth.user.id, 'execute'), 30);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const usage = await checkUsageAllowance(auth.orgId);
  if (!usage.allowed) return NextResponse.json({ error: 'Usage limit exceeded. Upgrade your plan.' }, { status: 402 });

  const { input } = await request.json();
  if (!input) return NextResponse.json({ error: 'input required' }, { status: 400 });

  const sb = createAdminClient();

  // Get agent
  const { data: agent } = await sb
    .from('agents')
    .select('name, slug, system_prompt, model, creator_id, required_connectors, optional_connectors')
    .eq('id', params.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Create execution record
  const { data: execution, error: insertError } = await sb
    .from('agent_executions')
    .insert({
      agent_id: params.id,
      org_id: auth.orgId,
      input_text: input,
      status: 'running',
    })
    .select('id')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Gather Composio tools
  const connectorIds = [
    ...(agent.required_connectors || []),
    ...(agent.optional_connectors || []),
  ];

  const toolkits = connectorIds
    .map((id: string) => CONNECTOR_TO_TOOLKIT[id])
    .filter(Boolean);

  let composioTools: Anthropic.Messages.Tool[] = [];
  let session: Awaited<ReturnType<ReturnType<typeof getComposio>['create']>> | null = null;

  if (toolkits.length > 0 && process.env.COMPOSIO_API_KEY) {
    try {
      const composio = getComposio();
      const userId = composioUserId(auth.orgId);
      session = await composio.create(userId, {
        toolkits,
        manageConnections: false,
      });
      composioTools = await session.tools() as Anthropic.Messages.Tool[];
    } catch (e) {
      console.error('Composio tools error:', e);
    }
  }

  // Add agent email tools
  const emailTools = agent.slug
    ? getAgentEmailTools(agent.name, agent.slug) as Anthropic.Messages.Tool[]
    : [];

  const allTools = [...composioTools, ...emailTools];
  const hasTools = allTools.length > 0;

  // Helper: execute an agent email tool call
  async function executeEmailTool(name: string, toolInput: Record<string, unknown>): Promise<string> {
    if (name === 'send_email') {
      const result = await sendAgentEmail({
        agentId: params.id,
        agentName: agent!.name,
        agentSlug: agent!.slug,
        to: toolInput.to as string,
        subject: toolInput.subject as string,
        body: toolInput.body as string,
      });
      return JSON.stringify({ success: true, id: result.id, from: result.from });
    }
    if (name === 'check_inbox') {
      const emails = await getAgentEmails(params.id, (toolInput.limit as number) || 10);
      return JSON.stringify({ emails: emails.map((e: any) => ({
        direction: e.direction,
        from: e.from_address,
        to: e.to_address,
        subject: e.subject,
        body: e.body?.slice(0, 500),
        date: e.created_at,
      }))});
    }
    return JSON.stringify({ error: 'Unknown email tool' });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: input },
    ];

    const maxIterations = 15;
    let finalText = '';
    const toolCalls: Array<{ tool: string; input: unknown; output: string }> = [];

    const systemPrompt = agent.system_prompt +
      (agent.slug ? `\n\nYour email address is ${agentEmailAddress(agent.slug)}. You can send emails from this address and check your inbox.` : '');

    for (let i = 0; i < maxIterations; i++) {
      const response = await anthropic.messages.create({
        model: agent.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
        ...(hasTools ? { tools: allTools } : {}),
      });

      const textBlocks = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text);

      if (textBlocks.length > 0) {
        finalText += textBlocks.join('');
      }

      if (response.stop_reason !== 'tool_use') break;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) break;

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        try {
          let result: string;

          if (EMAIL_TOOL_NAMES.has(toolUse.name)) {
            result = await executeEmailTool(toolUse.name, toolUse.input as Record<string, unknown>);
          } else if (session) {
            const composio = getComposio();
            result = await composio.provider.executeToolCall(
              composioUserId(auth.orgId),
              toolUse as any,
            );
          } else {
            result = JSON.stringify({ error: 'Tool not available' });
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          });
          toolCalls.push({ tool: toolUse.name, input: toolUse.input, output: result });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Tool execution failed';
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${errMsg}`,
            is_error: true,
          });
          toolCalls.push({ tool: toolUse.name, input: toolUse.input, output: `Error: ${errMsg}` });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }

    // Update execution record with result
    await sb
      .from('agent_executions')
      .update({
        status: 'completed',
        output_text: finalText,
        tool_calls: toolCalls,
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    // Increment usage and total_a2a_calls
    await incrementTaskUsage(auth.orgId);
    await sb.rpc('increment_agent_calls', { p_agent_id: params.id });

    return NextResponse.json({
      execution_id: execution.id,
      status: 'completed',
      result: { text: finalText, tool_calls: toolCalls },
    });
  } catch (e) {
    console.error('Execute error:', e);

    await sb
      .from('agent_executions')
      .update({
        status: 'failed',
        output_text: e instanceof Error ? e.message : 'Execution failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);

    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Execution failed' },
      { status: 500 }
    );
  }
}
