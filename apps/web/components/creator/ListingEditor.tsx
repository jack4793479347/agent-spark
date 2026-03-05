'use client';

import { cn } from '@/lib/utils';
import { PricingSelector, type PricingModel } from './PricingSelector';

const CATEGORIES = [
  'customer-support', 'sales', 'ecommerce', 'marketing', 'finance', 'hr',
  'productivity', 'data', 'development', 'content', 'operations', 'utility',
] as const;

const CONNECTORS = [
  'gmail', 'slack', 'shopify', 'hubspot', 'stripe',
  'notion', 'google-calendar', 'google-sheets', 'airtable', 'webhook',
] as const;

export interface ListingData {
  name: string;
  slug: string;
  description: string;
  long_description: string;
  category: string;
  tags: string[];
  system_prompt: string;
  required_connectors: string[];
  optional_connectors: string[];
  pricing_model: PricingModel;
  price_cents: number;
  per_use_price_cents: number;
}

interface ListingEditorProps {
  data: ListingData;
  onChange: (updates: Partial<ListingData>) => void;
  className?: string;
}

export function ListingEditor({ data, onChange, className }: ListingEditorProps) {
  const handleTagInput = (value: string) => {
    const tags = value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10);
    onChange({ tags });
  };

  const toggleConnector = (list: 'required_connectors' | 'optional_connectors', id: string) => {
    const current = data[list];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    onChange({ [list]: updated });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Basic info */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-text-primary">Basic Info</h3>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">Agent Name</label>
          <input
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            maxLength={100}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">URL Slug</label>
          <input
            value={data.slug}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            maxLength={100}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary font-mono focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">Short Description</label>
          <textarea
            value={data.description}
            onChange={(e) => onChange({ description: e.target.value })}
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors resize-none"
          />
          <span className="text-[11px] text-text-tertiary mt-1 block">{data.description.length}/500</span>
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">Long Description</label>
          <textarea
            value={data.long_description}
            onChange={(e) => onChange({ long_description: e.target.value })}
            maxLength={5000}
            rows={4}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors resize-none"
          />
          <span className="text-[11px] text-text-tertiary mt-1 block">{data.long_description.length}/5000</span>
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">Category</label>
          <select
            value={data.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-1.5">Tags (comma-separated)</label>
          <input
            value={data.tags.join(', ')}
            onChange={(e) => handleTagInput(e.target.value)}
            placeholder="e.g. shopify, returns, email"
            className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
          />
        </div>
      </section>

      {/* System Prompt */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-text-primary">System Prompt</h3>
        <textarea
          value={data.system_prompt}
          onChange={(e) => onChange({ system_prompt: e.target.value })}
          rows={6}
          className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary font-mono focus:border-accent-primary focus:outline-none transition-colors resize-none"
          placeholder="Enter the system prompt that defines your agent's behavior..."
        />
      </section>

      {/* Connectors */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-text-primary">Connectors</h3>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">Required Connectors</label>
          <div className="flex flex-wrap gap-2">
            {CONNECTORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConnector('required_connectors', c)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  data.required_connectors.includes(c)
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-text-secondary font-medium block mb-2">Optional Connectors</label>
          <div className="flex flex-wrap gap-2">
            {CONNECTORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleConnector('optional_connectors', c)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  data.optional_connectors.includes(c)
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/80'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-4">
        <h3 className="font-heading text-base font-semibold text-text-primary">Pricing</h3>
        <PricingSelector
          pricingModel={data.pricing_model}
          priceCents={data.price_cents}
          perUsePriceCents={data.per_use_price_cents}
          onChange={(updates) => onChange(updates as Partial<ListingData>)}
        />
      </section>
    </div>
  );
}
