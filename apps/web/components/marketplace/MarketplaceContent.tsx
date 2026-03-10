'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type MarketplaceAgent,
  fetchMarketplaceAgents,
  fetchFeaturedAgents,
  apiAgentToMarketplace,
} from '@/lib/api';
import { createRental } from '@/lib/api/rentals';
import { useAuthStore } from '@/lib/store/auth';

/* ─── Category Icons ─── */
function CategoryIcon({ cat, size = 16 }: { cat: string; size?: number }) {
  const c = "#999";
  const icons: Record<string, React.ReactNode> = {
    Email: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    Sales: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    Content: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
    Ops: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
    Code: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    Support: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Analytics: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    Social: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    Finance: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    HR: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  };
  return <>{icons[cat] || icons.Ops}</>;
}

/* ─── Unique card visual per agent — seeded from slug ─── */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRand(seed: number, i = 0): number {
  const x = Math.sin(seed + i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

interface DisplayAgent {
  id: string;
  slug: string;
  name: string;
  creator: string;
  description: string;
  price: string;
  rating: string;
  rentals: number;
  category: string;
  featured: boolean;
}

function CardVisual({ agent, height = 56 }: { agent: DisplayAgent; height?: number }) {
  const seed = hashStr(agent.slug);
  const w = 280, h = height;
  const variant = seed % 6;
  const col = "#1A1A1A";

  if (variant === 0) {
    const pts = Array.from({ length: 8 }, (_, i) => ({
      x: (i / 7) * w,
      y: 10 + seededRand(seed, i) * (h - 20),
    }));
    const d = pts.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs><linearGradient id={`g-${agent.slug}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.05"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
        <path d={`${d} V${h} H0 Z`} fill={`url(#g-${agent.slug})`}/>
        <path d={d} fill="none" stroke={col} strokeWidth="1" opacity="0.12"/>
        {pts.filter((_, i) => i % 2 === 1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.8" fill="white" stroke={col} strokeWidth="0.7" opacity="0.2"/>
        ))}
      </svg>
    );
  }

  if (variant === 1) {
    const bars = Array.from({ length: 10 }, (_, i) => ({
      h: 8 + seededRand(seed, i) * (h - 16),
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {bars.map((b, i) => (
          <rect key={i} x={16 + i * 26} y={h - b.h - 4} width={18} height={b.h} rx={3} fill={col} opacity={0.03 + seededRand(seed, i + 20) * 0.05}/>
        ))}
      </svg>
    );
  }

  if (variant === 2) {
    const dots = Array.from({ length: 12 }, (_, i) => ({
      x: 16 + seededRand(seed, i) * (w - 32),
      y: 8 + seededRand(seed, i + 50) * (h - 16),
      r: 2 + seededRand(seed, i + 100) * 3.5,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={col} opacity={0.03 + seededRand(seed, i + 30) * 0.05}/>
        ))}
        {dots.slice(0, 5).map((d, i) => i > 0 && (
          <line key={`l-${i}`} x1={dots[i - 1].x} y1={dots[i - 1].y} x2={d.x} y2={d.y} stroke={col} strokeWidth="0.5" opacity="0.04"/>
        ))}
      </svg>
    );
  }

  if (variant === 3) {
    const lines = Array.from({ length: 5 }, (_, i) => ({
      w: 40 + seededRand(seed, i) * 160,
      y: 6 + i * ((h - 12) / 4),
      opacity: 0.03 + seededRand(seed, i + 10) * 0.04,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {lines.map((l, i) => (
          <rect key={i} x={20 + seededRand(seed, i + 40) * 10} y={l.y} width={l.w} height={3.5} rx={1.75} fill={col} opacity={l.opacity}/>
        ))}
      </svg>
    );
  }

  if (variant === 4) {
    const nodes = Array.from({ length: 5 }, (_, i) => ({
      x: 30 + seededRand(seed, i) * (w - 60),
      y: 10 + seededRand(seed, i + 50) * (h - 20),
    }));
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const j = (i + 1 + Math.floor(seededRand(seed, i + 80) * 2)) % nodes.length;
      edges.push([i, j]);
    }
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={col} strokeWidth="0.6" opacity="0.05"/>
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={2.5 + seededRand(seed, i + 90) * 2.5} fill="white" stroke={col} strokeWidth="0.7" opacity="0.18"/>
        ))}
      </svg>
    );
  }

  const rows = Array.from({ length: 4 }, (_, i) => ({
    x: 20 + seededRand(seed, i + 30) * 60,
    w: 50 + seededRand(seed, i) * 140,
    y: 6 + i * ((h - 12) / 3),
  }));
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      {rows.map((r, i) => (
        <g key={i}>
          <rect x={r.x} y={r.y} width={r.w} height={8} rx={2} fill={col} opacity={0.03 + i * 0.012}/>
          {seededRand(seed, i + 60) > 0.5 && (
            <rect x={r.x + r.w + 6} y={r.y} width={20 + seededRand(seed, i + 70) * 40} height={8} rx={2} fill={col} opacity={0.02 + i * 0.008}/>
          )}
        </g>
      ))}
    </svg>
  );
}

/* ─── No fallback data — marketplace shows only real agents ─── */

const CATEGORIES = ["All", "Email", "Sales", "Content", "Ops", "Code", "Support", "Analytics", "Social", "Finance", "HR"];
const SORT_OPTIONS = ["Popular", "Highest Rated", "Newest", "Price: Low\u2192High"];

function parseRentals(r: number | string): number {
  return typeof r === "number" ? r : parseInt(String(r).replace(/[^0-9]/g, "")) || 0;
}
function parsePrice(p: string): number {
  if (p === "Free") return 0;
  return parseInt(p.replace(/[^0-9]/g, "")) || 999;
}
function formatRentals(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : String(n);
}

function sortAgents(agents: DisplayAgent[], sort: string): DisplayAgent[] {
  const a = [...agents];
  switch (sort) {
    case "Popular": return a.sort((x, y) => parseRentals(y.rentals) - parseRentals(x.rentals));
    case "Highest Rated": return a.sort((x, y) => parseFloat(y.rating) - parseFloat(x.rating));
    case "Price: Low\u2192High": return a.sort((x, y) => parsePrice(x.price) - parsePrice(y.price));
    default: return a;
  }
}

function apiToDisplay(a: MarketplaceAgent, featured = false): DisplayAgent {
  return {
    id: a.id,
    slug: a.slug,
    name: a.name,
    creator: a.creator,
    description: a.desc,
    price: a.price,
    rating: String(a.rating),
    rentals: typeof a.rentals === 'string' ? (parseFloat(a.rentals) * (a.rentals.toLowerCase().includes('k') ? 1000 : 1)) : Number(a.rentals),
    category: 'Ops',
    featured,
  };
}

/* ─── Stars ─── */
function Stars({ r, size = 10 }: { r: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 0.5 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.floor(r) ? "#F59E0B" : "none"} stroke={i <= Math.ceil(r) ? "#F59E0B" : "#E5E5E5"} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ))}
    </span>
  );
}

/* ─── Agent Detail Card (overlay) ─── */
function AgentDetailCard({ agent, onClose }: { agent: DisplayAgent; onClose: () => void }) {
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  const install = async () => {
    if (done || installing) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    setInstalling(true);
    setInstallError(null);
    try {
      const res = await createRental(agent.slug);
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

  const a = agent;
  const priceNum = a.price === "Free" ? 0 : parseInt(a.price.replace(/[^0-9]/g, "")) || 0;
  const isFree = a.price === "Free";
  const ratingNum = parseFloat(a.rating) || 0;

  return (
    <div style={{
      width: 400,
      background: "rgba(255,255,255,.8)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRadius: 14,
      border: "1px solid rgba(0,0,0,.04)",
      boxShadow: "0 20px 60px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.03)",
      overflow: "hidden",
      animation: "detailIn .2s ease",
      fontFamily: "var(--font-body)",
    }}>
      {/* Visual header */}
      <div style={{ padding: "14px 14px 0", position: "relative" }}>
        <div style={{
          background: "rgba(0,0,0,.015)",
          borderRadius: 10,
          overflow: "hidden",
          padding: "8px 0",
        }}>
          <CardVisual agent={a} height={72} />
        </div>
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20,
          width: 26, height: 26, borderRadius: 7,
          border: "none", background: "rgba(255,255,255,.7)",
          backdropFilter: "blur(8px)",
          cursor: "pointer", display: "grid", placeItems: "center",
          color: "#999", transition: "all .12s", padding: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Title + meta */}
      <div style={{ padding: "14px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            fontSize: 10.5, fontWeight: 550, color: "#999",
            background: "rgba(0,0,0,.03)", borderRadius: 5, padding: "3px 8px",
          }}>
            <CategoryIcon cat={a.category} size={10} />
            {a.category}
          </span>
        </div>
        <h2 style={{
          fontSize: 19, fontWeight: 500, color: "#1A1A1A",
          fontFamily: "var(--font-outfit)", letterSpacing: "-0.03em",
          lineHeight: 1.2, margin: "0 0 6px",
        }}>{a.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#BBB", marginBottom: 12 }}>
          <span style={{ fontWeight: 550, color: "#888" }}>{a.creator}</span>
          <span style={{ opacity: .3 }}>{"\u00B7"}</span>
          <Stars r={ratingNum} />
          <span style={{ fontWeight: 600, color: "#1A1A1A", fontSize: 11.5 }}>{a.rating}</span>
          <span style={{ opacity: .3 }}>{"\u00B7"}</span>
          <span>{formatRentals(a.rentals)} installs</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: "0 18px" }}>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, margin: "0 0 14px" }}>{a.description}</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", margin: "0 18px 14px", background: "rgba(0,0,0,.015)", borderRadius: 9, overflow: "hidden" }}>
        {[
          { label: "Success Rate", val: "97%" },
          { label: "Avg Response", val: "~5s" },
          { label: "Tasks/run", val: "1" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: "10px 0", textAlign: "center" as const,
            borderRight: i < 2 ? "1px solid rgba(0,0,0,.03)" : "none",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-outfit)", letterSpacing: "-0.02em" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#CCC", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 18px 14px",
        borderTop: "1px solid rgba(0,0,0,.03)",
      }}>
        <div style={{ flex: 1 }}>
          {isFree ? (
            <span style={{ fontSize: 16, fontWeight: 500, color: "#22C55E", fontFamily: "var(--font-outfit)" }}>Free</span>
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span style={{ fontSize: 20, fontWeight: 400, color: "#1A1A1A", fontFamily: "var(--font-outfit)", letterSpacing: "-0.03em" }}>{"$" + priceNum}</span>
              <span style={{ fontSize: 11, color: "#CCC" }}>/mo</span>
            </div>
          )}
        </div>

        <Link href={`/browse/${a.slug}`} style={{
          padding: "7px 14px", borderRadius: 7,
          border: "1px solid rgba(0,0,0,.06)", background: "rgba(255,255,255,.5)",
          color: "#777", fontSize: 12, fontWeight: 550,
          fontFamily: "var(--font-body)", cursor: "pointer",
          transition: "all .12s", textDecoration: "none",
        }}>
          Details
        </Link>

        <button onClick={install} disabled={installing} style={{
          padding: "7px 18px", borderRadius: 8, border: "none",
          background: done ? "#22C55E" : "#1A1A1A", color: "#fff",
          fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-body)",
          cursor: done ? "default" : "pointer", transition: "all .2s",
          display: "flex", alignItems: "center", gap: 5,
        }}>
          {installing ? <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .5s linear infinite" }} />
            : done ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Installed</>
            : "Install"}
        </button>
      </div>
      {installError && (
        <div style={{ padding: "6px 18px 12px", fontSize: 12, color: "#EF4444" }}>{installError}</div>
      )}
    </div>
  );
}

/* ─── Featured Card (horizontal) ─── */
function FeaturedCard({ agent, onClick }: { agent: DisplayAgent; onClick: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", gap: 0, cursor: "pointer",
      minWidth: 340, maxWidth: 340, flexShrink: 0,
      borderRadius: 12, overflow: "hidden",
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(0,0,0,.03)",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.05)";
      e.currentTarget.style.borderColor = "rgba(0,0,0,.06)";
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "rgba(0,0,0,.03)";
    }}
    >
      {/* Visual side */}
      <div style={{ width: 100, flexShrink: 0, background: "rgba(0,0,0,.01)", display: "flex", alignItems: "center", borderRight: "1px solid rgba(0,0,0,.02)" }}>
        <CardVisual agent={agent} height={80} />
      </div>
      {/* Info side */}
      <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <CategoryIcon cat={agent.category} size={11} />
          <span style={{ fontSize: 10.5, color: "#BBB", fontWeight: 500 }}>{agent.category}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 620, color: "#1A1A1A", marginBottom: 3, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{agent.name}</div>
        <div style={{ fontSize: 11.5, color: "#999", marginBottom: 8, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{agent.description}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12.5, fontWeight: 620, color: agent.price === "Free" ? "#22C55E" : "#1A1A1A" }}>{agent.price}</span>
          <span style={{ fontSize: 11, color: "#CCC" }}>{"\u2605"} {agent.rating} {"\u00B7"} {formatRentals(agent.rentals)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Agent Card (grid) ─── */
function AgentCard({ agent, onClick }: { agent: DisplayAgent; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      cursor: "pointer", borderRadius: 12, overflow: "hidden",
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(0,0,0,.03)",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.05)";
      e.currentTarget.style.borderColor = "rgba(0,0,0,.06)";
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.borderColor = "rgba(0,0,0,.03)";
    }}
    >
      {/* Visual */}
      <div style={{ borderBottom: "1px solid rgba(0,0,0,.02)" }}>
        <CardVisual agent={agent} />
      </div>

      {/* Body */}
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
          <CategoryIcon cat={agent.category} size={11} />
          <span style={{ fontSize: 10.5, color: "#BBB", fontWeight: 500 }}>{agent.category}</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 620, color: "#1A1A1A", marginBottom: 2, lineHeight: 1.25 }}>{agent.name}</div>
        <div style={{ fontSize: 11.5, color: "#BBB", marginBottom: 10 }}>by {agent.creator}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 12.5, fontWeight: 620,
            color: agent.price === "Free" ? "#22C55E" : "#1A1A1A",
          }}>{agent.price}</span>
          <span style={{ fontSize: 11, color: "#CCC" }}>
            {"\u2605"} {agent.rating} {"\u00B7"} {formatRentals(agent.rentals)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Content ─── */
export function MarketplaceContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [agents, setAgents] = useState<DisplayAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<DisplayAgent | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAgents() {
      try {
        const [browseResult, featuredResult] = await Promise.allSettled([
          fetchMarketplaceAgents({ sortBy: 'popular', pageSize: 50 }),
          fetchFeaturedAgents(4),
        ]);
        if (cancelled) return;
        const loaded: DisplayAgent[] = [];
        if (featuredResult.status === 'fulfilled' && featuredResult.value.length > 0) {
          loaded.push(...featuredResult.value.map((a) => apiToDisplay(apiAgentToMarketplace(a, true), true)));
        }
        if (browseResult.status === 'fulfilled' && browseResult.value.agents.length > 0) {
          const browseAgents = browseResult.value.agents.map((a) => apiToDisplay(apiAgentToMarketplace(a)));
          for (const ba of browseAgents) {
            if (!loaded.some((l) => l.slug === ba.slug)) loaded.push(ba);
          }
        }
        setAgents(loaded);
      } catch {
        // API unavailable — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadAgents();
    return () => { cancelled = true; };
  }, []);

  // Filter + sort
  const filtered = agents.filter(a => {
    if (activeCategory !== "All" && a.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.creator.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
    }
    return true;
  });
  const sorted = sortAgents(filtered, activeSort);
  const featured = agents.filter(a => a.featured);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes detailIn { from{opacity:0;transform:translateY(6px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .mp-hide-scrollbar::-webkit-scrollbar { display: none; }
        .mp-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, maxWidth: embedded ? undefined : 1080, margin: embedded ? undefined : "0 auto", padding: embedded ? 0 : "0 24px" }}>

        {/* Header */}
        <div style={{ paddingTop: embedded ? 0 : 40, marginBottom: embedded ? 24 : 32, animation: "fadeUp 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontSize: embedded ? 24 : 32, fontWeight: 400, letterSpacing: "-0.035em",
                color: "#1A1A1A", fontFamily: "var(--font-outfit)",
                margin: 0, lineHeight: 1.2,
              }}>
                {embedded ? "Marketplace" : "Agent Marketplace"}
              </h1>
              <p style={{ fontSize: 13.5, color: "#999", margin: "4px 0 0" }}>
                Discover and install AI agents built by the community
              </p>
            </div>

            {/* Search */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 12px", height: 36, minWidth: 240,
              background: "rgba(255,255,255,.55)", backdropFilter: "blur(12px)",
              borderRadius: 8, border: "1px solid rgba(0,0,0,.04)",
              transition: "border-color .15s",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                style={{
                  flex: 1, border: "none", outline: "none",
                  fontSize: 12.5, background: "transparent", color: "#1A1A1A",
                  fontFamily: "var(--font-body)",
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  display: "grid", placeItems: "center", color: "#CCC",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category + sort bar */}
        {agents.length > 0 && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24, animation: "fadeUp 0.4s ease both", animationDelay: "0.05s", flexWrap: "wrap" }}>
          {/* Categories */}
          <div style={{ display: "flex", gap: 2, overflowX: "auto", flexShrink: 1 }} className="mp-hide-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                fontSize: 12, fontWeight: activeCategory === cat ? 600 : 450,
                color: activeCategory === cat ? "#1A1A1A" : "#AAA",
                background: activeCategory === cat ? "rgba(0,0,0,.04)" : "transparent",
                border: "none",
                borderRadius: 7, padding: "6px 11px", cursor: "pointer",
                fontFamily: "var(--font-body)", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
              }}>
                {cat !== "All" && <CategoryIcon cat={cat} size={11} />}
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt} onClick={() => setActiveSort(opt)} style={{
                fontSize: 11, fontWeight: activeSort === opt ? 600 : 450,
                color: activeSort === opt ? "#1A1A1A" : "#BBB",
                background: activeSort === opt ? "rgba(0,0,0,.04)" : "transparent",
                border: "none",
                borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                fontFamily: "var(--font-body)", transition: "all 0.15s", whiteSpace: "nowrap",
              }}>{opt}</button>
            ))}
          </div>
        </div>}

        {/* Featured row */}
        {agents.length > 0 && activeCategory === "All" && !searchQuery && featured.length > 0 && (
          <div style={{ marginBottom: 32, animation: "fadeUp 0.4s ease both", animationDelay: "0.1s" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#BBB", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>Featured</div>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }} className="mp-hide-scrollbar">
              {featured.map(agent => <FeaturedCard key={agent.slug} agent={agent} onClick={() => router.push(`/marketplace/${agent.slug}`)} />)}
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ marginBottom: 48, animation: "fadeUp 0.4s ease both", animationDelay: "0.15s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>
              {searchQuery ? "Results" : activeCategory === "All" ? "All Agents" : activeCategory}
            </span>
            <span style={{
              fontSize: 10.5, color: "#AAA",
              background: "rgba(0,0,0,.03)", borderRadius: 5,
              padding: "2px 7px", fontWeight: 500,
            }}>
              {sorted.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10 }}>
            {sorted.map(agent => <AgentCard key={agent.slug} agent={agent} onClick={() => router.push(`/marketplace/${agent.slug}`)} />)}
          </div>

          {loading && agents.length === 0 && (
            <div style={{
              textAlign: "center", padding: "64px 0", color: "#CCC",
              background: "rgba(255,255,255,.3)", borderRadius: 12,
              border: "1px dashed rgba(0,0,0,.06)",
            }}>
              <div style={{ width: 20, height: 20, border: "2px solid rgba(0,0,0,.08)", borderTopColor: "#999", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 14px" }} />
              <p style={{ fontSize: 13, color: "#BBB", margin: 0 }}>Loading agents...</p>
            </div>
          )}

          {!loading && agents.length === 0 && (
            <div style={{
              textAlign: "center", padding: "64px 0", color: "#CCC",
              background: "rgba(255,255,255,.3)", borderRadius: 12,
              border: "1px dashed rgba(0,0,0,.06)",
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,0,0,.03)", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </div>
              <p style={{ fontSize: 15, marginBottom: 4, color: "#999", fontWeight: 500 }}>No agents yet</p>
              <p style={{ fontSize: 13, color: "#BBB", margin: "0 0 16px", lineHeight: 1.5, maxWidth: 340, marginLeft: "auto", marginRight: "auto" }}>
                Be the first to publish an agent to the marketplace.
              </p>
              <Link href="/studio" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 8,
                background: "#1A1A1A", color: "#fff",
                fontSize: 12.5, fontWeight: 600,
                textDecoration: "none",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Agent
              </Link>
            </div>
          )}

          {!loading && agents.length > 0 && sorted.length === 0 && (
            <div style={{
              textAlign: "center", padding: "52px 0", color: "#CCC",
              background: "rgba(255,255,255,.3)", borderRadius: 12,
              border: "1px dashed rgba(0,0,0,.06)",
            }}>
              <p style={{ fontSize: 14, marginBottom: 6, color: "#AAA" }}>
                {searchQuery ? `No agents matching "${searchQuery}"` : "No agents in this category"}
              </p>
              <button onClick={() => { setActiveCategory("All"); setSearchQuery(""); }} style={{
                fontSize: 12, color: "#999", background: "rgba(0,0,0,.03)",
                border: "none", padding: "6px 14px", borderRadius: 7, cursor: "pointer",
              }}>Clear filters</button>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{
          maxWidth: 480, margin: embedded ? "0 0 48px" : "0 auto 48px",
          textAlign: "center",
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(0,0,0,.03)", borderRadius: 14,
          padding: "30px 28px",
          animation: "fadeUp 0.4s ease both", animationDelay: "0.2s",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 400, color: "#1A1A1A", fontFamily: "var(--font-outfit)", marginBottom: 4, margin: "0 0 4px" }}>
            Can&apos;t find what you need?
          </h3>
          <p style={{ fontSize: 13, color: "#999", marginBottom: 18, lineHeight: 1.5, margin: "0 0 18px" }}>
            Describe what you&apos;re looking for and we&apos;ll build it.
          </p>
          <Link href="/studio" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 20px", borderRadius: 8,
            background: "#1A1A1A", color: "#fff",
            fontSize: 12.5, fontWeight: 600,
            textDecoration: "none", transition: "background .15s",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Your Own
          </Link>
        </div>

      </div>

      {/* Agent Detail Overlay */}
      {selectedAgent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center" }}>
          <div onClick={() => setSelectedAgent(null)} style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,.1)", backdropFilter: "blur(3px)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <AgentDetailCard agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
          </div>
        </div>
      )}
    </>
  );
}
