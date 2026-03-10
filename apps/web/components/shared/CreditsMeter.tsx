'use client';

import Link from 'next/link';
import { useBillingStore } from '@/lib/store/billing';
import { PLATFORM_PLANS, type PlanTier } from '@agentspark/shared';

interface CreditsMeterProps {
  collapsed?: boolean;
}

export function CreditsMeter({ collapsed = false }: CreditsMeterProps) {
  const { plan, usage, loading } = useBillingStore();

  const planKey = (plan || 'free') as PlanTier;
  const planDef = PLATFORM_PLANS[planKey] ?? PLATFORM_PLANS.free;
  const totalTasks = planDef.monthly_tasks;
  const tasksUsed = totalTasks - (usage?.remaining_tasks ?? totalTasks);
  const tasksPct = totalTasks > 0 ? (tasksUsed / totalTasks) * 100 : 0;

  if (collapsed) {
    return (
      <div className="mx-auto w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.03)' }} title={`${tasksUsed} / ${totalTasks} tasks`}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#BBB' }}>{loading ? '—' : `${Math.round(tasksPct)}%`}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 14,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 11,
        border: '1px solid rgba(255,255,255,0.6)',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#AAA',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
          }}
        >
          Tasks
        </span>
        <span style={{ fontSize: 11, color: '#BBB', fontFamily: 'var(--font-body)' }}>
          {loading ? '—' : `${tasksUsed.toLocaleString()} / ${totalTasks.toLocaleString()}`}
        </span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${tasksPct}%`,
            height: '100%',
            borderRadius: 2,
            background: tasksPct > 80 ? '#F59E0B' : '#1A1A1A',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: '#CCC', fontFamily: 'var(--font-body)', marginTop: 6 }}>
        <Link href="/pricing" className="no-underline" style={{ color: '#999', fontWeight: 550 }}>
          {tasksPct > 90 ? 'Upgrade plan' : 'View plans'}
        </Link>
      </div>
    </div>
  );
}
