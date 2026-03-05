'use client';

import Link from 'next/link';

interface CreditsMeterProps {
  collapsed?: boolean;
}

export function CreditsMeter({ collapsed = false }: CreditsMeterProps) {
  const creditsUsed = 3247;
  const creditsTotal = 5000;
  const creditsPct = (creditsUsed / creditsTotal) * 100;

  if (collapsed) {
    return (
      <div className="mx-auto w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.03)' }} title={`${creditsUsed} / ${creditsTotal} credits`}>
        <span style={{ fontSize: 9, fontWeight: 600, color: '#BBB' }}>{Math.round(creditsPct)}%</span>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 14,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 11,
        border: '1px solid rgba(255,255,255,0.6)',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#AAA',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
          }}
        >
          Credits
        </span>
        <span style={{ fontSize: 11, color: '#BBB', fontFamily: 'var(--font-body)' }}>
          {creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}
        </span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${creditsPct}%`,
            height: '100%',
            borderRadius: 2,
            background: creditsPct > 80 ? '#F59E0B' : '#1A1A1A',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <div style={{ fontSize: 10.5, color: '#CCC', fontFamily: 'var(--font-body)', marginTop: 6 }}>
        Resets Mar 15 &middot;{' '}
        <Link href="/pricing" className="no-underline" style={{ color: '#999', fontWeight: 550 }}>
          Buy more
        </Link>
      </div>
    </div>
  );
}
