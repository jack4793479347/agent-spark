'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth';
import { useBillingStore } from '@/lib/store/billing';
import { PLATFORM_PLANS } from '@agentspark/shared';

/* ═══════════════════════════════════════════════════════════════
   GLASS HELPERS
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
  padding: '24px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: '#1A1A1A',
  background: 'rgba(255,255,255,0.5)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1.5px solid rgba(0,0,0,0.06)',
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color 0.15s',
};

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

type Tab = 'profile' | 'billing';

export default function SettingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  const { plan, usage, billingInfo, loading } = useBillingStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'billing') setTab('billing');
  }, []);

  const planKey = (plan ?? 'free') as keyof typeof PLATFORM_PLANS;
  const currentPlan = PLATFORM_PLANS[planKey] ?? PLATFORM_PLANS.free;
  const tasksUsed = currentPlan.monthly_tasks - (usage?.remaining_tasks ?? currentPlan.monthly_tasks);
  const creditPercent = Math.min((tasksUsed / currentPlan.monthly_tasks) * 100, 100);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 className="m-0 mb-1" style={{ fontSize: 24, fontWeight: 700, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Settings
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 14, color: '#999' }}>
        Account, billing, and preferences.
      </p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        {(['profile', 'billing'] as Tab[]).map((t) => (
          <button
            key={t} onClick={() => setTab(t)} className="capitalize"
            style={{
              fontSize: 13.5, fontWeight: tab === t ? 600 : 450, color: tab === t ? '#1A1A1A' : '#BBB',
              background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #1A1A1A' : '2px solid transparent',
              padding: '10px 16px', marginBottom: -1, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-5" style={{ animation: 'cardIn 0.25s ease both' }}>
          <div style={glassCard}>
            <h2 className="m-0 mb-4" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Profile</h2>
            <div className="mb-5">
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>
                {user?.user_metadata?.full_name ?? 'Your Name'}
              </div>
              <div style={{ fontSize: 13, color: '#999' }}>
                {user?.email ?? 'you@example.com'}
              </div>
            </div>
            <div className="flex flex-col gap-3.5">
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Display Name</label>
                <input type="text" defaultValue={user?.user_metadata?.full_name ?? ''} placeholder="Your name" style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>Email</label>
                <input type="email" defaultValue={user?.email ?? ''} disabled style={{ ...inputStyle, background: 'rgba(0,0,0,0.02)', color: '#BBB', cursor: 'not-allowed' }} />
                <span style={{ fontSize: 11, color: '#CCC', marginTop: 4, display: 'block' }}>Managed by authentication provider.</span>
              </div>
            </div>
          </div>

          <div style={glassCard}>
            <h2 className="m-0 mb-2" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Security</h2>
            <p className="m-0" style={{ fontSize: 13.5, color: '#999', lineHeight: 1.6 }}>
              Authentication is managed through Supabase. Use the sign-in flow to update credentials.
            </p>
          </div>

          <div style={glassCard}>
            <h2 className="m-0 mb-2" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>API Keys</h2>
            <p className="m-0 mb-4" style={{ fontSize: 13.5, color: '#999', lineHeight: 1.6 }}>
              Use API keys to authenticate programmatic access to your agents.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '12px 16px', fontSize: 13, fontFamily: 'monospace', color: '#BBB', letterSpacing: '0.02em' }}>
              sk-••••••••••••••••••••••••••••••4f2a
            </div>
          </div>
        </div>
      )}

      {/* Billing tab */}
      {tab === 'billing' && (
        <div className="flex flex-col gap-5" style={{ animation: 'cardIn 0.25s ease both' }}>
          {/* Current plan */}
          <div style={glassCard}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="m-0" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Current Plan</h2>
              <button className="spark-btn" style={{ fontSize: 12.5, fontWeight: 600, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                {planKey === 'business' ? 'Manage' : 'Upgrade'}
              </button>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', background: 'rgba(0,0,0,0.05)', padding: '3px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {loading ? '...' : currentPlan.name}
              </span>
              <span style={{ fontSize: 14, color: '#888' }}>
                {currentPlan.price_cents === 0 ? '$0/mo' : `$${currentPlan.price_cents / 100}/mo`}
              </span>
            </div>
          </div>

          {/* Usage */}
          <div style={glassCard}>
            <h2 className="m-0 mb-4" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Usage This Period</h2>
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: 13, color: '#888' }}>Tasks</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                    {loading ? '...' : `${tasksUsed.toLocaleString()} / ${currentPlan.monthly_tasks.toLocaleString()}`}
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.04)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${creditPercent}%`, height: '100%',
                    background: creditPercent >= 90 ? '#EF4444' : creditPercent >= 70 ? '#F59E0B' : '#1A1A1A',
                    borderRadius: 4, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize: 13, color: '#888' }}>A2A Calls</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>
                    {loading ? '...' : `${usage?.remaining_a2a_calls ?? 0} remaining`}
                  </span>
                </div>
              </div>
            </div>
            <p className="m-0 mt-3" style={{ fontSize: 11, color: '#CCC' }}>
              Usage resets monthly. Need more? Upgrade your plan anytime.
            </p>
          </div>

          {/* Plan comparison */}
          <div style={glassCard}>
            <h2 className="m-0 mb-4" style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>Plan Comparison</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px 8px 0', color: '#BBB', fontWeight: 500, fontSize: 12 }}>Feature</th>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <th key={key} style={{ textAlign: 'center', padding: '8px 8px', color: key === planKey ? '#1A1A1A' : '#BBB', fontWeight: key === planKey ? 700 : 500, fontSize: 12 }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#888' }}>Tasks/month</td>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <td key={key} style={{ textAlign: 'center', padding: '8px', color: '#1A1A1A', fontWeight: key === planKey ? 600 : 400 }}>
                        {p.monthly_tasks.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#888' }}>A2A Calls/month</td>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <td key={key} style={{ textAlign: 'center', padding: '8px', color: '#1A1A1A', fontWeight: key === planKey ? 600 : 400 }}>
                        {p.monthly_a2a_calls.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: '#888' }}>Price</td>
                    {Object.entries(PLATFORM_PLANS).map(([key, p]) => (
                      <td key={key} style={{ textAlign: 'center', padding: '8px', color: p.price_cents === 0 ? '#059669' : '#1A1A1A', fontWeight: key === planKey ? 600 : 400 }}>
                        {p.price_cents === 0 ? 'Free' : `$${p.price_cents / 100}/mo`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
