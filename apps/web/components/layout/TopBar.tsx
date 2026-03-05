'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Menu, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { SearchBar } from '@/components/marketplace/SearchBar';
import { CommandBar } from '@/components/marketplace/CommandBar';
import { useSidebarStore } from '@/lib/store/sidebar';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  agents: 'My Agents',
  workflows: 'Assembler',
  studio: 'Agent Studio',
  connections: 'Connections',
  settings: 'Settings',
  creator: 'Creator Studio',
  publish: 'Publish New',
  analytics: 'Analytics',
  earnings: 'Earnings',
};

export function TopBar() {
  const { user } = useAuthContext();
  const { setMobileOpen } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();

  // Build breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const showBack = segments.length > 1;
  const breadcrumbs = segments.map((seg) => ROUTE_LABELS[seg] ?? seg);

  return (
    <header className="sticky top-0 z-30 h-14 bg-bg-primary/60 backdrop-blur-xl border-b border-bg-tertiary/50 px-4 lg:px-8 flex items-center gap-3">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
      >
        <Menu className="w-5 h-5 text-text-secondary" strokeWidth={1.75} />
      </button>

      {/* Back + breadcrumb */}
      {showBack && (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mr-1"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      {breadcrumbs.length > 0 && (
        <nav className="hidden sm:flex items-center gap-1 text-sm text-text-tertiary">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="mx-1">/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-text-primary font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search + Command */}
      <SearchBar />
      <CommandBar className="hidden md:flex w-56 shrink-0" />

      {/* User avatar */}
      {user && (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: '#1A1A1A' }}
        >
          {user.user_metadata?.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
    </header>
  );
}
