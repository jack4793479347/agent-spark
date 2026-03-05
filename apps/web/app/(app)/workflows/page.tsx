'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════
   AUTO ADVANCE HELPER
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   ASSEMBLED AGENT ROW
   ═══════════════════════════════════════════════════════════════ */

function AssembledAgent({
  name,
  role,
  tools,
  index,
  total,
}: {
  name: string;
  role: string;
  tools: string[];
  index: number;
  total: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.6)',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.03)',
        animation: 'fadeUp 0.4s ease both',
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', fontFamily: 'var(--font-space-grotesk)' }}>
            {index + 1}
          </span>
        </div>
        {index < total - 1 && <div style={{ width: 1, height: 8, background: 'rgba(0,0,0,0.06)' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 2 }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: '#999', fontFamily: 'var(--font-body)' }}>{role}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
        {tools.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: '#AAA',
              fontFamily: 'var(--font-body)',
              background: 'rgba(0,0,0,0.025)',
              borderRadius: 4,
              padding: '2px 7px',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */

interface RecentWorkflow {
  name: string;
  agents: number;
  credits: number;
  runs: number;
  status: 'active' | 'paused';
  lastRun: string;
}

const RECENT_WORKFLOWS: RecentWorkflow[] = [
  { name: 'Inbound Support Pipeline', agents: 3, credits: 12, runs: 847, status: 'active', lastRun: '2 min ago' },
  { name: 'Lead Qualification Flow', agents: 3, credits: 25, runs: 234, status: 'active', lastRun: '8 min ago' },
  { name: 'Content Publishing Engine', agents: 4, credits: 55, runs: 56, status: 'paused', lastRun: '2 hours ago' },
  { name: 'Competitor Intelligence', agents: 3, credits: 40, runs: 31, status: 'active', lastRun: '6 hours ago' },
];

const SUGGESTIONS = [
  'Handle inbound support emails and escalate critical issues',
  'Qualify new leads and update CRM automatically',
  'Monitor competitors and send weekly digest',
  'Triage bug reports and create Linear tickets',
  'Process invoices from email and log to accounting',
  'Onboard new customers with welcome sequences',
];

interface AssembledTeamMember {
  name: string;
  role: string;
  tools: string[];
}

const ASSEMBLED_TEAM: AssembledTeamMember[] = [
  { name: 'Email Classifier', role: 'Reads inbound messages and categorizes by intent and urgency', tools: ['Gmail'] },
  { name: 'Knowledge Searcher', role: 'Retrieves relevant articles and past resolutions from your knowledge base', tools: ['Notion', 'KB'] },
  { name: 'Response Drafter', role: 'Writes contextual, on-brand replies based on retrieved knowledge', tools: ['Gmail'] },
  { name: 'Escalation Router', role: 'Flags unresolved or high-priority issues to the right Slack channel', tools: ['Slack'] },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

type Phase = 'idle' | 'thinking' | 'assembled';

export default function WorkflowsPage() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const goToAssembled = useCallback(() => setPhase('assembled'), []);

  const creditsUsed = 3247;
  const creditsTotal = 5000;

  const handleSubmit = () => {
    if (!query.trim() || phase !== 'idle') return;
    setPhase('thinking');
  };

  const handleSuggestion = (text: string) => {
    setQuery(text);
    setTimeout(() => setPhase('thinking'), 300);
  };

  const handleReset = () => {
    setPhase('idle');
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <>
      <style>{`
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        input::placeholder { color: #CCC; }
      `}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' as const, marginBottom: 32, animation: 'fadeUp 0.5s ease both' }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 300,
              color: '#1A1A1A',
              fontFamily: 'var(--font-outfit)',
              letterSpacing: '-0.03em',
              marginBottom: 6,
              marginTop: 0,
            }}
          >
            Workflow Assembler
          </h1>
          <p style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0 }}>
            Describe what you want to automate. We&apos;ll build the team.
          </p>
        </div>

        {/* Input */}
        <div
          style={{
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(20px)',
            border: phase === 'idle' ? '1.5px solid rgba(0,0,0,0.06)' : '1.5px solid rgba(0,0,0,0.03)',
            borderRadius: 16,
            padding: '6px 6px 6px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
            animation: 'fadeUp 0.5s ease both',
            animationDelay: '0.05s',
            transition: 'border 0.2s ease',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#CCC"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Describe what you want to automate..."
            disabled={phase !== 'idle'}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              color: '#1A1A1A',
              padding: '10px 0',
            }}
          />
          {phase === 'idle' ? (
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 22px',
                borderRadius: 11,
                border: 'none',
                background: query.trim() ? '#1A1A1A' : 'rgba(0,0,0,0.06)',
                color: query.trim() ? '#FFF' : '#CCC',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: query.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (query.trim()) e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                if (query.trim()) e.currentTarget.style.background = '#1A1A1A';
              }}
            >
              Assemble
            </button>
          ) : (
            <button
              onClick={handleReset}
              style={{
                padding: '10px 18px',
                borderRadius: 11,
                border: '1px solid rgba(0,0,0,0.06)',
                background: 'rgba(255,255,255,0.6)',
                color: '#888',
                fontSize: 13,
                fontWeight: 550,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1A1A1A';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888';
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
              }}
            >
              Reset
            </button>
          )}
        </div>

        {/* ── Idle State ── */}
        {phase === 'idle' && (
          <>
            {/* Suggestion chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap' as const,
                gap: 8,
                marginBottom: 36,
                animation: 'fadeUp 0.5s ease both',
                animationDelay: '0.1s',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#CCC',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  padding: '6px 0',
                  marginRight: 4,
                }}
              >
                Try:
              </span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  style={{
                    fontSize: 12,
                    fontWeight: 450,
                    color: '#999',
                    fontFamily: 'var(--font-body)',
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1A1A1A';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.8)';
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#999';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Recent Workflows */}
            <div style={{ animation: 'fadeUp 0.5s ease both', animationDelay: '0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', margin: 0 }}>
                  Recent Workflows
                </h2>
                <Link
                  href="/workflows"
                  className="no-underline"
                  style={{
                    fontSize: 12,
                    color: '#BBB',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#666')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#BBB')}
                >
                  View all &rarr;
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {RECENT_WORKFLOWS.map((wf) => (
                  <div
                    key={wf.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.5)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: 'rgba(0,0,0,0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#BBB"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v4m0 14v4M4.22 4.22l2.83 2.83m9.9 9.9l2.83 2.83M1 12h4m14 0h4M4.22 19.78l2.83-2.83m9.9-9.9l2.83-2.83" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 2 }}>
                        {wf.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#CCC', fontFamily: 'var(--font-body)' }}>
                        {wf.agents} agents &middot; ~{wf.credits} credits/run &middot; {wf.runs.toLocaleString()} runs
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10.5,
                        fontWeight: 550,
                        color: wf.status === 'active' ? '#22C55E' : '#F59E0B',
                        background: wf.status === 'active' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                        borderRadius: 6,
                        padding: '3px 9px',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 3,
                          background: wf.status === 'active' ? '#22C55E' : '#F59E0B',
                        }}
                      />
                      {wf.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                    <span style={{ fontSize: 12, color: '#CCC', fontFamily: 'var(--font-body)' }}>{wf.lastRun}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Thinking State ── */}
        {phase === 'thinking' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 0',
              animation: 'fadeUp 0.4s ease both',
            }}
          >
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: '#1A1A1A',
                    animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 15, color: '#999', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
              Analyzing your workflow...
            </span>
            <span style={{ fontSize: 12, color: '#CCC', fontFamily: 'var(--font-body)' }}>
              Selecting agents, mapping data flows, estimating costs
            </span>
            <AutoAdvance delay={2400} onDone={goToAssembled} />
          </div>
        )}

        {/* ── Assembled State ── */}
        {phase === 'assembled' && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: '#22C55E' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#22C55E', fontFamily: 'var(--font-body)' }}>
                Team assembled
              </span>
              <span style={{ fontSize: 12, color: '#BBB', fontFamily: 'var(--font-body)' }}>
                &middot; 4 agents &middot; ~35 credits/run &middot; Est. 1.4s response time
              </span>
            </div>

            {/* Agent list */}
            <div
              style={{
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 16,
                padding: '20px 20px 14px',
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#AAA',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 14,
                  marginTop: 0,
                }}
              >
                Agent Team
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {ASSEMBLED_TEAM.map((agent, i) => (
                  <AssembledAgent
                    key={agent.name}
                    name={agent.name}
                    role={agent.role}
                    tools={agent.tools}
                    index={i}
                    total={ASSEMBLED_TEAM.length}
                  />
                ))}
              </div>
            </div>

            {/* Flow summary */}
            <div
              style={{
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#AAA',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 12,
                  marginTop: 0,
                }}
              >
                Data Flow
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                {ASSEMBLED_TEAM.map((agent, i) => (
                  <div key={agent.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 550,
                        color: '#666',
                        fontFamily: 'var(--font-body)',
                        background: 'rgba(0,0,0,0.03)',
                        borderRadius: 7,
                        padding: '5px 12px',
                      }}
                    >
                      {agent.name}
                    </span>
                    {i < ASSEMBLED_TEAM.length - 1 && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#CCC"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div
              style={{
                background: 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#AAA',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 12,
                  marginTop: 0,
                }}
              >
                Cost Estimate
              </h3>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { label: 'Per run', value: '~35 credits' },
                  { label: 'Daily (est. 50 runs)', value: '~1,750 credits' },
                  { label: 'Monthly (est.)', value: '~52,500 credits' },
                  { label: 'Remaining credits', value: (creditsTotal - creditsUsed).toLocaleString() },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 500,
                        color: '#1A1A1A',
                        fontFamily: 'var(--font-outfit)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#CCC', fontFamily: 'var(--font-body)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 11,
                  border: 'none',
                  background: '#1A1A1A',
                  color: '#FFF',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#333';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1A1A1A';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Activate Workflow &rarr;
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '14px 24px',
                  borderRadius: 11,
                  border: '1px solid rgba(0,0,0,0.06)',
                  background: 'rgba(255,255,255,0.6)',
                  color: '#888',
                  fontSize: 14,
                  fontWeight: 550,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#1A1A1A';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#888';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)';
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
