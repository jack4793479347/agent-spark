-- ============================================================
-- Agent Spark — Initial Schema Migration
-- All tables, RLS policies, indexes, triggers from PRD §5-6
-- ============================================================

-- ============================================================
-- USERS & ORGANIZATIONS
-- ============================================================

-- Profiles extend Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  stripe_customer_id TEXT,
  stripe_connect_account_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (multi-tenancy for teams)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  tasks_used_this_period INTEGER DEFAULT 0,
  a2a_calls_used_this_period INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- CONNECTORS & CREDENTIALS
-- ============================================================

-- Available connector types (system-level)
CREATE TABLE connector_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'webhook')),
  oauth_config JSONB,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's connected tools (one per connector per org)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  connector_type_id TEXT REFERENCES connector_types(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  credential_vault_id TEXT NOT NULL,
  scopes TEXT[],
  metadata JSONB,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  UNIQUE(org_id, connector_type_id)
);

-- ============================================================
-- AGENTS & MARKETPLACE
-- ============================================================

-- Agents (core entity — created by builders)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Agent identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  icon_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[],

  -- Agent configuration
  system_prompt TEXT NOT NULL,
  model TEXT DEFAULT 'claude-opus-4-6-20250918',
  required_connectors TEXT[],
  optional_connectors TEXT[],

  -- A2A Agent Card (auto-generated, stored for fast lookups)
  a2a_agent_card JSONB NOT NULL DEFAULT '{}'::jsonb,
  a2a_endpoint TEXT,

  -- Agent capabilities (for discovery and matching)
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  capability_embeddings TEXT,

  -- Marketplace listing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'published', 'suspended', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),

  -- Pricing
  pricing_model TEXT DEFAULT 'monthly' CHECK (pricing_model IN ('free', 'monthly', 'per_use', 'tiered')),
  price_cents INTEGER DEFAULT 0,
  per_use_price_cents INTEGER DEFAULT 0,
  a2a_call_price_cents INTEGER DEFAULT 1,

  -- Stats (denormalized for performance)
  total_rentals INTEGER DEFAULT 0,
  active_rentals INTEGER DEFAULT 0,
  total_a2a_calls INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,

  -- Radar chart stats (auto-calculated, 0-99 each)
  stats JSONB DEFAULT '{"speed": 50, "accuracy": 50, "reliability": 50, "popularity": 0, "versatility": 0}'::jsonb,
  stats_updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Versioning
  version TEXT DEFAULT '1.0.0',
  changelog JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Agent reviews
CREATE TABLE agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, reviewer_id)
);

-- ============================================================
-- RENTALS & USAGE
-- ============================================================

-- When a user/org subscribes to use an agent
CREATE TABLE rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  renter_org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  renter_user_id UUID REFERENCES profiles(id),

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),

  -- Billing
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_price_cents INTEGER NOT NULL,

  -- Usage tracking
  total_executions INTEGER DEFAULT 0,
  total_a2a_calls_made INTEGER DEFAULT 0,
  total_a2a_calls_received INTEGER DEFAULT 0,

  -- Permissions (which of the org's connections this agent can use)
  allowed_connection_ids UUID[],

  started_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(agent_id, renter_org_id)
);

-- Individual agent execution log
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  org_id UUID REFERENCES organizations(id),

  -- Task details
  input_text TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'awaiting_approval', 'completed', 'failed', 'cancelled')),

  -- Execution trace
  steps JSONB,
  result JSONB,
  error TEXT,

  -- Metrics
  total_tokens INTEGER DEFAULT 0,
  total_tool_calls INTEGER DEFAULT 0,
  total_a2a_calls INTEGER DEFAULT 0,
  duration_ms INTEGER,
  cost_cents INTEGER DEFAULT 0,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- A2A (AGENT-TO-AGENT) CALLS
-- ============================================================

CREATE TABLE a2a_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Caller
  caller_agent_id UUID REFERENCES agents(id),
  caller_execution_id UUID REFERENCES agent_executions(id),
  caller_org_id UUID REFERENCES organizations(id),

  -- Target
  target_agent_id UUID REFERENCES agents(id),

  -- Task
  task_description TEXT NOT NULL,
  input_payload JSONB,
  output_payload JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'timeout')),

  -- Billing
  cost_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  creator_earning_cents INTEGER NOT NULL,

  -- Metrics
  duration_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- WORKFLOWS
-- ============================================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),

  name TEXT NOT NULL,
  description TEXT,

  -- Which agents are in this workflow
  agent_ids UUID[] NOT NULL,

  -- Configuration
  trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'schedule', 'webhook', 'event')),
  trigger_config JSONB,

  -- Assembly metadata (if created by AI Workflow Assembler)
  assembled_by_ai BOOLEAN DEFAULT FALSE,
  assembly_prompt TEXT,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREATOR EARNINGS
-- ============================================================

CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  source TEXT NOT NULL CHECK (source IN ('rental', 'a2a_call', 'bonus')),
  source_id UUID,
  agent_id UUID REFERENCES agents(id),

  gross_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,

  -- Payout tracking
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id TEXT,

  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPROVAL QUEUE (for sensitive agent actions)
-- ============================================================

CREATE TABLE approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES agent_executions(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id),

  action_type TEXT NOT NULL,
  action_details JSONB NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW-LEVEL SECURITY POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2a_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, edit only their own
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations: members can view, owners can edit
CREATE POLICY "Org members can view"
  ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org owners can update"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());
CREATE POLICY "Users can create orgs"
  ON organizations FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Org members
CREATE POLICY "Org members can view members"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org owners can manage members"
  ON org_members FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));
CREATE POLICY "Users can insert own membership"
  ON org_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Connector types: everyone can read (system-level)
CREATE POLICY "Connector types are public"
  ON connector_types FOR SELECT USING (true);

-- Connections: only org members can view/manage their connections
CREATE POLICY "Org members can view connections"
  ON connections FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org admins can manage connections"
  ON connections FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));

-- Agents: published agents are public, drafts only visible to creator
CREATE POLICY "Published agents are public"
  ON agents FOR SELECT
  USING (status = 'published' AND visibility = 'public');
CREATE POLICY "Creators can manage own agents"
  ON agents FOR ALL
  USING (creator_id = auth.uid());

-- Agent reviews: anyone can read, renters can write
CREATE POLICY "Reviews are public"
  ON agent_reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage own reviews"
  ON agent_reviews FOR ALL
  USING (reviewer_id = auth.uid());

-- Rentals: only the renting org can see their rentals
CREATE POLICY "Renters can view own rentals"
  ON rentals FOR SELECT
  USING (renter_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can create rentals"
  ON rentals FOR INSERT
  WITH CHECK (renter_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own rentals"
  ON rentals FOR UPDATE
  USING (renter_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Agent executions: only the org that triggered can view
CREATE POLICY "Org members can view executions"
  ON agent_executions FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can create executions"
  ON agent_executions FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- A2A calls: visible to caller org
CREATE POLICY "Caller org can view a2a calls"
  ON a2a_calls FOR SELECT
  USING (caller_org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Workflows: org members can manage
CREATE POLICY "Org members can view workflows"
  ON workflows FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
CREATE POLICY "Org members can manage workflows"
  ON workflows FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Creator earnings: only the creator can see their earnings
CREATE POLICY "Creators can view own earnings"
  ON creator_earnings FOR SELECT
  USING (creator_id = auth.uid());

-- Approval queue: org members can view/act on their approvals
CREATE POLICY "Org members can manage approvals"
  ON approval_queue FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================
-- INDEXES
-- ============================================================

-- Marketplace search & browse
CREATE INDEX idx_agents_status_category ON agents(status, category) WHERE status = 'published';
CREATE INDEX idx_agents_tags ON agents USING GIN(tags);
CREATE INDEX idx_agents_avg_rating ON agents(avg_rating DESC) WHERE status = 'published';
CREATE INDEX idx_agents_total_rentals ON agents(total_rentals DESC) WHERE status = 'published';
CREATE INDEX idx_agents_creator ON agents(creator_id);
CREATE INDEX idx_agents_slug ON agents(slug);

-- Rental lookups
CREATE INDEX idx_rentals_org ON rentals(renter_org_id) WHERE status = 'active';
CREATE INDEX idx_rentals_agent ON rentals(agent_id) WHERE status = 'active';

-- A2A call lookups
CREATE INDEX idx_a2a_calls_caller ON a2a_calls(caller_agent_id);
CREATE INDEX idx_a2a_calls_target ON a2a_calls(target_agent_id);
CREATE INDEX idx_a2a_calls_execution ON a2a_calls(caller_execution_id);

-- Earnings
CREATE INDEX idx_earnings_creator ON creator_earnings(creator_id, created_at DESC);
CREATE INDEX idx_earnings_payout ON creator_earnings(payout_status) WHERE payout_status = 'pending';

-- Executions
CREATE INDEX idx_executions_rental ON agent_executions(rental_id);
CREATE INDEX idx_executions_status ON agent_executions(status) WHERE status IN ('queued', 'running');

-- Org members
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_org ON org_members(org_id);

-- Connections
CREATE INDEX idx_connections_org ON connections(org_id);

-- Workflows
CREATE INDEX idx_workflows_org ON workflows(org_id);

-- Approval queue
CREATE INDEX idx_approval_queue_org ON approval_queue(org_id) WHERE status = 'pending';
CREATE INDEX idx_approval_queue_execution ON approval_queue(execution_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agent_reviews_updated_at
  BEFORE UPDATE ON agent_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile + default org on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
  user_slug TEXT;
BEGIN
  -- Extract display name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  user_slug := LOWER(REPLACE(user_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::TEXT, 1, 8);

  -- Create profile
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default "Personal" organization
  INSERT INTO public.organizations (name, slug, owner_id)
  VALUES (user_name || '''s Workspace', user_slug, NEW.id)
  RETURNING id INTO new_org_id;

  -- Add user as owner of their org
  INSERT INTO public.org_members (org_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Increment agent rental count
CREATE OR REPLACE FUNCTION increment_agent_rentals(agent_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET total_rentals = total_rentals + 1,
      active_rentals = active_rentals + 1
  WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql;

-- Decrement active rentals on cancel
CREATE OR REPLACE FUNCTION decrement_active_rentals(agent_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET active_rentals = GREATEST(0, active_rentals - 1)
  WHERE id = agent_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update agent avg_rating and review_count on review insert/update/delete
CREATE OR REPLACE FUNCTION update_agent_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_agent_id UUID;
BEGIN
  target_agent_id := COALESCE(NEW.agent_id, OLD.agent_id);

  UPDATE agents
  SET avg_rating = COALESCE(
        (SELECT AVG(rating)::NUMERIC(3,2) FROM agent_reviews WHERE agent_id = target_agent_id),
        0
      ),
      review_count = (SELECT COUNT(*) FROM agent_reviews WHERE agent_id = target_agent_id)
  WHERE id = target_agent_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_review_stats_insert
  AFTER INSERT ON agent_reviews
  FOR EACH ROW EXECUTE FUNCTION update_agent_review_stats();

CREATE TRIGGER agent_review_stats_update
  AFTER UPDATE ON agent_reviews
  FOR EACH ROW EXECUTE FUNCTION update_agent_review_stats();

CREATE TRIGGER agent_review_stats_delete
  AFTER DELETE ON agent_reviews
  FOR EACH ROW EXECUTE FUNCTION update_agent_review_stats();

-- Calculate agent stats (radar chart)
CREATE OR REPLACE FUNCTION calculate_agent_stats(agent_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result_stats JSONB;
  exec_count INTEGER;
  success_count INTEGER;
  avg_duration_ms INTEGER;
  category_avg_ms INTEGER;
  active_rental_count INTEGER;
  connector_count INTEGER;
BEGIN
  -- Get execution metrics (last 30 days)
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed'), AVG(duration_ms)::INTEGER
  INTO exec_count, success_count, avg_duration_ms
  FROM agent_executions WHERE agent_id = agent_uuid AND started_at > NOW() - INTERVAL '30 days';

  -- Category average speed
  SELECT AVG(ae.duration_ms)::INTEGER INTO category_avg_ms
  FROM agent_executions ae JOIN agents a ON ae.agent_id = a.id
  WHERE a.category = (SELECT category FROM agents WHERE id = agent_uuid)
  AND ae.started_at > NOW() - INTERVAL '30 days';

  -- Active rentals
  SELECT COUNT(*) INTO active_rental_count FROM rentals WHERE agent_id = agent_uuid AND status = 'active';

  -- Connector count
  SELECT COALESCE(array_length(required_connectors, 1), 0) + COALESCE(array_length(optional_connectors, 1), 0)
  INTO connector_count FROM agents WHERE id = agent_uuid;

  result_stats := jsonb_build_object(
    'speed', CASE WHEN exec_count = 0 THEN 50
             WHEN COALESCE(category_avg_ms, 0) = 0 THEN 50
             ELSE LEAST(99, GREATEST(0, 99 - ((avg_duration_ms - category_avg_ms) * 50 / GREATEST(category_avg_ms, 1)))) END,
    'accuracy', CASE WHEN exec_count = 0 THEN 50
                ELSE LEAST(99, (success_count * 99 / exec_count)) END,
    'reliability', CASE WHEN exec_count < 10 THEN 50
                   ELSE LEAST(99, (success_count * 99 / exec_count)) END,
    'popularity', LEAST(99, active_rental_count * 10),
    'versatility', LEAST(99, connector_count * 16)
  );

  -- Update the agents table
  UPDATE agents SET stats = result_stats, stats_updated_at = NOW() WHERE id = agent_uuid;

  RETURN result_stats;
END;
$$ LANGUAGE plpgsql;

-- Get current period usage for an org
CREATE OR REPLACE FUNCTION get_current_period_usage(org_uuid UUID, period_start TIMESTAMPTZ)
RETURNS TABLE(task_count BIGINT, a2a_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM agent_executions WHERE org_id = org_uuid AND started_at >= period_start) AS task_count,
    (SELECT COUNT(*) FROM a2a_calls WHERE caller_org_id = org_uuid AND created_at >= period_start) AS a2a_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED CONNECTOR TYPES
-- ============================================================

INSERT INTO connector_types (id, name, description, auth_type, category, icon_url) VALUES
  ('gmail', 'Gmail', 'Send and manage emails via Gmail', 'oauth2', 'communication', '/icons/gmail.svg'),
  ('slack', 'Slack', 'Send messages and manage Slack channels', 'oauth2', 'communication', '/icons/slack.svg'),
  ('shopify', 'Shopify', 'Manage orders, inventory, and customers', 'oauth2', 'ecommerce', '/icons/shopify.svg'),
  ('hubspot', 'HubSpot', 'CRM contacts, deals, and activities', 'oauth2', 'crm', '/icons/hubspot.svg'),
  ('stripe', 'Stripe', 'Payments, invoices, and refunds', 'api_key', 'payments', '/icons/stripe.svg'),
  ('notion', 'Notion', 'Pages, databases, and blocks', 'oauth2', 'productivity', '/icons/notion.svg'),
  ('google-calendar', 'Google Calendar', 'Events and scheduling', 'oauth2', 'productivity', '/icons/google-calendar.svg'),
  ('google-sheets', 'Google Sheets', 'Spreadsheet data management', 'oauth2', 'data', '/icons/google-sheets.svg'),
  ('airtable', 'Airtable', 'Database records and views', 'api_key', 'data', '/icons/airtable.svg'),
  ('webhook', 'Webhooks', 'Custom HTTP integrations', 'api_key', 'custom', '/icons/webhook.svg');
