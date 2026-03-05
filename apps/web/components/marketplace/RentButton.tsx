'use client';

import { useState } from 'react';
import { ShoppingCart, Loader2, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RentButtonProps {
  agentId: string;
  agentName: string;
  pricingModel: 'free' | 'monthly' | 'per_use' | 'tiered';
  priceCents: number;
  className?: string;
}

function formatPrice(model: string, cents: number): string {
  if (model === 'free') return 'Free';
  const dollars = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
  if (model === 'monthly') return `$${dollars}/mo`;
  if (model === 'per_use') return `$${dollars}/use`;
  return `$${dollars}`;
}

export function RentButton({
  agentId,
  agentName,
  pricingModel,
  priceCents,
  className,
}: RentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>();

  const handleRent = async () => {
    setLoading(true);
    setError(undefined);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

      // For free agents, create rental directly via rentals endpoint
      if (pricingModel === 'free') {
        const res = await fetch(`${apiUrl}/api/rentals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ agent_id: agentId }),
        });

        if (res.ok) {
          setSuccess(true);
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (data.error?.includes('already have')) {
          setError('Already rented');
        } else {
          setError(data.error ?? 'Failed to add agent');
        }
        return;
      }

      // Paid agents: create Stripe checkout session
      const res = await fetch(`${apiUrl}/api/billing/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'agent_rental',
          agent_id: agentId,
          allowed_connection_ids: [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
          return;
        }
        if (data.rentalId) {
          setSuccess(true);
          return;
        }
      }

      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Checkout failed');
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={cn(
        'flex items-center justify-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-success/10 text-success text-sm font-medium',
        className
      )}>
        <Check className="w-4 h-4" strokeWidth={2} />
        Agent Added!
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleRent}
        disabled={loading}
        className={cn(
          'btn-primary text-sm w-full flex items-center justify-center gap-2',
          loading && 'opacity-60 cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : pricingModel !== 'free' ? (
          <ExternalLink className="w-4 h-4" strokeWidth={1.75} />
        ) : (
          <ShoppingCart className="w-4 h-4" strokeWidth={1.75} />
        )}
        {pricingModel === 'free'
          ? 'Add Agent — Free'
          : `Rent Agent — ${formatPrice(pricingModel, priceCents)}`}
      </button>
      {error && (
        <p className="text-[11px] text-error mt-1.5 text-center">{error}</p>
      )}
    </div>
  );
}
