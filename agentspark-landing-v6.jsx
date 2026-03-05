import { useState, useEffect, useRef, useMemo } from "react";

const SUGGESTIONS = [
  "Start a cookie business",
  "Automate my Shopify returns",
  "Launch & grow a newsletter",
  "Manage bookkeeping & invoicing",
  "Build a content calendar",
  "Research my competitors",
];

const INTEGRATIONS = [
  { name: "Gmail", letter: "M", color: "#EA4335" },
  { name: "Shopify", letter: "S", color: "#96BF48" },
  { name: "Slack", letter: "#", color: "#E01E5A" },
  { name: "Notion", letter: "N", color: "#000000" },
  { name: "Stripe", letter: "S", color: "#635BFF" },
  { name: "HubSpot", letter: "H", color: "#FF7A59" },
  { name: "Sheets", letter: "G", color: "#34A853" },
  { name: "Calendar", letter: "C", color: "#4285F4" },
  { name: "Airtable", letter: "A", color: "#18BFFF" },
  { name: "Zapier", letter: "Z", color: "#FF4A00" },
  { name: "Gmail", letter: "M", color: "#EA4335" },
  { name: "Shopify", letter: "S", color: "#96BF48" },
  { name: "Slack", letter: "#", color: "#E01E5A" },
  { name: "Notion", letter: "N", color: "#000000" },
  { name: "Stripe", letter: "S", color: "#635BFF" },
  { name: "HubSpot", letter: "H", color: "#FF7A59" },
  { name: "Sheets", letter: "G", color: "#34A853" },
  { name: "Calendar", letter: "C", color: "#4285F4" },
  { name: "Airtable", letter: "A", color: "#18BFFF" },
  { name: "Zapier", letter: "Z", color: "#FF4A00" },
];

const MOCK_TEAM = [
  { name: "Business Plan Pro", role: "Writes your full business plan with market analysis", stats: { speed: 87, accuracy: 92, reliability: 94 }, price: "$29", icon: "📋" },
  { name: "Market Researcher", role: "Analyzes competitors, trends, and target demographics", stats: { speed: 78, accuracy: 88, reliability: 91 }, price: "$19", icon: "📊" },
  { name: "Financial Modeler", role: "Builds revenue projections and cost breakdowns", stats: { speed: 82, accuracy: 95, reliability: 93 }, price: "$39", icon: "💰" },
  { name: "Brand Builder", role: "Creates brand identity, naming, and positioning", stats: { speed: 91, accuracy: 84, reliability: 88 }, price: "$19", icon: "🎨" },
];

/* ── Constellation Network ── */
function ConstellationField() {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth * 1.5;
      canvas.height = window.innerHeight * 1.5;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    resize();
    window.addEventListener("resize", resize);

    if (nodesRef.current.length === 0) {
      for (let i = 0; i < 55; i++) {
        nodesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.2 + 0.4,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.008 + 0.003,
        });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nodes = nodesRef.current;

      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += n.pulseSpeed;
        if (n.x < 0) n.x = canvas.width;
        if (n.x > canvas.width) n.x = 0;
        if (n.y < 0) n.y = canvas.height;
        if (n.y > canvas.height) n.y = 0;
      });

      // Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.06;
            ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Dots
      nodes.forEach((n) => {
        const glow = Math.sin(n.pulse) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0,0,0,${0.08 * glow})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * glow * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 2, opacity: 0.7 }} />;
}

/* ── Stat bar ── */
function StatDot({ value }) {
  return (
    <div style={{ width: 36, height: 2.5, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${value}%`, height: "100%", background: "#1A1A1A", borderRadius: 2, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" }} />
    </div>
  );
}

/* ── Agent card with holographic border ── */
function AgentTeamCard({ agent, index, visible }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 100 + 100}ms`,
        position: "relative",
        borderRadius: 14,
        padding: 1,
        background: hovered
          ? "linear-gradient(135deg, rgba(255,180,160,0.3), rgba(150,190,255,0.3), rgba(190,170,255,0.3), rgba(140,230,220,0.3))"
          : "rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderRadius: 13, padding: "16px 18px",
        display: "flex", gap: 14, alignItems: "flex-start",
        transition: "background 0.3s",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.9)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0,
        }}>{agent.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#1A1A1A", letterSpacing: "-0.01em" }}>{agent.name}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{agent.price}<span style={{ fontWeight: 400, color: "#ABABAB", fontSize: 11 }}>/mo</span></span>
          </div>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.45, margin: "0 0 8px" }}>{agent.role}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {[["SPD", agent.stats.speed], ["ACC", agent.stats.accuracy], ["REL", agent.stats.reliability]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9.5, color: "#BBB", letterSpacing: "0.05em" }}>{l}</span>
                <StatDot value={v} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Integration strip ── */
function IntegrationStrip() {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(255,255,255,0.5)",
      backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
      borderTop: "1px solid rgba(255,255,255,0.5)",
      padding: "16px 0 18px", zIndex: 50,
    }}>
      <div style={{
        display: "flex", overflow: "hidden",
        maskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}>
        <div style={{ display: "flex", gap: 28, animation: "drift 30s linear infinite", willChange: "transform" }}>
          {INTEGRATIONS.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0, opacity: 0.35, transition: "opacity 0.3s" }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: item.color + "14",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: item.color,
              }}>{item.letter}</div>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: "#1A1A1A", whiteSpace: "nowrap" }}>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function AgentSparkLanding() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("idle");
  const [showTeam, setShowTeam] = useState(false);
  const inputRef = useRef(null);
  const contentRef = useRef(null);
  const totalPrice = MOCK_TEAM.reduce((s, a) => s + parseInt(a.price.replace(/\D/g, "")), 0);

  const fire = (text) => { if (text) setQuery(text); setPhase("thinking"); setTimeout(() => { setPhase("assembled"); setTimeout(() => setShowTeam(true), 150); }, 2200); };
  const reset = () => { setQuery(""); setPhase("idle"); setShowTeam(false); inputRef.current?.focus(); };

  useEffect(() => {
    if (phase === "assembled" && contentRef.current) contentRef.current.scrollTo({ top: contentRef.current.scrollHeight, behavior: "smooth" });
  }, [phase, showTeam]);

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }

        @keyframes drift { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPulse { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; } 40% { transform: scale(1); opacity: 0.8; } }

        @keyframes aurora1 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          20%  { transform: translate(5%, -8%) rotate(6deg) scale(1.08); }
          40%  { transform: translate(-3%, -12%) rotate(-4deg) scale(0.96); }
          60%  { transform: translate(8%, -2%) rotate(10deg) scale(1.04); }
          80%  { transform: translate(-2%, 6%) rotate(-6deg) scale(0.98); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes aurora2 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          25%  { transform: translate(-6%, 7%) rotate(-8deg) scale(1.06); }
          50%  { transform: translate(4%, 10%) rotate(5deg) scale(0.94); }
          75%  { transform: translate(-7%, -3%) rotate(-10deg) scale(1.02); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes aurora3 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          33%  { transform: translate(9%, -6%) rotate(12deg) scale(1.1); }
          66%  { transform: translate(-5%, 8%) rotate(-7deg) scale(0.92); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }
        @keyframes aurora4 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-4%, -6%) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes aurora5 {
          0%   { transform: translate(0, 0) rotate(0deg) scale(1); }
          30%  { transform: translate(6%, 5%) rotate(8deg) scale(0.95); }
          70%  { transform: translate(-8%, -4%) rotate(-6deg) scale(1.06); }
          100% { transform: translate(0, 0) rotate(0deg) scale(1); }
        }

        @keyframes scanBeam {
          0%   { transform: translateY(-100vh) rotate(-2deg); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(100vh) rotate(-2deg); opacity: 0; }
        }
        @keyframes scanBeam2 {
          0%   { transform: translateX(-100vw) rotate(88deg); opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateX(100vw) rotate(88deg); opacity: 0; }
        }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        ::selection { background: #1A1A1A; color: white; }
        input::placeholder { color: #C0C0C0; }
      `}</style>

      {/* ═══ BACKGROUND SYSTEM ═══ */}
      <div style={{ position: "fixed", inset: 0, background: "#F2F3F6", zIndex: 0 }}>

        {/* Aurora 1 — warm coral/rose — top right */}
        <div style={{
          position: "absolute", top: "-18%", right: "-12%",
          width: "70vw", height: "70vw", maxWidth: 950, maxHeight: 950, borderRadius: "50%",
          background: "radial-gradient(ellipse at 40% 45%, rgba(255,160,140,0.35) 0%, rgba(255,130,110,0.12) 30%, transparent 60%)",
          animation: "aurora1 24s ease-in-out infinite", filter: "blur(90px)",
        }} />

        {/* Aurora 2 — ocean blue — left */}
        <div style={{
          position: "absolute", top: "10%", left: "-15%",
          width: "60vw", height: "60vw", maxWidth: 800, maxHeight: 800, borderRadius: "50%",
          background: "radial-gradient(ellipse at 55% 50%, rgba(130,180,255,0.3) 0%, rgba(100,160,250,0.1) 30%, transparent 60%)",
          animation: "aurora2 30s ease-in-out infinite", filter: "blur(90px)",
        }} />

        {/* Aurora 3 — violet — bottom center */}
        <div style={{
          position: "absolute", bottom: "-12%", left: "20%",
          width: "55vw", height: "55vw", maxWidth: 750, maxHeight: 750, borderRadius: "50%",
          background: "radial-gradient(ellipse at 50% 40%, rgba(180,160,255,0.25) 0%, rgba(160,140,240,0.08) 30%, transparent 60%)",
          animation: "aurora3 27s ease-in-out infinite", filter: "blur(90px)",
        }} />

        {/* Aurora 4 — emerald/teal — right mid */}
        <div style={{
          position: "absolute", top: "35%", right: "10%",
          width: "40vw", height: "40vw", maxWidth: 520, maxHeight: 520, borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(120,220,210,0.18) 0%, rgba(100,200,190,0.05) 35%, transparent 60%)",
          animation: "aurora4 22s ease-in-out infinite", filter: "blur(80px)",
        }} />

        {/* Aurora 5 — warm gold accent — bottom right */}
        <div style={{
          position: "absolute", bottom: "10%", right: "25%",
          width: "30vw", height: "30vw", maxWidth: 400, maxHeight: 400, borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(255,210,140,0.12) 0%, rgba(255,190,120,0.04) 35%, transparent 60%)",
          animation: "aurora5 35s ease-in-out infinite", filter: "blur(70px)",
        }} />

        {/* Scanning beams — slow vertical + horizontal sweeps */}
        <div style={{
          position: "absolute", left: "30%", top: 0, width: "40vw", height: 1,
          background: "linear-gradient(90deg, transparent 0%, rgba(130,180,255,0.06) 20%, rgba(255,160,140,0.06) 50%, rgba(180,160,255,0.06) 80%, transparent 100%)",
          animation: "scanBeam 16s linear infinite", filter: "blur(0.5px)", zIndex: 1,
        }} />
        <div style={{
          position: "absolute", top: "20%", left: 0, height: "60vh", width: 1,
          background: "linear-gradient(180deg, transparent 0%, rgba(120,220,210,0.05) 25%, rgba(180,160,255,0.05) 75%, transparent 100%)",
          animation: "scanBeam2 22s linear infinite", animationDelay: "-6s", filter: "blur(0.5px)", zIndex: 1,
        }} />

        {/* Constellation canvas */}
        <ConstellationField />

        {/* Chromatic edge glow — top */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(255,160,140,0.15) 15%, rgba(130,180,255,0.15) 35%, rgba(180,160,255,0.15) 55%, rgba(120,220,210,0.15) 75%, rgba(255,210,140,0.15) 90%, transparent 100%)",
          filter: "blur(2px)", zIndex: 3,
        }} />

        {/* Dot grid */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 3,
          backgroundSize: "32px 32px",
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
        }} />

        {/* Noise */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 4, opacity: 0.35, mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }} />

        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 5,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(242,243,246,0.5) 100%)",
        }} />
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 28px",
          background: "rgba(255,255,255,0.35)",
          backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          borderBottom: "1px solid rgba(255,255,255,0.45)",
          boxShadow: "0 1px 12px rgba(0,0,0,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Agent Spark</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={{ fontSize: 14, fontWeight: 500, color: "#777", background: "transparent", border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}>Pricing</button>
            <button style={{
              fontSize: 14, fontWeight: 500, color: "#555",
              background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)",
              padding: "9px 18px", borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
              backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.color = "#333"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.45)"; e.currentTarget.style.color = "#555"; }}
            >Browse Marketplace</button>
            <button style={{
              fontSize: 14, fontWeight: 600, color: "#FFF", background: "#1A1A1A",
              border: "none", padding: "9px 20px", borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#333"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#1A1A1A"}
            >Dashboard</button>
          </div>
        </nav>

        {/* Main */}
        <div ref={contentRef} style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: phase === "idle" ? "center" : "flex-start",
          padding: phase === "idle" ? "0 24px" : "48px 24px 0",
          paddingBottom: 90, overflowY: "auto",
          transition: "padding 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>

          <div style={{ textAlign: "center", marginBottom: phase === "idle" ? 32 : 24, transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)", maxWidth: 620 }}>
            {phase === "idle" ? (
              <>
                <h1 style={{ fontSize: 54, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.04em", lineHeight: 1.08, margin: "0 0 16px" }}>
                  AI agents that<br />work for you
                </h1>
                <p style={{ fontSize: 17, color: "#999", fontWeight: 400, margin: 0, lineHeight: 1.55 }}>
                  Describe what you need. We'll assemble a team of<br />AI agents and put them to work.
                </p>
              </>
            ) : (
              <p style={{ fontSize: 16, fontWeight: 500, color: "#999", margin: 0, animation: "fadeUp 0.3s ease" }}>{query}</p>
            )}
          </div>

          {/* Input — holographic shimmer border on focus */}
          {phase === "idle" && (
            <div style={{ width: "100%", maxWidth: 520, marginBottom: 20, animation: "fadeUp 0.5s ease 0.05s both" }}>
              <div style={{ borderRadius: 15, padding: 1.5, background: "rgba(0,0,0,0.04)", transition: "all 0.3s" }}
                onFocus={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,160,140,0.25), rgba(130,180,255,0.25), rgba(180,160,255,0.25), rgba(120,220,210,0.25))";
                  e.currentTarget.style.backgroundSize = "300% 300%";
                  e.currentTarget.style.animation = "shimmer 3s linear infinite";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.animation = "none";
                }}
              >
                <div style={{
                  display: "flex", alignItems: "center",
                  background: "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  borderRadius: 13.5, padding: "4px 5px 4px 20px",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
                }}>
                  <input ref={inputRef} type="text" value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && query.trim() && fire()}
                    placeholder="I want to start a cookie business..."
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 400, color: "#1A1A1A", background: "transparent", padding: "13px 0" }}
                  />
                  <button onClick={() => query.trim() && fire()} style={{
                    width: 40, height: 40, borderRadius: 10, border: "none",
                    background: query.trim() ? "#1A1A1A" : "rgba(0,0,0,0.06)",
                    color: "#FFF", cursor: query.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", flexShrink: 0,
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 540, animation: "fadeUp 0.5s ease 0.15s both" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => fire(s)} style={{
                  fontSize: 13, fontWeight: 450, color: "#999",
                  background: "rgba(255,255,255,0.4)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.55)", borderRadius: 20, padding: "7px 15px", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.6)"; e.currentTarget.style.color = "#555"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "#999"; }}
                >{s}</button>
              ))}
            </div>
          )}

          {phase === "thinking" && (
            <div style={{ animation: "fadeUp 0.3s ease", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map((i) => (<div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A1A1A", animation: `dotPulse 1.4s ease-in-out ${i * 0.16}s infinite` }} />))}
              </div>
              <span style={{ fontSize: 13, color: "#BBB", fontWeight: 450 }}>Assembling your team...</span>
            </div>
          )}

          {phase === "assembled" && (
            <div style={{ width: "100%", maxWidth: 500, animation: "fadeUp 0.4s ease" }}>
              <div style={{
                background: "rgba(255,255,255,0.38)",
                backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: 18, padding: 22, marginBottom: 14,
                boxShadow: "0 8px 48px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Your AI Team</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 500, color: "#AAA", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 6, padding: "3px 9px" }}>4 agents</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {MOCK_TEAM.map((a, i) => <AgentTeamCard key={i} agent={a} index={i} visible={showTeam} />)}
                </div>
                <div style={{
                  marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.04)",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  opacity: showTeam ? 1 : 0, transform: showTeam ? "translateY(0)" : "translateY(6px)",
                  transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 500ms",
                }}>
                  <div>
                    <span style={{ fontSize: 12, color: "#BBB", display: "block", marginBottom: 1 }}>Estimated total</span>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>${totalPrice}<span style={{ fontSize: 13, fontWeight: 400, color: "#BBB" }}>/mo</span></span>
                  </div>
                  <button style={{
                    fontSize: 14, fontWeight: 600, color: "#FFF", background: "#1A1A1A",
                    border: "none", padding: "13px 28px", borderRadius: 12, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >Activate Team →</button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, opacity: showTeam ? 1 : 0, transition: "opacity 0.4s ease 600ms" }}>
                <button onClick={reset} style={{ fontSize: 13, color: "#BBB", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0", transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#888"} onMouseLeave={(e) => e.currentTarget.style.color = "#BBB"}>← Try another goal</button>
                <span style={{ color: "#E0E0E0" }}>·</span>
                <button style={{ fontSize: 13, color: "#BBB", background: "transparent", border: "none", cursor: "pointer", padding: "8px 0", transition: "color 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#888"} onMouseLeave={(e) => e.currentTarget.style.color = "#BBB"}>Browse marketplace →</button>
              </div>
            </div>
          )}

          {phase === "idle" && (
            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 6, animation: "fadeUp 0.5s ease 0.25s both" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              <span style={{ fontSize: 13, color: "#BBB", fontWeight: 450 }}>No credit card required</span>
            </div>
          )}
        </div>
      </div>

      <IntegrationStrip />
    </div>
  );
}
