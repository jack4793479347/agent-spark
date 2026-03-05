'use client';

import { Bot, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentRadarChart, StatBreakdown, type AgentStats } from '@/components/marketplace/AgentRadarChart';
import type { ListingData } from './ListingEditor';

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

interface ListingPreviewProps {
  data: ListingData;
  stats: AgentStats;
  className?: string;
}

export function ListingPreview({ data, stats, className }: ListingPreviewProps) {
  const colors = CATEGORY_COLORS[data.category] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600' };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Card preview */}
      <div>
        <h4 className="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-3">Card Preview</h4>
        <div className="glass-card-static max-w-[320px]">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn('icon-container', colors.bg)}>
                <Bot className={cn('w-5 h-5', colors.text)} strokeWidth={1.75} />
              </div>
              <AgentRadarChart stats={stats} size="mini" />
            </div>
            <span className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-medium',
              colors.bg, colors.text
            )}>
              {data.category ? data.category.replace('-', ' ') : 'uncategorized'}
            </span>
          </div>

          <h4 className="font-heading text-base font-semibold text-text-primary line-clamp-1">
            {data.name || 'Untitled Agent'}
          </h4>
          <p className="text-text-secondary text-sm mt-1 line-clamp-2">
            {data.description || 'No description yet...'}
          </p>

          {data.tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {data.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-bg-tertiary text-text-tertiary text-[11px] font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-bg-tertiary">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" strokeWidth={1.75} />
              <span className="text-xs font-medium text-text-primary">—</span>
              <span className="text-[11px] text-text-tertiary">(new)</span>
            </div>
            <span className={cn(
              'text-sm font-heading font-semibold',
              data.pricing_model === 'free' ? 'text-success' : 'text-text-primary'
            )}>
              {formatPrice(data.pricing_model, data.price_cents)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats preview */}
      <div>
        <h4 className="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-3">Agent Stats</h4>
        <div className="glass-card-static">
          <div className="flex items-start gap-6">
            <AgentRadarChart stats={stats} size="full" />
            <StatBreakdown stats={stats} className="flex-1" />
          </div>
        </div>
      </div>

      {/* Detail preview */}
      {data.long_description && (
        <div>
          <h4 className="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-3">Detail Page Preview</h4>
          <div className="glass-card-static">
            <h3 className="font-heading text-lg font-semibold mb-3">About this agent</h3>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
              {data.long_description}
            </p>
          </div>
        </div>
      )}

      {/* Connector badges */}
      {(data.required_connectors.length > 0 || data.optional_connectors.length > 0) && (
        <div>
          <h4 className="text-xs text-text-tertiary font-medium uppercase tracking-wider mb-3">Required Connections</h4>
          <div className="flex flex-wrap gap-2">
            {data.required_connectors.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-md text-xs font-medium bg-accent-primary text-white">
                {c}
              </span>
            ))}
            {data.optional_connectors.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-md text-xs font-medium bg-bg-tertiary text-text-secondary">
                {c} (optional)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
