'use client';

import { useState } from 'react';
import { Bot, Play, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface RentedAgent {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_slug: string;
  agent_category: string;
  status: 'active' | 'paused';
  total_executions: number;
  started_at: string;
}

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

interface QuickExecuteProps {
  rental: RentedAgent;
  onExecute: (rentalId: string, agentId: string, input: string) => Promise<void>;
}

function QuickExecute({ rental, onExecute }: QuickExecuteProps) {
  const [input, setInput] = useState('');
  const [executing, setExecuting] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || executing) return;
    setExecuting(true);
    try {
      await onExecute(rental.id, rental.agent_id, input.trim());
      setInput('');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-bg-tertiary">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Give this agent a task..."
          className="flex-1 px-2.5 py-1.5 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-xs text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || executing}
          className={cn(
            'btn-primary text-xs py-1.5 px-3 flex items-center gap-1',
            (!input.trim() || executing) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {executing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" strokeWidth={2} />
          )}
          Run
        </button>
      </div>
    </div>
  );
}

interface ActiveAgentsListProps {
  rentals: RentedAgent[];
  onExecute: (rentalId: string, agentId: string, input: string) => Promise<void>;
  className?: string;
}

export function ActiveAgentsList({ rentals, onExecute, className }: ActiveAgentsListProps) {
  if (rentals.length === 0) {
    return (
      <div className={cn('glass-card-static text-center py-8', className)}>
        <Bot className="w-8 h-8 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-text-tertiary text-sm">No rented agents yet</p>
        <Link href="/" className="text-accent-primary text-xs hover:underline mt-1 inline-block">
          Browse the marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {rentals.map((rental) => {
        const colors = CATEGORY_COLORS[rental.agent_category] ?? { bg: 'bg-indigo-50', text: 'text-indigo-600' };

        return (
          <div key={rental.id} className="glass-card-static">
            <div className="flex items-center gap-3">
              <div className={cn('icon-container', colors.bg)}>
                <Bot className={cn('w-5 h-5', colors.text)} strokeWidth={1.75} />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/agent/${rental.agent_slug}`}
                  className="text-sm font-semibold text-text-primary hover:text-accent-primary transition-colors"
                >
                  {rental.agent_name}
                </Link>
                <p className="text-[11px] text-text-tertiary">
                  {rental.total_executions} executions
                </p>
              </div>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-[10px] font-medium',
                rental.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
              )}>
                {rental.status}
              </span>
            </div>
            <QuickExecute rental={rental} onExecute={onExecute} />
          </div>
        );
      })}
    </div>
  );
}
