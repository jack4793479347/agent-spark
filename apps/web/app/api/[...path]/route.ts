import { NextRequest, NextResponse } from 'next/server';

// ─── Guard: only serve mocks when explicitly opted in ──────────
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

// ─── Mock Data for Dev Preview ──────────────────────────────────

const MOCK_BILLING_USAGE = {
  allowed: true,
  remaining_tasks: 42,
  remaining_a2a_calls: 8,
  plan: 'pro',
};

const MOCK_BILLING_INFO = {
  plan: 'pro',
  usage: MOCK_BILLING_USAGE,
  subscription_id: 'sub_mock_123',
  current_period_end: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_EARNINGS_SUMMARY = {
  total_gross_cents: 48500,
  total_net_cents: 41225,
  total_fee_cents: 7275,
  pending_payout_cents: 12800,
  current_month_net_cents: 8450,
  rental_count: 24,
  a2a_call_count: 156,
};

const MOCK_EARNINGS_HISTORY = [
  { id: 'e1', source: 'rental', agent_id: 'a1', gross_amount_cents: 2900, platform_fee_cents: 435, net_amount_cents: 2465, payout_status: 'paid', created_at: new Date(Date.now() - 2 * 86400000).toISOString(), agents: { name: 'Shopify Returns Handler', slug: 'shopify-returns-handler' } },
  { id: 'e2', source: 'a2a_call', agent_id: 'a2', gross_amount_cents: 150, platform_fee_cents: 23, net_amount_cents: 127, payout_status: 'pending', created_at: new Date(Date.now() - 1 * 86400000).toISOString(), agents: { name: 'Smart Email Responder', slug: 'smart-email-responder' } },
  { id: 'e3', source: 'rental', agent_id: 'a3', gross_amount_cents: 4900, platform_fee_cents: 735, net_amount_cents: 4165, payout_status: 'paid', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), agents: { name: 'Lead Qualifier Pro', slug: 'lead-qualifier-pro' } },
  { id: 'e4', source: 'a2a_call', agent_id: 'a1', gross_amount_cents: 100, platform_fee_cents: 15, net_amount_cents: 85, payout_status: 'pending', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), agents: { name: 'Shopify Returns Handler', slug: 'shopify-returns-handler' } },
  { id: 'e5', source: 'rental', agent_id: 'a4', gross_amount_cents: 1900, platform_fee_cents: 285, net_amount_cents: 1615, payout_status: 'processing', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), agents: { name: 'Social Content Creator', slug: 'social-content-creator' } },
];

const MOCK_AGENTS_MINE = [
  { id: 'a1', name: 'Shopify Returns Handler', slug: 'shopify-returns-handler', category: 'ecommerce', avg_rating: 4.8, review_count: 124, active_rentals: 45, total_a2a_calls: 320, total_executions: 1850, status: 'published' },
  { id: 'a2', name: 'Smart Email Responder', slug: 'smart-email-responder', category: 'customer-support', avg_rating: 4.6, review_count: 89, active_rentals: 32, total_a2a_calls: 180, total_executions: 2340, status: 'published' },
  { id: 'a3', name: 'Lead Qualifier Pro', slug: 'lead-qualifier-pro', category: 'sales', avg_rating: 4.9, review_count: 67, active_rentals: 18, total_a2a_calls: 95, total_executions: 890, status: 'published' },
];

const MOCK_WORKFLOWS = [
  { id: 'w1', name: 'Automate Shopify Returns', description: 'Process returns, generate labels, notify customers', agent_ids: ['a1', 'a2'], trigger_type: 'webhook', status: 'active', assembled_by_ai: true, created_at: new Date(Date.now() - 10 * 86400000).toISOString(), updated_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'w2', name: 'Daily Lead Scoring Pipeline', description: 'Score new leads, enrich profiles, assign to reps', agent_ids: ['a3'], trigger_type: 'schedule', status: 'active', assembled_by_ai: false, created_at: new Date(Date.now() - 20 * 86400000).toISOString(), updated_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'w3', name: 'Content Generation Suite', description: 'Generate blog posts, social media, and email campaigns', agent_ids: ['a2', 'a4', 'a5'], trigger_type: 'manual', status: 'paused', assembled_by_ai: true, created_at: new Date(Date.now() - 30 * 86400000).toISOString(), updated_at: new Date(Date.now() - 15 * 86400000).toISOString() },
];

const MOCK_EXECUTIONS = [
  { id: 'ex1', agent_id: 'a1', agent_name: 'Shopify Returns Handler', input_text: 'Process batch returns', status: 'completed', total_tokens: 3420, total_tool_calls: 4, total_a2a_calls: 1, cost_cents: 12, started_at: new Date(Date.now() - 120000).toISOString(), completed_at: new Date(Date.now() - 110000).toISOString() },
  { id: 'ex2', agent_id: 'a2', agent_name: 'Smart Email Responder', input_text: 'Draft reply to customer', status: 'completed', total_tokens: 2100, total_tool_calls: 2, total_a2a_calls: 0, cost_cents: 8, started_at: new Date(Date.now() - 480000).toISOString(), completed_at: new Date(Date.now() - 475000).toISOString() },
  { id: 'ex3', agent_id: 'a3', agent_name: 'Lead Qualifier Pro', input_text: 'Score new inbound leads', status: 'completed', total_tokens: 4200, total_tool_calls: 6, total_a2a_calls: 2, cost_cents: 22, started_at: new Date(Date.now() - 2040000).toISOString(), completed_at: new Date(Date.now() - 2030000).toISOString() },
  { id: 'ex4', agent_id: 'a1', agent_name: 'Shopify Returns Handler', input_text: 'Handle refund request #4821', status: 'failed', total_tokens: 800, total_tool_calls: 1, total_a2a_calls: 0, cost_cents: 5, started_at: new Date(Date.now() - 3600000).toISOString(), completed_at: new Date(Date.now() - 3595000).toISOString(), error: 'Shopify API rate limit exceeded' },
  { id: 'ex5', agent_id: 'a2', agent_name: 'Smart Email Responder', input_text: 'Classify support emails', status: 'completed', total_tokens: 1500, total_tool_calls: 3, total_a2a_calls: 0, cost_cents: 8, started_at: new Date(Date.now() - 18000000).toISOString(), completed_at: new Date(Date.now() - 17995000).toISOString() },
];

const MOCK_REVIEWS = [
  { id: 'r1', user_id: 'u1', rating: 5, comment: 'Incredible agent! Saved us 20+ hours per week on returns processing. The accuracy is outstanding.', created_at: new Date(Date.now() - 3 * 86400000).toISOString(), profiles: { display_name: 'Sarah Chen' }, helpful_count: 12, user_found_helpful: false },
  { id: 'r2', user_id: 'u2', rating: 4, comment: 'Great tool overall. Handles most cases perfectly. Occasionally needs manual review for edge cases.', created_at: new Date(Date.now() - 7 * 86400000).toISOString(), profiles: { display_name: 'Mike Johnson' }, helpful_count: 8, user_found_helpful: false },
  { id: 'r3', user_id: 'u3', rating: 5, comment: 'Best investment we\'ve made this quarter. ROI was positive within the first week.', created_at: new Date(Date.now() - 14 * 86400000).toISOString(), profiles: { display_name: 'Alex Rivera' }, helpful_count: 5, user_found_helpful: false },
];

const MOCK_CONNECTIONS = [
  { id: 'c1', connector_type_id: 'gmail', status: 'active', connected_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'c2', connector_type_id: 'slack', status: 'active', connected_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: 'c3', connector_type_id: 'shopify', status: 'active', connected_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'c4', connector_type_id: 'stripe', status: 'active', connected_at: new Date(Date.now() - 15 * 86400000).toISOString() },
];

const MOCK_CONNECTOR_TYPES = [
  { id: 'gmail', name: 'Gmail', description: 'Send and read emails', auth_type: 'oauth2', is_active: true },
  { id: 'slack', name: 'Slack', description: 'Send messages and read channels', auth_type: 'oauth2', is_active: true },
  { id: 'shopify', name: 'Shopify', description: 'Manage orders, inventory, and refunds', auth_type: 'oauth2', is_active: true },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM: contacts, deals, and activity', auth_type: 'oauth2', is_active: true },
  { id: 'stripe', name: 'Stripe', description: 'Payments, invoices, and refunds', auth_type: 'api_key', is_active: true },
  { id: 'notion', name: 'Notion', description: 'Pages, databases, and blocks', auth_type: 'oauth2', is_active: true },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Create and manage calendar events', auth_type: 'oauth2', is_active: true },
  { id: 'google-sheets', name: 'Google Sheets', description: 'Read and write spreadsheet data', auth_type: 'oauth2', is_active: true },
  { id: 'airtable', name: 'Airtable', description: 'Query and manage records', auth_type: 'oauth2', is_active: true },
  { id: 'webhook', name: 'Webhooks', description: 'Send and receive custom webhooks', auth_type: 'api_key', is_active: true },
];

const MOCK_RENTALS = [
  { id: 'r1', agent_id: 'a1', status: 'active', monthly_price_cents: 2900, total_executions: 47, started_at: new Date(Date.now() - 30 * 86400000).toISOString(), agents: { name: 'Shopify Returns Handler', slug: 'shopify-returns-handler' } },
  { id: 'r2', agent_id: 'a2', status: 'active', monthly_price_cents: 0, total_executions: 123, started_at: new Date(Date.now() - 20 * 86400000).toISOString(), agents: { name: 'Smart Email Responder', slug: 'smart-email-responder' } },
];

const MOCK_SESSION = {
  user: { id: 'mock-user-id', email: 'demo@agentspark.ai' },
  org: { id: 'mock-org-id', name: 'Demo Org', plan: 'pro', is_creator: true },
};

// ─── Route Handler ──────────────────────────────────────────────

function matchPath(path: string): Response | null {
  // Auth
  if (path === 'auth/session') {
    return NextResponse.json(MOCK_SESSION);
  }

  // Billing
  if (path === 'billing/usage') return NextResponse.json(MOCK_BILLING_USAGE);
  if (path === 'billing/info') return NextResponse.json(MOCK_BILLING_INFO);
  if (path === 'billing/earnings') return NextResponse.json({ earnings: MOCK_EARNINGS_SUMMARY });
  if (path.startsWith('billing/earnings/history')) return NextResponse.json({ earnings: MOCK_EARNINGS_HISTORY, total: MOCK_EARNINGS_HISTORY.length, page: 1, totalPages: 1 });

  // Agents
  if (path === 'agents/mine') return NextResponse.json({ agents: MOCK_AGENTS_MINE });
  if (path === 'agents/executions' || path.startsWith('agents/executions?')) return NextResponse.json({ executions: MOCK_EXECUTIONS, total: MOCK_EXECUTIONS.length });
  if (path.startsWith('agents/executions/')) {
    const id = path.split('/').pop();
    const exec = MOCK_EXECUTIONS.find((e) => e.id === id) ?? MOCK_EXECUTIONS[0];
    return NextResponse.json({
      execution: {
        ...exec,
        steps: [
          { type: 'text', text: 'Analyzing request...', timestamp: new Date(Date.now() - 5000).toISOString() },
          { type: 'tool_call', tool_name: 'shopify__get_returns', input: {}, output: { success: true }, duration_ms: 1200, timestamp: new Date(Date.now() - 3000).toISOString() },
          { type: 'text', text: 'Processed successfully.', timestamp: new Date().toISOString() },
        ],
        result: { text: 'Task completed successfully.' },
      },
    });
  }

  // Workflows
  if (path === 'workflows' || path.startsWith('workflows?')) return NextResponse.json({ workflows: MOCK_WORKFLOWS, total: MOCK_WORKFLOWS.length, page: 1, totalPages: 1 });

  // Connections
  if (path === 'connections') return NextResponse.json({ connections: MOCK_CONNECTIONS });
  if (path === 'connections/available') return NextResponse.json({ connector_types: MOCK_CONNECTOR_TYPES });

  // Rentals
  if (path === 'rentals' || path === 'rentals/active') return NextResponse.json({ rentals: MOCK_RENTALS });

  // Marketplace reviews
  if (path.match(/marketplace\/agent\/[\w-]+\/reviews/)) return NextResponse.json({ reviews: MOCK_REVIEWS, total: MOCK_REVIEWS.length, page: 1, totalPages: 1 });

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!USE_MOCK) {
    return NextResponse.json({ error: 'Mock API disabled' }, { status: 404 });
  }

  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const fullPath = searchParams ? `${path}?${searchParams}` : path;

  const result = matchPath(fullPath);
  if (result) return result;

  return NextResponse.json({ message: `Mock endpoint: ${path}` });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!USE_MOCK) {
    return NextResponse.json({ error: 'Mock API disabled' }, { status: 404 });
  }

  const path = params.path.join('/');

  if (path === 'workflows/assemble') {
    return NextResponse.json({
      assembly: {
        workflow_summary: 'Automate Shopify return processing with email notifications',
        recommended_agents: [
          { agent_id: 'a1', name: 'Shopify Returns Handler', slug: 'shopify-returns-handler', description: 'Processes returns automatically', category: 'ecommerce', rating: 4.8, price_per_call_cents: 100, total_calls: 1850, match_reason: 'Direct match for Shopify returns processing', already_rented: true },
          { agent_id: 'a2', name: 'Smart Email Responder', slug: 'smart-email-responder', description: 'Sends customer notifications', category: 'customer-support', rating: 4.6, price_per_call_cents: 50, total_calls: 2340, match_reason: 'Handles email notifications to customers', already_rented: false },
        ],
        total_cost_cents: 50,
        capabilities_covered: ['returns_processing', 'email_notification'],
        connectors_needed: ['shopify', 'gmail'],
      },
    });
  }

  if (path === 'auth/become-creator') return NextResponse.json({ url: '/creator/earnings?onboarding=complete' });
  if (path === 'billing/payouts/request') return NextResponse.json({ transfer_id: 'tr_mock_123', amount_cents: 12800 });
  if (path === 'rentals') return NextResponse.json({ success: true, rental_id: `r_mock_${Date.now()}` });
  if (path === 'billing/create-checkout') return NextResponse.json({ demo: true, url: null });

  return NextResponse.json({ success: true, message: `Mock POST: ${path}` });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!USE_MOCK) {
    return NextResponse.json({ error: 'Mock API disabled' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!USE_MOCK) {
    return NextResponse.json({ error: 'Mock API disabled' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
