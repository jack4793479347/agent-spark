'use client';

import { Bot, MoreVertical, Eye, Edit2, Archive, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentRadarChart, type AgentStats } from '@/components/marketplace/AgentRadarChart';

export interface ListingCardData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  pricing_model: 'free' | 'monthly' | 'per_use' | 'tiered';
  price_cents: number;
  stats: AgentStats;
  total_rentals: number;
  avg_rating: number;
  review_count: number;
  created_at: string;
  published_at?: string;
}

const STATUS_STYLES = {
  draft: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Draft' },
  published: { bg: 'bg-green-50', text: 'text-green-600', label: 'Published' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Archived' },
} as const;

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

interface ListingCardProps {
  listing: ListingCardData;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
  className?: string;
}

export function ListingCard({ listing, onView, onEdit, onArchive, className }: ListingCardProps) {
  const statusStyle = STATUS_STYLES[listing.status];
  const colors = CATEGORY_COLORS[listing.category] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600' };

  return (
    <div className={cn('glass-card-static flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('icon-container', colors.bg)}>
            <Bot className={cn('w-5 h-5', colors.text)} strokeWidth={1.75} />
          </div>
          <AgentRadarChart stats={listing.stats} size="mini" />
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'px-2 py-0.5 rounded-full text-[11px] font-medium',
            statusStyle.bg, statusStyle.text
          )}>
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Info */}
      <h4 className="font-heading text-base font-semibold text-text-primary line-clamp-1">
        {listing.name}
      </h4>
      <p className="text-text-secondary text-sm mt-1 line-clamp-2 flex-1">
        {listing.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 mt-3 text-[11px] text-text-tertiary">
        <span>{listing.total_rentals} rentals</span>
        <span>{listing.avg_rating > 0 ? `${listing.avg_rating.toFixed(1)} rating` : 'No ratings'}</span>
        <span className={cn(
          'font-medium',
          listing.pricing_model === 'free' ? 'text-success' : 'text-text-primary'
        )}>
          {formatPrice(listing.pricing_model, listing.price_cents)}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-bg-tertiary flex gap-2">
        <button
          onClick={() => onView?.(listing.id)}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
          View
        </button>
        <button
          onClick={() => onEdit?.(listing.id)}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          Edit
        </button>
        {listing.status !== 'archived' && (
          <button
            onClick={() => onArchive?.(listing.id)}
            className="text-xs py-1.5 px-3 rounded-[var(--radius-md)] text-text-tertiary hover:text-error hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <Archive className="w-3.5 h-3.5" strokeWidth={1.75} />
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
