'use client';

import { useState } from 'react';
import { X, Check, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  tasks: string;
  a2a: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceNote: 'forever',
    tasks: '50 tasks/mo',
    a2a: '5 A2A workflows/mo',
    features: ['3 active agents', 'Basic integrations (Gmail, Slack)', 'Agent Studio: build & test', 'Community support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$29',
    priceNote: '/month',
    tasks: '250 tasks/mo',
    a2a: '25 A2A workflows/mo',
    features: ['10 active agents', 'All integrations', 'Agent Studio: build & publish', 'Marketplace publishing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    priceNote: '/month',
    tasks: '1,500 tasks/mo',
    a2a: '200 A2A workflows/mo',
    features: ['Unlimited agents', 'All integrations', 'Scheduled agents & auto-runs', 'Priority support'],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$299',
    priceNote: '/month',
    tasks: '5,000 tasks/mo',
    a2a: '1,000 A2A workflows/mo',
    features: ['All Pro features', 'SSO & role-based permissions', 'Dedicated support & onboarding', 'Custom connectors'],
  },
];

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  currentPlan?: string;
  trigger?: 'limit_reached' | 'upgrade_cta' | 'settings';
}

export function UpgradeModal({ open, onClose, currentPlan = 'free', trigger }: UpgradeModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  if (!open) return null;

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;

    setLoading(planId);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/billing/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'platform_subscription',
          plan: planId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      const err = await res.json().catch(() => ({}));
      console.error('Checkout error:', err);
    } catch {
      // Handle error
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass-card-static w-full max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-text-primary">
              {trigger === 'limit_reached' ? 'Task Limit Reached' : 'Upgrade Your Plan'}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {trigger === 'limit_reached'
                ? 'You\'ve used all tasks for this period. Upgrade or buy a task pack to continue.'
                : 'Choose the plan that fits your needs.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-bg-tertiary transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = getPlanOrder(plan.id) > getPlanOrder(currentPlan);

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-[var(--radius-lg)] border p-4 flex flex-col',
                  plan.popular
                    ? 'border-text-primary/20 bg-black/[0.02]'
                    : 'border-bg-tertiary bg-bg-primary',
                  isCurrent && 'ring-2 ring-black/10'
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider" style={{ background: '#1A1A1A' }}>
                    Popular
                  </span>
                )}

                <h3 className="font-heading text-base font-bold text-text-primary">{plan.name}</h3>

                <div className="mt-2 mb-3">
                  <span className="text-2xl font-heading font-bold text-text-primary">{plan.price}</span>
                  <span className="text-xs text-text-tertiary ml-1">{plan.priceNote}</span>
                </div>

                <div className="mb-4 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-text-primary" strokeWidth={2} />
                    <span className="text-xs font-medium text-text-primary">{plan.tasks}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2} />
                    <span className="text-xs font-medium text-text-secondary">{plan.a2a}</span>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" strokeWidth={2} />
                      <span className="text-xs text-text-secondary">{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || (plan.id === 'free' && currentPlan === 'free') || loading !== null}
                  className={cn(
                    'w-full py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                    isCurrent
                      ? 'bg-bg-tertiary text-text-tertiary cursor-default'
                      : isUpgrade
                        ? 'btn-primary'
                        : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'
                  )}
                >
                  {loading === plan.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isCurrent ? 'Current Plan' : isUpgrade ? 'Upgrade' : plan.id === 'free' ? 'Free' : 'Downgrade'}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-text-tertiary text-center mt-4">
          Tasks reset monthly. Need more? Buy task packs anytime on the pricing page.
        </p>
      </div>
    </div>
  );
}

function getPlanOrder(planId: string): number {
  const order: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 };
  return order[planId] ?? 0;
}
