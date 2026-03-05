'use client';

import { useState } from 'react';
import { useConnectionsStore } from '@/lib/store/connections';
import { SkeletonGrid } from '@/components/shared/Skeleton';

/* ═══════════════════════════════════════════════════════════════
   CONNECTOR ICON MAP
   ═══════════════════════════════════════════════════════════════ */

function ConnectorIcon({ id }: { id: string }) {
  const size = 22;
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
    <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: 11, background: '#F3F3F3' }}>
      {icons[id] ?? icons.webhook}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GLASS CARD
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
};

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function ConnectionsPage() {
  const { connections, availableTypes, loading, error, fetch: refetch, disconnect, startOAuth } = useConnectionsStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Build a merged list: each connector type with its connection status
  const connectorCards = availableTypes.map((type) => {
    const conn = connections.find((c) => c.connector_type_id === type.id && c.status === 'active');
    return { type, connection: conn };
  });

  const handleConnect = async (typeId: string) => {
    setConnectingId(typeId);
    try {
      await startOAuth(typeId);
    } catch {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (connId: string) => {
    await disconnect(connId);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 className="m-0 mb-1" style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Connections
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 14, color: '#999' }}>
        Connect your business tools so agents can take real actions on your behalf.
      </p>

      {loading ? (
        <SkeletonGrid count={6} cardHeight={130} />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px 16px' }}>
          <div style={{ fontSize: 13, color: '#EF4444', marginBottom: 12 }}>{error}</div>
          <button onClick={refetch} style={{
            fontSize: 12.5, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
          }}>
            Retry
          </button>
        </div>
      ) : connectorCards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: '#CCC', fontSize: 13 }}>
          No connectors available.
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
          {connectorCards.map(({ type, connection }, i) => (
            <div
              key={type.id}
              style={{
                ...glassCard,
                padding: '20px',
                animation: `cardIn 0.25s ease ${i * 30}ms both`,
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <ConnectorIcon id={type.id} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 650, color: '#1A1A1A', lineHeight: 1.25, marginBottom: 2 }}>
                    {type.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#999' }}>{type.description}</div>
                </div>
              </div>

              {connection ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>Connected</span>
                  </div>
                  <button
                    onClick={() => handleDisconnect(connection.id)}
                    style={{
                      fontSize: 11.5, fontWeight: 500, color: '#CCC', background: 'none',
                      border: 'none', cursor: 'pointer', transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#CCC')}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleConnect(type.id)}
                  disabled={connectingId === type.id}
                  style={{
                    width: '100%', fontSize: 13, fontWeight: 600, color: '#1A1A1A',
                    background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 8, padding: '8px 0',
                    cursor: connectingId === type.id ? 'not-allowed' : 'pointer',
                    opacity: connectingId === type.id ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { if (connectingId !== type.id) e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                >
                  {connectingId === type.id ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
