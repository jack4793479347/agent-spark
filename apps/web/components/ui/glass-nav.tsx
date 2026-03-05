'use client';

import Link from 'next/link';
import Image from 'next/image';

interface GlassNavProps {
  activePage: 'home' | 'marketplace';
}

export function GlassNav({ activePage }: GlassNavProps) {
  return (
    <nav
      className="glass-nav"
      role="navigation"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 28px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        aria-label="Agent Spark home"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
        }}
      >
        <Image
          src="/logo.svg"
          alt="Agentspark"
          width={150}
          height={49}
          style={{ height: 48, width: 'auto', flexShrink: 0 }}
          priority
        />
      </Link>

      {/* Right nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {activePage === 'home' && (
          <>
            <Link
              href="/marketplace"
              aria-label="Browse Marketplace"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: '#555',
                background: 'rgba(255,255,255,0.45)',
                border: '1px solid rgba(255,255,255,0.6)',
                padding: '9px 18px',
                borderRadius: 9,
                cursor: 'pointer',
                transition: 'all 0.15s',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {/* Icon always visible */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="sm:hidden"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {/* Text hidden on mobile */}
              <span className="hidden sm:inline">Browse Marketplace</span>
              {/* Mobile-only short text */}
              <span className="sm:hidden">Browse</span>
            </Link>
          </>
        )}
        {activePage === 'marketplace' && (
          <Link
            href="/"
            aria-label="Go to home page"
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: '#555',
              background: 'rgba(255,255,255,0.45)',
              border: '1px solid rgba(255,255,255,0.6)',
              padding: '8px 16px',
              borderRadius: 9,
              cursor: 'pointer',
              transition: 'all 0.15s',
              textDecoration: 'none',
            }}
          >
            &larr; Home
          </Link>
        )}
        <Link
          href="/dashboard"
          aria-label="Go to dashboard"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#FFF',
            background: '#1A1A1A',
            border: 'none',
            padding: '9px 20px',
            borderRadius: 9,
            cursor: 'pointer',
            transition: 'all 0.15s',
            textDecoration: 'none',
          }}
        >
          <span className="hidden sm:inline">Dashboard</span>
          <span className="sm:hidden" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </span>
        </Link>
      </div>
    </nav>
  );
}
