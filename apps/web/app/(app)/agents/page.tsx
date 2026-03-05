'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApiData } from '@/hooks/useApiData';
import { getMyAgents, sandboxAgent, getExecution, type AgentMine } from '@/lib/api/agents';
import { getActiveRentals, type ActiveRental } from '@/lib/api/rentals';
import { SkeletonGrid } from '@/components/shared/Skeleton';

/* ===================================================================
   STATUS BADGE
   =================================================================== */

type AgentStatus = 'active' | 'draft' | 'published' | 'paused' | 'error' | 'in_review' | 'suspended' | 'archived';

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string; dot: string; label: string }> = {
    active:    { bg: 'rgba(34,197,94,0.10)',  color: '#22C55E', dot: '#22C55E', label: 'Active' },
    draft:     { bg: 'rgba(0,0,0,0.04)',      color: '#999',    dot: '#CCC',    label: 'Draft' },
    published: { bg: 'rgba(59,130,246,0.10)', color: '#3B82F6', dot: '#3B82F6', label: 'Published' },
    paused:    { bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', dot: '#F59E0B', label: 'Paused' },
    error:     { bg: 'rgba(239,68,68,0.10)',  color: '#EF4444', dot: '#EF4444', label: 'Error' },
    in_review: { bg: 'rgba(245,158,11,0.10)', color: '#F59E0B', dot: '#F59E0B', label: 'In Review' },
    suspended: { bg: 'rgba(239,68,68,0.10)',  color: '#EF4444', dot: '#EF4444', label: 'Suspended' },
    archived:  { bg: 'rgba(0,0,0,0.04)',      color: '#999',    dot: '#CCC',    label: 'Archived' },
  };
  const c = colors[status] || colors.draft;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 600, color: c.color,
        background: c.bg, borderRadius: 8, padding: '4px 12px',
        fontFamily: 'var(--font-body)', lineHeight: 1,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 3, background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

/* ===================================================================
   AGENT CARD  (created / owned agents)
   =================================================================== */

function AgentCard({ agent }: { agent: AgentMine }) {
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const router = useRouter();
  const isPublished = agent.status === 'published';

  const stats: { label: string; value: string }[] = [
    { label: 'Executions', value: (agent.total_executions ?? 0).toLocaleString() },
    ...(agent.active_rentals ? [{ label: 'Rentals', value: String(agent.active_rentals) }] : []),
    ...(agent.avg_rating ? [{ label: 'Rating', value: `${agent.avg_rating}\u2605` }] : []),
  ];

  return (
    <div
      className="group"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderRadius: 16,
        padding: 24,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.75)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.55)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: icon + name + status */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {agent.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <StatusBadge status={agent.status} />
            {isPublished && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.08)', borderRadius: 6, padding: '3px 10px', fontFamily: 'var(--font-body)' }}>
                Marketplace
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description / category */}
      {agent.category && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: '#AAA', fontFamily: 'var(--font-body)', fontWeight: 500 }}>Category:</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#666', fontFamily: 'var(--font-body)', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '3px 10px' }}>
            {agent.category}
          </span>
          {agent.review_count > 0 && (
            <span style={{ fontSize: 13, fontWeight: 500, color: '#666', fontFamily: 'var(--font-body)', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '3px 10px' }}>
              {agent.review_count} reviews
            </span>
          )}
        </div>
      )}

      {/* Inline stats */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: '#AAA', fontFamily: 'var(--font-body)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions - always visible */}
      <div style={{ marginTop: 'auto' }}>
        {!testing ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                flex: 1, padding: '12px 24px', minHeight: 44,
                borderRadius: 10, border: 'none',
                background: '#1A1A1A', color: '#FFF',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
              onClick={() => setTesting(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Agent
            </button>
            <button
              style={{
                padding: '12px 24px', minHeight: 44,
                borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.7)', color: '#666',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.color = '#1A1A1A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.color = '#666'; }}
              onClick={() => router.push(`/creator/publish?edit=${agent.id}`)}
            >
              Configure
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test prompt..."
              style={{
                flex: 1, padding: '12px 16px', height: 48,
                borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)',
                background: 'rgba(255,255,255,0.9)', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && testInput.trim()) {
                  try {
                    const { executionId } = await sandboxAgent(agent.id, testInput.trim());
                    router.push(`/workflows/${executionId}`);
                  } catch { /* handled by navigation */ }
                }
                if (e.key === 'Escape') { setTesting(false); setTestInput(''); }
              }}
              autoFocus
            />
            <button
              style={{
                padding: '12px 20px', height: 48,
                borderRadius: 10, border: 'none',
                background: '#1A1A1A', color: '#FFF',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
              onClick={async () => {
                if (!testInput.trim()) return;
                try {
                  const { executionId } = await sandboxAgent(agent.id, testInput.trim());
                  router.push(`/workflows/${executionId}`);
                } catch { /* handled by navigation */ }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </button>
            <button
              style={{
                padding: '12px 16px', height: 48,
                borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.7)', color: '#888',
                fontSize: 14, fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
              onClick={() => { setTesting(false); setTestInput(''); }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================================================
   RENTED AGENT CARD
   =================================================================== */

function RentedAgentCard({ rental }: { rental: ActiveRental }) {
  const [testing, setTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const router = useRouter();
  const agentName = rental.agents?.name ?? 'Installed Agent';
  const isFree = rental.monthly_price_cents === 0;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.65)',
        borderLeft: '3px solid #22C55E',
        borderRadius: 16,
        padding: 24,
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column' as const,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.75)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.55)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top row: icon + name + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 8 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(34,197,94,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', marginBottom: 6 }}>
            {agentName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <StatusBadge status="active" />
            <span
              style={{
                fontSize: 11, fontWeight: 600,
                color: '#22C55E', background: 'rgba(34,197,94,0.08)',
                borderRadius: 6, padding: '3px 10px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Installed from Marketplace
            </span>
          </div>
        </div>
      </div>

      {/* Price tag */}
      <div style={{ marginBottom: 16, marginLeft: 62 }}>
        <span
          style={{
            fontSize: 13, fontWeight: 600,
            color: isFree ? '#22C55E' : '#666',
            background: isFree ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.03)',
            borderRadius: 6, padding: '4px 12px',
            fontFamily: 'var(--font-body)',
          }}
        >
          {isFree ? 'Free' : `$${(rental.monthly_price_cents / 100).toFixed(0)}/mo`}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {rental.total_executions}
          </div>
          <div style={{ fontSize: 12, color: '#AAA', fontFamily: 'var(--font-body)', marginTop: 2 }}>Executions</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {new Date(rental.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 12, color: '#AAA', fontFamily: 'var(--font-body)', marginTop: 2 }}>Installed</div>
        </div>
      </div>

      {/* Actions - always visible */}
      <div style={{ marginTop: 'auto' }}>
        {!testing ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              style={{
                flex: 1, padding: '12px 24px', minHeight: 44,
                borderRadius: 10, border: 'none',
                background: '#1A1A1A', color: '#FFF',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
              onClick={() => setTesting(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Agent
            </button>
            {rental.agents?.slug && (
              <Link href={`/browse/${rental.agents.slug}`}
                style={{
                  padding: '12px 24px', minHeight: 44,
                  borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255,255,255,0.7)', color: '#666',
                  fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                Details
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter prompt..."
              style={{
                flex: 1, padding: '12px 16px', height: 48,
                borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)',
                background: 'rgba(255,255,255,0.9)', fontSize: 14,
                fontFamily: 'var(--font-body)', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && testInput.trim()) {
                  try {
                    const { executionId } = await sandboxAgent(rental.agent_id, testInput.trim());
                    router.push(`/workflows/${executionId}`);
                  } catch { /* handled by navigation */ }
                }
                if (e.key === 'Escape') { setTesting(false); setTestInput(''); }
              }}
              autoFocus
            />
            <button
              style={{
                padding: '12px 20px', height: 48,
                borderRadius: 10, border: 'none',
                background: '#1A1A1A', color: '#FFF',
                fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
              onClick={async () => {
                if (!testInput.trim()) return;
                try {
                  const { executionId } = await sandboxAgent(rental.agent_id, testInput.trim());
                  router.push(`/workflows/${executionId}`);
                } catch { /* handled by navigation */ }
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Send
            </button>
            <button
              style={{
                padding: '12px 16px', height: 48,
                borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.7)', color: '#888',
                fontSize: 14, fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
              onClick={() => { setTesting(false); setTestInput(''); }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================================================================
   PAGE
   =================================================================== */

export default function MyAgentsPage() {
  const [filter, setFilter] = useState('all');

  const { data, loading, error, refetch } = useApiData({
    fetchFn: () => getMyAgents(),
  });

  const { data: rentalsData, loading: rentalsLoading } = useApiData({
    fetchFn: () => getActiveRentals(),
  });

  const agents = data?.agents ?? [];
  const rentals = rentalsData?.rentals ?? [];

  const filters = [
    { id: 'all', label: 'All', count: agents.length + rentals.length },
    { id: 'installed', label: 'Installed', count: rentals.length },
    { id: 'published', label: 'Published', count: agents.filter((a) => a.status === 'published').length },
    { id: 'draft', label: 'Drafts', count: agents.filter((a) => a.status === 'draft').length },
  ];

  const filteredAgents =
    filter === 'installed'
      ? []
      : filter === 'all'
        ? agents
        : filter === 'published'
          ? agents.filter((a) => a.status === 'published')
          : agents.filter((a) => a.status === filter);

  const showRentals = filter === 'all' || filter === 'installed';

  const totalExecs = agents.reduce((s, a) => s + (a.total_executions ?? 0), 0);
  const avgRating = agents.filter((a) => a.avg_rating > 0);
  const avgRatingVal = avgRating.length > 0 ? (avgRating.reduce((s, a) => s + a.avg_rating, 0) / avgRating.length).toFixed(1) : '\u2014';

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, animation: 'fadeUp 0.5s ease both' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', margin: 0 }}>
            My Agents
          </h1>
          <p style={{ fontSize: 16, color: '#999', fontFamily: 'var(--font-body)', margin: 0, marginTop: 6, lineHeight: 1.5 }}>
            {agents.length + rentals.length} agents &middot; {rentals.length} installed &middot; {agents.filter((a) => a.status === 'published').length} published
          </p>
        </div>
        <Link href="/studio" className="no-underline"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', minHeight: 44,
            borderRadius: 12, border: 'none',
            background: '#1A1A1A', color: '#FFF',
            fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)',
            cursor: 'pointer', transition: 'all 0.15s ease',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Agent
        </Link>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32, animation: 'fadeUp 0.5s ease both', animationDelay: '0.05s' }}>
        {[
          { label: 'Total Executions', value: loading ? '\u2014' : totalExecs.toLocaleString(), icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )},
          { label: 'Published', value: loading ? '\u2014' : String(agents.filter((a) => a.status === 'published').length), icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          )},
          { label: 'Installed', value: (loading || rentalsLoading) ? '\u2014' : String(rentals.length), icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )},
          { label: 'Avg Rating', value: loading ? '\u2014' : `${avgRatingVal}\u2605`, icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          )},
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.65)',
              borderRadius: 14,
              padding: 24,
              display: 'flex', alignItems: 'center', gap: 16,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: '#AAA', fontFamily: 'var(--font-body)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      {!loading && agents.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, animation: 'fadeUp 0.5s ease both', animationDelay: '0.08s' }}>
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: filter === f.id ? 600 : 450,
                color: filter === f.id ? '#1A1A1A' : '#999',
                background: filter === f.id ? 'rgba(255,255,255,0.7)' : 'transparent',
                boxShadow: filter === f.id ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s ease',
                display: 'flex', alignItems: 'center', gap: 8,
                minHeight: 44,
              }}
            >
              {f.label}
              <span
                style={{
                  fontSize: 12, fontWeight: 600,
                  color: filter === f.id ? '#666' : '#BBB',
                  background: filter === f.id ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 6, padding: '2px 8px',
                  lineHeight: '18px',
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Agent Grid */}
      {loading ? (
        <SkeletonGrid count={4} cardHeight={220} />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ fontSize: 15, color: '#EF4444', marginBottom: 16, fontFamily: 'var(--font-body)' }}>{error}</div>
          <button
            onClick={refetch}
            style={{
              fontSize: 14, fontWeight: 600, color: '#1A1A1A',
              background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 10, padding: '12px 28px', cursor: 'pointer',
              minHeight: 44, fontFamily: 'var(--font-body)',
            }}
          >
            Retry
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, animation: 'fadeUp 0.5s ease both', animationDelay: '0.1s' }}>
          {/* Rented/installed agents */}
          {showRentals && rentals.map((rental) => (
            <RentedAgentCard key={rental.id} rental={rental} />
          ))}

          {/* Created agents */}
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}

          {/* Create new agent card */}
          <Link href="/studio" className="no-underline"
            style={{
              background: 'rgba(255,255,255,0.35)',
              backdropFilter: 'blur(20px)',
              border: '2px dashed rgba(0,0,0,0.08)',
              borderRadius: 16,
              padding: 24,
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
              minHeight: 240, transition: 'all 0.2s ease', cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#999', fontFamily: 'var(--font-outfit)', marginBottom: 4 }}>
              Create New Agent
            </span>
            <span style={{ fontSize: 14, color: '#CCC', fontFamily: 'var(--font-body)' }}>
              Open Agent Studio
            </span>
          </Link>
        </div>
      )}
    </>
  );
}
