'use client';

import { useEffect, useState } from 'react';
import { useConnectionsStore } from '@/lib/store/connections';
import { SkeletonGrid } from '@/components/shared/Skeleton';
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

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
};

// Descriptions for our supported connectors
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
  gmail: 'Gmail',
  slack: 'Slack',
  shopify: 'Shopify',
  hubspot: 'HubSpot',
  stripe: 'Stripe',
  notion: 'Notion',
  'google-calendar': 'Google Calendar',
  'google-sheets': 'Google Sheets',
  airtable: 'Airtable',
  webhook: 'Webhook',
};

const SUPPORTED_CONNECTORS = ['gmail', 'slack', 'shopify', 'hubspot', 'stripe', 'notion', 'google-calendar', 'google-sheets', 'airtable', 'webhook'];

export default function ConnectionsPage() {
  const { connections, loading, error, fetch: refetch, connect } = useConnectionsStore();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => { refetch(); }, [refetch]);

  // Build card list: merge Composio status with our known connectors
  const connectorCards = SUPPORTED_CONNECTORS.map((id) => {
    const composioStatus = connections.find((c) => c.connector_type === id);
    return {
      id,
      name: composioStatus?.name || CONNECTOR_NAMES[id] || id,
      description: CONNECTOR_DESCRIPTIONS[id] || '',
      connected: composioStatus?.connected ?? false,
      isNoAuth: composioStatus?.isNoAuth ?? false,
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

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 400, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em', margin: '0 0 4px' }}>
        Connections
      </h1>
      <p style={{ fontSize: 13.5, color: '#999', margin: '0 0 24px', fontFamily: 'var(--font-body)' }}>
        Connect your business tools so agents can take real actions on your behalf. One-click setup — we handle all the security.
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
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
          {connectorCards.map(({ id, name, description, connected }, i) => (
            <div
              key={id}
              style={{
                ...glassCard,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                animation: `cardIn 0.25s ease ${i * 30}ms both`,
              }}
            >
              <div className="flex items-start gap-3" style={{ flex: 1, marginBottom: 14 }}>
                <ConnectorIcon id={id} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 650, color: '#1A1A1A', lineHeight: 1.25, marginBottom: 2 }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#999' }}>{description}</div>
                </div>
              </div>

              {connected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span style={{ fontSize: 12, color: '#059669', fontWeight: 500 }}>Connected</span>
                  </div>
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
  );
}
