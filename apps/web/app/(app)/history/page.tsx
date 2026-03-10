'use client';

import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { getExecutions, getExecution, type Execution } from '@/lib/api/agents';
import { SkeletonTable } from '@/components/shared/Skeleton';

/* ─── Helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(startedAt: string, completedAt?: string): string {
  if (!completedAt) return '';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return '<1s';
  return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS = {
  completed: { label: 'Done', color: '#22C55E', bg: 'rgba(34,197,94,.07)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
  failed: { label: 'Failed', color: '#EF4444', bg: 'rgba(239,68,68,.07)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
  running: { label: 'Running', color: '#3B82F6', bg: 'rgba(59,130,246,.07)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  queued: { label: 'Queued', color: '#F59E0B', bg: 'rgba(245,158,11,.07)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  cancelled: { label: 'Cancelled', color: '#999', bg: 'rgba(0,0,0,.03)', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
} as const;

type StatusKey = keyof typeof STATUS;

/* ─── Activity Item ─── */
function ActivityItem({ exec, isExpanded, onToggle }: { exec: Execution; isExpanded: boolean; onToggle: () => void }) {
  const s = STATUS[exec.status as StatusKey] ?? STATUS.completed;
  const duration = formatDuration(exec.started_at, exec.completed_at);

  return (
    <div style={{
      borderBottom: '1px solid rgba(0,0,0,.025)',
      transition: 'background .1s',
    }}>
      {/* Main row */}
      <div onClick={onToggle} style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', cursor: 'pointer',
        background: isExpanded ? 'rgba(0,0,0,.01)' : 'transparent',
      }}
      onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(0,0,0,.008)'; }}
      onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Status icon */}
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: s.bg, display: 'grid', placeItems: 'center',
          flexShrink: 0, marginTop: 1,
        }}>
          {s.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
              {exec.agent_name ?? 'Agent'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 550, color: s.color,
              background: s.bg, borderRadius: 4, padding: '1px 6px',
            }}>{s.label}</span>
          </div>
          <div style={{
            fontSize: 12.5, color: '#888', lineHeight: 1.4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            {exec.input_text}
          </div>
        </div>

        {/* Right meta */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, color: '#CCC', marginBottom: 2 }}>{timeAgo(exec.started_at)}</div>
          {duration && <div style={{ fontSize: 11, color: '#DDD' }}>{duration}</div>}
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <ExpandedDetail exec={exec} />
      )}
    </div>
  );
}

/* ─── Expanded Detail ─── */
function ExpandedDetail({ exec }: { exec: Execution }) {
  const [detail, setDetail] = useState<Execution | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

  useState(() => {
    (async () => {
      try {
        const result = await getExecution(exec.id);
        setDetail(result.execution);
      } catch {
        setDetail(exec);
      } finally {
        setLoadingDetail(false);
      }
    })();
  });

  const steps = (detail?.steps ?? []) as Array<{ type: string; text?: string; tool_name?: string }>;
  const output = exec.error ?? detail?.result?.text ?? (exec.status === 'completed' ? 'Completed successfully' : '');

  return (
    <div style={{
      padding: '0 16px 14px 58px',
      animation: 'activityIn .2s ease both',
    }}>
      {/* What was sent */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10.5, fontWeight: 550, color: '#BBB', marginBottom: 4, letterSpacing: '0.02em', textTransform: 'uppercase' as const }}>You asked</div>
        <div style={{
          fontSize: 12.5, color: '#777', lineHeight: 1.5,
          padding: '10px 12px', background: 'rgba(0,0,0,.02)',
          borderRadius: 8,
        }}>{exec.input_text}</div>
      </div>

      {/* What came back */}
      <div style={{ marginBottom: steps.length > 0 ? 10 : 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 550, color: '#BBB', marginBottom: 4, letterSpacing: '0.02em', textTransform: 'uppercase' as const }}>Response</div>
        <div style={{
          fontSize: 12.5, color: exec.error ? '#EF4444' : '#777', lineHeight: 1.5,
          padding: '10px 12px',
          background: exec.error ? 'rgba(239,68,68,.03)' : 'rgba(0,0,0,.02)',
          borderRadius: 8,
        }}>
          {loadingDetail && !output ? 'Loading...' : output}
        </div>
      </div>

      {/* Steps (simple) */}
      {steps.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 550, color: '#BBB', marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' as const }}>
            Steps ({steps.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: '#999', padding: '4px 0',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 5,
                  background: i === steps.length - 1 ? 'rgba(34,197,94,.08)' : 'rgba(0,0,0,.03)',
                  color: i === steps.length - 1 ? '#22C55E' : '#CCC',
                  display: 'grid', placeItems: 'center',
                  fontSize: 9, fontWeight: 600, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ lineHeight: 1.3 }}>{step.text ?? `Used ${step.tool_name}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─── */

export default function RunHistoryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, loading, error, refetch } = useApiData({
    fetchFn: () => getExecutions({ limit: 50 }),
  });

  const executions = data?.executions ?? [];

  const filtered = executions.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (r.agent_name ?? '').toLowerCase().includes(q) || r.input_text.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
      <style>{`
        @keyframes activityIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: 32, marginBottom: 24, animation: 'activityIn 0.35s ease both' }}>
        <h1 style={{
          fontSize: 24, fontWeight: 400, color: '#1A1A1A',
          fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
          margin: 0,
        }}>Activity</h1>
        <p style={{ fontSize: 13.5, color: '#999', margin: '4px 0 0' }}>
          Everything your agents have done
        </p>
      </div>

      {/* Search + filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
        animation: 'activityIn 0.35s ease 50ms both', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 10px', height: 34, flex: '1 1 200px', minWidth: 180,
          background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(12px)',
          borderRadius: 8, border: '1px solid rgba(0,0,0,.04)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by agent or message..."
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 12, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#CCC', display: 'grid', placeItems: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 2 }}>
          {(['all', 'completed', 'failed'] as const).map(f => {
            const labels = { all: 'All', completed: 'Successful', failed: 'Failed' };
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: 11.5, fontWeight: isActive ? 600 : 450,
                color: isActive ? '#1A1A1A' : '#BBB',
                background: isActive ? 'rgba(0,0,0,.04)' : 'transparent',
                border: 'none', borderRadius: 6, padding: '6px 10px',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                transition: 'all .12s',
              }}>{labels[f]}</button>
            );
          })}
        </div>
      </div>

      {/* Activity feed */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <div style={{
          textAlign: 'center', padding: '44px 16px',
          background: 'rgba(239,68,68,.03)', borderRadius: 10,
          border: '1px solid rgba(239,68,68,.08)',
          animation: 'activityIn 0.3s ease both',
        }}>
          <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 10px' }}>{error}</p>
          <button onClick={refetch} style={{
            padding: '7px 16px', background: '#1A1A1A', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>Retry</button>
        </div>
      ) : executions.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '52px 20px',
          background: 'rgba(255,255,255,.3)', borderRadius: 11,
          border: '1px dashed rgba(0,0,0,.06)',
          animation: 'activityIn 0.35s ease 100ms both',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <p style={{ fontSize: 14, color: '#AAA', margin: '0 0 4px', fontWeight: 500 }}>No activity yet</p>
          <p style={{ fontSize: 12.5, color: '#CCC', margin: 0 }}>When you use your agents, their activity will show up here.</p>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,0,0,.03)',
          borderRadius: 11,
          overflow: 'hidden',
          animation: 'activityIn 0.35s ease 100ms both',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#BBB', margin: 0 }}>No matching activity</p>
              <button onClick={() => { setFilter('all'); setSearchQuery(''); }} style={{
                fontSize: 12, color: '#999', background: 'rgba(0,0,0,.03)',
                border: 'none', padding: '5px 12px', borderRadius: 6,
                cursor: 'pointer', marginTop: 8,
              }}>Clear filters</button>
            </div>
          ) : (
            filtered.map(exec => (
              <ActivityItem
                key={exec.id}
                exec={exec}
                isExpanded={expandedId === exec.id}
                onToggle={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#CCC', animation: 'activityIn 0.35s ease 150ms both' }}>
          Showing {filtered.length} of {executions.length}
        </div>
      )}
    </div>
  );
}
