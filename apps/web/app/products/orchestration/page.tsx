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
                <Link key={i} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "background 0.12s ease", background: item.href === "/products/orchestration" ? "rgba(0,0,0,0.035)" : "transparent" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "rgba(0,0,0,0.035)"}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = item.href === "/products/orchestration" ? "rgba(0,0,0,0.035)" : "transparent"}>{item.title}</Link>
              ))}
            </div>
          )}
        </div>
        {navLink("Marketplace", "/marketplace")}
        {navLink("About", "/about")}
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

/* ─── Orchestration Flow (SVG-based with animated pulses) ─── */
function OrchFlow() {
  const W = 680, H = 430;
  const nodes = [
    { id: "trigger", label: "Trigger", sub: "Inbound email", x: 340, y: 52, icon: "mail" as const },
    { id: "classifier", label: "Classifier", sub: "Route by intent", x: 340, y: 155, icon: "filter" as const },
    { id: "support", label: "Support Agent", sub: "Draft response", x: 114, y: 278, icon: "chat" as const },
    { id: "sales", label: "Sales Agent", sub: "Qualify lead", x: 340, y: 278, icon: "user" as const },
    { id: "escalate", label: "Escalation", sub: "Alert on Slack", x: 566, y: 278, icon: "alert" as const },
    { id: "output", label: "Output", sub: "Send & log", x: 340, y: 390, icon: "send" as const },
  ];

  const edges = [
    { from: 0, to: 1, id: "e01" },
    { from: 1, to: 2, id: "e12" },
    { from: 1, to: 3, id: "e13" },
    { from: 1, to: 4, id: "e14" },
    { from: 2, to: 5, id: "e25" },
    { from: 3, to: 5, id: "e35" },
    { from: 4, to: 5, id: "e45" },
  ];

  const getPath = (from: number, to: number) => {
    const n1 = nodes[from], n2 = nodes[to];
    const y1 = n1.y + 28, y2 = n2.y - 28;
    const mid = (y1 + y2) / 2;
    return `M ${n1.x} ${y1} C ${n1.x} ${mid}, ${n2.x} ${mid}, ${n2.x} ${y2}`;
  };

  type IconType = 'mail' | 'filter' | 'chat' | 'user' | 'alert' | 'send';

  const NodeIcon = ({ type, x, y }: { type: IconType; x: number; y: number }) => {
    const icons: Record<IconType, React.ReactNode> = {
      mail: <g transform={`translate(${x}, ${y})`}><rect x="-6" y="-4.5" width="12" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3"/><polyline points="-6,-4.5 0,1.5 6,-4.5" fill="none" stroke="currentColor" strokeWidth="1.3"/></g>,
      filter: <g transform={`translate(${x}, ${y})`}><polygon points="-7,-4 7,-4 2,1 2,5 -2,5 -2,1" fill="none" stroke="currentColor" strokeWidth="1.3"/></g>,
      chat: <g transform={`translate(${x}, ${y})`}><path d="M-6,-4 h12 a2,2 0 0 1 2,2 v5 a2,2 0 0 1 -2,2 h-6 l-3,3 v-3 h-3 a2,2 0 0 1 -2,-2 v-5 a2,2 0 0 1 2,-2z" fill="none" stroke="currentColor" strokeWidth="1.3"/></g>,
      user: <g transform={`translate(${x}, ${y})`}><circle cx="0" cy="-3" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.3"/><path d="M-6,6 a6,5 0 0 1 12,0" fill="none" stroke="currentColor" strokeWidth="1.3"/></g>,
      alert: <g transform={`translate(${x}, ${y})`}><polygon points="0,-6 7,4 -7,4" fill="none" stroke="currentColor" strokeWidth="1.3"/><line x1="0" y1="-2" x2="0" y2="1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="0" cy="2.5" r="0.7" fill="currentColor"/></g>,
      send: <g transform={`translate(${x}, ${y})`}><line x1="-5" y1="0" x2="5" y2="0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><polyline points="1,-4 5,0 1,4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></g>,
    };
    return <>{icons[type]}</>;
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20,
      padding: "28px 16px", maxWidth: 740, margin: "0 auto",
    }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        <defs>
          <pattern id="orchGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="0.7" fill="rgba(0,0,0,0.04)" />
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="gridMask">
            <rect width={W} height={H} fill="url(#gridFade)" />
          </mask>
        </defs>

        {/* Grid background */}
        <rect width={W} height={H} fill="url(#orchGrid)" mask="url(#gridMask)" />

        {/* Edge paths - static lines */}
        {edges.map(edge => (
          <path key={`line-${edge.id}`} d={getPath(edge.from, edge.to)} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
        ))}

        {/* Edge paths - animated pulses */}
        {edges.map((edge, i) => (
          <g key={`pulse-g-${edge.id}`}>
            <path d={getPath(edge.from, edge.to)} fill="none" stroke="rgba(26,26,26,0.1)" strokeWidth="2.5" strokeDasharray="12 80" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="92;0" dur={`${2.2 + i * 0.3}s`} repeatCount="indefinite" />
            </path>
            <circle r="3" fill="rgba(26,26,26,0.14)">
              <animateMotion dur={`${2.2 + i * 0.3}s`} repeatCount="indefinite" path={getPath(edge.from, edge.to)} />
            </circle>
            <circle r="1.5" fill="rgba(26,26,26,0.3)">
              <animateMotion dur={`${2.2 + i * 0.3}s`} repeatCount="indefinite" path={getPath(edge.from, edge.to)} />
            </circle>
          </g>
        ))}

        {/* Nodes */}
        {nodes.map((node, ni) => {
          const isMiddle = ni >= 2 && ni <= 4;
          const nw = isMiddle ? 150 : 130;
          const nh = 56;
          const iconX = node.x - nw / 2 + 24;
          const textX = node.x - nw / 2 + 46;
          return (
            <g key={node.id}>
              {isMiddle && (
                <rect x={node.x - nw / 2 - 4} y={node.y - nh / 2 - 4} width={nw + 8} height={nh + 8} rx={16} fill="none" stroke="rgba(26,26,26,0.02)" strokeWidth="1">
                  <animate attributeName="stroke-opacity" values="0.02;0.06;0.02" dur="3s" begin={`${ni * 0.5}s`} repeatCount="indefinite" />
                </rect>
              )}
              <rect x={node.x - nw / 2} y={node.y - nh / 2} width={nw} height={nh} rx={13} fill="rgba(255,255,255,0.85)" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              <circle cx={iconX} cy={node.y} r={14} fill="rgba(0,0,0,0.025)" stroke="none" />
              <g style={{ color: "#AAA" }}>
                <NodeIcon type={node.icon} x={iconX} y={node.y} />
              </g>
              <text x={textX} y={node.y - 4} fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="11.5" fontWeight="600" fill="#1A1A1A">{node.label}</text>
              <text x={textX} y={node.y + 10} fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9.5" fontWeight="400" fill="#BBB">{node.sub}</text>
            </g>
          );
        })}

        {/* Branch labels */}
        <text x="114" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">support</text>
        <text x="340" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">sales</text>
        <text x="566" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">urgent</text>
      </svg>
    </div>
  );
}

/* ─── Concept Card ─── */
function ConceptCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 220, background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "26px 22px", transition: "all 0.2s ease",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}

/* ─── Orchestration Example ─── */
function OrchExample({ title, description, steps, credits }: { title: string; description: string; steps: string[]; credits: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16, padding: "22px 20px", transition: "all 0.2s ease",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.65)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.5)"; }}>
      <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6 }}>{title}</h4>
      <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 14 }}>{description}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const, marginBottom: 12 }}>
        {steps.map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 550, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "3px 10px" }}>{step}</span>
            {i < steps.length - 1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>~{credits} credits/run</div>
    </div>
  );
}

/* ─── Check / Dash ─── */
function Check() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>; }
function Dash() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(0,0,0,0.025)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 8, height: 1.5, borderRadius: 1, background: "#DDD" }} /></div>; }

/* ─── Main ─── */
export default function A2AOrchestrationPage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes a1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,-6%) scale(1.06)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5%,5%) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(7%,-4%) scale(1.08)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes navDropIn { from{opacity:0;transform:translateX(-50%) translateY(4px) scale(0.97)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes orchPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:0.8;transform:scale(1.02)} }
        @keyframes dotTravel { 0%{top:0;opacity:0} 20%{opacity:1} 80%{opacity:1} 100%{top:100%;opacity:0} }
        ::selection { background: #1A1A1A; color: white; }
      `}</style>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "#F2F3F6", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-12%", right: "-8%", width: "55vw", height: "55vw", maxWidth: 750, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,160,140,0.2) 0%, transparent 60%)", animation: "a1 26s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "25%", left: "-10%", width: "45vw", height: "45vw", maxWidth: 650, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(130,180,255,0.16) 0%, transparent 60%)", animation: "a2 32s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-8%", left: "35%", width: "40vw", height: "40vw", maxWidth: 550, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(180,160,255,0.12) 0%, transparent 60%)", animation: "a3 28s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundSize: "28px 28px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)" }} />
      </div>

      <NavBar />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* Hero */}
        <section style={{ maxWidth: 660, margin: "0 auto", padding: "64px 24px 0", textAlign: "center" as const, animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 4, padding: "1px 6px" }}>Core</span>
            A2A Orchestration
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 16 }}>
            Agents that work<br />together, not alone
          </h1>
          <p style={{ fontSize: 16.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 48px" }}>
            A single agent answers questions. An orchestrated team runs your entire operation, routing, deciding, acting, and handing off automatically.
          </p>
        </section>

        {/* Orchestration Diagram */}
        <section style={{ maxWidth: 700, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.1s" }}>
          <OrchFlow />
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 12 }}>Agents route, branch, and converge automatically</p>
        </section>

        {/* Core concepts */}
        <section style={{ maxWidth: 940, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Three pillars of orchestration</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            <ConceptCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              title="Agent-to-agent communication"
              description="Agents pass structured data to each other, not just text. The output of one agent becomes the typed input of the next, with validation at every handoff."
            />
            <ConceptCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>}
              title="Smart routing"
              description="The orchestrator analyzes incoming data and decides which agent handles it. Support emails go to support. Sales inquiries go to qualification. No manual rules."
            />
            <ConceptCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
              title="Shared context window"
              description="Every agent sees the full chain of decisions and outputs from previous steps. No information lost between handoffs. The escalation agent knows why it was triggered."
            />
          </div>
        </section>

        {/* Single vs Orchestrated */}
        <section style={{ maxWidth: 800, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>The Difference</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>One agent vs. a coordinated team</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            <div style={{ flex: 1, minWidth: 280, background: "rgba(255,255,255,0.4)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 16, padding: "26px 22px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#CCC", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 16 }}>Single Agent</div>
              {["Answers one type of question", "No context from other tools", "Handles one step at a time", "Fails silently on edge cases", "Manual escalation required"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <Dash />
                  <span style={{ fontSize: 13.5, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 280, background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", border: "1.5px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: "26px 22px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1A", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 16 }}>Orchestrated Team</div>
              {["Routes any input to the right specialist", "Shares full context across every step", "Multi-step workflows with branching", "Automatic fallback and retry handling", "Smart escalation with full audit trail"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                  <Check />
                  <span style={{ fontSize: 13.5, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example orchestrations */}
        <section style={{ maxWidth: 940, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.25s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Example Flows</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Real orchestrations in production</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            <OrchExample title="Full-Stack Customer Support" description="Classify tickets, search knowledge base, draft responses, escalate unresolved issues with full context." steps={["Classifier", "KB Search", "Drafter", "Escalator"]} credits="35" />
            <OrchExample title="Inbound Lead Pipeline" description="Score leads from forms, enrich with company data, route hot leads to Slack, nurture cold leads via email." steps={["Scorer", "Enricher", "Router", "Nurture"]} credits="45" />
            <OrchExample title="Content Production Line" description="Research topics, generate outlines, write blog posts, create social variants, schedule across channels." steps={["Researcher", "Outliner", "Writer", "Scheduler"]} credits="65" />
            <OrchExample title="Order Exception Handling" description="Monitor shipments, detect delays, notify customers proactively, initiate replacements and update records." steps={["Monitor", "Detector", "Notifier", "Fulfillment"]} credits="22" />
            <OrchExample title="Competitive Intelligence" description="Crawl competitor sites daily, detect pricing changes, analyze trends, generate weekly briefs." steps={["Crawler", "Detector", "Analyzer", "Reporter"]} credits="50" />
            <OrchExample title="New Hire Onboarding" description="Send welcome emails, schedule meetings, assign tasks, collect documents, check in at day 7, 30, 90." steps={["Welcome", "Scheduler", "Task Mgr", "Check-in"]} credits="28" />
          </div>
        </section>

        {/* Included on every plan */}
        <section style={{ maxWidth: 720, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.28s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "36px 32px", textAlign: "center" as const }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 6, padding: "4px 12px", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, marginBottom: 16 }}>Included on every plan</div>
            <h2 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: 12 }}>A2A orchestration isn&apos;t a premium feature</h2>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 24px" }}>
              Multi-agent coordination is core to Agent Spark. Every plan, including Starter, gets full access to the assembler, agent-to-agent workflows, and smart routing. The only difference between tiers is how many credits you get to run them.
            </p>
            <Link href="/pricing" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", fontFamily: "var(--font-body), 'DM Sans', sans-serif", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: 2, transition: "all 0.15s ease" }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.3)"; }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.1)"; }}>Compare plans &rarr;</Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto 72px", padding: "0 24px", textAlign: "center" as const, animation: "fadeUp 0.6s ease both", animationDelay: "0.32s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to orchestrate?</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Build your first multi-agent workflow with 500 free credits.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/products/assembler" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>Try Assembler</Link>
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
