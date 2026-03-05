import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#F2F3F6' }}
    >
      {/* Aurora orbs */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '60vw',
            height: '60vw',
            maxWidth: 800,
            maxHeight: 800,
            borderRadius: '50%',
            top: '-15%',
            right: '-10%',
            background: 'radial-gradient(circle, rgba(190,210,255,0.35) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '50vw',
            height: '50vw',
            maxWidth: 600,
            maxHeight: 600,
            borderRadius: '50%',
            bottom: '-10%',
            left: '-5%',
            background: 'radial-gradient(circle, rgba(255,180,160,0.25) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div
        className="relative z-10 text-center w-full"
        style={{
          maxWidth: 440,
          padding: '48px 36px',
          background: 'rgba(255,255,255,0.58)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.65)',
          borderRadius: 20,
          margin: '0 24px',
        }}
      >
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(0,0,0,0.04)',
            marginBottom: 20,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1
          className="m-0 mb-2"
          style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}
        >
          Page not found
        </h1>
        <p className="m-0 mb-6" style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/"
          className="spark-btn inline-block text-[14px] rounded-[10px] no-underline"
          style={{ padding: '11px 28px' }}
        >
          Go Home &rarr;
        </Link>
      </div>
    </div>
  );
}
