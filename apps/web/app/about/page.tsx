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
        {navLink("About", "/about", true)}
        {navLink("Pricing", "/pricing")}
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

/* ─── SVG Visuals ─── */
function DescribeVisual() {
  return (<svg width="200" height="80" viewBox="0 0 200 80" style={{ display: "block" }}>
    <rect x="10" y="8" width="140" height="32" rx="10" fill="#1A1A1A" opacity="0.04"/>
    <rect x="22" y="18" width="80" height="4" rx="2" fill="#1A1A1A" opacity="0.08"/>
    <rect x="22" y="26" width="50" height="4" rx="2" fill="#1A1A1A" opacity="0.05"/>
    <rect x="76" y="25" width="2" height="6" rx="1" fill="#1A1A1A" opacity="0.15"><animate attributeName="opacity" values="0.15;0;0.15" dur="1.2s" repeatCount="indefinite"/></rect>
    <rect x="10" y="50" width="52" height="18" rx="6" fill="#1A1A1A" opacity="0.025" stroke="#1A1A1A" strokeWidth="0.5" strokeOpacity="0.04"/>
    <rect x="68" y="50" width="64" height="18" rx="6" fill="#1A1A1A" opacity="0.025" stroke="#1A1A1A" strokeWidth="0.5" strokeOpacity="0.04"/>
    <rect x="138" y="50" width="46" height="18" rx="6" fill="#1A1A1A" opacity="0.025" stroke="#1A1A1A" strokeWidth="0.5" strokeOpacity="0.04"/>
  </svg>);
}

function AssembleVisual() {
  return (<svg width="200" height="80" viewBox="0 0 200 80" style={{ display: "block" }}>
    <circle cx="100" cy="40" r="14" fill="white" stroke="#1A1A1A" strokeWidth="1" opacity="0.3"/>
    <polygon points="100,33 95,43 105,43" fill="none" stroke="#1A1A1A" strokeWidth="1" opacity="0.15"/>
    {([[40,20],[160,20],[30,58],[170,58],[100,8]] as [number, number][]).map(([x,y], i) => (
      <g key={i}><line x1="100" y1="40" x2={x} y2={y} stroke="#1A1A1A" strokeWidth="0.6" opacity="0.06" strokeDasharray="3,3"/><circle cx={x} cy={y} r={7 + (i % 2) * 2} fill="white" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.2"/></g>
    ))}
    <circle cx="100" cy="40" r="14" fill="none" stroke="#1A1A1A" strokeWidth="0.8" opacity="0.1">
      <animate attributeName="r" values="14;22;14" dur="2.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.1;0;0.1" dur="2.5s" repeatCount="indefinite"/>
    </circle>
  </svg>);
}

function DeployVisual() {
  return (<svg width="200" height="80" viewBox="0 0 200 80" style={{ display: "block" }}>
    <rect x="10" y="5" width="180" height="70" rx="8" fill="white" stroke="#1A1A1A" strokeWidth="0.6" opacity="0.15"/>
    <rect x="10" y="5" width="180" height="14" rx="8" fill="#1A1A1A" opacity="0.02"/>
    <circle cx="22" cy="12" r="2" fill="#1A1A1A" opacity="0.06"/><circle cx="30" cy="12" r="2" fill="#1A1A1A" opacity="0.06"/><circle cx="38" cy="12" r="2" fill="#1A1A1A" opacity="0.06"/>
    {[40,60,35,55,48,30,52].map((h2, i) => (<rect key={i} x={22 + i * 22} y={65 - h2 * 0.55} width={14} height={h2 * 0.55} rx={2} fill="#1A1A1A" opacity={0.03 + (i % 3) * 0.015}/>))}
    <circle cx="170" cy="30" r="3" fill="#22C55E" opacity="0.3"/><circle cx="170" cy="42" r="3" fill="#22C55E" opacity="0.3"/><circle cx="170" cy="54" r="3" fill="#F59E0B" opacity="0.25"/>
  </svg>);
}

/* ─── Step ─── */
function Step({ number, title, description, visual }: { number: string; title: string; description: string; visual: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "flex-start", padding: "32px 0", borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}>{number}</div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 15, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 520, margin: 0 }}>{description}</p>
      </div>
      <div style={{ flexShrink: 0, width: 200 }}>{visual}</div>
    </div>
  );
}

/* ─── Roadmap Item ─── */
type RoadmapStatus = 'live' | 'building' | 'planned';

function RoadmapItem({ phase, title, items, status }: { phase: string; title: string; items: string[]; status: RoadmapStatus }) {
  const sc: Record<RoadmapStatus, string> = { live: "#22C55E", building: "#F59E0B", planned: "#CCC" };
  const sl: Record<RoadmapStatus, string> = { live: "Live", building: "In Progress", planned: "Planned" };
  return (
    <div style={{ flex: 1, minWidth: 240, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "24px 22px", transition: "all 0.2s ease" }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#BBB", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{phase}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: sc[status], background: `${sc[status]}12`, borderRadius: 6, padding: "3px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{sl[status]}</span>
      </div>
      <h4 style={{ fontSize: 17, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 12 }}>{title}</h4>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: status === "live" ? `${sc.live}15` : "rgba(0,0,0,0.02)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {status === "live" ? (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={sc.live} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>) : (<div style={{ width: 6, height: 6, borderRadius: 3, background: status === "building" ? sc.building : "#DDD", opacity: 0.5 }}/>)}
          </div>
          <span style={{ fontSize: 13, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.35 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main ─── */
export default function AboutPage() {
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

      {/* Nav */}
      <NavBar />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* Mission */}
        <section style={{ maxWidth: 720, margin: "0 auto", padding: "72px 24px 0", textAlign: "center", animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>Our Mission</div>
          <h1 style={{ fontSize: 50, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 20 }}>AI agents should work<br/>for everyone, not just engineers</h1>
          <p style={{ fontSize: 17, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.65, maxWidth: 540, margin: "0 auto 48px" }}>We&apos;re building the marketplace where anyone can discover, rent, and deploy AI agents in minutes. No code, no infrastructure, no complexity. Just describe what you need and your team of agents goes to work.</p>
        </section>

        {/* How It Works */}
        <section style={{ maxWidth: 800, margin: "0 auto 80px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 16 }}>How It Works</div>
            <h2 style={{ fontSize: 36, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Three steps. Zero complexity.</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.55)", borderRadius: 20, padding: "8px 32px" }}>
            <Step number="1" title="Describe what you need" description="Tell us your goal in plain language. 'Handle my customer support emails' or 'Qualify leads from my landing page'. No technical setup required." visual={<DescribeVisual />} />
            <Step number="2" title="We assemble your team" description="Our AI analyzes your request, selects the right agents from the marketplace, configures their connections, and wires them to your tools, automatically." visual={<AssembleVisual />} />
            <Step number="3" title="Agents go to work" description="Your team deploys instantly. Monitor progress from the dashboard, adjust settings, or swap agents anytime. Pay only for what you use." visual={<DeployVisual />} />
          </div>
        </section>

        {/* Vision */}
        <section style={{ maxWidth: 800, margin: "0 auto 80px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", borderRadius: 22, padding: "56px 48px", position: "relative", overflow: "hidden", border: "1px solid rgba(255,255,255,0.6)" }}>
            <div style={{ position: "absolute", inset: 0, opacity: 1, backgroundImage: "linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)", backgroundSize: "24px 24px", maskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 30%, transparent 70%)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 24 }}>Our Vision</div>
              <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", lineHeight: 1.3, marginBottom: 20, maxWidth: 560 }}>We believe every business should have access to an AI workforce, not just the ones with engineering teams.</h2>
              <p style={{ fontSize: 15.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.65, maxWidth: 520 }}>Agent Spark is building the infrastructure where AI agents are created by builders, curated by the community, and accessible to everyone. A marketplace that turns AI capabilities into plug-and-play solutions that work from day one.</p>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section style={{ maxWidth: 1000, margin: "0 auto 80px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.25s" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 16 }}>Roadmap</div>
            <h2 style={{ fontSize: 36, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>What we&apos;re building</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <RoadmapItem phase="Phase 1" title="Foundation" status="live" items={["Agent marketplace with creator economy", "Chat-first AI workflow assembly", "Agent-to-agent (A2A) orchestration", "10+ OAuth integrations (Gmail, Slack, Shopify)", "Creator tools for building & publishing", "Dual-revenue billing with Stripe"]} />
            <RoadmapItem phase="Phase 2" title="Intelligence" status="building" items={["Multi-step visual workflow builder", "Smart agent recommendations", "Performance analytics dashboard", "Team collaboration & shared workspaces", "Advanced agent configuration UI"]} />
            <RoadmapItem phase="Phase 3" title="Scale" status="planned" items={["Enterprise SSO & permissions", "Custom agent training on your data", "Marketplace API for developers", "Agent versioning & rollback", "White-label deployment option"]} />
          </div>
        </section>

        {/* CTA */}
        <section style={{ maxWidth: 600, margin: "0 auto 72px", padding: "0 24px", textAlign: "center", animation: "fadeUp 0.6s ease both", animationDelay: "0.3s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to put AI agents to work?</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Get started for free. No credit card required.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/marketplace" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>Browse Marketplace</Link>
              <Link href="/auth?mode=signup" style={{ fontSize: 14, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "12px 28px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Get Started Free &rarr;</Link>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
