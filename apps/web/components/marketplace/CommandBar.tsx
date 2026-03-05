'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Bot,
  Star,
  DollarSign,
  Check,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────

interface RecommendedAgent {
  agent_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rating: number;
  price_per_call_cents: number;
  total_calls: number;
  match_reason: string;
  already_rented: boolean;
}

interface AssemblyResult {
  workflow_summary: string;
  recommended_agents: RecommendedAgent[];
  total_cost_cents: number;
  capabilities_covered: string[];
  connectors_needed: string[];
}

// ─── Component ──────────────────────────────────────────────────

interface CommandBarProps {
  className?: string;
}

export function CommandBar({ className }: CommandBarProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssemblyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Global Cmd+K / Ctrl+K to open, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const handleAssemble = useCallback(async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/workflows/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data.assembly);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assemble workflow');
    } finally {
      setLoading(false);
    }
  }, [prompt, loading]);

  const handleSaveWorkflow = useCallback(async () => {
    if (!result || saving) return;

    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: result.workflow_summary.slice(0, 100),
          description: result.workflow_summary,
          agent_ids: result.recommended_agents.map((a) => a.agent_id),
          assembled_by_ai: true,
          assembly_prompt: prompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save');
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  }, [result, saving, prompt]);

  const handleRentAgent = useCallback(async (agentId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agent_id: agentId, allowed_connection_ids: [] }),
      });

      if (res.ok) {
        const data = await res.json();
        // If there's a checkout URL, redirect; otherwise it was free
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          // Update the result to mark this agent as rented
          setResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              recommended_agents: prev.recommended_agents.map((a) =>
                a.agent_id === agentId ? { ...a, already_rented: true } : a
              ),
            };
          });
        }
      }
    } catch {
      // Silently handle — user will see the agent isn't rented
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(() => {
      setPrompt('');
      setResult(null);
      setError(null);
      setSaved(false);
    }, 200);
  };

  const unrentedAgents = result?.recommended_agents.filter((a) => !a.already_rented) ?? [];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-tertiary hover:border-accent-primary/30 hover:text-text-secondary transition-colors cursor-pointer',
          className
        )}
      >
        <Sparkles className="w-4 h-4 text-accent-secondary shrink-0" strokeWidth={1.75} />
        <span className="truncate">Describe what you need...</span>
        <kbd className="ml-auto text-[10px] text-text-tertiary bg-bg-tertiary rounded px-1.5 py-0.5 font-mono shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative w-full max-w-2xl mx-4 bg-bg-primary rounded-[var(--radius-xl)] shadow-elevation-high border border-bg-tertiary overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-tertiary">
              <Sparkles className="w-5 h-5 text-accent-secondary shrink-0" strokeWidth={1.75} />
              <h3 className="font-heading text-base font-semibold text-text-primary">
                AI Workflow Assembler
              </h3>
              <button
                onClick={handleClose}
                className="ml-auto p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Input */}
            <div className="px-5 py-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAssemble()}
                  placeholder="e.g., Automate my Shopify returns and notify customers via email..."
                  className="flex-1 px-3 py-2.5 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-secondary text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-primary/50 transition-colors"
                  disabled={loading}
                />
                <button
                  onClick={handleAssemble}
                  disabled={!prompt.trim() || loading}
                  className="px-4 py-2.5 rounded-[var(--radius-md)] bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.75} />
                      Assembling...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                      Assemble
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="px-5 pb-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-accent-primary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">
                  Analyzing your request and finding the best agents...
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-5 pb-4">
                <div className="flex items-start gap-2 p-3 rounded-[var(--radius-md)] bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-error mt-0.5 shrink-0" strokeWidth={1.75} />
                  <p className="text-sm text-error">{error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="px-5 pb-5 space-y-4 max-h-[50vh] overflow-y-auto">
                {/* Summary */}
                <div className="p-3 rounded-[var(--radius-md)] bg-accent-primary/5 border border-accent-primary/20">
                  <p className="text-sm text-text-primary font-medium">
                    {result.workflow_summary}
                  </p>
                  {result.connectors_needed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.connectors_needed.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-bg-tertiary text-text-secondary"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Agents */}
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                    Recommended Team ({result.recommended_agents.length} agents)
                  </h4>
                  <div className="space-y-2">
                    {result.recommended_agents.map((agent) => (
                      <div
                        key={agent.agent_id}
                        className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-bg-tertiary/50 border border-bg-tertiary"
                      >
                        <Bot
                          className="w-5 h-5 text-accent-primary mt-0.5 shrink-0"
                          strokeWidth={1.75}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {agent.name}
                            </span>
                            <span className="flex items-center gap-0.5 text-[10px] text-warning">
                              <Star className="w-2.5 h-2.5 fill-current" strokeWidth={0} />
                              {agent.rating.toFixed(1)}
                            </span>
                            {agent.price_per_call_cents > 0 && (
                              <span className="flex items-center gap-0.5 text-[10px] text-text-tertiary">
                                <DollarSign className="w-2.5 h-2.5" strokeWidth={2} />
                                {(agent.price_per_call_cents / 100).toFixed(2)}/call
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5">
                            {agent.match_reason}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {agent.already_rented ? (
                            <span className="flex items-center gap-1 text-[11px] font-medium text-success">
                              <Check className="w-3.5 h-3.5" strokeWidth={2} />
                              Rented
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRentAgent(agent.agent_id)}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-[var(--radius-sm)] bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors"
                            >
                              Rent
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-bg-tertiary">
                  <div className="text-xs text-text-tertiary">
                    {unrentedAgents.length > 0 ? (
                      <>
                        {unrentedAgents.length} agent{unrentedAgents.length > 1 ? 's' : ''} to rent
                        {result.total_cost_cents > 0 && (
                          <> · ${(result.total_cost_cents / 100).toFixed(2)} total</>
                        )}
                      </>
                    ) : (
                      'All agents rented'
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {saved ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                        <Check className="w-4 h-4" strokeWidth={2} />
                        Workflow Saved
                      </span>
                    ) : (
                      <button
                        onClick={handleSaveWorkflow}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] bg-accent-primary text-white hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                        )}
                        Save Workflow
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
