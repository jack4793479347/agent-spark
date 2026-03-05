'use client';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Wrench,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExecutionStep {
  type: 'tool_call' | 'text' | 'approval_pause';
  tool_name?: string;
  input?: unknown;
  output?: unknown;
  text?: string;
  duration_ms?: number;
  timestamp: string;
}

export interface ExecutionData {
  id: string;
  agent_id: string;
  agent_name?: string;
  input_text: string;
  status: 'queued' | 'running' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
  steps: ExecutionStep[];
  result?: { text?: string };
  error?: string;
  total_tokens: number;
  total_tool_calls: number;
  started_at: string;
  completed_at?: string;
}

const STATUS_CONFIG: Record<ExecutionData['status'], { icon: React.ElementType; color: string; label: string; bg: string; animate?: boolean }> = {
  queued: { icon: Clock, color: 'text-text-tertiary', label: 'Queued', bg: 'bg-gray-50' },
  running: { icon: Loader2, color: 'text-accent-primary', label: 'Running', bg: 'bg-blue-50', animate: true },
  awaiting_approval: { icon: AlertTriangle, color: 'text-warning', label: 'Awaiting Approval', bg: 'bg-yellow-50' },
  completed: { icon: CheckCircle, color: 'text-success', label: 'Completed', bg: 'bg-green-50' },
  failed: { icon: XCircle, color: 'text-error', label: 'Failed', bg: 'bg-red-50' },
  cancelled: { icon: XCircle, color: 'text-text-tertiary', label: 'Cancelled', bg: 'bg-gray-50' },
};

interface StepItemProps {
  step: ExecutionStep;
  index: number;
}

function StepItem({ step, index }: StepItemProps) {
  const [expanded, setExpanded] = useState(false);

  const toolName = step.tool_name?.replace('__', ' → ') ?? '';

  return (
    <div className="relative pl-6">
      {/* Timeline dot */}
      <div className={cn(
        'absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-bg-primary',
        step.type === 'tool_call' ? 'bg-accent-primary' :
        step.type === 'approval_pause' ? 'bg-warning' : 'bg-success'
      )} />

      <div className="pb-4">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-text-tertiary" />
          ) : (
            <ChevronRight className="w-3 h-3 text-text-tertiary" />
          )}

          {step.type === 'tool_call' && (
            <>
              <Wrench className="w-3.5 h-3.5 text-accent-primary" strokeWidth={1.75} />
              <span className="text-xs font-medium text-text-primary">{toolName}</span>
            </>
          )}
          {step.type === 'text' && (
            <>
              <MessageSquare className="w-3.5 h-3.5 text-success" strokeWidth={1.75} />
              <span className="text-xs font-medium text-text-primary">Response</span>
            </>
          )}
          {step.type === 'approval_pause' && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-warning" strokeWidth={1.75} />
              <span className="text-xs font-medium text-warning">Approval needed: {toolName}</span>
            </>
          )}

          {step.duration_ms !== undefined && (
            <span className="text-[10px] text-text-tertiary ml-auto">{step.duration_ms}ms</span>
          )}
        </div>

        {expanded && (
          <div className="mt-2 space-y-2">
            {step.text && (
              <p className="text-xs text-text-secondary bg-bg-tertiary rounded-md p-2 whitespace-pre-wrap">
                {step.text}
              </p>
            )}
            {step.input != null && (
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Input</span>
                <pre className="text-[11px] text-text-secondary bg-bg-tertiary rounded-md p-2 mt-0.5 overflow-x-auto">
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}
            {step.output != null && (
              <div>
                <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Output</span>
                <pre className="text-[11px] text-text-secondary bg-bg-tertiary rounded-md p-2 mt-0.5 overflow-x-auto">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExecutionFeedProps {
  executions: ExecutionData[];
  className?: string;
}

export function ExecutionFeed({ executions, className }: ExecutionFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps arrive
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [executions]);

  if (executions.length === 0) {
    return (
      <div className={cn('glass-card-static text-center py-8', className)}>
        <Clock className="w-8 h-8 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-text-tertiary text-sm">No recent executions</p>
        <p className="text-text-tertiary text-xs mt-1">Run an agent to see live activity here</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {executions.map((exec) => {
        const statusConfig = STATUS_CONFIG[exec.status];
        const StatusIcon = statusConfig.icon;

        return (
          <div key={exec.id} className="glass-card-static">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon
                  className={cn('w-4 h-4 shrink-0', statusConfig.color, statusConfig.animate && 'animate-spin')}
                  strokeWidth={1.75}
                />
                <span className="text-sm font-semibold text-text-primary truncate">
                  {exec.agent_name ?? 'Agent'}
                </span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-medium shrink-0',
                  statusConfig.bg, statusConfig.color
                )}>
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-text-tertiary shrink-0">
                <span>{exec.total_tokens.toLocaleString()} tokens</span>
                <span>{exec.total_tool_calls} tools</span>
              </div>
            </div>

            {/* Input */}
            <p className="text-xs text-text-secondary mb-3 line-clamp-2">{exec.input_text}</p>

            {/* Steps timeline */}
            {exec.steps.length > 0 && (
              <div ref={feedRef} className="border-l border-bg-tertiary ml-1.5 max-h-[300px] overflow-y-auto scrollbar-none">
                {exec.steps.map((step, i) => (
                  <StepItem key={i} step={step} index={i} />
                ))}
              </div>
            )}

            {/* Result */}
            {exec.status === 'completed' && exec.result?.text && (
              <div className="mt-3 pt-3 border-t border-bg-tertiary">
                <p className="text-xs text-text-secondary whitespace-pre-wrap line-clamp-4">
                  {exec.result.text}
                </p>
              </div>
            )}

            {/* Error */}
            {exec.status === 'failed' && exec.error && (
              <div className="mt-3 pt-3 border-t border-bg-tertiary">
                <p className="text-xs text-error">{exec.error}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
