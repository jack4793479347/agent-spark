import { apiGet, apiPost, apiPut, apiDelete } from './client';

export interface AgentMine {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  avg_rating: number;
  review_count: number;
  active_rentals: number;
  total_a2a_calls: number;
  total_executions: number;
  version?: string;
  pricing_model?: string;
  price_cents?: number;
  per_use_price_cents?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Execution {
  id: string;
  agent_id: string;
  agent_name?: string;
  input_text: string;
  status: string;
  steps?: unknown[];
  result?: { text?: string };
  error?: string;
  total_tokens: number;
  total_tool_calls: number;
  total_a2a_calls: number;
  cost_cents: number;
  started_at: string;
  completed_at?: string;
}

export interface Approval {
  id: string;
  execution_id: string;
  agent_name: string;
  action: string;
  details: unknown;
  created_at: string;
}

export function getMyAgents() {
  return apiGet<{ agents: AgentMine[] }>('/api/agents/mine');
}

export function createAgent(data: {
  name: string;
  slug: string;
  description: string;
  category: string;
  system_prompt: string;
  tags?: string[];
  model?: string;
  required_connectors?: string[];
  optional_connectors?: string[];
  pricing_model?: string;
  price_cents?: number;
  per_use_price_cents?: number;
}) {
  return apiPost<{ agent: AgentMine }>('/api/agents', data);
}

export function updateAgent(id: string, data: Record<string, unknown>) {
  return apiPut<{ agent: AgentMine }>(`/api/agents/${id}`, data);
}

export function deleteAgent(id: string) {
  return apiDelete<{ success: boolean }>(`/api/agents/${id}`);
}

export function publishAgent(id: string) {
  return apiPost<{ success: boolean }>(`/api/agents/${id}/publish`);
}

export function sandboxAgent(id: string, input: string) {
  return apiPost<{ executionId: string; status: string; result?: { text: string } }>(`/api/agents/${id}/sandbox`, { input });
}

export function executeAgent(id: string, input: string) {
  return apiPost<{ execution_id: string }>(`/api/agents/${id}/execute`, { input });
}

export function generateListing(input: string) {
  return apiPost<{ listing: Record<string, unknown> }>('/api/agents/generate-listing', { input });
}

export interface TrainingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TrainingChatResponse {
  message: string;
  phase: string;
  progress: number;
  suggestions?: string[];
  system_prompt?: string;
  agent_meta?: {
    name?: string;
    description?: string;
    category?: string;
    tags?: string[];
    suggested_pricing?: number;
  };
}

export function trainingChat(messages: TrainingMessage[], phase: string = 'purpose') {
  return apiPost<TrainingChatResponse>('/api/agents/training-chat', { messages, phase });
}

export function getExecutions(params?: { limit?: number; offset?: number; agent_id?: string }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  if (params?.agent_id) query.set('agent_id', params.agent_id);
  const qs = query.toString();
  return apiGet<{ executions: Execution[]; total: number }>(`/api/agents/executions${qs ? `?${qs}` : ''}`);
}

export function getExecution(id: string) {
  return apiGet<{ execution: Execution }>(`/api/agents/executions/${id}`);
}

export function getApprovals() {
  return apiGet<{ approvals: Approval[] }>('/api/agents/approvals');
}

export function respondToApproval(id: string, approved: boolean) {
  return apiPost<{ success: boolean }>(`/api/agents/approvals/${id}`, { approved });
}

// ─── URL Scraping ────────────────────────────────────────────

export interface ScrapeResult {
  success: boolean;
  title: string;
  url: string;
  content: string;
  length: number;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const res = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Scrape failed (${res.status})`);
  }
  return res.json();
}

// ─── Knowledge Base ──────────────────────────────────────────

export interface KBStats {
  totalChunks: number;
  totalTokens: number;
  files: Array<{ filename: string; chunkCount: number; tokenCount: number }>;
}

export interface KBUploadResult {
  success: boolean;
  filename: string;
  chunks: number;
  tokens: number;
}

export function uploadKnowledgeDoc(agentId: string, filename: string, content: string) {
  return apiPost<KBUploadResult>(`/api/agents/${agentId}/knowledge`, { filename, content });
}

export function deleteKnowledgeDoc(agentId: string, filename: string) {
  return apiDelete<{ success: boolean }>(`/api/agents/${agentId}/knowledge/${encodeURIComponent(filename)}`);
}

export function clearKnowledgeBase(agentId: string) {
  return apiDelete<{ success: boolean }>(`/api/agents/${agentId}/knowledge`);
}

export function getKnowledgeBaseStats(agentId: string) {
  return apiGet<KBStats>(`/api/agents/${agentId}/knowledge`);
}
