'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/hooks/useApiData';
import { useCreatorEvents } from '@/hooks/useRealtimeEvents';
import { getMyAgents, type AgentMine } from '@/lib/api/agents';
import { getEarnings, getEarningsHistory, type EarningsSummary, type EarningsHistoryEntry } from '@/lib/api/billing';
import { SkeletonTable } from '@/components/shared/Skeleton';

/* ── Helper components ── */

function NavIcon({ type, size = 16 }: { type: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const icons: Record<string, React.ReactNode> = {
    dollar: <svg {...p}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
    trending: <svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
    star: <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    users: <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    check: <svg {...p}><polyline points="20 6 9 17 4 12" /></svg>,
    edit: <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
    plus: <svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    external: <svg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    refresh: <svg {...p}><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
  };
  return <>{icons[type] || null}</>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    live: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', label: 'Live' },
    published: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', label: 'Live' },
    review: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', label: 'In Review' },
    in_review: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', label: 'In Review' },
    draft: { color: '#AAA', bg: 'rgba(0,0,0,.03)', label: 'Draft' },
  };
  const s = map[status] ?? map.draft;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-body)' }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: s.color }} />
      {s.label}
    </span>
  );
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * 80;
    const y = 24 - (v / max) * 20;
    return x + ',' + y;
  }).join(' ');
  return (
    <svg width="80" height="28" viewBox="0 0 80 28">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '24px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)', borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#EF4444', fontFamily: 'var(--font-body)', margin: '0 0 12px' }}>{message}</p>
      <button onClick={onRetry} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1A1A1A', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
      }}>
        <NavIcon type="refresh" size={12} /> Retry
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '48px 24px', background: 'rgba(255,255,255,.45)', border: '1px solid rgba(255,255,255,.55)', borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0 }}>{message}</p>
    </div>
  );
}

/* ── Helpers ── */

function fk(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

function isLiveStatus(status: string): boolean {
  return status === 'live' || status === 'published';
}

/** Convert API agent to the shape our table rows need */
interface AgentRow {
  id: string;
  name: string;
  status: string;
  version: string;
  rentals: number;
  revenue: number;
  executions: number;
  rating: number;
  reviews: number;
  trend: string;
  updated: string;
}

function toAgentRows(agents: AgentMine[], earningsByAgent: Map<string, number>): AgentRow[] {
  return agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    version: a.version ?? '1.0.0',
    rentals: a.active_rentals,
    revenue: Math.round((earningsByAgent.get(a.id) ?? 0) / 100),
    executions: a.total_executions,
    rating: a.avg_rating,
    reviews: a.review_count,
    trend: '',
    updated: a.updated_at ? formatRelative(a.updated_at) : '',
  }));
}

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/** Build payout rows from earnings history */
interface PayoutRow {
  month: string;
  amount: number;
  agents: number;
  status: string;
}

function buildPayouts(entries: EarningsHistoryEntry[]): PayoutRow[] {
  const byMonth = new Map<string, { amount: number; agentIds: Set<string> }>();

  for (const e of entries) {
    if (e.payout_status !== 'paid') continue;
    const date = new Date(e.created_at);
    const key = date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const existing = byMonth.get(key) ?? { amount: 0, agentIds: new Set<string>() };
    existing.amount += e.net_amount_cents;
    if (e.agent_id) existing.agentIds.add(e.agent_id);
    byMonth.set(key, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    amount: Math.round(data.amount / 100),
    agents: data.agentIds.size,
    status: 'paid',
  }));
}

/** Build activity rows from earnings history */
interface ActivityRow {
  text: string;
  time: string;
  type: string;
}

function buildActivity(entries: EarningsHistoryEntry[]): ActivityRow[] {
  return entries.slice(0, 10).map((e) => {
    const agentName = e.agents?.name ?? 'Agent';
    let text = '';
    let type = 'install';
    if (e.source === 'rental') {
      text = `${agentName} rental earning received`;
      type = 'install';
    } else if (e.source === 'a2a_call') {
      text = `A2A call revenue from ${agentName}`;
      type = 'milestone';
    } else if (e.source === 'bonus') {
      text = `Bonus received for ${agentName}`;
      type = 'approve';
    }
    return {
      text,
      time: formatRelative(e.created_at),
      type,
    };
  });
}

/* ── Page ── */

export default function CreatorStudioPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [subtab, setSubtab] = useState('agents');

  // API data
  const agentsApi = useApiData({ fetchFn: async () => (await getMyAgents()).agents });
  const earningsApi = useApiData({ fetchFn: async () => (await getEarnings()).earnings });
  const historyApi = useApiData({ fetchFn: async () => (await getEarningsHistory({ limit: 100 })).earnings });

  // Real-time creator events
  const liveCreatorEvents = useCreatorEvents();

  const agents = agentsApi.data ?? [];
  const earnings = earningsApi.data;
  const history = historyApi.data ?? [];

  // Build agent-level revenue from history
  const earningsByAgent = new Map<string, number>();
  for (const e of history) {
    if (e.agent_id) {
      earningsByAgent.set(e.agent_id, (earningsByAgent.get(e.agent_id) ?? 0) + e.net_amount_cents);
    }
  }

  const agentRows = toAgentRows(agents, earningsByAgent);
  const payoutRows = buildPayouts(history);
  const activityRows = buildActivity(history);

  const totalRevenue = earnings ? Math.round(earnings.current_month_net_cents / 100) : 0;
  const totalRentals = agents.reduce((s, a) => s + a.active_rentals, 0);
  const liveCount = agents.filter(a => isLiveStatus(a.status)).length;
  const liveAgents = agents.filter(a => a.avg_rating > 0);
  const avgRating = liveAgents.length > 0 ? (liveAgents.reduce((s, a) => s + a.avg_rating, 0) / liveAgents.length).toFixed(1) : '0';
  const totalExecs = agents.reduce((s, a) => s + a.total_executions, 0);

  const isLoading = agentsApi.loading || earningsApi.loading || historyApi.loading;
  const hasError = agentsApi.error || earningsApi.error || historyApi.error;
  const errorMessage = agentsApi.error ?? earningsApi.error ?? historyApi.error ?? '';

  const handleRetry = () => {
    agentsApi.refetch();
    earningsApi.refetch();
    historyApi.refetch();
  };

  const subBtn = (label: string, id: string) => (
    <button onClick={() => setSubtab(id)} style={{
      fontSize: 12, fontWeight: subtab === id ? 600 : 450, color: subtab === id ? '#1A1A1A' : '#CCC',
      background: subtab === id ? 'rgba(0,0,0,.04)' : 'none', border: 'none', borderRadius: 6,
      padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all .12s',
    }}>{label}</button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, animation: 'fadeUp .3s ease' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 400, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', marginBottom: 2, margin: 0 }}>Creator Studio</h1>
          <p style={{ fontSize: 13.5, color: '#999', fontFamily: 'var(--font-body)', margin: 0 }}>
            {isLoading ? 'Loading...' : liveCount + ' agents live \u00B7 ' + fk(totalRentals) + ' total rentals'}
          </p>
        </div>
        <Link href="/creator/publish" style={{ textDecoration: 'none' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all .15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}>
            <NavIcon type="plus" size={13} /> New Agent
          </button>
        </Link>
      </div>

      {/* Error state */}
      {hasError && !isLoading && (
        <div style={{ marginBottom: 20 }}>
          <ErrorBanner message={errorMessage} onRetry={handleRetry} />
        </div>
      )}

      {/* Stats row */}
      {!hasError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20, animation: 'fadeUp .35s ease' }}>
          {[
            { label: 'Revenue (Month)', value: isLoading ? '...' : '$' + fk(totalRevenue), change: '', icon: 'dollar', chart: [20, 25, 22, 30, 35, 42, 48], color: '#22C55E' },
            { label: 'Active Rentals', value: isLoading ? '...' : fk(totalRentals), change: '', icon: 'users', chart: [30, 32, 35, 33, 38, 40, 44], color: '#3B82F6' },
            { label: 'Avg Rating', value: isLoading ? '...' : avgRating, change: '', icon: 'star', chart: [45, 44, 46, 46, 47, 47, 48], color: '#F59E0B' },
            { label: 'Executions', value: isLoading ? '...' : fk(totalExecs), change: '', icon: 'trending', chart: [15, 20, 18, 25, 30, 35, 42], color: '#8B5CF6' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '16px 16px 12px', background: 'rgba(255,255,255,.5)', borderRadius: 12, border: '1px solid rgba(255,255,255,.6)', transition: 'all .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.75)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.5)'}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 400, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
                </div>
                <MiniChart data={s.chart} color={s.color} />
              </div>
              {s.change && <span style={{ fontSize: 10.5, fontWeight: 600, color: '#22C55E', fontFamily: 'var(--font-body)' }}>{s.change + ' vs last month'}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, animation: 'fadeUp .4s ease' }}>
        {subBtn('Published Agents', 'agents')}
        {subBtn('Payouts', 'payouts')}
        {subBtn('Activity', 'activity')}
      </div>

      {/* === Agents Tab === */}
      {subtab === 'agents' && (
        <div style={{ animation: 'fadeUp .3s ease' }}>
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : hasError ? null : agentRows.length === 0 ? (
            <EmptyState message="No agents yet. Publish your first agent to get started." />
          ) : (
            <>
              <div style={{ background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 90px 90px 80px 80px 60px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,.03)', fontSize: 10.5, fontWeight: 600, color: '#CCC', fontFamily: 'var(--font-body)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                  <span>Agent</span><span>Status</span><span>Rentals</span><span>Revenue</span><span>Rating</span><span>Updated</span><span></span>
                </div>

                {/* Rows */}
                {agentRows.map(a => (
                  <div key={a.id} onClick={() => setSelectedAgent(selectedAgent === a.id ? null : a.id)} style={{
                    display: 'grid', gridTemplateColumns: '2fr 80px 90px 90px 80px 80px 60px', gap: 8, padding: '12px 16px',
                    borderBottom: '1px solid rgba(0,0,0,.02)', cursor: 'pointer', transition: 'background .1s',
                    background: selectedAgent === a.id ? 'rgba(0,0,0,.02)' : 'transparent',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => { if (selectedAgent !== a.id) e.currentTarget.style.background = 'rgba(0,0,0,.01)'; }}
                  onMouseLeave={e => { if (selectedAgent !== a.id) e.currentTarget.style.background = 'transparent'; }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{a.name}</div>
                      <div style={{ fontSize: 10.5, color: '#CCC', fontFamily: 'var(--font-body)' }}>{'v' + a.version}</div>
                    </div>
                    <StatusBadge status={a.status} />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{fk(a.rentals)}</span>
                      {a.trend && <span style={{ fontSize: 10, color: '#22C55E', fontFamily: 'var(--font-body)', marginLeft: 4 }}>{a.trend}</span>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: a.revenue > 0 ? '#1A1A1A' : '#DDD', fontFamily: 'var(--font-body)' }}>
                      {a.revenue > 0 ? '$' + fk(a.revenue) : '\u2014'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
                      {a.rating > 0 ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{a.rating}</span>
                          <span style={{ fontSize: 10.5, color: '#CCC' }}>{'(' + a.reviews + ')'}</span>
                        </>
                      ) : <span style={{ color: '#DDD' }}>{'\u2014'}</span>}
                    </span>
                    <span style={{ fontSize: 11, color: '#CCC', fontFamily: 'var(--font-body)' }}>{a.updated}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(0,0,0,.04)', background: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#CCC', transition: 'all .12s', padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.background = 'rgba(255,255,255,.9)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#CCC'; e.currentTarget.style.background = 'rgba(255,255,255,.5)'; }}>
                        <NavIcon type="edit" size={12} />
                      </button>
                      <button style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(0,0,0,.04)', background: 'rgba(255,255,255,.5)', cursor: 'pointer', display: 'grid', placeItems: 'center', color: '#CCC', transition: 'all .12s', padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.background = 'rgba(255,255,255,.9)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#CCC'; e.currentTarget.style.background = 'rgba(255,255,255,.5)'; }}>
                        <NavIcon type="external" size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expanded agent detail panel */}
              {selectedAgent && (() => {
                const a = agentRows.find(x => x.id === selectedAgent);
                if (!a || !isLiveStatus(a.status)) return null;
                return (
                  <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, animation: 'fadeUp .25s ease' }}>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,.45)', borderRadius: 10, border: '1px solid rgba(255,255,255,.55)' }}>
                      <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>This Month</div>
                      <div style={{ fontSize: 20, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em' }}>{'$' + fk(a.revenue)}</div>
                      <div style={{ fontSize: 10.5, color: '#22C55E', fontFamily: 'var(--font-body)' }}>{'85% of $' + fk(Math.round(a.revenue / 0.85)) + ' gross'}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,.45)', borderRadius: 10, border: '1px solid rgba(255,255,255,.55)' }}>
                      <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Executions</div>
                      <div style={{ fontSize: 20, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em' }}>{fk(a.executions)}</div>
                      <div style={{ fontSize: 10.5, color: '#999', fontFamily: 'var(--font-body)' }}>{'~' + Math.round(a.executions / Math.max(a.rentals, 1)) + ' per renter avg'}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,.45)', borderRadius: 10, border: '1px solid rgba(255,255,255,.55)' }}>
                      <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Reviews</div>
                      <div style={{ fontSize: 20, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em' }}>{a.reviews}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: '#999', fontFamily: 'var(--font-body)' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        {a.rating + ' average'}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* === Payouts Tab === */}
      {subtab === 'payouts' && (
        <div style={{ animation: 'fadeUp .3s ease' }}>
          {isLoading ? (
            <SkeletonTable rows={3} />
          ) : hasError ? null : (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)' }}>
                  <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Pending Payout</div>
                  <div style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em' }}>
                    {'$' + fk(earnings ? Math.round(earnings.pending_payout_cents / 100) : 0)}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#999', fontFamily: 'var(--font-body)' }}>Estimated &middot; Stripe Connect</div>
                </div>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)' }}>
                  <div style={{ fontSize: 10.5, color: '#BBB', fontFamily: 'var(--font-body)', marginBottom: 4 }}>Total Earned (All Time)</div>
                  <div style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em' }}>
                    {'$' + fk(earnings ? Math.round(earnings.total_net_cents / 100) : 0)}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#999', fontFamily: 'var(--font-body)' }}>Net after platform fee &middot; Stripe Connect</div>
                </div>
              </div>

              {payoutRows.length === 0 ? (
                <EmptyState message="No payouts yet. Earnings will appear here once you receive your first payout." />
              ) : (
                <div style={{ background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,.03)', fontSize: 10.5, fontWeight: 600, color: '#CCC', fontFamily: 'var(--font-body)', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
                    <span>Month</span><span>Amount</span><span>Agents</span><span>Status</span>
                  </div>
                  {payoutRows.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,.02)', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 550, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{p.month}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{'$' + fk(p.amount)}</span>
                      <span style={{ fontSize: 12.5, color: '#999', fontFamily: 'var(--font-body)' }}>{p.agents + ' agents'}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#22C55E', background: 'rgba(34,197,94,.08)', borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-body)', width: 'fit-content' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        Paid
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* === Activity Tab === */}
      {subtab === 'activity' && (
        <div style={{ animation: 'fadeUp .3s ease' }}>
          {isLoading ? (
            <SkeletonTable rows={6} />
          ) : hasError ? null : activityRows.length === 0 && liveCreatorEvents.length === 0 ? (
            <EmptyState message="No activity yet. Events will appear here as your agents get used." />
          ) : (
            <div style={{ background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)' }}>
              {/* Live realtime creator events */}
              {liveCreatorEvents.map((evt, i) => {
                const typeColor: Record<string, string> = { rental: '#3B82F6', earning: '#22C55E', review: '#F59E0B' };
                return (
                  <div key={`live-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,.02)', background: 'rgba(59,130,246,0.02)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: typeColor[evt.type] ?? '#999', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: '#777', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>{evt.message}</span>
                    <span style={{ fontSize: 11, color: '#DDD', fontFamily: 'var(--font-body)', flexShrink: 0 }}>just now</span>
                  </div>
                );
              })}
              {activityRows.map((a, i) => {
                const typeMap: Record<string, { color: string; bg: string }> = {
                  install: { color: '#3B82F6', bg: 'rgba(59,130,246,.06)' },
                  review: { color: '#F59E0B', bg: 'rgba(245,158,11,.06)' },
                  publish: { color: '#8B5CF6', bg: 'rgba(139,92,246,.06)' },
                  approve: { color: '#22C55E', bg: 'rgba(34,197,94,.06)' },
                  payout: { color: '#22C55E', bg: 'rgba(34,197,94,.06)' },
                  milestone: { color: '#F59E0B', bg: 'rgba(245,158,11,.06)' },
                };
                const tm = typeMap[a.type] ?? { color: '#999', bg: 'rgba(0,0,0,.03)' };
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < activityRows.length - 1 ? '1px solid rgba(0,0,0,.02)' : 'none' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: tm.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5, color: '#777', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>{a.text}</span>
                    <span style={{ fontSize: 11, color: '#DDD', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{a.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
