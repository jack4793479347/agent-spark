'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, ArrowRight, Clock, DollarSign, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

export interface A2ACallEvent {
  a2aCallId: string;
  callerAgentId: string;
  callerAgentName?: string;
  targetAgentId: string;
  targetAgentName: string;
  task?: string;
  status: 'started' | 'completed' | 'failed';
  durationMs?: number;
  costCents?: number;
  executionId: string;
}

interface AgentNode {
  id: string;
  name: string;
  role: 'caller' | 'target';
  callCount: number;
}

interface A2AEdge {
  id: string;
  from: string;
  to: string;
  task: string;
  status: 'running' | 'completed' | 'failed';
  durationMs?: number;
  costCents?: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  running: { color: 'text-blue-500', bg: 'bg-blue-50', icon: Loader2 },
  completed: { color: 'text-success', bg: 'bg-emerald-50', icon: CheckCircle2 },
  failed: { color: 'text-error', bg: 'bg-red-50', icon: XCircle },
};

// ─── Component ──────────────────────────────────────────────────

interface WorkflowVisualizerProps {
  executionId: string;
  callerAgentName?: string;
  className?: string;
}

export function WorkflowVisualizer({
  executionId,
  callerAgentName = 'Primary Agent',
  className,
}: WorkflowVisualizerProps) {
  const [nodes, setNodes] = useState<Map<string, AgentNode>>(new Map());
  const [edges, setEdges] = useState<A2AEdge[]>([]);

  const handleA2AEvent = useCallback(
    (event: A2ACallEvent) => {
      if (event.executionId !== executionId) return;

      // Add or update nodes
      setNodes((prev) => {
        const next = new Map(prev);

        if (!next.has(event.callerAgentId)) {
          next.set(event.callerAgentId, {
            id: event.callerAgentId,
            name: event.callerAgentName ?? callerAgentName,
            role: 'caller',
            callCount: 0,
          });
        }

        if (!next.has(event.targetAgentId)) {
          next.set(event.targetAgentId, {
            id: event.targetAgentId,
            name: event.targetAgentName,
            role: 'target',
            callCount: 0,
          });
        }

        if (event.status === 'started') {
          const caller = next.get(event.callerAgentId)!;
          next.set(event.callerAgentId, { ...caller, callCount: caller.callCount + 1 });
        }

        return next;
      });

      // Add or update edges
      setEdges((prev) => {
        const existingIdx = prev.findIndex((e) => e.id === event.a2aCallId);

        if (event.status === 'started') {
          if (existingIdx >= 0) return prev;
          return [
            ...prev,
            {
              id: event.a2aCallId,
              from: event.callerAgentId,
              to: event.targetAgentId,
              task: event.task ?? '',
              status: 'running',
            },
          ];
        }

        // completed or failed
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            status: event.status === 'completed' ? 'completed' : 'failed',
            durationMs: event.durationMs,
            costCents: event.costCents,
          };
          return updated;
        }

        return prev;
      });
    },
    [executionId, callerAgentName]
  );

  // Listen for Socket.io events
  useEffect(() => {
    // Socket.io client would connect here in production
    // For now, expose the handler so parent can feed events
    const win = window as unknown as Record<string, unknown>;
    win.__a2aHandler = handleA2AEvent;
    return () => {
      delete win.__a2aHandler;
    };
  }, [handleA2AEvent]);

  const nodeList = Array.from(nodes.values());
  const hasData = nodeList.length > 0;

  if (!hasData) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Bot className="w-8 h-8 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} />
        <p className="text-sm text-text-tertiary">
          No A2A calls yet. When agents collaborate, the network will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Network graph (node list + edges) */}
      <div className="flex flex-wrap gap-4 items-center justify-center py-4">
        {nodeList.map((node, idx) => (
          <div key={node.id} className="flex items-center gap-3">
            {idx > 0 && (
              <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0" strokeWidth={1.75} />
            )}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-[var(--radius-lg)] border',
                node.role === 'caller'
                  ? 'border-accent-primary/30 bg-accent-primary/5'
                  : 'border-violet-300/30 bg-violet-50'
              )}
            >
              <Bot
                className={cn(
                  'w-5 h-5',
                  node.role === 'caller' ? 'text-accent-primary' : 'text-violet-500'
                )}
                strokeWidth={1.75}
              />
              <div>
                <p className="text-xs font-semibold text-text-primary">{node.name}</p>
                <p className="text-[10px] text-text-tertiary">
                  {node.role === 'caller' ? 'Orchestrator' : 'Delegate'}
                  {node.callCount > 0 && ` · ${node.callCount} calls`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* A2A Call Log */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          A2A Call Log
        </h4>
        {edges.map((edge) => {
          const config = STATUS_CONFIG[edge.status] ?? STATUS_CONFIG.running;
          const Icon = config.icon;

          return (
            <div
              key={edge.id}
              className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-bg-tertiary/50"
            >
              <Icon
                className={cn(
                  'w-4 h-4 mt-0.5 shrink-0',
                  config.color,
                  edge.status === 'running' && 'animate-spin'
                )}
                strokeWidth={1.75}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-text-primary">
                    {nodes.get(edge.from)?.name ?? 'Agent'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-text-tertiary" strokeWidth={2} />
                  <span className="font-medium text-text-primary">
                    {nodes.get(edge.to)?.name ?? 'Agent'}
                  </span>
                </div>
                {edge.task && (
                  <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">
                    {edge.task}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className={cn('text-[10px] font-medium', config.color)}>
                    {edge.status === 'running' ? 'Running...' : edge.status}
                  </span>
                  {edge.durationMs != null && (
                    <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                      <Clock className="w-2.5 h-2.5" strokeWidth={2} />
                      {edge.durationMs < 1000
                        ? `${edge.durationMs}ms`
                        : `${(edge.durationMs / 1000).toFixed(1)}s`}
                    </span>
                  )}
                  {edge.costCents != null && edge.costCents > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                      <DollarSign className="w-2.5 h-2.5" strokeWidth={2} />
                      ${(edge.costCents / 100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
