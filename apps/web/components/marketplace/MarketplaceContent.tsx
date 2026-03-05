'use client';

import { useState, useEffect } from 'react';
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

function CardVisual({ agent }: { agent: DisplayAgent }) {
  const seed = hashStr(agent.slug);
  const w = 280, h = 64;
  const variant = seed % 6;
  const col = "#1A1A1A";

  if (variant === 0) {
    const pts = Array.from({ length: 8 }, (_, i) => ({
      x: (i / 7) * w,
      y: 14 + seededRand(seed, i) * 36,
    }));
    const d = pts.map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }).join(" ");
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        <defs><linearGradient id={`g-${agent.slug}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.06"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
        <path d={`${d} V${h} H0 Z`} fill={`url(#g-${agent.slug})`}/>
        <path d={d} fill="none" stroke={col} strokeWidth="1.2" opacity="0.15"/>
        {pts.filter((_, i) => i % 2 === 1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill="white" stroke={col} strokeWidth="0.8" opacity="0.25"/>
        ))}
      </svg>
    );
  }

  if (variant === 1) {
    const bars = Array.from({ length: 10 }, (_, i) => ({
      h: 10 + seededRand(seed, i) * 38,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {bars.map((b, i) => (
          <rect key={i} x={16 + i * 26} y={h - b.h - 4} width={18} height={b.h} rx={3} fill={col} opacity={0.03 + seededRand(seed, i + 20) * 0.06}/>
        ))}
      </svg>
    );
  }

  if (variant === 2) {
    const dots = Array.from({ length: 14 }, (_, i) => ({
      x: 16 + seededRand(seed, i) * (w - 32),
      y: 8 + seededRand(seed, i + 50) * (h - 16),
      r: 2 + seededRand(seed, i + 100) * 4,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={col} opacity={0.03 + seededRand(seed, i + 30) * 0.06}/>
        ))}
        {dots.slice(0, 6).map((d, i) => i > 0 && (
          <line key={`l-${i}`} x1={dots[i - 1].x} y1={dots[i - 1].y} x2={d.x} y2={d.y} stroke={col} strokeWidth="0.6" opacity="0.05"/>
        ))}
      </svg>
    );
  }

  if (variant === 3) {
    const lines = Array.from({ length: 6 }, (_, i) => ({
      w: 40 + seededRand(seed, i) * 160,
      y: 8 + i * 9,
      opacity: 0.03 + seededRand(seed, i + 10) * 0.05,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {lines.map((l, i) => (
          <rect key={i} x={20 + seededRand(seed, i + 40) * 10} y={l.y} width={l.w} height={4} rx={2} fill={col} opacity={l.opacity}/>
        ))}
      </svg>
    );
  }

  if (variant === 4) {
    const nodes = Array.from({ length: 6 }, (_, i) => ({
      x: 30 + seededRand(seed, i) * (w - 60),
      y: 12 + seededRand(seed, i + 50) * (h - 24),
    }));
    const edges: [number, number][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const j = (i + 1 + Math.floor(seededRand(seed, i + 80) * 2)) % nodes.length;
      edges.push([i, j]);
    }
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={col} strokeWidth="0.7" opacity="0.06"/>
        ))}
        {nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={3 + seededRand(seed, i + 90) * 3} fill="white" stroke={col} strokeWidth="0.8" opacity="0.2"/>
        ))}
      </svg>
    );
  }

  if (variant === 5) {
    const rows = Array.from({ length: 4 }, (_, i) => ({
      x: 20 + seededRand(seed, i + 30) * 60,
      w: 50 + seededRand(seed, i) * 140,
      y: 8 + i * 14,
    }));
    return (
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {rows.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={9} rx={2.5} fill={col} opacity={0.03 + i * 0.015}/>
            {seededRand(seed, i + 60) > 0.5 && (
              <rect x={r.x + r.w + 6} y={r.y} width={20 + seededRand(seed, i + 70) * 40} height={9} rx={2.5} fill={col} opacity={0.02 + i * 0.01}/>
            )}
          </g>
        ))}
      </svg>
    );
  }

  return null;
}

/* ─── Fallback Data ─── */
const FALLBACK_AGENTS: DisplayAgent[] = [
  { id: "aa000001-0000-0000-0000-000000000001", slug: "smart-email-responder", name: "Smart Email Responder", creator: "Alice Chen", description: "Reads incoming emails, classifies intent, drafts contextual responses. Handles follow-ups and routes urgent items.", price: "$29/mo", rating: "4.8", rentals: 2400, category: "Email", featured: true },
  { id: "aa000003-0000-0000-0000-000000000003", slug: "lead-qualifier-pro", name: "Lead Qualifier Pro", creator: "Carol Park", description: "Scores inbound leads from forms and email. Enriches contacts, updates CRM, flags hot prospects.", price: "$49/mo", rating: "4.9", rentals: 980, category: "Sales", featured: true },
  { id: "aa000007-0000-0000-0000-000000000007", slug: "seo-writer", name: "SEO Content Writer", creator: "Alice Chen", description: "Researches keywords, writes optimized blog posts with proper structure, drafts meta descriptions.", price: "$29/mo", rating: "4.6", rentals: 1800, category: "Content", featured: true },
  { id: "aa000008-0000-0000-0000-000000000008", slug: "order-tracker", name: "Order Tracker", creator: "Carol Park", description: "Monitors orders in real-time, sends proactive shipping updates, handles delivery exceptions.", price: "$19/mo", rating: "4.9", rentals: 3200, category: "Ops", featured: true },
  { id: "aa000009-0000-0000-0000-000000000009", slug: "bug-triage", name: "Bug Triage Bot", creator: "Alice Chen", description: "Monitors error logs, deduplicates issues, assigns severity, creates tickets in Linear or Jira.", price: "Free", rating: "4.7", rentals: 5100, category: "Code", featured: false },
  { id: "aa000010-0000-0000-0000-000000000010", slug: "slack-standup", name: "Slack Standup Bot", creator: "Carol Park", description: "Collects async standups from your team, posts a clean daily digest to any channel.", price: "Free", rating: "4.5", rentals: 4200, category: "Ops", featured: false },
  { id: "aa000004-0000-0000-0000-000000000004", slug: "social-content-creator", name: "Social Content Creator", creator: "Carol Park", description: "Generates branded posts, schedules across platforms, optimizes posting times for engagement.", price: "$39/mo", rating: "4.5", rentals: 1500, category: "Social", featured: false },
  { id: "aa000005-0000-0000-0000-000000000005", slug: "invoice-reconciler", name: "Invoice Reconciler", creator: "Carol Park", description: "Extracts data from invoices, matches to POs, routes for approval, syncs with accounting software.", price: "$19/mo", rating: "4.7", rentals: 890, category: "Finance", featured: false },
  { id: "aa000011-0000-0000-0000-000000000011", slug: "resume-screener", name: "Resume Screener", creator: "Alice Chen", description: "Parses resumes, scores candidates against job requirements, generates shortlists with explanations.", price: "$39/mo", rating: "4.3", rentals: 720, category: "HR", featured: false },
  { id: "aa000012-0000-0000-0000-000000000012", slug: "customer-support", name: "Support Responder", creator: "Carol Park", description: "Handles tier-1 support tickets, suggests solutions from knowledge base, escalates complex issues.", price: "$29/mo", rating: "4.8", rentals: 2900, category: "Support", featured: false },
  { id: "aa000013-0000-0000-0000-000000000013", slug: "data-analyst", name: "Data Insights Agent", creator: "Alice Chen", description: "Connects to your data sources, runs automated analysis, generates weekly insight reports.", price: "$49/mo", rating: "4.5", rentals: 650, category: "Analytics", featured: false },
  { id: "aa000006-0000-0000-0000-000000000006", slug: "meeting-summarizer", name: "Meeting Summarizer", creator: "Alice Chen", description: "Joins video calls, transcribes discussion, extracts action items, distributes notes to attendees.", price: "$19/mo", rating: "4.7", rentals: 3800, category: "Ops", featured: false },
  { id: "aa000014-0000-0000-0000-000000000014", slug: "competitor-monitor", name: "Competitor Monitor", creator: "Carol Park", description: "Tracks competitor websites, pricing changes, product launches, and social media activity.", price: "$39/mo", rating: "4.4", rentals: 510, category: "Analytics", featured: false },
  { id: "aa000015-0000-0000-0000-000000000015", slug: "contract-reviewer", name: "Contract Reviewer", creator: "Alice Chen", description: "Scans contracts for risk clauses, missing terms, and compliance issues. Flags items for review.", price: "$59/mo", rating: "4.6", rentals: 340, category: "Finance", featured: false },
  { id: "aa000016-0000-0000-0000-000000000016", slug: "ad-copywriter", name: "Ad Copy Generator", creator: "Carol Park", description: "Creates ad variations for Google, Meta, and LinkedIn. A/B tests headlines and CTAs.", price: "$29/mo", rating: "4.3", rentals: 1100, category: "Content", featured: false },
  { id: "aa000017-0000-0000-0000-000000000017", slug: "inventory-manager", name: "Inventory Optimizer", creator: "Alice Chen", description: "Monitors stock levels, predicts demand, generates reorder alerts, prevents stockouts.", price: "$39/mo", rating: "4.5", rentals: 780, category: "Ops", featured: false },
  { id: "aa000018-0000-0000-0000-000000000018", slug: "onboarding-agent", name: "Employee Onboarder", creator: "Carol Park", description: "Guides new hires through onboarding steps, sends reminders, collects documents, schedules intros.", price: "$19/mo", rating: "4.4", rentals: 620, category: "HR", featured: false },
  { id: "aa000019-0000-0000-0000-000000000019", slug: "churn-predictor", name: "Churn Predictor", creator: "Alice Chen", description: "Analyzes usage patterns and engagement signals to identify at-risk customers before they leave.", price: "$49/mo", rating: "4.6", rentals: 430, category: "Analytics", featured: false },
  { id: "aa000020-0000-0000-0000-000000000020", slug: "pr-monitor", name: "PR & Mentions Monitor", creator: "Carol Park", description: "Scans news, blogs, and social for brand mentions. Alerts on negative sentiment, tracks coverage.", price: "$29/mo", rating: "4.3", rentals: 890, category: "Social", featured: false },
  { id: "aa000021-0000-0000-0000-000000000021", slug: "code-reviewer", name: "Code Review Agent", creator: "Alice Chen", description: "Reviews PRs for bugs, security issues, and style violations. Suggests improvements inline.", price: "Free", rating: "4.8", rentals: 6200, category: "Code", featured: false },
];

const CATEGORIES = ["All", "Email", "Sales", "Content", "Ops", "Code", "Support", "Analytics", "Social", "Finance", "HR"];
const SORT_OPTIONS = ["Popular", "Highest Rated", "Newest", "Price: Low→High"];

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
    case "Price: Low→High": return a.sort((x, y) => parsePrice(x.price) - parsePrice(y.price));
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
function Stars({ r, size = 11 }: { r: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.floor(r) ? "#F59E0B" : "none"} stroke={i <= Math.ceil(r) ? "#F59E0B" : "#DDD"} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ))}
    </span>
  );
}

/* ─── Agent Detail Card (overlay) ─── */
function AgentDetailCard({ agent, onClose }: { agent: DisplayAgent; onClose: () => void }) {
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const [showHow, setShowHow] = useState(false);
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
    <div style={{ width: 420, background: "rgba(255,255,255,.75)", backdropFilter: "blur(24px)", borderRadius: 16, border: "1px solid rgba(255,255,255,.6)", boxShadow: "0 24px 80px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04)", overflow: "hidden", animation: "cardIn .25s ease", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#AAA", background: "rgba(0,0,0,.03)", borderRadius: 4, padding: "2px 7px" }}>{a.category}</span>
        </div>
        <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(0,0,0,.03)", cursor: "pointer", display: "grid", placeItems: "center", color: "#CCC", transition: "all .12s", padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.06)"; e.currentTarget.style.color = "#999"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.03)"; e.currentTarget.style.color = "#CCC"; }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Title + meta */}
      <div style={{ padding: "10px 18px 0" }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 4, lineHeight: 1.2, margin: "0 0 4px" }}>{a.name}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#BBB", marginBottom: 10 }}>
          <span style={{ fontWeight: 550, color: "#888" }}>{a.creator}</span>
          <span style={{ opacity: .3 }}>{"\u00B7"}</span>
          <Stars r={ratingNum} />
          <span style={{ fontWeight: 600, color: "#1A1A1A", fontSize: 12 }}>{a.rating}</span>
          <span style={{ opacity: .3 }}>{"\u00B7"}</span>
          <span>{formatRentals(a.rentals) + " rentals"}</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: "0 18px" }}>
        <p style={{ fontSize: 13, color: "#888", lineHeight: 1.55, marginBottom: 12, margin: "0 0 12px" }}>{a.description}</p>
      </div>

      {/* How it works (expandable) */}
      <div style={{ padding: "0 18px", marginBottom: 12 }}>
        <button onClick={() => setShowHow(!showHow)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: showHow ? "#1A1A1A" : "#BBB", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "color .12s" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform .15s", transform: showHow ? "rotate(90deg)" : "" }}><polyline points="9 18 15 12 9 6"/></svg>
          How it works
        </button>
        {showHow && (
          <p style={{ fontSize: 12.5, color: "#999", lineHeight: 1.55, marginTop: 8, paddingLeft: 15, borderLeft: "2px solid rgba(0,0,0,.04)", animation: "fadeUp .2s ease", margin: "8px 0 0" }}>{a.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 0, padding: "0 18px", marginBottom: 14 }}>
        {[
          { label: "Success Rate", val: "97%" },
          { label: "Avg Response", val: "~5s" },
          { label: "Credits/run", val: "10\u201320" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: "8px 0", textAlign: "center" as const, borderRight: i < 2 ? "1px solid rgba(0,0,0,.03)" : "none" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em" }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "#CCC", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,.04)", background: "rgba(0,0,0,.01)" }}>
        <div style={{ flex: 1 }}>
          {isFree ? (
            <span style={{ fontSize: 18, fontWeight: 400, color: "#22C55E", fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>Free</span>
          ) : (
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 22, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>{"$" + priceNum}</span>
              <span style={{ fontSize: 11, color: "#CCC" }}>/mo</span>
            </div>
          )}
        </div>

        <Link href={`/browse/${a.slug}`} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid rgba(0,0,0,.06)", background: "rgba(255,255,255,.5)", color: "#777", fontSize: 12, fontWeight: 550, fontFamily: "var(--font-body), 'DM Sans', sans-serif", cursor: "pointer", transition: "all .12s", textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.8)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.5)"}>
          Details
        </Link>

        <button onClick={install} disabled={installing} style={{
          padding: "8px 20px", borderRadius: 8, border: "none",
          background: done ? "#22C55E" : "#1A1A1A", color: "#fff",
          fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          cursor: done ? "default" : "pointer", transition: "all .2s",
          display: "flex", alignItems: "center", gap: 5,
        }}
        onMouseEnter={e => { if (!done && !installing) e.currentTarget.style.background = "#333"; }}
        onMouseLeave={e => { if (!done && !installing) e.currentTarget.style.background = "#1A1A1A"; }}>
          {installing ? <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .5s linear infinite" }} />
            : done ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pop .25s ease" }}><polyline points="20 6 9 17 4 12"/></svg>Installed</>
            : "Install"}
        </button>
      </div>
      {installError && (
        <div style={{ padding: "8px 18px 12px", fontSize: 12, color: "#EF4444", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{installError}</div>
      )}
    </div>
  );
}

/* ─── Agent Card ─── */
function AgentCard({ agent, featured = false, onClick }: { agent: DisplayAgent; featured?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{
      display: "block", textDecoration: "none", color: "inherit", cursor: "pointer",
      width: featured ? 300 : "100%", flexShrink: featured ? 0 : undefined,
      borderRadius: 16, overflow: "hidden",
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.6)",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(-3px)";
      e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.06)";
      e.currentTarget.style.background = "rgba(255,255,255,0.68)";
    }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.background = "rgba(255,255,255,0.5)";
    }}
    >
      {/* Mini visual */}
      <div style={{ padding: "0", borderBottom: "1px solid rgba(0,0,0,0.025)" }}>
        <CardVisual agent={agent} />
      </div>

      {/* Body */}
      <div style={{ padding: featured ? "16px 18px 18px" : "14px 16px 16px" }}>
        {/* Category pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
          <CategoryIcon cat={agent.category} size={12} />
          <span style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>{agent.category}</span>
        </div>

        {/* Name */}
        <div style={{ fontSize: featured ? 15.5 : 14.5, fontWeight: 650, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 3, lineHeight: 1.25 }}>{agent.name}</div>

        {/* Creator */}
        <div style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: featured ? 10 : 8 }}>by {agent.creator}</div>

        {/* Description — featured cards get it */}
        {featured && (
          <p style={{
            fontSize: 13, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5,
            marginBottom: 14,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
          }}>{agent.description}</p>
        )}

        {/* Bottom row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{
            fontSize: 13, fontWeight: 620, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
            color: agent.price === "Free" ? "#22C55E" : "#1A1A1A",
          }}>{agent.price}</span>
          <span style={{ fontSize: 12, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
            ★ {agent.rating} · {formatRentals(agent.rentals)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Content (shared between public & in-app marketplace) ─── */
export function MarketplaceContent({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [agents, setAgents] = useState<DisplayAgent[]>(FALLBACK_AGENTS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Popular");
  const [ctaQuery, setCtaQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<DisplayAgent | null>(null);

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
            if (!loaded.some((l) => l.slug === ba.slug)) {
              loaded.push(ba);
            }
          }
        }

        if (loaded.length > 0) {
          setAgents(loaded);
        }
      } catch {
        // API unreachable — keep fallback data
      }
    }

    loadAgents();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeCategory === "All" ? agents : agents.filter(a => a.category === activeCategory);
  const sorted = sortAgents(filtered, activeSort);
  const featured = agents.filter(a => a.featured);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn { from{opacity:0;transform:translateY(8px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pop { from{transform:scale(0)} to{transform:scale(1)} }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .subtle-scrollbar { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.1) transparent; }
        .subtle-scrollbar::-webkit-scrollbar { height: 5px; }
        .subtle-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .subtle-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .subtle-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.18); }
      `}</style>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: embedded ? undefined : 1140, margin: embedded ? undefined : "0 auto", padding: embedded ? 0 : "0 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: embedded ? "left" : "center", paddingTop: embedded ? 0 : 52, marginBottom: embedded ? 28 : 44, animation: "fadeUp 0.5s ease both" }}>
          <h1 style={{ fontSize: embedded ? 26 : 44, fontWeight: 300, letterSpacing: "-0.035em", color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: embedded ? 6 : 12, margin: 0 }}>
            {embedded ? "Marketplace" : "Agent Marketplace"}
          </h1>
          <p style={{ fontSize: embedded ? 14 : 16.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", maxWidth: embedded ? undefined : 480, margin: embedded ? "4px 0 0" : "0 auto" }}>
            Discover, rent, and deploy AI agents built by the community.
          </p>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", justifyContent: embedded ? "flex-start" : "center", flexWrap: "wrap", gap: 4, marginBottom: 12, animation: "fadeUp 0.5s ease both", animationDelay: "0.05s" }} className="hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              fontSize: 13, fontWeight: activeCategory === cat ? 600 : 450,
              color: activeCategory === cat ? "#1A1A1A" : "#AAA",
              background: activeCategory === cat ? "rgba(255,255,255,0.65)" : "transparent",
              backdropFilter: activeCategory === cat ? "blur(12px)" : "none",
              border: activeCategory === cat ? "1px solid rgba(255,255,255,0.6)" : "1px solid transparent",
              borderRadius: 9, padding: "7px 14px", cursor: "pointer",
              fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.2s ease",
              display: "flex", alignItems: "center", gap: 5,
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeCategory !== cat) { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeCategory !== cat) { e.currentTarget.style.color = "#AAA"; e.currentTarget.style.background = "transparent"; }}}
            >
              {cat !== "All" && <CategoryIcon cat={cat} size={12} />}
              {cat}
            </button>
          ))}
        </div>

        {/* Sort pills */}
        <div style={{ display: "flex", justifyContent: embedded ? "flex-start" : "center", gap: 4, marginBottom: 36, animation: "fadeUp 0.5s ease both", animationDelay: "0.1s" }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setActiveSort(opt)} style={{
              fontSize: 12, fontWeight: activeSort === opt ? 600 : 450,
              color: activeSort === opt ? "#1A1A1A" : "#BBB",
              background: activeSort === opt ? "rgba(255,255,255,0.55)" : "transparent",
              border: activeSort === opt ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
              borderRadius: 7, padding: "5px 12px", cursor: "pointer",
              fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeSort !== opt) e.currentTarget.style.color = "#888"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeSort !== opt) e.currentTarget.style.color = "#BBB"; }}
            >{opt}</button>
          ))}
        </div>

        {/* Featured row */}
        {activeCategory === "All" && (
          <div style={{ marginBottom: 40, animation: "fadeUp 0.5s ease both", animationDelay: "0.15s" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#AAA", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Featured</span>
            </div>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10 }} className="subtle-scrollbar">
              {featured.map(agent => <AgentCard key={agent.slug} agent={agent} featured onClick={() => setSelectedAgent(agent)} />)}
            </div>
          </div>
        )}

        {/* All agents grid */}
        <div style={{ marginBottom: 52, animation: "fadeUp 0.5s ease both", animationDelay: "0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
              {activeCategory === "All" ? "All Agents" : activeCategory}
            </span>
            <span style={{ fontSize: 11, color: "#AAA", background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>
              {sorted.length}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
            {sorted.map(agent => <AgentCard key={agent.slug} agent={agent} onClick={() => setSelectedAgent(agent)} />)}
          </div>

          {sorted.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>No agents found in this category</p>
              <button onClick={() => setActiveCategory("All")} style={{
                fontSize: 13, color: "#999", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.6)",
                padding: "8px 16px", borderRadius: 9, cursor: "pointer", fontFamily: "var(--font-body), 'DM Sans', sans-serif",
              }}>View all agents</button>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{
          maxWidth: 540, margin: embedded ? "0 0 60px" : "0 auto 60px", textAlign: "center",
          background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18, padding: "36px 32px",
          animation: "fadeUp 0.5s ease both", animationDelay: "0.25s",
        }}>
          <h3 style={{ fontSize: 22, fontWeight: 400, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 8 }}>
            Can&apos;t find what you need?
          </h3>
          <p style={{ fontSize: 14, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 24, lineHeight: 1.5 }}>
            Describe what you&apos;re looking for and we&apos;ll assemble a custom agent team.
          </p>
          <div style={{
            display: "flex", alignItems: "center", maxWidth: 420, margin: "0 auto",
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
            borderRadius: 13, padding: "0 6px 0 16px",
            border: "1.5px solid rgba(255,255,255,0.7)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 10 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={ctaQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCtaQuery(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter" && ctaQuery.trim()) router.push(`/?q=${encodeURIComponent(ctaQuery)}`); }}
              placeholder="I need an agent that..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent", color: "#1A1A1A", padding: "13px 0", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }} />
            <button onClick={() => { if (ctaQuery.trim()) router.push(`/?q=${encodeURIComponent(ctaQuery)}`); }} style={{
              width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
              background: ctaQuery.trim() ? "#1A1A1A" : "rgba(0,0,0,0.05)", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ctaQuery.trim() ? "white" : "#CCC"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>

      </div>

      {/* Agent Detail Overlay */}
      {selectedAgent && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "grid", placeItems: "center" }}>
          <div onClick={() => setSelectedAgent(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.12)", backdropFilter: "blur(4px)", animation: "fadeUp .15s ease" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <AgentDetailCard agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
          </div>
        </div>
      )}
    </>
  );
}
