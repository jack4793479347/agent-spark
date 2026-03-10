'use client';

import { useEffect } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { useOrgInit } from '@/hooks/useOrgInit';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/lib/store/auth';
import { useConnectionsStore } from '@/lib/store/connections';
import { useBillingStore } from '@/lib/store/billing';
import { useRentalsStore } from '@/lib/store/rentals';
import AnimatedGradientBackground from '@/components/ui/animated-gradient-background';

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
    <div style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        ::selection { background: #1A1A1A; color: white; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 3px; }
      `}</style>

      {/* Animated gradient background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <AnimatedGradientBackground
          Breathing={true}
          animationSpeed={0.01}
          breathingRange={2}
          startingGap={140}
          topOffset={-10}
          gradientColors={[
            "#FFFFFF",
            "#F4F6FF",
            "#ECEFFF",
            "#E4E8FF",
            "#EDE8FF",
            "#F3EAFF",
            "#FFFFFF",
          ]}
          gradientStops={[0, 20, 35, 50, 65, 80, 100]}
        />
      </div>

      <UnifiedSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main style={{ flex: 1, padding: '36px 48px', overflow: 'auto', position: 'relative', zIndex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
