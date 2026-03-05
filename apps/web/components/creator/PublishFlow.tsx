'use client';

import { useState } from 'react';
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Rocket, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListingEditor, type ListingData } from './ListingEditor';
import { ListingPreview } from './ListingPreview';
import type { AgentStats } from '@/components/marketplace/AgentRadarChart';

type Step = 'input' | 'edit' | 'preview';

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'input', label: 'Describe', number: 1 },
  { key: 'edit', label: 'Review & Edit', number: 2 },
  { key: 'preview', label: 'Preview & Publish', number: 3 },
];

const EMPTY_LISTING: ListingData = {
  name: '',
  slug: '',
  description: '',
  long_description: '',
  category: '',
  tags: [],
  system_prompt: '',
  required_connectors: [],
  optional_connectors: [],
  pricing_model: 'free',
  price_cents: 0,
  per_use_price_cents: 0,
};

function computeStats(data: ListingData): AgentStats {
  const connectorCount = data.required_connectors.length + data.optional_connectors.length;
  return {
    speed: 50,
    accuracy: 50,
    reliability: 50,
    popularity: 0,
    versatility: Math.min(99, connectorCount * 16),
  };
}

export function PublishFlow() {
  const [step, setStep] = useState<Step>('input');
  const [input, setInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<string>();
  const [listing, setListing] = useState<ListingData>(EMPTY_LISTING);

  const stats = computeStats(listing);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setGenerating(true);
    setError(undefined);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/agents/generate-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: input.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed (${res.status})`);
      }

      const { listing: generated } = await res.json();
      setListing({
        name: generated.name ?? '',
        slug: generated.slug ?? '',
        description: generated.description ?? '',
        long_description: generated.long_description ?? '',
        category: generated.category ?? '',
        tags: generated.tags ?? [],
        system_prompt: input.trim(),
        required_connectors: generated.required_connectors ?? [],
        optional_connectors: generated.optional_connectors ?? [],
        pricing_model: generated.pricing_model ?? 'free',
        price_cents: generated.price_cents ?? 0,
        per_use_price_cents: 0,
      });
      setStep('edit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate listing');
    } finally {
      setGenerating(false);
    }
  };

  const handleSkipGenerate = () => {
    setListing({ ...EMPTY_LISTING, system_prompt: input.trim() });
    setStep('edit');
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(undefined);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      // Create agent
      const createRes = await fetch(`${apiUrl}/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: listing.name,
          slug: listing.slug,
          description: listing.description,
          long_description: listing.long_description,
          category: listing.category,
          tags: listing.tags,
          system_prompt: listing.system_prompt,
          required_connectors: listing.required_connectors,
          optional_connectors: listing.optional_connectors,
          pricing_model: listing.pricing_model,
          price_cents: listing.price_cents,
          per_use_price_cents: listing.per_use_price_cents,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Create failed (${createRes.status})`);
      }

      const { agent } = await createRes.json();

      // Publish agent
      const pubRes = await fetch(`${apiUrl}/api/agents/${agent.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!pubRes.ok) {
        const data = await pubRes.json().catch(() => ({}));
        throw new Error(data.error ?? `Publish failed (${pubRes.status})`);
      }

      setPublished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleUpdate = (updates: Partial<ListingData>) => {
    setListing((prev) => ({ ...prev, ...updates }));
  };

  const canPublish = listing.name && listing.slug && listing.description && listing.category && listing.system_prompt;

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-success" strokeWidth={2} />
        </div>
        <h3 className="font-heading text-xl font-bold text-text-primary mb-2">Agent Published!</h3>
        <p className="text-text-secondary text-sm max-w-[400px] mb-6">
          Your agent &ldquo;{listing.name}&rdquo; is now live on the marketplace. It may take a moment to appear in search.
        </p>
        <button
          onClick={() => {
            setPublished(false);
            setStep('input');
            setInput('');
            setListing(EMPTY_LISTING);
          }}
          className="btn-secondary text-sm"
        >
          Publish Another Agent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (s.key === 'input') setStep('input');
                if (s.key === 'edit' && listing.name) setStep('edit');
                if (s.key === 'preview' && listing.name) setStep('preview');
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                step === s.key
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold',
                step === s.key ? 'bg-white/20' : 'bg-bg-secondary'
              )}>
                {s.number}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px bg-bg-tertiary" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="glass-card-static border-l-4 border-error !py-3">
          <p className="text-sm text-error font-medium">{error}</p>
        </div>
      )}

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="glass-card-static">
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-1">
              Describe Your Agent
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Paste your system prompt or describe what your agent does. Our AI will generate a complete marketplace listing.
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder="e.g. You are a customer support agent that handles return requests for Shopify stores. You process refunds, generate return labels, and send email updates to customers..."
              className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={!input.trim() || generating}
              className={cn(
                'btn-primary text-sm flex items-center gap-2',
                (!input.trim() || generating) && 'opacity-60 cursor-not-allowed'
              )}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                  Generate Listing with AI
                </>
              )}
            </button>
            <button
              onClick={handleSkipGenerate}
              disabled={!input.trim()}
              className="btn-secondary text-sm"
            >
              Skip AI — Fill Manually
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Edit */}
      {step === 'edit' && (
        <div className="space-y-4">
          <div className="glass-card-static">
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-1">
              Review & Edit Listing
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              Fine-tune the auto-generated listing. All fields are editable.
            </p>
            <ListingEditor data={listing} onChange={handleUpdate} />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('input')} className="btn-secondary text-sm flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={!canPublish}
              className={cn(
                'btn-primary text-sm flex items-center gap-1.5',
                !canPublish && 'opacity-60 cursor-not-allowed'
              )}
            >
              Preview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Publish */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="glass-card-static">
            <h3 className="font-heading text-lg font-semibold text-text-primary mb-1">
              Preview & Publish
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              This is how your agent will appear on the marketplace.
            </p>
            <ListingPreview data={listing} stats={stats} />
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('edit')} className="btn-secondary text-sm flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className={cn(
                'btn-primary text-sm flex items-center gap-2',
                publishing && 'opacity-60 cursor-not-allowed'
              )}
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" strokeWidth={1.75} />
                  Publish to Marketplace
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
