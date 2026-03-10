import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/marketplace/categories — public, distinct categories with counts
export async function GET() {
  const sb = createAdminClient();

  const { data: agents, error } = await sb
    .from('agents')
    .select('category')
    .eq('status', 'published');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Count agents per category
  const counts = new Map<string, number>();
  for (const agent of agents ?? []) {
    const cat = agent.category || 'general';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  const CATEGORY_NAMES: Record<string, string> = {
    'ecommerce': 'E-Commerce',
    'e-commerce': 'E-Commerce',
    'customer-support': 'Customer Support',
    'sales': 'Sales',
    'marketing': 'Marketing',
    'finance': 'Finance',
    'productivity': 'Productivity',
    'hr': 'Human Resources',
    'data': 'Data & Analytics',
    'analytics': 'Analytics',
    'development': 'Development',
    'content': 'Content',
    'operations': 'Operations',
    'general': 'General',
    'security': 'Security',
    'legal': 'Legal',
    'scheduling': 'Scheduling',
    'communication': 'Communication',
  };

  const categories = Array.from(counts.entries())
    .map(([slug, count]) => ({
      slug,
      name: CATEGORY_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
      description: `${count} agent${count !== 1 ? 's' : ''}`,
      agent_count: count,
    }))
    .sort((a, b) => b.agent_count - a.agent_count);

  return NextResponse.json({ categories });
}
