'use client';

import { AgentIcon, type IconType } from '@/components/ui/agent-icon';
import { useApiData } from '@/hooks/useApiData';
import { getMyAgents, type AgentMine } from '@/lib/api/agents';
import { getEarningsHistory, type EarningsHistoryEntry } from '@/lib/api/billing';
import { SkeletonCard } from '@/components/shared/Skeleton';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   GLASS HELPERS
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

interface ChartDataPoint {
  month: string;
  rentals: number;
  revenue: number;
}

function buildChartData(entries: EarningsHistoryEntry[]): ChartDataPoint[] {
  const byMonth = new Map<string, { rentals: number; revenue: number }>();

  for (const e of entries) {
    const date = new Date(e.created_at);
    const key = date.toLocaleString('en-US', { month: 'short' });
    const existing = byMonth.get(key) ?? { rentals: 0, revenue: 0 };
    if (e.source === 'rental') existing.rentals += 1;
    existing.revenue += e.net_amount_cents;
    byMonth.set(key, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    rentals: data.rentals,
    revenue: Math.round(data.revenue / 100),
  }));
}

interface AgentPerformance {
  id: string;
  name: string;
  iconType: IconType | string;
  rentals: number;
  revenue: number;
  avgRating: number;
  reviewCount: number;
  executions: number;
  a2aCalls: number;
}

function buildTopAgents(agents: AgentMine[], entries: EarningsHistoryEntry[]): AgentPerformance[] {
  const revenueByAgent = new Map<string, number>();
  for (const e of entries) {
    if (e.agent_id) {
      revenueByAgent.set(e.agent_id, (revenueByAgent.get(e.agent_id) ?? 0) + e.net_amount_cents);
    }
  }

  return agents
    .map((a) => ({
      id: a.id,
      name: a.name,
      iconType: (a.category ?? 'box') as IconType | string,
      rentals: a.active_rentals,
      revenue: Math.round((revenueByAgent.get(a.id) ?? 0) / 100),
      avgRating: a.avg_rating,
      reviewCount: a.review_count,
      executions: a.total_executions,
      a2aCalls: a.total_a2a_calls,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '24px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)', borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#EF4444', fontFamily: 'var(--font-body)', margin: '0 0 12px' }}>{message}</p>
      <button onClick={onRetry} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1A1A1A', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer',
      }}>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '48px 24px', ...glassCard, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0 }}>{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function AnalyticsPage() {
  const agentsApi = useApiData({ fetchFn: async () => (await getMyAgents()).agents });
  const historyApi = useApiData({ fetchFn: async () => (await getEarningsHistory({ limit: 200 })).earnings });

  const agents = agentsApi.data ?? [];
  const history = historyApi.data ?? [];

  const isLoading = agentsApi.loading || historyApi.loading;
  const hasError = agentsApi.error || historyApi.error;
  const errorMessage = agentsApi.error ?? historyApi.error ?? '';

  const handleRetry = () => {
    agentsApi.refetch();
    historyApi.refetch();
  };

  const chartData = buildChartData(history);
  const topAgents = buildTopAgents(agents, history);

  const totalRentals = agents.reduce((s, a) => s + a.active_rentals, 0);
  const totalRevenue = topAgents.reduce((s, a) => s + a.revenue, 0);
  const ratedAgents = agents.filter((a) => a.avg_rating > 0);
  const avgRating = ratedAgents.length > 0
    ? ratedAgents.reduce((s, a) => s + a.avg_rating, 0) / ratedAgents.length
    : 0;
  const totalExecs = agents.reduce((s, a) => s + a.total_executions, 0);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em', margin: '0 0 4px' }}>
        Analytics
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 14, color: '#999' }}>
        Performance metrics across all your published agents.
      </p>

      {/* Error state */}
      {hasError && !isLoading && (
        <div style={{ marginBottom: 24 }}>
          <ErrorBanner message={errorMessage} onRetry={handleRetry} />
        </div>
      )}

      {/* ── Overview stats ── */}
      {isLoading ? (
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height={90} />
          ))}
        </div>
      ) : !hasError ? (
        <div
          className="grid gap-3 mb-8"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}
        >
          {[
            { label: 'Total Rentals', value: totalRentals.toLocaleString(), color: undefined },
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, color: '#059669' },
            { label: 'Avg Rating', value: avgRating.toFixed(1), color: '#F59E0B' },
            { label: 'Executions', value: totalExecs.toLocaleString(), color: undefined },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{ ...glassCard, padding: '18px 20px', animation: `cardIn 0.25s ease ${i * 40}ms both` }}
            >
              <div style={{ fontSize: 12, color: '#AAA', fontWeight: 500, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: stat.color ?? '#1A1A1A', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Charts ── */}
      {isLoading ? (
        <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}>
          <SkeletonCard height={280} />
          <SkeletonCard height={280} />
        </div>
      ) : !hasError && chartData.length > 0 ? (
        <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))' }}>
          {/* Rentals chart */}
          <div style={{ ...glassCard, padding: '20px 20px 16px', animation: 'cardIn 0.3s ease 160ms both' }}>
            <h2 className="m-0 mb-4" style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>
              Rentals Over Time
            </h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="rentalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.08} />
                      <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Area type="monotone" dataKey="rentals" stroke="#1A1A1A" strokeWidth={2} fill="url(#rentalGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue chart */}
          <div style={{ ...glassCard, padding: '20px 20px 16px', animation: 'cardIn 0.3s ease 200ms both' }}>
            <h2 className="m-0 mb-4" style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>
              Revenue Over Time
            </h2>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#BBB' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : !hasError && chartData.length === 0 ? (
        <div style={{ marginBottom: 32 }}>
          <EmptyState message="No chart data yet. Earnings history will populate these charts." />
        </div>
      ) : null}

      {/* ── Top performing agents ── */}
      <div style={{ animation: 'cardIn 0.3s ease 280ms both' }}>
        <h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
          Top Performing Agents
        </h2>
        {isLoading ? (
          <SkeletonCard height={200} />
        ) : hasError ? null : topAgents.length === 0 ? (
          <EmptyState message="No agents published yet. Your top performers will appear here." />
        ) : (
          <div style={{ ...glassCard, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Agent</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Rentals</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Revenue</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Rating</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Executions</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>A2A Calls</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((agent, i) => (
                    <tr
                      key={agent.id}
                      style={{ borderBottom: i < topAgents.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex items-center gap-2.5">
                          <AgentIcon iconType={agent.iconType} size={28} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#1A1A1A' }}>{agent.name}</div>
                            <div style={{ fontSize: 11, color: '#CCC' }}>{agent.reviewCount} reviews</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#1A1A1A' }}>
                        {agent.rentals}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#059669' }}>
                        ${agent.revenue.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          <span style={{ fontWeight: 600, color: '#1A1A1A' }}>{agent.avgRating.toFixed(1)}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', color: '#888' }}>
                        {agent.executions.toLocaleString()}
                      </td>
                      <td style={{ textAlign: 'right', padding: '12px 16px', color: '#888' }}>
                        {agent.a2aCalls.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
