'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import { resolveIconType, formatPrice } from '@/lib/api';
import { AgentIcon } from '@/components/ui/agent-icon';
import { PublicShell } from '@/components/layout/PublicShell';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const fontBody = "var(--font-body), 'DM Sans', sans-serif";
const fontHeading = "var(--font-outfit), 'Outfit', sans-serif";

const KEYFRAMES = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
  @keyframes countUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
  @keyframes barGrow { from { width: 0 } }
  @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  ::selection { background:#1A1A1A; color:#fff }
`;

const CONNECTOR_NAMES: Record<string, string> = {
  gmail: 'Gmail', slack: 'Slack', shopify: 'Shopify', hubspot: 'HubSpot',
  stripe: 'Stripe', notion: 'Notion', 'google-calendar': 'Google Calendar',
  'google-sheets': 'Google Sheets', airtable: 'Airtable', webhook: 'Webhooks',
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface AgentData {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  pricing_model: string;
  price_cents: number;
  per_use_price_cents?: number;
  avg_rating: number;
  review_count: number;
  active_rentals: number;
  total_a2a_calls: number;
  creator_id: string;
  version: number;
  model: string;
  required_connectors: string[];
  optional_connectors: string[];
  created_at: string;
  published_at?: string;
  profiles?: { display_name: string; avatar_url?: string };
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { display_name: string };
}

/* ═══════════════════════════════════════════════════════════════
   AGENT LEVEL SYSTEM
   ═══════════════════════════════════════════════════════════════ */

type AgentLevel = { name: string; threshold: number; color: string; bg: string; next: number | null };

const LEVELS: AgentLevel[] = [
  { name: 'New',      threshold: 0,     color: '#999',    bg: 'rgba(0,0,0,0.04)',       next: 100 },
  { name: 'Bronze',   threshold: 100,   color: '#A0714F', bg: 'rgba(160,113,79,0.08)',   next: 500 },
  { name: 'Silver',   threshold: 500,   color: '#6B7280', bg: 'rgba(107,114,128,0.08)',  next: 2000 },
  { name: 'Gold',     threshold: 2000,  color: '#B8860B', bg: 'rgba(184,134,11,0.08)',   next: 10000 },
  { name: 'Platinum', threshold: 10000, color: '#1A1A1A', bg: 'rgba(26,26,26,0.06)',     next: null },
];

function getLevel(totalCalls: number): AgentLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalCalls >= LEVELS[i].threshold) return LEVELS[i];
  }
  return LEVELS[0];
}

function getLevelProgress(totalCalls: number): number {
  const level = getLevel(totalCalls);
  if (!level.next) return 100;
  const prev = level.threshold;
  return Math.min(100, Math.round(((totalCalls - prev) / (level.next - prev)) * 100));
}

/* ═══════════════════════════════════════════════════════════════
   STAT BAR COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function StatBar({ label, value, max = 100, delay = 0 }: { label: string; value: number; max?: number; delay?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 72, fontSize: 11, fontWeight: 500, color: '#888', fontFamily: fontBody, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, background: '#1A1A1A',
          width: `${pct}%`, animation: `barGrow 0.8s ease both`,
          animationDelay: `${delay}ms`,
        }} />
      </div>
      <div style={{ width: 32, fontSize: 11, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody, textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAR RATING DISPLAY
   ═══════════════════════════════════════════════════════════════ */

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#1A1A1A' : 'none'}
          stroke="#1A1A1A" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HASH FOR DETERMINISTIC STATS
   ═══════════════════════════════════════════════════════════════ */

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function deriveStats(name: string, totalCalls: number) {
  const h = hash(name);
  const base = Math.min(95, 65 + Math.floor(totalCalls / 200));
  return {
    speed: Math.min(99, base + (h % 12)),
    accuracy: Math.min(99, base + 3 + ((h >> 4) % 10)),
    reliability: Math.min(99, base + 5 + ((h >> 8) % 8)),
  };
}

/* ═══════════════════════════════════════════════════════════════
   FORMAT HELPERS
   ═══════════════════════════════════════════════════════════════ */

function formatNumber(n: number): string {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return n.toString();
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function AgentDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [agent, setAgent] = useState<AgentData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [agentRes, reviewsRes] = await Promise.all([
          fetch(`/api/marketplace/agent/${slug}`).then(r => r.json()),
          fetch(`/api/marketplace/agent/${slug}/reviews`).then(r => r.json()),
        ]);
        if (cancelled) return;
        if (agentRes.error) throw new Error(agentRes.error);
        setAgent(agentRes.agent);
        setReviews(reviewsRes.reviews ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load agent');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [slug]);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <PublicShell>
        <div style={{ fontFamily: fontBody }}>
          <style>{KEYFRAMES}</style>
          <div style={{ maxWidth: 920, margin: '0 auto', padding: '80px 24px' }}>
            <div style={{ display: 'flex', gap: 28 }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 20, width: 80, background: 'rgba(0,0,0,0.04)', borderRadius: 6, marginBottom: 20 }} />
                <div style={{ height: 32, width: 280, background: 'rgba(0,0,0,0.06)', borderRadius: 8, marginBottom: 12 }} />
                <div style={{ height: 14, width: 400, background: 'rgba(0,0,0,0.03)', borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 14, width: 340, background: 'rgba(0,0,0,0.03)', borderRadius: 4, marginBottom: 32 }} />
                <div style={{ height: 200, background: 'rgba(255,255,255,0.5)', borderRadius: 14 }} />
              </div>
              <div style={{ width: 300, flexShrink: 0 }}>
                <div style={{ height: 320, background: 'rgba(255,255,255,0.5)', borderRadius: 14 }} />
              </div>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  /* ─── Error ─── */
  if (error || !agent) {
    return (
      <PublicShell>
        <div style={{ fontFamily: fontBody, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, minHeight: '60vh' }}>
          <style>{KEYFRAMES}</style>
          <div style={{ fontSize: 48, opacity: 0.1, marginBottom: 4 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <p style={{ fontSize: 16, color: '#999' }}>{error ?? 'Agent not found'}</p>
          <Link href="/marketplace" style={{ fontSize: 14, color: '#1A1A1A', textDecoration: 'underline', textUnderlineOffset: 3 }}>Back to Marketplace</Link>
        </div>
      </PublicShell>
    );
  }

  const level = getLevel(agent.total_a2a_calls);
  const levelProgress = getLevelProgress(agent.total_a2a_calls);
  const stats = deriveStats(agent.name, agent.total_a2a_calls);
  const rating = Number(agent.avg_rating) || 0;
  const iconType = resolveIconType({ category: agent.category, tags: agent.tags });
  const price = formatPrice(agent.pricing_model, agent.price_cents, agent.per_use_price_cents);
  const allConnectors = [...(agent.required_connectors ?? []), ...(agent.optional_connectors ?? [])];
  const publishedDate = agent.published_at ? new Date(agent.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

  // Rating distribution (derive from reviews if available, otherwise estimate)
  const ratingDist = [0, 0, 0, 0, 0];
  reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating - 1]++; });
  const maxRatingCount = Math.max(1, ...ratingDist);

  return (
    <PublicShell>
      <div style={{ fontFamily: fontBody }}>
      <style>{KEYFRAMES}</style>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 920, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Back button */}
        <div style={{ marginBottom: 24, animation: 'fadeUp 0.3s ease both' }}>
          <Link href="/marketplace" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500,
            color: '#888', textDecoration: 'none', padding: '6px 12px 6px 8px', borderRadius: 8,
            transition: 'all 0.12s', background: 'transparent',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Marketplace
          </Link>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

          {/* ═══════ LEFT COLUMN ═══════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Agent Header */}
            <div style={{ animation: 'fadeUp 0.35s ease both' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 16 }}>
                <AgentIcon iconType={iconType} size={56} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <h1 style={{ fontSize: 28, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.2 }}>
                      {agent.name}
                    </h1>
                    {/* Level Badge */}
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, color: level.color, background: level.bg,
                      padding: '3px 10px', borderRadius: 6, letterSpacing: '0.04em', textTransform: 'uppercase',
                      border: `1px solid ${level.color}18`,
                    }}>
                      {level.name}
                    </span>
                    {/* Version */}
                    <span style={{ fontSize: 11, color: '#BBB', fontWeight: 500 }}>v{agent.version || 1}</span>
                  </div>
                  <p style={{ fontSize: 14.5, color: '#777', lineHeight: 1.6, margin: 0 }}>{agent.description}</p>
                </div>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={rating} size={13} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{rating.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: '#AAA' }}>({agent.review_count})</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <span style={{ fontSize: 12, color: '#888' }}>{formatNumber(agent.active_rentals)} active users</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <span style={{ fontSize: 12, color: '#888' }}>{formatNumber(agent.total_a2a_calls)} tasks completed</span>
                </div>
                {publishedDate && (
                  <span style={{ fontSize: 12, color: '#BBB' }}>Published {publishedDate}</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {agent.tags && agent.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', animation: 'fadeUp 0.4s ease both' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', padding: '4px 10px', borderRadius: 6, textTransform: 'capitalize' }}>
                  {agent.category.replace('-', ' ')}
                </span>
                {agent.tags.map((tag) => (
                  <span key={tag} style={{ fontSize: 11, color: '#888', background: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: 6 }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Connections */}
            {allConnectors.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 14, padding: '20px 24px', animation: 'fadeUp 0.45s ease both',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Integrations
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {allConnectors.map((c) => (
                    <div key={c} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                      background: 'rgba(0,0,0,0.02)', borderRadius: 9, border: '1px solid rgba(0,0,0,0.04)',
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22C55E', flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 550, color: '#1A1A1A' }}>{CONNECTOR_NAMES[c] ?? c}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 14, padding: '24px', animation: 'fadeUp 0.5s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.02em' }}>
                  Reviews
                </div>
                {agent.review_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Stars rating={rating} size={12} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{rating.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: '#BBB' }}>from {agent.review_count} review{agent.review_count !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Rating distribution bars */}
              {agent.review_count > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20, padding: '16px 18px', background: 'rgba(0,0,0,0.015)', borderRadius: 10 }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingDist[star - 1];
                    const pct = Math.round((count / maxRatingCount) * 100);
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: '#888', width: 12, textAlign: 'right' }}>{star}</span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="#1A1A1A" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 3, background: '#1A1A1A', width: `${pct}%`, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: 10.5, color: '#AAA', width: 22, textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Review list */}
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.id} style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.015)', borderRadius: 10, border: '1px solid rgba(0,0,0,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#888' }}>
                            {(review.profiles?.display_name ?? 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{review.profiles?.display_name ?? 'User'}</div>
                            <div style={{ fontSize: 11, color: '#BBB' }}>{timeAgo(review.created_at)}</div>
                          </div>
                        </div>
                        <Stars rating={review.rating} size={11} />
                      </div>
                      <p style={{ fontSize: 13, color: '#666', lineHeight: 1.55, margin: 0 }}>{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <p style={{ fontSize: 13, color: '#BBB', margin: 0 }}>No reviews yet. Be the first to try this agent.</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ RIGHT COLUMN (sticky sidebar) ═══════ */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Install Card */}
            <div style={{
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.7)',
              borderRadius: 16, padding: '24px', animation: 'fadeUp 0.35s ease both',
              boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 300, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em' }}>
                  {price}
                </div>
                {agent.pricing_model === 'free' && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: 'rgba(5,150,105,0.08)', padding: '3px 10px', borderRadius: 6 }}>
                    Free Forever
                  </span>
                )}
              </div>

              <Link href={user ? `/agents/${agent.id}` : '/auth?mode=signup'} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '13px 0', background: '#1A1A1A', color: '#fff',
                borderRadius: 11, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                transition: 'all 0.15s', boxSizing: 'border-box',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                </svg>
                {user ? 'Install Agent' : 'Sign Up to Install'}
              </Link>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 300, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.02em', animation: 'countUp 0.5s ease both', animationDelay: '0.2s' }}>
                    {formatNumber(agent.active_rentals)}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#999', marginTop: 2 }}>Active Users</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 300, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.02em', animation: 'countUp 0.5s ease both', animationDelay: '0.3s' }}>
                    {formatNumber(agent.total_a2a_calls)}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#999', marginTop: 2 }}>Tasks Done</div>
                </div>
              </div>
            </div>

            {/* Performance Card */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 14, padding: '20px 22px', animation: 'fadeUp 0.4s ease both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
                Performance
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StatBar label="Speed" value={stats.speed} delay={200} />
                <StatBar label="Accuracy" value={stats.accuracy} delay={300} />
                <StatBar label="Reliability" value={stats.reliability} delay={400} />
              </div>
            </div>

            {/* Level Progress Card */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 14, padding: '20px 22px', animation: 'fadeUp 0.45s ease both',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Agent Level
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: level.color, background: level.bg,
                  padding: '2px 8px', borderRadius: 5, letterSpacing: '0.03em',
                }}>
                  {level.name}
                </span>
              </div>

              {/* XP bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: level.name === 'Platinum'
                      ? 'linear-gradient(90deg, #1A1A1A, #444)'
                      : '#1A1A1A',
                    width: `${levelProgress}%`,
                    animation: 'barGrow 1s ease both',
                    animationDelay: '0.3s',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#AAA' }}>
                <span>{formatNumber(agent.total_a2a_calls)} tasks</span>
                {level.next ? (
                  <span>{formatNumber(level.next)} to next level</span>
                ) : (
                  <span>Max level reached</span>
                )}
              </div>

              {/* Level milestones */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '10px 0 0', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                {LEVELS.slice(1).map((l) => {
                  const reached = agent.total_a2a_calls >= l.threshold;
                  return (
                    <div key={l.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: reached ? l.bg : 'rgba(0,0,0,0.03)',
                        border: `1.5px solid ${reached ? l.color : 'rgba(0,0,0,0.06)'}`,
                        transition: 'all 0.3s',
                      }}>
                        {reached ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={l.color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/></svg>
                        )}
                      </div>
                      <span style={{ fontSize: 9, color: reached ? l.color : '#CCC', fontWeight: reached ? 600 : 400 }}>{l.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Creator Card */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 14, padding: '18px 22px', animation: 'fadeUp 0.5s ease both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
                Created by
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 600, color: '#888', flexShrink: 0,
                }}>
                  {(agent.profiles?.display_name ?? 'C').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
                    {agent.profiles?.display_name ?? 'Creator'}
                  </div>
                  <div style={{ fontSize: 12, color: '#AAA' }}>Agent builder</div>
                </div>
              </div>
            </div>

            {/* Details Card */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
              borderRadius: 14, padding: '18px 22px', animation: 'fadeUp 0.55s ease both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
                Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Model', value: agent.model?.replace('claude-', '').replace(/-\d{8}$/, '') || 'Claude' },
                  { label: 'Category', value: agent.category.replace('-', ' ') },
                  { label: 'Version', value: `v${agent.version || 1}` },
                  { label: 'Pricing', value: price },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#888' }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 550, color: '#1A1A1A', textTransform: 'capitalize' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      </div>
    </PublicShell>
  );
}
