'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageData {
  allowed: boolean;
  remaining_tasks: number;
  remaining_a2a_calls: number;
  plan: string;
}

const PLAN_LIMITS: Record<string, { tasks: number; a2a: number }> = {
  free: { tasks: 50, a2a: 10 },
  starter: { tasks: 500, a2a: 100 },
  pro: { tasks: 2000, a2a: 500 },
  business: { tasks: 10000, a2a: 2500 },
};

const PLAN_DISPLAY: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
};

interface UsageMeterProps {
  className?: string;
  onUpgradeClick?: () => void;
}

export function UsageMeter({ className, onUpgradeClick }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/billing/usage`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch {
        // Use default display values
      }
    };

    fetchUsage();
  }, []);

  // Show placeholder during loading
  const plan = usage?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const remaining = usage?.remaining_tasks ?? limits.tasks;
  const used = limits.tasks - remaining;
  const percentage = limits.tasks > 0 ? Math.round((used / limits.tasks) * 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const a2aRemaining = usage?.remaining_a2a_calls ?? limits.a2a;
  const a2aUsed = limits.a2a - a2aRemaining;
  const a2aPercentage = limits.a2a > 0 ? Math.round((a2aUsed / limits.a2a) * 100) : 0;

  return (
    <div className={cn('glass-card-static', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-primary" strokeWidth={1.75} />
          <span className="text-sm font-heading font-semibold text-text-primary">Usage</span>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
          plan === 'free' ? 'bg-bg-tertiary text-text-tertiary' :
          plan === 'starter' ? 'bg-blue-50 text-blue-600' :
          plan === 'pro' ? 'bg-purple-50 text-purple-600' :
          'bg-amber-50 text-amber-700'
        )}>
          {PLAN_DISPLAY[plan] ?? plan}
        </span>
      </div>

      {/* Tasks meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary font-medium">Tasks this period</span>
          <span className={cn(
            'text-xs font-semibold',
            isAtLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-text-primary'
          )}>
            {used.toLocaleString()} / {limits.tasks.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isAtLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-accent-primary'
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-text-tertiary mt-1">
          {remaining.toLocaleString()} tasks remaining
        </p>
      </div>

      {/* A2A calls meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-secondary font-medium">A2A calls</span>
          <span className="text-xs font-semibold text-text-primary">
            {a2aUsed.toLocaleString()} / {limits.a2a.toLocaleString()}
          </span>
        </div>
        <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              a2aPercentage >= 100 ? 'bg-error' : a2aPercentage >= 80 ? 'bg-warning' : 'bg-violet-500'
            )}
            style={{ width: `${Math.min(a2aPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Upgrade CTA if near or at limit */}
      {isNearLimit && (
        <button
          onClick={onUpgradeClick}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-colors',
            isAtLimit
              ? 'bg-error/10 text-error hover:bg-error/20'
              : 'bg-warning/10 text-warning hover:bg-warning/20'
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
          {isAtLimit ? 'Limit Reached — Upgrade Plan' : 'Running Low — Upgrade Plan'}
        </button>
      )}
    </div>
  );
}
