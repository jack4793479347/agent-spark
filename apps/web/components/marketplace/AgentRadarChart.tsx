'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface AgentStats {
  speed: number;
  accuracy: number;
  reliability: number;
  popularity: number;
  versatility: number;
}

const STAT_LABELS: Record<keyof AgentStats, string> = {
  speed: 'Speed',
  accuracy: 'Accuracy',
  reliability: 'Reliability',
  popularity: 'Popularity',
  versatility: 'Versatility',
};

function statsToChartData(stats: AgentStats) {
  return Object.entries(STAT_LABELS).map(([key, label]) => ({
    stat: label,
    value: stats[key as keyof AgentStats],
    fullMark: 99,
  }));
}

interface AgentRadarChartProps {
  stats: AgentStats;
  size?: 'mini' | 'full';
  className?: string;
}

export function AgentRadarChart({ stats, size = 'mini', className }: AgentRadarChartProps) {
  const data = statsToChartData(stats);
  const isMini = size === 'mini';

  return (
    <div className={cn(
      'relative',
      isMini ? 'w-[80px] h-[80px]' : 'w-full max-w-[320px] h-[260px]',
      className
    )}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={isMini ? '70%' : '75%'}
        >
          <PolarGrid
            stroke="var(--bg-tertiary)"
            strokeWidth={isMini ? 0.5 : 1}
          />
          {!isMini && (
            <PolarAngleAxis
              dataKey="stat"
              tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            />
          )}
          <PolarRadiusAxis
            domain={[0, 99]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            stroke="var(--accent-primary)"
            fill="var(--accent-primary)"
            fillOpacity={0.2}
            strokeWidth={isMini ? 1 : 1.5}
          />
          {!isMini && (
            <Tooltip
              content={({ payload }) => {
                if (!payload?.[0]) return null;
                const { stat, value } = payload[0].payload as { stat: string; value: number };
                return (
                  <div className="glass-card-static !p-2 !rounded-lg text-xs">
                    <span className="font-medium text-text-primary">{stat}:</span>{' '}
                    <span className="text-accent-primary font-semibold">{value}</span>
                    <span className="text-text-tertiary">/99</span>
                  </div>
                );
              }}
            />
          )}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatBreakdownProps {
  stats: AgentStats;
  className?: string;
}

export function StatBreakdown({ stats, className }: StatBreakdownProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Object.entries(STAT_LABELS).map(([key, label]) => {
        const value = stats[key as keyof AgentStats];
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="text-xs text-text-secondary w-20 shrink-0">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
              <div
                className="h-full rounded-full bg-accent-primary transition-all"
                style={{ width: `${(value / 99) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-text-primary w-8 text-right">{value}</span>
          </div>
        );
      })}
    </div>
  );
}
