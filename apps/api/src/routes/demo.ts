import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase.js';
import { buildRAGSystemPrompt } from '../services/knowledge-base.js';
import { searchMarketplace } from '../services/marketplace.js';

// ─── Rate Limiting ───────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { timestamps: [now] });
    return true;
  }

  // Prune timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (entry.timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

// ─── Schema ──────────────────────────────────────────────────

const demoSchema = z.object({
  query: z.string().min(3).max(500),
});

// ─── Available integrations the platform supports ────────────

const PLATFORM_INTEGRATIONS = [
  'Gmail', 'Slack', 'Shopify', 'HubSpot', 'Stripe',
  'Notion', 'Google Calendar', 'Google Sheets', 'Airtable', 'Webhooks',
];

// ─── Router ──────────────────────────────────────────────────

export const demoRoutes = new Hono();

demoRoutes.post('/try', zValidator('json', demoSchema), async (c) => {
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return c.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      429
    );
  }

  const { query } = c.req.valid('json');

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic();

    // Run team generation and marketplace search in parallel
    const [teamResult, marketplaceResults] = await Promise.all([
      // Generate a tailored team of agents for this goal
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: `You are the AI workflow architect for AgentSpark, an AI agent marketplace. Given a user's goal, generate a team of 2-4 AI agents that will EXECUTE the work — not just give advice.

Available integrations: ${PLATFORM_INTEGRATIONS.join(', ')}

Respond with ONLY valid JSON, no markdown. Format:
{
  "team": [
    {
      "name": "Agent Name",
      "role": "One-line description of what this agent DOES (action verb, specific)",
      "integrations": ["Gmail", "Slack"],
      "actions": ["Specific action it takes", "Another concrete action"],
      "price": "$X.XX",
      "unit": "/mo or /call"
    }
  ],
  "execution_plan": "2-3 sentence description of exactly what happens when the user activates this team. Be specific about what gets created, sent, connected, or automated. Use 'we' language."
}

Rules:
- Each agent should DO something concrete (send emails, create spreadsheets, post to Slack, schedule meetings, process orders)
- Use realistic integrations from the list above that make sense for the goal
- Actions should be specific and automatable, not "provide advice" or "help with strategy"
- Price between $0.50-$5.00 per agent
- The execution_plan should make the user think "wow, it's going to do ALL of that for me?"`,
        messages: [{ role: 'user', content: query }],
      }),
      // Search marketplace for real agents
      searchMarketplace({ query, pageSize: 1, sortBy: 'popular' }),
    ]);

    // Parse team
    let team: Array<{
      name: string;
      role: string;
      integrations: string[];
      actions: string[];
      price: string;
      unit: string;
    }> = [];
    let executionPlan = '';

    let teamText = teamResult.content[0]?.type === 'text' ? teamResult.content[0].text : '';
    // Strip markdown code fences if present
    teamText = teamText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    try {
      const parsed = JSON.parse(teamText);
      team = parsed.team || [];
      executionPlan = parsed.execution_plan || '';
    } catch {
      console.error('[demo] Failed to parse team JSON:', teamText.substring(0, 300));
    }

    // If we found a real marketplace agent, get a demo response from it
    let agentResponse = '';
    let matchedAgent: {
      id: string;
      name: string;
      slug: string;
      description: string;
      category: string;
      price_cents: number;
      pricing_model: string;
    } | null = null;

    if (marketplaceResults.agents && marketplaceResults.agents.length > 0) {
      const agent = marketplaceResults.agents[0] as Record<string, unknown>;
      matchedAgent = {
        id: String(agent.id),
        name: String(agent.name),
        slug: String(agent.slug),
        description: String(agent.description),
        category: String(agent.category),
        price_cents: Number(agent.price_cents),
        pricing_model: String(agent.pricing_model),
      };

      // Get a quick response from the matched agent
      const { data: agentData } = await supabaseAdmin
        .from('agents')
        .select('system_prompt')
        .eq('id', String(agent.id))
        .single();

      if (agentData) {
        const systemPrompt = await buildRAGSystemPrompt(
          agentData.system_prompt,
          String(agent.id),
          query
        );

        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: systemPrompt + '\n\nBe concise and action-oriented. Show what you would DO, not just advise. Start with "Here\'s what I\'ll do:" or similar action language. Keep it under 150 words.',
          messages: [{ role: 'user', content: query }],
        });

        agentResponse = response.content[0]?.type === 'text' ? response.content[0].text : '';
      }
    }

    // If no marketplace agent, generate a quick action-oriented response
    if (!agentResponse) {
      const fallback = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You are an AI agent on AgentSpark. The user described a goal and we've assembled a team of AI agents to execute it. Give a brief, action-oriented preview of what the first agent would start doing immediately. Be specific and concrete — mention actual deliverables, not advice. Start with "Here's what I'll start on:" or similar. Keep it under 150 words. Do NOT give generic advice or bullet-point lists.`,
        messages: [{ role: 'user', content: query }],
      });

      agentResponse = fallback.content[0]?.type === 'text' ? fallback.content[0].text : '';
    }

    return c.json({
      agent: matchedAgent,
      team,
      execution_plan: executionPlan,
      response: agentResponse,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Demo request failed';
    console.error('[demo] Error:', message);
    return c.json({ error: message }, 500);
  }
});
