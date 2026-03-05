import { supabaseAdmin } from '../lib/supabase.js';

/**
 * Look up a published agent by its ID.
 */
export async function lookupAgent(agentId: string) {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, system_prompt, capabilities, connector_ids, model_preference, status, creator_id, pricing_model, price_cents, version')
    .eq('id', agentId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Find published agents that match a capability tag.
 * Used by A2A orchestration to discover agents for a workflow.
 */
export async function findAgentsForCapability(tag: string) {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, capabilities, model_preference, pricing_model, price_cents, avg_rating, total_rentals')
    .eq('status', 'published')
    .contains('capabilities', [tag])
    .order('avg_rating', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[agent-registry] findAgentsForCapability error:', error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Search published agents by text (name or description).
 */
export async function searchAgents(query: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, name, slug, description, capabilities, pricing_model, price_cents, avg_rating, total_rentals')
    .eq('status', 'published')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('total_rentals', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[agent-registry] searchAgents error:', error.message);
    return [];
  }

  return data ?? [];
}
