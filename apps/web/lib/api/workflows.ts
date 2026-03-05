import { apiGet, apiPost } from './client';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  agent_ids: string[];
  trigger_type: string;
  status: string;
  assembled_by_ai: boolean;
  created_at: string;
  updated_at: string;
}

export function getWorkflows() {
  return apiGet<{ workflows: Workflow[]; total: number }>('/api/workflows');
}

export function createWorkflow(data: { name: string; description: string; agent_ids: string[] }) {
  return apiPost<{ workflow: Workflow }>('/api/workflows', data);
}

export function executeWorkflow(id: string) {
  return apiPost<{ execution_id: string }>(`/api/workflows/${id}/execute`);
}

export function getWorkflowStatus(id: string) {
  return apiGet<{ workflow: Workflow }>(`/api/workflows/${id}`);
}
