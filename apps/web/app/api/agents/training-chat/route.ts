import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import Anthropic from '@anthropic-ai/sdk';

const PHASE_ORDER = ['purpose', 'behavior', 'examples', 'review'];

const SYSTEM_PROMPT = `You are an AI agent builder assistant for Agent Spark. You help users create AI agents through a conversational interview.

You are currently in the "{phase}" phase of agent creation. This is phase {phaseNum} of {totalPhases}.

Phase descriptions:
- purpose: Understand what the agent should do. Ask about the core task, who uses it, what problems it solves. (1-2 exchanges then move on)
- behavior: Define personality, tone, rules, and constraints. Ask about communication style and guardrails. (1-2 exchanges then move on)
- examples: Get example conversations showing ideal agent behavior. Ask the user for a sample user message and how the agent should respond. (1-2 exchanges then move on)
- review: Summarize everything and generate the system prompt and agent metadata.

CRITICAL RULES:
- Be concise and friendly. Ask ONE question at a time. Keep responses under 3 sentences.
- After 1-2 user responses in any phase, you MUST move to the next phase. Do NOT stay on the same phase for more than 2 exchanges.
- When moving to the next phase, start your response with the transition, then ask the first question for the new phase.
- In the review phase, ALWAYS generate a complete system_prompt and agent metadata.

PHASE ADVANCEMENT:
- You MUST include a phase marker at the very start of your response to indicate which phase your response belongs to.
- Format: [PHASE:purpose] or [PHASE:behavior] or [PHASE:examples] or [PHASE:review]
- If you are advancing to a new phase, use the NEW phase name.
- For example, if the user just answered your purpose question well, start your next response with [PHASE:behavior] to advance.

SUGGESTIONS:
At the end of every response, include contextual quick-reply options. Format:
\`\`\`suggestions
["Specific option 1", "Specific option 2", "Specific option 3"]
\`\`\`

Make suggestions specific to the question you just asked. If you asked about tone, suggest things like "Professional and formal", "Friendly and casual", "Technical and precise".

When in the review phase, include a JSON block with:
\`\`\`json
{"system_prompt": "the full system prompt for the agent", "agent_meta": {"name": "Agent Name", "description": "One sentence description", "category": "one of: customer-support, sales, marketing, ecommerce, productivity, data, development, content, operations, general", "tags": ["tag1", "tag2"], "suggested_pricing": 0}}
\`\`\``;

export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { messages, phase = 'purpose' } = await request.json();

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Count user messages to determine if we should hint at advancing
  const userMessageCount = (messages || []).filter((m: { role: string }) => m.role === 'user').length;
  const currentPhaseIndex = PHASE_ORDER.indexOf(phase);

  // Calculate how many messages we've had in this phase (rough estimate)
  // If user has sent enough messages, hint to the model to advance
  let phaseHint = '';
  if (userMessageCount >= 2 && currentPhaseIndex < PHASE_ORDER.length - 1) {
    const nextPhase = PHASE_ORDER[currentPhaseIndex + 1];
    phaseHint = `\n\nIMPORTANT: The user has answered enough questions for the "${phase}" phase. You MUST advance to the "${nextPhase}" phase now. Start your response with [PHASE:${nextPhase}].`;
  }

  try {
    const phaseNum = currentPhaseIndex + 1;
    const systemPrompt = SYSTEM_PROMPT
      .replace('{phase}', phase)
      .replace('{phaseNum}', String(phaseNum))
      .replace('{totalPhases}', String(PHASE_ORDER.length))
      + phaseHint;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1500,
      system: systemPrompt,
      messages: (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    // Extract phase marker from response
    let responsePhase = phase;
    const phaseMatch = text.match(/\[PHASE:(\w+)\]/);
    if (phaseMatch && PHASE_ORDER.includes(phaseMatch[1])) {
      responsePhase = phaseMatch[1];
    }

    // Extract JSON metadata if present (review phase)
    let systemPromptResult: string | undefined;
    let agentMeta: Record<string, unknown> | undefined;

    const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        systemPromptResult = parsed.system_prompt;
        agentMeta = parsed.agent_meta;
      } catch { /* ignore parse errors */ }
    }

    // Extract suggestions from response
    let suggestions: string[] = [];
    const suggestionsMatch = text.match(/```suggestions\s*\n?\s*(\[[\s\S]*?\])\s*\n?\s*```/);
    if (suggestionsMatch) {
      try {
        suggestions = JSON.parse(suggestionsMatch[1]);
      } catch { /* ignore */ }
    }
    if (suggestions.length === 0) {
      suggestions = ['Sounds good', 'Tell me more', 'Let\'s move on'];
    }

    const responsePhaseIndex = PHASE_ORDER.indexOf(responsePhase);
    const progress = Math.min(100, Math.round(((responsePhaseIndex + 1) / PHASE_ORDER.length) * 100));

    // Clean phase marker, json, and suggestions blocks from displayed message
    const cleanMessage = text
      .replace(/\[PHASE:\w+\]\s*/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```suggestions[\s\S]*?```/g, '')
      .trim();

    return NextResponse.json({
      message: cleanMessage,
      phase: responsePhase,
      progress,
      suggestions,
      ...(systemPromptResult && { system_prompt: systemPromptResult }),
      ...(agentMeta && { agent_meta: agentMeta }),
    });
  } catch (e) {
    console.error('Training chat error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Training chat failed' },
      { status: 500 }
    );
  }
}
