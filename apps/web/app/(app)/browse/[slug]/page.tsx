'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { marketplaceApi, formatPrice } from '@/lib/api';
import type { AgentDetail } from '@/lib/api/marketplace';
import { createRental } from '@/lib/api/rentals';
import { useAuthStore } from '@/lib/store/auth';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await marketplaceApi.getAgentDetail(slug);
        if (cancelled) return;
        setAgent(data.agent);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Agent not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  const user = useAuthStore((s) => s.user);
  const [installError, setInstallError] = useState<string | null>(null);

  const install = async () => {
    if (done || installing || !agent) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    setInstalling(true);
    setInstallError(null);
    try {
      const res = await createRental(agent.id);
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        setDone(true);
      }
    } catch (e) {
      setInstallError(e instanceof Error ? e.message : 'Install failed');
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, animation: 'fadeUp 0.4s ease both' }}>
        <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }`}</style>
        <div style={{ height: 16, width: 180, background: 'rgba(0,0,0,0.04)', borderRadius: 6, marginBottom: 24 }} />
        <div style={{ height: 32, width: 300, background: 'rgba(0,0,0,0.06)', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 14, width: 200, background: 'rgba(0,0,0,0.03)', borderRadius: 4, marginBottom: 32 }} />
        <div style={{ height: 120, background: 'rgba(255,255,255,0.5)', borderRadius: 14, marginBottom: 20 }} />
        <div style={{ height: 80, background: 'rgba(255,255,255,0.5)', borderRadius: 14 }} />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: '#999', fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
        <p style={{ fontSize: 18, marginBottom: 8 }}>Agent not found</p>
        <Link href="/browse" style={{ fontSize: 14, color: '#666', textDecoration: 'underline' }}>Back to Marketplace</Link>
      </div>
    );
  }

  const price = formatPrice(agent.pricing_model, agent.price_cents, agent.per_use_price_cents);
  const isFree = price === 'Free';
  const rating = Number(agent.avg_rating) || 0;

  return (
    <div style={{ maxWidth: 640, animation: 'fadeUp 0.4s ease both' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pop { from{transform:scale(0)} to{transform:scale(1)} }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 13, color: '#BBB', fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
        <Link href="/browse" style={{ color: '#999', textDecoration: 'none' }}>Marketplace</Link>
        <span>/</span>
        <span style={{ color: '#1A1A1A', fontWeight: 500 }}>{agent.name}</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#AAA', background: 'rgba(0,0,0,0.03)', borderRadius: 4, padding: '2px 8px', fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent.category}</span>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#1A1A1A', fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: '-0.03em', margin: '10px 0 6px' }}>{agent.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#999', fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
          <span style={{ fontWeight: 550, color: '#666' }}>by {agent.profiles?.display_name ?? 'Unknown'}</span>
          <span style={{ opacity: 0.3 }}>&middot;</span>
          <span>{'\u2605'} {rating.toFixed(1)}</span>
          <span style={{ opacity: 0.3 }}>&middot;</span>
          <span>{agent.review_count} reviews</span>
          <span style={{ opacity: 0.3 }}>&middot;</span>
          <span>{agent.total_rentals} rentals</span>
        </div>
      </div>

      {/* Description */}
      <div style={{
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 14, padding: 24, marginBottom: 20,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>About</h3>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
          {agent.long_description || agent.description}
        </p>
      </div>

      {/* Tags */}
      {agent.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {agent.tags.map((tag: string) => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: '#888', background: 'rgba(0,0,0,0.03)', borderRadius: 6, padding: '4px 10px', fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 0, background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 14, overflow: 'hidden', marginBottom: 20,
      }}>
        {[
          { label: 'Rating', val: `${rating.toFixed(1)} \u2605` },
          { label: 'Reviews', val: String(agent.review_count) },
          { label: 'Active Rentals', val: String(agent.total_rentals) },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '18px 0', textAlign: 'center' as const, borderRight: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#1A1A1A', fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: '-0.02em' }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#CCC', marginTop: 3, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 14, padding: '18px 24px',
      }}>
        <div style={{ flex: 1 }}>
          {isFree ? (
            <span style={{ fontSize: 20, fontWeight: 400, color: '#22C55E', fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>Free</span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 300, color: '#1A1A1A', fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: '-0.03em' }}>{price}</span>
            </div>
          )}
        </div>

        <button onClick={install} disabled={installing} style={{
          padding: '10px 28px', borderRadius: 10, border: 'none',
          background: done ? '#22C55E' : '#1A1A1A', color: '#fff',
          fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          cursor: done ? 'default' : 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
        onMouseEnter={e => { if (!done && !installing) e.currentTarget.style.background = '#333'; }}
        onMouseLeave={e => { if (!done && !installing) e.currentTarget.style.background = '#1A1A1A'; }}>
          {installing ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .5s linear infinite' }} />
            : done ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'pop .25s ease' }}><polyline points="20 6 9 17 4 12"/></svg>Installed</>
            : 'Install Agent'}
        </button>
      </div>
    </div>
  );
}
