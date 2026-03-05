import { cn } from '@/lib/utils';

type Status = 'active' | 'draft' | 'published' | 'paused' | 'error' | 'pending' | 'completed' | 'processing' | 'review';

const STATUS_STYLES: Record<Status, string> = {
  active: 'bg-emerald-500/10 text-emerald-600',
  published: 'bg-black/[0.06] text-text-primary',
  draft: 'bg-bg-tertiary text-text-secondary',
  paused: 'bg-amber-500/10 text-amber-600',
  error: 'bg-red-500/10 text-red-600',
  pending: 'bg-amber-500/10 text-amber-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  processing: 'bg-blue-500/10 text-blue-600',
  review: 'bg-amber-500/10 text-amber-600',
};

const STATUS_LABELS: Partial<Record<Status, string>> = {
  review: 'Under Review',
};

interface StatusBadgeProps {
  status: Status;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize',
        STATUS_STYLES[status] ?? STATUS_STYLES.draft,
        className
      )}
    >
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}
