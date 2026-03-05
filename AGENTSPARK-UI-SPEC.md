# Agent Spark — UI Specification

## Overview

Agent Spark is an AI agent marketplace where users browse, rent, and orchestrate AI agents that automate business workflows. The platform has two contexts:

1. **Public pages** — Landing page, marketplace, product pages, about, pricing, auth. Each has its own nav bar. No login required.
2. **Authenticated app** — Dashboard, agents, assembler, studio, connections, settings, creator studio, history. Wrapped in a unified sidebar shell.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Auth + DB), Hono API, Zustand

---

## Design System

### Fonts

| Variable | Font | Weights | Usage |
|----------|------|---------|-------|
| `--font-inter` | Inter | 400–800 | Legacy fallback |
| `--font-heading` | Plus Jakarta Sans | 400–800 | CSS headings (h1–h4) |
| `--font-body` / `var(--font-body)` | DM Sans | 400–700 | Body text, labels, nav items |
| `--font-outfit` / `var(--font-outfit)` | Outfit | 200–700 | Agent names, hero headlines, overlays |
| `--font-space-grotesk` / `var(--font-space-grotesk)` | Space Grotesk | 400–700 | Logo "Agent Spark" wordmark |

All five are loaded via `next/font/google` in `app/layout.tsx` and applied as CSS variables on `<html>`.

### Colors — Monochrome Palette

The entire UI is monochrome. No indigo/purple accent colors are used for interactive elements or styling.

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#1A1A1A` | Headings, CTAs, active states, icons |
| `--text-secondary` | `#777` | Secondary text, nav links |
| `--text-tertiary` | `#ABABAB` | Tertiary text, placeholders |
| `#888` / `#999` | — | Descriptions, metadata, muted text |
| `#BBB` / `#CCC` | — | Faint labels, ratings, borders |
| `#DDD` | — | Disabled states |
| `--bg-primary` | `#FFFFFF` | Card backgrounds |
| `--bg-secondary` | `#F2F3F6` | Page background |
| `--bg-tertiary` | `#EBEDF2` | Hover states, scrollbar |
| `--success` | `#10B981` / `#22C55E` | Active badges, verified badges |
| `--warning` | `#F59E0B` | Paused states, high usage bars, star ratings |
| `--error` | `#EF4444` | Error states, critical usage bars |
| `#059669` | — | Free price badges (green) |

### Glass Effect

All elevated surfaces (cards, nav, inputs, sidebars, modals) use glassmorphism:

```css
/* Standard glass card */
background: rgba(255, 255, 255, 0.38);     /* --glass-bg */
backdrop-filter: blur(28px);                /* --glass-blur */
border: 1px solid rgba(255, 255, 255, 0.5);
border-radius: 16px;                        /* --radius-lg */
box-shadow: 0 2px 8px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.04);

/* Inline style pattern (most pages) */
background: rgba(255, 255, 255, 0.5–0.7);
backdropFilter: blur(12–24px);
border: 1px solid rgba(255,255,255, 0.6–0.8);
borderRadius: 14;
padding: 24px;
```

Two CSS classes exist: `.glass-card` (with hover lift + aurora border shimmer) and `.glass-card-static` (no hover effects).

### Inline Styles Convention

Most pages use **inline `style={{}}` props** for visual styling rather than Tailwind utility classes. Tailwind is used for layout (`flex`, `gap`, `items-center`, etc.) but visual properties (colors, fonts, spacing, borders) are inline. This is intentional — preserve this pattern.

### Background System

**Public pages** (landing, marketplace, pricing, etc.): Each page renders its own background:
- Base: `#F2F3F6`
- Aurora orbs: 3–5 large blurred radial gradients (`rgba(255,160,140,0.25)`, `rgba(130,180,255,0.2)`, etc.) with slow CSS keyframe animations (20–30s cycles)
- Dot grid: `radial-gradient(circle, rgba(0,0,0,0.025) 1px, transparent 1px)` at 32px spacing
- Line grid: `linear-gradient` lines at `rgba(0,0,0,0.025)` at 22px spacing
- Scan beams: Animated translucent beams (optional, some pages)

**Authenticated app** (AppShell): Simpler background:
- Base: `#F2F3F6`
- Subtle dot grid: `rgba(0,0,0,0.015)` at 28px spacing (fixed behind content)
- No aurora orbs

### Card Interactions

- Hover: `translateY(-2px)`, background opacity increase, `box-shadow: 0 8px 28px rgba(0,0,0,0.06)`
- Transition: `all 0.2–0.3s cubic-bezier(0.16, 1, 0.3, 1)`
- Staggered entrance: `translateY(6–12px)` to `translateY(0)`, opacity 0→1, delay `index * 15–25ms`
- `.glass-card:hover::before`: Aurora gradient border shimmer (coral→blue→violet→teal)

### Icons

- **Lucide React** icons throughout the app shell (sidebar, topbar, settings)
- `strokeWidth: 1.75–1.8`, size `14–20px`
- Monochrome: active `#1A1A1A`, inactive `#BBB`/`#CCC`/`#999`
- **Inline SVGs** on public pages (landing, marketplace, pricing) for custom icons

### Buttons

| Class | Style | Usage |
|-------|-------|-------|
| `.btn-primary` | `#1A1A1A` bg, white text, 12px radius | Primary CTAs |
| `.spark-btn` | `#1A1A1A` bg, white text | Landing/marketplace CTAs |
| `.btn-secondary` | Glass bg, `#777` text, 1px border | Secondary actions |
| Inline black pill | `background: '#1A1A1A'`, `borderRadius: 8–10` | Nav CTA buttons |
| Glass pill | `rgba(255,255,255,0.45)` bg, blur | Suggestion pills, filters |

---

## Architecture

### Route Structure

```
app/
├── layout.tsx              — Root layout (fonts, AuthProvider)
├── page.tsx                — Landing page (public, own nav)
├── globals.css             — Design tokens + glass classes + keyframes
│
├── (app)/                  — Authenticated route group
│   ├── layout.tsx          — AppShell wrapper (UnifiedSidebar + TopBar)
│   ├── dashboard/page.tsx  — User dashboard
│   ├── agents/page.tsx     — My Agents list
│   ├── workflows/          — Assembler
│   │   ├── page.tsx        — Workflow list
│   │   └── [id]/page.tsx   — Workflow detail
│   ├── studio/page.tsx     — Agent Studio builder
│   ├── connections/page.tsx— OAuth connections
│   ├── history/page.tsx    — Execution run history
│   ├── settings/page.tsx   — Profile + billing tabs
│   └── creator/            — Creator Studio
│       ├── page.tsx        — Creator hub
│       ├── listings/page.tsx   — Published agents
│       ├── publish/page.tsx    — Publish new agent
│       ├── analytics/page.tsx  — Agent analytics
│       └── earnings/page.tsx   — Earnings dashboard
│
├── marketplace/            — Public marketplace
│   ├── page.tsx            — Agent grid + search + featured
│   └── [slug]/page.tsx     — Agent detail page
│
├── auth/page.tsx           — Sign in / sign up
├── pricing/page.tsx        — Pricing plans
├── about/page.tsx          — About page
├── products/               — Product feature pages
│   ├── assembler/page.tsx
│   ├── studio/page.tsx
│   └── orchestration/page.tsx
├── checkout/
│   ├── success/page.tsx
│   └── cancel/page.tsx
│
├── error.tsx               — Error boundary
├── global-error.tsx        — Global error boundary
└── not-found.tsx           — 404 page
```

### Component Architecture

```
components/
├── layout/
│   ├── AppShell.tsx         — UnifiedSidebar + TopBar + main content wrapper
│   ├── UnifiedSidebar.tsx   — Single sidebar for all authenticated pages
│   ├── TopBar.tsx           — Header with breadcrumbs, search, user avatar
│   └── AuthWall.tsx         — Auth modal trigger wrapper
│
├── shared/
│   ├── AuthModal.tsx        — Sign in/up modal (not a page redirect)
│   ├── UpgradeModal.tsx     — Plan upgrade modal (3 tiers)
│   ├── CreditsMeter.tsx     — Credits usage bar for sidebar
│   ├── GlassCard.tsx        — Reusable glass card component
│   ├── AuroraBackground.tsx — Aurora orb background effect
│   ├── LoadingStates.tsx    — Skeleton loading states
│   ├── PageHeader.tsx       — Consistent page title + subtitle
│   ├── StatCard.tsx         — Glassmorphic stat card
│   └── StatusBadge.tsx      — Status pills (active/paused/error)
│
├── marketplace/
│   ├── SearchBar.tsx        — Agent search input
│   ├── FilterBar.tsx        — Sort/filter controls
│   ├── AgentGrid.tsx        — Agent listing grid
│   ├── AgentCard.tsx        — Individual agent card
│   ├── AgentDetailHero.tsx  — Agent detail header
│   ├── AgentRadarChart.tsx  — Skills radar visualization
│   ├── AgentReviews.tsx     — Reviews section
│   ├── RentButton.tsx       — Rent/subscribe CTA
│   ├── SandboxDemo.tsx      — Live agent demo
│   └── CommandBar.tsx       — Cmd+K quick actions
│
├── dashboard/
│   ├── ActiveAgentsList.tsx
│   ├── ApprovalCard.tsx
│   ├── ConnectionCard.tsx
│   ├── ConnectionGrid.tsx
│   ├── ExecutionFeed.tsx
│   ├── UsageMeter.tsx
│   └── WorkflowVisualizer.tsx
│
├── creator/
│   ├── ListingCard.tsx
│   ├── ListingEditor.tsx
│   ├── ListingPreview.tsx
│   ├── PublishFlow.tsx
│   ├── PricingSelector.tsx
│   ├── EarningsChart.tsx
│   └── EarningsTable.tsx
│
├── providers/
│   └── AuthProvider.tsx     — Supabase auth context
│
└── ui/
    ├── agent-icon.tsx       — Agent icon with SVG library
    └── glass-nav.tsx        — Glass navigation component
```

### State Management

- **Auth**: Supabase client via `AuthProvider` context (`useAuthContext()`) and `useAuth()` hook
- **Sidebar**: Zustand store (`lib/store/sidebar.ts`) — `collapsed`, `mobileOpen`, `toggleCollapsed`, `setMobileOpen`
- **Page state**: Local `useState` within each page component

---

## Public Pages

### Landing Page (`/`)

Full-page experience with own nav bar, aurora background, and four main sections.

**Nav Bar** (inline component within `page.tsx`):
```
[⚡ Agent Spark]    [Home] [Products ▾] [Marketplace] [About] [Pricing]    [Log in] [Get Started]
```
- Logo: 28×28px black rounded square with white lightning bolt SVG
- "Agent Spark": 17px, weight 700, Space Grotesk font
- Products dropdown: Workflow Assembler, Agent Studio, A2A Orchestration
- "Get Started": black pill button, white text

**Section 1 — Hero + Assembler Demo** (centered):
```
         AI agents that
          work for you

 Describe what you need. We'll assemble a team of
        AI agents and put them to work.

 [🔍  I want to automate my Shopify returns...    →]

  [Start a cookie business] [Automate my Shopify returns]
  [Launch & grow a newsletter] [Manage bookkeeping & invoicing]
  [Build a content calendar] [Research my competitors]
```

- Headline: 54px Outfit, weight 700, letterSpacing -0.04em
- Subtitle: 17px DM Sans, color #999
- Input: Glass wrapper with holographic shimmer border on focus (cycling coral→blue→violet→teal)
- Submit: 40×40px black circle when text present, grey when empty
- Suggestion pills: 13px, glass background, 20px borderRadius

**Assembler Flow** (5 phases):

1. **idle** — Input centered, suggestions visible, heading at full size
2. **typing** — User's query re-types character by character (42ms/char) with blinking cursor (`|`). Input disappears.
3. **searching** — "Finding the right agents..." text with spinning circle animation. API call fires in parallel with typing.
4. **assembling** — Glass "team card" appears. Agent rows slide in one by one (staggered 600ms per agent). Each row: icon + name + by creator + price. After all agents revealed, total cost fades in + "Activate Team" CTA.
5. **done** — Green checkmark pops in. Team card fully visible with clickable agent names that open an **AgentDetail overlay**.

**AgentDetail Overlay** (assembler context):
- Fixed fullscreen overlay with backdrop blur
- 400px wide glass card with: verified badge, agent name (Outfit font), creator, stars + rating + review count + rental count, long description, integrations pills, capabilities list, pricing, "Rent This Agent" CTA

**Mock Agents** (for demo):
- Shopify Returns Handler — $1.00/call, by ShipStack, 4.7★, 84 reviews, 1.2k rentals
- Smart Email Responder — $0.50/call, by AgentLabs, 4.9★, 203 reviews, 3.1k rentals

**Section 2 — Category Showcase**:
5-tab category section (Email, Sales, Content, Ops, Code). Each tab shows a featured agent card with unique inline SVG visual (email chart, sales funnel, content calendar, ops pipeline, code diff).

**Section 3 — Integration Marquee**:
Infinite scrolling marquee of 12 integration icons (Gmail, Slack, Shopify, Stripe, HubSpot, Notion, GitHub, Linear, Intercom, Zendesk, Jira, Salesforce). Dual-row, opposite directions.

**Section 4 — 3D Globe**:
Canvas-rendered wireframe globe with 1000 Fibonacci-distributed dots, 9 city markers (SF, London, Tokyo, Sydney, Singapore, Moscow, São Paulo, Mexico City, Delhi), and arc connections between cities. Slow auto-rotation.

**Section 5 — CTA Banner + Footer**:
"Start automating in minutes" banner with input. Footer with product/company/legal links and social icons.

### Marketplace (`/marketplace`)

Public page with own nav bar. Search-first design with categories and agent grid.

**Layout**:
- Same nav bar as landing page (shared NavBar component)
- Category pills: horizontal scrollable row (Email, Sales, Content, Ops, Code, Support, Analytics, Social, Finance, HR)
- Featured agents row: horizontal scroll, larger cards with unique SVG visuals per agent
- All agents grid: `repeat(auto-fill, minmax(240px, 1fr))`, compact cards
- Sort: pills (Popular, Rating, Price, Newest)
- Search: live dropdown with matching agents
- Bottom CTA: "Need something specific? Ask AI to build it" → routes to landing page

**Agent Cards**:
- Seeded random visual (6 variants: mini-chart, bar graph, dot matrix, flow diagram, circle gauge, waveform) generated from slug hash
- Name, creator, description (2-line clamp), ★ rating, rental count, price
- Full card is clickable → navigates to `/marketplace/[slug]`

**Agent Detail Page** (`/marketplace/[slug]`):
- Full-page detail view with large hero, description, capabilities, integrations
- Rent/subscribe button, reviews section, radar chart

### Pricing (`/pricing`)

Three-tier pricing with annual/monthly toggle.

| Plan | Monthly | Annual | Credits |
|------|---------|--------|---------|
| Starter | $0 | $0 | 500/mo |
| Pro (Most Popular) | $49/mo | $39/mo | 5,000/mo |
| Business | $249/mo | $199/mo | 30,000/mo |

- **Credit packs**: 1,000/$12, 5,000/$49, 20,000/$149
- Comparison table below with feature breakdown
- FAQ accordion at bottom
- CTA banner: "Start for free today"

### Other Public Pages

- **About** (`/about`) — Company story, team, mission
- **Products** (`/products/*`) — Feature-specific landing pages for Assembler, Studio, Orchestration
- **Auth** (`/auth`) — Sign in / sign up page (also accessible via modal from anywhere)

---

## Authenticated App Shell

### AppShell (`components/layout/AppShell.tsx`)

Wraps all `(app)/` routes. Structure:
```
┌──────────────────────────────────────────────┐
│ UnifiedSidebar │ TopBar                       │
│                │──────────────────────────────│
│  Logo          │  main content (max-w 960px)  │
│  Search (⌘K)   │  with dot-grid bg texture    │
│  ─────────     │                              │
│  Dashboard     │                              │
│  My Agents (5) │                              │
│  Assembler     │                              │
│  Creator Studio│                              │
│  Marketplace → │                              │
│  Run History   │                              │
│  ─────────     │                              │
│  Credits meter │                              │
│  Settings      │                              │
│  User info     │                              │
└──────────────────────────────────────────────┘
```

Background: `#F2F3F6` with subtle dot-grid (`rgba(0,0,0,0.015)` at 28px).

### UnifiedSidebar (`components/layout/UnifiedSidebar.tsx`)

Single sidebar for all authenticated contexts. No mode switching.

- **Width**: 220px expanded, 68px collapsed
- **Background**: `rgba(255,255,255,0.4)` with `blur(20px)`, right border `rgba(0,0,0,0.04)`
- **Logo**: 24×24px black square with white Zap icon + "Agent Spark" (Space Grotesk implied via `var(--logo)`)
- **Search**: `⌘K` shortcut hint, glass-styled input
- **Nav items** (flat list, no sections):
  - Dashboard (`/dashboard`) — LayoutGrid icon
  - My Agents (`/agents`) — Layers icon, badge "5"
  - Assembler (`/workflows`) — Zap icon
  - Creator Studio (`/creator`) — Palette icon
  - Marketplace (`/marketplace`) — Store icon (external link)
  - Run History (`/history`) — Clock icon
- **Active state**: `fontWeight: 600`, `color: #1A1A1A`, `background: rgba(0,0,0,0.04)`
- **Inactive**: `fontWeight: 450`, `color: #999`
- **Bottom section**:
  - Credits meter (glass card, usage bar, "Buy more" link)
  - Settings link (`/settings`)
  - Login button (unauthenticated) or user avatar + name + plan + sign out (authenticated)
- **Collapse**: Toggle button (PanelLeftClose/PanelLeft icons), persisted via Zustand
- **Mobile**: Slide-in from left with backdrop overlay, close button

### TopBar (`components/layout/TopBar.tsx`)

- Height: 56px (`h-14`)
- Background: `bg-primary/60` with `backdrop-blur-xl`
- Bottom border: `border-bg-tertiary/50`
- **Left**: Mobile hamburger (Menu icon), back button (ArrowLeft, shown when depth > 1), breadcrumbs from pathname
- **Right**: SearchBar, CommandBar (⌘K), user avatar (28×28 black rounded square with initial)
- Route labels: Dashboard, My Agents, Assembler, Agent Studio, Connections, Settings, Creator Studio, Publish New, Analytics, Earnings

### Authenticated Pages

All pages under `(app)/` use inline `style={{}}` for glass cards and visual styling. Common pattern:

```tsx
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
  padding: '24px',
};
```

**Dashboard** (`/dashboard`):
- Welcome message with user name
- Quick action cards (Browse Marketplace, Create Workflow, Publish Agent, View History)
- Active agents list with status badges (active/paused/error)
- Recent workflows table
- Usage stats

**My Agents** (`/agents`):
- Agent cards with status, last run, usage stats

**Assembler** (`/workflows`):
- Workflow list with status, agent count, last run
- Detail view (`/workflows/[id]`) with execution timeline

**Agent Studio** (`/studio`):
- Multi-step agent builder

**Connections** (`/connections`):
- OAuth connector grid (Shopify, Gmail, Slack, etc.)

**Settings** (`/settings`):
- Two tabs: Profile, Billing
- Profile: display name, email, avatar, security info, API keys
- Billing: current plan display, credits usage bar (colored by threshold: black < 70%, amber 70–90%, red 90%+), plan comparison table
- Plans match pricing page: Starter ($0/500cr), Pro ($49/5,000cr), Business ($249/30,000cr)

**Creator Studio** (`/creator`):
- Hub with published agents overview, quick stats, recent activity
- Publish flow (`/creator/publish`): multi-step form
- Listings (`/creator/listings`): published agent management
- Analytics (`/creator/analytics`): views, rentals, revenue charts
- Earnings (`/creator/earnings`): payout history, earnings chart

**Run History** (`/history`):
- Execution log with timestamps, agents used, status, duration

---

## Modals

### AuthModal (`components/shared/AuthModal.tsx`)
- Auth wall is a MODAL, not a page redirect
- Sign in / sign up tabs
- Social auth buttons (Google, GitHub)
- Email/password form

### UpgradeModal (`components/shared/UpgradeModal.tsx`)
- 3-column grid: Starter, Pro (popular), Business
- Credits-based pricing matching `/pricing` page
- Triggered by `limit_reached`, `upgrade_cta`, or `settings`
- Popular badge: black pill, white text
- Redirects to Stripe checkout on upgrade

### CreditsMeter (`components/shared/CreditsMeter.tsx`)
- Sidebar widget showing credits used / total
- Compact mode (collapsed): circular % indicator
- Expanded: glass card with label, usage count, progress bar, reset date, "Buy more" link
- Bar color: black (normal), amber (>80%)

---

## Pricing Model (Source of Truth)

All pricing references across the app MUST match the `/pricing` page:

| Plan | Price | Credits/mo | Key Features |
|------|-------|-----------|--------------|
| Starter | $0 | 500 | 3 agents, basic integrations, community support |
| Pro | $49/mo | 5,000 | Unlimited agents, 50+ integrations, Agent Studio, marketplace publishing |
| Business | $249/mo | 30,000 | All Pro + SSO, priority support, custom connectors |

Files that reference pricing:
- `app/pricing/page.tsx` — Source of truth
- `app/(app)/settings/page.tsx` — Billing tab
- `components/shared/UpgradeModal.tsx` — Upgrade modal
- `components/shared/CreditsMeter.tsx` — Sidebar meter

---

## Key Animations

| Name | Keyframe | Usage |
|------|----------|-------|
| `fadeUp` | Y +10→0, opacity 0→1 | Card entrance |
| `cardIn` | Y +6→0, opacity 0→1 | Page content entrance |
| `shimmer` | background-position cycle | Input focus border |
| `aurora1–5` | translate + rotate + scale | Background orbs |
| `dotPulse` | scale 0.6→1→0.6 | Loading dots |
| `drift` / `marquee` | translateX | Integration marquee |
| `blink` | opacity 0→1 | Typing cursor |
| `cardReveal` | Y +16→0, opacity 0→1 | Assembler team card |
| `checkPop` | scale 0→1.15→1 | Completion checkmark |
| `assemblerSpin` | rotate 0→360deg | Search spinner |
| `scanBeam` / `scanBeam2` | translateY/X across viewport | Background beams |
| `navDropIn` | Y +4→0, scale 0.97→1 | Nav dropdown |
| `beamSpin` | CSS @property angle 0→360 | Border beam effect |

---

## What NOT to Change

- All API routes (`apps/api/src/routes/*`)
- Supabase schema, migrations, and RLS policies
- OAuth connector system (`apps/api/src/connectors/*`)
- Agent runtime and tool calling (`apps/api/src/services/*`)
- A2A orchestration
- Billing/Stripe integration
- BullMQ queues
- Socket.io real-time
- Rate limiting and security middleware
- Environment configuration
- `packages/shared/` type definitions
