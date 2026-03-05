export interface A2AAgentCard {
  name: string;
  description: string;
  url: string;
  version: string;

  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
  };

  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    inputSchema: Record<string, unknown>;
    outputSchema: Record<string, unknown>;
  }>;

  authentication: {
    schemes: string[];
  };

  pricing: {
    perCallCents: number;
  };

  agentId: string;
  creatorId: string;
  rating: number;
  totalCalls: number;
}

export interface A2ACall {
  id: string;
  caller_agent_id: string;
  caller_execution_id: string;
  caller_org_id: string;
  target_agent_id: string;
  task_description: string;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  cost_cents: number;
  platform_fee_cents: number;
  creator_earning_cents: number;
  duration_ms?: number;
  created_at: string;
  completed_at?: string;
}
