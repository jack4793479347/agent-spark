'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      style={{ padding: '32px 24px' }}
    >
      <div
        className="text-center w-full"
        style={{
          maxWidth: 440,
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderRadius: 20,
          padding: '48px 36px',
        }}
      >
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(239,68,68,0.08)',
            marginBottom: 20,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2
          className="m-0 mb-2"
          style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}
        >
          Something went wrong
        </h2>
        <p className="m-0 mb-6" style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
          {error.message || 'An unexpected error occurred. Please try again.'}
          {error.digest && (
            <span style={{ display: 'block', fontSize: 11, color: '#CCC', marginTop: 4 }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>

        <button
          onClick={reset}
          className="spark-btn text-[14px] rounded-[10px]"
          style={{ padding: '11px 28px', border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
