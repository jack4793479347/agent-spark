'use client';

import { Star, Bot, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RentButton } from './RentButton';

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

interface AgentDetailHeroProps {
  agent: {
    id: string;
    name: string;
    description: string;
    category: string;
    creator_name: string;
    avg_rating: number;
    review_count: number;
    total_rentals: number;
    pricing_model: 'free' | 'monthly' | 'per_use' | 'tiered';
    price_cents: number;
    required_connectors?: string[];
    optional_connectors?: string[];
  };
  className?: string;
}

export function AgentDetailHero({ agent, className }: AgentDetailHeroProps) {
  const colors = CATEGORY_COLORS[agent.category] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600' };

  return (
    <div className={cn('glass-card-static', className)}>
      <div className="flex items-start gap-5">
        <div className={cn('icon-container !w-16 !h-16 shrink-0', colors.bg)}>
          <Bot className={cn('w-8 h-8', colors.text)} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-text-primary">{agent.name}</h1>
          <p className="text-text-secondary text-sm mt-1">by {agent.creator_name}</p>
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-warning fill-warning" strokeWidth={1.75} />
              <span className="text-sm font-medium">{agent.avg_rating > 0 ? agent.avg_rating.toFixed(1) : '—'}</span>
              <span className="text-xs text-text-tertiary">({agent.review_count} reviews)</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-text-tertiary" strokeWidth={1.75} />
              <span className="text-xs text-text-tertiary">{agent.total_rentals.toLocaleString()} rentals</span>
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              colors.bg, colors.text
            )}>
              {agent.category.replace('-', ' ')}
            </span>
          </div>

          {/* Required connections */}
          {agent.required_connectors && agent.required_connectors.length > 0 && (
            <div className="mt-3">
              <span className="text-[11px] text-text-tertiary">Requires: </span>
              {agent.required_connectors.map((c) => (
                <span key={c} className="inline-block px-2 py-0.5 rounded-md bg-bg-tertiary text-text-secondary text-[11px] font-medium mr-1">
                  {c}
                </span>
              ))}
              {agent.optional_connectors && agent.optional_connectors.length > 0 && (
                <>
                  <span className="text-[11px] text-text-tertiary ml-1">Optional: </span>
                  {agent.optional_connectors.map((c) => (
                    <span key={c} className="inline-block px-2 py-0.5 rounded-md bg-bg-tertiary/50 text-text-tertiary text-[11px] font-medium mr-1">
                      {c}
                    </span>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 w-[160px]">
          <div className="text-2xl font-heading font-bold text-text-primary">
            {agent.pricing_model === 'free' ? (
              <span className="text-success">Free</span>
            ) : (
              `$${(agent.price_cents / 100).toFixed(2)}`
            )}
          </div>
          <span className="text-xs text-text-tertiary">
            {agent.pricing_model === 'monthly' ? '/month' : agent.pricing_model === 'per_use' ? '/use' : ''}
          </span>
          <RentButton
            agentId={agent.id}
            agentName={agent.name}
            pricingModel={agent.pricing_model}
            priceCents={agent.price_cents}
            className="mt-3"
          />
        </div>
      </div>
    </div>
  );
}
