'use client';

const pulseStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonPulse 1.5s ease-in-out infinite',
  borderRadius: 8,
};

export function SkeletonRow({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <>
      <style>{`@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div style={{ ...pulseStyle, width, height }} />
    </>
  );
}

export function SkeletonCard({ height = 120 }: { height?: number }) {
  return (
    <>
      <style>{`@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div
        style={{
          background: 'rgba(255,255,255,0.5)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.6)',
          borderRadius: 14,
          padding: '20px',
          height,
        }}
      >
        <div style={{ ...pulseStyle, width: '60%', height: 14, marginBottom: 12 }} />
        <div style={{ ...pulseStyle, width: '40%', height: 12, marginBottom: 8 }} />
        <div style={{ ...pulseStyle, width: '80%', height: 12 }} />
      </div>
    </>
  );
}

export function SkeletonGrid({ count = 4, cardHeight = 120 }: { count?: number; cardHeight?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={cardHeight} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <>
      <style>{`@keyframes skeletonPulse { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div
        style={{
          background: 'rgba(255,255,255,0.45)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.55)',
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              padding: '14px 16px',
              borderBottom: i < rows - 1 ? '1px solid rgba(0,0,0,0.02)' : 'none',
            }}
          >
            <div style={{ ...pulseStyle, width: '30%', height: 14 }} />
            <div style={{ ...pulseStyle, width: '20%', height: 14 }} />
            <div style={{ ...pulseStyle, width: '15%', height: 14 }} />
            <div style={{ ...pulseStyle, width: '15%', height: 14 }} />
          </div>
        ))}
      </div>
    </>
  );
}
