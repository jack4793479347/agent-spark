'use client';

import { useEffect, useState, useCallback } from 'react';
import { getSocketInstance } from './useSocket';

/* ═══════════════════════════════════════════════════════════════
   Socket event names (mirrors backend SocketEvents)
   ═══════════════════════════════════════════════════════════════ */

const Events = {
  AGENT_ACTIVITY: 'agent:activity',
  AGENT_COMPLETED: 'agent:completed',
  AGENT_ERROR: 'agent:error',
  APPROVAL_REQUIRED: 'agent:approval',
  NEW_RENTAL: 'creator:new_rental',
  EARNING_RECEIVED: 'creator:earning',
  NEW_REVIEW: 'creator:new_review',
} as const;

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

export interface AgentActivityEvent {
  execution_id: string;
  agent_id: string;
  agent_name: string;
  status: 'running' | 'completed' | 'failed';
  text?: string;
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface ApprovalEvent {
  execution_id: string;
  agent_id: string;
  agent_name: string;
  action: string;
  params: Record<string, unknown>;
}

export interface CreatorEvent {
  type: 'rental' | 'earning' | 'review';
  agent_id: string;
  agent_name: string;
  message: string;
  amount_cents?: number;
  rating?: number;
  created_at: string;
}

/* ═══════════════════════════════════════════════════════════════
   useAgentActivity
   Collects real-time agent execution events for the dashboard.
   ═══════════════════════════════════════════════════════════════ */

export function useAgentActivity(maxItems = 10) {
  const [events, setEvents] = useState<AgentActivityEvent[]>([]);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket) return;

    const onActivity = (data: AgentActivityEvent) => {
      setEvents((prev) => [data, ...prev].slice(0, maxItems));
    };
    const onCompleted = (data: AgentActivityEvent) => {
      setEvents((prev) => {
        const updated = prev.map((e) =>
          e.execution_id === data.execution_id ? { ...e, ...data, status: 'completed' as const } : e
        );
        // If not found, prepend
        if (!prev.some((e) => e.execution_id === data.execution_id)) {
          return [{ ...data, status: 'completed' as const }, ...updated].slice(0, maxItems);
        }
        return updated;
      });
    };
    const onError = (data: AgentActivityEvent) => {
      setEvents((prev) => {
        const updated = prev.map((e) =>
          e.execution_id === data.execution_id ? { ...e, ...data, status: 'failed' as const } : e
        );
        if (!prev.some((e) => e.execution_id === data.execution_id)) {
          return [{ ...data, status: 'failed' as const }, ...updated].slice(0, maxItems);
        }
        return updated;
      });
    };

    socket.on(Events.AGENT_ACTIVITY, onActivity);
    socket.on(Events.AGENT_COMPLETED, onCompleted);
    socket.on(Events.AGENT_ERROR, onError);

    return () => {
      socket.off(Events.AGENT_ACTIVITY, onActivity);
      socket.off(Events.AGENT_COMPLETED, onCompleted);
      socket.off(Events.AGENT_ERROR, onError);
    };
  }, [maxItems]);

  return events;
}

/* ═══════════════════════════════════════════════════════════════
   useApprovalRequired
   Fires when an agent needs human approval to proceed.
   ═══════════════════════════════════════════════════════════════ */

export function useApprovalRequired() {
  const [pending, setPending] = useState<ApprovalEvent[]>([]);

  const dismiss = useCallback((executionId: string) => {
    setPending((prev) => prev.filter((e) => e.execution_id !== executionId));
  }, []);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket) return;

    const onApproval = (data: ApprovalEvent) => {
      setPending((prev) => [data, ...prev]);
    };

    socket.on(Events.APPROVAL_REQUIRED, onApproval);
    return () => {
      socket.off(Events.APPROVAL_REQUIRED, onApproval);
    };
  }, []);

  return { pending, dismiss };
}

/* ═══════════════════════════════════════════════════════════════
   useCreatorEvents
   Fires when a creator gets a new rental, earning, or review.
   ═══════════════════════════════════════════════════════════════ */

export function useCreatorEvents(maxItems = 20) {
  const [events, setEvents] = useState<CreatorEvent[]>([]);

  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket) return;

    const onRental = (data: { agent_id: string; agent_name: string; [k: string]: unknown }) => {
      setEvents((prev) => [{
        type: 'rental' as const,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        message: `New rental for ${data.agent_name}`,
        created_at: new Date().toISOString(),
      }, ...prev].slice(0, maxItems));
    };

    const onEarning = (data: { agent_id: string; agent_name: string; amount_cents: number; [k: string]: unknown }) => {
      setEvents((prev) => [{
        type: 'earning' as const,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        message: `Earned $${(data.amount_cents / 100).toFixed(2)} from ${data.agent_name}`,
        amount_cents: data.amount_cents,
        created_at: new Date().toISOString(),
      }, ...prev].slice(0, maxItems));
    };

    const onReview = (data: { agent_id: string; agent_name: string; rating: number; [k: string]: unknown }) => {
      setEvents((prev) => [{
        type: 'review' as const,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        message: `New ${data.rating}-star review for ${data.agent_name}`,
        rating: data.rating,
        created_at: new Date().toISOString(),
      }, ...prev].slice(0, maxItems));
    };

    socket.on(Events.NEW_RENTAL, onRental);
    socket.on(Events.EARNING_RECEIVED, onEarning);
    socket.on(Events.NEW_REVIEW, onReview);

    return () => {
      socket.off(Events.NEW_RENTAL, onRental);
      socket.off(Events.EARNING_RECEIVED, onEarning);
      socket.off(Events.NEW_REVIEW, onReview);
    };
  }, [maxItems]);

  return events;
}
