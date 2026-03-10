'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { useBillingStore } from '@/lib/store/billing';
import { useConnectionsStore } from '@/lib/store/connections';
import { useApiData } from '@/hooks/useApiData';
import { getEarnings, getEarningsHistory, requestPayout } from '@/lib/api/billing';
import { PLATFORM_PLANS } from '@agentspark/shared';
import Link from 'next/link';
import {
  SiGmail,
  SiShopify,
  SiHubspot,
  SiStripe,
  SiNotion,
  SiGooglecalendar,
  SiGooglesheets,
  SiAirtable,
} from '@icons-pack/react-simple-icons';

/* ─── Connector helpers (ported from connections page) ─── */

function ConnectorIcon({ id }: { id: string }) {
  const size = 18;
  const color = '#1A1A1A';
  const brandIcons: Record<string, React.ReactNode> = {
    gmail: <SiGmail size={size} color={color} />,
    shopify: <SiShopify size={size} color={color} />,
    hubspot: <SiHubspot size={size} color={color} />,
    stripe: <SiStripe size={size} color={color} />,
    notion: <SiNotion size={size} color={color} />,
    'google-calendar': <SiGooglecalendar size={size} color={color} />,
    'google-sheets': <SiGooglesheets size={size} color={color} />,
    airtable: <SiAirtable size={size} color={color} />,
    slack: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M5.04 15.16a2.4 2.4 0 1 1-2.4-2.4h2.4v2.4zm1.2 0a2.4 2.4 0 1 1 4.8 0v6a2.4 2.4 0 1 1-4.8 0v-6zM8.64 5.04a2.4 2.4 0 1 1 2.4-2.4v2.4H8.64zm0 1.2a2.4 2.4 0 1 1 0 4.8h-6a2.4 2.4 0 1 1 0-4.8h6zM18.96 8.64a2.4 2.4 0 1 1 2.4 2.4h-2.4V8.64zm-1.2 0a2.4 2.4 0 1 1-4.8 0v-6a2.4 2.4 0 1 1 4.8 0v6zM15.36 18.96a2.4 2.4 0 1 1-2.4 2.4v-2.4h2.4zm0-1.2a2.4 2.4 0 1 1 0-4.8h6a2.4 2.4 0 1 1 0 4.8h-6z"/>
      </svg>
    ),
    webhook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  };
  return (
    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      {brandIcons[id] ?? brandIcons.webhook}
    </div>
  );
}

const CONNECTOR_DESCRIPTIONS: Record<string, string> = {
  gmail: 'Send and read emails from Gmail',
  slack: 'Send messages and manage Slack channels',
  shopify: 'Manage products, orders, and customers',
  hubspot: 'CRM contacts, deals, and pipeline',
  stripe: 'Payments, invoices, and subscriptions',
  notion: 'Pages, databases, and workspace',
  'google-calendar': 'Events, scheduling, and availability',
  'google-sheets': 'Spreadsheets, rows, and formulas',
  airtable: 'Bases, tables, and records',
  webhook: 'Custom HTTP webhooks',
};

const CONNECTOR_NAMES: Record<string, string> = {
  gmail: 'Gmail', slack: 'Slack', shopify: 'Shopify', hubspot: 'HubSpot',
  stripe: 'Stripe', notion: 'Notion', 'google-calendar': 'Google Calendar',
  'google-sheets': 'Google Sheets', airtable: 'Airtable', webhook: 'Webhook',
};

const SUPPORTED_CONNECTORS = ['gmail', 'slack', 'shopify', 'hubspot', 'stripe', 'notion', 'google-calendar', 'google-sheets', 'airtable', 'webhook'];

/* ─── Earnings helpers ─── */

function mapStatus(payoutStatus: string): 'completed' | 'pending' | 'processing' {
  if (payoutStatus === 'paid') return 'completed';
  if (payoutStatus === 'processing') return 'processing';
  return 'pending';
}

function mapType(source: string): 'rental' | 'a2a' | 'payout' {
  if (source === 'rental') return 'rental';
  if (source === 'a2a_call') return 'a2a';
  return 'payout';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  processing: { label: 'Processing', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
} as const;

/* ─── Styles ─── */

type Tab = 'profile' | 'billing' | 'connections' | 'earnings';

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0,0,0,.03)',
  borderRadius: 11,
  padding: '20px',
};

const connectorCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
};

/* ─── Page ─── */

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');
  const { plan, usage, loading } = useBillingStore();

  // Connections
  const { connections, loading: connectionsLoading, error: connectionsError, fetch: refetchConnections, connect } = useConnectionsStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Earnings
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const earningsApi = useApiData({ fetchFn: async () => (await getEarnings()).earnings });
  const historyApi = useApiData({ fetchFn: async () => (await getEarningsHistory({ limit: 50 })).earnings });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab') as Tab | null;
    if (urlTab && ['profile', 'billing', 'connections', 'earnings'].includes(urlTab)) setTab(urlTab);
  }, []);

  useEffect(() => {
    if (tab === 'connections') refetchConnections();
  }, [tab, refetchConnections]);

  const planKey = (plan ?? 'free') as keyof typeof PLATFORM_PLANS;
  const currentPlan = PLATFORM_PLANS[planKey] ?? PLATFORM_PLANS.free;
  const tasksUsed = currentPlan.monthly_tasks - (usage?.remaining_tasks ?? currentPlan.monthly_tasks);
  const usagePercent = Math.min((tasksUsed / currentPlan.monthly_tasks) * 100, 100);

  // Connections
  const connectorCards2 = SUPPORTED_CONNECTORS.map((id) => {
    const composioStatus = connections.find((c) => c.connector_type === id);
    return {
      id,
      name: composioStatus?.name || CONNECTOR_NAMES[id] || id,
      description: CONNECTOR_DESCRIPTIONS[id] || '',
      connected: composioStatus?.connected ?? false,
    };
  });

  const handleConnect = async (connectorType: string) => {
    setConnectingId(connectorType);
    try {
      await connect(connectorType);
    } catch {
      setConnectingId(null);
    }
  };

  // Earnings
  const earnings = earningsApi.data;
  const history = historyApi.data ?? [];
  const earningsLoading = earningsApi.loading || historyApi.loading;
  const earningsError = earningsApi.error || historyApi.error;
  const currentMonthNet = earnings ? earnings.current_month_net_cents / 100 : 0;
  const pendingPayout = earnings ? earnings.pending_payout_cents / 100 : 0;
  const lifetimeNet = earnings ? earnings.total_net_cents / 100 : 0;
  const totalFees = earnings ? earnings.total_fee_cents / 100 : 0;
  const availableForPayout = lifetimeNet - pendingPayout;
  const fmtUsd = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleRequestPayout = async () => {
    setPayoutError(null);
    setPayoutRequested(true);
    try {
      await requestPayout();
      setTimeout(() => { earningsApi.refetch(); historyApi.refetch(); }, 1500);
      setTimeout(() => setPayoutRequested(false), 3000);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Payout request failed');
      setPayoutRequested(false);
    }
  };

  return (
    <div style={{ maxWidth: tab === 'connections' ? 960 : 640, margin: '0 auto', padding: '0 24px 80px', transition: 'max-width 0.2s' }}>
      <style>{`
        @keyframes settingsIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: 32, marginBottom: 24, animation: 'settingsIn 0.35s ease both' }}>
        <h1 style={{
          fontSize: 24, fontWeight: 400, color: '#1A1A1A',
          fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
          margin: 0,
        }}>Settings</h1>
        <p style={{ fontSize: 13.5, color: '#999', margin: '4px 0 0' }}>
          Account, billing, and preferences
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        borderBottom: '1px solid rgba(0,0,0,.04)',
        animation: 'settingsIn 0.35s ease 40ms both',
      }}>
        {(['profile', 'billing', 'connections', 'earnings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              fontSize: 12.5, fontWeight: tab === t ? 600 : 450,
              color: tab === t ? '#1A1A1A' : '#BBB',
              background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid #1A1A1A' : '2px solid transparent',
              padding: '9px 16px', marginBottom: -1,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
              textTransform: 'capitalize',
            }}
          >{t}</button>
        ))}
      </div>

      {/* ─── Profile Tab ─── */}
      {tab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'settingsIn 0.3s ease both' }}>

          {/* Profile card */}
          <div style={card}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>
                {user?.user_metadata?.full_name ?? 'Your Name'}
              </div>
              <div style={{ fontSize: 12.5, color: '#999' }}>
                {user?.email ?? 'you@example.com'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 550, color: '#888', marginBottom: 5 }}>Display Name</label>
                <input
                  type="text"
                  defaultValue={user?.user_metadata?.full_name ?? ''}
                  placeholder="Your name"
                  style={{
                    width: '100%', padding: '9px 12px',
                    fontSize: 13, color: '#1A1A1A',
                    background: 'rgba(0,0,0,.02)',
                    border: '1px solid rgba(0,0,0,.05)',
                    borderRadius: 8, outline: 'none',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.15s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 550, color: '#888', marginBottom: 5 }}>Email</label>
                <input
                  type="email"
                  defaultValue={user?.email ?? ''}
                  disabled
                  style={{
                    width: '100%', padding: '9px 12px',
                    fontSize: 13, color: '#BBB',
                    background: 'rgba(0,0,0,.015)',
                    border: '1px solid rgba(0,0,0,.03)',
                    borderRadius: 8, outline: 'none',
                    fontFamily: 'var(--font-body)',
                    cursor: 'not-allowed',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: 11, color: '#CCC', marginTop: 4 }}>Managed by your auth provider</div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>Security</span>
            </div>
            <p style={{ fontSize: 12.5, color: '#999', lineHeight: 1.5, margin: 0 }}>
              Authentication is managed through your sign-in provider. Use the login flow to update credentials.
            </p>
          </div>

          {/* API Keys */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>API Key</span>
            </div>
            <p style={{ fontSize: 12.5, color: '#999', lineHeight: 1.5, margin: '0 0 10px' }}>
              Use this key to access your agents programmatically.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(0,0,0,.025)', borderRadius: 8,
              padding: '10px 14px',
            }}>
              <code style={{ fontSize: 12, color: '#999', fontFamily: "'SF Mono', monospace", letterSpacing: '0.03em' }}>
                sk-{'••••••••••••••••••••••••••••••'}4f2a
              </code>
              <button style={{
                fontSize: 11, fontWeight: 550, color: '#999',
                background: 'rgba(0,0,0,.04)', border: 'none',
                borderRadius: 5, padding: '4px 10px', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}>Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Billing Tab ─── */}
      {tab === 'billing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'settingsIn 0.3s ease both' }}>

          {/* Current plan */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 3 }}>Current Plan</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10.5, fontWeight: 650, color: '#1A1A1A',
                    background: 'rgba(0,0,0,0.04)', padding: '3px 9px',
                    borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {loading ? '...' : currentPlan.name}
                  </span>
                  <span style={{ fontSize: 13, color: '#888' }}>
                    {currentPlan.price_cents === 0 ? 'Free' : `$${currentPlan.price_cents / 100}/mo`}
                  </span>
                </div>
              </div>
              <Link href="/pricing" style={{
                padding: '7px 16px', borderRadius: 8,
                background: '#1A1A1A', color: '#fff',
                fontSize: 12, fontWeight: 600,
                textDecoration: 'none', fontFamily: 'var(--font-body)',
              }}>
                {planKey === 'business' ? 'Manage' : 'Upgrade'}
              </Link>
            </div>
          </div>

          {/* Usage */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 14 }}>Usage This Period</div>

            {/* Tasks */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: '#888' }}>Tasks</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A1A' }}>
                  {loading ? '...' : `${tasksUsed.toLocaleString()} / ${currentPlan.monthly_tasks.toLocaleString()}`}
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(0,0,0,.04)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${usagePercent}%`, height: '100%',
                  background: usagePercent >= 90 ? '#EF4444' : usagePercent >= 70 ? '#F59E0B' : '#1A1A1A',
                  borderRadius: 3, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>

            {/* A2A */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: '#888' }}>Agent-to-Agent Calls</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1A1A1A' }}>
                  {loading ? '...' : `${usage?.remaining_a2a_calls ?? 0} remaining`}
                </span>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#CCC', marginTop: 12 }}>
              Resets monthly. Need more?{' '}
              <Link href="/pricing" style={{ color: '#999', fontWeight: 550, textDecoration: 'none' }}>Upgrade your plan</Link>
            </div>
          </div>

          {/* Plan comparison */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>Compare Plans</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 10px 8px 0', color: '#BBB', fontWeight: 500, fontSize: 11 }}></th>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <th key={key} style={{
                        textAlign: 'center', padding: '8px 6px',
                        color: key === planKey ? '#1A1A1A' : '#BBB',
                        fontWeight: key === planKey ? 650 : 500, fontSize: 11.5,
                      }}>
                        {p.name}
                        {key === planKey && (
                          <span style={{
                            display: 'block', fontSize: 9, fontWeight: 600,
                            color: '#22C55E', marginTop: 1,
                          }}>Current</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Tasks / mo', key: 'monthly_tasks' as const },
                    { label: 'A2A Calls / mo', key: 'monthly_a2a_calls' as const },
                  ].map(row => (
                    <tr key={row.label} style={{ borderBottom: '1px solid rgba(0,0,0,.025)' }}>
                      <td style={{ padding: '9px 10px 9px 0', color: '#888', fontSize: 12 }}>{row.label}</td>
                      {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                        <td key={key} style={{
                          textAlign: 'center', padding: '9px 6px',
                          color: '#1A1A1A', fontWeight: key === planKey ? 600 : 400,
                        }}>
                          {p[row.key].toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '9px 10px 9px 0', color: '#888', fontSize: 12 }}>Price</td>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <td key={key} style={{
                        textAlign: 'center', padding: '9px 6px',
                        color: p.price_cents === 0 ? '#22C55E' : '#1A1A1A',
                        fontWeight: key === planKey ? 600 : 400,
                      }}>
                        {p.price_cents === 0 ? 'Free' : `$${p.price_cents / 100}/mo`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── Connections Tab ─── */}
      {tab === 'connections' && (
        <div style={{ animation: 'settingsIn 0.3s ease both' }}>
          <p style={{ fontSize: 13, color: '#999', margin: '0 0 20px' }}>
            Connect your business tools so agents can take real actions on your behalf.
          </p>
          {connectionsLoading ? (
            <div style={{ fontSize: 13, color: '#999', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
          ) : connectionsError ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{connectionsError}</div>
              <button onClick={refetchConnections} style={{
                fontSize: 12.5, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
              }}>Retry</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
              {connectorCards2.map(({ id, name, description, connected }, i) => (
                <div key={id} style={{ ...connectorCard, animation: `settingsIn 0.25s ease ${i * 30}ms both` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, marginBottom: 14 }}>
                    <ConnectorIcon id={id} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 650, color: '#1A1A1A', lineHeight: 1.25, marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 12.5, color: '#999' }}>{description}</div>
                    </div>
                  </div>
                  {connected ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(id)}
                      disabled={connectingId === id}
                      style={{
                        width: '100%', fontSize: 13, fontWeight: 600, color: '#1A1A1A',
                        background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: 8, padding: '8px 0',
                        cursor: connectingId === id ? 'not-allowed' : 'pointer',
                        opacity: connectingId === id ? 0.5 : 1, transition: 'all 0.15s',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={(e) => { if (connectingId !== id) e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                    >
                      {connectingId === id ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Earnings Tab ─── */}
      {tab === 'earnings' && (
        <div style={{ animation: 'settingsIn 0.3s ease both' }}>

          {/* Error */}
          {earningsError && !earningsLoading && (
            <div style={{
              padding: 20, marginBottom: 20,
              background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)',
              borderRadius: 10, textAlign: 'center',
            }}>
              <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 10px' }}>{earningsError}</p>
              <button onClick={() => { earningsApi.refetch(); historyApi.refetch(); }} style={{
                padding: '7px 16px', background: '#1A1A1A', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Retry</button>
            </div>
          )}

          {/* Summary cards */}
          {!earningsError && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'This Month', value: fmtUsd(currentMonthNet), accent: '#059669' },
                { label: 'Pending', value: fmtUsd(pendingPayout), accent: '#F59E0B' },
                { label: 'Lifetime', value: fmtUsd(lifetimeNet), accent: undefined },
                { label: 'Fees', value: fmtUsd(totalFees), accent: undefined },
              ].map((stat) => (
                <div key={stat.label} style={card}>
                  <div style={{ fontSize: 11, fontWeight: 550, color: '#BBB', marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' as const }}>{stat.label}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 400, color: stat.accent ?? '#1A1A1A',
                    fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
                  }}>{earningsLoading ? '...' : stat.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Payout */}
          {!earningsError && !earningsLoading && (
            <div style={{
              ...card,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, flexWrap: 'wrap', marginBottom: 20,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 550, color: '#888', marginBottom: 4 }}>Available for Payout</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 400, color: '#059669', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em' }}>{fmtUsd(availableForPayout)}</span>
                  <span style={{ fontSize: 11.5, color: '#CCC' }}>to Stripe</span>
                </div>
                {payoutRequested && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: '#059669' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Payout requested. Funds transfer in 2-3 business days.
                  </div>
                )}
                {payoutError && <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444' }}>{payoutError}</div>}
                <div style={{ fontSize: 10.5, color: '#CCC', marginTop: 8 }}>Minimum payout: $10.00</div>
              </div>
              <button
                onClick={handleRequestPayout}
                disabled={payoutRequested || availableForPayout < 10}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: '#1A1A1A', color: '#fff', fontSize: 12.5, fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: payoutRequested || availableForPayout < 10 ? 'not-allowed' : 'pointer',
                  opacity: payoutRequested || availableForPayout < 10 ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {payoutRequested ? 'Requested!' : 'Request Payout'}
              </button>
            </div>
          )}

          {/* Transaction History */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>Transaction History</div>
          {earningsLoading ? (
            <div style={{ fontSize: 13, color: '#999', padding: '40px 0', textAlign: 'center' }}>Loading...</div>
          ) : history.length === 0 ? (
            <div style={{
              padding: '44px 24px', textAlign: 'center',
              background: 'rgba(255,255,255,.3)', borderRadius: 11,
              border: '1px dashed rgba(0,0,0,.06)',
            }}>
              <p style={{ fontSize: 13, color: '#BBB', margin: 0 }}>
                No transactions yet. Earnings appear here as your agents get rented.
              </p>
            </div>
          ) : (
            <div style={card}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                      {['Date', 'Agent', 'Type', 'Amount', 'Status'].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i === 3 || i === 4 ? 'right' : i === 2 ? 'center' : 'left',
                          padding: '10px 16px', color: '#BBB', fontWeight: 500, fontSize: 11,
                          letterSpacing: '0.02em', textTransform: 'uppercase' as const,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry: any, i: number) => {
                      const displayType = mapType(entry.source);
                      const displayStatus = mapStatus(entry.payout_status);
                      const statusCfg = STATUS_CONFIG[displayStatus];
                      const amountDollars = entry.net_amount_cents / 100;
                      const agentName = entry.agents?.name ?? (entry.source === 'bonus' ? 'Bonus' : 'Unknown');

                      return (
                        <tr key={entry.id} style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(0,0,0,.025)' : 'none' }}>
                          <td style={{ padding: '11px 16px', color: '#999', whiteSpace: 'nowrap' }}>{formatDate(entry.created_at)}</td>
                          <td style={{ padding: '11px 16px', fontWeight: 550, color: '#1A1A1A' }}>{agentName}</td>
                          <td style={{ textAlign: 'center', padding: '11px 16px' }}>
                            <span style={{
                              fontSize: 10.5, fontWeight: 550, textTransform: 'capitalize' as const,
                              color: displayType === 'payout' ? '#3B82F6' : '#888',
                              background: displayType === 'payout' ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,.03)',
                              padding: '3px 7px', borderRadius: 4,
                            }}>
                              {displayType === 'a2a' ? 'A2A Call' : displayType}
                            </span>
                          </td>
                          <td style={{
                            textAlign: 'right', padding: '11px 16px',
                            fontWeight: 600, color: '#059669',
                            fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em',
                          }}>+${amountDollars.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', padding: '11px 16px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10.5, fontWeight: 500, color: statusCfg.color,
                              background: statusCfg.bg, padding: '3px 8px', borderRadius: 4,
                            }}>
                              <span style={{ width: 4, height: 4, borderRadius: '50%', background: statusCfg.color }} />
                              {statusCfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
