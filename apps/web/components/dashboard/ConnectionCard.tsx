'use client';

import {
  Mail,
  MessageSquare,
  ShoppingBag,
  CreditCard,
  FileText,
  Calendar,
  Sheet,
  Database,
  Webhook,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConnectorInfo {
  id: string;
  name: string;
  description: string;
  auth_type: 'oauth2' | 'api_key' | 'webhook';
  category: string;
  is_active: boolean;
}

export interface ConnectionInfo {
  id: string;
  connector_type_id: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  connected_at: string;
}

const CONNECTOR_ICONS: Record<string, React.ElementType> = {
  gmail: Mail,
  slack: MessageSquare,
  shopify: ShoppingBag,
  hubspot: TrendingUp,
  stripe: CreditCard,
  notion: FileText,
  'google-calendar': Calendar,
  'google-sheets': Sheet,
  airtable: Database,
  webhook: Webhook,
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  communication: { bg: 'bg-blue-50', text: 'text-blue-600' },
  ecommerce: { bg: 'bg-orange-50', text: 'text-orange-600' },
  crm: { bg: 'bg-green-50', text: 'text-green-600' },
  payments: { bg: 'bg-violet-50', text: 'text-violet-600' },
  productivity: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  data: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  custom: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-success', label: 'Connected' },
  expired: { icon: AlertCircle, color: 'text-warning', label: 'Expired' },
  revoked: { icon: XCircle, color: 'text-text-tertiary', label: 'Disconnected' },
  error: { icon: XCircle, color: 'text-error', label: 'Error' },
} as const;

interface ConnectionCardProps {
  connector: ConnectorInfo;
  connection?: ConnectionInfo;
  onConnect: (connectorId: string) => void;
  onDisconnect: (connectionId: string) => void;
  onTest: (connectionId: string) => void;
  connecting?: boolean;
}

export function ConnectionCard({
  connector,
  connection,
  onConnect,
  onDisconnect,
  onTest,
  connecting,
}: ConnectionCardProps) {
  const Icon = CONNECTOR_ICONS[connector.id] ?? Webhook;
  const colors = CATEGORY_COLORS[connector.category] ?? CATEGORY_COLORS.custom;
  const isConnected = connection && connection.status === 'active';
  const status = connection ? STATUS_CONFIG[connection.status] : null;
  const StatusIcon = status?.icon;

  return (
    <div className="glass-card-static flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn('icon-container', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.text)} strokeWidth={1.75} />
        </div>
        {status && StatusIcon && (
          <div className={cn('flex items-center gap-1', status.color)}>
            <StatusIcon className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="text-[11px] font-medium">{status.label}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <h4 className="font-heading text-base font-semibold text-text-primary">{connector.name}</h4>
      <p className="text-text-secondary text-sm mt-1 flex-1">{connector.description}</p>

      {/* Category */}
      <span className={cn(
        'inline-block px-2 py-0.5 rounded-full text-[11px] font-medium mt-3 w-fit',
        colors.bg, colors.text
      )}>
        {connector.category}
      </span>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-bg-tertiary flex gap-2">
        {isConnected ? (
          <>
            <button
              onClick={() => onTest(connection.id)}
              className="btn-secondary text-xs py-1.5 px-3 flex-1"
            >
              Test
            </button>
            <button
              onClick={() => onDisconnect(connection.id)}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-md)] text-error hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={() => onConnect(connector.id)}
            disabled={connecting || !connector.is_active}
            className={cn(
              'btn-primary text-xs py-1.5 w-full flex items-center justify-center gap-1.5',
              (connecting || !connector.is_active) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {connecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Connecting...
              </>
            ) : (
              connector.auth_type === 'oauth2' ? 'Connect with OAuth' : 'Configure'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
