'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth';
import { fetchMarketplaceAgents, apiAgentToMarketplace, formatPrice, type ApiAgent } from '@/lib/api';

const CATEGORIES = ["All", "Sales", "Support", "Marketing", "Content", "E-commerce", "DevOps", "Finance", "HR", "Analytics", "Productivity"];

const CATEGORY_MAP: Record<string, string> = {
  'Sales': 'sales',
  'Support': 'customer-support',
  'Marketing': 'marketing',
  'Content': 'content',
  'E-commerce': 'ecommerce',
  'DevOps': 'development',
  'Finance': 'finance',
  'HR': 'hr',
  'Analytics': 'analytics',
  'Productivity': 'productivity',
};

const STEPS = [
  { num: "01", title: "Describe your goal", desc: "Tell us what you want to automate in plain English. No technical knowledge required." },
  { num: "02", title: "We assemble a team", desc: "Our engine searches the marketplace and picks the best agents for your workflow." },
  { num: "03", title: "Activate and run", desc: "One click to deploy. Your AI team handles the work while you focus on growth." },
];

function NavBar() {
  const { user } = useAuth();
  const [prodOpen, setProdOpen] = useState(false);
  const prodTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <nav style={{
      position: "relative", zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 28px", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.4)",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.02em", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Agent Spark</span>
      </Link>

      <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.12s ease" }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >Home</Link>

        <div style={{ position: "relative" }}
          onMouseEnter={() => { if (prodTimeout.current) clearTimeout(prodTimeout.current); setProdOpen(true); }}
          onMouseLeave={() => { prodTimeout.current = setTimeout(() => setProdOpen(false), 120); }}>
          <button onClick={() => setProdOpen(!prodOpen)} style={{
            fontSize: 14, fontWeight: 500, color: prodOpen ? "#1A1A1A" : "#666",
            background: "transparent", border: "none", padding: "8px 12px", cursor: "pointer",
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 3,
            borderRadius: 8, transition: "all 0.15s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (!prodOpen) e.currentTarget.style.color = "#1A1A1A"; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (!prodOpen) e.currentTarget.style.color = "#666"; }}
          >
            Products
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 0.25s ease", transform: prodOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.45 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {prodOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.82)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
              border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12,
              boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)",
              padding: 6, zIndex: 100, width: 280, animation: "dropIn 0.18s ease both",
            }}>
              {[
                { title: "Workflow Assembler", href: "/products/assembler" },
                { title: "Agent Studio", href: "/products/studio" },
                { title: "A2A Orchestration", href: "/products/orchestration" },
              ].map((item, i) => (
                <Link key={i} href={item.href} style={{
                  display: "block", padding: "9px 12px", borderRadius: 8,
                  textDecoration: "none", fontSize: 13, fontWeight: 550, color: "#1A1A1A",
                  fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "background 0.12s ease",
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "rgba(0,0,0,0.035)"}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "transparent"}
                >{item.title}</Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/marketplace" style={{
          fontSize: 14, fontWeight: 600, color: "#1A1A1A", textDecoration: "none",
          padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          background: "rgba(0,0,0,0.04)", transition: "all 0.12s ease",
        }}>Marketplace</Link>

        <Link href="/about" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.12s ease" }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >About</Link>

        <Link href="/pricing" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.12s ease" }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >Pricing</Link>
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {user ? (
          <Link href="/dashboard" style={{
            fontSize: 13.5, fontWeight: 600, color: "#FFF", textDecoration: "none",
            background: "#1A1A1A", border: "none", padding: "8px 18px", borderRadius: 9,
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Dashboard</Link>
        ) : (
          <>
            <Link href="/auth" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.12s ease" }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
            >Log in</Link>
            <Link href="/auth?mode=signup" style={{
              fontSize: 13.5, fontWeight: 600, color: "#FFF", textDecoration: "none",
              background: "#1A1A1A", padding: "8px 18px", borderRadius: 9,
              fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease",
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}
            >Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function MarketplaceExplainer() {
  const [activeCat, setActiveCat] = useState("All");
  const [agents, setAgents] = useState<{ name: string; by: string; desc: string; price: string; rating: number; rentals: string; tag: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { agents: raw } = await fetchMarketplaceAgents({ sortBy: 'popular', pageSize: 12 });
        if (cancelled) return;
        setAgents(raw.map(a => {
          const m = apiAgentToMarketplace(a);
          return { name: m.name, by: m.creator, desc: m.desc, price: m.price, rating: m.rating, rentals: m.rentals, tag: a.category, slug: m.slug };
        }));
      } catch {
        // API unavailable — show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeCat === "All" ? agents : agents.filter(a => {
    const catSlug = CATEGORY_MAP[activeCat];
    return a.tag === catSlug || a.tag === activeCat.toLowerCase();
  });

  return (
    <div style={{ minHeight: "100vh", background: "#F2F3F6", position: "relative", fontFamily: "var(--body)" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes dropIn { from { opacity:0; transform:translateX(-50%) translateY(3px) scale(.97) } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1) } }
        @keyframes blobA { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(3%,-5%) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes blobB { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-4%,4%) scale(1.04)} 100%{transform:translate(0,0) scale(1)} }
        ::selection { background:#1A1A1A; color:#fff }
      `}</style>

      {/* BG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "50vw", height: "50vw", maxWidth: 700, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,150,130,.1) 0%, transparent 60%)", animation: "blobA 28s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "40%", left: "-8%", width: "40vw", height: "40vw", maxWidth: 550, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(120,170,255,.08) 0%, transparent 60%)", animation: "blobB 32s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundSize: "24px 24px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,.015) 1px, transparent 1px)" }} />
      </div>

      <NavBar />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ===== HERO ===== */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "56px 20px 0", textAlign: "center", animation: "fadeUp .5s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#999", background: "rgba(255,255,255,.4)", borderRadius: 6, padding: "4px 10px", marginBottom: 14, fontFamily: "var(--body)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
            Agent Marketplace
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 400, color: "#1A1A1A", fontFamily: "var(--head)", letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: 12 }}>
            {"Rent AI agents that actually "}
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>work</span>
          </h1>
          <p style={{ fontSize: 15, color: "#AAA", fontFamily: "var(--body)", lineHeight: 1.55, maxWidth: 480, margin: "0 auto 24px" }}>
            Browse a marketplace of pre-built AI agents made by developers and companies. Install in one click, pay per use, and automate anything from lead qualification to customer support.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Link href="/auth?mode=signup" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "10px 22px", background: "#1A1A1A", color: "#fff", borderRadius: 9, fontSize: 13.5, fontWeight: 600, textDecoration: "none", fontFamily: "var(--body)", transition: "all .15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = ""; }}>
              {"Browse Marketplace \u2192"}
            </Link>
            <Link href="/about" style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "10px 18px", background: "rgba(255,255,255,.45)", border: "1px solid rgba(255,255,255,.55)", color: "#777", borderRadius: 9, fontSize: 13.5, fontWeight: 550, textDecoration: "none", fontFamily: "var(--body)", transition: "all .12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.45)"; }}>
              Learn More
            </Link>
          </div>
        </div>

        {/* ===== PREVIEW GRID ===== */}
        <div style={{ maxWidth: 820, margin: "44px auto 0", padding: "0 20px", animation: "fadeUp .65s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--body)" }}>Popular agents</h2>
            <span style={{ fontSize: 11, color: "#CCC", fontFamily: "var(--body)" }}>{agents.length} agents available</span>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 3, marginBottom: 14, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => {
              const active = activeCat === cat;
              return (
                <button key={cat} onClick={() => setActiveCat(cat)} style={{
                  fontSize: 11.5, fontWeight: active ? 600 : 450, color: active ? "#1A1A1A" : "#CCC",
                  background: active ? "rgba(0,0,0,.04)" : "none",
                  border: "1px solid " + (active ? "rgba(0,0,0,.05)" : "transparent"),
                  borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                  fontFamily: "var(--body)", transition: "all .12s"
                }}>{cat}</button>
              );
            })}
          </div>

          {/* Loading state */}
          {loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ padding: "14px 16px", background: "rgba(255,255,255,.3)", borderRadius: 12, border: "1px solid rgba(255,255,255,.4)", height: 120 }}>
                  <div style={{ width: "60%", height: 12, background: "rgba(0,0,0,.04)", borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ width: "40%", height: 10, background: "rgba(0,0,0,.03)", borderRadius: 4, marginBottom: 12 }} />
                  <div style={{ width: "100%", height: 10, background: "rgba(0,0,0,.02)", borderRadius: 4, marginBottom: 4 }} />
                  <div style={{ width: "70%", height: 10, background: "rgba(0,0,0,.02)", borderRadius: 4 }} />
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          {!loading && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {filtered.map((a, i) => (
                <Link key={a.slug} href={`/browse/${a.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: "14px 16px", background: "rgba(255,255,255,.45)", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.55)", transition: "all .15s", cursor: "pointer",
                    animation: "fadeUp .3s ease",
                    animationDelay: (i * 50) + "ms",
                    animationFillMode: "both"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.7)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.45)"; e.currentTarget.style.transform = ""; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--body)", marginBottom: 1 }}>{a.name}</div>
                        <div style={{ fontSize: 10.5, color: "#CCC", fontFamily: "var(--body)" }}>{a.by}</div>
                      </div>
                      <span style={{ fontSize: 9.5, fontWeight: 600, color: "#AAA", background: "rgba(0,0,0,.025)", borderRadius: 4, padding: "2px 6px", fontFamily: "var(--body)", flexShrink: 0 }}>{a.tag}</span>
                    </div>
                    <p style={{ fontSize: 11.5, color: "#AAA", lineHeight: 1.4, fontFamily: "var(--body)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>{a.desc}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span style={{ fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--body)" }}>{a.rating}</span>
                        <span style={{ color: "#DDD", fontFamily: "var(--body)" }}>{"\u00B7 " + a.rentals}</span>
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.price === "Free" ? "#22C55E" : "#1A1A1A", fontFamily: "var(--body)" }}>{a.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <p style={{ fontSize: 13, color: "#CCC", fontFamily: "var(--body)" }}>No agents in this category yet.</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link href="/auth?mode=signup" style={{ fontSize: 12, color: "#BBB", textDecoration: "none", fontFamily: "var(--body)", fontWeight: 550, transition: "color .12s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#888"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#BBB"; }}>
              {"Sign up to see all agents \u2192"}
            </Link>
          </div>
        </div>

        {/* ===== HOW IT WORKS ===== */}
        <div style={{ maxWidth: 700, margin: "44px auto 0", padding: "0 20px", animation: "fadeUp .75s ease" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--body)", textAlign: "center", marginBottom: 20 }}>How it works</h2>
          <div style={{ display: "flex", gap: 12 }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ flex: 1, padding: "18px 16px", background: "rgba(255,255,255,.4)", borderRadius: 12, border: "1px solid rgba(255,255,255,.5)", position: "relative" }}>
                <div style={{ fontSize: 28, fontWeight: 300, color: "rgba(0,0,0,.15)", fontFamily: "var(--head)", letterSpacing: "-0.03em", marginBottom: 8, lineHeight: 1 }}>{step.num}</div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--body)", marginBottom: 4 }}>{step.title}</div>
                <p style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--body)", lineHeight: 1.45, margin: 0 }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", right: -8, top: "50%", transform: "translateY(-50%)", color: "#DDD" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== CREATOR CTA ===== */}
        <div style={{ maxWidth: 700, margin: "36px auto 0", padding: "0 20px", animation: "fadeUp .85s ease" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "20px 24px", background: "rgba(255,255,255,.45)", borderRadius: 14, border: "1px solid rgba(255,255,255,.55)", gap: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--head)", letterSpacing: "-0.02em", marginBottom: 4 }}>Build agents, earn revenue</div>
              <p style={{ fontSize: 12.5, color: "#AAA", fontFamily: "var(--body)", lineHeight: 1.45, margin: 0 }}>Publish your AI agents to the marketplace and earn 85% of every rental. Our SDK makes it simple to build, test, and ship agents that businesses actually need.</p>
            </div>
            <Link href="/auth?mode=signup" style={{ flexShrink: 0, padding: "9px 18px", background: "rgba(0,0,0,.04)", border: "1px solid rgba(0,0,0,.04)", color: "#1A1A1A", borderRadius: 8, fontSize: 12.5, fontWeight: 600, textDecoration: "none", fontFamily: "var(--body)", transition: "all .12s", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.04)"; }}>
              {"Start Building \u2192"}
            </Link>
          </div>
        </div>

        {/* ===== BOTTOM CTA ===== */}
        <div style={{ maxWidth: 700, margin: "36px auto 0", padding: "0 20px 56px", textAlign: "center" }}>
          <div style={{ padding: "32px 24px", background: "rgba(255,255,255,.45)", borderRadius: 16, border: "1px solid rgba(255,255,255,.55)" }}>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: "#1A1A1A", fontFamily: "var(--head)", letterSpacing: "-0.03em", marginBottom: 6 }}>Ready to automate?</h2>
            <p style={{ fontSize: 13, color: "#BBB", fontFamily: "var(--body)", marginBottom: 18 }}>Create a free account to browse the full marketplace and install your first agent.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <Link href="/auth?mode=signup" style={{ padding: "10px 22px", background: "#1A1A1A", color: "#fff", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none", fontFamily: "var(--body)", transition: "all .15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = ""; }}>
                {"Get Started Free \u2192"}
              </Link>
              <Link href="/pricing" style={{ padding: "10px 18px", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.04)", color: "#888", borderRadius: 9, fontSize: 13, fontWeight: 550, textDecoration: "none", fontFamily: "var(--body)", transition: "all .12s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,.03)"; }}>
                View Pricing
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
