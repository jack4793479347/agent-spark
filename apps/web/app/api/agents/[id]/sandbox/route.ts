import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUsageAllowance, incrementTaskUsage } from '@/lib/billing/engine';
import { checkRateLimit, rateLimitKey } from '@/lib/api/rate-limit';
import { getComposio, CONNECTOR_TO_TOOLKIT, composioUserId } from '@/lib/composio/client';
import { getAgentEmailTools, sendAgentEmail, getAgentEmails, agentEmailAddress } from '@/lib/email/agent-mail';
import Anthropic from '@anthropic-ai/sdk';

// ── Search knowledge for context ─────────────────────────────

async function getKnowledgeContext(agentId: string, query: string): Promise<string> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  if (!voyageKey) return '';

  const sb = createAdminClient();

  try {
    const embRes = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageKey}`,
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: [query],
        input_type: 'query',
      }),
    });

    if (!embRes.ok) return '';
    const embData = await embRes.json();
    const queryEmbedding = embData.data[0].embedding;

    const { data: chunks } = await sb.rpc('search_knowledge_chunks', {
      p_agent_id: agentId,
      p_embedding: JSON.stringify(queryEmbedding),
      p_limit: 8,
      p_threshold: 0.3,
    });

    if (!chunks || chunks.length === 0) return '';

    return '\n\n--- KNOWLEDGE BASE CONTEXT ---\n' +
      chunks.map((c: { content: string; source_filename: string }) =>
        `[Source: ${c.source_filename}]\n${c.content}`
      ).join('\n\n') +
      '\n--- END CONTEXT ---';
  } catch (e) {
    console.error('Knowledge search error:', e);
    return '';
  }
}

// POST /api/agents/:id/sandbox — test run agent with tools
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!auth.orgId) return NextResponse.json({ error: 'No organization' }, { status: 403 });

  const rl = checkRateLimit(rateLimitKey(auth.user.id, 'sandbox'), 10);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const usage = await checkUsageAllowance(auth.orgId);
  if (!usage.allowed) return NextResponse.json({ error: 'Usage limit exceeded. Upgrade your plan.' }, { status: 402 });

  const { input } = await request.json();
  if (!input) return NextResponse.json({ error: 'input required' }, { status: 400 });

  const sb = createAdminClient();

  // Get agent with connector info
  const { data: agent } = await sb
    .from('agents')
    .select('name, slug, system_prompt, model, creator_id, required_connectors, optional_connectors')
    .eq('id', params.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  // Get relevant knowledge context
  const knowledgeContext = await getKnowledgeContext(params.id, input);
  const systemPrompt = agent.system_prompt + knowledgeContext;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Gather Composio tools if the agent has connectors configured
  const connectorIds = [
    ...(agent.required_connectors || []),
    ...(agent.optional_connectors || []),
  ];

  const toolkits = connectorIds
    .map((id: string) => CONNECTOR_TO_TOOLKIT[id])
    .filter(Boolean);

  // Build all available tools
  let composioTools: Anthropic.Messages.Tool[] = [];
  let session: Awaited<ReturnType<ReturnType<typeof getComposio>['create']>> | null = null;
  const EMAIL_TOOL_NAMES = new Set(['send_email', 'check_inbox']);

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

  // Add agent email tools (every agent gets its own email)
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

  try {
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: input },
    ];

    const maxIterations = 10;
    let finalText = '';

    for (let i = 0; i < maxIterations; i++) {
      const response = await anthropic.messages.create({
        model: agent.model || 'claude-sonnet-4-5-20250929',
        max_tokens: 2048,
        system: systemPrompt + (agent.slug ? `\n\nYour email address is ${agentEmailAddress(agent.slug)}. You can send emails from this address and check your inbox.` : ''),
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
            // Handle agent email tools locally
            result = await executeEmailTool(toolUse.name, toolUse.input as Record<string, unknown>);
          } else if (session) {
            // Handle Composio tools
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
        } catch (e) {
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `Error: ${e instanceof Error ? e.message : 'Tool execution failed'}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: 'user', content: toolResults });
    }

    await incrementTaskUsage(auth.orgId!);

    return NextResponse.json({
      executionId: `sandbox_${Date.now()}`,
      status: 'completed',
      result: { text: finalText },
    });
  } catch (e) {
    console.error('Sandbox error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sandbox execution failed' },
      { status: 500 }
    );
  }
}
