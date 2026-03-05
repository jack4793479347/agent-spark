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
                <Link key={i} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "background 0.12s ease", background: item.href === "/products/studio" ? "rgba(0,0,0,0.035)" : "transparent" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "rgba(0,0,0,0.035)"}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = item.href === "/products/studio" ? "rgba(0,0,0,0.035)" : "transparent"}>{item.title}</Link>
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

/* ─── Mock Studio UI ─── */
interface TestMessage {
  role: 'user' | 'agent';
  text: string;
}

function StudioPreview() {
  const [activeTab, setActiveTab] = useState("config");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testSent, setTestSent] = useState(false);

  const sendTest = () => {
    if (testSent) return;
    setTestSent(true);
    setTestMessages([{ role: "user", text: "What's your return policy?" }]);
    setTimeout(() => {
      setTestMessages(prev => [...prev, { role: "agent", text: "Our return policy allows returns within 30 days of purchase. Items must be in original condition with tags attached. I can start a return for you. Would you like me to look up your order?" }]);
    }, 1400);
  };

  const tabs = [
    { id: "config", label: "Configure", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { id: "knowledge", label: "Knowledge", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { id: "tools", label: "Tools", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
    { id: "test", label: "Test", icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18,
      overflow: "hidden", maxWidth: 780, margin: "0 auto",
      boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
    }}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", borderBottom: "1px solid rgba(0,0,0,0.04)", background: "rgba(255,255,255,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(0,0,0,0.06)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(0,0,0,0.06)" }} />
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "rgba(0,0,0,0.06)" }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginLeft: 8 }}>Agent Studio</span>
          <span style={{ fontSize: 10, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>/ Support Responder v2</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 5, padding: "2px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Saved</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, padding: "0 14px", borderBottom: "1px solid rgba(0,0,0,0.03)", background: "rgba(255,255,255,0.2)" }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: "flex", alignItems: "center", gap: 5, padding: "10px 14px",
            fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 450,
            color: activeTab === tab.id ? "#1A1A1A" : "#AAA",
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "none", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab.id ? "2px solid #1A1A1A" : "2px solid transparent",
            transition: "all 0.15s ease", marginBottom: -1,
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Content area */}
      <div style={{ padding: "20px 22px", minHeight: 320 }}>

        {/* Configure tab */}
        {activeTab === "config" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, animation: "fadeUp 0.3s ease both" }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Agent Name</label>
              <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Support Responder v2</div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Description</label>
              <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5 }}>Handles tier-1 support tickets. Suggests solutions from knowledge base, drafts responses, escalates complex issues to human agents.</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Category</label>
                <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Support
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>Pricing</label>
                <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>$29/mo</div>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" as const, display: "block", marginBottom: 6 }}>System Instructions</label>
              <div style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, minHeight: 80 }}>
                You are a friendly customer support agent for an e-commerce company. Always check the knowledge base before responding. If you can&apos;t find an answer, acknowledge the question and escalate to a human agent. Keep responses concise and helpful. Never make up information about products or policies.
              </div>
            </div>
          </div>
        )}

        {/* Knowledge tab */}
        {activeTab === "knowledge" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, animation: "fadeUp 0.3s ease both" }}>
            <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5 }}>Upload documents, URLs, or data sources. Your agent will search this knowledge base to answer questions accurately.</p>
            {[
              { name: "return-policy.pdf", size: "245 KB", status: "indexed", pages: "12 pages" },
              { name: "product-catalog.csv", size: "1.2 MB", status: "indexed", pages: "847 items" },
              { name: "faq-responses.md", size: "38 KB", status: "indexed", pages: "94 entries" },
              { name: "shipping-guide.pdf", size: "128 KB", status: "processing", pages: "6 pages" },
            ].map((doc, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.5)", borderRadius: 10, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{doc.name}</div>
                  <div style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{doc.size} &middot; {doc.pages}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: doc.status === "indexed" ? "#22C55E" : "#F59E0B", background: doc.status === "indexed" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)", borderRadius: 5, padding: "2px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
                  {doc.status === "indexed" ? "Indexed" : "Processing"}
                </span>
              </div>
            ))}
            <div style={{ border: "1.5px dashed rgba(0,0,0,0.08)", borderRadius: 10, padding: "20px", textAlign: "center" as const, cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 6px", display: "block" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Drop files here or click to upload</span>
            </div>
          </div>
        )}

        {/* Tools tab */}
        {activeTab === "tools" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 14, animation: "fadeUp 0.3s ease both" }}>
            <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5 }}>Connect integrations your agent can use to read data, send messages, and take actions.</p>
            {[
              { name: "Gmail", desc: "Read & send emails", connected: true },
              { name: "Slack", desc: "Post messages & alerts", connected: true },
              { name: "Shopify", desc: "Look up orders & products", connected: true },
              { name: "Zendesk", desc: "Create & update tickets", connected: false },
              { name: "Notion", desc: "Read & write docs", connected: false },
            ].map((tool, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.5)", borderRadius: 10, border: "1px solid rgba(0,0,0,0.03)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{tool.name}</div>
                  <div style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{tool.desc}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: tool.connected ? "#22C55E" : "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", cursor: "pointer" }}>
                  {tool.connected ? "Connected" : "+ Connect"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Test tab */}
        {activeTab === "test" && (
          <div style={{ display: "flex", flexDirection: "column" as const, height: 300, animation: "fadeUp 0.3s ease both" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, justifyContent: testMessages.length ? "flex-end" : "center", gap: 10, marginBottom: 14 }}>
              {testMessages.length === 0 && (
                <div style={{ textAlign: "center" as const }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 8px", display: "block" }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <p style={{ fontSize: 13, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Send a test message to try your agent</p>
                </div>
              )}
              {testMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", animation: "fadeUp 0.3s ease both" }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 14px", borderRadius: 12,
                    fontSize: 13, fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5,
                    ...(msg.role === "user" ? {
                      background: "#1A1A1A", color: "#FFF",
                      borderBottomRightRadius: 4,
                    } : {
                      background: "rgba(255,255,255,0.7)", color: "#444",
                      border: "1px solid rgba(0,0,0,0.04)", borderBottomLeftRadius: 4,
                    }),
                  }}>{msg.text}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={sendTest} style={{ flex: 1, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: testSent ? "#1A1A1A" : "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", cursor: "pointer" }}>
                {testSent ? "What's your return policy?" : "Type a test message..."}
              </div>
              <button onClick={sendTest} style={{ width: 38, height: 38, borderRadius: 10, border: "none", background: "#1A1A1A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease", flexShrink: 0 }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = "#333"}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.background = "#1A1A1A"}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Capability Card ─── */
function CapabilityCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 200,
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16,
      padding: "24px 20px", transition: "all 0.2s ease",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 6, lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}

/* ─── Journey Step ─── */
function JourneyStep({ number, title, description, badge }: { number: string; title: string; description: string; badge?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 220, display: "flex", gap: 14, alignItems: "flex-start" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>{number}</span>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{title}</h3>
          {badge && <span style={{ fontSize: 10, fontWeight: 600, color: badge === "Free" ? "#22C55E" : "#F59E0B", background: badge === "Free" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)", borderRadius: 5, padding: "2px 7px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{badge}</span>}
        </div>
        <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{description}</p>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function AgentStudioPage() {
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
        <section style={{ maxWidth: 660, margin: "0 auto", padding: "64px 24px 0", textAlign: "center" as const, animation: "fadeUp 0.6s ease both" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>Agent Studio</div>
          <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 16 }}>
            Build agents without<br />writing code
          </h1>
          <p style={{ fontSize: 16.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 48px" }}>
            Define behavior with natural language, connect your tools, upload your knowledge, then test and publish to the marketplace. No engineering required.
          </p>
        </section>

        {/* Studio Preview */}
        <section style={{ maxWidth: 820, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.1s" }}>
          <StudioPreview />
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 12 }}>Interactive preview. Click the tabs to explore</p>
        </section>

        {/* Capabilities */}
        <section style={{ maxWidth: 940, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Capabilities</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Everything you need to build</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            <CapabilityCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
              title="Natural language instructions"
              description="Define how your agent behaves by writing instructions in plain English. Set its personality, rules, and edge cases. No prompt engineering expertise needed."
            />
            <CapabilityCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
              title="Knowledge base"
              description="Upload PDFs, CSVs, website URLs, or Notion docs. Your agent automatically indexes everything and retrieves relevant information to answer questions accurately."
            />
            <CapabilityCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
              title="Tool connections"
              description="Give your agent access to 50+ integrations. It can read emails, send Slack messages, look up Shopify orders, create Jira tickets, whatever the workflow needs."
            />
            <CapabilityCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
              title="Live testing sandbox"
              description="Chat with your agent in real-time before publishing. See exactly how it responds, which knowledge it retrieves, and which tools it calls, then iterate instantly."
            />
          </div>
        </section>

        {/* Build → Test → Publish */}
        <section style={{ maxWidth: 820, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Creator Journey</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Build, test, publish, earn</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 18, padding: "32px 28px", display: "flex", flexDirection: "column" as const, gap: 28 }}>
            <JourneyStep number="1" title="Build your agent" badge="Free" description="Available on every plan. Configure your agent's behavior, upload knowledge, and connect tools, all from a visual interface. No code, no CLI, no deployment steps." />
            <div style={{ height: 1, background: "rgba(0,0,0,0.03)" }} />
            <JourneyStep number="2" title="Test in the sandbox" badge="Free" description="Chat with your agent live. See which knowledge chunks it retrieves, which tools it calls, and how it handles edge cases. Iterate until it's production-ready." />
            <div style={{ height: 1, background: "rgba(0,0,0,0.03)" }} />
            <JourneyStep number="3" title="Publish to marketplace" badge="Pro" description="Submit your agent for review. Once approved, it's listed on the marketplace for anyone to rent. Set your own price, monthly or per-use." />
            <div style={{ height: 1, background: "rgba(0,0,0,0.03)" }} />
            <JourneyStep number="4" title="Earn recurring revenue" description="You keep 80% of every transaction. Payouts monthly via Stripe Connect. As users rent your agent, you earn, whether you're sleeping, studying, or building the next one." />
          </div>
        </section>

        {/* Creator economy pitch */}
        <section style={{ maxWidth: 720, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.25s" }}>
          <div style={{
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)",
            borderRadius: 20, padding: "44px 36px", position: "relative" as const, overflow: "hidden",
          }}>
            <div style={{ position: "relative" as const, zIndex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 14 }}>For Creators</div>
              <h2 style={{ fontSize: 30, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 12, lineHeight: 1.2 }}>Turn your expertise into<br />recurring revenue</h2>
              <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, marginBottom: 28, maxWidth: 480 }}>
                You know how to solve a specific problem: customer support, lead qualification, content creation. Package that knowledge into an agent and let the marketplace do the distribution.
              </p>
              <div style={{ display: "flex", gap: 32, marginBottom: 28 }}>
                {[
                  { val: "80%", label: "Revenue share" },
                  { val: "$0", label: "To get started" },
                  { val: "Monthly", label: "Stripe payouts" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em" }}>{stat.val}</div>
                    <div style={{ fontSize: 11, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <Link href="/signup" style={{ display: "inline-block", fontSize: 14, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "12px 28px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Start Building &rarr;</Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto 72px", padding: "0 24px", textAlign: "center" as const, animation: "fadeUp 0.6s ease both", animationDelay: "0.3s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Ready to build your first agent?</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Agent Studio is available on every plan. Start building and testing for free.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/marketplace" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>View Examples</Link>
              <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, color: "#FFF", textDecoration: "none", background: "#1A1A1A", padding: "12px 28px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}>Open Agent Studio &rarr;</Link>
            </div>
          </div>
        </section>

      </div>

    </div>
  );
}
