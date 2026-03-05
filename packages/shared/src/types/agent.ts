export interface AgentStats {
  speed: number;
  accuracy: number;
  reliability: number;
  popularity: number;
  versatility: number;
}

export interface AgentCapability {
  skill_id: string;
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

export interface Agent {
  id: string;
  creator_id: string;

  // Identity
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  icon_url?: string;
  category: string;
  tags: string[];

  // Configuration
  system_prompt: string;
  model: string;
  required_connectors: string[];
  optional_connectors: string[];

  // A2A
  a2a_agent_card: Record<string, unknown>;
  a2a_endpoint?: string;

  // Capabilities
  capabilities: AgentCapability[];
  capability_embeddings?: string;

  // Marketplace listing
  status: 'draft' | 'in_review' | 'published' | 'suspended' | 'archived';
  visibility: 'private' | 'public' | 'unlisted';

  // Pricing
  pricing_model: 'free' | 'monthly' | 'per_use' | 'tiered';
  price_cents: number;
  per_use_price_cents: number;
  a2a_call_price_cents: number;

  // Stats
  total_rentals: number;
  active_rentals: number;
  total_a2a_calls: number;
  avg_rating: number;
  review_count: number;
  stats: AgentStats;
  stats_updated_at: string;

  // Versioning
  version: string;
  changelog?: Record<string, unknown>;

  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface AgentReview {
  id: string;
  agent_id: string;
  reviewer_id: string;
  rating: number;
  title?: string;
  body?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface AgentExecution {
  id: string;
  rental_id: string;
  agent_id: string;
  org_id: string;
  input_text: string;
  status: 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
  steps?: Record<string, unknown>[];
  result?: Record<string, unknown>;
  error?: string;
  total_tokens: number;
  total_tool_calls: number;
  total_a2a_calls: number;
  duration_ms?: number;
  cost_cents: number;
  started_at: string;
  completed_at?: string;
}
