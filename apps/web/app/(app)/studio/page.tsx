'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agentsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

/* ═══════════════════════════════════════════════════════════════
   FIELD COMPONENT
   ═══════════════════════════════════════════════════════════════ */

function Field({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  multiline,
  rows = 3,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const shared: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    color: '#1A1A1A',
    outline: 'none',
    background: 'rgba(255,255,255,0.6)',
    boxSizing: 'border-box' as const,
    resize: 'none' as const,
    border: focused ? '1.5px solid rgba(0,0,0,0.12)' : '1.5px solid rgba(0,0,0,0.04)',
    transition: 'all 0.15s ease',
  };
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: '#999',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...shared, lineHeight: 1.6 }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={shared}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP DATA
   ═══════════════════════════════════════════════════════════════ */

type StepId = 'configure' | 'test' | 'publish';

interface StepConfig {
  id: StepId;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    id: 'configure',
    label: 'Configure',
    desc: 'Instructions & knowledge',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
      </svg>
    ),
  },
  {
    id: 'test',
    label: 'Test',
    desc: 'Chat with your agent',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: 'publish',
    label: 'Publish',
    desc: 'Deploy or list',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
];

const CATEGORIES = [
  'customer-support', 'sales', 'ecommerce', 'marketing', 'finance',
  'hr', 'productivity', 'development', 'content', 'operations', 'utility',
];

/* ═══════════════════════════════════════════════════════════════
   TEST MESSAGE TYPE
   ═══════════════════════════════════════════════════════════════ */

interface TestMessage {
  role: 'user' | 'agent' | 'system';
  text: string;
}

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function StudioPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<StepId>('configure');
  const [agentName, setAgentName] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [category, setCategory] = useState('utility');
  const [pricing, setPricing] = useState('0');
  const [instructions, setInstructions] = useState('');

  // Knowledge base state
  const [kbFiles, setKbFiles] = useState<Array<{ name: string; size: number; content: string; kbStatus?: 'pending' | 'uploading' | 'done' | 'error'; kbChunks?: number; kbError?: string }>>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbUploading, setKbUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent creation state
  const [agentId, setAgentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test state
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testRunning, setTestRunning] = useState(false);
  const [testExecId, setTestExecId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // AI generate listing
  const [generating, setGenerating] = useState(false);

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'untitled';
  }

  // Read uploaded files as text
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setKbLoading(true);
    setSaveError(null);

    const newFiles: Array<{ name: string; size: number; content: string }> = [];

    for (const file of Array.from(files)) {
      // Accept text-based files up to 50MB each
      if (file.size > 50 * 1024 * 1024) {
        setSaveError(`${file.name} is too large (max 50MB per file)`);
        continue;
      }
      try {
        const text = await file.text();
        newFiles.push({ name: file.name, size: file.size, content: text });
      } catch {
        setSaveError(`Could not read ${file.name}`);
      }
    }

    setKbFiles((prev) => [...prev, ...newFiles]);
    setKbLoading(false);
    // Reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Save agent to API (create or update)
  async function saveAgent(): Promise<string | null> {
    if (!agentName.trim() || (!instructions.trim() && kbFiles.length === 0)) {
      setSaveError('Agent name and either instructions or knowledge base files are required');
      return null;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let id = agentId;
      if (id) {
        await agentsApi.updateAgent(id, {
          name: agentName,
          slug: toSlug(agentName),
          description: agentDesc || agentName,
          category,
          system_prompt: instructions,
          pricing_model: Number(pricing) > 0 ? 'monthly' : 'free',
          price_cents: Math.round(Number(pricing) * 100),
        } as Parameters<typeof agentsApi.updateAgent>[1]);
      } else {
        const { agent } = await agentsApi.createAgent({
          name: agentName,
          slug: toSlug(agentName),
          description: agentDesc || agentName,
          category,
          system_prompt: instructions,
          tags: [],
          model: 'claude-sonnet-4-5-20250929',
          pricing_model: Number(pricing) > 0 ? 'monthly' : 'free',
          price_cents: Math.round(Number(pricing) * 100),
        } as Parameters<typeof agentsApi.createAgent>[0]);
        id = agent.id;
        setAgentId(id);
      }

      // Upload pending KB files to backend for RAG processing
      const pendingFiles = kbFiles.filter((f) => f.kbStatus !== 'done');
      if (pendingFiles.length > 0 && id) {
        setKbUploading(true);
        for (let i = 0; i < kbFiles.length; i++) {
          const f = kbFiles[i];
          if (f.kbStatus === 'done') continue;
          setKbFiles((prev) => prev.map((pf, j) => j === i ? { ...pf, kbStatus: 'uploading' as const } : pf));
          try {
            const result = await agentsApi.uploadKnowledgeDoc(id, f.name, f.content);
            setKbFiles((prev) => prev.map((pf, j) => j === i ? { ...pf, kbStatus: 'done' as const, kbChunks: result.chunks } : pf));
          } catch (err) {
            setKbFiles((prev) => prev.map((pf, j) => j === i ? { ...pf, kbStatus: 'error' as const, kbError: err instanceof Error ? err.message : 'Upload failed' } : pf));
          }
        }
        setKbUploading(false);
      }

      return id;
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save agent');
      return null;
    } finally {
      setSaving(false);
    }
  }

  // AI-generate listing from instructions
  async function generateListing() {
    if (!instructions.trim()) {
      setSaveError('Write some system instructions first');
      return;
    }
    setGenerating(true);
    setSaveError(null);
    try {
      const { listing } = await agentsApi.generateListing(instructions);
      const l = listing as Record<string, string | number | string[]>;
      if (l.name) setAgentName(String(l.name));
      if (l.description) setAgentDesc(String(l.description));
      if (l.category && CATEGORIES.includes(String(l.category))) setCategory(String(l.category));
      if (l.price_cents != null) setPricing(String(Number(l.price_cents) / 100));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  // Test agent via sandbox (calls Claude)
  async function sendTestMessage() {
    if (!testInput.trim() || testRunning) return;
    const input = testInput.trim();
    setTestInput('');
    setTestMessages((prev) => [...prev, { role: 'user', text: input }]);
    setTestRunning(true);

    try {
      // Save agent first if needed
      let id = agentId;
      if (!id) {
        id = await saveAgent();
        if (!id) {
          setTestMessages((prev) => [...prev, { role: 'system', text: saveError || 'Failed to save agent' }]);
          setTestRunning(false);
          return;
        }
      }

      // Call sandbox endpoint
      const result = await agentsApi.sandboxAgent(id, input);
      const execId = result.executionId ?? (result as unknown as { execution_id?: string }).execution_id;

      if (execId) {
        setTestExecId(execId);
        setTestMessages((prev) => [...prev, { role: 'system', text: 'Agent is thinking...' }]);

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 30;
        const poll = async () => {
          attempts++;
          try {
            const { execution } = await agentsApi.getExecution(execId);
            if (execution.status === 'completed') {
              const resultText = execution.result?.text || 'Agent completed but returned no text.';
              setTestMessages((prev) => {
                const filtered = prev.filter((m) => m.text !== 'Agent is thinking...');
                return [...filtered, { role: 'agent', text: resultText }];
              });
              setTestRunning(false);
              return;
            }
            if (execution.status === 'failed') {
              setTestMessages((prev) => {
                const filtered = prev.filter((m) => m.text !== 'Agent is thinking...');
                return [...filtered, { role: 'system', text: `Error: ${execution.error || 'Execution failed'}` }];
              });
              setTestRunning(false);
              return;
            }
            if (attempts < maxAttempts) {
              setTimeout(poll, 2000);
            } else {
              setTestMessages((prev) => {
                const filtered = prev.filter((m) => m.text !== 'Agent is thinking...');
                return [...filtered, { role: 'system', text: 'Timed out waiting for agent response. Check /history for results.' }];
              });
              setTestRunning(false);
            }
          } catch {
            if (attempts < maxAttempts) {
              setTimeout(poll, 2000);
            } else {
              setTestRunning(false);
            }
          }
        };
        setTimeout(poll, 2000);
      }
    } catch (e) {
      setTestMessages((prev) => [...prev, { role: 'system', text: e instanceof Error ? e.message : 'Failed to run test' }]);
      setTestRunning(false);
    }
  }

  // Publish agent to marketplace
  async function handlePublish(visibility: 'private' | 'public') {
    setPublishing(true);
    setPublishError(null);
    try {
      const id = await saveAgent();
      if (!id) {
        setPublishing(false);
        return;
      }
      if (visibility === 'public') {
        await agentsApi.publishAgent(id);
      }
      setPublished(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  }

  /* ── Published success screen ── */
  if (published) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20, animation: 'fadeUp 0.4s ease both' }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', margin: 0 }}>Agent Published!</h2>
        <p style={{ fontSize: 16, color: '#999', fontFamily: 'var(--font-body)', textAlign: 'center' as const, maxWidth: 460, lineHeight: 1.6 }}>
          {agentName} is now live. You can manage it from your agents page.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Link href="/agents" style={{ padding: '14px 28px', borderRadius: 12, background: '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', textDecoration: 'none' }}>
            View My Agents
          </Link>
          <button onClick={() => { setPublished(false); setAgentId(null); setAgentName(''); setAgentDesc(''); setInstructions(''); setKbFiles([]); setStep('configure'); setTestMessages([]); }}
            style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', color: '#888', fontSize: 14, fontWeight: 550, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: '-36px -48px', display: 'flex', flexDirection: 'column' as const, minHeight: '100vh' }}>
      <style>{`textarea::placeholder, input::placeholder { color: #CCC; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px', borderBottom: '1px solid rgba(0,0,0,0.03)', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(16px)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/agents" className="no-underline" style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--font-body)' }}>My Agents</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>{agentName || 'New Agent'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: agentId ? '#22C55E' : '#F59E0B', background: agentId ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', borderRadius: 6, padding: '3px 10px', fontFamily: 'var(--font-body)' }}>
            {agentId ? 'Saved' : 'Unsaved'}
          </span>
        </div>
        {!user && (
          <Link href="/auth" style={{ fontSize: 14, color: '#EF4444', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}>
            Sign in to save
          </Link>
        )}
      </div>

      {/* Builder area */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', zIndex: 1 }}>
        {/* Step sidebar */}
        <div style={{ width: 240, padding: '28px 16px', borderRight: '1px solid rgba(0,0,0,0.025)', flexShrink: 0 }}>
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            const isPast = i < stepIdx;
            return (
              <button key={s.id} onClick={() => setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left' as const, background: isActive ? 'rgba(0,0,0,0.04)' : 'transparent', transition: 'all 0.12s ease', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: isActive ? '#1A1A1A' : isPast ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.03)', color: isActive ? '#FFF' : isPast ? '#22C55E' : '#CCC', transition: 'all 0.15s ease' }}>
                  {isPast ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 450, color: isActive ? '#1A1A1A' : isPast ? '#666' : '#AAA' }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: '#BBB', fontWeight: 400, marginTop: 2 }}>{s.desc}</div>
                </div>
              </button>
            );
          })}

          {/* Step progress indicator */}
          <div style={{ marginTop: 24, padding: '0 16px' }}>
            <div style={{ height: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((stepIdx + 1) / STEPS.length) * 100}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: '#CCC', fontFamily: 'var(--font-body)', marginTop: 8 }}>Step {stepIdx + 1} of {STEPS.length}</div>
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, padding: '36px 48px', maxWidth: 760 }}>

          {/* Error banner */}
          {(saveError || publishError) && (
            <div style={{ padding: '14px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', marginBottom: 20, fontSize: 14, color: '#EF4444', fontFamily: 'var(--font-body)' }}>
              {saveError || publishError}
            </div>
          )}

          {/* ── Configure ── */}
          {step === 'configure' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28, animation: 'fadeUp 0.35s ease both' }}>
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', marginBottom: 8, marginTop: 0 }}>
                  Configure your agent
                </h2>
                <p style={{ fontSize: 15, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                  Give your agent instructions and upload a knowledge base. The knowledge base is what makes your agent uniquely valuable.
                </p>
              </div>

              <Field
                label="System Instructions"
                placeholder="You are a helpful assistant that... Describe the agent's personality, rules, and what it should do."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                multiline
                rows={7}
              />

              {/* Knowledge Base Upload */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#999', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 8 }}>
                  Knowledge Base
                </label>
                <p style={{ fontSize: 14, color: '#BBB', fontFamily: 'var(--font-body)', margin: '0 0 12px', lineHeight: 1.6 }}>
                  Upload documents your agent can reference. This is what makes your agent valuable — its specialized knowledge.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".txt,.md,.csv,.json,.pdf,.html,.xml,.log,.yaml,.yml,.tsv"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  style={{ display: 'none' }}
                />

                {/* Drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; handleFileUpload(e.dataTransfer.files); }}
                  style={{
                    border: '1.5px dashed rgba(0,0,0,0.08)', borderRadius: 14, padding: '32px 24px',
                    minHeight: 120,
                    background: 'rgba(255,255,255,0.4)', cursor: 'pointer', textAlign: 'center' as const,
                    transition: 'all 0.15s ease',
                    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {kbLoading ? (
                    <span style={{ fontSize: 15, color: '#999', fontFamily: 'var(--font-body)' }}>Reading files...</span>
                  ) : (
                    <>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span style={{ fontSize: 15, color: '#999', fontFamily: 'var(--font-body)', display: 'block', marginBottom: 6 }}>
                        Drop files here or click to upload
                      </span>
                      <span style={{ fontSize: 13, color: '#CCC', fontFamily: 'var(--font-body)' }}>
                        TXT, MD, CSV, JSON, HTML, XML, YAML (max 50MB each)
                      </span>
                    </>
                  )}
                </div>

                {/* Uploaded files list */}
                {kbFiles.length > 0 && (
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                    {kbFiles.map((f, i) => (
                      <div key={`${f.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.6)', borderRadius: 10, border: '1px solid rgba(0,0,0,0.03)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 550, color: '#1A1A1A', fontFamily: 'var(--font-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</div>
                          <div style={{ fontSize: 12, color: '#BBB', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                            {(f.size / 1024).toFixed(1)} KB &middot; {f.content.length.toLocaleString()} chars
                            {f.kbStatus === 'done' && f.kbChunks != null && <span style={{ color: '#22C55E' }}> &middot; {f.kbChunks} chunks indexed</span>}
                            {f.kbStatus === 'uploading' && <span style={{ color: '#F59E0B' }}> &middot; Processing...</span>}
                            {f.kbStatus === 'error' && <span style={{ color: '#EF4444' }}> &middot; {f.kbError || 'Failed'}</span>}
                          </div>
                        </div>
                        {f.kbStatus === 'uploading' ? (
                          <div style={{ width: 18, height: 18, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.5s linear infinite', flexShrink: 0 }} />
                        ) : f.kbStatus === 'done' ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setKbFiles((prev) => prev.filter((_, j) => j !== i)); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
                            title="Remove file"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <div style={{ fontSize: 13, color: '#BBB', fontFamily: 'var(--font-body)', padding: '4px 0' }}>
                      {kbFiles.length} file{kbFiles.length !== 1 ? 's' : ''} &middot; {kbFiles.reduce((s, f) => s + f.content.length, 0).toLocaleString()} total chars
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={generateListing} disabled={generating || (!instructions.trim() && kbFiles.length === 0)}
                  style={{ padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', background: generating ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.6)', color: generating ? '#AAA' : '#666', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: generating ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                  {generating ? 'Generating...' : 'AI: Auto-fill from instructions'}
                </button>
              </div>

              <Field label="Agent Name" placeholder="e.g. Support Responder" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              <Field label="Description" placeholder="What does this agent do? (shown on marketplace)" value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} multiline rows={3} />

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#999', fontFamily: 'var(--font-body)', letterSpacing: '0.04em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, fontSize: 15, fontFamily: 'var(--font-body)', color: '#1A1A1A', background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(0,0,0,0.04)', outline: 'none' }}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Pricing ($/mo)" placeholder="0 for free" value={pricing} onChange={(e) => setPricing(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button onClick={async () => { await saveAgent(); }} disabled={saving || kbUploading}
                  style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', color: '#888', fontSize: 14, fontWeight: 550, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>
                  {kbUploading ? 'Processing KB...' : saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button onClick={async () => { const id = await saveAgent(); if (id) setStep('test'); }} disabled={saving || kbUploading}
                  style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: (saving || kbUploading) ? '#999' : '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: (saving || kbUploading) ? 'default' : 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => { if (!saving && !kbUploading) e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={(e) => { if (!saving && !kbUploading) e.currentTarget.style.background = '#1A1A1A'; }}>
                  {kbUploading ? 'Processing KB...' : 'Save & Test →'}
                </button>
              </div>
            </div>
          )}

          {/* ── Test ── */}
          {step === 'test' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20, animation: 'fadeUp 0.35s ease both', height: 'calc(100vh - 140px)' }}>
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', marginBottom: 8, marginTop: 0 }}>
                  Test your agent
                </h2>
                <p style={{ fontSize: 15, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                  Chat with your agent live. This calls Claude with your system instructions.
                </p>
              </div>

              {/* Chat area */}
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.6)', padding: 20, display: 'flex', flexDirection: 'column' as const, minHeight: 400 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: testMessages.length ? 'flex-end' : 'center', gap: 12, marginBottom: 16, overflow: 'auto' }}>
                  {testMessages.length === 0 && (
                    <div style={{ textAlign: 'center' as const }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 14px', display: 'block' }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      <p style={{ fontSize: 16, color: '#BBB', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>Type a message to test your agent</p>
                      <p style={{ fontSize: 14, color: '#CCC', fontFamily: 'var(--font-body)', margin: 0 }}>Your agent will respond using Claude AI</p>
                    </div>
                  )}
                  {testMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.3s ease both' }}>
                      <div style={{
                        maxWidth: '80%', padding: '14px 18px', borderRadius: 16, fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const,
                        ...(msg.role === 'user'
                          ? { background: '#1A1A1A', color: '#FFF', borderBottomRightRadius: 4 }
                          : msg.role === 'system'
                            ? { background: 'rgba(245,158,11,0.08)', color: '#B45309', border: '1px solid rgba(245,158,11,0.1)', borderBottomLeftRadius: 4 }
                            : { background: 'rgba(255,255,255,0.8)', color: '#444', border: '1px solid rgba(0,0,0,0.04)', borderBottomLeftRadius: 4 }),
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={(e) => { e.preventDefault(); sendTestMessage(); }} style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder={testRunning ? 'Agent is thinking...' : 'Type a message to test your agent...'}
                    disabled={testRunning}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 12, padding: '14px 18px', height: 48, fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none', color: '#1A1A1A', boxSizing: 'border-box' as const }}
                  />
                  <button type="submit" disabled={testRunning || !testInput.trim()}
                    style={{ width: 48, height: 48, borderRadius: 12, border: 'none', background: testRunning ? '#999' : '#1A1A1A', cursor: testRunning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }}>
                    {testRunning ? (
                      <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    )}
                  </button>
                </form>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep('configure')} style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', color: '#888', fontSize: 14, fontWeight: 550, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>&larr; Back</button>
                <button onClick={() => setStep('publish')}
                  style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#333')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1A1A1A')}>
                  Next: Publish &rarr;
                </button>
              </div>
            </div>
          )}

          {/* ── Publish ── */}
          {step === 'publish' && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 28, animation: 'fadeUp 0.35s ease both' }}>
              <div>
                <h2 style={{ fontSize: 32, fontWeight: 500, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', marginBottom: 8, marginTop: 0 }}>
                  Publish your agent
                </h2>
                <p style={{ fontSize: 15, color: '#BBB', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                  Choose how to deploy your agent.
                </p>
              </div>

              {/* Summary card */}
              <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.6)', padding: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)', marginBottom: 6 }}>{agentName || 'Untitled'}</div>
                    <div style={{ fontSize: 15, color: '#999', fontFamily: 'var(--font-body)', maxWidth: 440, lineHeight: 1.6 }}>{agentDesc}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF', background: '#1A1A1A', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--font-body)' }}>{category}</span>
                </div>
                <div style={{ display: 'flex', gap: 32, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 20 }}>
                  {[
                    { label: 'Model', value: 'Sonnet' },
                    { label: 'Knowledge Base', value: kbFiles.length > 0 ? `${kbFiles.length} file${kbFiles.length !== 1 ? 's' : ''}` : 'None' },
                    { label: 'Pricing', value: Number(pricing) > 0 ? `$${pricing}/mo` : 'Free' },
                    { label: 'Tests run', value: String(testMessages.filter((m) => m.role === 'user').length) },
                  ].map((s) => (
                    <div key={s.label}>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-outfit)' }}>{s.value}</div>
                      <div style={{ fontSize: 13, color: '#BBB', fontFamily: 'var(--font-body)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deploy options */}
              <div style={{ display: 'flex', gap: 14 }}>
                <button onClick={() => handlePublish('private')} disabled={publishing}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.06)', padding: 24, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' as const }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)', marginBottom: 6 }}>Save as Draft</div>
                  <div style={{ fontSize: 14, color: '#999', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>Keep private. Use in your own workflows only.</div>
                </button>
                <button onClick={() => handlePublish('public')} disabled={publishing}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 16, border: '1.5px solid rgba(0,0,0,0.06)', padding: 24, cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left' as const }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', fontFamily: 'var(--font-body)' }}>Publish to Marketplace</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#F59E0B', background: 'rgba(245,158,11,0.08)', borderRadius: 5, padding: '2px 8px', fontFamily: 'var(--font-body)' }}>85% rev share</span>
                  </div>
                  <div style={{ fontSize: 14, color: '#999', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>List on the marketplace. Earn when others use your agent.</div>
                </button>
              </div>

              {publishing && <div style={{ textAlign: 'center' as const, fontSize: 15, color: '#999', fontFamily: 'var(--font-body)' }}>Publishing...</div>}

              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button onClick={() => setStep('test')} style={{ padding: '14px 28px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', color: '#888', fontSize: 14, fontWeight: 550, fontFamily: 'var(--font-body)', cursor: 'pointer' }}>&larr; Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
