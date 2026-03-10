'use client';

import React, { forwardRef, useRef } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { cn } from '@/lib/utils';
import {
  SiGmail, SiSlack, SiShopify, SiStripe, SiHubspot,
  SiNotion, SiGithub, SiLinear,
} from 'react-icons/si';
import { SplineScene } from '@/components/ui/splite';

/* ─── Beam node ─── */
const Node = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-11 items-center justify-center rounded-full border border-black/[.04] bg-white/60 backdrop-blur-sm shadow-[0_0_16px_-6px_rgba(0,0,0,0.1)]",
        className,
      )}
    >
      {children}
    </div>
  );
});
Node.displayName = "Node";

/* ─── Agent hub diagram ─── */
function AgentBeamDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const centerRef = useRef<HTMLDivElement>(null);
  const outputRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  const inputs = [
    { icon: <SiGmail size={16} className="text-[#999]" />, label: "Gmail" },
    { icon: <SiShopify size={16} className="text-[#999]" />, label: "Shopify" },
    { icon: <SiSlack size={16} className="text-[#999]" />, label: "Slack" },
    { icon: <SiNotion size={16} className="text-[#999]" />, label: "Notion" },
  ];

  const outputs = [
    { icon: <SiStripe size={16} className="text-[#999]" />, label: "Stripe" },
    { icon: <SiHubspot size={16} className="text-[#999]" />, label: "HubSpot" },
    { icon: <SiGithub size={16} className="text-[#999]" />, label: "GitHub" },
    { icon: <SiLinear size={16} className="text-[#999]" />, label: "Linear" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ height: 320, maxWidth: 620, margin: "0 auto" }}
    >
      {/* Left column: inputs */}
      <div className="flex flex-col items-center gap-6" style={{ width: 80 }}>
        {inputs.map((input, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Node ref={inputRefs[i]}>{input.icon}</Node>
            <span className="text-[10px] font-medium text-[#BBB]">{input.label}</span>
          </div>
        ))}
      </div>

      {/* Center: 3D Agent */}
      <div className="flex flex-col items-center mx-auto" style={{ position: "relative" }}>
        <div
          ref={centerRef}
          className="z-10"
          style={{
            width: 160, height: 200,
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 45%, black 40%, transparent 100%)",
            opacity: 0.12,
          }}
        >
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Right column: outputs */}
      <div className="flex flex-col items-center gap-6" style={{ width: 80 }}>
        {outputs.map((output, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Node ref={outputRefs[i]}>{output.icon}</Node>
            <span className="text-[10px] font-medium text-[#BBB]">{output.label}</span>
          </div>
        ))}
      </div>

      {/* Beams: inputs → center (rainbow) */}
      {inputRefs.map((ref, i) => {
        const colors = [
          { start: "#ff6b6b", stop: "#ffa500" },
          { start: "#ffa500", stop: "#ffd700" },
          { start: "#4ecdc4", stop: "#44b5f5" },
          { start: "#a855f7", stop: "#ec4899" },
        ];
        return (
          <AnimatedBeam
            key={`in-${i}`}
            containerRef={containerRef as React.RefObject<HTMLElement>}
            fromRef={ref as React.RefObject<HTMLElement>}
            toRef={centerRef as React.RefObject<HTMLElement>}
            curvature={i === 0 ? -40 : i === 3 ? 40 : i === 1 ? -15 : 15}
            gradientStartColor={colors[i].start}
            gradientStopColor={colors[i].stop}
            pathColor="rgba(0,0,0,.03)"
            pathWidth={2.5}
            duration={3 + i * 0.5}
            delay={i * 0.3}
          />
        );
      })}

      {/* Beams: center → outputs (rainbow) */}
      {outputRefs.map((ref, i) => {
        const colors = [
          { start: "#44b5f5", stop: "#4ecdc4" },
          { start: "#ec4899", stop: "#a855f7" },
          { start: "#ffd700", stop: "#ff6b6b" },
          { start: "#34d399", stop: "#3b82f6" },
        ];
        return (
          <AnimatedBeam
            key={`out-${i}`}
            containerRef={containerRef as React.RefObject<HTMLElement>}
            fromRef={centerRef as React.RefObject<HTMLElement>}
            toRef={ref as React.RefObject<HTMLElement>}
            curvature={i === 0 ? -40 : i === 3 ? 40 : i === 1 ? -15 : 15}
            gradientStartColor={colors[i].start}
            gradientStopColor={colors[i].stop}
            pathColor="rgba(0,0,0,.03)"
            pathWidth={2.5}
            duration={3 + i * 0.4}
            delay={i * 0.3 + 0.8}
            reverse
          />
        );
      })}
    </div>
  );
}

/* ─── Main ─── */
export default function AgentStudioPage() {
  return (
    <PublicShell>
      <div style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          ::selection { background: #1A1A1A; color: white; }
        `}</style>

        {/* Hero */}
        <section style={{ textAlign: "center" as const, padding: "20px 24px 40px", animation: "fadeUp 0.6s ease both" }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
            Agent Studio
          </h1>
          <p style={{ fontSize: 14, color: "#999", margin: 0 }}>
            Build production AI agents through conversation. No code required.
          </p>
        </section>

        {/* Beam diagram */}
        <section style={{ padding: "0 24px 56px" }}>
          <AgentBeamDiagram />
        </section>

        {/* How it works */}
        <section style={{ maxWidth: 640, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.5s ease both", animationDelay: "0.15s" }}>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>

            {/* Step 1 — Describe */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "28px 28px",
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>1</span>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Describe what you need</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>Tell the trainer what your agent should do in plain English. It asks follow-ups to nail down edge cases, tone, and behavior.</p>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                  {[
                    { role: "You", text: "I need an agent that handles customer refund requests" },
                    { role: "Trainer", text: "Got it. Should it auto-approve refunds under a certain amount?" },
                    { role: "You", text: "Yes, auto-approve anything under $50" },
                  ].map((msg, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, flexShrink: 0, width: 44, paddingTop: 5,
                        color: msg.role === "You" ? "#1A1A1A" : "#999",
                      }}>{msg.role}</span>
                      <div style={{
                        fontSize: 12.5, lineHeight: 1.5, color: "#666",
                        background: msg.role === "You" ? "rgba(0,0,0,.03)" : "rgba(0,0,0,.015)",
                        borderRadius: 8, padding: "6px 10px", flex: 1,
                      }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2 — Connect tools */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "28px 28px",
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>2</span>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Connect your tools</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>One-click OAuth to Gmail, Slack, Shopify, HubSpot, Stripe, and more. Your agent gets real read/write access.</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                  {[
                    { icon: <SiGmail size={16} />, name: "Gmail" },
                    { icon: <SiSlack size={16} />, name: "Slack" },
                    { icon: <SiShopify size={16} />, name: "Shopify" },
                    { icon: <SiStripe size={16} />, name: "Stripe" },
                    { icon: <SiHubspot size={16} />, name: "HubSpot" },
                    { icon: <SiNotion size={16} />, name: "Notion" },
                  ].map((tool) => (
                    <div key={tool.name} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "8px 14px", borderRadius: 10,
                      background: "rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.04)",
                    }}>
                      <span style={{ color: "#666", display: "flex" }}>{tool.icon}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: "#555" }}>{tool.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3 — Knowledge */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "28px 28px",
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>3</span>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Add your knowledge</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>Upload PDFs, CSVs, or paste text. Everything gets vector-indexed so your agent can retrieve the right context at runtime.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { name: "refund-policy.pdf", size: "240 KB" },
                    { name: "product-catalog.csv", size: "1.2 MB" },
                    { name: "brand-guide.pdf", size: "890 KB" },
                  ].map((file) => (
                    <div key={file.name} style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10,
                      background: "rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.04)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{file.name}</div>
                      <div style={{ fontSize: 10.5, color: "#999" }}>{file.size}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4 — Test */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "28px 28px",
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>4</span>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Test live</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>Chat with your agent in a sandbox. See exactly which tools it calls, what knowledge it retrieves, and how it responds.</p>
                <div style={{ background: "rgba(0,0,0,.025)", borderRadius: 10, border: "1px solid rgba(0,0,0,.04)", padding: "12px 14px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ height: 6, width: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: "#555", fontWeight: 500 }}>Called <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>shopify.getOrder(#4821)</span></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ height: 6, width: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: "#555", fontWeight: 500 }}>Retrieved <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888" }}>refund-policy.pdf chunk 3</span></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ height: 6, width: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, color: "#555", fontWeight: 500 }}>Response: &quot;Your refund for order #4821 has been approved.&quot;</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 — Publish */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 20,
              padding: "28px 28px",
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>5</span>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Publish and earn</div>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 16px" }}>Set per-use or monthly pricing, submit for review, and go live on the marketplace. You keep 85% of every transaction.</p>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { val: "85%", label: "Revenue share" },
                    { val: "$0", label: "To start" },
                    { val: "Monthly", label: "Payouts" },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      flex: 1, textAlign: "center" as const,
                      padding: "12px 0", borderRadius: 10,
                      background: "rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.04)",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em" }}>{stat.val}</div>
                      <div style={{ fontSize: 10.5, color: "#999", fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ maxWidth: 400, margin: "0 auto", padding: "0 24px 60px", textAlign: "center" as const }}>
          <h3 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to build?</h3>
          <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>Have your first agent live in under 10 minutes.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
            <Link href="/auth?mode=signup" style={{
              padding: "11px 24px", background: "#1A1A1A", color: "#fff", borderRadius: 8,
              fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all .2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "#333"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1A1A1A"; }}>
              Open Studio
            </Link>
            <Link href="/marketplace" style={{
              padding: "11px 20px", background: "transparent",
              border: "1px solid rgba(0,0,0,.1)", color: "#666",
              borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "all .15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,.2)"; e.currentTarget.style.color = "#333"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,.1)"; e.currentTarget.style.color = "#666"; }}>
              Browse Marketplace
            </Link>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
