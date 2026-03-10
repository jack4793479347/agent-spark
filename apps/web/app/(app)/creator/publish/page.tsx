'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AgentIcon, ICON_TYPES, type IconType } from '@/components/ui/agent-icon';
import { agentsApi } from '@/lib/api';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

type Step = 1 | 2 | 3 | 4;

interface FormData {
  name: string;
  description: string;
  iconType: IconType;
  capabilities: string[];
  pricingModel: 'free' | 'monthly' | 'per-use';
  price: string;
}

/* ═══════════════════════════════════════════════════════════════
   GLASS HELPERS
   ═══════════════════════════════════════════════════════════════ */

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.8)',
  borderRadius: 14,
  padding: '24px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: '#1A1A1A',
  background: 'rgba(255,255,255,0.5)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1.5px solid rgba(0,0,0,0.06)',
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color 0.15s',
};

/* ═══════════════════════════════════════════════════════════════
   SUGGESTED CAPABILITIES
   ═══════════════════════════════════════════════════════════════ */

const SUGGESTED_CAPS = [
  'Email Handling', 'Data Extraction', 'CRM Updates', 'Scheduling', 'Report Generation',
  'Slack Integration', 'Invoice Processing', 'Lead Scoring', 'Content Writing', 'Code Review',
  'Customer Support', 'Webhook Processing', 'File Management', 'API Integration', 'Analytics',
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function PublishPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    iconType: 'email',
    capabilities: [],
    pricingModel: 'monthly',
    price: '29',
  });
  const [capInput, setCapInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const router = useRouter();

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addCap = (cap: string) => {
    const trimmed = cap.trim();
    if (trimmed && !form.capabilities.includes(trimmed)) {
      update('capabilities', [...form.capabilities, trimmed]);
    }
  };

  const removeCap = (cap: string) => {
    update('capabilities', form.capabilities.filter((c) => c !== cap));
  };

  const canAdvance = () => {
    if (step === 1) return form.name.trim().length > 0 && form.description.trim().length > 0;
    if (step === 2) return form.capabilities.length > 0;
    if (step === 3) return form.pricingModel === 'free' || (form.price && Number(form.price) > 0);
    return true;
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const priceCents = form.pricingModel === 'free' ? 0 : Math.round(Number(form.price) * 100);
      const pricingModel = form.pricingModel === 'per-use' ? 'per_use' : form.pricingModel;

      // Create the agent draft
      const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'untitled';
      const { agent } = await agentsApi.createAgent({
        name: form.name,
        slug,
        description: form.description,
        category: form.capabilities[0]?.toLowerCase().replace(/\s+/g, '-') || 'utility',
        system_prompt: `You are an AI agent called ${form.name}. ${form.description}`,
      });

      // Update with full details
      await agentsApi.updateAgent(agent.id, {
        pricing_model: pricingModel,
        price_cents: pricingModel === 'monthly' ? priceCents : 0,
        per_use_price_cents: pricingModel === 'per_use' ? priceCents : 0,
      } as any);

      // Publish to marketplace
      await agentsApi.publishAgent(agent.id);

      setPublished(true);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : 'Failed to publish agent');
    } finally {
      setPublishing(false);
    }
  };

  const STEPS = ['Basic Info', 'Capabilities', 'Pricing', 'Review'];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 28px 80px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', letterSpacing: '-0.03em', margin: '0 0 4px 0' }}>
        Publish New Agent
      </h1>
      <p className="m-0 mb-6" style={{ fontSize: 14, color: '#999' }}>
        Create your agent listing step by step.
      </p>

      {/* ── Progress indicator ── */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => {
          const stepNum = (i + 1) as Step;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center gap-2" style={{ flex: i < 3 ? 1 : undefined }}>
              <button
                onClick={() => { if (isDone) setStep(stepNum); }}
                className="flex items-center gap-2"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: isDone ? 'pointer' : 'default',
                  padding: 0,
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: isActive ? '#1A1A1A' : isDone ? '#059669' : 'rgba(0,0,0,0.05)',
                    color: isActive || isDone ? '#FFF' : '#BBB',
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}
                >
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isActive ? 600 : 450,
                    color: isActive ? '#1A1A1A' : isDone ? '#059669' : '#BBB',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
              </button>
              {i < 3 && (
                <div
                  className="flex-1"
                  style={{
                    height: 1.5,
                    background: isDone ? '#059669' : 'rgba(0,0,0,0.06)',
                    borderRadius: 1,
                    minWidth: 16,
                    transition: 'background 0.2s',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Published success ── */}
      {published && (
        <div style={{ ...glassCard, textAlign: 'center', padding: '48px 24px', animation: 'cardIn 0.3s ease both' }}>
          <div
            className="flex items-center justify-center mx-auto mb-4"
            style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(5,150,105,0.1)' }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', margin: '0 0 8px 0' }}>
            Agent Published!
          </h2>
          <p className="m-0 mb-6" style={{ fontSize: 14, color: '#888' }}>
            &ldquo;{form.name}&rdquo; is now live on the marketplace.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/browse"
              className="no-underline spark-btn"
              style={{ fontSize: 13, fontWeight: 600, padding: '10px 24px', borderRadius: 10, border: 'none' }}
            >
              View in Marketplace
            </a>
            <a
              href="/creator"
              className="no-underline"
              style={{ fontSize: 13, fontWeight: 500, color: '#888', padding: '10px 16px' }}
            >
              Back to My Agents
            </a>
          </div>
        </div>
      )}

      {/* ── Step 1: Basic Info ── */}
      {!published && step === 1 && (
        <div style={{ ...glassCard, animation: 'cardIn 0.25s ease both' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 20px 0' }}>
            Basic Info
          </h2>

          <div className="flex flex-col gap-4">
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>
                Agent Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Smart Email Responder"
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe what your agent does, who it's for, and key features..."
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 8 }}>
                Choose Icon
              </label>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))' }}>
                {ICON_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => update('iconType', type)}
                    title={type}
                    style={{
                      padding: 0,
                      background: form.iconType === type ? 'rgba(0,0,0,0.06)' : 'transparent',
                      border: form.iconType === type ? '2px solid #1A1A1A' : '2px solid transparent',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 48,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (form.iconType !== type) e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (form.iconType !== type) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <AgentIcon iconType={type} size={32} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Capabilities ── */}
      {!published && step === 2 && (
        <div style={{ ...glassCard, animation: 'cardIn 0.25s ease both' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px 0' }}>
            Capabilities
          </h2>
          <p className="m-0 mb-5" style={{ fontSize: 13, color: '#999' }}>
            What can this agent do? Add capability tags.
          </p>

          {/* Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && capInput.trim()) {
                  addCap(capInput);
                  setCapInput('');
                }
              }}
              placeholder="Type a capability and press Enter"
              style={{ ...inputStyle, flex: 1 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
            />
            <button
              onClick={() => { if (capInput.trim()) { addCap(capInput); setCapInput(''); } }}
              disabled={!capInput.trim()}
              className="spark-btn shrink-0"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                cursor: capInput.trim() ? 'pointer' : 'not-allowed',
                opacity: capInput.trim() ? 1 : 0.4,
              }}
            >
              Add
            </button>
          </div>

          {/* Current tags */}
          {form.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {form.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="inline-flex items-center gap-1.5"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: '#1A1A1A',
                    background: 'rgba(0,0,0,0.04)',
                    padding: '5px 10px 5px 12px',
                    borderRadius: 8,
                  }}
                >
                  {cap}
                  <button
                    onClick={() => removeCap(cap)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#BBB',
                      fontSize: 14,
                      lineHeight: 1,
                      padding: '0 2px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#BBB')}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#BBB', marginBottom: 8 }}>Suggestions</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CAPS.filter((c) => !form.capabilities.includes(c)).slice(0, 10).map((cap) => (
                <button
                  key={cap}
                  onClick={() => addCap(cap)}
                  style={{
                    fontSize: 12,
                    fontWeight: 450,
                    color: '#888',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 7,
                    padding: '5px 11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
                    e.currentTarget.style.color = '#1A1A1A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                    e.currentTarget.style.color = '#888';
                  }}
                >
                  + {cap}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Pricing ── */}
      {!published && step === 3 && (
        <div style={{ ...glassCard, animation: 'cardIn 0.25s ease both' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 4px 0' }}>
            Pricing
          </h2>
          <p className="m-0 mb-5" style={{ fontSize: 13, color: '#999' }}>
            Choose how you want to charge for your agent.
          </p>

          <div className="flex flex-col gap-3">
            {([
              { value: 'free', label: 'Free', desc: 'Anyone can use this agent at no cost' },
              { value: 'monthly', label: 'Monthly Subscription', desc: 'Users pay a recurring monthly fee' },
              { value: 'per-use', label: 'Per Use', desc: 'Users pay each time the agent executes a task' },
            ] as const).map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 cursor-pointer"
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: form.pricingModel === option.value ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.01)',
                  border: form.pricingModel === option.value ? '1.5px solid rgba(26,26,26,0.2)' : '1.5px solid rgba(0,0,0,0.04)',
                  transition: 'all 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="pricing"
                  checked={form.pricingModel === option.value}
                  onChange={() => update('pricingModel', option.value)}
                  style={{ marginTop: 2, accentColor: '#1A1A1A' }}
                />
                <div className="flex-1">
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>{option.label}</div>
                  <div style={{ fontSize: 12.5, color: '#888', marginTop: 2 }}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {form.pricingModel !== 'free' && (
            <div className="mt-5">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 6 }}>
                Price {form.pricingModel === 'monthly' ? '(per month)' : '(per use)'}
              </label>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>$</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  style={{ ...inputStyle, width: 120 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)')}
                />
                <span style={{ fontSize: 13, color: '#BBB' }}>
                  {form.pricingModel === 'monthly' ? '/mo' : '/use'}
                </span>
              </div>
              <p className="m-0 mt-2" style={{ fontSize: 11, color: '#CCC' }}>
                Agent Spark takes a 15% platform fee. You earn ${form.price ? (Number(form.price) * 0.85).toFixed(2) : '0.00'} per {form.pricingModel === 'monthly' ? 'subscriber' : 'use'}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {!published && step === 4 && (
        <div style={{ animation: 'cardIn 0.25s ease both' }}>
          <div style={glassCard} className="mb-5">
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A', margin: '0 0 16px 0' }}>
              Review Your Listing
            </h2>

            {/* Preview card */}
            <div
              style={{
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 12,
                padding: '20px',
                border: '1px solid rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-start gap-3.5 mb-4">
                <AgentIcon iconType={form.iconType} size={48} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 17, fontWeight: 400, fontFamily: 'var(--font-outfit)', color: '#1A1A1A', lineHeight: 1.2 }}>
                    {form.name || 'Untitled Agent'}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: 12, color: '#888' }}>by You</span>
                    <span style={{ fontSize: 12, color: '#CCC' }}>&middot;</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.pricingModel === 'free' ? '#059669' : '#1A1A1A' }}>
                      {form.pricingModel === 'free' ? 'Free' : `$${form.price}/${form.pricingModel === 'monthly' ? 'mo' : 'use'}`}
                    </span>
                  </div>
                </div>
              </div>

              <p className="m-0 mb-4" style={{ fontSize: 13.5, color: '#666', lineHeight: 1.6 }}>
                {form.description || 'No description provided.'}
              </p>

              {form.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.capabilities.map((cap) => (
                    <span
                      key={cap}
                      style={{
                        fontSize: 11.5,
                        fontWeight: 500,
                        color: '#888',
                        background: 'rgba(255,255,255,0.8)',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error display */}
          {publishError && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 12, fontSize: 13, color: '#DC2626' }}>
              {publishError}
            </div>
          )}

          {/* Publish button */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="spark-btn w-full"
            style={{
              fontSize: 15,
              fontWeight: 650,
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              cursor: publishing ? 'not-allowed' : 'pointer',
              opacity: publishing ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {publishing ? 'Publishing...' : 'Publish to Marketplace \u2192'}
          </button>
        </div>
      )}

      {/* ── Navigation buttons ── */}
      {!published && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
            disabled={step === 1}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: step === 1 ? '#CCC' : '#888',
              background: 'none',
              border: 'none',
              cursor: step === 1 ? 'default' : 'pointer',
              padding: '8px 0',
              transition: 'color 0.15s',
            }}
          >
            &larr; Back
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}
              disabled={!canAdvance()}
              className="spark-btn"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                opacity: canAdvance() ? 1 : 0.4,
                transition: 'opacity 0.15s',
              }}
            >
              Continue &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
