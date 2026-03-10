'use client';

import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { getEarnings, getEarningsHistory, requestPayout, type EarningsSummary, type EarningsHistoryEntry } from '@/lib/api/billing';
import { SkeletonTable, SkeletonCard } from '@/components/shared/Skeleton';

/* ─── Helpers ─── */

function mapStatus(payoutStatus: string): 'completed' | 'pending' | 'processing' {
  if (payoutStatus === 'paid') return 'completed';
  if (payoutStatus === 'processing') return 'processing';
  return 'pending';
}

function mapType(source: string): 'rental' | 'a2a' | 'payout' {
  if (source === 'rental') return 'rental';
  if (source === 'a2a_call') return 'a2a';
  return 'payout';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  processing: { label: 'Processing', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
} as const;

/* ─── Page ─── */

export default function EarningsPage() {
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const earningsApi = useApiData({ fetchFn: async () => (await getEarnings()).earnings });
  const historyApi = useApiData({ fetchFn: async () => (await getEarningsHistory({ limit: 50 })).earnings });

  const earnings = earningsApi.data;
  const history = historyApi.data ?? [];

  const isLoading = earningsApi.loading || historyApi.loading;
  const hasError = earningsApi.error || historyApi.error;
  const errorMessage = earningsApi.error ?? historyApi.error ?? '';

  const handleRetry = () => { earningsApi.refetch(); historyApi.refetch(); };

  const currentMonthNet = earnings ? earnings.current_month_net_cents / 100 : 0;
  const pendingPayout = earnings ? earnings.pending_payout_cents / 100 : 0;
  const lifetimeNet = earnings ? earnings.total_net_cents / 100 : 0;
  const totalFees = earnings ? earnings.total_fee_cents / 100 : 0;
  const availableForPayout = lifetimeNet - pendingPayout;

  const handleRequestPayout = async () => {
    setPayoutError(null);
    setPayoutRequested(true);
    try {
      await requestPayout();
      setTimeout(() => { earningsApi.refetch(); historyApi.refetch(); }, 1500);
      setTimeout(() => setPayoutRequested(false), 3000);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Payout request failed');
      setPayoutRequested(false);
    }
  };

  const fmtUsd = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '0 24px 80px' }}>
      <style>{`
        @keyframes earningsIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: 32, marginBottom: 28, animation: 'earningsIn 0.35s ease both' }}>
        <h1 style={{
          fontSize: 24, fontWeight: 400, color: '#1A1A1A',
          fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
          margin: 0,
        }}>Earnings</h1>
        <p style={{ fontSize: 13.5, color: '#999', margin: '4px 0 0' }}>
          Revenue history and payout management
        </p>
      </div>

      {/* Error */}
      {hasError && !isLoading && (
        <div style={{
          padding: 20, marginBottom: 20,
          background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.1)',
          borderRadius: 10, textAlign: 'center',
          animation: 'earningsIn 0.3s ease both',
        }}>
          <p style={{ fontSize: 13, color: '#EF4444', margin: '0 0 10px' }}>{errorMessage}</p>
          <button onClick={handleRetry} style={{
            padding: '7px 16px', background: '#1A1A1A', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}>Retry</button>
        </div>
      )}

      {/* Summary cards */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} height={88} />)}
        </div>
      ) : !hasError ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'This Month', value: fmtUsd(currentMonthNet), sub: 'net revenue', accent: '#059669' },
            { label: 'Pending', value: fmtUsd(pendingPayout), sub: 'awaiting settlement', accent: '#F59E0B' },
            { label: 'Lifetime', value: fmtUsd(lifetimeNet), sub: 'all time net', accent: undefined },
            { label: 'Fees', value: fmtUsd(totalFees), sub: '15% platform cut', accent: undefined },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: '16px 18px',
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.03)',
              borderRadius: 11,
              animation: `earningsIn 0.35s ease ${60 + i * 40}ms both`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 550, color: '#BBB', marginBottom: 6, letterSpacing: '0.02em', textTransform: 'uppercase' as const }}>{stat.label}</div>
              <div style={{
                fontSize: 24, fontWeight: 400, color: stat.accent ?? '#1A1A1A',
                fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
              }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#CCC', marginTop: 3 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Payout section */}
      {isLoading ? (
        <div style={{ marginBottom: 28 }}><SkeletonCard height={90} /></div>
      ) : !hasError ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          padding: '18px 20px',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,0,0,.03)',
          borderRadius: 11,
          marginBottom: 28,
          animation: 'earningsIn 0.35s ease 200ms both',
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 550, color: '#888', marginBottom: 4 }}>Available for Payout</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 22, fontWeight: 400, color: '#059669',
                fontFamily: 'var(--font-outfit)', letterSpacing: '-0.03em',
              }}>{fmtUsd(availableForPayout)}</span>
              <span style={{ fontSize: 11.5, color: '#CCC' }}>to Stripe</span>
            </div>
            {payoutRequested && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                marginTop: 8, fontSize: 12, color: '#059669',
                animation: 'earningsIn 0.2s ease both',
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Payout requested. Funds transfer in 2-3 business days.
              </div>
            )}
            {payoutError && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444', animation: 'earningsIn 0.2s ease both' }}>
                {payoutError}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: '#CCC', marginTop: payoutRequested || payoutError ? 4 : 8 }}>
              Minimum payout: $10.00
            </div>
          </div>
          <button
            onClick={handleRequestPayout}
            disabled={payoutRequested || availableForPayout < 10}
            style={{
              padding: '9px 20px', borderRadius: 8,
              border: 'none', background: '#1A1A1A', color: '#fff',
              fontSize: 12.5, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: payoutRequested || availableForPayout < 10 ? 'not-allowed' : 'pointer',
              opacity: payoutRequested || availableForPayout < 10 ? 0.5 : 1,
              transition: 'opacity 0.15s',
              flexShrink: 0,
            }}
          >
            {payoutRequested ? 'Requested!' : 'Request Payout'}
          </button>
        </div>
      ) : null}

      {/* Transaction History */}
      <div style={{ animation: 'earningsIn 0.35s ease 280ms both' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 10 }}>
          Transaction History
        </div>

        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : hasError ? null : history.length === 0 ? (
          <div style={{
            padding: '44px 24px', textAlign: 'center',
            background: 'rgba(255,255,255,.3)', borderRadius: 11,
            border: '1px dashed rgba(0,0,0,.06)',
          }}>
            <p style={{ fontSize: 13, color: '#BBB', margin: 0 }}>
              No transactions yet. Earnings appear here as your agents get rented.
            </p>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,.03)',
            borderRadius: 11,
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontFamily: 'var(--font-body)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,.04)' }}>
                    {['Date', 'Agent', 'Type', 'Amount', 'Status'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 3 || i === 4 ? 'right' : i === 2 ? 'center' : 'left',
                        padding: '10px 16px', color: '#BBB', fontWeight: 500, fontSize: 11,
                        letterSpacing: '0.02em', textTransform: 'uppercase' as const,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => {
                    const displayType = mapType(entry.source);
                    const displayStatus = mapStatus(entry.payout_status);
                    const statusCfg = STATUS_CONFIG[displayStatus];
                    const amountDollars = entry.net_amount_cents / 100;
                    const agentName = entry.agents?.name ?? (entry.source === 'bonus' ? 'Bonus' : 'Unknown');

                    return (
                      <tr key={entry.id} style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(0,0,0,.025)' : 'none' }}>
                        <td style={{ padding: '11px 16px', color: '#999', whiteSpace: 'nowrap' }}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td style={{ padding: '11px 16px', fontWeight: 550, color: '#1A1A1A' }}>
                          {agentName}
                        </td>
                        <td style={{ textAlign: 'center', padding: '11px 16px' }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 550, textTransform: 'capitalize' as const,
                            color: displayType === 'payout' ? '#3B82F6' : '#888',
                            background: displayType === 'payout' ? 'rgba(59,130,246,0.06)' : 'rgba(0,0,0,.03)',
                            padding: '3px 7px', borderRadius: 4,
                          }}>
                            {displayType === 'a2a' ? 'A2A Call' : displayType}
                          </span>
                        </td>
                        <td style={{
                          textAlign: 'right', padding: '11px 16px',
                          fontWeight: 600, color: '#059669',
                          fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em',
                        }}>
                          +${amountDollars.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '11px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10.5, fontWeight: 500, color: statusCfg.color,
                            background: statusCfg.bg, padding: '3px 8px', borderRadius: 4,
                          }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: statusCfg.color }} />
                            {statusCfg.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
