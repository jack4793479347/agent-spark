'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuroraBackground } from '@/components/shared/AuroraBackground';
import { GlassNav } from '@/components/ui/glass-nav';

function SuccessContent() {
  const searchParams = useSearchParams();
  const agentsParam = searchParams.get('agents') ?? '';
  const agentSlugs = agentsParam ? agentsParam.split(',').filter(Boolean) : [];

  return (
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
      {/* Checkmark */}
      <div
        className="inline-flex items-center justify-center mb-5"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#059669',
          animation: 'cardIn 0.4s ease 100ms both',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1
        className="m-0 mb-2"
        style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}
      >
        You&rsquo;re all set!
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 15, color: '#888', lineHeight: 1.6 }}>
        Your agents have been activated and are ready to work.
      </p>

      {/* Agent list */}
      {agentSlugs.length > 0 && (
        <div
          className="mb-6 text-left"
          style={{
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 12,
            padding: '14px 18px',
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          <div style={{ fontSize: 12, color: '#AAA', fontWeight: 500, marginBottom: 8 }}>
            Agents activated
          </div>
          <div className="flex flex-col gap-2">
            {agentSlugs.map((slug) => (
              <div key={slug} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 500 }}>
                  {slug
                    .split('-')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link
        href="/dashboard"
        className="spark-btn inline-block text-[14px] rounded-[10px] no-underline"
        style={{ padding: '12px 32px' }}
      >
        Go to Dashboard &rarr;
      </Link>

      <div className="mt-4">
        <Link
          href="/marketplace"
          className="no-underline"
          style={{ fontSize: 13, color: '#999', transition: 'color 0.15s' }}
        >
          Browse more agents
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen relative">
      <AuroraBackground />

      <div className="relative z-[5]">
        <GlassNav activePage="marketplace" />

        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(100vh - 80px)', padding: '32px 24px' }}
        >
          <Suspense fallback={null}>
            <SuccessContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
