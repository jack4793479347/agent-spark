'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { PublicShell } from '@/components/layout/PublicShell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import {
  SiGmail, SiSlack, SiShopify, SiStripe, SiHubspot,
  SiNotion, SiGithub, SiLinear, SiIntercom, SiZendesk,
  SiJira, SiSalesforce, SiGooglesheets, SiGooglecalendar,
  SiAirtable,
} from 'react-icons/si';

/* ═══════════════════════════════════════════════════════════════
   BRAND ICON MAP
   ═══════════════════════════════════════════════════════════════ */

const BRAND_ICON: Record<string, React.ReactNode> = {
  Gmail: <SiGmail size={14} />,
  Slack: <SiSlack size={14} />,
  Shopify: <SiShopify size={14} />,
  Stripe: <SiStripe size={14} />,
  HubSpot: <SiHubspot size={14} />,
  Notion: <SiNotion size={14} />,
  GitHub: <SiGithub size={14} />,
  Linear: <SiLinear size={14} />,
  Intercom: <SiIntercom size={14} />,
  Zendesk: <SiZendesk size={14} />,
  Jira: <SiJira size={14} />,
  Salesforce: <SiSalesforce size={14} />,
  "Google Sheets": <SiGooglesheets size={14} />,
  "Google Calendar": <SiGooglecalendar size={14} />,
  Airtable: <SiAirtable size={14} />,
};

const BRAND_ICON_LG: Record<string, React.ReactNode> = {
  Gmail: <SiGmail size={22} />,
  Slack: <SiSlack size={22} />,
  Shopify: <SiShopify size={22} />,
  Stripe: <SiStripe size={22} />,
  HubSpot: <SiHubspot size={22} />,
  Notion: <SiNotion size={22} />,
  GitHub: <SiGithub size={22} />,
  Linear: <SiLinear size={22} />,
  Intercom: <SiIntercom size={22} />,
  Zendesk: <SiZendesk size={22} />,
  Jira: <SiJira size={22} />,
  Salesforce: <SiSalesforce size={22} />,
};

/* ═══════════════════════════════════════════════════════════════
   AGENT DATA
   ═══════════════════════════════════════════════════════════════ */

interface AgentCard {
  name: string;
  desc: string;
  price: string;
  unit: string;
  by: string;
  rating: number;
  reviews: number;
  integrations: string[];
  category: string;
  image: string;
}

const SHOWCASE_AGENTS: AgentCard[] = [
  { name: "Shopify Returns Handler", desc: "Processes return requests, validates orders, and issues refunds automatically through Shopify API.", price: "$1.00", unit: "/call", by: "ShipStack", rating: 4.7, reviews: 84, integrations: ["Shopify", "Slack"], category: "E-commerce", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=300&fit=crop" },
  { name: "Smart Email Responder", desc: "Sends contextual replies, follow-ups, and status updates to customers based on conversation history.", price: "$0.50", unit: "/call", by: "AgentLabs", rating: 4.9, reviews: 203, integrations: ["Gmail", "Intercom"], category: "Communication", image: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&h=300&fit=crop" },
  { name: "Lead Qualifier Pro", desc: "Scores inbound leads against your ICP, enriches data, and routes hot prospects to your sales team.", price: "$2.00", unit: "/call", by: "PipelineAI", rating: 4.8, reviews: 156, integrations: ["HubSpot", "Slack"], category: "Sales", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop" },
  { name: "Invoice Processor", desc: "Extracts line items from invoices, matches to POs, and syncs to your accounting system automatically.", price: "$0.75", unit: "/call", by: "FinBot", rating: 4.6, reviews: 67, integrations: ["Stripe", "Google Sheets"], category: "Finance", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=300&fit=crop" },
  { name: "Content Calendar Agent", desc: "Plans, drafts, and schedules social media posts across platforms based on your brand guidelines.", price: "$3.00", unit: "/call", by: "ContentCo", rating: 4.5, reviews: 112, integrations: ["Notion", "Slack"], category: "Marketing", image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=300&fit=crop" },
  { name: "Customer Support Triage", desc: "Classifies incoming tickets by urgency and topic, drafts initial responses, and escalates when needed.", price: "$0.30", unit: "/call", by: "SupportFlow", rating: 4.9, reviews: 341, integrations: ["Intercom", "Slack"], category: "Support", image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=300&fit=crop" },
  { name: "Meeting Scheduler", desc: "Coordinates availability across team calendars and proposes optimal meeting times to external contacts.", price: "Free", unit: "", by: "CalSync", rating: 4.4, reviews: 89, integrations: ["Google Calendar", "Gmail"], category: "Productivity", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&h=300&fit=crop" },
  { name: "Inventory Sync Agent", desc: "Keeps inventory counts in sync across Shopify, warehouses, and spreadsheets in real time.", price: "$1.50", unit: "/call", by: "StockBot", rating: 4.7, reviews: 78, integrations: ["Shopify", "Airtable"], category: "E-commerce", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=300&fit=crop" },
  { name: "Competitive Intel Monitor", desc: "Tracks competitor pricing, product launches, and marketing campaigns. Delivers weekly digest reports.", price: "$5.00", unit: "/mo", by: "IntelAgent", rating: 4.3, reviews: 45, integrations: ["Notion", "Gmail"], category: "Research", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop" },
  { name: "Onboarding Coordinator", desc: "Guides new hires through onboarding steps, sends reminders, and collects document signatures.", price: "$2.00", unit: "/call", by: "PeopleOps", rating: 4.6, reviews: 92, integrations: ["Slack", "Google Calendar"], category: "HR", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&h=300&fit=crop" },
  { name: "Deal Closer Assistant", desc: "Drafts proposals, follows up on stale opportunities, and updates pipeline stages in your CRM.", price: "$3.00", unit: "/call", by: "CloserAI", rating: 4.8, reviews: 134, integrations: ["HubSpot", "Gmail"], category: "Sales", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=300&fit=crop" },
  { name: "Data Cleaner", desc: "Deduplicates records, normalizes formats, and flags anomalies across your connected data sources.", price: "$1.00", unit: "/call", by: "CleanSheet", rating: 4.5, reviews: 61, integrations: ["Airtable", "Google Sheets"], category: "Data", image: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&h=300&fit=crop" },
];

const col1 = SHOWCASE_AGENTS.slice(0, 4);
const col2 = SHOWCASE_AGENTS.slice(4, 8);
const col3 = SHOWCASE_AGENTS.slice(8, 12);

/* ═══════════════════════════════════════════════════════════════
   AGENT CARD — workflow-builder style
   ═══════════════════════════════════════════════════════════════ */

function AgentWorkflowCard({ agent }: { agent: AgentCard }) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="w-[280px] cursor-pointer"
    >
      <Card className="overflow-hidden rounded-xl border-white/30 bg-white/20 backdrop-blur-xl shadow-sm transition-shadow duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="relative h-28 w-full overflow-hidden">
          <img
            src={agent.image}
            alt={agent.name}
            className="h-full w-full object-cover transition-transform duration-500"
            style={{ transform: isHovered ? "scale(1.05)" : "scale(1)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {/* Price overlay */}
          <div className="absolute bottom-2 left-3 flex items-baseline gap-1">
            <span className="text-sm font-semibold text-white drop-shadow-md">{agent.price}</span>
            {agent.unit && <span className="text-[10px] text-white/70">{agent.unit}</span>}
          </div>
          {/* Rating overlay */}
          <div className="absolute bottom-2 right-3 flex items-center gap-1 rounded-full bg-black/20 backdrop-blur-sm px-2 py-0.5">
            <Star size={10} fill="#F59E0B" stroke="none" />
            <span className="text-[11px] font-semibold text-white">{agent.rating}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[10.5px] text-[#999]">
                <span className="font-medium">{agent.category}</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span>Active</span>
                </div>
              </div>
              <h3 className="mt-1 text-[14px] font-semibold text-[#1A1A1A] leading-tight">{agent.name}</h3>
            </div>
          </div>

          {/* Hover-reveal description + tags */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                key="details"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 8, transition: { duration: 0.25, ease: "easeInOut" } }}
                exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.2 } }}
                className="overflow-hidden"
              >
                <p className="text-[12px] text-[#888] leading-relaxed">{agent.desc}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-black/[.03] border-0 text-[#888] font-medium">{agent.category}</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-black/[.03] border-0 text-[#888] font-medium">{agent.reviews} reviews</Badge>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/[.04] px-3.5 py-2.5">
          <span className="text-[11px] text-[#BBB]">
            by <span className="font-semibold text-[#999]">{agent.by}</span>
          </span>
          <div className="flex items-center -space-x-1.5">
            {agent.integrations.map((name) => (
              <div
                key={name}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 border border-black/[.04] text-[#888]"
                title={name}
              >
                {BRAND_ICON[name] ? React.cloneElement(BRAND_ICON[name] as React.ReactElement, { size: 11 }) : null}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SCROLLING COLUMN
   ═══════════════════════════════════════════════════════════════ */

function AgentColumn({ agents, duration, className }: { agents: AgentCard[]; duration: number; className?: string }) {
  return (
    <div className={className} style={{ overflow: "hidden" }}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        className="flex flex-col gap-4 pb-4"
      >
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {agents.map((agent, i) => (
              <AgentWorkflowCard key={`${loop}-${i}`} agent={agent} />
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEPS + MARQUEE DATA
   ═══════════════════════════════════════════════════════════════ */

const STEPS = [
  { num: "01", title: "Describe your goal", desc: "Tell us what you want to automate in plain English. No technical knowledge required." },
  { num: "02", title: "We assemble a team", desc: "Our engine searches the marketplace and picks the best agents for your workflow." },
  { num: "03", title: "Activate and run", desc: "One click to deploy. Your AI team handles the work while you focus on growth." },
];

const MARQUEE_INTEGRATIONS = ["Gmail", "Slack", "Shopify", "Stripe", "HubSpot", "Notion", "GitHub", "Linear", "Intercom", "Zendesk", "Jira", "Salesforce"];

function IntegrationChip({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0 bg-white/45 border border-black/[.04] rounded-[10px] px-4 py-2.5 transition-all">
      <span className="flex text-[#666]">{BRAND_ICON_LG[name]}</span>
      <span className="text-[13px] text-[#555] font-medium">{name}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function MarketplacePage() {
  return (
    <PublicShell>
      <div style={{ fontFamily: "var(--font-inter), 'Inter', sans-serif" }}>
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
          @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
          ::selection { background:#1A1A1A; color:#fff }
        `}</style>

        <div style={{ position: "relative", zIndex: 10 }}>

          {/* ===== HEADER + SCROLLING CARDS ===== */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ padding: "0 0 40px" }}
          >
            <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
              <h1 style={{ fontSize: 32, fontWeight: 300, color: "#1A1A1A", letterSpacing: "-0.03em", margin: "0 0 8px" }}>
                Marketplace
              </h1>
              <p style={{ fontSize: 14, color: "#999", margin: 0 }}>
                Browse and rent AI agents that connect to your tools and run autonomously.
              </p>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              maxHeight: 740,
              overflow: "hidden",
              maskImage: "linear-gradient(to bottom, transparent, black 6%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 6%, black 90%, transparent)",
            }}>
              <AgentColumn agents={col1} duration={26} />
              <AgentColumn agents={col2} duration={32} className="hidden md:block" />
              <AgentColumn agents={col3} duration={29} className="hidden lg:block" />
            </div>
          </motion.div>

          {/* ===== INTEGRATIONS MARQUEE ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            style={{ maxWidth: 860, margin: "0 auto 40px", padding: "0 20px" }}
          >
            <div style={{
              background: "rgba(255,255,255,.2)",
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              border: "1px solid rgba(255,255,255,.4)",
              borderRadius: 16,
              padding: "20px 0",
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0,0,0,.03)",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to right, rgba(245,245,250,0.9), transparent)", zIndex: 2 }} />
              <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80, background: "linear-gradient(to left, rgba(245,245,250,0.9), transparent)", zIndex: 2 }} />
              <div style={{ display: "flex", gap: 12, animation: "marquee 35s linear infinite", width: "max-content" }}>
                {[...MARQUEE_INTEGRATIONS, ...MARQUEE_INTEGRATIONS].map((name, i) => (
                  <IntegrationChip key={i} name={name} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ===== HOW IT WORKS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            style={{ maxWidth: 640, margin: "0 auto 0", padding: "0 20px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 20,
                    padding: "28px 0",
                    borderBottom: i < STEPS.length - 1 ? "1px solid rgba(0,0,0,.05)" : "none",
                  }}
                >
                  <span style={{ fontSize: 36, fontWeight: 200, color: "rgba(0,0,0,.08)", letterSpacing: "-0.04em", lineHeight: 1, flexShrink: 0, width: 48 }}>
                    {step.num}
                  </span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#1A1A1A", marginBottom: 4, letterSpacing: "-0.01em" }}>{step.title}</div>
                    <p style={{ fontSize: 14, color: "#888", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div style={{ height: 20 }} />

        </div>
      </div>
    </PublicShell>
  );
}
