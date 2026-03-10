'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Layers,
  Sparkles,
  Clock,
  Settings as SettingsIcon,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogIn,
  X,
  ChevronsUpDown,
  LogOut,
} from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';
import { useAuth } from '@/lib/supabase/auth';
import { AuthModal } from '@/components/shared/AuthModal';
import { CreditsMeter } from '@/components/shared/CreditsMeter';
import { useSidebarStore } from '@/lib/store/sidebar';
import { useBillingStore } from '@/lib/store/billing';
import { cn } from '@/lib/utils';

/* ── Nav ── */
const NAV_ITEMS: Array<{ href: string; label: string; icon: typeof LayoutGrid }> = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/agents', label: 'Agents', icon: Layers },
  { href: '/studio', label: 'Studio', icon: Sparkles },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

/* ── Nav link renderer ── */
function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  isActive: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: collapsed ? '8px' : '7px 10px',
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
      {!collapsed && label}
    </Link>
  );
}

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const currentPlan = useBillingStore((s) => s.plan);

  const isActive = (href: string) => {
    if (href === '/agents' && (pathname.startsWith('/browse') || pathname.startsWith('/marketplace'))) return true;
    return pathname === href || pathname.startsWith(href + '/');
  };

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
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          padding: '14px 10px',
          flexShrink: 0,
        }}
      >
        {/* Logo row */}
        <div
          className={cn(
            'flex items-center shrink-0 mb-2',
            collapsed ? 'justify-center px-0' : 'justify-between px-2'
          )}
        >
          <Link href="/" className="flex items-center gap-[7px] no-underline" style={{ padding: '4px 0' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: '#1A1A1A', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
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
              className="hidden lg:flex p-1 rounded-md hover:bg-black/[0.03] transition-colors mt-2"
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
          <div style={{ padding: '0 6px', marginBottom: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 10px',
              background: 'rgba(0,0,0,0.025)',
              borderRadius: 7,
              border: '1px solid rgba(0,0,0,0.03)',
            }}>
              <Search style={{ width: 12, height: 12, color: '#CCC', flexShrink: 0 }} strokeWidth={2} />
              <span style={{ fontSize: 11.5, color: '#CCC', fontFamily: 'var(--font-body)' }}>Search...</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#DDD', fontFamily: 'var(--font-body)', background: 'rgba(0,0,0,0.03)', padding: '1px 5px', borderRadius: 3 }}>{'\u2318K'}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '0 4px' }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom section */}
        <div style={{ flexShrink: 0, padding: '0 4px' }}>
          {/* Credits meter */}
          {user && <CreditsMeter collapsed={collapsed} />}

          {/* Login button — unauthenticated */}
          {!user && !loading && (
            <button
              onClick={() => setShowAuth(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: collapsed ? '8px' : '8px 10px',
                borderRadius: 8,
                border: 'none',
                background: '#1A1A1A',
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                justifyContent: collapsed ? 'center' : undefined,
                marginTop: 6,
              }}
            >
              <LogIn style={{ width: 14, height: 14, flexShrink: 0 }} strokeWidth={2} />
              {!collapsed && 'Log in'}
            </button>
          )}

          {/* User card — authenticated */}
          {user && (
            <div style={{ position: 'relative', marginTop: 6 }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: collapsed ? '8px' : '8px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.03)',
                  background: showUserMenu ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.015)',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  justifyContent: collapsed ? 'center' : undefined,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {!collapsed && (
                  <>
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <div style={{
                        fontSize: 12, fontWeight: 600, color: '#1A1A1A',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {user.user_metadata?.full_name ?? 'User'}
                      </div>
                      <div style={{ fontSize: 10, color: '#CCC' }}>
                        {currentPlan ? currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1) : 'Free'} Plan
                      </div>
                    </div>
                    <ChevronsUpDown style={{ width: 12, height: 12, color: '#CCC', flexShrink: 0 }} strokeWidth={1.8} />
                  </>
                )}
              </button>

              {/* User dropdown */}
              {showUserMenu && !collapsed && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, right: 0,
                  marginBottom: 4, padding: 4,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 9,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  animation: 'sidebarMenuIn .15s ease',
                }}>
                  <style>{`@keyframes sidebarMenuIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }`}</style>
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: 2 }}>
                    <div style={{ fontSize: 11, color: '#999', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                      sidebarRouter.push('/');
                      sidebarRouter.refresh();
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      width: '100%', padding: '7px 10px',
                      borderRadius: 6, border: 'none',
                      background: 'transparent', cursor: 'pointer',
                      fontSize: 12, fontWeight: 500, color: '#EF4444',
                      fontFamily: 'var(--font-body)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
          style={{ background: 'transparent' }}
        />
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
