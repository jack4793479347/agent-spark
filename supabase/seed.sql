-- ============================================================
-- Agent Spark — Dev Seed Data
-- Run with: supabase db reset (applies migrations + seed)
-- ============================================================

-- Note: connector_types are already seeded in the migration.
-- This seed creates test users, orgs, agents, rentals, executions, and earnings.

-- ============================================================
-- TEST USERS (via Supabase auth.users + profiles)
-- These use fixed UUIDs for referential integrity.
-- ============================================================

-- User 1: Alice (creator + renter)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_sent_at)
VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'alice@agentspark.dev',
  '{"full_name": "Alice Chen"}'::jsonb,
  NOW(), NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, role, onboarding_completed)
VALUES ('a1111111-1111-1111-1111-111111111111', 'Alice Chen', 'creator', true)
ON CONFLICT (id) DO NOTHING;

-- User 2: Bob (renter)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_sent_at)
VALUES (
  'b2222222-2222-2222-2222-222222222222',
  'bob@agentspark.dev',
  '{"full_name": "Bob Martinez"}'::jsonb,
  NOW(), NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, role, onboarding_completed)
VALUES ('b2222222-2222-2222-2222-222222222222', 'Bob Martinez', 'user', true)
ON CONFLICT (id) DO NOTHING;

-- User 3: Carol (creator)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role, encrypted_password, email_confirmed_at, confirmation_sent_at)
VALUES (
  'c3333333-3333-3333-3333-333333333333',
  'carol@agentspark.dev',
  '{"full_name": "Carol Park"}'::jsonb,
  NOW(), NOW(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  crypt('password123', gen_salt('bf')),
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, role, onboarding_completed)
VALUES ('c3333333-3333-3333-3333-333333333333', 'Carol Park', 'creator', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ORGANIZATIONS
-- ============================================================

INSERT INTO organizations (id, name, slug, owner_id, plan)
VALUES
  ('d4444444-4444-4444-4444-444444444444', 'Alice''s Workspace', 'alice-workspace', 'a1111111-1111-1111-1111-111111111111', 'pro'),
  ('e5555555-5555-5555-5555-555555555555', 'Bob''s Team', 'bob-team', 'b2222222-2222-2222-2222-222222222222', 'starter'),
  ('f6666666-6666-6666-6666-666666666666', 'Carol Studios', 'carol-studios', 'c3333333-3333-3333-3333-333333333333', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org_members (org_id, user_id, role)
VALUES
  ('d4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111', 'owner'),
  ('e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'owner'),
  ('f6666666-6666-6666-6666-666666666666', 'c3333333-3333-3333-3333-333333333333', 'owner')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- ============================================================
-- PUBLISHED AGENTS (6 agents across categories)
-- ============================================================

INSERT INTO agents (id, creator_id, name, slug, description, long_description, category, tags, system_prompt, model, status, visibility, pricing_model, price_cents, per_use_price_cents, a2a_call_price_cents, total_rentals, active_rentals, total_a2a_calls, avg_rating, review_count, version, published_at)
VALUES
  ('aa000001-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111',
   'Smart Email Responder', 'smart-email-responder',
   'Automatically drafts contextual replies to customer emails using your knowledge base.',
   'Uses your connected Gmail and knowledge base to understand context, draft professional replies, and queue them for review.',
   'customer-support', ARRAY['email', 'gmail', 'support', 'auto-reply'],
   'You are a professional email assistant. Draft contextual, helpful replies.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 2900, 0, 50,
   142, 45, 520, 4.8, 89, '2.1.0', NOW() - INTERVAL '60 days'),

  ('aa000002-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111',
   'Shopify Returns Handler', 'shopify-returns-handler',
   'Processes Shopify return requests, generates labels, and notifies customers automatically.',
   'Connects to your Shopify store to handle return requests end-to-end.',
   'ecommerce', ARRAY['shopify', 'returns', 'ecommerce', 'fulfillment'],
   'You are a Shopify returns specialist.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'per_use', 0, 100, 75,
   87, 32, 310, 4.6, 52, '1.4.2', NOW() - INTERVAL '45 days'),

  ('aa000003-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333',
   'Lead Qualifier Pro', 'lead-qualifier-pro',
   'Scores inbound leads, enriches profiles, and routes hot prospects to your sales team.',
   'Combines LinkedIn, Crunchbase, and CRM data to score leads on a 0-100 scale.',
   'sales', ARRAY['leads', 'crm', 'hubspot', 'scoring', 'sales'],
   'You are a lead qualification specialist.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 4900, 0, 100,
   64, 18, 245, 4.9, 38, '3.0.1', NOW() - INTERVAL '30 days'),

  ('aa000004-0000-0000-0000-000000000004', 'c3333333-3333-3333-3333-333333333333',
   'Social Content Creator', 'social-content-creator',
   'Generates social media posts, captions, and hashtags for multiple platforms.',
   'Creates platform-optimized content for Twitter/X, LinkedIn, and Instagram.',
   'marketing', ARRAY['social', 'content', 'marketing', 'writing'],
   'You are a social media strategist.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'per_use', 0, 50, 25,
   156, 58, 890, 4.5, 67, '1.2.0', NOW() - INTERVAL '20 days'),

  ('aa000005-0000-0000-0000-000000000005', 'c3333333-3333-3333-3333-333333333333',
   'Invoice Reconciler', 'invoice-reconciler',
   'Extracts invoice data from emails, cross-references with Stripe, and flags discrepancies.',
   'Monitors Gmail for invoices, extracts data, matches against Stripe payments.',
   'finance', ARRAY['invoice', 'stripe', 'accounting', 'document'],
   'You are a financial reconciliation assistant.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 1900, 0, 50,
   34, 12, 95, 4.7, 21, '1.0.0', NOW() - INTERVAL '15 days'),

  ('aa000006-0000-0000-0000-000000000006', 'a1111111-1111-1111-1111-111111111111',
   'Meeting Summarizer', 'meeting-summarizer',
   'Records, transcribes, and summarizes meetings with action items.',
   'Integrates with Google Calendar, produces structured summaries.',
   'productivity', ARRAY['calendar', 'meeting', 'notion', 'slack'],
   'You are a meeting assistant.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 1900, 0, 50,
   3800, 120, 450, 4.7, 95, '1.3.0', NOW() - INTERVAL '40 days'),

  ('aa000007-0000-0000-0000-000000000007', 'a1111111-1111-1111-1111-111111111111',
   'SEO Content Writer', 'seo-writer',
   'Researches keywords, writes optimized blog posts with proper structure, drafts meta descriptions.',
   'Uses search data to plan content, writes SEO-optimized articles with keyword placement.',
   'marketing', ARRAY['seo', 'content', 'writing', 'blog'],
   'You are an SEO content specialist. Write well-structured blog posts optimized for search engines.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 2900, 0, 50,
   1800, 65, 320, 4.6, 72, '2.0.0', NOW() - INTERVAL '50 days'),

  ('aa000008-0000-0000-0000-000000000008', 'c3333333-3333-3333-3333-333333333333',
   'Order Tracker', 'order-tracker',
   'Monitors orders in real-time, sends proactive shipping updates, handles delivery exceptions.',
   'Connects to Shopify and shipping APIs to provide real-time order status.',
   'ecommerce', ARRAY['orders', 'shipping', 'shopify', 'tracking'],
   'You are an order tracking specialist. Monitor shipments and proactively notify customers.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 1900, 0, 50,
   3200, 110, 680, 4.9, 150, '1.5.0', NOW() - INTERVAL '55 days'),

  ('aa000009-0000-0000-0000-000000000009', 'a1111111-1111-1111-1111-111111111111',
   'Bug Triage Bot', 'bug-triage',
   'Monitors error logs, deduplicates issues, assigns severity, creates tickets in Linear or Jira.',
   'Watches error tracking services, categorizes bugs, and auto-creates actionable tickets.',
   'engineering', ARRAY['bugs', 'triage', 'linear', 'jira', 'errors'],
   'You are a bug triage specialist. Categorize, deduplicate, and prioritize software bugs.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'free', 0, 0, 0,
   5100, 200, 0, 4.7, 180, '2.2.0', NOW() - INTERVAL '90 days'),

  ('aa000010-0000-0000-0000-000000000010', 'c3333333-3333-3333-3333-333333333333',
   'Slack Standup Bot', 'slack-standup',
   'Collects async standups from your team, posts a clean daily digest to any channel.',
   'Prompts team members for status updates and compiles a readable digest.',
   'productivity', ARRAY['slack', 'standup', 'team', 'async'],
   'You are a standup facilitator. Collect team updates and produce clear daily digests.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'free', 0, 0, 0,
   4200, 180, 0, 4.5, 130, '1.1.0', NOW() - INTERVAL '70 days'),

  ('aa000011-0000-0000-0000-000000000011', 'a1111111-1111-1111-1111-111111111111',
   'Resume Screener', 'resume-screener',
   'Parses resumes, scores candidates against job requirements, generates shortlists with explanations.',
   'Analyzes resumes against job descriptions and produces ranked candidate shortlists.',
   'hr', ARRAY['resume', 'hiring', 'screening', 'candidates'],
   'You are a talent screening specialist. Evaluate resumes against job requirements objectively.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 3900, 0, 75,
   720, 28, 95, 4.3, 35, '1.0.0', NOW() - INTERVAL '25 days'),

  ('aa000012-0000-0000-0000-000000000012', 'c3333333-3333-3333-3333-333333333333',
   'Support Responder', 'customer-support',
   'Handles tier-1 support tickets, suggests solutions from knowledge base, escalates complex issues.',
   'Uses your help center docs to draft responses and auto-resolve common tickets.',
   'customer-support', ARRAY['support', 'helpdesk', 'tickets', 'customer'],
   'You are a customer support agent. Resolve tickets efficiently using the knowledge base.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 2900, 0, 50,
   2900, 95, 420, 4.8, 110, '2.0.0', NOW() - INTERVAL '65 days'),

  ('aa000013-0000-0000-0000-000000000013', 'a1111111-1111-1111-1111-111111111111',
   'Data Insights Agent', 'data-analyst',
   'Connects to your data sources, runs automated analysis, generates weekly insight reports.',
   'Queries databases, detects trends, and produces readable reports with charts.',
   'analytics', ARRAY['data', 'analytics', 'reports', 'insights'],
   'You are a data analyst. Analyze data, identify trends, and produce actionable insights.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 4900, 0, 100,
   650, 22, 180, 4.5, 28, '1.2.0', NOW() - INTERVAL '20 days'),

  ('aa000014-0000-0000-0000-000000000014', 'c3333333-3333-3333-3333-333333333333',
   'Competitor Monitor', 'competitor-monitor',
   'Tracks competitor websites, pricing changes, product launches, and social media activity.',
   'Monitors web pages and social accounts for competitive intelligence.',
   'analytics', ARRAY['competitors', 'monitoring', 'intel', 'market'],
   'You are a competitive intelligence analyst. Track and report on competitor activities.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 3900, 0, 75,
   510, 18, 120, 4.4, 22, '1.0.0', NOW() - INTERVAL '18 days'),

  ('aa000015-0000-0000-0000-000000000015', 'a1111111-1111-1111-1111-111111111111',
   'Contract Reviewer', 'contract-reviewer',
   'Scans contracts for risk clauses, missing terms, and compliance issues. Flags items for review.',
   'Analyzes legal documents and highlights areas needing attention.',
   'finance', ARRAY['contracts', 'legal', 'compliance', 'review'],
   'You are a contract review specialist. Identify risks, missing clauses, and compliance issues.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 5900, 0, 100,
   340, 12, 65, 4.6, 18, '1.0.0', NOW() - INTERVAL '12 days'),

  ('aa000016-0000-0000-0000-000000000016', 'c3333333-3333-3333-3333-333333333333',
   'Ad Copy Generator', 'ad-copywriter',
   'Creates ad variations for Google, Meta, and LinkedIn. A/B tests headlines and CTAs.',
   'Generates platform-specific ad copy with multiple headline and description variants.',
   'marketing', ARRAY['ads', 'copywriting', 'google', 'meta', 'linkedin'],
   'You are an advertising copywriter. Create compelling ad copy optimized for each platform.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 2900, 0, 50,
   1100, 40, 280, 4.3, 45, '1.1.0', NOW() - INTERVAL '35 days'),

  ('aa000017-0000-0000-0000-000000000017', 'a1111111-1111-1111-1111-111111111111',
   'Inventory Optimizer', 'inventory-manager',
   'Monitors stock levels, predicts demand, generates reorder alerts, prevents stockouts.',
   'Connects to inventory systems and uses historical data for demand forecasting.',
   'ecommerce', ARRAY['inventory', 'stock', 'forecasting', 'reorder'],
   'You are an inventory management specialist. Monitor stock and predict demand.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 3900, 0, 75,
   780, 25, 150, 4.5, 30, '1.0.0', NOW() - INTERVAL '28 days'),

  ('aa000018-0000-0000-0000-000000000018', 'c3333333-3333-3333-3333-333333333333',
   'Employee Onboarder', 'onboarding-agent',
   'Guides new hires through onboarding steps, sends reminders, collects documents, schedules intros.',
   'Automates the employee onboarding workflow from offer acceptance to first week.',
   'hr', ARRAY['onboarding', 'hr', 'hiring', 'workflow'],
   'You are an onboarding coordinator. Guide new employees through each step smoothly.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 1900, 0, 50,
   620, 20, 85, 4.4, 25, '1.0.0', NOW() - INTERVAL '22 days'),

  ('aa000019-0000-0000-0000-000000000019', 'a1111111-1111-1111-1111-111111111111',
   'Churn Predictor', 'churn-predictor',
   'Analyzes usage patterns and engagement signals to identify at-risk customers before they leave.',
   'Monitors product usage and customer engagement to flag churn risks early.',
   'analytics', ARRAY['churn', 'retention', 'analytics', 'customer'],
   'You are a customer retention analyst. Identify at-risk accounts and recommend retention actions.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 4900, 0, 100,
   430, 15, 110, 4.6, 20, '1.0.0', NOW() - INTERVAL '16 days'),

  ('aa000020-0000-0000-0000-000000000020', 'c3333333-3333-3333-3333-333333333333',
   'PR & Mentions Monitor', 'pr-monitor',
   'Scans news, blogs, and social for brand mentions. Alerts on negative sentiment, tracks coverage.',
   'Monitors media channels for brand mentions and sentiment analysis.',
   'marketing', ARRAY['pr', 'mentions', 'sentiment', 'media'],
   'You are a PR monitoring specialist. Track brand mentions and analyze sentiment.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'monthly', 2900, 0, 50,
   890, 30, 200, 4.3, 35, '1.0.0', NOW() - INTERVAL '30 days'),

  ('aa000021-0000-0000-0000-000000000021', 'a1111111-1111-1111-1111-111111111111',
   'Code Review Agent', 'code-reviewer',
   'Reviews PRs for bugs, security issues, and style violations. Suggests improvements inline.',
   'Analyzes pull request diffs and provides actionable code review comments.',
   'engineering', ARRAY['code-review', 'github', 'security', 'quality'],
   'You are a senior code reviewer. Review code for bugs, security issues, and best practices.', 'claude-sonnet-4-6-20250514',
   'published', 'public', 'free', 0, 0, 0,
   6200, 250, 0, 4.8, 200, '3.0.0', NOW() - INTERVAL '100 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AGENT REVIEWS
-- ============================================================

INSERT INTO agent_reviews (id, agent_id, reviewer_id, rental_id, rating, title, body, helpful_count)
VALUES
  (gen_random_uuid(), 'aa000001-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', NULL, 5, 'Incredible time saver', 'Saved us 20+ hours per week on email responses.', 12),
  (gen_random_uuid(), 'aa000001-0000-0000-0000-000000000001', 'c3333333-3333-3333-3333-333333333333', NULL, 4, 'Great with minor issues', 'Handles most cases perfectly.', 8),
  (gen_random_uuid(), 'aa000003-0000-0000-0000-000000000003', 'b2222222-2222-2222-2222-222222222222', NULL, 5, 'Best lead scoring tool', 'ROI was positive within the first week.', 15),
  (gen_random_uuid(), 'aa000003-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', NULL, 5, 'Perfect for our pipeline', 'Integrates seamlessly with HubSpot.', 6),
  (gen_random_uuid(), 'aa000004-0000-0000-0000-000000000004', 'b2222222-2222-2222-2222-222222222222', NULL, 4, 'Good content quality', 'Posts are engaging and on-brand.', 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- RENTALS (Bob rents Alice's and Carol's agents)
-- ============================================================

INSERT INTO rentals (id, agent_id, renter_org_id, renter_user_id, status, monthly_price_cents, total_executions, total_a2a_calls_made, allowed_connection_ids, started_at)
VALUES
  ('rr000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'active', 2900, 47, 12, ARRAY[]::TEXT[], NOW() - INTERVAL '30 days'),
  ('rr000002-0000-0000-0000-000000000002', 'aa000003-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222', 'active', 4900, 23, 8, ARRAY[]::TEXT[], NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AGENT EXECUTIONS
-- ============================================================

INSERT INTO agent_executions (id, rental_id, agent_id, org_id, input_text, status, steps, result, total_tokens, total_tool_calls, total_a2a_calls, duration_ms, cost_cents, started_at, completed_at)
VALUES
  (gen_random_uuid(), 'rr000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555',
   'Reply to customer asking about enterprise pricing',
   'completed',
   '[{"type":"text","text":"Loading ticket context..."},{"type":"tool_call","tool_name":"gmail__read","input":{},"output":{"success":true},"duration_ms":800},{"type":"text","text":"Generated response."}]'::jsonb,
   '{"text":"Successfully drafted and queued reply for review."}'::jsonb,
   3420, 4, 0, 4100, 12, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours' + INTERVAL '4.1 seconds'),

  (gen_random_uuid(), 'rr000002-0000-0000-0000-000000000002', 'aa000003-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555555',
   'Score new lead: Sarah Chen, VP Eng at DataStack',
   'completed',
   '[{"type":"text","text":"Enriching lead..."},{"type":"tool_call","tool_name":"hubspot__create","input":{},"output":{"success":true},"duration_ms":950},{"type":"text","text":"Lead scored 87/100."}]'::jsonb,
   '{"text":"Lead Score: 87/100. Enterprise segment. Routed to #hot-leads."}'::jsonb,
   4200, 6, 2, 6900, 22, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour' + INTERVAL '6.9 seconds'),

  (gen_random_uuid(), 'rr000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555',
   'Handle urgent billing discrepancy email',
   'failed',
   '[{"type":"text","text":"Reading email..."},{"type":"tool_call","tool_name":"gmail__read","input":{},"output":{"success":false},"duration_ms":300}]'::jsonb,
   NULL, 800, 1, 0, 1200, 5, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours' + INTERVAL '1.2 seconds'),

  (gen_random_uuid(), 'rr000001-0000-0000-0000-000000000001', 'aa000001-0000-0000-0000-000000000001', 'e5555555-5555-5555-5555-555555555555',
   'Classify and respond to 8 support emails',
   'completed',
   '[{"type":"text","text":"Processing batch..."},{"type":"tool_call","tool_name":"gmail__list","input":{},"output":{"success":true},"duration_ms":1200},{"type":"text","text":"Processed 8 emails."}]'::jsonb,
   '{"text":"Processed 8 emails. 6 auto-replied, 2 flagged."}'::jsonb,
   5200, 10, 1, 8500, 22, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours' + INTERVAL '8.5 seconds'),

  (gen_random_uuid(), 'rr000002-0000-0000-0000-000000000002', 'aa000003-0000-0000-0000-000000000003', 'e5555555-5555-5555-5555-555555555555',
   'Score batch of 5 form submissions',
   'completed',
   '[{"type":"text","text":"Processing 5 leads..."},{"type":"tool_call","tool_name":"hubspot__batch","input":{},"output":{"success":true},"duration_ms":2400},{"type":"text","text":"Scored all 5 leads."}]'::jsonb,
   '{"text":"2 hot leads, 1 warm, 2 nurture."}'::jsonb,
   6800, 8, 3, 12000, 35, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '12 seconds')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CREATOR EARNINGS
-- ============================================================

INSERT INTO creator_earnings (id, creator_id, source, agent_id, gross_amount_cents, platform_fee_cents, net_amount_cents, payout_status, period_start, period_end, created_at)
VALUES
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'rental', 'aa000001-0000-0000-0000-000000000001', 2900, 435, 2465, 'paid', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'rental', 'aa000001-0000-0000-0000-000000000001', 2900, 435, 2465, 'paid', NOW() - INTERVAL '30 days', NOW(), NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'a1111111-1111-1111-1111-111111111111', 'a2a_call', 'aa000001-0000-0000-0000-000000000001', 500, 75, 425, 'pending', NOW() - INTERVAL '7 days', NOW(), NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'rental', 'aa000003-0000-0000-0000-000000000003', 4900, 735, 4165, 'paid', NOW() - INTERVAL '30 days', NOW(), NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'rental', 'aa000004-0000-0000-0000-000000000004', 1900, 285, 1615, 'processing', NOW() - INTERVAL '30 days', NOW(), NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), 'c3333333-3333-3333-3333-333333333333', 'a2a_call', 'aa000003-0000-0000-0000-000000000003', 800, 120, 680, 'pending', NOW() - INTERVAL '14 days', NOW(), NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- WORKFLOWS
-- ============================================================

INSERT INTO workflows (id, org_id, name, description, agent_ids, trigger_type, schedule_cron, status, assembled_by_ai)
VALUES
  (gen_random_uuid(), 'e5555555-5555-5555-5555-555555555555', 'Inbound Support Pipeline', 'Classify emails, draft responses, escalate urgent issues', ARRAY['aa000001-0000-0000-0000-000000000001']::UUID[], 'webhook', NULL, 'active', true),
  (gen_random_uuid(), 'e5555555-5555-5555-5555-555555555555', 'Daily Lead Scoring', 'Score new leads and route to sales', ARRAY['aa000003-0000-0000-0000-000000000003']::UUID[], 'schedule', '0 9 * * *', 'active', false),
  (gen_random_uuid(), 'd4444444-4444-4444-4444-444444444444', 'Content Publishing Engine', 'Generate and schedule social media posts', ARRAY['aa000004-0000-0000-0000-000000000004']::UUID[], 'schedule', '0 10 * * 1', 'paused', true)
ON CONFLICT DO NOTHING;
