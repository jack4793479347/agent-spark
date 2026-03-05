'use client';

import { useState } from 'react';
import { AlertTriangle, Check, X, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApprovalData {
  id: string;
  execution_id: string;
  action_type: string;
  action_details: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at: string;
  created_at: string;
  agent_executions?: {
    agent_id: string;
    input_text: string;
  };
}

interface ApprovalCardProps {
  approval: ApprovalData;
  onRespond: (approvalId: string, approved: boolean) => Promise<void>;
  className?: string;
}

function formatActionType(actionType: string): string {
  return actionType.replace('__', ' → ').replace(/_/g, ' ');
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function ApprovalCard({ approval, onRespond, className }: ApprovalCardProps) {
  const [responding, setResponding] = useState<'approve' | 'reject'>();

  const handleRespond = async (approved: boolean) => {
    setResponding(approved ? 'approve' : 'reject');
    try {
      await onRespond(approval.id, approved);
    } finally {
      setResponding(undefined);
    }
  };

  const isExpired = new Date(approval.expires_at).getTime() <= Date.now();

  return (
    <div className={cn('glass-card-static border-l-4 border-warning', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-text-primary">Approval Required</span>
        <div className="ml-auto flex items-center gap-1 text-text-tertiary">
          <Clock className="w-3 h-3" />
          <span className="text-[10px]">{timeRemaining(approval.expires_at)}</span>
        </div>
      </div>

      {/* Action */}
      <div className="mb-3">
        <p className="text-xs text-text-secondary mb-1">
          The agent wants to execute:
        </p>
        <span className="inline-block px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-semibold">
          {formatActionType(approval.action_type)}
        </span>
      </div>

      {/* Details */}
      <div className="mb-4">
        <span className="text-[10px] text-text-tertiary uppercase tracking-wider">Parameters</span>
        <pre className="text-[11px] text-text-secondary bg-bg-tertiary rounded-md p-2 mt-1 overflow-x-auto max-h-[150px]">
          {JSON.stringify(approval.action_details, null, 2)}
        </pre>
      </div>

      {/* Original task context */}
      {approval.agent_executions?.input_text && (
        <p className="text-[11px] text-text-tertiary mb-4">
          Original task: &ldquo;{approval.agent_executions.input_text}&rdquo;
        </p>
      )}

      {/* Actions */}
      {approval.status === 'pending' && !isExpired && (
        <div className="flex gap-2">
          <button
            onClick={() => handleRespond(true)}
            disabled={!!responding}
            className={cn(
              'btn-primary text-xs py-1.5 px-4 flex items-center gap-1.5',
              responding && 'opacity-60 cursor-not-allowed'
            )}
          >
            {responding === 'approve' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            Approve
          </button>
          <button
            onClick={() => handleRespond(false)}
            disabled={!!responding}
            className={cn(
              'text-xs py-1.5 px-4 rounded-[var(--radius-md)] text-error hover:bg-red-50 transition-colors flex items-center gap-1.5',
              responding && 'opacity-60 cursor-not-allowed'
            )}
          >
            {responding === 'reject' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            )}
            Reject
          </button>
        </div>
      )}

      {isExpired && approval.status === 'pending' && (
        <p className="text-xs text-text-tertiary italic">This approval has expired.</p>
      )}
    </div>
  );
}
