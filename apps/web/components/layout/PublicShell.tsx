'use client';

import { Home } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';
import AnimatedGradientBackground from '@/components/ui/animated-gradient-background';
import { StackedCircularFooter } from '@/components/ui/stacked-circular-footer';

const PUBLIC_NAV_ITEMS = [
  { name: "Home", url: "/", icon: Home },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Animated gradient background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <AnimatedGradientBackground
          Breathing={true}
          animationSpeed={0.015}
          breathingRange={3}
          startingGap={130}
          topOffset={-20}
          gradientColors={[
            "#FFFFFF",
            "#F0F4FF",
            "#E8EEFF",
            "#DDE6FF",
            "#EDE4FF",
            "#F5E6FF",
            "#FFFFFF",
          ]}
          gradientStops={[0, 25, 40, 55, 70, 85, 100]}
        />
      </div>

      {/* Tubelight navbar */}
      <NavBar items={PUBLIC_NAV_ITEMS} />

      {/* Page content */}
      <div style={{ position: 'relative', zIndex: 1, paddingTop: 56 }}>
        {children}
        <StackedCircularFooter />
      </div>
    </div>
  );
}
