'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/layout/PublicShell';

/* ─── Billing Toggle ─── */
function BillingToggle({ annual, setAnnual }: { annual: boolean; setAnnual: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 40 }}>
      <span style={{ fontSize: 14, fontWeight: annual ? 400 : 600, color: annual ? "#BBB" : "#1A1A1A", transition: "all 0.2s ease" }}>Monthly</span>
      <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer", padding: 3, background: annual ? "#1A1A1A" : "rgba(0,0,0,0.12)", transition: "background 0.25s ease", display: "flex", alignItems: "center", position: "relative" }}>
        <div style={{ width: 20, height: 20, borderRadius: 10, background: "white", transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)", transform: annual ? "translateX(22px)" : "translateX(0)", boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }} />
      </button>
      <span style={{ fontSize: 14, fontWeight: annual ? 600 : 400, color: annual ? "#1A1A1A" : "#BBB", transition: "all 0.2s ease" }}>Annual</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: annual ? "#22C55E" : "transparent", background: annual ? "rgba(34,197,94,0.08)" : "transparent", borderRadius: 6, padding: "3px 9px", transition: "all 0.25s ease" }}>Save 20%</span>
    </div>
  );
}

/* ─── Icons ─── */
function Check() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>; }
function Dash() { return <div style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, background: "rgba(0,0,0,0.025)", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 8, height: 1.5, borderRadius: 1, background: "#DDD" }} /></div>; }

/* ─── Usage Bar ─── */
function UsageBar({ label, value, max }: { label: string; value: string; max: number }) {
  const pct = Math.min((parseInt(value.replace(/,/g, '')) / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", fontWeight: 450 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{value}</span>
      </div>
      <div style={{ width: "100%", height: 3, borderRadius: 2, background: "rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: "linear-gradient(90deg, #1A1A1A, #555)", transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </div>
    </div>
  );
}

/* ─── Task Icon ─── */
function TaskIcon({ type }: { type: string }) {
  const s = 16;
  const c = "#888";
  const sw = "1.6";
  const icons: Record<string, React.ReactNode> = {
    email: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,4 12,13 2,4"/></svg>,
    slack: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19v-1.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>,
    draft: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    lead: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    order: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    a2a: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
  };
  return (
    <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {icons[type] || icons.a2a}
    </div>
  );
}

/* ─── Types ─── */
interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  tasks: number;
  a2aCalls: number;
  features: PlanFeature[];
}

/* ─── Plan Card ─── */
function PlanCard({ plan, annual, popular }: { plan: Plan; annual: boolean; popular: boolean }) {
  const price = annual ? plan.priceAnnual : plan.priceMonthly;
  const isFree = plan.priceMonthly === 0;
  return (
    <div style={{
      width: "100%", maxWidth: 272, position: "relative",
      background: "white",
      border: popular ? "2px solid #1A1A1A" : "1px solid rgba(0,0,0,.08)",
      borderRadius: 16, padding: "32px 22px 26px",
      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
      display: "flex", flexDirection: "column" as const,
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,.02)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)"; }}>

      {popular && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 12, fontWeight: 600, color: "#FFF", background: "#1A1A1A", borderRadius: 8, padding: "4px 14px" }}>Most Popular</div>}

      <span style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 6 }}>{plan.name}</span>
      <p style={{ fontSize: 13, color: "#666", lineHeight: 1.5, marginBottom: 18, minHeight: 36 }}>{plan.description}</p>

      {/* Price */}
      <div style={{ marginBottom: 16, minHeight: 62 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em" }}>${price}</span>
          {!isFree && <span style={{ fontSize: 14, color: "#999", fontWeight: 400 }}>/mo</span>}
        </div>
        <p style={{ fontSize: 12, color: "#999", marginTop: 4, visibility: isFree ? "hidden" : "visible" as const }}>{annual ? `Billed $${price * 12}/year` : "Billed monthly"}</p>
      </div>

      {/* Usage bars */}
      <UsageBar label="Agent tasks / month" value={plan.tasks.toLocaleString()} max={5000} />
      <UsageBar label="A2A workflows / month" value={plan.a2aCalls.toLocaleString()} max={1000} />

      {/* CTA */}
      <Link href="/auth?mode=signup" style={{
        display: "block", textAlign: "center" as const, textDecoration: "none", fontSize: 14, fontWeight: 600,
        borderRadius: 10, padding: "12px 0", marginTop: 14, marginBottom: 20, transition: "all 0.15s ease",
        ...(popular
          ? { color: "#FFF", background: "#1A1A1A", border: "1.5px solid #1A1A1A" }
          : { color: "#1A1A1A", background: "rgba(0,0,0,.03)", border: "1px solid rgba(0,0,0,.08)" }
        ),
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { if (popular) e.currentTarget.style.background = "#333"; else e.currentTarget.style.background = "rgba(0,0,0,.06)"; }}
      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { if (popular) e.currentTarget.style.background = "#1A1A1A"; else e.currentTarget.style.background = "rgba(0,0,0,.03)"; }}
      >{isFree ? "Get Started Free" : "Start 14-Day Free Trial"}</Link>

      <div style={{ height: 1, background: "rgba(0,0,0,0.05)", marginBottom: 16 }} />

      <div style={{ display: "flex", flexDirection: "column" as const, gap: 9, flex: 1 }}>
        {plan.features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
            {f.included ? <Check /> : <Dash />}
            <span style={{ fontSize: 13, color: f.included ? "#555" : "#CCC", lineHeight: 1.4, fontWeight: f.highlight ? 550 : 400 }}>
              {f.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── FAQ ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" as const }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#1A1A1A", paddingRight: 16 }}>{question}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0, transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)", overflow: "hidden" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6, paddingBottom: 18 }}>{answer}</p>
      </div>
    </div>
  );
}

/* ─── Task Pack Card ─── */
function TaskPack({ tasks, price, perTask, popular = false }: { tasks: number; price: number; perTask: string; popular?: boolean }) {
  return (
    <div style={{
      flex: 1, minWidth: 160, background: "white",
      border: popular ? "2px solid #1A1A1A" : "1px solid rgba(0,0,0,.08)",
      borderRadius: 14, padding: "20px 18px", textAlign: "center" as const,
      transition: "all 0.2s ease", position: "relative" as const,
      boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
    }}
    onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.06)"; }}
    onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)"; }}>
      {popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: "#22C55E", background: "rgba(34,197,94,0.08)", borderRadius: 6, padding: "2px 10px" }}>Best Value</div>}
      <div style={{ fontSize: 22, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: 2 }}>{tasks}</div>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 10 }}>tasks</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: "#1A1A1A", marginBottom: 2 }}>${price}</div>
      <div style={{ fontSize: 11, color: "#999" }}>${perTask}/task</div>
    </div>
  );
}

/* ─── Data ─── */
const PLANS: Plan[] = [
  {
    name: "Free",
    description: "Explore the platform. Build and test agents with no commitment.",
    priceMonthly: 0, priceAnnual: 0, tasks: 50, a2aCalls: 5,
    features: [
      { text: "50 agent tasks / month", included: true, highlight: true },
      { text: "5 A2A workflows / month", included: true, highlight: true },
      { text: "3 active agents", included: true },
      { text: "Agent Studio: build & test", included: true },
      { text: "Basic integrations (Gmail, Slack)", included: true },
      { text: "Marketplace access (free agents)", included: true },
      { text: "7-day execution history", included: true },
      { text: "Community support", included: true },
      { text: "Marketplace publishing", included: false },
      { text: "All integrations", included: false },
    ],
  },
  {
    name: "Starter",
    description: "For individuals automating their first real workflows.",
    priceMonthly: 29, priceAnnual: 23, tasks: 250, a2aCalls: 25,
    features: [
      { text: "250 agent tasks / month", included: true, highlight: true },
      { text: "25 A2A workflows / month", included: true, highlight: true },
      { text: "10 active agents", included: true },
      { text: "Agent Studio: build & publish", included: true },
      { text: "All 10+ integrations", included: true },
      { text: "All marketplace agents", included: true },
      { text: "30-day execution history", included: true },
      { text: "Email support", included: true },
      { text: "Marketplace publishing (85/15 rev share)", included: true },
      { text: "Scheduled agents", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For teams running production workflows at scale.",
    priceMonthly: 99, priceAnnual: 79, tasks: 1500, a2aCalls: 200,
    features: [
      { text: "1,500 agent tasks / month", included: true, highlight: true },
      { text: "200 A2A workflows / month", included: true, highlight: true },
      { text: "Unlimited active agents", included: true },
      { text: "Agent Studio: build & publish", included: true },
      { text: "All integrations + priority access", included: true },
      { text: "All marketplace agents", included: true },
      { text: "90-day execution history & logs", included: true },
      { text: "Priority email & chat support", included: true },
      { text: "Marketplace publishing (85/15 rev share)", included: true },
      { text: "Scheduled agents & auto-runs", included: true },
    ],
  },
  {
    name: "Business",
    description: "For companies that need power, governance, and custom infrastructure.",
    priceMonthly: 299, priceAnnual: 239, tasks: 5000, a2aCalls: 1000,
    features: [
      { text: "5,000 agent tasks / month", included: true, highlight: true },
      { text: "1,000 A2A workflows / month", included: true, highlight: true },
      { text: "Unlimited active agents", included: true },
      { text: "Agent Studio: build & publish", included: true },
      { text: "All integrations + custom connectors", included: true },
      { text: "Unlimited execution history & audit logs", included: true },
      { text: "SSO & role-based permissions", included: true },
      { text: "Dedicated support & onboarding", included: true },
      { text: "Marketplace publishing (85/15 rev share)", included: true },
      { text: "Scheduled agents, webhooks, & API access", included: true },
    ],
  },
];

const FAQ_DATA = [
  { question: "What counts as an agent task?", answer: "An agent task is a single execution cycle. When an agent reads an email, sends a Slack message, qualifies a lead, or processes an order, that's one task. Simple actions (classify an email) and complex ones (draft a full response with CRM lookup) both count as one task. The platform automatically routes to the right AI model to optimize cost and quality behind the scenes." },
  { question: "What's an A2A workflow?", answer: "An A2A (agent-to-agent) workflow is when multiple agents coordinate to handle a request. For example: a lead comes in, one agent qualifies it, another drafts a follow-up email, and a third updates your CRM. That entire orchestrated flow counts as one A2A workflow, regardless of how many agents are involved." },
  { question: "How does marketplace agent pricing work?", answer: "Your plan covers platform usage (tasks and A2A workflows). Marketplace agents have their own pricing set by their creators. Free agents are included on every plan. Paid agents (set by creators as hourly, daily, or monthly rentals) are billed separately. When you run a marketplace agent, it deducts from your task pool. The agent rental fee covers access, your plan covers compute." },
  { question: "What happens when I run out of tasks?", answer: "Your agents pause until your next billing cycle. You'll get notifications at 80% and 100% usage. You can purchase task packs anytime to top up immediately without changing your plan. Pro and Business users can enable auto-recharge to avoid interruptions." },
  { question: "Can I change plans anytime?", answer: "Yes. Upgrade instantly and get prorated task allocation for the remainder of your cycle. Downgrades take effect at your next billing date. Unused task packs carry over regardless of plan changes." },
  { question: "Is there a free trial for paid plans?", answer: "Yes. Starter, Pro, and Business plans come with a 14-day free trial with full task limits. No credit card required to start. If you don't convert, you'll automatically drop to the Free plan with no data loss." },
  { question: "What integrations are included?", answer: "Free includes Gmail and Slack. Starter and above include all integrations: Gmail, Slack, Shopify, Stripe, HubSpot, Notion, GitHub, Linear, Intercom, Zendesk, Jira, Salesforce, and more. Business plans can request custom connectors for internal tools." },
  { question: "How does creator revenue sharing work?", answer: "Creators keep 85% of every marketplace transaction. When someone rents your agent, 85% goes to you and 15% covers platform costs. Payouts are processed monthly via Stripe Connect with a $10 minimum threshold. You set your own pricing for hourly, daily, or monthly rentals." },
];

/* ─── Main ─── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <PublicShell>
      <div style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          ::selection { background: #1A1A1A; color: white; }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>

          {/* Hero */}
          <section style={{ textAlign: "center" as const, padding: "20px 24px 36px", animation: "fadeUp 0.6s ease both" }}>
            <h1 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
              Pricing
            </h1>
            <p style={{ fontSize: 14, color: "#999", margin: "0 auto", maxWidth: 420 }}>
              Pay for what you use. Every plan includes Agent Studio, orchestration, and marketplace access.
            </p>
          </section>

          {/* Toggle */}
          <div style={{ animation: "fadeUp 0.6s ease both", animationDelay: "0.06s" }}>
            <BillingToggle annual={annual} setAnnual={setAnnual} />
          </div>

          {/* Plan cards */}
          <section style={{ maxWidth: 1220, margin: "0 auto 52px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.1s" }}>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" as const, alignItems: "stretch" }}>
              {PLANS.map((plan) => (
                <PlanCard key={plan.name} plan={plan} annual={annual} popular={plan.name === "Pro"} />
              ))}
            </div>
          </section>

          {/* Marketplace callout */}
          <section style={{ maxWidth: 800, margin: "0 auto 52px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.14s" }}>
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
              padding: "24px 28px", display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>Marketplace agents are priced separately</h4>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: 0 }}>Free agents work on every plan. Paid agents are priced by their creators and billed separately. Your plan&apos;s task limit covers the compute to run them. Creators earn 85% of every transaction.</p>
              </div>
            </div>
          </section>

          {/* How tasks work */}
          <section style={{ maxWidth: 640, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.18s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", margin: "0 0 6px" }}>One task = one agent execution</h2>
              <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Simple or complex, every action counts as one task.</p>
            </div>
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
              padding: "24px 28px 16px", display: "flex", flexDirection: "column" as const,
            }}>
              {[
                { action: "Classify an incoming email", tasks: "1 task", type: "email" },
                { action: "Send a Slack notification", tasks: "1 task", type: "slack" },
                { action: "Draft and send an email response", tasks: "1 task", type: "draft" },
                { action: "Qualify a lead with CRM lookup", tasks: "1 task", type: "lead" },
                { action: "Process a Shopify order update", tasks: "1 task", type: "order" },
                { action: "A2A workflow (3 agents coordinating)", tasks: "1 workflow", type: "a2a" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TaskIcon type={item.type} />
                    <span style={{ fontSize: 14, color: "#555", fontWeight: 450 }}>{item.action}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", background: "rgba(0,0,0,0.03)", borderRadius: 7, padding: "4px 10px", whiteSpace: "nowrap" as const }}>{item.tasks}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Task Packs */}
          <section style={{ maxWidth: 640, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.22s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 20 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", margin: "0 0 6px" }}>Task packs</h2>
              <p style={{ fontSize: 14, color: "#999", margin: 0 }}>Top up anytime. No commitment. Extra tasks never expire.</p>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
              <TaskPack tasks={100} price={9} perTask="0.09" />
              <TaskPack tasks={500} price={39} perTask="0.078" popular />
              <TaskPack tasks={2000} price={129} perTask="0.065" />
            </div>
          </section>

          {/* Comparison table */}
          <section style={{ maxWidth: 920, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.26s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Compare plans</h2>
            </div>
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
              overflow: "hidden",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "16px 24px" }}>
                <span />
                {["Free", "Starter", "Pro", "Business"].map(n => <span key={n} style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A", textAlign: "center" as const }}>{n}</span>)}
              </div>
              {[
                { label: "Monthly price", vals: ["$0", "$29", "$99", "$299"] },
                { label: "Agent tasks / month", vals: ["50", "250", "1,500", "5,000"] },
                { label: "A2A workflows / month", vals: ["5", "25", "200", "1,000"] },
                { label: "Active agents", vals: ["3", "10", "Unlimited", "Unlimited"] },
                { label: "Integrations", vals: ["2", "All", "All", "All + custom"] },
                { label: "Marketplace publishing", vals: [false, true, true, true] },
                { label: "Scheduled agents", vals: [false, false, true, true] },
                { label: "SSO & permissions", vals: [false, false, false, true] },
                { label: "Execution history", vals: ["7 days", "30 days", "90 days", "Unlimited"] },
                { label: "Support", vals: ["Community", "Email", "Priority", "Dedicated"] },
              ].map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", borderBottom: i < 9 ? "1px solid rgba(0,0,0,0.04)" : "none", padding: "12px 24px", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#555", fontWeight: 450 }}>{row.label}</span>
                  {row.vals.map((v, j) => (
                    <div key={j} style={{ textAlign: "center" as const }}>
                      {typeof v === "boolean" ? (v ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline" }}><polyline points="20 6 9 17 4 12"/></svg> : <span style={{ display: "inline-block", width: 10, height: 1.5, borderRadius: 1, background: "#DDD" }} />) : <span style={{ fontSize: 12.5, color: "#555", fontWeight: 500 }}>{v}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>

          {/* Cost transparency */}
          <section style={{ maxWidth: 640, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.3s" }}>
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
              padding: "32px 28px",
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A1A", marginBottom: 6, letterSpacing: "-0.01em" }}>You pay for outcomes, not tokens</h3>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, marginBottom: 20 }}>Every agent task runs on state-of-the-art AI models. Our smart router automatically selects the right model for each job &mdash; fast and cheap for simple actions, powerful for complex reasoning. You don&apos;t need to think about models, tokens, or API costs.</p>
              <div style={{ display: "flex", gap: 16 }}>
                {[
                  { val: "Smart routing", desc: "Haiku for simple, Sonnet for complex" },
                  { val: "Prompt caching", desc: "Reduces redundant processing" },
                  { val: "Predictable billing", desc: "No surprise token overages" },
                ].map((item) => (
                  <div key={item.val} style={{
                    flex: 1, padding: "12px 14px", borderRadius: 10,
                    background: "rgba(0,0,0,.025)", border: "1px solid rgba(0,0,0,.04)",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A", marginBottom: 3 }}>{item.val}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section style={{ maxWidth: 640, margin: "0 auto 56px", padding: "0 24px", animation: "fadeUp 0.6s ease both", animationDelay: "0.34s" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em" }}>Common questions</h2>
            </div>
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid rgba(0,0,0,.08)", boxShadow: "0 2px 8px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.02)",
              padding: "4px 28px",
            }}>
              {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.question} answer={faq.answer} />)}
            </div>
          </section>

          {/* Bottom CTA */}
          <section style={{ maxWidth: 400, margin: "0 auto", padding: "0 24px 60px", textAlign: "center" as const }}>
            <h3 style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.02em", marginBottom: 8 }}>Ready to put AI agents to work?</h3>
            <p style={{ fontSize: 14, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>Start free with 50 tasks. Upgrade when you need more.</p>
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
