'use client';

import { useState, useRef, useEffect } from 'react';
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
                <Link key={i} href={item.href} style={{ display: "block", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 550, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "background 0.12s ease", background: item.href === "/products/assembler" ? "rgba(0,0,0,0.035)" : "transparent" }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = "rgba(0,0,0,0.035)"}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.background = item.href === "/products/assembler" ? "rgba(0,0,0,0.035)" : "transparent"}>{item.title}</Link>
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

/* ─── Animated typing text for demo ─── */
function TypeWriter({ text, speed = 40, delay = 0, onDone }: { text: string; speed?: number; delay?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(prev => text.slice(0, prev.length + 1)), speed);
      return () => clearTimeout(t);
    } else if (!doneRef.current && onDoneRef.current) {
      doneRef.current = true;
      const t = setTimeout(() => onDoneRef.current?.(), 400);
      return () => clearTimeout(t);
    }
  }, [displayed, started, text, speed]);

  return <>{displayed}<span style={{ opacity: displayed.length < text.length ? 1 : 0, transition: "opacity 0.3s" }}>|</span></>;
}

/* ─── Auto Advance helper ─── */
function AutoAdvance({ delay, onDone }: { delay: number; onDone: () => void }) {
  const calledRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    if (calledRef.current) return;
    const t = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onDoneRef.current();
      }
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return null;
}

/* ─── Assembler Demo ─── */
function AssemblerDemo() {
  const [phase, setPhase] = useState<"idle" | "typing" | "thinking" | "assembled">("idle");
  const [hasRun, setHasRun] = useState(false);

  const goToThinking = useRef(() => setPhase("thinking")).current;
  const goToAssembled = useRef(() => setPhase("assembled")).current;

  const startDemo = () => {
    if (hasRun) return;
    setHasRun(true);
    setPhase("typing");
  };

  const query = "Handle all inbound support emails: classify urgency, draft responses, escalate critical issues to Slack";

  const agents = [
    { name: "Email Classifier", role: "Reads & categorizes" },
    { name: "Response Drafter", role: "Writes contextual replies" },
    { name: "Escalation Router", role: "Flags & alerts on Slack" },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20,
      padding: "32px 28px", maxWidth: 620, margin: "0 auto",
      minHeight: 320, display: "flex", flexDirection: "column" as const,
    }}>
      {/* Input area */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)",
        borderRadius: 14, padding: "14px 16px",
        border: phase === "typing" ? "1.5px solid rgba(0,0,0,0.1)" : "1.5px solid rgba(0,0,0,0.04)",
        transition: "border 0.2s ease", marginBottom: 20, minHeight: 56, cursor: phase === "idle" ? "pointer" : "default",
      }} onClick={startDemo}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <div style={{ flex: 1, fontSize: 14, fontFamily: "var(--font-body), 'DM Sans', sans-serif", color: phase === "idle" ? "#BBB" : "#1A1A1A", lineHeight: 1.5 }}>
          {phase === "idle" && <span style={{ cursor: "pointer" }}>Describe what you want to automate...</span>}
          {phase === "typing" && <TypeWriter text={query} speed={28} delay={200} onDone={goToThinking} />}
          {(phase === "thinking" || phase === "assembled") && <span>{query}</span>}
        </div>
      </div>

      {/* Thinking state */}
      {phase === "thinking" && (
        <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", flex: 1, animation: "fadeUp 0.4s ease both", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: "#1A1A1A", animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
          <span style={{ fontSize: 14, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Analyzing your workflow...</span>
          <AutoAdvance delay={2200} onDone={goToAssembled} />
        </div>
      )}

      {/* Assembled result */}
      {phase === "assembled" && (
        <div style={{ flex: 1, animation: "fadeUp 0.5s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22C55E" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#22C55E", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Team assembled</span>
            <span style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>&middot; 3 agents &middot; ~12 credits/run</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {agents.map((agent, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                background: "rgba(255,255,255,0.6)", borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.03)",
                animation: "fadeUp 0.4s ease both", animationDelay: `${i * 0.1}s`,
              }}>
                {/* Flow position indicator */}
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>{i + 1}</span>
                  </div>
                  {i < 2 && <div style={{ width: 1, height: 8, background: "rgba(0,0,0,0.08)" }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 1 }}>{agent.name}</div>
                  <div style={{ fontSize: 12.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent.role}</div>
                </div>
                {/* Connection arrow (except last) */}
                {i < 2 && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                )}
              </div>
            ))}
          </div>

          <button style={{
            width: "100%", marginTop: 16, padding: "12px 0", borderRadius: 11,
            background: "#1A1A1A", color: "#FFF", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}
          >Activate Team &rarr;</button>
        </div>
      )}
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{
        background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16,
        padding: "26px 22px", height: "100%",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; }}
      onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon}
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>Step {number}</span>
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
        <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{description}</p>
      </div>
    </div>
  );
}

/* ─── Workflow Example Card ─── */
function WorkflowCard({ title, description, agents, credits, icon }: { title: string; description: string; agents: string[]; credits: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.5)", backdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.6)", borderRadius: 16,
      padding: "22px 20px", transition: "all 0.2s ease",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.04)"; e.currentTarget.style.background = "rgba(255,255,255,0.65)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(255,255,255,0.5)"; }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{title}</h4>
      </div>
      <p style={{ fontSize: 13, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.5, marginBottom: 14 }}>{description}</p>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 12 }}>
        {agents.map((a, i) => (
          <span key={i} style={{ fontSize: 11.5, fontWeight: 500, color: "#666", fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "3px 9px" }}>{a}</span>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>~{credits} credits/run</div>
    </div>
  );
}

/* ─── Integration Icon ─── */
function IntegrationIcon({ name }: { name: string }) {
  const c = "#AAA";
  const s = 20;
  const icons: Record<string, React.ReactNode> = {
    Gmail: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    Slack: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><rect x="8" y="2" width="3" height="8" rx="1.5"/><rect x="13" y="14" width="3" height="8" rx="1.5"/><rect x="14" y="8" width="8" height="3" rx="1.5"/><rect x="2" y="13" width="8" height="3" rx="1.5"/></svg>,
    Shopify: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M7 22V2l10 2v18l-10-2z"/><path d="M12 7v4"/></svg>,
    Stripe: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 10h20v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10z"/><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4H2V6z"/></svg>,
    HubSpot: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="4" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><line x1="12" y1="6" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="18"/></svg>,
    Notion: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>,
    GitHub: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
    Linear: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>,
    Intercom: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Zendesk: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M12 2L2 22h20L12 2z"/></svg>,
    Jira: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><path d="M12 2l-8.5 8.5a2.12 2.12 0 0 0 0 3l8.5 8.5 8.5-8.5a2.12 2.12 0 0 0 0-3L12 2z"/></svg>,
    Salesforce: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5"><circle cx="8" cy="14" r="4"/><circle cx="16" cy="10" r="5"/><circle cx="10" cy="8" r="3"/></svg>,
  };
  return (
    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 6, flexShrink: 0, width: 64 }}>
      {icons[name] || icons.Gmail}
      <span style={{ fontSize: 10, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>{name}</span>
    </div>
  );
}

/* ─── Main ─── */
export default function WorkflowAssemblerPage() {
  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @keyframes a1 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(4%,-6%) scale(1.06)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a2 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(-5%,5%) scale(1.05)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes a3 { 0%{transform:translate(0,0) scale(1)} 50%{transform:translate(7%,-4%) scale(1.08)} 100%{transform:translate(0,0) scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes navDropIn { from{opacity:0;transform:translateX(-50%) translateY(4px) scale(0.97)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
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
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 20 }}>Workflow Assembler</div>
          <h1 style={{ fontSize: 48, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.12, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 16 }}>
            Describe what you need.<br />We&apos;ll build the team.
          </h1>
          <p style={{ fontSize: 16.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 44px" }}>
            Write what you want to automate in plain language. The assembler analyzes your goal, selects the right agents from the marketplace, and wires them together into a ready-to-deploy workflow.
          </p>
        </section>

        {/* Interactive Demo */}
        <section style={{ maxWidth: 660, margin: "0 auto 64px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.1s" }}>
          <AssemblerDemo />
          <p style={{ textAlign: "center" as const, fontSize: 12, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginTop: 12 }}>Click the input to see it in action</p>
        </section>

        {/* How it works */}
        <section style={{ maxWidth: 900, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.15s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>How It Works</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>Three steps to automation</h2>
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const }}>
            <StepCard number="1" title="Describe your goal" description="Write what you want automated in plain English. No templates, no flowcharts. Just describe the outcome you want." icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} />
            <StepCard number="2" title="AI assembles your team" description="The assembler analyzes your workflow, selects the best agents from the marketplace, and connects them in the right order with proper data handoffs." icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83"/></svg>} />
            <StepCard number="3" title="Deploy with one click" description="Review the assembled team, see estimated credit cost per run, and activate. Your workflow starts processing immediately. No setup, no code." icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>} />
          </div>
        </section>

        {/* Example workflows */}
        <section style={{ maxWidth: 900, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 32 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Example Workflows</div>
            <h2 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>What people are assembling</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            <WorkflowCard
              title="Inbound Support Pipeline"
              description="Classify emails by urgency, draft contextual responses, escalate critical issues to Slack."
              agents={["Email Classifier", "Response Drafter", "Escalation Router"]}
              credits="12"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>}
            />
            <WorkflowCard
              title="Lead Qualification Flow"
              description="Score inbound leads, enrich contact data from LinkedIn, update CRM, flag hot prospects."
              agents={["Lead Scorer", "Data Enricher", "CRM Syncer"]}
              credits="25"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><polyline points="16 3 18 5 22 1"/></svg>}
            />
            <WorkflowCard
              title="Content Publishing Engine"
              description="Research keywords, write SEO-optimized posts, generate meta descriptions, schedule across channels."
              agents={["SEO Researcher", "Content Writer", "Social Scheduler"]}
              credits="55"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
            />
            <WorkflowCard
              title="Competitor Intelligence"
              description="Monitor competitor sites, track pricing changes, analyze social activity, deliver weekly digests."
              agents={["Web Monitor", "Price Tracker", "Report Generator"]}
              credits="40"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>}
            />
            <WorkflowCard
              title="Order Exception Handler"
              description="Monitor shipping status, detect delivery exceptions, notify customers proactively, trigger replacements."
              agents={["Order Tracker", "Notification Agent", "Replacement Router"]}
              credits="18"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>}
            />
            <WorkflowCard
              title="Bug Triage & Routing"
              description="Monitor error logs, deduplicate issues, assign severity, create tickets in Linear with context."
              agents={["Error Monitor", "Deduplicator", "Ticket Creator"]}
              credits="15"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
            />
          </div>
        </section>

        {/* Integrations */}
        <section style={{ maxWidth: 900, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.25s" }}>
          <div style={{ textAlign: "center" as const, marginBottom: 28 }}>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, color: "#AAA", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontFamily: "var(--font-body), 'DM Sans', sans-serif", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 8, padding: "6px 14px", marginBottom: 14 }}>Integrations</div>
            <h2 style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 6 }}>Connects to everything you use</h2>
            <p style={{ fontSize: 14, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>50+ integrations. Every assembled workflow can read, write, and trigger across your stack.</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.4)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 16, padding: "24px 0", overflow: "hidden", position: "relative" as const }}>
            <div style={{ position: "absolute" as const, left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, rgba(255,255,255,0.6), transparent)", zIndex: 2 }} />
            <div style={{ position: "absolute" as const, right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, rgba(255,255,255,0.6), transparent)", zIndex: 2 }} />
            <div style={{ display: "flex", gap: 28, animation: "marquee 30s linear infinite", width: "max-content" }}>
              {[...["Gmail", "Slack", "Shopify", "Stripe", "HubSpot", "Notion", "GitHub", "Linear", "Intercom", "Zendesk", "Jira", "Salesforce"], ...["Gmail", "Slack", "Shopify", "Stripe", "HubSpot", "Notion", "GitHub", "Linear", "Intercom", "Zendesk", "Jira", "Salesforce"]].map((name, i) => (
                <IntegrationIcon key={i} name={name} />
              ))}
            </div>
          </div>
        </section>

        {/* What makes it different */}
        <section style={{ maxWidth: 720, margin: "0 auto 72px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.28s" }}>
          <div style={{
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "36px 32px",
          }}>
            <h2 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em", marginBottom: 20, textAlign: "center" as const }}>Not another no-code builder</h2>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {[
                { title: "No flowcharts or decision trees", desc: "Other tools make you map every branch, condition, and edge case. The assembler handles orchestration logic for you. You describe the outcome, not the process." },
                { title: "Agents compose like Lego blocks", desc: "Each agent is a self-contained skill with defined inputs, outputs, and capabilities. The assembler snaps them together with correct data handoffs between steps." },
                { title: "Smart cost estimation upfront", desc: "Before you activate, you see exactly how many credits each run will cost. No surprise bills. Scale up workflows only when you're ready." },
                { title: "Improves with the marketplace", desc: "As creators publish better agents, your assembled workflows get access to upgrades. Swap in a higher-rated agent with one click." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "#1A1A1A", flexShrink: 0, marginTop: 7 }} />
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 3 }}>{item.title}</h4>
                    <p style={{ fontSize: 13.5, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 560, margin: "0 auto 72px", padding: "0 24px", textAlign: "center" as const, animation: "fadeUp 0.6s ease both", animationDelay: "0.32s" }}>
          <div style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 20, padding: "44px 36px" }}>
            <h3 style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", marginBottom: 10, letterSpacing: "-0.02em" }}>Try the assembler</h3>
            <p style={{ fontSize: 15, color: "#999", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 28, lineHeight: 1.55 }}>Describe any workflow. 500 free credits to start, no credit card needed.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/marketplace" style={{ fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.6)", padding: "12px 24px", borderRadius: 10, fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s ease" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.6)"; }}>Browse Agents</Link>
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
