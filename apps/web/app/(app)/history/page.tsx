'use client';

import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { getExecutions, getExecution, type Execution } from '@/lib/api/agents';
import { SkeletonTable } from '@/components/shared/Skeleton';

/* ── Helper components ── */

function NavIcon({ type, size = 16 }: { type: string; size?: number }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const icons: Record<string, React.ReactNode> = {
    search: <svg {...p}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    filter: <svg {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    chevRight: <svg {...p}><polyline points="9 18 15 12 9 6" /></svg>,
    x: <svg {...p}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  };
  return <>{icons[type] || null}</>;
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    completed: { color: '#22C55E', bg: 'rgba(34,197,94,.08)', label: 'Success' },
    failed: { color: '#EF4444', bg: 'rgba(239,68,68,.08)', label: 'Error' },
    running: { color: '#3B82F6', bg: 'rgba(59,130,246,.08)', label: 'Running' },
    queued: { color: '#F59E0B', bg: 'rgba(245,158,11,.08)', label: 'Queued' },
    cancelled: { color: '#999', bg: 'rgba(0,0,0,.04)', label: 'Cancelled' },
  };
  const s = map[status] ?? map.completed;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--body)' }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: s.color }} />
      {s.label}
    </span>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

/* ── Page ── */

export default function RunHistoryPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailData, setDetailData] = useState<Execution | null>(null);

  const { data, loading, error, refetch } = useApiData({
    fetchFn: () => getExecutions({ limit: 50 }),
  });

  const executions = data?.executions ?? [];

  const filtered = executions.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (r.agent_name ?? '').toLowerCase().includes(q) || r.input_text.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
    }
    return true;
  });

  const successCount = executions.filter(r => r.status === 'completed').length;
  const errorCount = executions.filter(r => r.status === 'failed').length;
  const totalCredits = executions.reduce((s, r) => s + r.cost_cents, 0);

  const handleExpand = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      setDetailData(null);
      return;
    }
    setExpanded(id);
    try {
      const result = await getExecution(id);
      setDetailData(result.execution);
    } catch {
      // Fallback to list data
      setDetailData(executions.find(e => e.id === id) ?? null);
    }
  };

  const pill = (label: string, value: number | undefined, active: boolean, onClick: () => void) => (
    <button onClick={onClick} style={{
      fontSize: 11.5, fontWeight: active ? 600 : 450, color: active ? '#1A1A1A' : '#CCC',
      background: active ? 'rgba(0,0,0,.04)' : 'none', border: '1px solid ' + (active ? 'rgba(0,0,0,.06)' : 'transparent'),
      borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'var(--body)', transition: 'all .12s',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {label}
      {value !== undefined && <span style={{ fontSize: 10, fontWeight: 600, color: active ? '#999' : '#DDD', background: active ? 'rgba(0,0,0,.04)' : 'rgba(0,0,0,.02)', borderRadius: 3, padding: '0 4px' }}>{value}</span>}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, animation: 'fadeUp .3s ease' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--head)', letterSpacing: '-0.03em', marginBottom: 2, margin: 0 }}>Run History</h1>
          <p style={{ fontSize: 12.5, color: '#BBB', fontFamily: 'var(--body)', margin: 0 }}>
            {loading ? 'Loading...' : `${executions.length} runs \u00B7 ${totalCredits} credits consumed`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16, animation: 'fadeUp .35s ease' }}>
        {[
          { label: 'Total Runs', value: loading ? '—' : String(executions.length), accent: '#1A1A1A' },
          { label: 'Success', value: loading ? '—' : String(successCount), accent: '#22C55E' },
          { label: 'Errors', value: loading ? '—' : String(errorCount), accent: '#EF4444' },
          { label: 'Credits', value: loading ? '—' : String(totalCredits), accent: '#3B82F6' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '12px 14px', background: 'rgba(255,255,255,.45)', borderRadius: 10, border: '1px solid rgba(255,255,255,.55)' }}>
            <div style={{ fontSize: 10, color: '#BBB', marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.04em', fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 400, color: s.accent, fontFamily: 'var(--head)', letterSpacing: '-0.03em' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, animation: 'fadeUp .4s ease', flexWrap: 'wrap' as const }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(255,255,255,.5)', borderRadius: 7, border: '1px solid rgba(255,255,255,.6)', flex: '0 0 220px' }}>
          <NavIcon type="search" size={12} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search runs..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: 12, color: '#1A1A1A', fontFamily: 'var(--body)', width: '100%' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#CCC', display: 'grid', placeItems: 'center' }}>
              <NavIcon type="x" size={10} />
            </button>
          )}
        </div>
        <div style={{ height: 16, width: 1, background: 'rgba(0,0,0,.04)' }} />
        {pill('All', executions.length, statusFilter === 'all', () => setStatusFilter('all'))}
        {pill('Success', successCount, statusFilter === 'completed', () => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed'))}
        {pill('Error', errorCount, statusFilter === 'failed', () => setStatusFilter(statusFilter === 'failed' ? 'all' : 'failed'))}
      </div>

      {/* Runs Table */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</div>
          <button onClick={refetch} style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : executions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#CCC', fontSize: 13 }}>No execution history yet.</div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,.45)', borderRadius: 12, border: '1px solid rgba(255,255,255,.55)', overflow: 'hidden', animation: 'fadeUp .45s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 2fr 70px 65px 60px 70px 24px', gap: 6, padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,.03)', fontSize: 10, fontWeight: 600, color: '#CCC', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
            <span>Run ID</span><span>Agent</span><span>Status</span><span>Duration</span><span>Credits</span><span>Time</span><span></span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#CCC', fontFamily: 'var(--body)' }}>No runs match your filters</div>
            </div>
          ) : filtered.map(r => (
            <div key={r.id}>
              <div onClick={() => handleExpand(r.id)} style={{
                display: 'grid', gridTemplateColumns: '80px 2fr 70px 65px 60px 70px 24px', gap: 6, padding: '10px 14px',
                borderBottom: '1px solid rgba(0,0,0,.02)', cursor: 'pointer', transition: 'background .1s',
                background: expanded === r.id ? 'rgba(0,0,0,.015)' : 'transparent', alignItems: 'center',
              }}
              onMouseEnter={e => { if (expanded !== r.id) e.currentTarget.style.background = 'rgba(0,0,0,.01)'; }}
              onMouseLeave={e => { if (expanded !== r.id) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ fontSize: 11, color: '#CCC', fontFamily: "'Space Grotesk', monospace", fontWeight: 500 }}>{r.id.slice(0, 8)}</span>
                <div><span style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A1A' }}>{r.agent_name ?? 'Agent'}</span></div>
                <StatusDot status={r.status} />
                <span style={{ fontSize: 12, fontWeight: 550, color: '#777', fontFamily: 'var(--body)' }}>{formatDuration(r.started_at, r.completed_at)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>{r.cost_cents}</span>
                <span style={{ fontSize: 11, color: '#CCC' }}>{timeAgo(r.started_at)}</span>
                <span style={{ color: '#DDD', transition: 'transform .15s', transform: expanded === r.id ? 'rotate(90deg)' : 'rotate(0deg)', display: 'grid', placeItems: 'center' }}>
                  <NavIcon type="chevRight" size={12} />
                </span>
              </div>

              {expanded === r.id && (
                <div style={{ padding: '0 14px 14px', background: 'rgba(0,0,0,.01)', animation: 'fadeUp .2s ease' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,.5)', borderRadius: 8, border: '1px solid rgba(255,255,255,.6)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 6 }}>Input</div>
                      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.5, margin: 0 }}>{r.input_text}</p>
                    </div>
                    <div style={{ padding: '12px 14px', background: r.status === 'failed' ? 'rgba(239,68,68,.03)' : 'rgba(34,197,94,.03)', borderRadius: 8, border: '1px solid ' + (r.status === 'failed' ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)') }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 6 }}>Output</div>
                      <p style={{ fontSize: 12, color: '#777', lineHeight: 1.5, margin: 0 }}>
                        {r.error ?? (detailData?.id === r.id ? detailData.result?.text : null) ?? 'Completed'}
                      </p>
                    </div>
                  </div>

                  {detailData?.id === r.id && detailData.steps && (
                    <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,.4)', borderRadius: 8, border: '1px solid rgba(255,255,255,.5)' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginBottom: 8 }}>
                        Execution Trace &middot; {detailData.steps.length} steps
                      </div>
                      {(detailData.steps as Array<{ type: string; text?: string; tool_name?: string }>).map((step, si) => (
                        <div key={si} style={{ display: 'flex', gap: 8 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                            <div style={{ width: 6, height: 6, borderRadius: 3, marginTop: 5, background: si === (detailData.steps as unknown[]).length - 1 ? '#22C55E' : 'rgba(0,0,0,.08)' }} />
                            {si < (detailData.steps as unknown[]).length - 1 && <div style={{ width: 1, flex: 1, minHeight: 12, background: 'rgba(0,0,0,.04)' }} />}
                          </div>
                          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4, paddingBottom: 6, fontFamily: 'var(--body)' }}>
                            {step.text ?? `Tool call: ${step.tool_name}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, animation: 'fadeUp .5s ease' }}>
        <span style={{ fontSize: 11.5, color: '#CCC' }}>Showing {filtered.length} of {executions.length} runs</span>
      </div>
    </div>
  );
}
