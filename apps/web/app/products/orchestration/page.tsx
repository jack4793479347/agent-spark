'use client';

import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';

/* ─── Orchestration Flow Diagram ─── */
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
        <rect width={W} height={H} fill="url(#orchGrid)" mask="url(#gridMask)" />
        {edges.map(edge => (
          <path key={`line-${edge.id}`} d={getPath(edge.from, edge.to)} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1.5" />
        ))}
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
        <text x="114" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">support</text>
        <text x="340" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">sales</text>
        <text x="566" y="225" fontFamily="var(--font-body), DM Sans, sans-serif" fontSize="9" fontWeight="500" fill="#CCC" textAnchor="middle">urgent</text>
      </svg>
    </div>
  );
}

/* ─── Main ─── */
export default function A2AOrchestrationPage() {
  return (
    <PublicShell>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        ::selection { background: #1A1A1A; color: white; }
      `}</style>

        {/* Hero */}
        <section style={{ maxWidth: 660, margin: "0 auto", padding: "64px 24px 0", textAlign: "center" as const, animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>
            A2A Orchestration
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 16 }}>
            Agents that work<br />together, not alone
          </h1>
          <p style={{ fontSize: 16.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 48px" }}>
            A single agent answers questions. An orchestrated team runs your entire operation — routing, deciding, acting, and handing off automatically.
          </p>
        </section>

        {/* Orchestration Diagram */}
        <section style={{ maxWidth: 700, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.1s" }}>
          <OrchFlow />
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 12 }}>Agents route, branch, and converge automatically</p>
        </section>

        {/* What we're building */}
        <section style={{ maxWidth: 820, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>How it will work</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            {[
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                title: "Agent-to-agent delegation",
                desc: "When an agent hits a task outside its expertise, it delegates to a specialist. The support agent hands billing questions to the billing agent, automatically.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>,
                title: "Smart routing",
                desc: "The orchestrator analyzes incoming data and decides which agent handles it. No manual rules — the system learns which agent is best for each type of request.",
              },
              {
                icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
                title: "Shared context",
                desc: "Every agent in the chain sees the full history of decisions and outputs from previous steps. No information lost between handoffs.",
              },
            ].map((card, i) => (
              <div key={i} style={{
                flex: 1, minWidth: 220,
                background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16,
                padding: "24px 20px", transition: "all 0.2s ease",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{card.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6, lineHeight: 1.3 }}>{card.title}</h3>
                <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Example workflows */}
        <section style={{ maxWidth: 820, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <h2 style={{ fontSize: 22, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", textAlign: "center" as const, marginBottom: 24 }}>Example orchestrations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {[
              { title: "Customer Support Pipeline", agents: ["Classifier", "KB Search", "Drafter", "Escalator"], desc: "Route tickets, search knowledge, draft responses, escalate complex issues." },
              { title: "Inbound Lead Qualification", agents: ["Scorer", "Enricher", "Router", "Nurture"], desc: "Score leads, enrich data, route hot leads to Slack, nurture cold ones via email." },
              { title: "Content Production", agents: ["Researcher", "Outliner", "Writer", "Scheduler"], desc: "Research topics, outline, write posts, create social variants, schedule." },
              { title: "Order Exception Handling", agents: ["Monitor", "Detector", "Notifier", "Fulfillment"], desc: "Detect delays, notify customers, initiate replacements automatically." },
            ].map((flow, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.55)",
                borderRadius: 14, padding: "18px 16px", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.45)"; e.currentTarget.style.transform = ""; }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6 }}>{flow.title}</div>
                <p style={{ fontSize: 12, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.45, marginBottom: 10 }}>{flow.desc}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
                  {flow.agents.map((agent, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 550, color: "#666", background: "rgba(0,0,0,0.03)", borderRadius: 5, padding: "2px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent}</span>
                      {j < flow.agents.length - 1 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What's live today */}
        <section style={{ maxWidth: 720, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.25s" }}>
          <div style={{
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "36px 32px",
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: 16, textAlign: "center" as const }}>The full stack</h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {[
                { title: "Real tool execution", desc: "Agents connect to Gmail, Slack, Shopify, and more via OAuth and execute real actions on your behalf." },
                { title: "Conversational agent training", desc: "Build agents by talking to our trainer. No code, no prompt engineering required." },
                { title: "RAG-powered knowledge base", desc: "Upload documents and your agent searches them in real-time with vector embeddings." },
                { title: "Agent-to-agent delegation", desc: "Agents hand off tasks to specialist agents mid-conversation when they hit something outside their expertise." },
                { title: "Multi-agent workflow UI", desc: "Watch your orchestrated team work together in real-time with a visual dashboard." },
                { title: "Automatic agent discovery", desc: "The orchestrator finds the best agent from the marketplace for each subtask." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                    background: "rgba(34,197,94,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.45 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto 72px", padding: "0 24px", textAlign: "center" as const, animation: "fadeUp 0.6s ease both", animationDelay: "0.3s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to orchestrate?</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Build your first multi-agent workflow. Start with a single agent and scale to a full orchestrated team.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/products/studio" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>Explore Agent Studio</Link>
              <Link href="/auth?mode=signup" style={{ fontSize: 14, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "12px 28px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Get Started Free &rarr;</Link>
            </div>
          </div>
        </section>

    </PublicShell>
  );
}
