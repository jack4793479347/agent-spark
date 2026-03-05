'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth';
import {
  type TeamAgent,
  assembleWorkflow,
  recommendedAgentToTeam,
  formatTotalCents,
  rentAgent,
  createTeamCheckout,
} from '@/lib/api';

/* ─── Globe renderer ─── */
function latLngToXYZ(lat: number, lng: number, r: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return [-(r * Math.sin(phi) * Math.cos(theta)), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}
function rotY(x: number, y: number, z: number, a: number): [number, number, number] { const c = Math.cos(a), s = Math.sin(a); return [x*c+z*s, y, -x*s+z*c]; }
function rotX(x: number, y: number, z: number, a: number): [number, number, number] { const c = Math.cos(a), s = Math.sin(a); return [x, y*c-z*s, y*s+z*c]; }
function proj(x: number, y: number, z: number, cx: number, cy: number, f: number): [number, number, number] { const s = f/(f+z); return [x*s+cx, y*s+cy, z]; }

const MARKERS = [
  { lat: 37.78, lng: -122.42 }, { lat: 51.51, lng: -0.13 }, { lat: 35.68, lng: 139.69 },
  { lat: -33.87, lng: 151.21 }, { lat: 1.35, lng: 103.82 }, { lat: 55.76, lng: 37.62 },
  { lat: -23.55, lng: -46.63 }, { lat: 19.43, lng: -99.13 }, { lat: 28.61, lng: 77.21 },
];
const CONNS: [number, number][][] = [
  [[37.78,-122.42],[51.51,-0.13]], [[51.51,-0.13],[35.68,139.69]], [[35.68,139.69],[-33.87,151.21]],
  [[37.78,-122.42],[1.35,103.82]], [[51.51,-0.13],[28.61,77.21]], [[37.78,-122.42],[-23.55,-46.63]],
  [[1.35,103.82],[-33.87,151.21]], [[28.61,77.21],[55.76,37.62]],
];

function Globe({ size = 520 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ry = useRef<number>(0.4);
  const rx = useRef<number>(0.25);
  const time = useRef<number>(0);
  const dots = useRef<number[][]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    const d: number[][] = []; const gr = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < 1000; i++) {
      const t = (2 * Math.PI * i) / gr;
      const p = Math.acos(1 - (2 * (i + 0.5)) / 1000);
      d.push([Math.cos(t)*Math.sin(p), Math.cos(p), Math.sin(t)*Math.sin(p)]);
    }
    dots.current = d;
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr);
    const cxc = w/2, cyc = h/2, r = Math.min(w,h)*0.4, fov = 600;
    ry.current += 0.0015; time.current += 0.012;
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createRadialGradient(cxc, cyc, r*0.5, cxc, cyc, r*1.4);
    g.addColorStop(0, "rgba(0,0,0,0.012)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    ctx.beginPath(); ctx.arc(cxc, cyc, r, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(0,0,0,0.04)"; ctx.lineWidth = 1; ctx.stroke();

    const RY = ry.current, RX = rx.current;

    for (const [dx,dy,dz] of dots.current) {
      let [x,y,z] = [dx*r, dy*r, dz*r];
      [x,y,z] = rotX(x,y,z,RX); [x,y,z] = rotY(x,y,z,RY);
      if (z > 0) continue;
      const [sx,sy] = proj(x,y,z,cxc,cyc,fov);
      const a = Math.max(0.08, 1-(z+r)/(2*r));
      ctx.beginPath(); ctx.arc(sx,sy, 0.7+a*0.5, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,0,0,${(a*0.22).toFixed(2)})`; ctx.fill();
    }

    for (const [[lat1,lng1],[lat2,lng2]] of CONNS) {
      let [x1,y1,z1] = latLngToXYZ(lat1,lng1,r);
      let [x2,y2,z2] = latLngToXYZ(lat2,lng2,r);
      [x1,y1,z1] = rotX(x1,y1,z1,RX); [x1,y1,z1] = rotY(x1,y1,z1,RY);
      [x2,y2,z2] = rotX(x2,y2,z2,RX); [x2,y2,z2] = rotY(x2,y2,z2,RY);
      if (z1>r*0.3 && z2>r*0.3) continue;
      const [sx1,sy1] = proj(x1,y1,z1,cxc,cyc,fov);
      const [sx2,sy2] = proj(x2,y2,z2,cxc,cyc,fov);
      const mx=(x1+x2)/2, my=(y1+y2)/2, mz=(z1+z2)/2;
      const ml = Math.sqrt(mx*mx+my*my+mz*mz);
      const [scx,scy] = proj(mx/ml*(r*1.2), my/ml*(r*1.2), mz/ml*(r*1.2), cxc, cyc, fov);
      ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.quadraticCurveTo(scx,scy,sx2,sy2);
      ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 0.8; ctx.stroke();
      const t = (Math.sin(time.current*1.2+lat1*0.1)+1)/2;
      const tx = (1-t)*(1-t)*sx1+2*(1-t)*t*scx+t*t*sx2;
      const ty = (1-t)*(1-t)*sy1+2*(1-t)*t*scy+t*t*sy2;
      ctx.beginPath(); ctx.arc(tx,ty,1.5,0,Math.PI*2);
      ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fill();
    }

    for (const m of MARKERS) {
      let [x,y,z] = latLngToXYZ(m.lat,m.lng,r);
      [x,y,z] = rotX(x,y,z,RX); [x,y,z] = rotY(x,y,z,RY);
      if (z > r*0.1) continue;
      const [sx,sy] = proj(x,y,z,cxc,cyc,fov);
      const pulse = Math.sin(time.current*2+m.lat)*0.5+0.5;
      ctx.beginPath(); ctx.arc(sx,sy,3+pulse*3,0,Math.PI*2);
      ctx.strokeStyle = `rgba(0,0,0,${(0.04+pulse*0.03).toFixed(2)})`;
      ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(sx,sy,2,0,Math.PI*2);
      ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fill();
    }

    raf.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => { raf.current = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf.current); }, [draw]);
  return <canvas ref={canvasRef} style={{ width: size, height: size }} />;
}

/* ─── Integration icon SVGs ─── */
function IntegrationIcon({ name, size = 20 }: { name: string; size?: number }) {
  const icons: Record<string, (c: string) => React.ReactNode> = {
    Gmail: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    Slack: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/><path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/><path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/><path d="M14 20.5c0-.83.67-1.5 1.5-1.5h0c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h0c-.83 0-1.5-.67-1.5-1.5z" transform="rotate(90 15.5 20.5)"/><path d="M10 9.5C10 10.33 9.33 11 8.5 11h-5C2.67 11 2 10.33 2 9.5S2.67 8 3.5 8h5c.83 0 1.5.67 1.5 1.5z"/></svg>,
    Shopify: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    Stripe: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    HubSpot: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M4.22 19.78l2.83-2.83"/><path d="M16.95 7.05l2.83-2.83"/></svg>,
    Notion: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
    GitHub: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>,
    Linear: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    Intercom: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Zendesk: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    Jira: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
    Salesforce: (c) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>,
  };
  const render = icons[name];
  return render ? <>{render("#BBB")}</> : null;
}

/* ─── Data ─── */
const SUGGESTIONS = ["Start a cookie business", "Automate my Shopify returns", "Launch & grow a newsletter", "Manage bookkeeping & invoicing", "Build a content calendar", "Research my competitors"];

interface MockAgent {
  name: string;
  desc: string;
  iconLetter: string;
  price: string;
  stats: { spd: number; acc: number; rel: number };
}

const MOCK_TEAM: MockAgent[] = [
  { name: "Order Tracker", desc: "Monitors orders, sends proactive shipping updates, handles delivery exceptions.", price: "$19/mo", iconLetter: "O", stats: { spd: 92, acc: 88, rel: 95 } },
  { name: "Smart Email Responder", desc: "Reads incoming emails, classifies intent, drafts contextual responses.", price: "$19/mo", iconLetter: "E", stats: { spd: 85, acc: 91, rel: 89 } },
  { name: "SEO Content Writer", desc: "Researches keywords, writes optimized posts, suggests internal linking.", price: "$29/mo", iconLetter: "S", stats: { spd: 78, acc: 86, rel: 90 } },
  { name: "Social Content Creator", desc: "Generates branded posts, schedules across platforms, optimizes timing.", price: "$39/mo", iconLetter: "C", stats: { spd: 88, acc: 84, rel: 87 } },
];
const INTEGRATION_NAMES = ["Gmail", "Slack", "Shopify", "Stripe", "HubSpot", "Notion", "GitHub", "Linear", "Intercom", "Zendesk", "Jira", "Salesforce"];

/* ─── Stat Bar ─── */
function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 10, color: "#BBB", width: 24, fontWeight: 600 }}>{label}</span>
      <div style={{ width: 32, height: 2.5, background: "rgba(0,0,0,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: "#1A1A1A", borderRadius: 2, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

/* ─── Agent Card ─── */
function AgentCard({ agent, index }: { agent: MockAgent; index: number }) {
  const [visible, setVisible] = useState<boolean>(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100 + index * 120); return () => clearTimeout(t); }, [index]);
  return (
    <div style={{
      display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14,
      background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.7)",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: "#F3F3F3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "#1A1A1A", flexShrink: 0 }}>{agent.iconLetter}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 650, color: "#1A1A1A" }}>{agent.name}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{agent.price}</span>
        </div>
        <p style={{ fontSize: 12.5, color: "#888", lineHeight: 1.5, margin: "0 0 8px" }}>{agent.desc}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <StatBar label="SPD" value={agent.stats.spd} />
          <StatBar label="ACC" value={agent.stats.acc} />
          <StatBar label="REL" value={agent.stats.rel} />
        </div>
      </div>
    </div>
  );
}

/* ─── Tab Icons (monochrome SVGs) ─── */
function TabIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#1A1A1A" : "#BBB";
  const icons: Record<string, React.ReactNode> = {
    email: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    sales: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    content: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    ops: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12.01"/></svg>,
    code: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  };
  return <>{icons[id] || null}</>;
}

/* ─── Per-Agent Custom Visuals ─── */
function EmailVisual({ hovered, color }: { hovered: boolean; color: string }) {
  return (
    <div style={{ position: "relative", width: "100%", height: 150, overflow: "hidden", borderRadius: "16px 16px 0 0", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 1, backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.025) 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 50%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, black 50%, transparent 100%)" }} />
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 50% 80%, ${color}12 0%, transparent 70%)` }} />
      <svg width="100%" height="100%" viewBox="0 0 620 150" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", zIndex: 2, display: "block" }}>
        <defs>
          <linearGradient id="emailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={hovered
          ? "M0,120 C40,100 80,60 140,72 C200,84 230,42 310,38 C390,34 440,58 500,50 C560,42 600,28 620,22 V150 H0 Z"
          : "M0,108 C40,102 80,96 140,98 C200,100 230,88 310,85 C390,82 440,90 500,88 C560,86 600,82 620,80 V150 H0 Z"
        } fill="url(#emailFill)" style={{ transition: "d 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <path d={hovered
          ? "M0,120 C40,100 80,60 140,72 C200,84 230,42 310,38 C390,34 440,58 500,50 C560,42 600,28 620,22"
          : "M0,108 C40,102 80,96 140,98 C200,100 230,88 310,85 C390,82 440,90 500,88 C560,86 600,82 620,80"
        } fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" style={{ transition: "d 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        {[80, 200, 310, 430, 550].map((x, i) => {
          const baseY = hovered ? [68, 62, 38, 52, 34][i] : [98, 94, 85, 89, 84][i];
          return <g key={i} style={{ transition: "all 0.5s ease", transitionDelay: `${i * 50}ms` }}>
            <rect x={x - 9} y={baseY - 6} width={18} height={12} rx={2} fill="white" stroke={color} strokeWidth={hovered ? 1.2 : 0.8} opacity={hovered ? 0.9 : 0.25} style={{ transition: "all 0.4s ease" }} />
            <polyline points={`${x - 8},${baseY - 5} ${x},${baseY + 1} ${x + 8},${baseY - 5}`} fill="none" stroke={color} strokeWidth={hovered ? 1 : 0.6} opacity={hovered ? 0.7 : 0.2} style={{ transition: "all 0.4s ease" }} />
            {hovered && <text x={x} y={baseY - 12} textAnchor="middle" fontSize="9" fill="#777"
              fontFamily="DM Sans, sans-serif" fontWeight="600"
              style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease" }}>
              {["1.2k", "980", "2.1k", "1.5k", "890"][i]}
            </text>}
          </g>;
        })}
      </svg>
    </div>
  );
}

function SalesVisual({ hovered, color }: { hovered: boolean; color: string }) {
  const stages = [
    { label: "Leads", val: "2,847", conv: "" },
    { label: "Qualified", val: "1,204", conv: "42%" },
    { label: "Proposal", val: "486", conv: "40%" },
    { label: "Closed", val: "142", conv: "29%" },
  ];
  const widths = [1, 0.72, 0.48, 0.28];
  return (
    <div style={{ position: "relative", width: "100%", height: 150, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 40% 70%, ${color}10 0%, transparent 70%)` }} />
      <svg width="100%" height="100%" viewBox="0 0 620 150" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", zIndex: 2, display: "block" }}>
        {stages.map((s, i) => {
          const y = 12 + i * 33;
          const barW = hovered ? widths[i] * 440 : widths[i] * 380;
          return (
            <g key={i}>
              <rect x={60} y={y} width={barW} height={24} rx={5} fill={color} opacity={hovered ? 0.1 + (i * 0.06) : 0.04 + (i * 0.02)} style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)", transitionDelay: `${i * 60}ms` }} />
              <text x={72} y={y + 16} fontSize="11" fill={hovered ? "#555" : "#CCC"} fontFamily="DM Sans, sans-serif" fontWeight="500" style={{ transition: "fill 0.3s ease" }}>{s.label}</text>
              {hovered && <text x={barW + 72} y={y + 16} fontSize="11" fill={color} fontFamily="DM Sans, sans-serif" fontWeight="600">{s.val}</text>}
            </g>
          );
        })}
        {[0, 1, 2].map(i => (
          <g key={`conv-${i}`}>
            <line x1={46} y1={12 + i * 33 + 28} x2={46} y2={12 + (i + 1) * 33 - 4} stroke={hovered ? color : "#E8E8E8"} strokeWidth="1" strokeDasharray="3,3" opacity={0.35} style={{ transition: "stroke 0.3s ease" }} />
            {hovered && <text x={30} y={12 + i * 33 + 28 + 10} fontSize="8" fill="#BBB" fontFamily="DM Sans, sans-serif" fontWeight="500" textAnchor="middle">{stages[i + 1].conv}</text>}
          </g>
        ))}
      </svg>
    </div>
  );
}

function ContentVisual({ hovered, color }: { hovered: boolean; color: string }) {
  const days = Array.from({ length: 35 }, (_, i) => i);
  const hasContent = [2, 5, 8, 11, 14, 17, 19, 22, 25, 28, 31, 33];
  const highlighted = [5, 14, 22, 31];
  const cellW = 80, cellH = 22, gapX = 6, gapY = 4, startX = 12, startY = 24;
  return (
    <div style={{ position: "relative", width: "100%", height: 150, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 50% 60%, ${color}10 0%, transparent 70%)` }} />
      <svg width="100%" height="100%" viewBox="0 0 620 150" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", zIndex: 2, display: "block" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <text key={i} x={startX + i * (cellW + gapX) + cellW / 2} y={16} fontSize="9" fill="#CCC" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="500">{d}</text>
        ))}
        {days.map((_, i) => {
          const col = i % 7, row = Math.floor(i / 7);
          const x = startX + col * (cellW + gapX), y = startY + row * (cellH + gapY);
          const has = hasContent.includes(i);
          const hl = highlighted.includes(i);
          return (
            <g key={i}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={4} fill={has ? color : "rgba(0,0,0,0.008)"} opacity={has ? (hovered ? (hl ? 0.18 : 0.08) : 0.03) : (hovered ? 0.015 : 0.008)} stroke="rgba(0,0,0,0.02)" strokeWidth={0.5} style={{ transition: "all 0.3s ease", transitionDelay: `${i * 8}ms` }} />
              {has && hovered && (
                <>
                  <rect x={x + 6} y={y + 5} width={hl ? 36 : 24} height={2.5} rx={1} fill={color} opacity={0.35} style={{ transition: "all 0.3s ease", transitionDelay: `${i * 8 + 80}ms` }} />
                  <rect x={x + 6} y={y + 11} width={hl ? 20 : 14} height={2.5} rx={1} fill={color} opacity={0.18} style={{ transition: "all 0.3s ease", transitionDelay: `${i * 8 + 120}ms` }} />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function OpsVisual({ hovered, color }: { hovered: boolean; color: string }) {
  const nodes = [
    { x: 50, y: 75, label: "WH" }, { x: 160, y: 30, label: "SF" }, { x: 160, y: 120, label: "LA" },
    { x: 310, y: 45, label: "DEN" }, { x: 310, y: 105, label: "DAL" }, { x: 460, y: 75, label: "CHI" }, { x: 575, y: 75, label: "NYC" },
  ];
  const routes = [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[5,6],[1,4],[2,3]];
  return (
    <div style={{ position: "relative", width: "100%", height: 150, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 50% 50%, ${color}10 0%, transparent 70%)` }} />
      <svg width="100%" height="100%" viewBox="0 0 620 150" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", zIndex: 2, display: "block" }}>
        {routes.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke={color} strokeWidth={hovered ? 1.5 : 0.8} opacity={hovered ? 0.18 : 0.07} strokeDasharray={hovered ? "none" : "5,5"} style={{ transition: "all 0.5s ease", transitionDelay: `${i * 35}ms` }} />
        ))}
        {hovered && routes.slice(0, 5).map(([a, b], i) => (
          <circle key={`d-${i}`} r="3" fill={color} opacity="0.35">
            <animateMotion dur={`${2.5 + i * 0.4}s`} repeatCount="indefinite" path={`M${nodes[a].x},${nodes[a].y} L${nodes[b].x},${nodes[b].y}`} />
          </circle>
        ))}
        {nodes.map((n, i) => {
          const sz = (i === 0 || i === 6) ? (hovered ? 18 : 14) : (hovered ? 14 : 11);
          return (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={sz} fill="white" stroke={color} strokeWidth={hovered ? 1.5 : 0.8} opacity={hovered ? 1 : 0.45} style={{ transition: "all 0.4s ease", transitionDelay: `${i * 45}ms` }} />
              <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize="8" fontWeight="600" fill={hovered ? "#555" : "#CCC"} fontFamily="DM Sans, sans-serif" style={{ transition: "fill 0.3s ease" }}>{n.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function CodeVisual({ hovered, color }: { hovered: boolean; color: string }) {
  const lines = [
    { indent: 0, segments: [{ w: 50, c: "#999" }, { w: 65, c: color }, { w: 45, c: "#BBB" }] },
    { indent: 1, segments: [{ w: 40, c: color }, { w: 90, c: "#BBB" }] },
    { indent: 2, segments: [{ w: 60, c: "#F59E0B" }, { w: 50, c: color }] },
    { indent: 2, segments: [{ w: 80, c: color }] },
    { indent: 2, segments: [{ w: 45, c: "#10B981" }, { w: 60, c: "#999" }, { w: 35, c: color }] },
    { indent: 2, segments: [{ w: 55, c: color }, { w: 40, c: "#F59E0B" }] },
    { indent: 1, segments: [{ w: 22, c: "#999" }] },
    { indent: 0, segments: [] },
    { indent: 0, segments: [{ w: 60, c: "#999" }, { w: 48, c: color }] },
    { indent: 1, segments: [{ w: 80, c: color }, { w: 40, c: "#F59E0B" }] },
  ];
  return (
    <div style={{ position: "relative", width: "100%", height: 150, overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
      <div style={{ position: "absolute", inset: 0, zIndex: 0, background: `radial-gradient(ellipse at 50% 50%, ${color}08 0%, transparent 70%)` }} />
      <svg width="100%" height="100%" viewBox="0 0 620 150" preserveAspectRatio="xMidYMid meet" style={{ position: "relative", zIndex: 2, display: "block" }}>
        <circle cx="28" cy="14" r="4" fill={hovered ? "#FF5F57" : "#DDD"} style={{ transition: "fill 0.3s" }} />
        <circle cx="42" cy="14" r="4" fill={hovered ? "#FEBC2E" : "#DDD"} style={{ transition: "fill 0.3s" }} />
        <circle cx="56" cy="14" r="4" fill={hovered ? "#28C840" : "#DDD"} style={{ transition: "fill 0.3s" }} />
        <line x1="0" y1="26" x2="620" y2="26" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
        {lines.map((l, i) => {
          const y = 35 + i * 12;
          let x = 65 + l.indent * 22;
          return (
            <g key={i} style={{ opacity: hovered ? 1 : 0.35, transition: `opacity 0.3s ease ${i * 35}ms` }}>
              <text x="30" y={y + 4} fontSize="9" fill="#D0D0D0" fontFamily="monospace" textAnchor="end">{i + 1}</text>
              {l.segments.map((seg, j) => {
                const rx = x;
                const w = hovered ? seg.w * 1.3 : seg.w;
                x += w + 10;
                return <rect key={j} x={rx} y={y - 1} width={w} height={6} rx={1.5} fill={seg.c} opacity={hovered ? 0.22 : 0.1} style={{ transition: "all 0.4s ease", transitionDelay: `${i * 30 + j * 20}ms` }} />;
              })}
            </g>
          );
        })}
        {hovered && <rect x={65 + 2 * 22 + 80 * 1.3 + 10} y={34 + 3 * 12} width={2} height={8} fill={color} opacity={0.6} rx={1}>
          <animate attributeName="opacity" values="0.6;0;0.6" dur="1s" repeatCount="indefinite" />
        </rect>}
      </svg>
    </div>
  );
}

function AgentVisual({ type, hovered, color }: { type: string; hovered: boolean; color: string }) {
  switch (type) {
    case "email": return <EmailVisual hovered={hovered} color={color} />;
    case "sales": return <SalesVisual hovered={hovered} color={color} />;
    case "content": return <ContentVisual hovered={hovered} color={color} />;
    case "ops": return <OpsVisual hovered={hovered} color={color} />;
    case "code": return <CodeVisual hovered={hovered} color={color} />;
    default: return null;
  }
}

/* ─── Tabbed Agent Showcase ─── */
const SHOWCASE_TABS = [
  { id: "email", label: "Email" },
  { id: "sales", label: "Sales" },
  { id: "content", label: "Content" },
  { id: "ops", label: "Ops" },
  { id: "code", label: "Code" },
];

interface ShowcaseAgent {
  name: string;
  desc: string;
  creator: string;
  price: string;
  rentals: string;
  rating: string;
  icon: string;
  color: string;
  accent: string;
  stats: { speed: number; accuracy: number; reliability: number };
}

const SHOWCASE_AGENTS: Record<string, ShowcaseAgent> = {
  email: { name: "Smart Email Responder", desc: "Reads incoming emails, classifies intent, drafts contextual responses. Handles follow-ups and routes urgent items.", creator: "AgentLabs", price: "$19/mo", rentals: "2.4k", rating: "4.8", icon: "E", color: "#6366F1", accent: "#A78BFA", stats: { speed: 92, accuracy: 91, reliability: 95 } },
  sales: { name: "Lead Qualifier", desc: "Scores inbound leads, enriches contacts with company data, updates your CRM, and flags hot prospects.", creator: "SalesForge", price: "$49/mo", rentals: "980", rating: "4.7", icon: "L", color: "#F59E0B", accent: "#FBBF24", stats: { speed: 85, accuracy: 94, reliability: 89 } },
  content: { name: "SEO Content Writer", desc: "Researches keywords, writes optimized blog posts with proper structure, and drafts meta descriptions.", creator: "GrowthKit", price: "$29/mo", rentals: "1.8k", rating: "4.6", icon: "S", color: "#10B981", accent: "#6EE7B7", stats: { speed: 78, accuracy: 86, reliability: 90 } },
  ops: { name: "Order Tracker", desc: "Monitors orders in real-time, sends proactive shipping updates, handles exceptions and weekly reports.", creator: "ShipStack", price: "$19/mo", rentals: "3.2k", rating: "4.9", icon: "O", color: "#EF4444", accent: "#FCA5A5", stats: { speed: 95, accuracy: 88, reliability: 97 } },
  code: { name: "Bug Triage Bot", desc: "Monitors error logs, deduplicates issues, assigns severity, and creates actionable tickets in Linear or Jira.", creator: "DevTools Co", price: "Free", rentals: "5.1k", rating: "4.7", icon: "B", color: "#1A1A1A", accent: "#888", stats: { speed: 90, accuracy: 87, reliability: 92 } },
};

function AgentShowcase() {
  const [activeTab, setActiveTab] = useState<string>("email");
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [cardHovered, setCardHovered] = useState<boolean>(false);
  const agent = SHOWCASE_AGENTS[activeTab];

  const switchTab = (id: string) => {
    if (id === activeTab) return;
    setTransitioning(true);
    setCardHovered(false);
    setTimeout(() => { setActiveTab(id); setTransitioning(false); }, 200);
  };

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 16 }}>
        {SHOWCASE_TABS.map(tab => (
          <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
            fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 450,
            color: activeTab === tab.id ? "#1A1A1A" : "#AAA",
            background: activeTab === tab.id ? "rgba(255,255,255,0.65)" : "transparent",
            backdropFilter: activeTab === tab.id ? "blur(12px)" : "none",
            border: activeTab === tab.id ? "1px solid rgba(255,255,255,0.6)" : "1px solid transparent",
            borderRadius: 9, padding: "7px 16px", cursor: "pointer",
            fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.25s ease",
            display: "flex", alignItems: "center", gap: 6,
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeTab !== tab.id) { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { if (activeTab !== tab.id) { e.currentTarget.style.color = "#AAA"; e.currentTarget.style.background = "transparent"; }}}
          >
            <TabIcon id={tab.id} active={activeTab === tab.id} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Agent card */}
      <div
        style={{ position: "relative", borderRadius: 18, overflow: "hidden" }}
        onMouseEnter={() => setCardHovered(true)}
        onMouseLeave={() => setCardHovered(false)}
      >
        {/* Animated border beam */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18, padding: 1.5, zIndex: 10, pointerEvents: "none",
          background: `conic-gradient(from var(--beam-angle, 0deg), transparent 0%, transparent 70%, ${agent.color}30 80%, ${agent.color}15 90%, transparent 100%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude" as const,
          WebkitMaskComposite: "xor",
        }} className="border-beam-anim" />

        <div style={{
          position: "relative", zIndex: 2, borderRadius: 18, overflow: "hidden",
          background: "rgba(255,255,255,0.55)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.5)",
          opacity: transitioning ? 0 : 1, transform: transitioning ? "translateY(6px) scale(0.99)" : "translateY(0) scale(1)",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}>
          {/* Custom visual per agent type */}
          <AgentVisual type={activeTab} hovered={cardHovered} color={agent.color} />

          {/* Body */}
          <div style={{ padding: "18px 24px 22px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", display: "block", marginBottom: 2 }}>{agent.name}</span>
                <span style={{ fontSize: 12, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>by {agent.creator} · ★ {agent.rating} · ⬆ {agent.rentals}</span>
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 650, color: agent.price === "Free" ? "#22C55E" : "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", flexShrink: 0, marginTop: 2 }}>{agent.price}</span>
            </div>

            <p style={{ fontSize: 13.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.55, marginBottom: 16 }}>{agent.desc}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                {([["SPD", agent.stats.speed], ["ACC", agent.stats.accuracy], ["REL", agent.stats.reliability]] as const).map(([l, v]) => (
                  <span key={l} style={{ fontSize: 10.5, fontWeight: 600, color: "#AAA", background: "rgba(0,0,0,0.03)", borderRadius: 6, padding: "3px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif", letterSpacing: "0.02em" }}>
                    {l} {v}
                  </span>
                ))}
              </div>
              <Link href="/marketplace" style={{
                fontSize: 12.5, fontWeight: 600, color: "#FFF", textDecoration: "none",
                background: "#1A1A1A", borderRadius: 8, padding: "7px 16px",
                fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "all 0.15s", display: "inline-block",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = "translateY(0)"; }}
              >View Agent →</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace CTA below card */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Link href="/marketplace" style={{
          fontSize: 13, fontWeight: 500, color: "#999", textDecoration: "none",
          fontFamily: "var(--font-body), 'DM Sans', sans-serif", transition: "color 0.15s",
          display: "inline-flex", alignItems: "center", gap: 6,
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "#555"}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.color = "#999"}
        >
          Explore all agents in the marketplace
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </div>
    </div>
  );
}

/* ─── Assembler Stars ─── */
function AssemblerStars({ r, size = 10 }: { r: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.floor(r) ? "#F59E0B" : "none"} stroke={i <= Math.ceil(r) ? "#F59E0B" : "#DDD"} strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
      ))}
    </span>
  );
}

/* ─── Assembler Agent Types & Data ─── */
interface AssemblerAgent {
  id: string;
  name: string;
  desc: string;
  price: string;
  unit: string;
  by: string;
  verified: boolean;
  rating: number;
  reviews: number;
  rentals: number;
  longDesc: string;
  integrations: string[];
  capabilities: string[];
}

const MOCK_ASSEMBLER_AGENTS: AssemblerAgent[] = [
  {
    id: "shopify-returns",
    name: "Shopify Returns Handler",
    desc: "Processes return requests, validates order data, and issues refunds automatically through Shopify API",
    price: "$1.00",
    unit: "/call",
    by: "ShipStack",
    verified: true,
    rating: 4.7,
    reviews: 84,
    rentals: 1200,
    longDesc: "End-to-end return processing for Shopify stores. Listens for return requests via storefront or email, validates the order against your return policy, calculates refund amounts (partial or full), and executes the refund through Shopify Admin API. Handles edge cases like exchanges, store credit, and restocking fees.",
    integrations: ["Shopify", "Slack", "Gmail", "Webhook"],
    capabilities: ["Auto-approve returns matching policy", "Partial refund calculations", "Exchange processing", "Restocking fee rules", "Return label generation", "Inventory restock sync"],
  },
  {
    id: "email-responder",
    name: "Smart Email Responder",
    desc: "Sends confirmation emails and status updates to customers throughout the returns process",
    price: "$0.50",
    unit: "/call",
    by: "AgentLabs",
    verified: true,
    rating: 4.9,
    reviews: 203,
    rentals: 3100,
    longDesc: "Keeps customers in the loop at every step of their return. Sends branded confirmation when a return is initiated, updates when the item is received, and final notification when the refund is processed. Customizable templates with dynamic fields for order details, tracking, and timelines.",
    integrations: ["Gmail", "Outlook", "SendGrid", "Intercom"],
    capabilities: ["Branded email templates", "Dynamic field injection", "Multi-step sequences", "Delivery tracking updates", "Refund confirmation", "Multi-language support"],
  },
];

function fmtK(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

/* ─── Agent Detail Overlay ─── */
function AssemblerAgentDetail({ agent, onClose }: { agent: AssemblerAgent; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.1)", backdropFilter: "blur(3px)", animation: "fadeUp .12s ease" }} />
      <div style={{ position: "relative", zIndex: 1, width: 400, maxHeight: "80vh", overflowY: "auto", animation: "cardReveal .25s ease" }}>
        <div style={{ background: "rgba(255,255,255,.75)", backdropFilter: "blur(24px)", borderRadius: 16, border: "1px solid rgba(255,255,255,.6)", boxShadow: "0 24px 80px rgba(0,0,0,.08), 0 4px 12px rgba(0,0,0,.04)", overflow: "hidden" }}>
          {/* Top */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {agent.verified && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,.08)", borderRadius: 4, padding: "2px 6px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Verified
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(0,0,0,.03)", cursor: "pointer", display: "grid", placeItems: "center", color: "#CCC", transition: "all .12s", padding: 0 }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(0,0,0,.06)"; e.currentTarget.style.color = "#999"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(0,0,0,.03)"; e.currentTarget.style.color = "#CCC"; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Name + meta */}
          <div style={{ padding: "8px 18px 0" }}>
            <h2 style={{ fontSize: 19, fontWeight: 500, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em", marginBottom: 4, lineHeight: 1.2 }}>{agent.name}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 10 }}>
              <span style={{ fontWeight: 550, color: "#888" }}>{agent.by}</span>
              <span style={{ opacity: 0.3 }}>{"\u00B7"}</span>
              <AssemblerStars r={agent.rating} />
              <span style={{ fontWeight: 600, color: "#1A1A1A" }}>{agent.rating}</span>
              <span>{"(" + agent.reviews + ")"}</span>
              <span style={{ opacity: 0.3 }}>{"\u00B7"}</span>
              <span>{fmtK(agent.rentals) + " rentals"}</span>
            </div>
          </div>

          {/* Description */}
          <div style={{ padding: "0 18px" }}>
            <p style={{ fontSize: 12.5, color: "#888", lineHeight: 1.55, marginBottom: 14, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent.longDesc}</p>
          </div>

          {/* Capabilities */}
          <div style={{ padding: "0 18px", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#CCC", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 6, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Capabilities</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {agent.capabilities.map((c, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 500, color: "#999", background: "rgba(0,0,0,.025)", borderRadius: 5, padding: "3px 8px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{c}</span>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div style={{ padding: "0 18px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#CCC", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Works with</span>
              {agent.integrations.map((ig, i) => (
                <span key={i} style={{ fontSize: 10.5, fontWeight: 550, color: "#AAA", background: "rgba(255,255,255,.6)", border: "1px solid rgba(0,0,0,.03)", borderRadius: 4, padding: "2px 6px", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{ig}</span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,.03)", background: "rgba(0,0,0,.01)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 20, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>{agent.price}</span>
                <span style={{ fontSize: 11, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent.unit}</span>
              </div>
            </div>
            <Link href={"/marketplace/" + agent.id} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid rgba(0,0,0,.06)", background: "rgba(255,255,255,.5)", color: "#777", fontSize: 12, fontWeight: 550, fontFamily: "var(--font-body), 'DM Sans', sans-serif", textDecoration: "none", transition: "all .12s" }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "rgba(255,255,255,.8)"; }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.background = "rgba(255,255,255,.5)"; }}>
              Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Nav Bar ─── */

function NavBar() {
  const { user } = useAuth();
  const [prodOpen, setProdOpen] = useState<boolean>(false);
  const prodTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <nav style={{
      position: "relative", zIndex: 20, display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 28px", background: "rgba(255,255,255,0.3)", backdropFilter: "blur(24px)",
      borderBottom: "1px solid rgba(255,255,255,0.4)",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 17, color: "#1A1A1A", letterSpacing: "-0.02em", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Agent Spark</span>
      </Link>

      {/* Center nav items */}
      <div style={{ display: "flex", gap: 0, alignItems: "center" }}>
        {/* Home */}
        <Link href="/" style={{
          fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
          padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          transition: "all 0.12s ease",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >Home</Link>

        {/* Products dropdown */}
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
              padding: 6, zIndex: 100, width: 280, animation: "navDropIn 0.18s ease both",
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

        {/* Marketplace */}
        <Link href="/marketplace" style={{
          fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
          padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          transition: "all 0.12s ease",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >Marketplace</Link>

        {/* About */}
        <Link href="/about" style={{
          fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
          padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          transition: "all 0.12s ease",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >About</Link>

        {/* Pricing */}
        <Link href="/pricing" style={{
          fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
          padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
          transition: "all 0.12s ease",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#1A1A1A"; e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
        onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
        >Pricing</Link>
      </div>

      {/* Right side — auth-aware */}
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
            <Link href="/auth" style={{
              fontSize: 14, fontWeight: 500, color: "#666", textDecoration: "none",
              padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
              transition: "all 0.12s ease",
            }}
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

/* ─── Main ─── */
export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState<string>("");
  const [phase, setPhase] = useState<"idle" | "typing" | "searching" | "assembling" | "done">("idle");
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState<string>("");
  const [shownAgent, setShownAgent] = useState<number>(-1);
  const [showCost, setShowCost] = useState<boolean>(false);
  const [animDots, setAnimDots] = useState<number>(0);
  const [openAgent, setOpenAgent] = useState<number | null>(null);
  const [assemblerAgents, setAssemblerAgents] = useState<AssemblerAgent[]>(MOCK_ASSEMBLER_AGENTS);
  const apiDoneRef = useRef<{ agents: AssemblerAgent[]; totalCents: number; realTeam: TeamAgent[] } | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (dotTimerRef.current) clearInterval(dotTimerRef.current);
    };
  }, []);

  /* Display team (for V9 cards) */
  const [displayTeam, setDisplayTeam] = useState<MockAgent[]>(MOCK_TEAM);
  /* Real team (for activation/checkout) */
  const [realTeam, setRealTeam] = useState<TeamAgent[]>([]);
  const [totalCostCents, setTotalCostCents] = useState<number>(0);
  const [activating, setActivating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fire = (text?: string) => {
    const prompt = text ?? query;
    if (!prompt.trim()) return;
    if (text) setQuery(text);

    // Clean up any existing timers
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (dotTimerRef.current) clearInterval(dotTimerRef.current);

    // Reset animation state
    setTyped("");
    setShownAgent(-1);
    setShowCost(false);
    setAnimDots(0);
    setOpenAgent(null);
    setErrorMsg("");
    apiDoneRef.current = null;

    setPhase("typing");

    // Fire API call in background
    assembleWorkflow(prompt).then((result) => {
      const mapped = result.recommended_agents.map(recommendedAgentToTeam);
      if (mapped.length > 0) {
        const agents: AssemblerAgent[] = mapped.map((a) => ({
          id: a.slug || a.agent_id,
          name: a.name,
          desc: a.role,
          price: a.price,
          unit: a.price.includes("/mo") ? "/mo" : "/call",
          by: "Agent Spark",
          verified: true,
          rating: Math.round((4.5 + Math.random() * 0.4) * 10) / 10,
          reviews: Math.floor(50 + Math.random() * 200),
          rentals: Math.floor(500 + Math.random() * 3000),
          longDesc: a.role,
          integrations: [],
          capabilities: [],
        }));
        apiDoneRef.current = { agents, totalCents: result.total_cost_cents, realTeam: mapped };
      } else {
        apiDoneRef.current = { agents: MOCK_ASSEMBLER_AGENTS, totalCents: 0, realTeam: [] };
      }
    }).catch(() => {
      apiDoneRef.current = { agents: MOCK_ASSEMBLER_AGENTS, totalCents: 0, realTeam: [] };
    });

    // Typing animation — re-types the query character by character
    let charIdx = 0;
    typingTimerRef.current = setInterval(() => {
      charIdx++;
      if (charIdx <= prompt.length) {
        setTyped(prompt.substring(0, charIdx));
      } else if (charIdx === prompt.length + 8) {
        // Typing done → searching phase
        clearInterval(typingTimerRef.current!);
        typingTimerRef.current = null;
        setPhase("searching");

        // Animate dots
        dotTimerRef.current = setInterval(() => {
          setAnimDots((d) => (d + 1) % 4);
        }, 350);

        // Wait for API result + minimum visual delay, then assemble
        const checkAndAssemble = () => {
          const apiResult = apiDoneRef.current;
          if (apiResult) {
            if (dotTimerRef.current) clearInterval(dotTimerRef.current);
            dotTimerRef.current = null;
            setAssemblerAgents(apiResult.agents);
            setTotalCostCents(apiResult.totalCents);
            setRealTeam(apiResult.realTeam);
            setDisplayTeam(apiResult.agents.map((a) => ({
              name: a.name, desc: a.desc, iconLetter: a.name.charAt(0),
              price: a.price + (a.unit || ""),
              stats: { spd: 85, acc: 90, rel: 92 },
            })));

            setPhase("assembling");
            setShownAgent(0);
            setTimeout(() => { if (apiResult.agents.length > 1) setShownAgent(1); }, 500);
            setTimeout(() => { setShowCost(true); }, 1000);
            setTimeout(() => { setPhase("done"); }, 1400);
          } else {
            setTimeout(checkAndAssemble, 200);
          }
        };
        setTimeout(checkAndAssemble, 2200);
      }
    }, 42);
  };

  const doActivateTeam = useCallback(async () => {
    setActivating(true);
    setErrorMsg("");
    try {
      if (realTeam.length === 0) {
        router.push("/dashboard");
        return;
      }
      const toRent = realTeam.filter((a) => !a.already_rented);
      if (toRent.length === 0) {
        router.push("/dashboard");
        return;
      }
      const freeAgents = toRent.filter((a) => a.price === "Free" || a.price === "$0" || a.price === "$0/call");
      const paidAgents = toRent.filter((a) => a.price !== "Free" && a.price !== "$0" && a.price !== "$0/call");
      for (const agent of freeAgents) {
        await rentAgent(agent.agent_id);
      }
      if (paidAgents.length > 0) {
        const origin = window.location.origin;
        const result = await createTeamCheckout(
          paidAgents.map((a) => a.agent_id),
          {
            successUrl: `${origin}/checkout/success?agents=${encodeURIComponent(paidAgents.map((a) => a.slug).join(","))}`,
            cancelUrl: `${origin}/checkout/cancel`,
          },
        );
        if (result.url) {
          window.location.href = result.url;
          return;
        }
        if (result.demo) {
          for (const agent of paidAgents) {
            await rentAgent(agent.agent_id);
          }
        }
      }
      router.push("/dashboard?activated=true");
    } catch {
      setErrorMsg("Failed to activate team. Please try again.");
    } finally {
      setActivating(false);
    }
  }, [realTeam, router]);

  const activateTeam = () => {
    if (!user) {
      router.push('/auth?mode=signup');
      return;
    }
    doActivateTeam();
  };

  const reset = () => {
    setPhase("idle"); setQuery(""); setTyped(""); setShownAgent(-1); setShowCost(false);
    setAnimDots(0); setOpenAgent(null); setAssemblerAgents(MOCK_ASSEMBLER_AGENTS);
    setDisplayTeam(MOCK_TEAM); setRealTeam([]); setTotalCostCents(0); setErrorMsg("");
    apiDoneRef.current = null;
    if (typingTimerRef.current) { clearInterval(typingTimerRef.current); typingTimerRef.current = null; }
    if (dotTimerRef.current) { clearInterval(dotTimerRef.current); dotTimerRef.current = null; }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes cardReveal { from{opacity:0;transform:translateY(14px) scale(.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes checkPop { from{transform:scale(0)} to{transform:scale(1)} }
        @keyframes assemblerSpin { to{transform:rotate(360deg)} }
      ` }} />
      {/* BG */}
      <div style={{ position: "fixed", inset: 0, background: "#F2F3F6", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-12%", right: "-8%", width: "55vw", height: "55vw", maxWidth: 750, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,160,140,0.2) 0%, transparent 60%)", animation: "a1 26s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "25%", left: "-10%", width: "45vw", height: "45vw", maxWidth: 650, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(130,180,255,0.16) 0%, transparent 60%)", animation: "a2 32s ease-in-out infinite", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "-8%", left: "35%", width: "40vw", height: "40vw", maxWidth: 550, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(180,160,255,0.12) 0%, transparent 60%)", animation: "a3 28s ease-in-out infinite", filter: "blur(80px)" }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundSize: "28px 28px", backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)" }} />
        {/* Line grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 65%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, black 20%, transparent 65%)",
        }} />
        {/* Horizon glow line */}
        <div style={{
          position: "absolute", top: "52%", left: "10%", right: "10%", height: 1,
          background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.03) 30%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.03) 70%, transparent)",
        }} />
      </div>

      {/* Nav */}
      <NavBar />

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", minHeight: "calc(100vh - 56px)" }}>

        {phase === "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: 1140, padding: "0 24px", animation: "fadeUp 0.6s ease both" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, width: "100%" }}>

              {/* Left */}
              <div style={{ flex: 1, maxWidth: 520, minWidth: 300 }}>
                <h1 style={{
                  fontSize: 56, fontWeight: 300, letterSpacing: "-0.035em", lineHeight: 1.08, marginBottom: 16,
                  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
                  color: "#1A1A1A",
                }}>
                  AI agents that<br />work for you
                </h1>

                <p style={{ fontSize: 17, color: "#999", lineHeight: 1.55, marginBottom: 28, maxWidth: 420, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
                  Describe what you need. We&apos;ll assemble a team of AI agents and put them to work.
                </p>

                {/* Input */}
                <div style={{
                  position: "relative", maxWidth: 480, marginBottom: 20,
                  borderRadius: 15,
                }}>
                  <div style={{
                    display: "flex", alignItems: "center",
                    background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
                    borderRadius: 13, padding: "0 6px 0 16px",
                    border: inputFocused ? "1.5px solid rgba(0,0,0,0.12)" : "1.5px solid rgba(255,255,255,0.7)",
                    boxShadow: inputFocused ? "0 0 0 3px rgba(0,0,0,0.04), 0 2px 12px rgba(0,0,0,0.06)" : "none",
                    transition: "all 0.25s ease",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: 10 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input ref={inputRef} value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                      onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && fire()}
                      placeholder="I want to start a cookie business..."
                      style={{ flex: 1, border: "none", outline: "none", fontSize: 14.5, background: "transparent", color: "#1A1A1A", padding: "14px 0", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }} />
                    <button onClick={() => fire()} style={{
                      width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                      background: query.trim() ? "#1A1A1A" : "rgba(0,0,0,0.05)", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={query.trim() ? "white" : "#CCC"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </button>
                  </div>
                </div>

                {/* Pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 480 }}>
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => { setQuery(s); setTimeout(() => fire(s), 100); }} style={{
                      fontSize: 12.5, color: "#888", fontFamily: "var(--font-body), 'DM Sans', sans-serif",
                      background: "rgba(255,255,255,0.4)", backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.5)", borderRadius: 20, padding: "7px 14px", cursor: "pointer",
                      transition: "all 0.15s", fontWeight: 450,
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(255,255,255,0.65)"; e.currentTarget.style.color = "#555"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; e.currentTarget.style.color = "#888"; }}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Right: Globe */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minWidth: 300 }}>
                <Globe size={460} />
              </div>
            </div>

            {/* Tabbed agent showcase */}
            <div style={{ width: "100%", maxWidth: 620, margin: "48px auto 0", animation: "fadeUp 0.8s ease both", animationDelay: "0.2s" }}>
              <AgentShowcase />
            </div>

            {/* Integration icons marquee */}
            <div style={{ width: "100%", maxWidth: 640, margin: "44px auto 0" }}>
              <p style={{ fontSize: 11, color: "#CCC", textAlign: "center", marginBottom: 14, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>Works with your stack</p>
              <div style={{ overflow: "hidden", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to right, #F2F3F6, transparent)", zIndex: 2 }} />
                <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 60, background: "linear-gradient(to left, #F2F3F6, transparent)", zIndex: 2 }} />
                <div style={{ display: "flex", alignItems: "center", animation: "marquee 30s linear infinite", width: "max-content" }}>
                  {[...INTEGRATION_NAMES, ...INTEGRATION_NAMES].map((name, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", opacity: 0.5 }}>
                      <IntegrationIcon name={name} size={18} />
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "#AAA", whiteSpace: "nowrap", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12.5, color: "#CCC", marginTop: 20, marginBottom: 32, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", verticalAlign: "-1px", marginRight: 5 }}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              No credit card required
            </p>
          </div>
        )}

        {/* ASSEMBLER UI — typing / searching / assembling / done */}
        {phase !== "idle" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", width: "100%", maxWidth: 500, padding: "52px 20px 40px", animation: "fadeUp 0.4s ease both" }}>

            {/* Goal display */}
            <div style={{ textAlign: "center", marginBottom: phase === "searching" ? 24 : 32, animation: "fadeUp .4s ease" }}>
              <div style={{ display: "inline-flex", alignItems: "center", padding: "10px 18px", background: "rgba(255,255,255,.4)", borderRadius: 10, border: "1px solid rgba(255,255,255,.5)", minHeight: 42 }}>
                <span style={{ color: "#DDD", marginRight: 8, display: "grid", placeItems: "center" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                </span>
                <span style={{ fontSize: 14.5, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 450, fontStyle: "italic" }}>
                  {"\u201C"}{phase === "typing" ? typed : query}{"\u201D"}
                </span>
                {phase === "typing" && (
                  <span style={{ display: "inline-block", width: 1.5, height: 17, background: "#1A1A1A", marginLeft: 1, animation: "blink .55s step-end infinite" }} />
                )}
              </div>
            </div>

            {/* Searching spinner */}
            {phase === "searching" && (
              <div style={{ textAlign: "center", marginBottom: 20, animation: "fadeUp .25s ease" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,.05)", borderTopColor: "#1A1A1A", borderRadius: "50%", animation: "assemblerSpin .6s linear infinite" }} />
                  <span style={{ fontSize: 12.5, color: "#BBB", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500 }}>
                    {"Finding the right agents" + ".".repeat(animDots)}
                  </span>
                </div>
              </div>
            )}

            {/* Team card */}
            {(phase === "assembling" || phase === "done") && (
              <div style={{ animation: "cardReveal .35s ease", width: "100%" }}>
                <div style={{
                  background: "rgba(255,255,255,.5)",
                  backdropFilter: "blur(24px)",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,.6)",
                  boxShadow: "0 16px 48px rgba(0,0,0,.05), 0 2px 8px rgba(0,0,0,.02)",
                  overflow: "hidden",
                }}>
                  {/* Header */}
                  <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,.025)" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em" }}>Your AI Team</span>
                    <span style={{ fontSize: 11.5, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginLeft: 8 }}>
                      {phase === "done" ? assemblerAgents.length + " agents" : "assembling\u2026"}
                    </span>
                    {phase === "done" && (
                      <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: 10, background: "#22C55E", display: "grid", placeItems: "center", animation: "checkPop .25s cubic-bezier(.34,1.56,.64,1)" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </div>

                  {/* Agents */}
                  <div style={{ padding: "10px 14px" }}>
                    {assemblerAgents.map((agent, idx) => {
                      const visible = shownAgent >= idx;
                      return (
                        <div key={agent.id} style={{
                          opacity: visible ? 1 : 0,
                          transform: visible ? "translateY(0)" : "translateY(12px)",
                          transition: "all .4s cubic-bezier(.4,0,.2,1)",
                          marginBottom: idx < assemblerAgents.length - 1 ? 6 : 0,
                        }}>
                          <div
                            onClick={() => { if (phase === "done") setOpenAgent(idx); }}
                            style={{
                              display: "flex", alignItems: "flex-start", gap: 12,
                              padding: "12px 14px",
                              background: "rgba(255,255,255,.35)",
                              borderRadius: 10,
                              border: "1px solid rgba(255,255,255,.45)",
                              cursor: phase === "done" ? "pointer" : "default",
                              transition: "all .12s",
                            }}
                            onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { if (phase === "done") { e.currentTarget.style.background = "rgba(255,255,255,.65)"; e.currentTarget.style.borderColor = "rgba(0,0,0,.04)"; } }}
                            onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = "rgba(255,255,255,.35)"; e.currentTarget.style.borderColor = "rgba(255,255,255,.45)"; }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-body), 'DM Sans', sans-serif", marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                                {agent.name}
                                {phase === "done" && (
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><polyline points="9 18 15 12 9 6" /></svg>
                                )}
                              </div>
                              <div style={{ fontSize: 11.5, color: "#AAA", fontFamily: "var(--font-body), 'DM Sans', sans-serif", lineHeight: 1.4 }}>{agent.desc}</div>
                            </div>
                            <div style={{ flexShrink: 0, textAlign: "right" as const, paddingTop: 1 }}>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.02em" }}>{agent.price}</span>
                              <span style={{ fontSize: 10.5, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{agent.unit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cost + CTA */}
                  <div style={{
                    padding: "14px 18px",
                    borderTop: "1px solid rgba(0,0,0,.025)",
                    opacity: showCost ? 1 : 0,
                    transform: showCost ? "translateY(0)" : "translateY(6px)",
                    transition: "all .45s cubic-bezier(.4,0,.2,1)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif", textTransform: "uppercase" as const, letterSpacing: "0.05em", fontWeight: 600, marginBottom: 1 }}>Estimated total</div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                          <span style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", fontFamily: "var(--font-outfit), 'Outfit', sans-serif", letterSpacing: "-0.03em" }}>
                            {totalCostCents > 0 ? formatTotalCents(totalCostCents) : "$" + assemblerAgents.reduce((sum, a) => { const m = a.price.match(/[\d.]+/); return sum + (m ? parseFloat(m[0]) : 0); }, 0).toFixed(2)}
                          </span>
                          <span style={{ fontSize: 11, color: "#CCC", fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>/mo</span>
                        </div>
                      </div>
                      <button onClick={activateTeam} disabled={activating} style={{
                        padding: "10px 22px", background: "#1A1A1A", color: "#fff", border: "none",
                        borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body), 'DM Sans', sans-serif",
                        cursor: activating ? "not-allowed" : "pointer", transition: "all .15s", opacity: activating ? 0.6 : 1,
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = "#1A1A1A"; e.currentTarget.style.transform = ""; }}>
                        {activating ? "Activating..." : "Activate Team \u2192"}
                      </button>
                    </div>
                    {errorMsg && <p style={{ fontSize: 13, color: "#EF4444", marginTop: 8, fontFamily: "var(--font-body), 'DM Sans', sans-serif" }}>{errorMsg}</p>}
                  </div>
                </div>

                {/* Links below card */}
                <div style={{
                  display: "flex", justifyContent: "center", gap: 20, marginTop: 14,
                  opacity: showCost ? 1 : 0, transition: "opacity .3s ease", transitionDelay: "200ms",
                }}>
                  <button onClick={reset} style={{ fontSize: 11.5, color: "#CCC", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500, transition: "color .12s" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#999"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.color = "#CCC"; }}>
                    {"\u2190 Try another goal"}
                  </button>
                  <Link href="/marketplace" style={{ fontSize: 11.5, color: "#CCC", textDecoration: "none", fontFamily: "var(--font-body), 'DM Sans', sans-serif", fontWeight: 500, transition: "color .12s" }}
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#999"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = "#CCC"; }}>
                    {"Browse marketplace \u2192"}
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agent detail overlay */}
      {openAgent !== null && (
        <AssemblerAgentDetail agent={assemblerAgents[openAgent]} onClose={() => setOpenAgent(null)} />
      )}

    </div>
  );
}
