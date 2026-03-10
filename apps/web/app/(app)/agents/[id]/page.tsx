'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api/client';
import { getConnectionStatus, authorizeConnection, type ComposioConnectionStatus } from '@/lib/api/connections';
import { createRental, getActiveRentals } from '@/lib/api/rentals';
import type { ActiveRental } from '@/lib/api/rentals';
import { getExecution } from '@/lib/api/agents';
import { useAuthStore } from '@/lib/store/auth';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface AgentDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  system_prompt: string;
  model: string;
  required_connectors: string[];
  optional_connectors: string[];
  a2a_agent_card?: { connector_usage?: Record<string, string> };
  status: string;
  creator_id: string;
  avg_rating: number;
  review_count: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  status?: 'sending' | 'running' | 'completed' | 'failed';
  timestamp: Date;
}

/* ═══════════════════════════════════════════════════════════════
   CONNECTOR DISPLAY NAMES
   ═══════════════════════════════════════════════════════════════ */

const CONNECTOR_NAMES: Record<string, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  shopify: 'Shopify',
  hubspot: 'HubSpot',
  stripe: 'Stripe',
  notion: 'Notion',
  'google-calendar': 'Google Calendar',
  'google-sheets': 'Google Sheets',
  airtable: 'Airtable',
  webhook: 'Webhooks',
};

/* ═══════════════════════════════════════════════════════════════
   CONNECTOR ICON (inline SVG)
   ═══════════════════════════════════════════════════════════════ */

function ConnectorIcon({ id }: { id: string }) {
  const size = 20;
  const stroke = '#1A1A1A';
  const sw = 1.8;

  const icons: Record<string, React.ReactNode> = {
    gmail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    slack: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-4 0v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2z" /><path d="M3 9a2 2 0 0 1 2-2h2V5a2 2 0 0 1 4 0v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    ),
    shopify: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    hubspot: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    stripe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    notion: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    'google-calendar': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    'google-sheets': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
    airtable: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    webhook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  };

  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icons[id] ?? icons.webhook}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.6)',
  borderRadius: 14,
};

const fontBody = "var(--font-body), 'DM Sans', sans-serif";
const fontHeading = "var(--font-outfit), 'Outfit', sans-serif";

const KEYFRAMES = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
`;

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AgentRunPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);

  // --- Data state ---
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [connStatuses, setConnStatuses] = useState<ComposioConnectionStatus[]>([]);
  const [rental, setRental] = useState<ActiveRental | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Chat state ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Scroll to bottom on new messages ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- Load agent, connections, and active rentals ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [agentRes, connRes, rentalRes] = await Promise.all([
          apiGet<{ agent: AgentDetail }>(`/api/agents/${id}`),
          getConnectionStatus(),
          getActiveRentals(),
        ]);
        if (cancelled) return;

        setAgent(agentRes.agent);
        setConnStatuses(connRes.connections);

        // Find an existing active rental for this agent
        const existing = rentalRes.rentals.find(
          (r) => r.agent_id === agentRes.agent.id && r.status === 'active'
        );
        if (existing) setRental(existing);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load agent');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // --- Connector readiness ---
  const requiredConnectors = agent?.required_connectors ?? [];
  const optionalConnectors = agent?.optional_connectors ?? [];
  const allAgentConnectors = [...requiredConnectors, ...optionalConnectors];

  const connectorStatus = allAgentConnectors.map((type) => {
    const status = connStatuses.find((c) => c.connector_type === type);
    return { type, connected: status?.connected ?? false };
  });

  const allConnected = requiredConnectors.length === 0 ||
    requiredConnectors.every((type) => connStatuses.find((c) => c.connector_type === type)?.connected);

  // --- Refresh connection status ---
  const refreshConnStatus = async () => {
    try {
      const res = await getConnectionStatus();
      setConnStatuses(res.connections);
    } catch { /* ignore */ }
  };

  // --- Handle OAuth connect via Composio ---
  const handleConnect = async (connectorType: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setConnectingType(connectorType);
    try {
      const { redirectUrl } = await authorizeConnection(connectorType);
      if (redirectUrl) {
        // Open in popup so user doesn't leave the page
        const w = 500, h = 700;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(redirectUrl, 'composio_auth', `width=${w},height=${h},left=${left},top=${top}`);

        if (popup) {
          const timer = setInterval(() => {
            if (popup.closed) {
              clearInterval(timer);
              setConnectingType(null);
              refreshConnStatus();
            }
          }, 500);
        } else {
          window.location.href = redirectUrl;
        }
      }
    } catch {
      setConnectingType(null);
    }
  };

  // --- Poll execution status ---
  const pollExecution = useCallback(async (executionId: string, messageId: string) => {
    const poll = async () => {
      try {
        const res = await getExecution(executionId);
        const exec = res.execution;

        if (exec.status === 'completed') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: exec.result?.text ?? 'Done.', status: 'completed' as const }
                : m
            )
          );
          return;
        }

        if (exec.status === 'failed') {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, content: exec.error ?? 'Execution failed.', status: 'failed' as const }
                : m
            )
          );
          return;
        }

        // Still running, poll again
        setTimeout(poll, 2000);
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: 'Failed to check execution status.', status: 'failed' as const }
              : m
          )
        );
      }
    };

    poll();
  }, []);

  // --- Send message ---
  const handleSend = async () => {
    const input = inputValue.trim();
    if (!input || sending || !allConnected || !agent) return;

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: input, timestamp: new Date() },
    ]);
    setInputValue('');
    setSending(true);

    // Add placeholder agent message
    setMessages((prev) => [
      ...prev,
      { id: agentMsgId, role: 'agent', content: '', status: 'sending', timestamp: new Date() },
    ]);

    try {
      // Ensure we have a rental
      let currentRental = rental;
      if (!currentRental) {
        const rentalRes = await createRental(agent.id, []);
        if (rentalRes.checkout_url) {
          window.location.href = rentalRes.checkout_url;
          return;
        }
        if (rentalRes.rental_id) {
          const newRental: ActiveRental = {
            id: rentalRes.rental_id,
            agent_id: agent.id,
            status: 'active',
            monthly_price_cents: 0,
            total_executions: 0,
            started_at: new Date().toISOString(),
          };
          setRental(newRental);
          currentRental = newRental;
        }
      }

      if (!currentRental) {
        throw new Error('Could not create rental');
      }

      // Update agent message to "running"
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId ? { ...m, status: 'running' as const } : m
        )
      );

      // Execute — Composio handles tool connections server-side
      const execRes = await apiPost<{ execution_id: string; result?: { text: string } }>(`/api/agents/${agent.id}/execute`, {
        rental_id: currentRental.id,
        input,
      });

      // If the execute endpoint returned inline result, use it directly
      if (execRes.result?.text) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId ? { ...m, content: execRes.result!.text, status: 'completed' as const } : m
          )
        );
      } else {
        // Poll for result
        pollExecution(execRes.execution_id, agentMsgId);
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentMsgId
            ? {
                ...m,
                content: e instanceof Error ? e.message : 'Something went wrong.',
                status: 'failed' as const,
              }
            : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 80px', animation: 'fadeUp 0.4s ease both' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ height: 14, width: 120, background: 'rgba(0,0,0,0.04)', borderRadius: 6, marginBottom: 24 }} />
        <div style={{ height: 28, width: 260, background: 'rgba(0,0,0,0.06)', borderRadius: 8, marginBottom: 10 }} />
        <div style={{ height: 14, width: 380, background: 'rgba(0,0,0,0.03)', borderRadius: 4, marginBottom: 32 }} />
        <div style={{ height: 140, background: 'rgba(255,255,255,0.5)', borderRadius: 14, marginBottom: 20 }} />
        <div style={{ height: 300, background: 'rgba(255,255,255,0.5)', borderRadius: 14 }} />
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error || !agent) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: fontBody }}>
        <style>{KEYFRAMES}</style>
        <p style={{ fontSize: 18, color: '#999', marginBottom: 8 }}>
          {error ?? 'Agent not found'}
        </p>
        <Link href="/agents" style={{ fontSize: 14, color: '#666', textDecoration: 'underline' }}>
          Back to My Agents
        </Link>
      </div>
    );
  }

  const rating = Number(agent.avg_rating) || 0;

  /* ─── Main Render ─── */
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 80px', animation: 'fadeUp 0.4s ease both' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, color: '#BBB', fontFamily: fontBody }}>
        <Link href="/agents" style={{ color: '#999', textDecoration: 'none' }}>Agents</Link>
        <span>/</span>
        <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{agent.name}</span>
      </div>

      {/* ── Agent Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 300, color: '#1A1A1A',
            fontFamily: fontHeading, letterSpacing: '-0.03em', margin: 0,
          }}>
            {agent.name}
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#888',
            background: 'rgba(0,0,0,0.04)', borderRadius: 6,
            padding: '3px 10px', fontFamily: fontBody,
          }}>
            {agent.category}
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0, fontFamily: fontBody }}>
          {agent.description}
        </p>
        {/* Agent email address */}
        {agent.slug && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginTop: 10,
            padding: '8px 14px', borderRadius: 9, width: 'fit-content',
            background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
            </svg>
            <span style={{ fontSize: 12.5, color: '#666', fontFamily: fontBody, fontWeight: 500 }}>
              {agent.slug}@{process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || 'agentspark.ca'}
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`${agent.slug}@${process.env.NEXT_PUBLIC_AGENT_EMAIL_DOMAIN || 'agentspark.ca'}`)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                display: 'flex', alignItems: 'center', borderRadius: 4,
              }}
              title="Copy email address"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        )}
        {rating > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 13, color: '#999', fontFamily: fontBody }}>
            <span>{'\u2605'} {rating.toFixed(1)}</span>
            <span style={{ opacity: 0.3 }}>&middot;</span>
            <span>{agent.review_count} review{agent.review_count !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* ── Connection Status Panel ── */}
      {allAgentConnectors.length > 0 && (
        <div style={{ ...glassCard, padding: 24, marginBottom: 24 }}>
          <h3 style={{
            fontSize: 13, fontWeight: 600, color: '#AAA', textTransform: 'uppercase' as const,
            letterSpacing: '0.04em', marginTop: 0, marginBottom: 16, fontFamily: fontBody,
          }}>
            Connections
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {connectorStatus.map(({ type, connected }) => {
              const usage = agent?.a2a_agent_card?.connector_usage?.[type];
              return (
              <div
                key={type}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', borderRadius: 10,
                  background: connected ? 'rgba(34,197,94,0.04)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${connected ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.04)'}`,
                }}
              >
                <ConnectorIcon id={type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>
                    {CONNECTOR_NAMES[type] ?? type}
                  </div>
                  {usage && (
                    <div style={{ fontSize: 12, color: '#888', fontFamily: fontBody, marginTop: 2 }}>
                      {usage}
                    </div>
                  )}
                </div>

                {connected ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 12.5, color: '#22C55E', fontWeight: 600, fontFamily: fontBody }}>
                      Connected
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleConnect(type)}
                    disabled={connectingType === type}
                    style={{
                      fontSize: 12.5, fontWeight: 600, color: '#fff',
                      background: '#1A1A1A', border: 'none', borderRadius: 8,
                      padding: '7px 18px', cursor: connectingType === type ? 'not-allowed' : 'pointer',
                      opacity: connectingType === type ? 0.6 : 1,
                      transition: 'all 0.15s', fontFamily: fontBody,
                    }}
                    onMouseEnter={(e) => { if (connectingType !== type) e.currentTarget.style.background = '#333'; }}
                    onMouseLeave={(e) => { if (connectingType !== type) e.currentTarget.style.background = '#1A1A1A'; }}
                  >
                    {connectingType === type ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Chat Interface ── */}
      <div style={{ ...glassCard, display: 'flex', flexDirection: 'column' as const, minHeight: 420, overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: allConnected ? '#22C55E' : '#F59E0B',
          }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>
            {allConnected ? 'Ready' : 'Setup Required'}
          </span>
          <span style={{ fontSize: 12, color: '#999', fontFamily: fontBody }}>
            — Chat with {agent.name}
          </span>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto' as const, padding: '20px 24px',
          display: 'flex', flexDirection: 'column' as const, gap: 16,
        }}>
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column' as const, gap: 8, padding: '40px 0',
            }}>
              <div style={{ fontSize: 28, opacity: 0.15 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p style={{ fontSize: 14, color: '#CCC', margin: 0, fontFamily: fontBody, textAlign: 'center' as const }}>
                {allConnected
                  ? `Send a message to start working with ${agent.name}`
                  : 'Connect all required tools above to start using this agent'}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{
                maxWidth: '80%', padding: '12px 16px', borderRadius: 12,
                fontSize: 14, lineHeight: 1.6, fontFamily: fontBody,
                ...(msg.role === 'user'
                  ? { background: '#1A1A1A', color: '#fff', borderBottomRightRadius: 4 }
                  : {
                      background: msg.status === 'failed' ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.03)',
                      color: msg.status === 'failed' ? '#EF4444' : '#1A1A1A',
                      borderBottomLeftRadius: 4,
                    }),
              }}>
                {/* Running / sending indicator */}
                {(msg.status === 'sending' || msg.status === 'running') && !msg.content ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 14, height: 14, border: '2px solid rgba(0,0,0,0.1)',
                      borderTopColor: '#1A1A1A', borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    <span style={{ fontSize: 13, color: '#999' }}>
                      {msg.status === 'sending' ? 'Sending...' : 'Thinking...'}
                    </span>
                  </div>
                ) : (
                  <span style={{ whiteSpace: 'pre-wrap' as const }}>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.04)',
          display: 'flex', gap: 10, alignItems: 'center',
        }}>
          {!allConnected ? (
            <div style={{
              flex: 1, textAlign: 'center' as const, padding: '10px 0',
              fontSize: 13, color: '#F59E0B', fontWeight: 500, fontFamily: fontBody,
            }}>
              Connect all required tools above to start using this agent
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agent.name}...`}
                disabled={sending}
                style={{
                  flex: 1, fontSize: 14, color: '#1A1A1A', fontFamily: fontBody,
                  background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 10, padding: '10px 16px', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !inputValue.trim()}
                style={{
                  width: 40, height: 40, borderRadius: 10, border: 'none',
                  background: inputValue.trim() && !sending ? '#1A1A1A' : 'rgba(0,0,0,0.06)',
                  color: inputValue.trim() && !sending ? '#fff' : '#CCC',
                  cursor: inputValue.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() && !sending) e.currentTarget.style.background = '#333';
                }}
                onMouseLeave={(e) => {
                  if (inputValue.trim() && !sending) e.currentTarget.style.background = '#1A1A1A';
                }}
              >
                {sending ? (
                  <div style={{
                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.5s linear infinite',
                  }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
