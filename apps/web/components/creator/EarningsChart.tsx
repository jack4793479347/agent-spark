'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarningRow {
  id: string;
  gross_amount_cents: number;
  net_amount_cents: number;
  created_at: string;
}

type Period = '7d' | '30d' | '90d';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

interface EarningsChartProps {
  className?: string;
}

export function EarningsChart({ className }: EarningsChartProps) {
  const [earnings, setEarnings] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
        // Fetch all earnings to chart locally (paginate if needed)
        const res = await fetch(`${apiUrl}/api/billing/earnings/history?page=1`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setEarnings(data.earnings ?? []);
        }
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const chartData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Build day buckets
    const buckets = new Map<string, { gross: number; net: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { gross: 0, net: 0 });
    }

    // Fill buckets
    for (const e of earnings) {
      const key = e.created_at.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.gross += e.gross_amount_cents / 100;
        bucket.net += e.net_amount_cents / 100;
      }
    }

    return Array.from(buckets.entries()).map(([date, vals]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      gross: Number(vals.gross.toFixed(2)),
      net: Number(vals.net.toFixed(2)),
    }));
  }, [earnings, period]);

  if (loading) {
    return (
      <div className={cn('flex justify-center py-12', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Period toggle */}
      <div className="flex items-center gap-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              'px-2.5 py-1 text-[11px] font-medium rounded-[var(--radius-sm)] transition-colors',
              period === opt.value
                ? 'bg-accent-primary text-white'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-bg-tertiary)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-tertiary)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}`}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `$${value.toFixed(2)}`,
                name === 'gross' ? 'Gross' : 'Net',
              ]}
            />
            <Area
              type="monotone"
              dataKey="gross"
              stroke="var(--color-accent-primary)"
              strokeWidth={2}
              fill="url(#grossGrad)"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke="var(--color-success)"
              strokeWidth={2}
              fill="url(#netGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-text-tertiary">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          Gross Revenue
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" />
          Net Earnings (after 15% fee)
        </span>
      </div>
    </div>
  );
}
