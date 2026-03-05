'use client';

import { cn } from '@/lib/utils';

export type PricingModel = 'free' | 'monthly' | 'per_use' | 'tiered';

interface PricingSelectorProps {
  pricingModel: PricingModel;
  priceCents: number;
  perUsePriceCents: number;
  onChange: (updates: {
    pricing_model?: PricingModel;
    price_cents?: number;
    per_use_price_cents?: number;
  }) => void;
  className?: string;
}

const PRICING_OPTIONS: { value: PricingModel; label: string; description: string }[] = [
  { value: 'free', label: 'Free', description: 'No charge — great for getting early users' },
  { value: 'monthly', label: 'Monthly', description: 'Recurring subscription per month' },
  { value: 'per_use', label: 'Per Use', description: 'Charge per execution / API call' },
  { value: 'tiered', label: 'Tiered', description: 'Free tier + paid monthly upgrades' },
];

export function PricingSelector({
  pricingModel,
  priceCents,
  perUsePriceCents,
  onChange,
  className,
}: PricingSelectorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Model selector */}
      <div className="grid grid-cols-2 gap-3">
        {PRICING_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ pricing_model: opt.value })}
            className={cn(
              'p-3 rounded-[var(--radius-lg)] border text-left transition-all',
              pricingModel === opt.value
                ? 'border-accent-primary bg-accent-primary/5'
                : 'border-bg-tertiary hover:border-text-tertiary'
            )}
          >
            <span className={cn(
              'text-sm font-semibold block',
              pricingModel === opt.value ? 'text-accent-primary' : 'text-text-primary'
            )}>
              {opt.label}
            </span>
            <span className="text-[11px] text-text-tertiary mt-0.5 block">
              {opt.description}
            </span>
          </button>
        ))}
      </div>

      {/* Price inputs */}
      {(pricingModel === 'monthly' || pricingModel === 'tiered') && (
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">
            Monthly price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={(priceCents / 100).toFixed(2)}
              onChange={(e) => onChange({ price_cents: Math.round(Number(e.target.value) * 100) })}
              className="w-full pl-7 pr-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {(pricingModel === 'per_use' || pricingModel === 'tiered') && (
        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">
            Per-use price (USD)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">$</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={(perUsePriceCents / 100).toFixed(2)}
              onChange={(e) => onChange({ per_use_price_cents: Math.round(Number(e.target.value) * 100) })}
              className="w-full pl-7 pr-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Platform cut info */}
      {pricingModel !== 'free' && (
        <p className="text-[11px] text-text-tertiary">
          Agent Spark takes a 15% platform fee. You receive 85% of all revenue.
        </p>
      )}
    </div>
  );
}
