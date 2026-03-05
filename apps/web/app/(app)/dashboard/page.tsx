'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth';
import { useApiData } from '@/hooks/useApiData';
import { useAgentActivity } from '@/hooks/useRealtimeEvents';
import { getWorkflows } from '@/lib/api/workflows';
import { getUsage } from '@/lib/api/billing';
import { getExecutions } from '@/lib/api/agents';
import { SkeletonTable, SkeletonCard } from '@/components/shared/Skeleton';

/* ═══════════════════════════════════════════════════════════════
   STAT BAR (from landing page)
   ═══════════════════════════════════════════════════════════════ */

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, color: '#BBB', width: 24, fontWeight: 600, fontFamily: 'var(--font-body)' }}>{label}</span>
      <div style={{ width: 32, height: 2.5, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: '#1A1A1A', borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASSEMBLED AGENT CARD (from landing page)
   ═══════════════════════════════════════════════════════════════ */

interface MockAgent {
  name: string;
  desc: string;
  price: string;
  iconLetter: string;
  stats: { spd: number; acc: number; rel: number };
}

function AgentCard({ agent, index }: { agent: MockAgent; index: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100 + index * 120);
    return () => clearTimeout(t);
  }, [index]);
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 14,
      background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.7)',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: '#F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#1A1A1A', flexShrink: 0, fontFamily: 'var(--font-outfit)' }}>{agent.iconLetter}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 650, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{agent.name}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{agent.price}</span>
        </div>
        <p style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5, margin: '0 0 8px', fontFamily: 'var(--font-body)' }}>{agent.desc}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatBar label="SPD" value={agent.stats.spd} />
          <StatBar label="ACC" value={agent.stats.acc} />
          <StatBar label="REL" value={agent.stats.rel} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AGENT SHOWCASE (from landing page)
   ═══════════════════════════════════════════════════════════════ */

const SHOWCASE_TABS = [
  { id: 'email', label: 'Email' },
  { id: 'sales', label: 'Sales' },
  { id: 'content', label: 'Content' },
  { id: 'ops', label: 'Ops' },
  { id: 'code', label: 'Code' },
];

const SHOWCASE_AGENTS: Record<string, { name: string; desc: string; creator: string; price: string; rentals: string; rating: string; icon: string; color: string; stats: { speed: number; accuracy: number; reliability: number } }> = {
  email: { name: 'Smart Email Responder', desc: 'Reads incoming emails, classifies intent, drafts contextual responses. Handles follow-ups and routes urgent items.', creator: 'AgentLabs', price: '$19/mo', rentals: '2.4k', rating: '4.8', icon: 'E', color: '#6366F1', stats: { speed: 92, accuracy: 91, reliability: 95 } },
  sales: { name: 'Lead Qualifier', desc: 'Scores inbound leads, enriches contacts with company data, updates your CRM, and flags hot prospects.', creator: 'SalesForge', price: '$49/mo', rentals: '980', rating: '4.7', icon: 'L', color: '#F59E0B', stats: { speed: 85, accuracy: 94, reliability: 89 } },
  content: { name: 'SEO Content Writer', desc: 'Researches keywords, writes optimized blog posts with proper structure, and drafts meta descriptions.', creator: 'GrowthKit', price: '$29/mo', rentals: '1.8k', rating: '4.6', icon: 'S', color: '#10B981', stats: { speed: 78, accuracy: 86, reliability: 90 } },
  ops: { name: 'Order Tracker', desc: 'Monitors orders in real-time, sends proactive shipping updates, handles exceptions and weekly reports.', creator: 'ShipStack', price: '$19/mo', rentals: '3.2k', rating: '4.9', icon: 'O', color: '#EF4444', stats: { speed: 95, accuracy: 88, reliability: 97 } },
  code: { name: 'Bug Triage Bot', desc: 'Monitors error logs, deduplicates issues, assigns severity, and creates actionable tickets in Linear or Jira.', creator: 'DevTools Co', price: 'Free', rentals: '5.1k', rating: '4.7', icon: 'B', color: '#1A1A1A', stats: { speed: 90, accuracy: 87, reliability: 92 } },
};

function TabIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? '#1A1A1A' : '#BBB';
  const icons: Record<string, React.ReactNode> = {
    email: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    sales: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    content: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    ops: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
    code: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  };
  return <>{icons[id] || null}</>;
}

function AgentShowcase() {
  const [activeTab, setActiveTab] = useState('email');
  const [transitioning, setTransitioning] = useState(false);
  const agent = SHOWCASE_AGENTS[activeTab];

  const switchTab = (id: string) => {
    if (id === activeTab) return;
    setTransitioning(true);
    setTimeout(() => { setActiveTab(id); setTransitioning(false); }, 200);
  };

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
        {SHOWCASE_TABS.map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
            fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 450,
            color: activeTab === tab.id ? '#1A1A1A' : '#AAA',
            background: activeTab === tab.id ? 'rgba(255,255,255,0.65)' : 'transparent',
            backdropFilter: activeTab === tab.id ? 'blur(12px)' : 'none',
            border: activeTab === tab.id ? '1px solid rgba(255,255,255,0.6)' : '1px solid transparent',
            borderRadius: 9, padding: '7px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', transition: 'all 0.25s ease',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <TabIcon id={tab.id} active={activeTab === tab.id} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agent card */}
      <div style={{
        position: 'relative', borderRadius: 18, overflow: 'hidden',
        background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.5)',
        opacity: transitioning ? 0 : 1, transform: transitioning ? 'translateY(6px) scale(0.99)' : 'translateY(0) scale(1)',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: '18px 24px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 2 }}>{agent.name}</span>
            <span style={{ fontSize: 12, color: '#BBB', fontFamily: 'var(--font-body)' }}>by {agent.creator} &middot; &#9733; {agent.rating} &middot; {agent.rentals} rentals</span>
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 650, color: agent.price === 'Free' ? '#22C55E' : '#1A1A1A', fontFamily: 'var(--font-body)', flexShrink: 0, marginTop: 2 }}>{agent.price}</span>
        </div>
        <p style={{ fontSize: 13.5, color: '#888', fontFamily: 'var(--font-body)', lineHeight: 1.55, marginBottom: 16 }}>{agent.desc}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['SPD', agent.stats.speed], ['ACC', agent.stats.accuracy], ['REL', agent.stats.reliability]].map(([l, v]) => (
              <span key={String(l)} style={{ fontSize: 10.5, fontWeight: 600, color: '#AAA', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '3px 8px', fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
                {l} {v}
              </span>
            ))}
          </div>
          <Link href="/browse" className="no-underline" style={{
            fontSize: 12.5, fontWeight: 600, color: '#FFF', textDecoration: 'none',
            background: '#1A1A1A', borderRadius: 8, padding: '7px 16px',
            fontFamily: 'var(--font-body)', transition: 'all 0.15s', display: 'inline-block',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >View Agent &rarr;</Link>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOCK TEAM DATA (from landing page)
   ═══════════════════════════════════════════════════════════════ */

const MOCK_TEAMS: Record<string, MockAgent[]> = {
  default: [
    { name: 'Order Tracker', desc: 'Monitors orders, sends proactive shipping updates, handles delivery exceptions.', price: '$19/mo', iconLetter: 'O', stats: { spd: 92, acc: 88, rel: 95 } },
    { name: 'Smart Email Responder', desc: 'Reads incoming emails, classifies intent, drafts contextual responses.', price: '$19/mo', iconLetter: 'E', stats: { spd: 85, acc: 91, rel: 89 } },
    { name: 'SEO Content Writer', desc: 'Researches keywords, writes optimized posts, suggests internal linking.', price: '$29/mo', iconLetter: 'S', stats: { spd: 78, acc: 86, rel: 90 } },
    { name: 'Social Content Creator', desc: 'Generates branded posts, schedules across platforms, optimizes timing.', price: '$39/mo', iconLetter: 'C', stats: { spd: 88, acc: 84, rel: 87 } },
  ],
};

const SUGGESTIONS = [
  'Start a cookie business',
  'Automate my Shopify returns',
  'Launch & grow a newsletter',
  'Manage bookkeeping & invoicing',
  'Build a content calendar',
  'Research my competitors',
];

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY ITEM
   ═══════════════════════════════════════════════════════════════ */

function ActivityItem({ icon, text, time, accent }: { icon: React.ReactNode; text: React.ReactNode; time: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.025)' }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: accent || 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#999' }}>{icon}</div>
      <div style={{ flex: 1, fontSize: 13, color: '#666', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>{text}</div>
      <div style={{ fontSize: 11, color: '#CCC', fontFamily: 'var(--font-body)', flexShrink: 0 }}>{time}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

type Phase = 'idle' | 'thinking' | 'assembled';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name ?? 'there';
  const firstName = userName.split(' ')[0];
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: usageData, loading: usageLoading } = useApiData({ fetchFn: getUsage });
  const { data: execData, loading: execLoading, error: execError, refetch: execRefetch } = useApiData({ fetchFn: () => getExecutions({ limit: 5 }) });
  const liveActivity = useAgentActivity(5);

  const executions = execData?.executions ?? [];

  const fire = useCallback(() => {
    if (!query.trim() || phase !== 'idle') return;
    setPhase('thinking');
    setTimeout(() => setPhase('assembled'), 2400);
  }, [query, phase]);

  const reset = useCallback(() => {
    setPhase('idle');
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const team = MOCK_TEAMS.default;
  const total = team.reduce((s, a) => s + parseInt(a.price.replace(/[^0-9]/g, ''), 10), 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        input::placeholder { color: #C8C8C8; }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── Idle State ── */}
        {phase === 'idle' && (
          <>
            {/* Hero */}
            <div style={{ marginBottom: 24, animation: 'fadeUp 0.5s ease both' }}>
              <h1 style={{ fontSize: 28, fontWeight: 300, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                {greeting}, {firstName}
              </h1>
              <p style={{ fontSize: 14.5, color: '#999', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.55 }}>
                Describe what you need. We&apos;ll assemble a team of AI agents and put them to work.
              </p>
            </div>

            {/* Search input (landing page style) */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
              borderRadius: 13, padding: '0 6px 0 16px',
              border: inputFocused ? '1.5px solid rgba(0,0,0,0.12)' : '1.5px solid rgba(255,255,255,0.7)',
              boxShadow: inputFocused ? '0 0 0 3px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.25s ease',
              marginBottom: 16,
              animation: 'fadeUp 0.5s ease both',
              animationDelay: '0.05s',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 10 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && fire()}
                placeholder="I want to start a cookie business..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14.5, background: 'transparent', color: '#1A1A1A', padding: '14px 0', fontFamily: 'var(--font-body)' }}
              />
              <button onClick={fire} style={{
                width: 38, height: 38, borderRadius: 10, border: 'none', cursor: query.trim() ? 'pointer' : 'default',
                background: query.trim() ? '#1A1A1A' : 'rgba(0,0,0,0.05)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={query.trim() ? 'white' : '#CCC'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>

            {/* Suggestion pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 32, animation: 'fadeUp 0.5s ease both', animationDelay: '0.1s' }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => { setQuery(s); setTimeout(fire, 100); }} style={{
                  fontSize: 12.5, color: '#888', fontFamily: 'var(--font-body)',
                  background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.5)', borderRadius: 20, padding: '7px 14px', cursor: 'pointer',
                  transition: 'all 0.15s', fontWeight: 450,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.65)'; e.currentTarget.style.color = '#555'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#888'; }}
                >{s}</button>
              ))}
            </div>

            {/* Quick actions row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, animation: 'fadeUp 0.5s ease both', animationDelay: '0.12s' }}>
              {[
                { title: 'Create Agent', desc: 'Build a new agent', href: '/studio', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
                { title: 'My Agents', desc: 'Manage your agents', href: '/agents', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
                { title: 'Marketplace', desc: 'Browse 200+ agents', href: '/browse', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
                { title: 'Run History', desc: 'View past executions', href: '/history', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              ].map((qa) => (
                <Link key={qa.title} href={qa.href} className="no-underline" style={{
                  flex: 1, minWidth: 140, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.6)', borderRadius: 14, padding: '20px 18px',
                  transition: 'all 0.2s ease', display: 'block',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.04)'; e.currentTarget.style.background = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, color: '#999' }}>{qa.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 3 }}>{qa.title}</div>
                  <div style={{ fontSize: 12.5, color: '#BBB', fontFamily: 'var(--font-body)' }}>{qa.desc}</div>
                </Link>
              ))}
            </div>

            {/* Agent Showcase */}
            <div style={{ marginBottom: 28, animation: 'fadeUp 0.5s ease both', animationDelay: '0.15s' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 14, marginTop: 0 }}>
                Popular Agents
              </h2>
              <AgentShowcase />
            </div>

            {/* Two column: Usage + Activity */}
            <div style={{ display: 'flex', gap: 16, animation: 'fadeUp 0.5s ease both', animationDelay: '0.18s' }}>
              {/* Usage stats */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, padding: '20px 22px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 16, marginTop: 0 }}>This Month</h2>
                {usageLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => <div key={i}><SkeletonCard height={14} /></div>)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                    {[
                      { label: 'Tasks Remaining', value: usageData ? `${usageData.remaining_tasks}` : '\u2014' },
                      { label: 'A2A Calls Left', value: usageData ? `${usageData.remaining_a2a_calls}` : '\u2014' },
                      { label: 'Plan', value: usageData?.plan?.charAt(0).toUpperCase() + (usageData?.plan?.slice(1) ?? '') || '\u2014' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12.5, color: '#999', fontFamily: 'var(--font-body)' }}>{stat.label}</span>
                        <span style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 16, padding: '20px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', margin: 0 }}>Recent Activity</h2>
                  <Link href="/history" className="no-underline" style={{ fontSize: 12, color: '#BBB', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#BBB')}
                  >All &rarr;</Link>
                </div>
                {liveActivity.map((evt) => {
                  const isError = evt.status === 'failed';
                  return (
                    <ActivityItem key={`live-${evt.execution_id}`}
                      icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {evt.status === 'running' ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> : isError ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></> : <polyline points="20 6 9 17 4 12" />}
                      </svg>}
                      text={<><strong style={{ color: '#1A1A1A' }}>{evt.agent_name}</strong> {evt.status === 'running' ? 'is running...' : isError ? (evt.error ?? 'failed') : (evt.text?.slice(0, 60) ?? 'completed')}</>}
                      time="just now"
                      accent={evt.status === 'running' ? 'rgba(59,130,246,0.06)' : isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)'}
                    />
                  );
                })}
                {execLoading ? (
                  <div style={{ padding: '12px 0' }}>{Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ height: 40, marginBottom: 8 }}><SkeletonCard height={40} /></div>)}</div>
                ) : execError ? (
                  <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                    <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{execError}</div>
                    <button onClick={execRefetch} style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>Retry</button>
                  </div>
                ) : executions.length === 0 && liveActivity.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 8px', color: '#CCC', fontSize: 13 }}>No recent activity</div>
                ) : (
                  executions.map((exec) => {
                    const isError = exec.status === 'failed';
                    return (
                      <ActivityItem key={exec.id}
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {isError ? <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></> : <polyline points="20 6 9 17 4 12" />}
                        </svg>}
                        text={<><strong style={{ color: '#1A1A1A' }}>{exec.agent_name ?? 'Agent'}</strong> {isError ? (exec.error ?? 'failed') : (exec.result?.text?.slice(0, 60) ?? exec.input_text?.slice(0, 60) ?? 'completed')}</>}
                        time={timeAgo(exec.started_at)}
                        accent={isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)'}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Thinking State ── */}
        {phase === 'thinking' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, animation: 'fadeUp 0.4s ease both' }}>
            <p style={{ fontSize: 18, color: '#999', fontWeight: 500, fontFamily: 'var(--font-body)' }}>&ldquo;{query}&rdquo;</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#1A1A1A', animation: `dotBounce 1.2s ease infinite ${i * 0.15}s` }} />)}
            </div>
            <p style={{ fontSize: 13, color: '#CCC', fontFamily: 'var(--font-body)' }}>Assembling your team...</p>
          </div>
        )}

        {/* ── Assembled State ── */}
        {phase === 'assembled' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', width: '100%', padding: '40px 0', animation: 'fadeUp 0.5s ease both' }}>
            <p style={{ fontSize: 15, color: '#AAA', marginBottom: 24, fontFamily: 'var(--font-body)' }}>&ldquo;{query}&rdquo;</p>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.55)', borderRadius: 18, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-outfit)' }}>Your AI Team</span>
                  <span style={{ fontSize: 12, color: '#CCC', marginLeft: 8, background: 'rgba(0,0,0,0.03)', padding: '2px 8px', borderRadius: 6, fontFamily: 'var(--font-body)' }}>{team.length} agents</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 20 }}>
                {team.map((a, i) => <AgentCard key={a.name} agent={a} index={i} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#BBB', fontFamily: 'var(--font-body)' }}>Estimated total</span>
                  <p style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--font-outfit)' }}>${total}/mo</p>
                </div>
                <Link href="/browse" className="no-underline" style={{
                  fontSize: 15, fontWeight: 650, color: '#FFF', background: '#1A1A1A', border: 'none',
                  padding: '14px 32px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'var(--font-body)', display: 'inline-block', textDecoration: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >Activate Team &rarr;</Link>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 18 }}>
              <button onClick={reset} style={{ fontSize: 13, color: '#BBB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>&larr; Try another goal</button>
              <Link href="/browse" className="no-underline" style={{ fontSize: 13, color: '#BBB', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>Browse marketplace &rarr;</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
