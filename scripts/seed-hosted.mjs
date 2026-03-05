/**
 * Seed hosted Supabase with test data via REST API (service role key).
 * Run: node scripts/seed-hosted.mjs
 */

const SUPABASE_URL = 'https://dipsygorbjiezgakmbyh.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcHN5Z29yYmppZXpnYWttYnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ4NDk3MiwiZXhwIjoyMDg4MDYwOTcyfQ.osRDPaLydcP3I5Nqt8YoXlnJOIHs3ve5XwcjkftdgBI';

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Prefer': 'resolution=merge-duplicates',
};

async function upsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`  FAIL ${table}: ${res.status} ${body}`);
    return false;
  }
  console.log(`  OK ${table}: ${Array.isArray(rows) ? rows.length : 1} rows`);
  return true;
}

// We need auth.users but can't insert via REST. Use the admin auth API instead.
async function createAuthUser(id, email, fullName, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      id,
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (body.includes('already been registered') || body.includes('duplicate')) {
      console.log(`  SKIP auth user ${email} (already exists)`);
      return true;
    }
    console.error(`  FAIL auth user ${email}: ${res.status} ${body}`);
    return false;
  }
  console.log(`  OK auth user ${email}`);
  return true;
}

const now = new Date();
const ago = (days) => new Date(now - days * 86400000).toISOString();

async function seed() {
  console.log('=== Seeding Auth Users ===');
  await createAuthUser('a1111111-1111-1111-1111-111111111111', 'alice@agentspark.dev', 'Alice Chen', 'password123');
  await createAuthUser('b2222222-2222-2222-2222-222222222222', 'bob@agentspark.dev', 'Bob Martinez', 'password123');
  await createAuthUser('c3333333-3333-3333-3333-333333333333', 'carol@agentspark.dev', 'Carol Park', 'password123');

  // Wait for profile triggers to fire
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n=== Seeding Profiles ===');
  await upsert('profiles', [
    { id: 'a1111111-1111-1111-1111-111111111111', display_name: 'Alice Chen', role: 'creator', onboarding_completed: true },
    { id: 'b2222222-2222-2222-2222-222222222222', display_name: 'Bob Martinez', role: 'user', onboarding_completed: true },
    { id: 'c3333333-3333-3333-3333-333333333333', display_name: 'Carol Park', role: 'creator', onboarding_completed: true },
  ]);

  console.log('\n=== Seeding Organizations ===');
  await upsert('organizations', [
    { id: 'd4444444-4444-4444-4444-444444444444', name: "Alice's Workspace", slug: 'alice-workspace', owner_id: 'a1111111-1111-1111-1111-111111111111', plan: 'pro' },
    { id: 'e5555555-5555-5555-5555-555555555555', name: "Bob's Team", slug: 'bob-team', owner_id: 'b2222222-2222-2222-2222-222222222222', plan: 'starter' },
    { id: 'f6666666-6666-6666-6666-666666666666', name: 'Carol Studios', slug: 'carol-studios', owner_id: 'c3333333-3333-3333-3333-333333333333', plan: 'pro' },
  ]);

  console.log('\n=== Seeding Org Members ===');
  await upsert('org_members', [
    { org_id: 'd4444444-4444-4444-4444-444444444444', user_id: 'a1111111-1111-1111-1111-111111111111', role: 'owner' },
    { org_id: 'e5555555-5555-5555-5555-555555555555', user_id: 'b2222222-2222-2222-2222-222222222222', role: 'owner' },
    { org_id: 'f6666666-6666-6666-6666-666666666666', user_id: 'c3333333-3333-3333-3333-333333333333', role: 'owner' },
  ]);

  console.log('\n=== Seeding Agents ===');
  await upsert('agents', [
    {
      id: 'aa000001-0000-0000-0000-000000000001', creator_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Smart Email Responder', slug: 'smart-email-responder',
      description: 'Automatically drafts contextual replies to customer emails using your knowledge base.',
      long_description: 'Uses your connected Gmail and knowledge base to understand context, draft professional replies, and queue them for review.',
      category: 'customer-support', tags: ['email', 'gmail', 'support', 'auto-reply'],
      system_prompt: 'You are a professional email assistant. Draft contextual, helpful replies.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'monthly', price_cents: 2900, per_use_price_cents: 0, a2a_call_price_cents: 50,
      total_rentals: 142, active_rentals: 45, total_a2a_calls: 520, avg_rating: 4.8, review_count: 89, version: '2.1.0', published_at: ago(60),
    },
    {
      id: 'aa000002-0000-0000-0000-000000000002', creator_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Shopify Returns Handler', slug: 'shopify-returns-handler',
      description: 'Processes Shopify return requests, generates labels, and notifies customers automatically.',
      long_description: 'Connects to your Shopify store to handle return requests end-to-end.',
      category: 'ecommerce', tags: ['shopify', 'returns', 'ecommerce', 'fulfillment'],
      system_prompt: 'You are a Shopify returns specialist.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'per_use', price_cents: 0, per_use_price_cents: 100, a2a_call_price_cents: 75,
      total_rentals: 87, active_rentals: 32, total_a2a_calls: 310, avg_rating: 4.6, review_count: 52, version: '1.4.2', published_at: ago(45),
    },
    {
      id: 'aa000003-0000-0000-0000-000000000003', creator_id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Lead Qualifier Pro', slug: 'lead-qualifier-pro',
      description: 'Scores inbound leads, enriches profiles, and routes hot prospects to your sales team.',
      long_description: 'Combines LinkedIn, Crunchbase, and CRM data to score leads on a 0-100 scale.',
      category: 'sales', tags: ['leads', 'crm', 'hubspot', 'scoring', 'sales'],
      system_prompt: 'You are a lead qualification specialist.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'monthly', price_cents: 4900, per_use_price_cents: 0, a2a_call_price_cents: 100,
      total_rentals: 64, active_rentals: 18, total_a2a_calls: 245, avg_rating: 4.9, review_count: 38, version: '3.0.1', published_at: ago(30),
    },
    {
      id: 'aa000004-0000-0000-0000-000000000004', creator_id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Social Content Creator', slug: 'social-content-creator',
      description: 'Generates social media posts, captions, and hashtags for multiple platforms.',
      long_description: 'Creates platform-optimized content for Twitter/X, LinkedIn, and Instagram.',
      category: 'marketing', tags: ['social', 'content', 'marketing', 'writing'],
      system_prompt: 'You are a social media strategist.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'per_use', price_cents: 0, per_use_price_cents: 50, a2a_call_price_cents: 25,
      total_rentals: 156, active_rentals: 58, total_a2a_calls: 890, avg_rating: 4.5, review_count: 67, version: '1.2.0', published_at: ago(20),
    },
    {
      id: 'aa000005-0000-0000-0000-000000000005', creator_id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Invoice Reconciler', slug: 'invoice-reconciler',
      description: 'Extracts invoice data from emails, cross-references with Stripe, and flags discrepancies.',
      long_description: 'Monitors Gmail for invoices, extracts data, matches against Stripe payments.',
      category: 'finance', tags: ['invoice', 'stripe', 'accounting', 'document'],
      system_prompt: 'You are a financial reconciliation assistant.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'monthly', price_cents: 1900, per_use_price_cents: 0, a2a_call_price_cents: 50,
      total_rentals: 34, active_rentals: 12, total_a2a_calls: 95, avg_rating: 4.7, review_count: 21, version: '1.0.0', published_at: ago(15),
    },
    {
      id: 'aa000006-0000-0000-0000-000000000006', creator_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Meeting Summarizer', slug: 'meeting-summarizer',
      description: 'Records, transcribes, and summarizes meetings with action items.',
      long_description: 'Integrates with Google Calendar, produces structured summaries.',
      category: 'productivity', tags: ['calendar', 'meeting', 'notion', 'slack'],
      system_prompt: 'You are a meeting assistant.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'monthly', price_cents: 2900, per_use_price_cents: 0, a2a_call_price_cents: 50,
      total_rentals: 78, active_rentals: 28, total_a2a_calls: 180, avg_rating: 4.4, review_count: 33, version: '1.5.0', published_at: ago(10),
    },
    {
      id: 'aa000007-0000-0000-0000-000000000007', creator_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Code Review Assistant', slug: 'code-review-assistant',
      description: 'Reviews pull requests, suggests improvements, checks for security vulnerabilities and best practices.',
      long_description: 'Integrates with GitHub to automatically review PRs with detailed inline comments.',
      category: 'development', tags: ['code', 'github', 'code-review', 'security'],
      system_prompt: 'You are a senior software engineer performing code review.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'per_use', price_cents: 0, per_use_price_cents: 75, a2a_call_price_cents: 50,
      total_rentals: 203, active_rentals: 72, total_a2a_calls: 1200, avg_rating: 4.9, review_count: 95, version: '2.0.0', published_at: ago(25),
    },
    {
      id: 'aa000008-0000-0000-0000-000000000008', creator_id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Slack Standup Bot', slug: 'slack-standup-bot',
      description: 'Collects daily standups via Slack DMs and posts a formatted summary to your team channel.',
      long_description: 'Prompts team members at configurable times, aggregates responses, and highlights blockers.',
      category: 'productivity', tags: ['slack', 'standup', 'team', 'reporting'],
      system_prompt: 'You are a team standup facilitator.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'free', price_cents: 0, per_use_price_cents: 0, a2a_call_price_cents: 0,
      total_rentals: 312, active_rentals: 145, total_a2a_calls: 0, avg_rating: 4.3, review_count: 78, version: '1.1.0', published_at: ago(40),
    },
    {
      id: 'aa000009-0000-0000-0000-000000000009', creator_id: 'a1111111-1111-1111-1111-111111111111',
      name: 'Data Pipeline Monitor', slug: 'data-pipeline-monitor',
      description: 'Monitors ETL pipelines, detects anomalies, and alerts your team via Slack when issues arise.',
      long_description: 'Connects to your data warehouse and streaming pipelines to track data freshness and quality.',
      category: 'analytics', tags: ['monitoring', 'data', 'alerts', 'slack'],
      system_prompt: 'You are a data reliability engineer.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'monthly', price_cents: 3900, per_use_price_cents: 0, a2a_call_price_cents: 75,
      total_rentals: 45, active_rentals: 19, total_a2a_calls: 340, avg_rating: 4.6, review_count: 18, version: '1.0.0', published_at: ago(12),
    },
    {
      id: 'aa000010-0000-0000-0000-000000000010', creator_id: 'c3333333-3333-3333-3333-333333333333',
      name: 'Resume Screener', slug: 'resume-screener',
      description: 'Screens resumes against job descriptions, scores candidates, and generates shortlists.',
      long_description: 'Uses NLP to parse resumes, match skills to requirements, and rank applicants objectively.',
      category: 'hr', tags: ['resume', 'recruiting', 'screening', 'hr'],
      system_prompt: 'You are a talent acquisition specialist.', model: 'claude-sonnet-4-6-20250514',
      status: 'published', visibility: 'public', pricing_model: 'per_use', price_cents: 0, per_use_price_cents: 150, a2a_call_price_cents: 100,
      total_rentals: 28, active_rentals: 11, total_a2a_calls: 85, avg_rating: 4.7, review_count: 14, version: '1.0.0', published_at: ago(8),
    },
  ]);

  console.log('\n=== Seeding Reviews ===');
  await upsert('agent_reviews', [
    { agent_id: 'aa000001-0000-0000-0000-000000000001', reviewer_id: 'b2222222-2222-2222-2222-222222222222', rating: 5, title: 'Incredible time saver', body: 'Saved us 20+ hours per week on email responses. The contextual understanding is remarkable.', helpful_count: 12 },
    { agent_id: 'aa000001-0000-0000-0000-000000000001', reviewer_id: 'c3333333-3333-3333-3333-333333333333', rating: 4, title: 'Great with minor issues', body: 'Handles most cases perfectly. Occasionally needs manual review for complex queries.', helpful_count: 8 },
    { agent_id: 'aa000003-0000-0000-0000-000000000003', reviewer_id: 'b2222222-2222-2222-2222-222222222222', rating: 5, title: 'Best lead scoring tool', body: 'ROI was positive within the first week. Integrates seamlessly with our CRM.', helpful_count: 15 },
    { agent_id: 'aa000003-0000-0000-0000-000000000003', reviewer_id: 'a1111111-1111-1111-1111-111111111111', rating: 5, title: 'Perfect for our pipeline', body: 'Integrates seamlessly with HubSpot. Our sales team loves it.', helpful_count: 6 },
    { agent_id: 'aa000004-0000-0000-0000-000000000004', reviewer_id: 'b2222222-2222-2222-2222-222222222222', rating: 4, title: 'Good content quality', body: 'Posts are engaging and on-brand. Saves our marketing team hours every week.', helpful_count: 4 },
    { agent_id: 'aa000007-0000-0000-0000-000000000007', reviewer_id: 'c3333333-3333-3333-3333-333333333333', rating: 5, title: 'Catches bugs I missed', body: 'Found a critical security vulnerability in our auth flow. Worth every penny.', helpful_count: 22 },
    { agent_id: 'aa000007-0000-0000-0000-000000000007', reviewer_id: 'b2222222-2222-2222-2222-222222222222', rating: 5, title: 'Like having a senior dev on call', body: 'The inline comments are incredibly detailed and actionable.', helpful_count: 18 },
    { agent_id: 'aa000008-0000-0000-0000-000000000008', reviewer_id: 'a1111111-1111-1111-1111-111111111111', rating: 4, title: 'Simple but effective', body: 'Easy to set up. Our team actually does standups now.', helpful_count: 7 },
  ]);

  console.log('\n=== Seeding Rentals ===');
  await upsert('rentals', [
    { id: 'rr000001-0000-0000-0000-000000000001', agent_id: 'aa000001-0000-0000-0000-000000000001', renter_org_id: 'e5555555-5555-5555-5555-555555555555', renter_user_id: 'b2222222-2222-2222-2222-222222222222', status: 'active', monthly_price_cents: 2900, total_executions: 47, total_a2a_calls_made: 12, allowed_connection_ids: [], started_at: ago(30) },
    { id: 'rr000002-0000-0000-0000-000000000002', agent_id: 'aa000003-0000-0000-0000-000000000003', renter_org_id: 'e5555555-5555-5555-5555-555555555555', renter_user_id: 'b2222222-2222-2222-2222-222222222222', status: 'active', monthly_price_cents: 4900, total_executions: 23, total_a2a_calls_made: 8, allowed_connection_ids: [], started_at: ago(20) },
    { id: 'rr000003-0000-0000-0000-000000000003', agent_id: 'aa000007-0000-0000-0000-000000000007', renter_org_id: 'd4444444-4444-4444-4444-444444444444', renter_user_id: 'a1111111-1111-1111-1111-111111111111', status: 'active', monthly_price_cents: 0, total_executions: 85, total_a2a_calls_made: 30, allowed_connection_ids: [], started_at: ago(15) },
  ]);

  console.log('\n=== Seeding Executions ===');
  await upsert('agent_executions', [
    {
      rental_id: 'rr000001-0000-0000-0000-000000000001', agent_id: 'aa000001-0000-0000-0000-000000000001', org_id: 'e5555555-5555-5555-5555-555555555555',
      input_text: 'Reply to customer asking about enterprise pricing',
      status: 'completed',
      steps: [{ type: 'text', text: 'Loading ticket context...' }, { type: 'tool_call', tool_name: 'gmail__read', input: {}, output: { success: true }, duration_ms: 800 }, { type: 'text', text: 'Generated response.' }],
      result: { text: 'Successfully drafted and queued reply for review.' },
      total_tokens: 3420, total_tool_calls: 4, total_a2a_calls: 0, duration_ms: 4100, cost_cents: 12,
      started_at: ago(0.08), completed_at: ago(0.079),
    },
    {
      rental_id: 'rr000002-0000-0000-0000-000000000002', agent_id: 'aa000003-0000-0000-0000-000000000003', org_id: 'e5555555-5555-5555-5555-555555555555',
      input_text: 'Score new lead: Sarah Chen, VP Eng at DataStack',
      status: 'completed',
      steps: [{ type: 'text', text: 'Enriching lead...' }, { type: 'tool_call', tool_name: 'hubspot__create', input: {}, output: { success: true }, duration_ms: 950 }, { type: 'text', text: 'Lead scored 87/100.' }],
      result: { text: 'Lead Score: 87/100. Enterprise segment. Routed to #hot-leads.' },
      total_tokens: 4200, total_tool_calls: 6, total_a2a_calls: 2, duration_ms: 6900, cost_cents: 22,
      started_at: ago(0.04), completed_at: ago(0.039),
    },
    {
      rental_id: 'rr000001-0000-0000-0000-000000000001', agent_id: 'aa000001-0000-0000-0000-000000000001', org_id: 'e5555555-5555-5555-5555-555555555555',
      input_text: 'Handle urgent billing discrepancy email',
      status: 'failed',
      steps: [{ type: 'text', text: 'Reading email...' }, { type: 'tool_call', tool_name: 'gmail__read', input: {}, output: { success: false }, duration_ms: 300 }],
      result: null,
      total_tokens: 800, total_tool_calls: 1, total_a2a_calls: 0, duration_ms: 1200, cost_cents: 5,
      started_at: ago(0.12), completed_at: ago(0.119),
    },
    {
      rental_id: 'rr000001-0000-0000-0000-000000000001', agent_id: 'aa000001-0000-0000-0000-000000000001', org_id: 'e5555555-5555-5555-5555-555555555555',
      input_text: 'Classify and respond to 8 support emails',
      status: 'completed',
      steps: [{ type: 'text', text: 'Processing batch...' }, { type: 'tool_call', tool_name: 'gmail__list', input: {}, output: { success: true }, duration_ms: 1200 }, { type: 'text', text: 'Processed 8 emails.' }],
      result: { text: 'Processed 8 emails. 6 auto-replied, 2 flagged.' },
      total_tokens: 5200, total_tool_calls: 10, total_a2a_calls: 1, duration_ms: 8500, cost_cents: 22,
      started_at: ago(0.2), completed_at: ago(0.199),
    },
  ]);

  console.log('\n=== Seeding Creator Earnings ===');
  await upsert('creator_earnings', [
    { creator_id: 'a1111111-1111-1111-1111-111111111111', source: 'rental', agent_id: 'aa000001-0000-0000-0000-000000000001', gross_amount_cents: 2900, platform_fee_cents: 435, net_amount_cents: 2465, payout_status: 'paid', period_start: ago(60), period_end: ago(30), created_at: ago(30) },
    { creator_id: 'a1111111-1111-1111-1111-111111111111', source: 'rental', agent_id: 'aa000001-0000-0000-0000-000000000001', gross_amount_cents: 2900, platform_fee_cents: 435, net_amount_cents: 2465, payout_status: 'paid', period_start: ago(30), period_end: ago(0), created_at: ago(5) },
    { creator_id: 'a1111111-1111-1111-1111-111111111111', source: 'a2a_call', agent_id: 'aa000001-0000-0000-0000-000000000001', gross_amount_cents: 500, platform_fee_cents: 75, net_amount_cents: 425, payout_status: 'pending', period_start: ago(7), period_end: ago(0), created_at: ago(2) },
    { creator_id: 'c3333333-3333-3333-3333-333333333333', source: 'rental', agent_id: 'aa000003-0000-0000-0000-000000000003', gross_amount_cents: 4900, platform_fee_cents: 735, net_amount_cents: 4165, payout_status: 'paid', period_start: ago(30), period_end: ago(0), created_at: ago(3) },
    { creator_id: 'c3333333-3333-3333-3333-333333333333', source: 'rental', agent_id: 'aa000004-0000-0000-0000-000000000004', gross_amount_cents: 1900, platform_fee_cents: 285, net_amount_cents: 1615, payout_status: 'processing', period_start: ago(30), period_end: ago(0), created_at: ago(1) },
  ]);

  console.log('\n=== Seeding Workflows ===');
  await upsert('workflows', [
    { org_id: 'e5555555-5555-5555-5555-555555555555', name: 'Inbound Support Pipeline', description: 'Classify emails, draft responses, escalate urgent issues', agent_ids: ['aa000001-0000-0000-0000-000000000001'], trigger_type: 'webhook', status: 'active', assembled_by_ai: true },
    { org_id: 'e5555555-5555-5555-5555-555555555555', name: 'Daily Lead Scoring', description: 'Score new leads and route to sales', agent_ids: ['aa000003-0000-0000-0000-000000000003'], trigger_type: 'schedule', schedule_cron: '0 9 * * *', status: 'active', assembled_by_ai: false },
    { org_id: 'd4444444-4444-4444-4444-444444444444', name: 'Content Publishing Engine', description: 'Generate and schedule social media posts', agent_ids: ['aa000004-0000-0000-0000-000000000004'], trigger_type: 'schedule', schedule_cron: '0 10 * * 1', status: 'paused', assembled_by_ai: true },
  ]);

  console.log('\n=== Done! ===');
}

seed().catch(e => { console.error('Fatal:', e); process.exit(1); });
