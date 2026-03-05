'use client';

import Link from 'next/link';
import { AuroraBackground } from '@/components/shared/AuroraBackground';
import { GlassNav } from '@/components/ui/glass-nav';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen relative">
      <AuroraBackground />

      <div className="relative z-[5]">
        <GlassNav activePage="marketplace" />

        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 80px)', padding: '32px 24px' }}
        >
          <div
            className="text-center w-full"
            style={{
              maxWidth: 480,
              background: 'rgba(255,255,255,0.58)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.65)',
              borderRadius: 20,
              padding: '48px 36px',
              animation: 'cardIn 0.35s ease both',
            }}
          >
            {/* X icon */}
            <div
              className="inline-flex items-center justify-center mb-5"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: '#F3F3F3',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h1
              className="m-0 mb-2"
              style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}
            >
              Checkout cancelled
            </h1>
            <p className="m-0 mb-8" style={{ fontSize: 15, color: '#888', lineHeight: 1.6 }}>
              No worries, you weren&rsquo;t charged. You can try again anytime.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/marketplace"
                className="no-underline inline-block"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#555',
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.7)',
                  padding: '11px 24px',
                  borderRadius: 10,
                  transition: 'all 0.15s',
                }}
              >
                &larr; Back to Marketplace
              </Link>
              <Link
                href="/"
                className="spark-btn inline-block text-[14px] rounded-[10px] no-underline text-center"
                style={{ padding: '11px 24px' }}
              >
                Try Again &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
