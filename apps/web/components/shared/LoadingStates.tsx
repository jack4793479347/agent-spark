'use client';

import { cn } from '@/lib/utils';

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass-card-static animate-pulse', className)}>
      <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-3" />
      <div className="h-3 bg-bg-tertiary rounded w-1/2 mb-2" />
      <div className="h-3 bg-bg-tertiary rounded w-full" />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDetailHero() {
  return (
    <div className="glass-card-static animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-bg-tertiary rounded-[var(--radius-lg)]" />
        <div className="flex-1">
          <div className="h-6 bg-bg-tertiary rounded w-1/3 mb-2" />
          <div className="h-3 bg-bg-tertiary rounded w-2/3 mb-2" />
          <div className="h-3 bg-bg-tertiary rounded w-1/2" />
        </div>
      </div>
      <div className="h-10 bg-bg-tertiary rounded w-32" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-card-static animate-pulse">
      <div className="h-4 bg-bg-tertiary rounded w-1/4 mb-4" />
      <div className="h-[200px] bg-bg-tertiary rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card-static animate-pulse space-y-3">
      <div className="h-4 bg-bg-tertiary rounded w-1/4 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-3 bg-bg-tertiary rounded w-1/6" />
          <div className="h-3 bg-bg-tertiary rounded w-1/4" />
          <div className="h-3 bg-bg-tertiary rounded w-1/3" />
          <div className="h-3 bg-bg-tertiary rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Usage meter skeleton */}
      <div className="glass-card-static animate-pulse">
        <div className="h-4 bg-bg-tertiary rounded w-1/4 mb-3" />
        <div className="h-2 bg-bg-tertiary rounded w-full mb-2" />
        <div className="h-2 bg-bg-tertiary rounded w-3/4" />
      </div>
      {/* Agent cards */}
      <SkeletonGrid count={3} />
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className={cn('grid gap-4', count <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card-static animate-pulse">
          <div className="h-2.5 bg-bg-tertiary rounded w-1/2 mb-2" />
          <div className="h-6 bg-bg-tertiary rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}
