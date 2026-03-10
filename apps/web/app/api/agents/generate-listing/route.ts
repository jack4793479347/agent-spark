import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { input } = await request.json();
  if (!input) return NextResponse.json({ error: 'input required' }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `You generate marketplace listings for AI agents. Given a system prompt or description, output ONLY a JSON object with these fields:
{
  "name": "Short agent name",
  "description": "1-2 sentence marketplace description",
  "category": "one of: customer-support, sales, marketing, ecommerce, productivity, data, development, general",
  "tags": ["tag1", "tag2", "tag3"],
  "suggested_pricing": 9.99
}
Output ONLY the JSON, no markdown fences, no explanation.`,
      messages: [{ role: 'user', content: input }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const listing = JSON.parse(text);
    return NextResponse.json({ listing });
  } catch (e) {
    console.error('Generate listing error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate listing' },
      { status: 500 }
    );
  }
}
