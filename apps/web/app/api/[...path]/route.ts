import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getApiUser } from '@/lib/supabase/api-auth';

// Minimal catch-all for routes that don't have real implementations yet.
// Most routes now have dedicated handlers — this only covers:
// - auth/become-creator (Stripe Connect onboarding)
// - workflows/* (Coming Soon)

const TRAINING_PHASES_ORDER = ['purpose', 'behavior', 'knowledge', 'examples', 'review'];

function matchGetPath(path: string): Response | null {
  // Workflows — Coming Soon, return empty
  if (path === 'workflows' || path.startsWith('workflows?')) {
    return NextResponse.json({ workflows: [], total: 0, page: 1, totalPages: 0 });
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  const result = matchGetPath(fullPath);
  if (result) return result;

  return NextResponse.json({ error: `Not found: ${path}` }, { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');

  // Training chat — still uses AI directly, keep mock for now
  if (path === 'agents/training-chat') {
    let body: Record<string, unknown> = {};
    try { body = await request.json(); } catch {}
    const messages = (body.messages as Array<{ role: string; content: string }>) || [];
    const phase = (body.phase as string) || 'purpose';
    const userMsg = messages.filter(m => m.role === 'user').pop()?.content || '';

    const phaseResponses: Record<string, string> = {
      purpose: `Great! So your agent will focus on "${userMsg.slice(0, 50)}". Let me understand more about the specific tasks it should handle. What are the main actions or workflows this agent should perform?`,
      behavior: 'Got it. Now let me understand the tone and style. Should the agent be formal or casual? Any specific guidelines for how it communicates?',
      knowledge: 'Perfect. What knowledge or data sources should this agent have access to? You can also add documents in the Setup step later.',
      examples: 'Almost there! Can you give me an example conversation? Show me a user message and how the agent should ideally respond.',
      review: 'Here is a summary of your agent configuration. Everything looks good! You can proceed to the Setup step to add knowledge base files and configure integrations.',
    };

    return NextResponse.json({
      message: phaseResponses[phase] || phaseResponses.purpose,
      phase,
      progress: Math.min(100, (TRAINING_PHASES_ORDER.indexOf(phase) + 1) / TRAINING_PHASES_ORDER.length * 100),
      suggestions: ['Tell me more', 'Sounds good', 'Let me explain further'],
    });
  }

  // Generate listing — still uses AI
  if (path === 'agents/generate-listing') {
    return NextResponse.json({
      listing: {
        name: 'AI Assistant',
        description: 'A helpful AI agent that assists with various tasks.',
        category: 'general',
        tags: ['ai', 'assistant', 'automation'],
        suggested_pricing: 9.99,
      },
    });
  }

  // Become creator — Stripe Connect onboarding
  if (path === 'auth/become-creator') {
    const auth = await getApiUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      const sb = createAdminClient();
      await sb
        .from('profiles')
        .update({ role: 'creator' })
        .eq('id', auth.user.id);

      return NextResponse.json({ url: '/creator/earnings?onboarding=complete' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to become creator';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: `Not found: ${path}` }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return NextResponse.json({ error: `Not found: ${path}` }, { status: 404 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return NextResponse.json({ error: `Not found: ${path}` }, { status: 404 });
}
