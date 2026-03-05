interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="glass-card-static !p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-primary" style={{ background: 'rgba(0,0,0,0.04)' }}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-text-primary font-heading">
        {value}
      </div>
      {change && (
        <p className="mt-1 text-xs text-text-secondary">{change}</p>
      )}
    </div>
  );
}
