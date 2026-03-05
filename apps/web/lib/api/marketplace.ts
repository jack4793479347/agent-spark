import { apiGet, apiPost } from './client';

export interface MarketplaceCategory {
  slug: string;
  name: string;
  description: string;
  agent_count: number;
}

export interface AgentDetail {
  id: string;
  slug: string;
  name: string;
  description: string;
  long_description?: string;
  category: string;
  tags: string[];
  pricing_model: string;
  price_cents: number;
  per_use_price_cents?: number;
  avg_rating: number;
  review_count: number;
  total_rentals: number;
  stats?: { speed: number; accuracy: number; reliability: number; popularity: number; versatility: number };
  profiles?: { display_name: string; avatar_url?: string };
  created_at: string;
  published_at?: string;
}

export interface AgentReview {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { display_name: string };
  helpful_count: number;
  user_found_helpful: boolean;
}

export function getCategories() {
  return apiGet<{ categories: MarketplaceCategory[] }>('/api/marketplace/categories');
}

export function getAgentDetail(slug: string) {
  return apiGet<{ agent: AgentDetail }>(`/api/marketplace/agent/${slug}`);
}

export function getAgentReviews(slug: string, page = 1) {
  return apiGet<{ reviews: AgentReview[]; total: number; page: number; totalPages: number }>(
    `/api/marketplace/agent/${slug}/reviews?page=${page}`
  );
}

export function submitReview(slug: string, data: { rating: number; comment: string }) {
  return apiPost<{ review: AgentReview }>(`/api/marketplace/agent/${slug}/reviews`, data);
}
