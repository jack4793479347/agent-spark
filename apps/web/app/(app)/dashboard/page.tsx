'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth';
import { ShineBorder } from '@/components/ui/shine-border';
import { useApiData } from '@/hooks/useApiData';
import { useAgentActivity } from '@/hooks/useRealtimeEvents';
import { useBillingStore } from '@/lib/store/billing';
import { useConnectionsStore } from '@/lib/store/connections';
import { useRentalsStore } from '@/lib/store/rentals';
import { getExecutions, getMyAgents, type AgentMine, type Execution } from '@/lib/api/agents';
import { PLATFORM_PLANS, type PlanTier } from '@agentspark/shared';
import { SkeletonCard } from '@/components/shared/Skeleton';

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

function statusColor(status: string): string {
  if (status === 'published') return '#22C55E';
  if (status === 'draft') return '#F59E0B';
  return '#CCC';
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,.03)',
  borderRadius: 11,
};

function SectionHeader({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', margin: 0 }}>{title}</h2>
      <Link href={href} className="no-underline" style={{ fontSize: 11, color: '#CCC', fontWeight: 500, transition: 'color 0.15s' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#CCC')}
      >{linkText} &rarr;</Link>
    </div>
  );
}

/* ─── Page ─── */

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = (user?.user_metadata?.full_name ?? 'there').split(' ')[0];

  const { plan, usage, loading: billingLoading } = useBillingStore();
  const { connections, loading: connsLoading } = useConnectionsStore();
  const { rentals } = useRentalsStore();

  const { data: agentsData, loading: agentsLoading } = useApiData({ fetchFn: getMyAgents });
  const { data: execData, loading: execLoading, error: execError, refetch: execRefetch } = useApiData({ fetchFn: () => getExecutions({ limit: 6 }) });
  const liveActivity = useAgentActivity(5);

  const agents: AgentMine[] = agentsData?.agents ?? [];
  const executions: Execution[] = execData?.executions ?? [];

  const planKey = (plan || 'free') as PlanTier;
  const planDef = PLATFORM_PLANS[planKey] ?? PLATFORM_PLANS.free;
  const tasksUsed = planDef.monthly_tasks - (usage?.remaining_tasks ?? planDef.monthly_tasks);
  const a2aUsed = planDef.monthly_a2a_calls - (usage?.remaining_a2a_calls ?? planDef.monthly_a2a_calls);

  const publishedCount = agents.filter(a => a.status === 'published').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const allConnectors = ['gmail', 'slack', 'shopify', 'hubspot', 'stripe', 'notion', 'google-calendar', 'google-sheets', 'airtable', 'webhook'];
  const connectedNames = new Set(connections.filter(c => c.connected).map(c => c.connector_type));
  const connectedCount = allConnectors.filter(n => connectedNames.has(n)).length;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px 80px' }}>
      <style>{`@keyframes dashIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ paddingTop: 32, marginBottom: 28, animation: 'dashIn 0.35s ease both' }}>
        <h1 style={{
          fontSize: 26, fontWeight: 400, color: '#1A1A1A',
          fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
          margin: '0 0 4px',
        }}>
          {greeting}, {firstName}
        </h1>
        <p style={{ fontSize: 13.5, color: '#999', margin: 0 }}>
          {planKey.charAt(0).toUpperCase() + planKey.slice(1)} plan · {usage?.remaining_tasks ?? '—'} tasks remaining this month
        </p>
      </div>

      {/* Onboarding for new users */}
      {!agentsLoading && agents.length === 0 && rentals.length === 0 && (
        <div style={{ animation: 'dashIn 0.35s ease 80ms both', marginBottom: 28 }}>
          <ShineBorder borderWidth={2} duration={5} gradient="from-neutral-300 via-neutral-500 to-neutral-300">
          <div style={{
            ...card, padding: '32px 28px', textAlign: 'center', border: 'none', borderRadius: 14,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'rgba(0,0,0,.03)',
              display: 'grid', placeItems: 'center', margin: '0 auto 16px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', margin: '0 0 6px' }}>
              Get started with Agent Spark
            </h2>
            <p style={{ fontSize: 14, color: '#999', margin: '0 0 24px', lineHeight: 1.5 }}>
              Create an AI agent, browse the marketplace, or connect your tools.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/studio" className="no-underline" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10,
                background: '#1A1A1A', color: '#fff',
                fontSize: 13, fontWeight: 600,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Agent
              </Link>
              <Link href="/agents?tab=browse" className="no-underline" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.7)',
                color: '#666', fontSize: 13, fontWeight: 600,
              }}>Browse Marketplace</Link>
              <Link href="/settings?tab=connections" className="no-underline" style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '11px 22px', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.7)',
                color: '#666', fontSize: 13, fontWeight: 600,
              }}>Connect Tools</Link>
            </div>
          </div>
          </ShineBorder>
        </div>
      )}

      {/* Top stats row */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        marginBottom: 14, animation: 'dashIn 0.35s ease 50ms both',
      }}>
        {[
          { label: 'My Agents', value: agentsLoading ? '—' : String(agents.length), href: '/agents' },
          { label: 'Published', value: agentsLoading ? '—' : String(publishedCount), href: '/agents' },
          { label: 'Installed', value: String(rentals.length), href: '/agents?tab=installed' },
          { label: 'Connections', value: connsLoading ? '—' : `${connectedCount}/${allConnectors.length}`, href: '/settings?tab=connections' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="no-underline" style={{
            ...card, padding: '14px 16px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              fontSize: 22, fontWeight: 400, color: '#1A1A1A',
              fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em',
              marginBottom: 2,
            }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#BBB', fontWeight: 500 }}>{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Two-column: Usage + Agents */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        marginBottom: 10, animation: 'dashIn 0.35s ease 100ms both',
      }}>
        {/* Usage */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <SectionHeader title="Usage This Month" href="/settings?tab=billing" linkText="Manage" />
          {billingLoading ? (
            <SkeletonCard height={56} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Tasks', used: tasksUsed, total: planDef.monthly_tasks },
                { label: 'Agent-to-Agent Calls', used: a2aUsed, total: planDef.monthly_a2a_calls },
              ].map(bar => {
                const pct = bar.total > 0 ? Math.min((bar.used / bar.total) * 100, 100) : 0;
                return (
                  <div key={bar.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#888' }}>{bar.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A' }}>
                        {bar.used.toLocaleString()} <span style={{ color: '#CCC', fontWeight: 400 }}>/ {bar.total.toLocaleString()}</span>
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,.04)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%', borderRadius: 2,
                        background: pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#1A1A1A',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Agents */}
        <div style={{ ...card, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="My Agents" href="/agents" linkText="All" />
          {agentsLoading ? (
            <SkeletonCard height={80} />
          ) : agents.length === 0 && rentals.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0' }}>
              <p style={{ fontSize: 13, color: '#BBB', marginBottom: 12 }}>No agents yet</p>
              <Link href="/studio" className="no-underline" style={{
                fontSize: 12, fontWeight: 600, color: '#fff', background: '#1A1A1A',
                borderRadius: 7, padding: '7px 16px',
              }}>Create your first agent</Link>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              {agents.slice(0, 4).map((agent, i) => (
                <Link key={agent.id} href={`/agents/${agent.id}`} className="no-underline" style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 0',
                  borderBottom: i < Math.min(agents.length, 4) - 1 ? '1px solid rgba(0,0,0,.025)' : 'none',
                  transition: 'opacity 0.12s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: 'rgba(0,0,0,.03)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 11, fontWeight: 700, color: '#1A1A1A', flexShrink: 0,
                    fontFamily: 'var(--font-outfit)',
                  }}>{agent.name.charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12.5, fontWeight: 600, color: '#1A1A1A',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{agent.name}</div>
                    <div style={{ fontSize: 10.5, color: '#CCC' }}>
                      {agent.total_executions} runs · {agent.active_rentals} installs
                    </div>
                  </div>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: statusColor(agent.status), flexShrink: 0,
                  }} title={agent.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Connections */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 10, animation: 'dashIn 0.35s ease 150ms both' }}>
        <SectionHeader title="Connections" href="/settings?tab=connections" linkText="Manage" />
        {connsLoading ? (
          <SkeletonCard height={28} />
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allConnectors.map((name) => {
              const connected = connectedNames.has(name);
              const displayName = connections.find(c => c.connector_type === name)?.name
                ?? name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              return (
                <Link key={name} href="/settings?tab=connections" className="no-underline" style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6,
                  background: connected ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${connected ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,.03)'}`,
                  transition: 'all 0.12s',
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: connected ? '#22C55E' : '#DDD' }} />
                  <span style={{ fontSize: 11, color: connected ? '#666' : '#BBB', fontWeight: 500 }}>
                    {displayName}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{ ...card, padding: '18px 20px', animation: 'dashIn 0.35s ease 200ms both' }}>
        <SectionHeader title="Recent Activity" href="/history" linkText="All activity" />

        {/* Live events */}
        {liveActivity.map((evt) => {
          const isError = evt.status === 'failed';
          const isRunning = evt.status === 'running';
          const statusBg = isRunning ? 'rgba(59,130,246,0.06)' : isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)';
          const statusStroke = isRunning ? '#3B82F6' : isError ? '#EF4444' : '#22C55E';
          return (
            <div key={`live-${evt.execution_id}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,.025)',
            }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: statusBg, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={statusStroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {isRunning ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> : isError ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <polyline points="20 6 9 17 4 12" />}
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#888', lineHeight: 1.4 }}>
                <strong style={{ color: '#1A1A1A', fontWeight: 600 }}>{evt.agent_name}</strong>{' '}
                {isRunning ? 'is running...' : isError ? (evt.error ?? 'failed') : (evt.text?.slice(0, 80) ?? 'completed')}
              </div>
              <span style={{ fontSize: 10.5, color: '#CCC', flexShrink: 0, marginTop: 2 }}>just now</span>
            </div>
          );
        })}

        {/* Historical */}
        {execLoading ? (
          <div style={{ padding: '8px 0' }}>{Array.from({ length: 3 }).map((_, i) => <div key={i} style={{ marginBottom: 6 }}><SkeletonCard height={32} /></div>)}</div>
        ) : execError ? (
          <div style={{ textAlign: 'center', padding: '20px 8px' }}>
            <p style={{ fontSize: 12.5, color: '#EF4444', margin: '0 0 10px' }}>{execError}</p>
            <button onClick={execRefetch} style={{
              fontSize: 12, fontWeight: 600, color: '#1A1A1A',
              background: 'rgba(0,0,0,0.04)', border: 'none',
              borderRadius: 7, padding: '6px 16px', cursor: 'pointer',
            }}>Retry</button>
          </div>
        ) : executions.length === 0 && liveActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 8px' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center',
              margin: '0 auto 10px',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p style={{ fontSize: 13, color: '#BBB', margin: '0 0 4px' }}>No activity yet</p>
            <p style={{ fontSize: 12, color: '#CCC', margin: 0 }}>Run an agent to see activity here</p>
          </div>
        ) : (
          executions.map((exec, i) => {
            const isError = exec.status === 'failed';
            const statusBg = isError ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)';
            const statusStroke = isError ? '#EF4444' : '#22C55E';
            return (
              <Link key={exec.id} href="/history" className="no-underline" style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '9px 0',
                borderBottom: i < executions.length - 1 ? '1px solid rgba(0,0,0,.025)' : 'none',
                transition: 'opacity 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <div style={{ width: 26, height: 26, borderRadius: 7, background: statusBg, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={statusStroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    {isError ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></> : <polyline points="20 6 9 17 4 12" />}
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: '#888', lineHeight: 1.4 }}>
                  <strong style={{ color: '#1A1A1A', fontWeight: 600 }}>{exec.agent_name ?? 'Agent'}</strong>{' '}
                  {isError
                    ? (exec.error?.slice(0, 80) ?? 'failed')
                    : (exec.result?.text?.slice(0, 80) ?? exec.input_text?.slice(0, 80) ?? 'completed')
                  }
                </div>
                <span style={{ fontSize: 10.5, color: '#CCC', flexShrink: 0, marginTop: 2 }}>{timeAgo(exec.started_at)}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
