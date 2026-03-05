import { useState, useEffect, useRef } from "react";

const AGENTS = [
  { name: "Order Tracker", desc: "Monitors Shopify orders, sends proactive shipping updates, handles delivery exceptions.", rating: 4.8, reviews: 445, rentals: "12k", price: "$19/mo", creator: "ShopHelper", featured: true },
  { name: "Slack Standup Bot", desc: "Collects async standups, summarizes blockers, and posts a daily digest to your channel.", rating: 4.4, reviews: 312, rentals: "8.7k", price: "Free", creator: "TeamFlow", featured: true },
  { name: "Meeting Scheduler", desc: "Coordinates team availability, suggests optimal times, and sends automated invites.", rating: 4.5, reviews: 198, rentals: "6.4k", price: "Free", creator: "CalBot", featured: false },
  { name: "Webhook Transformer", desc: "Catches webhooks, transforms payloads to your schema, and routes to the right service.", rating: 4.5, reviews: 203, rentals: "5.6k", price: "Free", creator: "UtilityAI", featured: false },
  { name: "SEO Content Writer", desc: "Researches keywords, writes optimized posts, and suggests internal linking strategy.", rating: 4.4, reviews: 267, rentals: "5.1k", price: "$29/mo", creator: "RankBot", featured: true },
  { name: "Invoice Processor", desc: "Extracts invoice data, matches to purchase orders, flags discrepancies, syncs with accounting.", rating: 4.7, reviews: 201, rentals: "4.1k", price: "$0.15/use", creator: "FinBot", featured: false },
  { name: "Social Content Creator", desc: "Generates branded social posts, schedules across platforms, and optimizes posting times.", rating: 4.5, reviews: 156, rentals: "3.2k", price: "$39/mo", creator: "ContentForge", featured: true },
  { name: "Code Review Assistant", desc: "Reviews pull requests for bugs, security issues, and style violations with inline suggestions.", rating: 4.6, reviews: 178, rentals: "2.9k", price: "$29/mo", creator: "DevToolsAI", featured: false },
  { name: "Churn Predictor", desc: "Analyzes usage patterns and engagement signals to flag at-risk customers.", rating: 4.6, reviews: 143, rentals: "2.7k", price: "$49/mo", creator: "RetentionIQ", featured: false },
  { name: "Smart Email Responder", desc: "Reads incoming emails, classifies intent, drafts contextual responses and routes complex cases.", rating: 4.6, reviews: 89, rentals: "2.3k", price: "$19/mo", creator: "MailBot Labs", featured: false },
  { name: "Lead Qualifier", desc: "Scores inbound leads on firmographics, engagement, and ICP match. Updates CRM automatically.", rating: 4.3, reviews: 134, rentals: "1.8k", price: "$49/mo", creator: "SalesAI Co", featured: false },
  { name: "Candidate Screener", desc: "Reviews resumes against requirements, scores candidates, generates shortlists.", rating: 4.2, reviews: 87, rentals: "1.1k", price: "$39/mo", creator: "HireAI", featured: false },
  { name: "Stripe Revenue Dashboard", desc: "Pulls live Stripe data, builds MRR charts, tracks churn, and sends weekly revenue digests.", rating: 4.7, reviews: 64, rentals: "890", price: "$19/mo", creator: "MetricBot", featured: false },
  { name: "Customer Feedback Sorter", desc: "Ingests reviews from G2, Trustpilot, and support tickets. Tags themes and sentiment automatically.", rating: 4.3, reviews: 41, rentals: "620", price: "$29/mo", creator: "FeedbackAI", featured: false },
  { name: "Contract Analyzer", desc: "Reads legal documents, extracts key terms, flags risky clauses, and generates plain-English summaries.", rating: 4.5, reviews: 112, rentals: "1.9k", price: "$39/mo", creator: "LegalLens", featured: false },
  { name: "Inventory Forecaster", desc: "Predicts stock levels based on sales velocity, seasonality, and supplier lead times.", rating: 4.4, reviews: 93, rentals: "1.5k", price: "$29/mo", creator: "StockSense", featured: false },
  { name: "Onboarding Workflow", desc: "Guides new hires through documents, intros, and setup tasks with automated check-ins.", rating: 4.3, reviews: 76, rentals: "980", price: "$19/mo", creator: "WelcomeBot", featured: false },
  { name: "Ad Copy Generator", desc: "Creates high-converting ad copy for Google, Meta, and LinkedIn campaigns from product URLs.", rating: 4.2, reviews: 189, rentals: "3.8k", price: "$29/mo", creator: "CopyEngine", featured: false },
  { name: "Bug Triage Bot", desc: "Monitors error logs, deduplicates issues, assigns severity, and routes to the right engineer.", rating: 4.6, reviews: 154, rentals: "2.4k", price: "Free", creator: "DebugHQ", featured: false },
  { name: "Expense Categorizer", desc: "Reads receipts and bank feeds, auto-categorizes expenses, and prepares tax-ready reports.", rating: 4.5, reviews: 221, rentals: "4.6k", price: "$19/mo", creator: "SpendBot", featured: false },
];

const AGENT_ICONS = {
  "Smart Email Responder": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
  "Code Review Assistant": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  "Social Content Creator": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  "Invoice Processor": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  "Slack Standup Bot": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  "Webhook Transformer": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  "Lead Qualifier": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  "SEO Content Writer": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  "Order Tracker": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  "Meeting Scheduler": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  "Candidate Screener": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  "Churn Predictor": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  "Stripe Revenue Dashboard": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  "Customer Feedback Sorter": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  "Contract Analyzer": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
  "Inventory Forecaster": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  "Onboarding Workflow": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  "Ad Copy Generator": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>,
  "Bug Triage Bot": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  "Expense Categorizer": (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
};

function AgentIcon({ name, size = 40 }) {
  const fn = AGENT_ICONS[name];
  return (
    <div style={{ width: size, height: size, borderRadius: 11, background: "#F3F3F3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {fn ? fn("#1A1A1A") : <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{name.charAt(0)}</span>}
    </div>
  );
}

function AgentCard({ agent, index }) {
  const [h, setH] = useState(false);
  const isFree = agent.price === "Free";
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.58)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.65)", borderRadius: 14,
      padding: "18px 18px 14px", cursor: "pointer",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: h ? "translateY(-2px)" : "translateY(0)",
      boxShadow: h ? "0 8px 28px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)",
      display: "flex", flexDirection: "column",
      animation: `cardIn 0.25s ease ${Math.min(index * 15, 300)}ms both`,
    }}>
      <div style={{ display: "flex", gap: 11, alignItems: "center", marginBottom: 8 }}>
        <AgentIcon name={agent.name} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 650, color: "#1A1A1A", letterSpacing: "-0.015em", margin: 0, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</h3>
          <span style={{ fontSize: 11, color: "#CCC" }}>{agent.creator}</span>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: "#999", lineHeight: 1.5, margin: "0 0 12px", flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{agent.desc}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={{ color: "#FBBF24", fontSize: 11 }}>★</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>{agent.rating}</span>
          <span style={{ fontSize: 11, color: "#D0D0D0" }}>·</span>
          <span style={{ fontSize: 11, color: "#CCC" }}>{agent.rentals}</span>
        </div>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: isFree ? "#059669" : "#1A1A1A",
        }}>{isFree ? "Free" : agent.price}</span>
      </div>
    </div>
  );
}

function FeaturedCard({ agent, index }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      background: h ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.65)", borderRadius: 16,
      padding: 22, cursor: "pointer", minWidth: 300, flex: "0 0 auto",
      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: h ? "translateY(-2px)" : "translateY(0)",
      boxShadow: h ? "0 8px 28px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.02)",
      animation: `cardIn 0.3s ease ${index * 40}ms both`,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <AgentIcon name={agent.name} size={44} />
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em", margin: 0 }}>{agent.name}</h3>
          <span style={{ fontSize: 12, color: "#BBB" }}>by {agent.creator}</span>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "#888", lineHeight: 1.55, margin: "0 0 16px", flex: 1 }}>{agent.desc}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#FBBF24", fontSize: 12 }}>★</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{agent.rating}</span>
          <span style={{ fontSize: 12, color: "#CCC" }}>({agent.reviews})</span>
          <span style={{ fontSize: 11, color: "#E0E0E0", margin: "0 2px" }}>·</span>
          <span style={{ fontSize: 12, color: "#CCC" }}>{agent.rentals} rentals</span>
        </div>
        <button style={{
          fontSize: 12.5, fontWeight: 600, color: "#FFF",
          background: agent.price === "Free" ? "#059669" : "#1A1A1A",
          border: "none", borderRadius: 8, padding: "7px 16px", cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >{agent.price === "Free" ? "Deploy" : agent.price}</button>
      </div>
    </div>
  );
}

function ConstellationBg() {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); let raf;
    const resize = () => { c.width = window.innerWidth * 1.5; c.height = window.innerHeight * 3; c.style.width = "100%"; c.style.height = "100%"; };
    resize(); window.addEventListener("resize", resize);
    if (!nodesRef.current.length) { for (let i = 0; i < 30; i++) nodesRef.current.push({ x: Math.random() * c.width, y: Math.random() * c.height, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, r: Math.random() * 0.8 + 0.3, pulse: Math.random() * Math.PI * 2, ps: Math.random() * 0.004 + 0.002 }); }
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height); const n = nodesRef.current;
      n.forEach(p => { p.x += p.vx; p.y += p.vy; p.pulse += p.ps; if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0; if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0; });
      for (let i = 0; i < n.length; i++) for (let j = i + 1; j < n.length; j++) { const d = Math.hypot(n[i].x - n[j].x, n[i].y - n[j].y); if (d < 120) { ctx.strokeStyle = `rgba(0,0,0,${(1 - d / 120) * 0.03})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(n[i].x, n[i].y); ctx.lineTo(n[j].x, n[j].y); ctx.stroke(); } }
      n.forEach(p => { const g = Math.sin(p.pulse) * 0.3 + 0.7; ctx.fillStyle = `rgba(0,0,0,${0.04 * g})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * g * 1.3, 0, Math.PI * 2); ctx.fill(); });
      raf = requestAnimationFrame(draw);
    }; draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 1, opacity: 0.4 }} />;
}

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sort, setSort] = useState("popular");

  const featured = AGENTS.filter(a => a.featured);
  const searchResults = search.trim() ? AGENTS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())) : [];

  const allSorted = [...AGENTS].sort((a, b) => {
    if (sort === "popular") return parseFloat(b.rentals) - parseFloat(a.rentals);
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price") { const p = (x) => x.price === "Free" ? 0 : parseFloat(x.price.replace(/[^0-9.]/g, "")); return p(a) - p(b); }
    return 0;
  });

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-sizing: border-box; }
        @keyframes a1 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(5%,-8%) scale(1.08); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes a2 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-6%,7%) scale(1.06); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes a3 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(9%,-6%) scale(1.1); } 100% { transform: translate(0,0) scale(1); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        ::selection { background: #1A1A1A; color: white; }
        input::placeholder { color: #C0C0C0; }
        ::-webkit-scrollbar { height: 0; width: 0; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, background: "#F2F3F6", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "60vw", height: "60vw", maxWidth: 800, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(255,160,140,0.25) 0%, transparent 60%)", animation: "a1 24s ease-in-out infinite", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", top: "20%", left: "-12%", width: "50vw", height: "50vw", maxWidth: 700, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(130,180,255,0.2) 0%, transparent 60%)", animation: "a2 30s ease-in-out infinite", filter: "blur(90px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "30%", width: "45vw", height: "45vw", maxWidth: 600, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(180,160,255,0.15) 0%, transparent 60%)", animation: "a3 27s ease-in-out infinite", filter: "blur(90px)" }} />
        <ConstellationBg />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, backgroundSize: "32px 32px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 5 }}>
        {/* Nav */}
        <nav style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 28px",
          background: "rgba(255,255,255,0.35)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
          borderBottom: "1px solid rgba(255,255,255,0.45)", position: "sticky", top: 0, zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Agent Spark</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button style={{ fontSize: 13.5, fontWeight: 500, color: "#555", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.6)", padding: "8px 16px", borderRadius: 9, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.color = "#333"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.45)"; e.currentTarget.style.color = "#555"; }}
            >← Home</button>
            <button style={{ fontSize: 13.5, fontWeight: 600, color: "#FFF", background: "#1A1A1A", border: "none", padding: "8px 18px", borderRadius: 9, cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#333"} onMouseLeave={(e) => e.currentTarget.style.background = "#1A1A1A"}
            >Dashboard</button>
          </div>
        </nav>

        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "28px 24px 80px" }}>

          {/* Header + search */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.04em", margin: "0 0 4px" }}>Marketplace</h1>
              <p style={{ fontSize: 14.5, color: "#AAA", margin: 0 }}>{AGENTS.length} agents available</p>
            </div>
            <div style={{ position: "relative", width: 340 }}>
              <div style={{
                display: "flex", alignItems: "center",
                background: "rgba(255,255,255,0.55)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
                borderRadius: 11, padding: "0 12px",
                border: searchFocused ? "1.5px solid rgba(0,0,0,0.1)" : "1.5px solid rgba(255,255,255,0.7)",
                transition: "all 0.2s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 8 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder="Search agents..."
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 13.5, background: "transparent", color: "#1A1A1A", padding: "10px 0" }} />
                {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#CCC", cursor: "pointer", fontSize: 15, padding: "0 2px" }}>×</button>}
              </div>
              {search.trim() && searchResults.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "rgba(255,255,255,0.88)", backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.7)", borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.08)", padding: 4, zIndex: 30, maxHeight: 320, overflowY: "auto",
                }}>
                  {searchResults.map((a) => (
                    <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <AgentIcon name={a.name} size={30} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: "#BBB" }}>{a.creator}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: a.price === "Free" ? "#059669" : "#1A1A1A" }}>{a.price}</span>
                    </div>
                  ))}
                </div>
              )}
              {search.trim() && searchResults.length === 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "rgba(255,255,255,0.88)", backdropFilter: "blur(24px)",
                  border: "1px solid rgba(255,255,255,0.7)", borderRadius: 12,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.08)", padding: "16px 14px", zIndex: 30, textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, color: "#AAA", margin: "0 0 8px" }}>No results for "{search}"</p>
                  <button style={{ fontSize: 12.5, fontWeight: 600, color: "#FFF", background: "#1A1A1A", border: "none", borderRadius: 7, padding: "7px 16px", cursor: "pointer" }}>Ask AI to build this →</button>
                </div>
              )}
            </div>
          </div>

          {/* Featured row */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em", margin: "0 0 12px" }}>Featured</h2>
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {featured.map((a, i) => <FeaturedCard key={a.name} agent={a} index={i} />)}
            </div>
          </div>

          {/* All agents grid */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", letterSpacing: "-0.02em", margin: 0 }}>All agents</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.45)", borderRadius: 8, padding: "4px 8px" }}>
                {["popular", "rating", "price"].map((s) => (
                  <button key={s} onClick={() => setSort(s)} style={{
                    fontSize: 12, fontWeight: sort === s ? 600 : 400, color: sort === s ? "#1A1A1A" : "#BBB",
                    background: sort === s ? "rgba(255,255,255,0.6)" : "transparent",
                    border: "none", borderRadius: 5, padding: "3px 8px", cursor: "pointer", textTransform: "capitalize", transition: "all 0.12s",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
              {allSorted.map((a, i) => <AgentCard key={a.name} agent={a} index={i} />)}
            </div>
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 40,
            background: "rgba(255,255,255,0.45)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.55)", borderRadius: 16,
            padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 750, color: "#1A1A1A", letterSpacing: "-0.02em", margin: "0 0 3px" }}>Need something specific?</h3>
              <p style={{ fontSize: 13.5, color: "#AAA", margin: 0 }}>Describe your goal and AI will assemble a custom team.</p>
            </div>
            <button style={{
              fontSize: 13.5, fontWeight: 600, color: "#FFF", background: "#1A1A1A",
              border: "none", padding: "11px 22px", borderRadius: 10, cursor: "pointer",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}
            >Ask AI →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
