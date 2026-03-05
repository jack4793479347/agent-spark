import type { Agent } from './agent';

export interface MarketplaceSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  priceRange?: { min: number; max: number };
  minRating?: number;
  requiredConnectors?: string[];
  sortBy?: 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high';
  page?: number;
  pageSize?: number;
}

export interface MarketplaceSearchResult {
  data: Agent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const AGENT_CATEGORIES = [
  { id: 'customer-support', name: 'Customer Support', icon: 'headphones' },
  { id: 'sales', name: 'Sales & CRM', icon: 'trending-up' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
  { id: 'ecommerce', name: 'E-commerce', icon: 'shopping-cart' },
  { id: 'finance', name: 'Finance & Accounting', icon: 'dollar-sign' },
  { id: 'hr', name: 'HR & Recruiting', icon: 'users' },
  { id: 'productivity', name: 'Productivity', icon: 'zap' },
  { id: 'data', name: 'Data & Analytics', icon: 'bar-chart' },
  { id: 'development', name: 'Development', icon: 'code' },
  { id: 'content', name: 'Content Creation', icon: 'pen-tool' },
  { id: 'operations', name: 'Operations', icon: 'settings' },
  { id: 'utility', name: 'Utility Agents', icon: 'wrench' },
] as const;

export type AgentCategory = typeof AGENT_CATEGORIES[number]['id'];
