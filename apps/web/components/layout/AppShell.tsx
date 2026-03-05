'use client';

import { useEffect } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { useOrgInit } from '@/hooks/useOrgInit';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/lib/store/auth';
import { useConnectionsStore } from '@/lib/store/connections';
import { useBillingStore } from '@/lib/store/billing';
import { useRentalsStore } from '@/lib/store/rentals';

export function AppShell({ children }: { children: React.ReactNode }) {
  useOrgInit();
  useSocket();

  const user = useAuthStore((s) => s.user);
  const fetchConnections = useConnectionsStore((s) => s.fetch);
  const fetchBilling = useBillingStore((s) => s.fetch);
  const fetchRentals = useRentalsStore((s) => s.fetch);

  useEffect(() => {
    if (!user) return;
    fetchConnections();
    fetchBilling();
    fetchRentals();
  }, [user, fetchConnections, fetchBilling, fetchRentals]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F2F3F6', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        ::selection { background: #1A1A1A; color: white; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 3px; }
      `}</style>
      <UnifiedSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main style={{ flex: 1, padding: '36px 48px', overflow: 'auto', position: 'relative' }}>
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundSize: '28px 28px',
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.015) 1px, transparent 1px)',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
