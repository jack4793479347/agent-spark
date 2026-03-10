import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { description, agent_name, instructions } = await request.json();
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const context = [
      agent_name ? `Agent name: ${agent_name}` : '',
      instructions ? `System instructions summary: ${instructions.slice(0, 500)}` : '',
    ].filter(Boolean).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system: `You generate knowledge base documents for AI agents. The user will describe their business or use case. Generate a comprehensive, well-structured markdown document that the agent can search to answer questions.

The document should include:
- A clear FAQ section with 10-15 common questions and detailed answers
- Key information about the product/service/topic
- Policies, procedures, or guidelines as relevant
- Specific details, numbers, and examples (make reasonable assumptions based on the description)

Write in a factual, reference-style tone. Use markdown headers (##) to organize sections. Each FAQ answer should be 2-4 sentences with specific, actionable information.

${context ? `\nContext about the agent:\n${context}` : ''}

Output ONLY the markdown document content. No code fences or meta-commentary.`,
      messages: [{ role: 'user', content: description }],
    });

    const content = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return NextResponse.json({ content });
  } catch (e) {
    console.error('Generate KB error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate knowledge base' },
      { status: 500 }
    );
  }
}
