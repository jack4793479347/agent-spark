'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningRow {
  id: string;
  source: 'rental' | 'a2a_call' | 'bonus';
  agent_id: string | null;
  gross_amount_cents: number;
  platform_fee_cents: number;
  net_amount_cents: number;
  payout_status: 'pending' | 'processing' | 'paid' | 'failed';
  created_at: string;
  agents?: { name: string; slug: string } | null;
}

const SOURCE_LABELS: Record<string, string> = {
  rental: 'Rental',
  a2a_call: 'A2A Call',
  bonus: 'Bonus',
};

const PAYOUT_STYLES: Record<string, { color: string; bg: string }> = {
  pending: { color: 'text-warning', bg: 'bg-amber-50' },
  processing: { color: 'text-blue-500', bg: 'bg-blue-50' },
  paid: { color: 'text-success', bg: 'bg-emerald-50' },
  failed: { color: 'text-error', bg: 'bg-red-50' },
};

interface EarningsTableProps {
  className?: string;
}

export function EarningsTable({ className }: EarningsTableProps) {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        const res = await fetch(`${apiUrl}/api/billing/earnings/history?page=${page}`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setEarnings(data.earnings ?? []);
          setTotalPages(data.totalPages ?? 1);
        }
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [page]);

  if (loading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  if (earnings.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-sm text-text-tertiary">No earnings yet.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Table */}
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-bg-tertiary">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-bg-tertiary bg-bg-tertiary/50">
              <th className="text-left px-3 py-2 font-semibold text-text-secondary">
                <span className="flex items-center gap-1">
                  Date
                  <ArrowUpDown className="w-3 h-3" strokeWidth={1.75} />
                </span>
              </th>
              <th className="text-left px-3 py-2 font-semibold text-text-secondary">Source</th>
              <th className="text-left px-3 py-2 font-semibold text-text-secondary">Agent</th>
              <th className="text-right px-3 py-2 font-semibold text-text-secondary">Gross</th>
              <th className="text-right px-3 py-2 font-semibold text-text-secondary">Fee (15%)</th>
              <th className="text-right px-3 py-2 font-semibold text-text-secondary">Net</th>
              <th className="text-center px-3 py-2 font-semibold text-text-secondary">Status</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((row) => {
              const payoutStyle = PAYOUT_STYLES[row.payout_status] ?? PAYOUT_STYLES.pending;

              return (
                <tr key={row.id} className="border-b border-bg-tertiary last:border-b-0">
                  <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-text-primary">
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-text-secondary">
                    {row.agents?.name ?? '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-primary font-medium">
                    ${(row.gross_amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-text-tertiary">
                    -${(row.platform_fee_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-success font-semibold">
                    ${(row.net_amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        'inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full capitalize',
                        payoutStyle.bg,
                        payoutStyle.color
                      )}
                    >
                      {row.payout_status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 text-[11px] font-medium rounded-[var(--radius-sm)] border border-bg-tertiary text-text-secondary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-[11px] text-text-tertiary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 text-[11px] font-medium rounded-[var(--radius-sm)] border border-bg-tertiary text-text-secondary hover:bg-bg-tertiary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
