export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-64 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded-md" />
        </div>
        <div className="skeleton h-10 w-36 rounded-[var(--radius-md)]" />
      </div>

      {/* Quick actions skeleton */}
      <div className="flex gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 glass-card-static !p-5 space-y-3">
            <div className="skeleton h-8 w-8 rounded-lg" />
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="flex gap-4">
        <div className="flex-[1.4] glass-card-static space-y-3">
          <div className="skeleton h-5 w-36 rounded-md" />
          <div className="skeleton h-px w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="skeleton h-4 flex-[1.4] rounded-md" />
              <div className="skeleton h-4 flex-[0.6] rounded-md" />
              <div className="skeleton h-4 flex-[0.6] rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex-[0.8] space-y-4">
          <div className="glass-card-static space-y-4">
            <div className="skeleton h-5 w-24 rounded-md" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="skeleton h-4 w-20 rounded-md" />
                <div className="skeleton h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
          <div className="glass-card-static space-y-3">
            <div className="skeleton h-5 w-28 rounded-md" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <div className="skeleton h-7 w-7 rounded-lg" />
                <div className="skeleton h-4 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
