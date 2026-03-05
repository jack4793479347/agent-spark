'use client';

import Link from 'next/link';
import { Star, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentRadarChart, type AgentStats } from './AgentRadarChart';

export interface AgentCardData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon_url?: string;
  pricing_model: 'free' | 'monthly' | 'per_use' | 'tiered';
  price_cents: number;
  avg_rating: number;
  review_count: number;
  total_rentals: number;
  creator_name: string;
  tags: string[];
  stats?: AgentStats;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'customer-support': { bg: 'bg-blue-50', text: 'text-blue-600' },
  sales: { bg: 'bg-green-50', text: 'text-green-600' },
  ecommerce: { bg: 'bg-orange-50', text: 'text-orange-600' },
  marketing: { bg: 'bg-pink-50', text: 'text-pink-600' },
  finance: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  hr: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  productivity: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  data: { bg: 'bg-violet-50', text: 'text-violet-600' },
  development: { bg: 'bg-slate-100', text: 'text-slate-600' },
  content: { bg: 'bg-rose-50', text: 'text-rose-600' },
  operations: { bg: 'bg-gray-100', text: 'text-gray-600' },
  utility: { bg: 'bg-amber-50', text: 'text-amber-600' },
};

function formatPrice(model: string, cents: number): string {
  if (model === 'free') return 'Free';
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  if (model === 'monthly') return `$${dollars}/mo`;
  if (model === 'per_use') return `$${dollars}/use`;
  return `$${dollars}`;
}

function formatRentals(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

interface AgentCardProps {
  agent: AgentCardData;
  className?: string;
}

export function AgentCard({ agent, className }: AgentCardProps) {
  const colors = CATEGORY_COLORS[agent.category] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600' };

  return (
    <Link href={`/agent/${agent.slug}`} className={cn('block', className)}>
      <div className="glass-card group cursor-pointer h-full flex flex-col">
        {/* Top row — icon + radar + category */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('icon-container', colors.bg)}>
              <Bot className={cn('w-5 h-5', colors.text)} strokeWidth={1.75} />
            </div>
            {agent.stats && (
              <AgentRadarChart stats={agent.stats} size="mini" />
            )}
          </div>
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium',
            colors.bg, colors.text
          )}>
            {agent.category.replace('-', ' ')}
          </span>
        </div>

        {/* Name + description */}
        <h4 className="font-heading text-base font-semibold text-text-primary group-hover:text-accent-primary transition-colors line-clamp-1">
          {agent.name}
        </h4>
        <p className="text-text-secondary text-sm mt-1 line-clamp-2 flex-1">
          {agent.description}
        </p>

        {/* Tags */}
        {agent.tags.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {agent.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-bg-tertiary text-text-tertiary text-[11px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row — rating, rentals, price */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-bg-tertiary">
          <div className="flex items-center gap-3">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" strokeWidth={1.75} />
              <span className="text-xs font-medium text-text-primary">
                {agent.avg_rating.toFixed(1)}
              </span>
              <span className="text-[11px] text-text-tertiary">
                ({agent.review_count})
              </span>
            </div>

            {/* Rentals */}
            <span className="text-[11px] text-text-tertiary">
              {formatRentals(agent.total_rentals)} rentals
            </span>
          </div>

          {/* Price */}
          <span className={cn(
            'text-sm font-heading font-semibold',
            agent.pricing_model === 'free' ? 'text-success' : 'text-text-primary'
          )}>
            {formatPrice(agent.pricing_model, agent.price_cents)}
          </span>
        </div>

        {/* Creator */}
        <div className="mt-2">
          <span className="text-[11px] text-text-tertiary">
            by {agent.creator_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
