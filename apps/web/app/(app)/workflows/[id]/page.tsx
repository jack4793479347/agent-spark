'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Bot,
  ArrowRight,
  FileText,
  Zap,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { agentsApi } from '@/lib/api';
import type { Execution } from '@/lib/api/agents';

interface ExecutionStep {
  type: string;
  text?: string;
  tool_name?: string;
  input?: unknown;
  output?: unknown;
  duration_ms?: number;
}

const STATUS_ICONS = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2} />,
  active: <Loader2 className="w-4 h-4 text-text-primary animate-spin" strokeWidth={2} />,
  pending: <Clock className="w-4 h-4 text-text-tertiary" strokeWidth={2} />,
  error: <AlertCircle className="w-4 h-4 text-red-500" strokeWidth={2} />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" strokeWidth={2} />,
};

export default function WorkflowDetailPage({ params }: { params: { id: string } }) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await agentsApi.getExecution(params.id);
        if (cancelled) return;
        setExecution(data.execution);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Execution not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-4 animate-[fadeUp_0.4s_ease_both]">
        <div className="h-4 w-32 rounded bg-bg-tertiary" />
        <div className="h-8 w-64 rounded bg-bg-tertiary" />
        <div className="glass-card-static !p-4 h-16" />
        <div className="glass-card-static !p-4 h-24" />
        <div className="glass-card-static !p-4 h-24" />
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="space-y-4 animate-[fadeUp_0.4s_ease_both]">
        <Link href="/workflows" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors no-underline">
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          Back to Workflows
        </Link>
        <div className="glass-card-static !p-8 text-center">
          <p className="text-text-secondary text-sm">{error || 'Execution not found'}</p>
          <Link href="/history" className="text-sm text-text-tertiary underline mt-2 inline-block">View execution history</Link>
        </div>
      </div>
    );
  }

  const steps = (execution.steps ?? []) as ExecutionStep[];
  const completedSteps = steps.filter(s => s.type === 'tool_call' && s.output).length;
  const totalSteps = steps.filter(s => s.type === 'tool_call').length || 1;
  const progressPct = execution.status === 'completed' ? 100 : (completedSteps / totalSteps) * 100;
  const duration = execution.completed_at && execution.started_at
    ? ((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(1) + 's'
    : '...';

  return (
    <div className="space-y-6 animate-[fadeUp_0.4s_ease_both]">
      {/* Back link */}
      <Link href="/workflows" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors no-underline">
        <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
        Back to Workflows
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-text-primary font-heading mb-1">
            Execution Detail
          </h2>
          <p className="text-sm text-text-secondary">
            {execution.input_text}
          </p>
        </div>
        <StatusBadge status={execution.status === 'failed' ? 'error' : execution.status as 'active' | 'completed'} />
      </div>

      {/* Progress bar */}
      <div className="glass-card-static !p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Progress</span>
          <span className="text-xs text-text-secondary">{execution.status === 'completed' ? 'Completed' : execution.status === 'failed' ? 'Failed' : `${completedSteps} / ${totalSteps} steps`}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ background: execution.status === 'failed' ? '#EF4444' : '#1A1A1A', width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Execution timeline */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const isToolCall = step.type === 'tool_call';
          const stepStatus = execution.status === 'failed' && i === steps.length - 1 ? 'failed'
            : step.output !== undefined ? 'completed'
            : 'completed'; // all returned steps are complete

          return (
            <div
              key={i}
              className="glass-card-static !p-0 overflow-hidden"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex flex-col items-center gap-1">
                  {STATUS_ICONS[stepStatus as keyof typeof STATUS_ICONS] ?? STATUS_ICONS.completed}
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    {isToolCall ? <Zap className="w-3.5 h-3.5 text-text-primary" strokeWidth={1.75} />
                      : <Bot className="w-3.5 h-3.5 text-text-primary" strokeWidth={1.75} />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">
                      {isToolCall ? step.tool_name : 'Agent'}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {isToolCall ? `Tool call` : step.text}
                    </div>
                  </div>
                </div>

                {isToolCall && step.duration_ms != null && (
                  <span className="text-xs text-text-tertiary font-mono shrink-0">
                    {(step.duration_ms / 1000).toFixed(1)}s
                  </span>
                )}

                <span className="text-[10px] font-semibold text-text-tertiary bg-bg-tertiary rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
              </div>

              {/* Text content or tool I/O */}
              {step.type === 'text' && step.text && (
                <div className="border-t border-bg-tertiary/50 px-5 py-3 bg-bg-secondary/30">
                  <p className="text-xs text-text-secondary leading-relaxed m-0 font-mono bg-bg-tertiary/50 rounded-md px-2 py-1.5">
                    {step.text}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Result card */}
      {execution.result?.text && (
        <div className="glass-card-static !p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={2} />
            <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Result</span>
          </div>
          <p className="text-sm text-text-primary m-0">{execution.result.text}</p>
        </div>
      )}

      {/* Summary card */}
      <div className="glass-card-static !p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Zap className="w-4 h-4 text-text-primary" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text-primary">Execution Summary</div>
            <div className="text-xs text-text-secondary">
              {execution.total_tool_calls} tool calls &middot; {execution.total_tokens?.toLocaleString()} tokens &middot; {execution.cost_cents}c cost
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-text-primary font-heading tracking-tight">{duration}</div>
            <div className="text-[10px] text-text-tertiary uppercase tracking-wider">elapsed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
