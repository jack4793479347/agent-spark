'use client';

import { ConnectionCard, type ConnectorInfo, type ConnectionInfo } from './ConnectionCard';
import { SkeletonGrid } from '@/components/shared/LoadingStates';
import { cn } from '@/lib/utils';

interface ConnectionGridProps {
  connectors: ConnectorInfo[];
  connections: ConnectionInfo[];
  onConnect: (connectorId: string) => void;
  onDisconnect: (connectionId: string) => void;
  onTest: (connectionId: string) => void;
  connectingId?: string;
  loading?: boolean;
  className?: string;
}

export function ConnectionGrid({
  connectors,
  connections,
  onConnect,
  onDisconnect,
  onTest,
  connectingId,
  loading,
  className,
}: ConnectionGridProps) {
  if (loading) {
    return <SkeletonGrid count={6} />;
  }

  // Sort: connected first, then alphabetical
  const sorted = [...connectors].sort((a, b) => {
    const aConnected = connections.some((c) => c.connector_type_id === a.id && c.status === 'active');
    const bConnected = connections.some((c) => c.connector_type_id === b.id && c.status === 'active');
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5', className)}>
      {sorted.map((connector) => {
        const connection = connections.find(
          (c) => c.connector_type_id === connector.id && c.status !== 'revoked'
        );
        return (
          <ConnectionCard
            key={connector.id}
            connector={connector}
            connection={connection}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onTest={onTest}
            connecting={connectingId === connector.id}
          />
        );
      })}
    </div>
  );
}
