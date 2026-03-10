'use client';

import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';

/* ─── Main ─── */
export default function AboutPage() {
  return (
    <PublicShell>
      <div style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          ::selection { background: #1A1A1A; color: white; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>

          {/* Hero */}
          <section style={{ textAlign: "center" as const, padding: "20px 24px 0", animation: "fadeUp 0.6s ease both" }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              About Agent Spark
            </h1>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, maxWidth: 500, margin: "0 auto" }}>
              A full-stack AI agent platform. Train agents through conversation, connect them to your real tools, publish to a marketplace, and orchestrate multi-agent workflows &mdash; all without writing code.
            </p>
          </section>

          {/* Stats */}
          <section style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 0", animation: "fadeUp 0.6s ease both", animationDelay: "0.08s" }}>
            <div style={{
              display: "flex", flexWrap: "wrap" as const,
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              {[
                { value: "10+", label: "OAuth integrations" },
                { value: "A2A", label: "Agent orchestration" },
                { value: "85%", label: "Creator revenue share" },
                { value: "$0", label: "To get started" },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, minWidth: 140, textAlign: "center" as const, padding: "24px 16px" }}>
                  <div style={{ fontSize: 28, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 6 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* What we do */}
          <section style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 0", animation: "fadeUp 0.6s ease both", animationDelay: "0.12s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", margin: "0 0 6px" }}>AI agents that actually do work</h2>
              <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Most AI tools give you advice. Agent Spark gives you agents that execute.</p>
            </div>
          </section>

          {/* Four Pillars */}
          <section style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.16s" }}>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>

              {/* Pillar 1 — Training */}
              <div style={{
                background: "white", borderRadius: 14, padding: "28px 28px",
                border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
                display: "flex", alignItems: "flex-start", gap: 20,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Conversational Agent Training</h3>
                  <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 14px" }}>Build AI agents by having a conversation. Describe the role, provide examples, upload documents &mdash; the agent learns from you in real time.</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Natural language training", "RAG knowledge base", "PDF & URL uploads", "Live sandbox testing"].map((f) => (
                      <span key={f} style={{ fontSize: 12, color: "#555", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.04)", borderRadius: 8, padding: "4px 10px" }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pillar 2 — Tool Execution */}
              <div style={{
                background: "white", borderRadius: 14, padding: "28px 28px",
                border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
                display: "flex", alignItems: "flex-start", gap: 20,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Real Tool Execution</h3>
                  <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 14px" }}>Agents don&apos;t just suggest actions &mdash; they execute them. OAuth integrations let agents read emails, send messages, update CRMs, and manage orders.</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Gmail", "Slack", "Shopify", "Stripe", "HubSpot", "Notion", "GitHub", "Linear", "Jira", "Salesforce"].map((f) => (
                      <span key={f} style={{ fontSize: 12, color: "#555", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.04)", borderRadius: 8, padding: "4px 10px" }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pillar 3 — Marketplace */}
              <div style={{
                background: "white", borderRadius: 14, padding: "28px 28px",
                border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
                display: "flex", alignItems: "flex-start", gap: 20,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Agent Marketplace</h3>
                  <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 14px" }}>A creator economy for AI agents. Builders publish agents to the marketplace, set their own pricing, and earn 85% of every rental.</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Browse by category", "Rent per hour/day/month", "Creator analytics", "Ratings & reviews"].map((f) => (
                      <span key={f} style={{ fontSize: 12, color: "#555", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.04)", borderRadius: 8, padding: "4px 10px" }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pillar 4 — Orchestration */}
              <div style={{
                background: "white", borderRadius: 14, padding: "28px 28px",
                border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
                display: "flex", alignItems: "flex-start", gap: 20,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Agent-to-Agent Orchestration</h3>
                  <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: "0 0 14px" }}>Agents work together. A lead comes in, one agent qualifies it, another drafts the follow-up, a third updates the CRM &mdash; all coordinated automatically.</p>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {["Multi-agent delegation", "Intelligent routing", "Shared context", "Goal-based assembly"].map((f) => (
                      <span key={f} style={{ fontSize: 12, color: "#555", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.04)", borderRadius: 8, padding: "4px 10px" }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* How It Works */}
          <section style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 0", animation: "fadeUp 0.6s ease both", animationDelay: "0.2s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em" }}>From idea to deployed agent in minutes</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
              {[
                { title: "Describe what you need", desc: "Tell Agent Spark your goal in plain language. 'Handle my customer support emails' or 'Qualify inbound leads and update HubSpot'. No technical setup required." },
                { title: "We assemble your agent team", desc: "Our AI analyzes your request, selects the right agents, configures their integrations, and wires them to your tools — automatically." },
                { title: "Agents execute in real time", desc: "Your agents deploy instantly and start working. They read emails, send messages, update records, and coordinate with each other. Monitor everything from your dashboard." },
              ].map((step, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 20,
                  padding: "28px 28px",
                  background: "white", borderRadius: 14,
                  border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", lineHeight: 1, flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(0,0,0,.05)" }}>
                    {i + 1}
                  </span>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>{step.title}</div>
                    <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* For Creators */}
          <section style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px 0", animation: "fadeUp 0.6s ease both", animationDelay: "0.24s" }}>
            <div style={{
              background: "white", borderRadius: 14, padding: "32px 28px",
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>Build an agent once. Earn every time someone rents it.</h3>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, marginBottom: 20 }}>Agent Spark is a creator-first platform. Train an agent using our conversational studio, connect it to real integrations, publish it to the marketplace, and keep 85% of every rental. No coding, no infrastructure, no gatekeepers.</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                {[
                  { val: "Train by talking", desc: "Conversational interface, not config files" },
                  { val: "Real integrations", desc: "OAuth connections to 10+ platforms" },
                  { val: "You set the price", desc: "Hourly, daily, or monthly rentals" },
                  { val: "85% revenue share", desc: "The highest split in the industry" },
                ].map((item) => (
                  <div key={item.val} style={{
                    flex: "1 1 calc(50% - 6px)", padding: "12px 14px", borderRadius: 10,
                    background: "rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.04)",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>{item.val}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section style={{ maxWidth: 400, margin: "0 auto", padding: "56px 24px 60px", textAlign: "center" as const }}>
            <h3 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to put AI agents to work?</h3>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>Try it free. Describe a workflow and watch your agent team assemble.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <Link href="/auth?mode=signup" style={{
                padding: "11px 24px", background: "#1A1A1A", color: "#fff", borderRadius: 8,
                fontSize: 14, fontWeight: 600, textDecoration: "none", transition: "all .2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#333"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1A1A1A"; }}>
                Get Started Free
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
      </div>
    </PublicShell>
  );
}
