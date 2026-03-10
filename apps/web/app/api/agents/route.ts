import { NextRequest, NextResponse } from 'next/server';
import { getApiUser } from '@/lib/supabase/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/agents — create a new agent
export async function POST(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const sb = createAdminClient();

  const { data: agent, error } = await sb
    .from('agents')
    .insert({
      creator_id: auth.user.id,
      name: body.name,
      slug: body.slug,
      description: body.description || body.name,
      category: body.category || 'general',
      system_prompt: body.system_prompt || '',
      tags: body.tags || [],
      model: body.model || 'claude-sonnet-4-5-20250929',
      required_connectors: body.required_connectors || [],
      optional_connectors: body.optional_connectors || [],
      pricing_model: body.pricing_model || 'free',
      price_cents: body.price_cents || 0,
      per_use_price_cents: body.per_use_price_cents || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ agent });
}
