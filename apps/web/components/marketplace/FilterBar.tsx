'use client';

import { SlidersHorizontal, ChevronDown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortOption = 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high';

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  pricingFilter: string;
  onPricingChange: (pricing: string) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  className?: string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
];

const PRICING_OPTIONS = [
  { value: 'all', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 3, label: '3+' },
  { value: 4, label: '4+' },
  { value: 4.5, label: '4.5+' },
];

export function FilterBar({
  sortBy,
  onSortChange,
  pricingFilter,
  onPricingChange,
  minRating,
  onMinRatingChange,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      <div className="flex items-center gap-1.5 text-text-tertiary">
        <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
        <span className="text-xs font-medium">Filters</span>
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none pl-3 pr-7 py-1.5 rounded-[var(--radius-sm)] border border-bg-tertiary bg-bg-primary text-text-primary text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary pointer-events-none" strokeWidth={2} />
      </div>

      {/* Pricing */}
      <div className="flex gap-1">
        {PRICING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onPricingChange(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
              pricingFilter === opt.value
                ? 'bg-accent-primary/10 text-accent-primary'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Rating */}
      <div className="flex gap-1 items-center">
        <Star className="w-3.5 h-3.5 text-warning fill-warning" strokeWidth={1.75} />
        {RATING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onMinRatingChange(opt.value)}
            className={cn(
              'px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-colors',
              minRating === opt.value
                ? 'bg-warning/10 text-warning'
                : 'text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
