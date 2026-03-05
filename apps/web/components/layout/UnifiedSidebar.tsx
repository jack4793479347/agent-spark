'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Layers,
  Zap,
  Palette,
  Store,
  Clock,
  Settings as SettingsIcon,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogIn,
  LogOut,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/lib/supabase/auth';
import { AuthModal } from '@/components/shared/AuthModal';
import { CreditsMeter } from '@/components/shared/CreditsMeter';
import { useSidebarStore } from '@/lib/store/sidebar';
import { cn } from '@/lib/utils';

/* ── Nav items ── */
const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof LayoutGrid; badge?: string; external?: boolean }> = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/agents', label: 'My Agents', icon: Layers },
  { href: '/studio', label: 'Create Agent', icon: Zap },
  { href: '/browse', label: 'Marketplace', icon: Store },
  { href: '/creator/earnings', label: 'Earnings', icon: Palette },
  { href: '/history', label: 'Run History', icon: Clock },
];

/* ── Main component ── */
export function UnifiedSidebar() {
  const pathname = usePathname();
  const sidebarRouter = useRouter();
  const { user, loading } = useAuthContext();
  const { signOut } = useAuth();
  const {
    collapsed,
    mobileOpen,
    toggleCollapsed,
    setMobileOpen,
  } = useSidebarStore();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex flex-col h-screen transition-all duration-200',
          'lg:relative lg:translate-x-0',
          collapsed ? 'lg:w-[68px]' : 'lg:w-[220px]',
          mobileOpen ? 'translate-x-0 w-[220px]' : '-translate-x-full w-[220px]',
          'lg:translate-x-0'
        )}
        style={{
          background: 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.04)',
          padding: '14px 10px',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex items-center shrink-0 mb-1.5',
            collapsed ? 'justify-center px-0' : 'justify-between px-2'
          )}
        >
          <Link href="/" className="flex items-center gap-[7px] no-underline" style={{ padding: '4px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1A1A1A', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Zap className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <span style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', fontFamily: 'var(--logo)', letterSpacing: '-0.02em' }}>
                Agent Spark
              </span>
            )}
          </Link>

          {/* Collapse toggle — desktop */}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1 rounded-md hover:bg-black/[0.03] transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" style={{ color: '#CCC' }} strokeWidth={1.75} />
            </button>
          )}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1 rounded-md hover:bg-black/[0.03] transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft className="w-3.5 h-3.5" style={{ color: '#CCC' }} strokeWidth={1.75} />
            </button>
          )}

          {/* Close — mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-black/[0.03] transition-colors"
          >
            <X className="w-3.5 h-3.5" style={{ color: '#CCC' }} strokeWidth={1.75} />
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div style={{ padding: '0 6px', marginBottom: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 10px',
              background: 'rgba(0,0,0,0.025)',
              borderRadius: 7,
              border: '1px solid rgba(0,0,0,0.03)',
            }}>
              <Search style={{ width: 12, height: 12, color: '#CCC', flexShrink: 0 }} strokeWidth={2} />
              <span style={{ fontSize: 11.5, color: '#CCC', fontFamily: 'var(--body)' }}>Search...</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#DDD', fontFamily: 'var(--body)', background: 'rgba(0,0,0,0.03)', padding: '1px 5px', borderRadius: 3 }}>{'\u2318K'}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, padding: '0 4px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const LinkComp = item.external ? 'a' as const : Link;

            return (
              <LinkComp
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: collapsed ? '8px' : '8px 10px',
                  borderRadius: 7,
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 450,
                  color: isActive ? '#1A1A1A' : '#999',
                  background: isActive ? 'rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.12s',
                  justifyContent: collapsed ? 'center' : undefined,
                }}
              >
                <Icon
                  style={{ width: 15, height: 15, color: isActive ? '#1A1A1A' : '#CCC', flexShrink: 0 }}
                  strokeWidth={1.8}
                />
                {!collapsed && item.label}
                {!collapsed && item.badge && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#999',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 4,
                    padding: '1px 5px',
                  }}>
                    {item.badge}
                  </span>
                )}
              </LinkComp>
            );
          })}
        </div>

        {/* Bottom section */}
        <div style={{ flexShrink: 0, padding: '0 6px' }}>
          {/* Credits meter */}
          {user && <CreditsMeter collapsed={collapsed} />}

          {/* Settings */}
          <Link
            href="/settings"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: collapsed ? '8px' : '8px 14px',
              textDecoration: 'none',
              fontSize: 12.5,
              color: '#BBB',
              transition: 'color 0.12s',
              justifyContent: collapsed ? 'center' : undefined,
            }}
          >
            <SettingsIcon style={{ width: 14, height: 14, flexShrink: 0 }} strokeWidth={1.8} />
            {!collapsed && 'Settings'}
          </Link>

          {/* Login button — unauthenticated */}
          {!user && !loading && (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: collapsed ? '8px' : '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#1A1A1A',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'var(--body)',
                cursor: 'pointer',
                justifyContent: collapsed ? 'center' : undefined,
                marginTop: 4,
              }}
            >
              <LogIn style={{ width: 14, height: 14, flexShrink: 0 }} strokeWidth={2} />
              {!collapsed && 'Log in'}
            </button>
          )}

          {/* User info — authenticated */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 10px',
              borderTop: '1px solid rgba(0,0,0,0.03)',
              marginTop: 4,
              justifyContent: collapsed ? 'center' : undefined,
            }}>
              <div style={{ flex: 1, minWidth: 0, display: collapsed ? 'none' : undefined }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--body)' }}>
                  {user.user_metadata?.full_name ?? 'User'}
                </div>
                <div style={{ fontSize: 10, color: '#CCC', fontFamily: 'var(--body)' }}>Pro Plan</div>
              </div>
              {!collapsed && (
                <button
                  onClick={async () => { await signOut(); sidebarRouter.push('/'); sidebarRouter.refresh(); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 2, display: 'grid', placeItems: 'center',
                  }}
                  title="Sign out"
                >
                  <ChevronDown style={{ width: 12, height: 12, color: '#CCC' }} strokeWidth={2} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
