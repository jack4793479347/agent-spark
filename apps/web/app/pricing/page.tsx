'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/supabase/auth';

/* ─── NavBar ─── */
function NavBar() {
  const { user } = useAuth();
  const [prodOpen, setProdOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = () => { if (timeout.current) clearTimeout(timeout.current); setProdOpen(true); };
  const leave = () => { timeout.current = setTimeout(() => setProdOpen(false), 120); };

  const navLink = (label: string, href: string, active = false) => (
    <Link href={href} style={{ fontSize: 14, fontWeight: 500, color: active ? "#1A1A1A" : "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: active ? "rgba(0,0,0,0.04)" : "transparent", transition: "all 0.12s ease" }}
    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = active ? "#1A1A1A" : "#666"; e.currentTarget.style.background = active ? "rgba(0,0,0,0.04)" : "transparent"; }}>{label}</Link>
  );

  return (
    <nav style={{ position: "relative", zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 28px", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.4)" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.02em", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Agent Spark</span>
      </Link>
      <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
        {navLink("Home", "/")}
        <div style={{ position: "relative" }} onMouseEnter={enter} onMouseLeave={leave}>
          <button onClick={() => setProdOpen(!prodOpen)} style={{ fontSize: 14, fontWeight: 500, color: prodOpen ? "#1A1A1A" : "#666", background: "transparent", border: "none", padding: "8px 12px", cursor: "pointer", fontFamily: "var(--font-body), 'DM Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 3, borderRadius: 8 }}>
            Products
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.25s ease", transform: prodOpen ? "rotate(180deg)" : "rotate(0deg)", opacity: 0.45 }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {prodOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.82)", backdropFilter: "blur(28px)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)", padding: 6, zIndex: 100, width: 280, animation: "navDropIn 0.18s ease both" }}>
              {[{ title: "Workflow Assembler", href: "/products/assembler" }, { title: "Agent Studio", href: "/products/studio" }, { title: "A2A Orchestration", href: "/products/orchestration" }].map((item, i) => (
                <Link key={i} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "background 0.12s ease" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "rgba(0,0,0,0.035)"}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "transparent"}>{item.title}</Link>
              ))}
            </div>
          )}
        </div>
        {navLink("Marketplace", "/marketplace")}
        {navLink("About", "/about")}
        {navLink("Pricing", "/pricing", true)}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {user ? (
          <Link href="/dashboard" style={{ fontSize: 13.5, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "8px 18px", borderRadius: 9, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Dashboard</Link>
        ) : (
          <>
            <Link href="/auth" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.12s ease" }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}>Log in</Link>
            <Link href="/auth?mode=signup" style={{ fontSize: 13.5, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "8px 18px", borderRadius: 9, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}

/* ─── Billing Toggle ─── */
function BillingToggle({ annual, setAnnual }: { annual: boolean; setAnnual: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 44 }}>
      <span style={{ fontSize: 13.5, fontWeight: annual ? 450 : 600, color: annual ? "#BBB" : "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.2s ease" }}>Monthly</span>
      <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", padding: 3, background: annual ? "#1A1A1A" : "rgba(0,0,0,0.12)", transition: "background 0.25s ease", display: "flex", alignItems: "center", position: "relative" }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: "white", transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)", transform: annual ? "translateX(22px)" : "translateX(0)", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }} />
      </button>
      <span style={{ fontSize: 13.5, fontWeight: annual ? 600 : 450, color: annual ? "#1A1A1A" : "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.2s ease" }}>Annual</span>
      {annual && <span style={{ fontSize: 11, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 6, padding: "3px 9px", fontFamily: "var(--font-body), 'DM Sans', sans-serif", animation: "fadeUp 0.3s ease both" }}>Save 20%</span>}
    </div>
  );
}

/* ─── Icons ─── */
function Check() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>; }
function Dash() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(0,0,0,0.025)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 8, height: 1.5, borderRadius: 1, background: "#DDD" }} /></div>; }

/* ─── Credit Visual Bar ─── */
function CreditVisual({ credits, max = 30000 }: { credits: number; max?: number }) {
  const pct = Math.min((credits / max) * 100, 100);
  const formatted = credits >= 1000 ? (credits / 1000) + "k" : credits;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{formatted}</span>
        <span style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450 }}>credits/mo</span>
      </div>
      <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #1A1A1A, #555)", transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </div>
    </div>
  );
}

/* ─── Credit Action Icons (SVG) ─── */
function CreditIcon({ type }: { type: string }) {
  const s = 16;
  const c = "#999";
  const sw = "1.6";
  const icons: Record<string, React.ReactNode> = {
    email: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    slack: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19v-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M14 20.5c0-.83.67-1.5 1.5-1.5h0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h0c-.83 0-1.5-.67-1.5-1.5z"/><path d="M10 9.5C10 10.33 9.33 11 8.5 11h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z"/></svg>,
    draft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    lead: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 3 18 5 22 1"/></svg>,
    seo: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/><line x1="2" y1="2" x2="6" y2="6" opacity="0.4"/></svg>,
    a2a: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  };
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icons[type] || icons.a2a}
    </div>
  );
}

/* ─── Types ─── */
interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
  badge?: string;
}

interface Plan {
  name: string;
  description: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  credits: number | null;
  features: PlanFeature[];
}

/* ─── Plan Card ─── */
function PlanCard({ plan, annual, popular }: { plan: Plan; annual: boolean; popular: boolean }) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const isEnterprise = plan.priceMonthly === null;
  return (
    <div style={{
      width: "100%", maxWidth: 290, position: "relative",
      background: popular ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.45)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: popular ? "1.5px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.6)",
      borderRadius: 20, padding: "32px 24px 26px",
      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: popular ? "0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" : "none",
      display: "flex", flexDirection: "column" as const,
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = popular ? "0 12px 40px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" : "0 8px 28px rgba(0,0,0,0.05)"; if (!popular) e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = popular ? "0 8px 32px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" : "none"; if (!popular) e.currentTarget.style.background = "rgba(255,255,255,0.45)"; }}>

      {popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: "#FFF", background: "#1A1A1A", borderRadius: 8, padding: "4px 14px", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.02em" }}>Most Popular</div>}

      {/* Plan name */}
      <span style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6 }}>{plan.name}</span>

      {/* Description */}
      <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 18, minHeight: 40 }}>{plan.description}</p>

      {/* Price */}
      <div style={{ marginBottom: 16 }}>
        {isEnterprise ? <span style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Custom</span>
        : price === 0 ? <span style={{ fontSize: 40, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>$0</span>
        : <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}><span style={{ fontSize: 40, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>${price}</span><span style={{ fontSize: 14, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450 }}>/mo</span></div>}
        {!isEnterprise && annual && price !== null && price > 0 && <p style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 4 }}>Billed ${price * 12}/year</p>}
        {!isEnterprise && !annual && price !== null && price > 0 && <p style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 4 }}>Billed monthly</p>}
      </div>

      {/* Credit visual */}
      {plan.credits && <CreditVisual credits={plan.credits} />}
      {isEnterprise && <div style={{ marginBottom: 6 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}><span style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>&infin;</span><span style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450 }}>credits/mo</span></div><div style={{ width: "100%", height: 4, borderRadius: 2, background: "linear-gradient(90deg, #1A1A1A, #555)", opacity: 0.15 }} /></div>}

      {/* CTA */}
      <Link href={isEnterprise ? "/contact" : "/signup"} style={{ display: "block", textAlign: "center" as const, textDecoration: "none", fontSize: 14, fontWeight: 600, borderRadius: 11, padding: "12px 0", marginTop: 18, marginBottom: 22, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease", ...(popular ? { color: "#FFF", background: "#1A1A1A", border: "1.5px solid #1A1A1A" } : { color: "#1A1A1A", background: "rgba(255,255,255,0.5)", border: "1.5px solid rgba(0,0,0,0.08)" }) }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = "translateY(-1px)"; if (popular) e.currentTarget.style.background = "#333"; else { e.currentTarget.style.background = "rgba(255,255,255,0.8)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.14)"; } }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = "translateY(0)"; if (popular) e.currentTarget.style.background = "#1A1A1A"; else { e.currentTarget.style.background = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; } }}
      >{isEnterprise ? "Talk to Sales" : price === 0 ? "Get Started Free" : "Start 14-Day Free Trial"}</Link>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(0,0,0,0.04)", marginBottom: 16 }} />

      {/* Features */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 9, flex: 1 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            {f.included ? <Check /> : <Dash />}
            <span style={{ fontSize: 13, color: f.included ? "#666" : "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.4, fontWeight: f.highlight ? 550 : 400 }}>
              {f.text}
              {f.badge && <span style={{ fontSize: 10, fontWeight: 600, color: f.badge === "Core" ? "#1A1A1A" : "#F59E0B", background: f.badge === "Core" ? "rgba(0,0,0,0.06)" : "rgba(245,158,11,0.08)", borderRadius: 5, padding: "2px 6px", marginLeft: 6, fontFamily: "var(--font-body), 'DM Sans', sans-serif", verticalAlign: "middle" }}>{f.badge}</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", paddingRight: 16 }}>{question}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div style={{ maxHeight: open ? 220 : 0, opacity: open ? 1 : 0, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", overflow: "hidden" }}>
        <p style={{ fontSize: 14, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, paddingBottom: 18 }}>{answer}</p>
      </div>
    </div>
  );
}

/* ─── Credit Pack Card ─── */
function CreditPack({ credits, price, perCredit, popular = false }: { credits: number; price: number; perCredit: string; popular?: boolean }) {
  return (
    <div style={{ flex: 1, minWidth: 160, background: popular ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)", backdropFilter: "blur(16px)", border: popular ? "1.5px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.6)", borderRadius: 14, padding: "20px 18px", textAlign: "center" as const, transition: "all 0.2s ease", position: "relative" as const }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.04)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      {popular && <div style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 5, padding: "2px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Best Value</div>}
      <div style={{ fontSize: 22, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: 2 }}>{credits >= 1000 ? (credits / 1000) + "k" : credits}</div>
      <div style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 10 }}>credits</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 2 }}>${price}</div>
      <div style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>${perCredit}/credit</div>
    </div>
  );
}

/* ─── Data ─── */
const PLANS: Plan[] = [
  {
    name: "Starter",
    description: "For individuals exploring AI agents. Experience the full platform free.",
    priceMonthly: 0, priceAnnual: 0, credits: 500,
    features: [
      { text: "500 credits / month", included: true, highlight: true },
      { text: "3 active agents", included: true },
      { text: "A2A orchestration & assembler", included: true, badge: "Core" },
      { text: "Marketplace access (free agents)", included: true },
      { text: "Agent Studio: build & test", included: true },
      { text: "Basic integrations (Gmail, Slack)", included: true },
      { text: "7-day run history", included: true },
      { text: "Community support", included: true },
      { text: "Marketplace publishing", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For founders and small teams automating real workflows at scale.",
    priceMonthly: 49, priceAnnual: 39, credits: 5000,
    features: [
      { text: "5,000 credits / month", included: true, highlight: true },
      { text: "Unlimited active agents", included: true, highlight: true },
      { text: "A2A orchestration & assembler", included: true, badge: "Core" },
      { text: "All marketplace agents", included: true },
      { text: "Agent Studio: build & publish", included: true, badge: "New" },
      { text: "All 50+ integrations", included: true },
      { text: "30-day run history & logs", included: true },
      { text: "Email & chat support", included: true },
      { text: "Marketplace publishing (80/20 rev share)", included: true },
    ],
  },
  {
    name: "Business",
    description: "For growing companies that need power, governance, and custom infrastructure.",
    priceMonthly: 249, priceAnnual: 199, credits: 30000,
    features: [
      { text: "30,000 credits / month", included: true, highlight: true },
      { text: "Unlimited active agents", included: true, highlight: true },
      { text: "A2A orchestration & assembler", included: true, badge: "Core" },
      { text: "All integrations + custom connectors", included: true },
      { text: "Agent Studio: build & publish", included: true },
      { text: "Unlimited run history & audit logs", included: true },
      { text: "SSO & role-based permissions", included: true },
      { text: "Priority support & onboarding", included: true },
      { text: "Marketplace publishing (80/20 rev share)", included: true },
    ],
  },
];

const FAQ_DATA = [
  { question: "What are credits and how do they work?", answer: "Credits are the universal unit for agent compute on Agent Spark. Every time an agent executes a task, it consumes credits based on complexity. A simple action (like classifying an email or sending a Slack message) costs 1-5 credits. A multi-step orchestrated workflow (assembling 3 agents with knowledge retrieval and tool calls) costs 40-80 credits. Credits reset monthly on your billing date." },
  { question: "Is A2A orchestration really included on every plan?", answer: "Yes. The assembler and agent-to-agent orchestration are core to Agent Spark and available on every plan, including Starter. The difference between tiers is how many credits you get to run those workflows, not whether you can access them." },
  { question: "How does marketplace agent pricing work?", answer: "Your plan covers the platform: credits, integrations, and features. Marketplace agents have their own pricing set by their creators. Free agents are included on every plan. Paid agents (like the $19/mo Lead Qualifier or $49/mo Data Insights Agent) are billed separately. When you run a marketplace agent, it deducts from your credit pool. The agent fee covers access, credits cover compute." },
  { question: "What happens when I run out of credits?", answer: "Your agents pause until the next billing cycle. You'll get notifications at 80% and 100% usage. You can purchase credit packs anytime to top up immediately, no plan change needed. Pro and Business users can also enable auto-recharge to avoid interruptions." },
  { question: "Can I change plans at any time?", answer: "Yes. Upgrade instantly and get prorated credit allocation for the remainder of your cycle. When downgrading, your current plan stays active until the next billing date. You keep any unused credit packs regardless of plan changes." },
  { question: "Is there a free trial for paid plans?", answer: "Yes. Pro and Business plans come with a 14-day free trial with full credits. No credit card required to start. If you don't convert, you'll automatically drop to the Starter plan with no data loss." },
  { question: "What integrations are included?", answer: "Starter includes Gmail and Slack. Pro and above include all 50+ integrations: Gmail, Slack, Shopify, Stripe, HubSpot, Notion, GitHub, Linear, Intercom, Zendesk, Jira, Salesforce, and more. Business plans can request custom connectors for internal tools or niche services." },
  { question: "Can I publish agents to the marketplace?", answer: "Pro and above include marketplace publishing. You build agents in Agent Studio, test them, and submit for review. Once approved, other users can rent your agent. You earn 80% of every transaction, paid out monthly via Stripe Connect." },
];

/* ─── Main ─── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes a1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,-6%) scale(1.06)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5%,5%) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(7%,-4%) scale(1.08)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes navDropIn { from{opacity:0;transform:translateX(-50%) translateY(4px) scale(0.97)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        ::selection { background: #1A1A1A; color: white; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "#F2F3F6", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-12%", right: "-8%", width: "55vw", height: "55vw", maxWidth: 750, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,160,140,0.2) 0%, transparent 60%)", animation: "a1 26s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "25%", left: "-10%", width: "45vw", height: "45vw", maxWidth: 650, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(130,180,255,0.16) 0%, transparent 60%)", animation: "a2 32s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-8%", left: "35%", width: "40vw", height: "40vw", maxWidth: 550, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(180,160,255,0.12) 0%, transparent 60%)", animation: "a3 28s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundSize: "28px 28px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px)", backgroundSize: "80px 80px", maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 65%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 65%)" }} />
      </div>

      <NavBar />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* Hero */}
        <section style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px 0", textAlign: "center" as const, animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>Pricing</div>
          <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 16 }}>Start free, scale with<br />credits as you grow</h1>
          <p style={{ fontSize: 16.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 36px" }}>Every plan includes the full platform: A2A orchestration, marketplace access, and the assembler. Credits scale with your usage.</p>
        </section>

        {/* Toggle */}
        <div style={{ animation: "fadeUp 0.6s ease both", animationDelay: "0.08s" }}><BillingToggle annual={annual} setAnnual={setAnnual} /></div>

        {/* Plan cards */}
        <section style={{ maxWidth: 1220, margin: "0 auto 52px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.12s" }}>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const, alignItems: "stretch" }}>
            {PLANS.map((plan, i) => <PlanCard key={plan.name} plan={plan} annual={annual} popular={i === 1} />)}
          </div>
        </section>

        {/* Marketplace pricing callout */}
        <section style={{ maxWidth: 800, margin: "0 auto 52px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.16s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18, padding: "24px 28px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 3 }}>Marketplace agents are priced separately</h4>
              <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5, margin: 0 }}>Free agents work on every plan. Paid agents are priced by their creators and billed separately. Your plan credits cover the compute to run them. Creators earn 80% of every transaction.</p>
            </div>
          </div>
        </section>

        {/* Credit Packs */}
        <section style={{ maxWidth: 700, margin: "0 auto 64px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Need More?</div>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 8 }}>Credit packs</h2>
            <p style={{ fontSize: 14, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Top up anytime. No commitment. Credits never expire.</p>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <CreditPack credits={1000} price={12} perCredit="0.012" />
            <CreditPack credits={5000} price={49} perCredit="0.0098" popular />
            <CreditPack credits={20000} price={149} perCredit="0.0075" />
          </div>
        </section>

        {/* Comparison table */}
        <section style={{ maxWidth: 860, margin: "0 auto 64px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.24s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
            <h2 style={{ fontSize: 30, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Compare plans at a glance</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 18, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", borderBottom: "1px solid rgba(0,0,0,0.04)", padding: "16px 24px" }}>
              <span />
              {["Starter", "Pro", "Business"].map(n => <span key={n} style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", textAlign: "center" as const }}>{n}</span>)}
            </div>
            {[
              { label: "Monthly credits", vals: ["500", "5,000", "30,000"] },
              { label: "Active agents", vals: ["3", "Unlimited", "Unlimited"] },
              { label: "A2A Orchestration", vals: [true, true, true] },
              { label: "Assembler", vals: [true, true, true] },
              { label: "Integrations", vals: ["2", "50+", "50+ & custom"] },
              { label: "Agent Studio", vals: ["Build & test", "Build & publish", "Build & publish"] },
              { label: "Marketplace publishing", vals: [false, true, true] },
              { label: "SSO & permissions", vals: [false, false, true] },
              { label: "Run history", vals: ["7 days", "30 days", "Unlimited"] },
              { label: "Support", vals: ["Community", "Email & chat", "Priority"] },
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", borderBottom: i < 9 ? "1px solid rgba(0,0,0,0.025)" : "none", padding: "12px 24px", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450 }}>{row.label}</span>
                {row.vals.map((v, j) => (
                  <div key={j} style={{ textAlign: "center" as const }}>
                    {typeof v === "boolean" ? (v ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline" }}><polyline points="20 6 9 17 4 12"/></svg> : <span style={{ display: "inline-block", width: 10, height: 1.5, borderRadius: 1, background: "#DDD" }} />) : <span style={{ fontSize: 12.5, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>{v}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* How credits work */}
        <section style={{ maxWidth: 720, margin: "0 auto 64px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.28s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>How Credits Work</div>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>One credit, one unit of compute</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18, padding: "24px 28px 16px", display: "flex", flexDirection: "column" as const, gap: 0 }}>
            {[
              { action: "Classify an email", credits: "1-2", type: "email" },
              { action: "Send a Slack notification", credits: "1", type: "slack" },
              { action: "Draft & send a response", credits: "5-10", type: "draft" },
              { action: "Qualify a lead with CRM enrichment", credits: "15-25", type: "lead" },
              { action: "Write an SEO blog post", credits: "30-50", type: "seo" },
              { action: "Full A2A workflow (3-4 agents)", credits: "40-80", type: "a2a" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.03)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CreditIcon type={item.type} />
                  <span style={{ fontSize: 14, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450 }}>{item.action}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(0,0,0,0.03)", borderRadius: 7, padding: "4px 10px", whiteSpace: "nowrap" as const }}>
                  {item.credits} {item.credits === "1" ? "credit" : "credits"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth: 620, margin: "0 auto 64px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.3s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>FAQ</div>
            <h2 style={{ fontSize: 30, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Common questions</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18, padding: "4px 28px" }}>
            {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.question} answer={faq.answer} />)}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto 72px", padding: "0 24px", textAlign: "center" as const, animation: "fadeUp 0.6s ease both", animationDelay: "0.34s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to put AI agents to work?</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Start with 500 free credits. Upgrade when you&apos;re ready.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/marketplace" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>Browse Marketplace</Link>
              <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "12px 28px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Get Started Free &rarr;</Link>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
