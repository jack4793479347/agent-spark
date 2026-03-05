'use client';

import { useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { getEarnings, getEarningsHistory, requestPayout, type EarningsSummary, type EarningsHistoryEntry } from '@/lib/api/billing';
import { SkeletonTable, SkeletonCard } from '@/components/shared/Skeleton';

/* ═══════════════════════════════════════════════════════════════
   GLASS HELPERS
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
};

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════ */

function StatusDot({ status }: { status: 'completed' | 'pending' | 'processing' }) {
  const config = {
    completed: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    processing: { label: 'Processing', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  };
  const c = config[status] ?? config.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{ fontSize: 11, fontWeight: 500, color: c.color, background: c.bg, padding: '3px 8px', borderRadius: 5 }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {c.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Map payout_status from API to the StatusDot type */
function mapStatus(payoutStatus: string): 'completed' | 'pending' | 'processing' {
  if (payoutStatus === 'paid') return 'completed';
  if (payoutStatus === 'processing') return 'processing';
  return 'pending';
}

/** Map source to display type */
function mapType(source: string): 'rental' | 'a2a' | 'payout' {
  if (source === 'rental') return 'rental';
  if (source === 'a2a_call') return 'a2a';
  return 'payout';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '24px', background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.12)', borderRadius: 12, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#EF4444', fontFamily: 'var(--body)', margin: '0 0 12px' }}>{message}</p>
      <button onClick={onRetry} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1A1A1A', color: '#fff',
        border: 'none', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: 'var(--body)', cursor: 'pointer',
      }}>
        Retry
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '48px 24px', ...glassCard, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--body)', margin: 0 }}>{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

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

  const handleRetry = () => {
    earningsApi.refetch();
    historyApi.refetch();
  };

  // Derive summary values from API
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
      // Re-fetch earnings after payout request
      setTimeout(() => {
        earningsApi.refetch();
        historyApi.refetch();
      }, 1500);
      setTimeout(() => setPayoutRequested(false), 3000);
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Payout request failed');
      setPayoutRequested(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 className="m-0 mb-1" style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Earnings
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 14, color: '#999' }}>
        Revenue history and payout management.
      </p>

      {/* Error state */}
      {hasError && !isLoading && (
        <div style={{ marginBottom: 24 }}>
          <ErrorBanner message={errorMessage} onRetry={handleRetry} />
        </div>
      )}

      {/* ── Summary cards ── */}
      {isLoading ? (
        <div className="grid gap-3 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} height={90} />
          ))}
        </div>
      ) : !hasError ? (
        <div
          className="grid gap-3 mb-8"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))' }}
        >
          {[
            { label: 'This Month', value: `$${currentMonthNet.toFixed(2)}`, sub: 'completed', color: '#059669' },
            { label: 'Pending', value: `$${pendingPayout.toFixed(2)}`, sub: 'awaiting settlement', color: '#F59E0B' },
            { label: 'Lifetime Earnings', value: `$${lifetimeNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'all time net' },
            { label: 'Platform Fees', value: `$${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: '15% platform cut' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{ ...glassCard, padding: '18px 20px', animation: `cardIn 0.25s ease ${i * 40}ms both` }}
            >
              <div style={{ fontSize: 12, color: '#AAA', fontWeight: 500, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: stat.color ?? '#1A1A1A', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: '#CCC', marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Payout section ── */}
      {isLoading ? (
        <div style={{ marginBottom: 32 }}>
          <SkeletonCard height={100} />
        </div>
      ) : !hasError ? (
        <div
          style={{ ...glassCard, padding: '20px', marginBottom: 32, animation: 'cardIn 0.3s ease 180ms both' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: 15, fontWeight: 650, color: '#1A1A1A' }}>
                Available for Payout
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: 22, fontWeight: 700, color: '#059669' }}>
                  ${availableForPayout.toFixed(2)}
                </span>
                <span style={{ fontSize: 12, color: '#BBB' }}>to your Stripe account</span>
              </div>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={payoutRequested || availableForPayout < 10}
              className="spark-btn"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: payoutRequested || availableForPayout < 10 ? 'not-allowed' : 'pointer',
                opacity: payoutRequested || availableForPayout < 10 ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {payoutRequested ? 'Requested!' : 'Request Payout'}
            </button>
          </div>
          {payoutRequested && (
            <div
              className="flex items-center gap-2 mt-3"
              style={{
                fontSize: 13,
                color: '#059669',
                background: 'rgba(5,150,105,0.06)',
                padding: '10px 14px',
                borderRadius: 8,
                animation: 'cardIn 0.2s ease both',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Payout request submitted. Funds will transfer within 2-3 business days.
            </div>
          )}
          {payoutError && (
            <div
              className="flex items-center gap-2 mt-3"
              style={{
                fontSize: 13,
                color: '#EF4444',
                background: 'rgba(239,68,68,0.06)',
                padding: '10px 14px',
                borderRadius: 8,
                animation: 'cardIn 0.2s ease both',
              }}
            >
              {payoutError}
            </div>
          )}
          <p className="m-0 mt-3" style={{ fontSize: 11, color: '#CCC' }}>
            Minimum payout: $10.00. Platform fee (15%) has already been deducted.
          </p>
        </div>
      ) : null}

      {/* ── Earnings history ── */}
      <div style={{ animation: 'cardIn 0.3s ease 260ms both' }}>
        <h2 className="m-0 mb-3" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>
          Transaction History
        </h2>
        {isLoading ? (
          <SkeletonTable rows={6} />
        ) : hasError ? null : history.length === 0 ? (
          <EmptyState message="No transactions yet. Earnings will appear here as your agents get rented." />
        ) : (
          <div style={{ ...glassCard, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Agent</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => {
                    const displayType = mapType(entry.source);
                    const displayStatus = mapStatus(entry.payout_status);
                    const amountDollars = entry.net_amount_cents / 100;
                    const agentName = entry.agents?.name ?? (entry.source === 'bonus' ? 'Bonus' : 'Unknown Agent');

                    return (
                      <tr
                        key={entry.id}
                        style={{ borderBottom: i < history.length - 1 ? '1px solid rgba(0,0,0,0.03)' : 'none' }}
                      >
                        <td style={{ padding: '12px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                          {formatDate(entry.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#1A1A1A' }}>
                          {agentName}
                        </td>
                        <td style={{ textAlign: 'center', padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 500,
                              textTransform: 'capitalize',
                              color: displayType === 'payout' ? '#3B82F6' : displayType === 'rental' ? '#1A1A1A' : '#888',
                              background: displayType === 'payout' ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.04)',
                              padding: '3px 8px',
                              borderRadius: 5,
                            }}
                          >
                            {displayType === 'a2a' ? 'A2A Call' : displayType}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            padding: '12px 16px',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            color: '#059669',
                          }}
                        >
                          +${amountDollars.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                          <StatusDot status={displayStatus} />
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
