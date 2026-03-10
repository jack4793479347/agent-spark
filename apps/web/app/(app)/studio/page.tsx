'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { agentsApi, apiPost } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { authorizeConnection, getConnectionStatus, type ComposioConnectionStatus } from '@/lib/api/connections';
import type { TrainingMessage } from '@/lib/api/agents';
import { scrapeUrl } from '@/lib/api/agents';
import {
  SiGmail, SiShopify, SiHubspot, SiStripe, SiNotion,
  SiGooglecalendar, SiGooglesheets, SiAirtable,
} from '@icons-pack/react-simple-icons';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const fontBody = "var(--font-body), 'DM Sans', sans-serif";
const fontHeading = "var(--font-outfit), 'Outfit', sans-serif";

const KEYFRAMES = `
  textarea::placeholder, input::placeholder { color: #CCC; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .mp-hide-scrollbar::-webkit-scrollbar { display: none; }
  .mp-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

type StepId = 'train' | 'setup' | 'test' | 'publish';

const STEPS: { id: StepId; label: string; icon: React.ReactNode }[] = [
  { id: 'train', label: 'Train', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> },
  { id: 'setup', label: 'Setup', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" /></svg> },
  { id: 'test', label: 'Test', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
  { id: 'publish', label: 'Publish', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg> },
];

/* ─── Connector icons (monochrome, matches connections page) ─── */
function ConnectorIcon({ id, size = 18 }: { id: string; size?: number }) {
  const color = '#1A1A1A';
  const brandIcons: Record<string, React.ReactNode> = {
    gmail: <SiGmail size={size} color={color} />,
    shopify: <SiShopify size={size} color={color} />,
    hubspot: <SiHubspot size={size} color={color} />,
    stripe: <SiStripe size={size} color={color} />,
    notion: <SiNotion size={size} color={color} />,
    'google-calendar': <SiGooglecalendar size={size} color={color} />,
    'google-sheets': <SiGooglesheets size={size} color={color} />,
    airtable: <SiAirtable size={size} color={color} />,
    slack: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M5.04 15.16a2.4 2.4 0 1 1-2.4-2.4h2.4v2.4zm1.2 0a2.4 2.4 0 1 1 4.8 0v6a2.4 2.4 0 1 1-4.8 0v-6zM8.64 5.04a2.4 2.4 0 1 1 2.4-2.4v2.4H8.64zm0 1.2a2.4 2.4 0 1 1 0 4.8h-6a2.4 2.4 0 1 1 0-4.8h6zM18.96 8.64a2.4 2.4 0 1 1 2.4 2.4h-2.4V8.64zm-1.2 0a2.4 2.4 0 1 1-4.8 0v-6a2.4 2.4 0 1 1 4.8 0v6zM15.36 18.96a2.4 2.4 0 1 1-2.4 2.4v-2.4h2.4zm0-1.2a2.4 2.4 0 1 1 0-4.8h6a2.4 2.4 0 1 1 0 4.8h-6z"/>
      </svg>
    ),
    webhook: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  };
  return (
    <div style={{ width: size + 14, height: size + 14, borderRadius: 9, background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      {brandIcons[id] ?? brandIcons.webhook}
    </div>
  );
}

const CONNECTORS = [
  { id: 'gmail', name: 'Gmail', desc: 'Read and send emails' },
  { id: 'slack', name: 'Slack', desc: 'Messages and channels' },
  { id: 'shopify', name: 'Shopify', desc: 'Orders and inventory' },
  { id: 'hubspot', name: 'HubSpot', desc: 'CRM and contacts' },
  { id: 'stripe', name: 'Stripe', desc: 'Payments and billing' },
  { id: 'notion', name: 'Notion', desc: 'Pages and databases' },
  { id: 'google-calendar', name: 'Calendar', desc: 'Events and scheduling' },
  { id: 'google-sheets', name: 'Sheets', desc: 'Spreadsheet data' },
  { id: 'airtable', name: 'Airtable', desc: 'Database records' },
  { id: 'webhook', name: 'Webhooks', desc: 'Custom API calls' },
];


const CATEGORIES = [
  'customer-support', 'sales', 'ecommerce', 'marketing', 'finance',
  'hr', 'productivity', 'development', 'content', 'operations', 'utility',
];

const TEMPLATES: { icon: React.ReactNode; label: string; desc: string; starter: string }[] = [
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, label: 'Customer Support', desc: 'Answer questions, resolve issues', starter: 'Customer support agent that handles common questions and resolves issues for a SaaS product' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>, label: 'Content Creator', desc: 'Blog posts, social media, copy', starter: 'Content creation agent that writes blog posts, social media content, and marketing copy' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, label: 'Sales Assistant', desc: 'Lead qualification, outreach', starter: 'Sales agent that qualifies inbound leads and drafts personalized outreach emails' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>, label: 'Data Analyst', desc: 'Reports, insights, dashboards', starter: 'Data analysis agent that generates reports and surfaces actionable insights from business data' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>, label: 'Dev Assistant', desc: 'Code review, docs, debugging', starter: 'Developer assistant that helps with code review, documentation, and debugging' },
  { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>, label: 'Marketing Agent', desc: 'Campaigns, SEO, strategy', starter: 'Marketing agent that plans campaigns, optimizes SEO, and develops growth strategies' },
];

const TRAINING_PHASES = ['purpose', 'behavior', 'examples', 'review'];

/* ═══════════════════════════════════════════════════════════════
   FIELD
   ═══════════════════════════════════════════════════════════════ */

function Field({ label, placeholder, value, onChange, multiline, rows = 3 }: {
  label: string; placeholder?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  multiline?: boolean; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const s: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontFamily: fontBody,
    color: '#1A1A1A', outline: 'none', background: 'rgba(255,255,255,0.6)', boxSizing: 'border-box',
    resize: 'none', border: focused ? '1.5px solid rgba(0,0,0,0.12)' : '1.5px solid rgba(0,0,0,0.04)',
    transition: 'all 0.15s ease',
  };
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {multiline
        ? <textarea rows={rows} placeholder={placeholder} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...s, lineHeight: 1.6 }} />
        : <input placeholder={placeholder} value={value} onChange={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={s} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEST MESSAGE TYPE
   ═══════════════════════════════════════════════════════════════ */

interface TestMessage { role: 'user' | 'agent' | 'system'; text: string; }

/* ═══════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function StudioPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState<StepId>('train');
  const [agentName, setAgentName] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [category, setCategory] = useState('utility');
  const [pricing, setPricing] = useState('0');
  const [instructions, setInstructions] = useState('');

  // KB
  const [kbFiles, setKbFiles] = useState<Array<{ name: string; size: number; content: string; kbStatus?: 'pending' | 'uploading' | 'done' | 'error'; kbChunks?: number; kbError?: string }>>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbUploading, setKbUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Agent state
  const [agentId, setAgentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [testRunning, setTestRunning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Setup
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [connectorUsage, setConnectorUsage] = useState<Record<string, string>>({});

  // Connection status (for test step)
  const [connStatuses, setConnStatuses] = useState<ComposioConnectionStatus[]>([]);
  const [connStatusLoading, setConnStatusLoading] = useState(false);
  const [connectingType, setConnectingType] = useState<string | null>(null);

  // Publish
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // URL scraping
  const [urlInput, setUrlInput] = useState('');
  const [urlScraping, setUrlScraping] = useState(false);

  // AI gen
  const [generating, setGenerating] = useState(false);
  const [kbGuideOpen, setKbGuideOpen] = useState(false);
  const [kbGenPrompt, setKbGenPrompt] = useState('');
  const [kbGenerating, setKbGenerating] = useState(false);

  // Training
  const [trainingMessages, setTrainingMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [trainingInput, setTrainingInput] = useState('');
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState('purpose');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [trainingSuggestions, setTrainingSuggestions] = useState<string[]>([]);
  const trainerEndRef = useRef<HTMLDivElement>(null);

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [testMessages]);
  useEffect(() => { trainerEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [trainingMessages]);

  /* ── Training chat ── */
  async function sendTrainingMessage(userMsg?: string) {
    setTrainingLoading(true);
    setSaveError(null);
    const newMessages: TrainingMessage[] = [...trainingMessages];
    if (userMsg) { newMessages.push({ role: 'user', content: userMsg }); setTrainingMessages(newMessages); }
    try {
      const response = await agentsApi.trainingChat(newMessages, trainingPhase);
      if (response.phase) setTrainingPhase(response.phase.toLowerCase());
      if (response.progress != null) setTrainingProgress(response.progress);
      setTrainingSuggestions(response.suggestions ?? []);
      setTrainingMessages([...newMessages, { role: 'assistant', content: response.message }]);
      if (response.system_prompt) setInstructions(response.system_prompt);
      if (response.agent_meta) {
        const m = response.agent_meta;
        if (m.name) setAgentName(m.name);
        if (m.description) setAgentDesc(m.description);
        if (m.category && CATEGORIES.includes(m.category)) setCategory(m.category);
        if (m.suggested_pricing != null) setPricing(String(m.suggested_pricing));
      }
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Training chat failed'); }
    finally { setTrainingLoading(false); }
  }

  function toSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || 'untitled';
  }

  /* ── Upload single KB file to backend immediately ── */
  async function uploadKbFileNow(fileEntry: { name: string; size: number; content: string }, index: number) {
    // Ensure agent exists first
    let id = agentId;
    if (!id) {
      // Auto-create agent with minimal data
      setSaving(true);
      try {
        const name = agentName.trim() || 'Untitled Agent';
        const { agent } = await agentsApi.createAgent({
          name, slug: toSlug(name), description: agentDesc || name, category,
          system_prompt: instructions || 'You are a helpful assistant.', tags: [],
          model: 'claude-sonnet-4-5-20250929', pricing_model: 'free', price_cents: 0,
        } as Parameters<typeof agentsApi.createAgent>[0]);
        id = agent.id;
        setAgentId(id);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : 'Failed to create agent');
        setKbFiles((prev) => prev.map((f, j) => j === index ? { ...f, kbStatus: 'error' as const, kbError: 'Could not create agent' } : f));
        setSaving(false);
        return;
      }
      setSaving(false);
    }

    setKbFiles((prev) => prev.map((f, j) => j === index ? { ...f, kbStatus: 'uploading' as const } : f));
    try {
      const result = await agentsApi.uploadKnowledgeDoc(id!, fileEntry.name, fileEntry.content);
      setKbFiles((prev) => prev.map((f, j) => j === index ? { ...f, kbStatus: 'done' as const, kbChunks: result.chunks } : f));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      const cleanMsg = msg.includes('rate limit') || msg.includes('RPM') ? 'Rate limited — try again in a minute' : msg;
      setKbFiles((prev) => prev.map((f, j) => j === index ? { ...f, kbStatus: 'error' as const, kbError: cleanMsg } : f));
    }
  }

  /* ── File upload ── */
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setKbLoading(true);
    setSaveError(null);
    const newFiles: Array<{ name: string; size: number; content: string }> = [];
    for (const file of Array.from(files)) {
      if (file.size > 50 * 1024 * 1024) { setSaveError(`${file.name} is too large (max 50MB)`); continue; }
      try {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `PDF parse failed (${res.status})`);
          }
          const data = await res.json();
          newFiles.push({ name: file.name, size: data.length, content: data.content });
        } else {
          newFiles.push({ name: file.name, size: file.size, content: await file.text() });
        }
      }
      catch (e) { setSaveError(e instanceof Error ? e.message : `Could not read ${file.name}`); }
    }
    // Add files and immediately start uploading each one
    setKbFiles((prev) => {
      const startIndex = prev.length;
      const updated = [...prev, ...newFiles];
      // Trigger uploads after state update
      newFiles.forEach((f, i) => {
        setTimeout(() => uploadKbFileNow(f, startIndex + i), i * 500);
      });
      return updated;
    });
    setKbLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, agentName, agentDesc, category, instructions]);

  /* ── URL scrape ── */
  const handleUrlScrape = useCallback(async () => {
    if (!urlInput.trim()) return;
    let url = urlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    setUrlScraping(true);
    setSaveError(null);
    try {
      const result = await scrapeUrl(url);
      if (result.success && result.content) {
        const fileEntry = {
          name: result.title || new URL(url).hostname,
          size: result.content.length,
          content: result.content,
        };
        setKbFiles((prev) => {
          const newIndex = prev.length;
          setTimeout(() => uploadKbFileNow(fileEntry, newIndex), 100);
          return [...prev, fileEntry];
        });
        setUrlInput('');
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to import website');
    }
    setUrlScraping(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlInput, agentId, agentName, agentDesc, category, instructions]);

  /* ── Save agent ── */
  async function saveAgent(): Promise<string | null> {
    if (!agentName.trim() || (!instructions.trim() && kbFiles.length === 0)) {
      setSaveError('Agent name and either instructions or knowledge base files are required');
      return null;
    }
    setSaving(true); setSaveError(null);
    try {
      let id = agentId;

      // Build full system prompt with connector usage instructions
      let fullPrompt = instructions;
      const usedConnectors = selectedConnectors.filter(c => connectorUsage[c]?.trim());
      if (usedConnectors.length > 0) {
        fullPrompt += '\n\n## Connected Tools\nYou have access to the following integrations:\n';
        for (const cId of usedConnectors) {
          const cName = CONNECTORS.find(c => c.id === cId)?.name || cId;
          fullPrompt += `- **${cName}**: ${connectorUsage[cId].trim()}\n`;
        }
      }

      const agentPayload = {
        name: agentName,
        slug: toSlug(agentName),
        description: agentDesc || agentName,
        category,
        system_prompt: fullPrompt,
        pricing_model: Number(pricing) > 0 ? 'monthly' : 'free' as const,
        price_cents: Math.round(Number(pricing) * 100),
        required_connectors: selectedConnectors,
        a2a_agent_card: { connector_usage: connectorUsage },
      };

      if (id) {
        await agentsApi.updateAgent(id, agentPayload as Parameters<typeof agentsApi.updateAgent>[1]);
      } else {
        const { agent } = await agentsApi.createAgent({ ...agentPayload, tags: [], model: 'claude-sonnet-4-5-20250929' } as Parameters<typeof agentsApi.createAgent>[0]);
        id = agent.id; setAgentId(id);
      }
      // Upload any files that haven't been uploaded yet (failed or pending)
      const pendingFiles = kbFiles.filter((f) => !f.kbStatus || f.kbStatus === 'error');
      if (pendingFiles.length > 0 && id) {
        setKbUploading(true);
        for (let i = 0; i < kbFiles.length; i++) {
          const f = kbFiles[i];
          if (f.kbStatus === 'done' || f.kbStatus === 'uploading') continue;
          await uploadKbFileNow(f, i);
        }
        setKbUploading(false);
      }
      return id;
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'Failed to save agent'); return null; }
    finally { setSaving(false); }
  }

  /* ── AI generate listing ── */
  async function generateListing() {
    if (!instructions.trim()) { setSaveError('Write some system instructions first'); return; }
    setGenerating(true); setSaveError(null);
    try {
      const { listing } = await agentsApi.generateListing(instructions);
      const l = listing as Record<string, string | number | string[]>;
      if (l.name) setAgentName(String(l.name));
      if (l.description) setAgentDesc(String(l.description));
      if (l.category && CATEGORIES.includes(String(l.category))) setCategory(String(l.category));
      if (l.price_cents != null) setPricing(String(Number(l.price_cents) / 100));
    } catch (e) { setSaveError(e instanceof Error ? e.message : 'AI generation failed'); }
    finally { setGenerating(false); }
  }

  /* ── Test ── */
  async function sendTestMessage() {
    if (!testInput.trim() || testRunning) return;
    const input = testInput.trim();
    setTestInput('');
    setTestMessages((prev) => [...prev, { role: 'user', text: input }]);
    setTestRunning(true);
    try {
      let id = agentId;
      if (!id) { id = await saveAgent(); if (!id) { setTestMessages((prev) => [...prev, { role: 'system', text: saveError || 'Failed to save agent' }]); setTestRunning(false); return; } }
      const result = await agentsApi.sandboxAgent(id, input);
      // If sandbox returned a direct result, use it immediately
      const directResult = (result as unknown as { result?: { text?: string } }).result;
      if (directResult?.text && result.status === 'completed') {
        setTestMessages((prev) => [...prev, { role: 'agent', text: directResult.text! }]);
        setTestRunning(false);
      } else {
        const execId = result.executionId ?? (result as unknown as { execution_id?: string }).execution_id;
        if (execId) {
          setTestMessages((prev) => [...prev, { role: 'system', text: 'Agent is thinking...' }]);
          let attempts = 0;
          const poll = async () => {
            attempts++;
            try {
              const { execution } = await agentsApi.getExecution(execId);
              if (execution.status === 'completed') {
                setTestMessages((prev) => { const f = prev.filter((m) => m.text !== 'Agent is thinking...'); return [...f, { role: 'agent', text: execution.result?.text || 'Done.' }]; });
                setTestRunning(false); return;
              }
              if (execution.status === 'failed') {
                setTestMessages((prev) => { const f = prev.filter((m) => m.text !== 'Agent is thinking...'); return [...f, { role: 'system', text: `Error: ${execution.error || 'Execution failed'}` }]; });
                setTestRunning(false); return;
              }
              if (attempts < 30) setTimeout(poll, 2000);
              else { setTestMessages((prev) => { const f = prev.filter((m) => m.text !== 'Agent is thinking...'); return [...f, { role: 'system', text: 'Timed out. Check /history for results.' }]; }); setTestRunning(false); }
            } catch { if (attempts < 30) setTimeout(poll, 2000); else setTestRunning(false); }
          };
          setTimeout(poll, 2000);
        }
      }
    } catch (e) { setTestMessages((prev) => [...prev, { role: 'system', text: e instanceof Error ? e.message : 'Failed to run test' }]); setTestRunning(false); }
  }

  /* ── Connection status check ── */
  async function fetchConnStatus() {
    if (selectedConnectors.length === 0) return;
    setConnStatusLoading(true);
    try {
      const { connections } = await getConnectionStatus();
      setConnStatuses(connections);
    } catch { /* silently fail — tools still work without status */ }
    finally { setConnStatusLoading(false); }
  }

  // Fetch connection status when entering test step
  useEffect(() => {
    if (step === 'test' && selectedConnectors.length > 0) {
      fetchConnStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleConnectTool(connectorType: string) {
    setConnectingType(connectorType);
    try {
      const { redirectUrl } = await authorizeConnection(connectorType);
      if (redirectUrl) {
        // Open in popup window so user doesn't leave the studio
        const w = 500, h = 700;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(redirectUrl, 'composio_auth', `width=${w},height=${h},left=${left},top=${top}`);

        // Poll for popup close, then refresh status
        if (popup) {
          const timer = setInterval(() => {
            if (popup.closed) {
              clearInterval(timer);
              setConnectingType(null);
              fetchConnStatus();
            }
          }, 500);
        } else {
          // Popup blocked — redirect in same tab
          window.location.href = redirectUrl;
        }
      }
    } catch {
      setConnectingType(null);
    }
  }

  const missingConnections = selectedConnectors.filter(
    (id) => !connStatuses.find((c) => c.connector_type === id && c.connected)
  );

  /* ── Publish ── */
  async function handlePublish(visibility: 'private' | 'public') {
    setPublishing(true); setPublishError(null);
    try {
      const id = await saveAgent(); if (!id) { setPublishing(false); return; }
      if (visibility === 'public') await agentsApi.publishAgent(id);
      setPublished(true);
    } catch (e) { setPublishError(e instanceof Error ? e.message : 'Publish failed'); }
    finally { setPublishing(false); }
  }

  /* ── Published success ── */
  if (published) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, animation: 'fadeUp 0.4s ease both' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 500, color: '#1A1A1A', fontFamily: fontHeading, margin: 0 }}>Agent Published!</h2>
        <p style={{ fontSize: 15, color: '#999', fontFamily: fontBody, textAlign: 'center', maxWidth: 440, lineHeight: 1.6 }}>
          {agentName} is now live. Manage it from your agents page.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link href="/agents" style={{ padding: '12px 24px', borderRadius: 10, background: '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: fontBody, textDecoration: 'none' }}>View My Agents</Link>
          <button onClick={() => { setPublished(false); setAgentId(null); setAgentName(''); setAgentDesc(''); setInstructions(''); setKbFiles([]); setStep('train'); setTestMessages([]); setTrainingMessages([]); setTrainingStarted(false); setTrainingProgress(0); setTrainingPhase('purpose'); }}
            style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.6)', color: '#888', fontSize: 14, fontWeight: 550, fontFamily: fontBody, cursor: 'pointer' }}>
            Create Another
          </button>
        </div>
      </div>
    );
  }

  /* ── Main Render ── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', animation: 'fadeUp 0.3s ease both' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/agents" className="no-underline" style={{ fontSize: 13, color: '#BBB', fontFamily: fontBody, textDecoration: 'none' }}>My Agents</Link>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>{agentName || 'New Agent'}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: agentId ? '#22C55E' : '#F59E0B', background: agentId ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', borderRadius: 5, padding: '2px 8px', fontFamily: fontBody }}>
            {agentId ? 'Saved' : 'Unsaved'}
          </span>
        </div>
        {!user && <Link href="/auth" style={{ fontSize: 13, color: '#EF4444', fontFamily: fontBody }}>Sign in to save</Link>}
      </div>

      {/* ── Horizontal Step Indicator ── */}
      <div style={{
        display: 'flex', gap: 4, padding: '0 0 20px', flexShrink: 0,
        borderBottom: '1px solid rgba(0,0,0,0.03)', marginBottom: 0,
      }}>
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isPast = i < stepIdx;
          return (
            <button key={s.id} onClick={() => setStep(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: isActive ? '#1A1A1A' : 'transparent',
                color: isActive ? '#FFF' : isPast ? '#22C55E' : '#BBB',
                fontSize: 13, fontWeight: isActive ? 600 : 500, fontFamily: fontBody,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {isPast ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : s.icon}
              {s.label}
            </button>
          );
        })}
        {/* Progress line */}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 80, height: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((stepIdx + 1) / STEPS.length) * 100}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: 11, color: '#CCC', fontFamily: fontBody }}>{stepIdx + 1}/{STEPS.length}</span>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {(saveError || publishError) && (
        <div style={{ padding: '12px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', marginTop: 16, fontSize: 13, color: '#EF4444', fontFamily: fontBody, flexShrink: 0 }}>
          {saveError || publishError}
        </div>
      )}

      {/* ── Step Content ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: 20, overflow: 'hidden' }}>

        {/* ════════════ TRAIN ════════════ */}
        {step === 'train' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, animation: 'fadeUp 0.3s ease both' }}>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Header */}
              <div style={{ marginBottom: 16, flexShrink: 0 }}>
                <h2 style={{ fontSize: 26, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
                  Train your agent
                </h2>
                <p style={{ fontSize: 14, color: '#BBB', fontFamily: fontBody, margin: 0 }}>
                  Answer a few questions to build a production-quality agent.
                </p>
              </div>

                {/* Phase pills */}
                {trainingStarted && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexShrink: 0 }}>
                    {TRAINING_PHASES.map((p, i) => (
                      <div key={p} style={{
                        fontSize: 11, fontWeight: 600, fontFamily: fontBody, padding: '4px 10px', borderRadius: 6,
                        background: p === trainingPhase ? '#1A1A1A' : 'rgba(0,0,0,0.03)',
                        color: p === trainingPhase ? '#FFF' : TRAINING_PHASES.indexOf(trainingPhase) > i ? '#22C55E' : '#CCC',
                        textTransform: 'capitalize', transition: 'all 0.2s',
                      }}>{p}</div>
                    ))}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#999', fontFamily: fontBody, alignSelf: 'center' }}>{trainingProgress}%</span>
                  </div>
                )}

                {!trainingStarted ? (
                  /* ── Start Screen ── */
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, overflow: 'auto' }}>
                    <div style={{ textAlign: 'center', maxWidth: 440 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 500, color: '#1A1A1A', fontFamily: fontHeading, margin: '0 0 6px' }}>What kind of agent?</h3>
                      <p style={{ fontSize: 13, color: '#BBB', fontFamily: fontBody, margin: 0 }}>Pick a template or describe your own. Takes under a minute.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 560 }}>
                      {TEMPLATES.map((t) => (
                        <button key={t.label} onClick={() => { setTrainingStarted(true); sendTrainingMessage(t.starter); }}
                          style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                            padding: '20px 14px', borderRadius: 14,
                            border: '1.5px solid rgba(0,0,0,0.04)', background: 'rgba(255,255,255,0.55)',
                            cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.background = '#FFF'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.06)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.background = 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>{t.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: '#BBB', fontFamily: fontBody, lineHeight: 1.4 }}>{t.desc}</div>
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', maxWidth: 560 }}>
                      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.04)' }} />
                      <span style={{ fontSize: 11, color: '#CCC', fontFamily: fontBody }}>or describe your own</span>
                      <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.04)' }} />
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); if (trainingInput.trim()) { setTrainingStarted(true); const msg = trainingInput.trim(); setTrainingInput(''); sendTrainingMessage(msg); } }}
                      style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560 }}>
                      <input value={trainingInput} onChange={(e) => setTrainingInput(e.target.value)} placeholder="Describe your agent idea..."
                        style={{ flex: 1, background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(0,0,0,0.04)', borderRadius: 10, padding: '12px 16px', fontSize: 14, fontFamily: fontBody, outline: 'none', color: '#1A1A1A', boxSizing: 'border-box' }} />
                      <button type="submit" disabled={!trainingInput.trim()}
                        style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: '#1A1A1A', color: '#FFF', fontSize: 13, fontWeight: 600, fontFamily: fontBody, cursor: 'pointer' }}>
                        Start
                      </button>
                    </form>
                  </div>
                ) : (
                  /* ── Training Chat ── */
                  <>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.6)', padding: 16, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto', paddingRight: 4 }}>
                        {trainingMessages.map((msg, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.25s ease both' }}>
                            <div style={{
                              maxWidth: '85%', padding: '12px 16px', borderRadius: 14, fontSize: 13.5, fontFamily: fontBody, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                              ...(msg.role === 'user'
                                ? { background: '#1A1A1A', color: '#FFF', borderBottomRightRadius: 4 }
                                : { background: 'rgba(255,255,255,0.8)', color: '#444', border: '1px solid rgba(0,0,0,0.04)', borderBottomLeftRadius: 4 }),
                            }}>
                              {msg.role === 'assistant' && <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', fontFamily: fontBody, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Agent Trainer</div>}
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {trainingLoading && (
                          <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeUp 0.25s ease both' }}>
                            <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.04)', borderBottomLeftRadius: 4, display: 'flex', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CCC', animation: 'pulse 1s ease-in-out infinite' }} />
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CCC', animation: 'pulse 1s ease-in-out infinite 0.2s' }} />
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#CCC', animation: 'pulse 1s ease-in-out infinite 0.4s' }} />
                            </div>
                          </div>
                        )}
                        <div ref={trainerEndRef} />
                      </div>

                      {/* Suggestions */}
                      {trainingSuggestions.length > 0 && !trainingLoading && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, flexShrink: 0 }}>
                          {trainingSuggestions.map((s, i) => (
                            <button key={i} onClick={() => { setTrainingSuggestions([]); sendTrainingMessage(s); }}
                              style={{
                                padding: '7px 14px', borderRadius: 18, border: '1.5px solid rgba(0,0,0,0.06)',
                                background: 'rgba(255,255,255,0.8)', color: '#444', fontSize: 12, fontWeight: 500,
                                fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.12s', lineHeight: 1.3,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.background = '#FFF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Input */}
                      <form onSubmit={(e) => { e.preventDefault(); if (trainingInput.trim() && !trainingLoading) { const msg = trainingInput.trim(); setTrainingInput(''); setTrainingSuggestions([]); sendTrainingMessage(msg); } }}
                        style={{ display: 'flex', gap: 8, marginTop: 10, flexShrink: 0 }}>
                        <input value={trainingInput} onChange={(e) => setTrainingInput(e.target.value)} placeholder={trainingLoading ? 'Thinking...' : 'Type your answer...'} disabled={trainingLoading} autoFocus
                          style={{ flex: 1, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 10, padding: '12px 16px', height: 44, fontSize: 14, fontFamily: fontBody, outline: 'none', color: '#1A1A1A', boxSizing: 'border-box' }} />
                        <button type="submit" disabled={trainingLoading || !trainingInput.trim()}
                          style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: trainingLoading ? '#999' : '#1A1A1A', cursor: trainingLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {trainingLoading
                            ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                        </button>
                      </form>
                    </div>

                    {/* Completion banner */}
                    {trainingProgress >= 100 && instructions && (
                      <div style={{ margin: '12px 0 0', padding: '14px 18px', borderRadius: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, animation: 'fadeUp 0.3s ease both' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>{agentName ? `"${agentName}" is ready!` : 'Training complete!'}</div>
                          <div style={{ fontSize: 12, color: '#999', fontFamily: fontBody, marginTop: 1 }}>System prompt generated. Continue to setup.</div>
                        </div>
                      </div>
                    )}

                    {/* Next */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, flexShrink: 0 }}>
                      {instructions ? (
                        <button onClick={() => setStep('setup')}
                          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', background: '#22C55E', color: '#FFF', fontSize: 13, fontWeight: 600, fontFamily: fontBody, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#16A34A'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = '#22C55E'; }}>
                          Continue to Setup
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#CCC', fontFamily: fontBody }}>
                          {trainingLoading ? 'Generating agent...' : 'Complete the training to continue'}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
          </div>
        )}

        {/* ════════════ SETUP ════════════ */}
        {step === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'fadeUp 0.3s ease both', overflow: 'auto', flex: 1, paddingBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Set up your agent</h2>
              <p style={{ fontSize: 13.5, color: '#999', fontFamily: fontBody, margin: 0 }}>Configure details, instructions, and connections for your agent.</p>
            </div>

            {/* ── Two-column: Details + Instructions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Details */}
              <div style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,.03)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Details</div>
                <Field label="Agent Name" placeholder="e.g. Social Media Strategist" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
                <Field label="Description" placeholder="One sentence: what does this agent do?" value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} multiline rows={2} />
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Category</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {CATEGORIES.map((c) => {
                      const sel = category === c;
                      return (
                        <button key={c} onClick={() => setCategory(c)}
                          style={{
                            padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: sel ? 600 : 450,
                            fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.12s',
                            border: sel ? '1.5px solid #1A1A1A' : '1.5px solid rgba(0,0,0,0.04)',
                            background: sel ? 'rgba(26,26,26,0.04)' : 'rgba(255,255,255,0.5)',
                            color: sel ? '#1A1A1A' : '#888', textTransform: 'capitalize',
                          }}>
                          {c.replace('-', ' ')}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ maxWidth: 180 }}><Field label="Price ($/mo)" placeholder="0 = free" value={pricing} onChange={(e) => setPricing(e.target.value)} /></div>
              </div>

              {/* System Instructions */}
              <div style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,0,0,.03)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>System Instructions</div>
                  {instructions ? (
                    <span style={{ fontSize: 11, color: '#059669', fontFamily: fontBody, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      From training
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: fontBody }}>Required</span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#999', fontFamily: fontBody, margin: '0 0 8px', lineHeight: 1.45 }}>
                  The rules your agent follows. Defines its role, tone, and behavior.
                </p>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={"You are a customer support agent for Acme Corp.\n\nYour role:\n- Answer questions about products and pricing\n- Help troubleshoot common issues\n- Escalate complex problems to humans\n\nTone: Friendly, professional, concise\n\nRules:\n- Never share internal pricing or discount codes\n- Always verify the customer's account first"}
                  style={{
                    flex: 1, minHeight: 120, padding: '12px 14px', borderRadius: 9, fontSize: 12.5, fontFamily: fontBody,
                    color: '#1A1A1A', outline: 'none', background: 'rgba(0,0,0,.02)', boxSizing: 'border-box',
                    resize: 'vertical', border: '1.5px solid rgba(0,0,0,0.04)', lineHeight: 1.6,
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)')}
                />
                {!instructions && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span style={{ fontSize: 11, color: '#92400E', fontFamily: fontBody }}>
                      Use the Train step to generate these automatically.
                    </span>
                  </div>
                )}
                {instructions && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#CCC', fontFamily: fontBody }}>
                    {instructions.length} chars
                  </div>
                )}
              </div>
            </div>

            {/* ── Knowledge Base ── */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.03)', borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Knowledge Base</div>
                  <span style={{ fontSize: 10.5, color: '#BBB', fontFamily: fontBody, background: 'rgba(0,0,0,.03)', padding: '2px 8px', borderRadius: 5 }}>Optional</span>
                </div>
                {kbFiles.length > 0 && (
                  <span style={{ fontSize: 11, color: '#059669', fontFamily: fontBody }}>
                    {kbFiles.filter(f => f.kbStatus === 'done').length}/{kbFiles.length} indexed
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: '#888', fontFamily: fontBody, margin: '0 0 14px', lineHeight: 1.5 }}>
                Give your agent reference material it can search when answering questions — like an employee handbook. This is the information it knows about, not how it should behave (that&apos;s system instructions).
              </p>

              {/* Expandable guide */}
              <button onClick={() => setKbGuideOpen(!kbGuideOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
                background: kbGuideOpen ? 'rgba(0,0,0,.025)' : 'rgba(0,0,0,.015)', border: '1px solid rgba(0,0,0,.04)', borderRadius: kbGuideOpen ? '9px 9px 0 0' : 9,
                cursor: 'pointer', transition: 'all 0.15s', marginBottom: kbGuideOpen ? 0 : 16,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span style={{ flex: 1, textAlign: 'left', fontSize: 12, fontWeight: 550, color: '#666', fontFamily: fontBody }}>What makes a good knowledge base?</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: kbGuideOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {kbGuideOpen && (
                <div style={{
                  padding: '16px 18px 14px', background: 'rgba(0,0,0,.02)',
                  border: '1px solid rgba(0,0,0,.04)', borderTop: 'none',
                  borderBottomLeftRadius: 9, borderBottomRightRadius: 9, marginBottom: 16,
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: 12.5, fontWeight: 600, color: '#444', fontFamily: fontBody }}>
                    Think of it as everything you&apos;d hand a new employee on day one:
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 14 }}>
                    {[
                      { icon: '?', label: 'FAQs', desc: 'Common questions with real answers' },
                      { icon: '\u2605', label: 'Product info', desc: 'Features, pricing, how things work' },
                      { icon: '\u2261', label: 'Help articles', desc: 'Step-by-step troubleshooting guides' },
                      { icon: '\u2611', label: 'Policies', desc: 'Refunds, shipping, terms of service' },
                      { icon: '\u21C4', label: 'Processes', desc: 'SOPs, workflows, procedures' },
                      { icon: '\u270E', label: 'Internal docs', desc: 'Playbooks, training materials' },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#888', flexShrink: 0, fontWeight: 600 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#333', fontFamily: fontBody }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: '#999', fontFamily: fontBody }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, border: '1px solid rgba(0,0,0,.04)', fontSize: 12, color: '#666', fontFamily: fontBody, lineHeight: 1.5 }}>
                    <strong style={{ color: '#444' }}>No documents yet?</strong> Use the generator below to create a starter knowledge base from a description of your business, or paste your website URL to pull content automatically.
                  </div>
                </div>
              )}

              {/* Three ways to add knowledge — tabs-like layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {/* AI Generate */}
                <div style={{
                  border: '1.5px solid rgba(0,0,0,.04)', borderRadius: 10, padding: '14px 14px 12px',
                  background: 'rgba(0,0,0,.01)', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(5,150,105,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Generate with AI</div>
                  </div>
                  <p style={{ fontSize: 11, color: '#999', fontFamily: fontBody, margin: 0, lineHeight: 1.45 }}>
                    Describe your business and we&apos;ll create a starter knowledge base with FAQs and key info.
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!kbGenPrompt.trim() || kbGenerating) return;
                    setKbGenerating(true); setSaveError(null);
                    try {
                      const data = await apiPost<{ content?: string }>('/api/agents/generate-kb', {
                        description: kbGenPrompt.trim(), agent_name: agentName, instructions,
                      });
                      if (data.content) {
                        const fileEntry = { name: `${agentName || 'agent'}-knowledge-base.md`, size: data.content.length, content: data.content };
                        setKbFiles((prev) => { const idx = prev.length; setTimeout(() => uploadKbFileNow(fileEntry, idx), 100); return [...prev, fileEntry]; });
                        setKbGenPrompt('');
                      }
                    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Failed to generate'); }
                    finally { setKbGenerating(false); }
                  }} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                    <input value={kbGenPrompt} onChange={(e) => setKbGenPrompt(e.target.value)}
                      placeholder="e.g. Online pet store selling premium dog food"
                      disabled={kbGenerating}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 11.5,
                        fontFamily: fontBody, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)',
                      }} />
                    <button type="submit" disabled={kbGenerating || !kbGenPrompt.trim()}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600,
                        fontFamily: fontBody, cursor: (kbGenerating || !kbGenPrompt.trim()) ? 'default' : 'pointer',
                        background: (kbGenerating || !kbGenPrompt.trim()) ? 'rgba(0,0,0,0.04)' : '#059669',
                        color: (kbGenerating || !kbGenPrompt.trim()) ? '#CCC' : '#FFF',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      {kbGenerating ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} /> Generating...</> : 'Generate'}
                    </button>
                  </form>
                </div>

                {/* Import URL */}
                <div style={{
                  border: '1.5px solid rgba(0,0,0,.04)', borderRadius: 10, padding: '14px 14px 12px',
                  background: 'rgba(0,0,0,.01)', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Import from URL</div>
                  </div>
                  <p style={{ fontSize: 11, color: '#999', fontFamily: fontBody, margin: 0, lineHeight: 1.45 }}>
                    Paste a link to your website, FAQ page, or help docs and we&apos;ll extract the content.
                  </p>
                  <form onSubmit={(e) => { e.preventDefault(); handleUrlScrape(); }} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                    <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://yoursite.com/faq"
                      disabled={urlScraping}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 11.5,
                        fontFamily: fontBody, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)',
                      }} />
                    <button type="submit" disabled={urlScraping || !urlInput.trim()}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 600,
                        fontFamily: fontBody, cursor: (urlScraping || !urlInput.trim()) ? 'default' : 'pointer',
                        background: (urlScraping || !urlInput.trim()) ? 'rgba(0,0,0,0.04)' : '#1A1A1A',
                        color: (urlScraping || !urlInput.trim()) ? '#CCC' : '#FFF',
                        transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      {urlScraping ? <><div style={{ width: 11, height: 11, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} /> Importing...</> : 'Import'}
                    </button>
                  </form>
                </div>

                {/* Upload Files */}
                <div style={{
                  border: '1.5px solid rgba(0,0,0,.04)', borderRadius: 10, padding: '14px 14px 12px',
                  background: 'rgba(0,0,0,.01)', transition: 'all 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(168,85,247,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Upload files</div>
                  </div>
                  <p style={{ fontSize: 11, color: '#999', fontFamily: fontBody, margin: 0, lineHeight: 1.45 }}>
                    Drag and drop or browse for files from your computer.
                  </p>
                  <input ref={fileInputRef} type="file" multiple accept=".txt,.md,.csv,.json,.pdf,.html,.xml,.log,.yaml,.yml,.tsv" onChange={(e) => handleFileUpload(e.target.files)} style={{ display: 'none' }} />
                  <div onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#A855F7'; e.currentTarget.style.background = 'rgba(168,85,247,0.04)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(0,0,0,.015)'; }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(0,0,0,.015)'; handleFileUpload(e.dataTransfer.files); }}
                    style={{
                      border: '1.5px dashed rgba(0,0,0,0.06)', borderRadius: 8, padding: '18px 12px',
                      background: 'rgba(0,0,0,.015)', cursor: 'pointer', textAlign: 'center',
                      transition: 'all 0.15s', marginTop: 'auto',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.background = 'rgba(0,0,0,.025)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(0,0,0,.015)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 4 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{ fontSize: 11.5, color: '#999', fontFamily: fontBody, marginBottom: 2 }}>Drop files here</div>
                    <div style={{ fontSize: 10, color: '#CCC', fontFamily: fontBody }}>PDF, TXT, MD, CSV, JSON, HTML</div>
                  </div>
                </div>
              </div>

              {/* File list */}
              {kbFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.03em', textTransform: 'uppercase', marginBottom: 4 }}>
                    Uploaded documents ({kbFiles.length})
                  </div>
                  {kbFiles.map((f, i) => (
                    <div key={`${f.name}-${i}`} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                      background: f.kbStatus === 'done' ? 'rgba(5,150,105,0.03)' : f.kbStatus === 'error' ? 'rgba(239,68,68,0.03)' : 'rgba(0,0,0,.015)',
                      borderRadius: 9, border: f.kbStatus === 'done' ? '1px solid rgba(5,150,105,0.08)' : f.kbStatus === 'error' ? '1px solid rgba(239,68,68,0.08)' : '1px solid rgba(0,0,0,0.03)',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: f.kbStatus === 'done' ? 'rgba(5,150,105,0.08)' : f.kbStatus === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,.04)',
                      }}>
                        {f.kbStatus === 'uploading' ? (
                          <div style={{ width: 13, height: 13, border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                        ) : f.kbStatus === 'done' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : f.kbStatus === 'error' ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 550, color: '#1A1A1A', fontFamily: fontBody, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: '#BBB', fontFamily: fontBody, marginTop: 1 }}>
                          {f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.ceil(f.size / 1024)} KB`}
                          {f.kbStatus === 'done' && f.kbChunks != null && <span style={{ color: '#059669' }}> &middot; {f.kbChunks} chunks indexed</span>}
                          {f.kbStatus === 'uploading' && <span style={{ color: '#F59E0B' }}> &middot; Processing...</span>}
                          {f.kbStatus === 'error' && <span style={{ color: '#EF4444' }}> &middot; {f.kbError || 'Failed'}</span>}
                        </div>
                      </div>
                      {(!f.kbStatus || f.kbStatus === 'error') && (
                        <button onClick={(e) => { e.stopPropagation(); setKbFiles((prev) => prev.filter((_, j) => j !== i)); }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 5,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,.04)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Connections ── */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.03)', borderRadius: 12, padding: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Connections</div>
                  <span style={{ fontSize: 10.5, color: '#BBB', fontFamily: fontBody, background: 'rgba(0,0,0,.03)', padding: '2px 8px', borderRadius: 5 }}>Optional</span>
                </div>
                {selectedConnectors.length > 0 && (
                  <span style={{ fontSize: 11, fontFamily: fontBody, fontWeight: 600, color: '#059669', background: 'rgba(5,150,105,0.06)', padding: '2px 10px', borderRadius: 5 }}>
                    {selectedConnectors.length} connected
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: '#888', fontFamily: fontBody, margin: '0 0 14px', lineHeight: 1.5 }}>
                Give your agent superpowers. Connect external tools and describe what it should do with each one.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {CONNECTORS.map((conn) => {
                  const sel = selectedConnectors.includes(conn.id);
                  return (
                    <button key={conn.id} onClick={() => {
                      setSelectedConnectors(prev => sel ? prev.filter(c => c !== conn.id) : [...prev, conn.id]);
                      if (sel) setConnectorUsage(prev => { const next = { ...prev }; delete next[conn.id]; return next; });
                    }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                        padding: '14px 8px 12px', borderRadius: 10, cursor: 'pointer',
                        transition: 'all 0.15s ease', textAlign: 'center', position: 'relative',
                        border: sel ? '2px solid #1A1A1A' : '2px solid rgba(0,0,0,0.04)',
                        background: sel ? 'rgba(26,26,26,0.04)' : 'rgba(0,0,0,0.01)',
                      }}
                      onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                      onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)'; e.currentTarget.style.background = 'rgba(0,0,0,0.01)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                    >
                      {sel && (
                        <div style={{
                          position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%',
                          background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                      )}
                      <ConnectorIcon id={conn.id} size={20} />
                      <div style={{ fontSize: 11.5, fontWeight: sel ? 650 : 500, color: sel ? '#1A1A1A' : '#777', fontFamily: fontBody, lineHeight: 1.2 }}>{conn.name}</div>
                      <div style={{ fontSize: 9.5, color: '#BBB', fontFamily: fontBody, lineHeight: 1.3 }}>{conn.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Usage descriptions for selected connectors */}
              {selectedConnectors.length > 0 && (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                    How should the agent use each tool?
                  </div>
                  {selectedConnectors.map((cId) => {
                    const conn = CONNECTORS.find(c => c.id === cId);
                    if (!conn) return null;
                    return (
                      <div key={cId} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                        borderRadius: 9, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.015)',
                      }}>
                        <ConnectorIcon id={cId} size={15} />
                        <input
                          type="text"
                          placeholder={`What should the agent do with ${conn.name}?`}
                          value={connectorUsage[cId] || ''}
                          onChange={(e) => setConnectorUsage(prev => ({ ...prev, [cId]: e.target.value }))}
                          style={{
                            flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12,
                            fontFamily: fontBody, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
                            background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'border-color 0.15s',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}
                        />
                        <button onClick={() => {
                          setSelectedConnectors(prev => prev.filter(c => c !== cId));
                          setConnectorUsage(prev => { const next = { ...prev }; delete next[cId]; return next; });
                        }} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 5, flexShrink: 0,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,.04)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button onClick={() => setStep('train')} style={{
                padding: '12px 24px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(0,0,0,.02)', color: '#888', fontSize: 14, fontWeight: 550,
                fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,.02)'; }}
              >&larr; Back</button>
              <button onClick={async () => { const id = await saveAgent(); if (id) setStep('test'); }} disabled={saving || kbUploading || !agentName.trim()}
                style={{
                  padding: '14px 36px', borderRadius: 11, border: 'none',
                  background: (!agentName.trim() || saving || kbUploading) ? 'rgba(0,0,0,.06)' : '#1A1A1A',
                  color: (!agentName.trim() || saving || kbUploading) ? '#CCC' : '#FFF',
                  fontSize: 15, fontWeight: 600, fontFamily: fontBody,
                  cursor: (!agentName.trim() || saving || kbUploading) ? 'default' : 'pointer',
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={(e) => { if (agentName.trim() && !saving && !kbUploading) e.currentTarget.style.background = '#333'; }}
                onMouseLeave={(e) => { if (agentName.trim() && !saving && !kbUploading) e.currentTarget.style.background = '#1A1A1A'; }}>
                {kbUploading ? 'Processing knowledge...' : saving ? 'Saving...' : 'Save & Test'}
                {!saving && !kbUploading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>}
              </button>
            </div>
          </div>
        )}

        {/* ════════════ TEST ════════════ */}
        {step === 'test' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ marginBottom: 16, flexShrink: 0 }}>
              <h2 style={{ fontSize: 24, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Test your agent</h2>
              <p style={{ fontSize: 13.5, color: '#999', fontFamily: fontBody, margin: 0 }}>Have a conversation with your agent to make sure it works the way you want.</p>
            </div>

            {/* Connection status banner */}
            {selectedConnectors.length > 0 && (
              <div style={{
                marginBottom: 12, padding: '14px 18px', borderRadius: 11, flexShrink: 0,
                background: missingConnections.length > 0 ? 'rgba(245,158,11,0.04)' : 'rgba(34,197,94,0.04)',
                border: `1px solid ${missingConnections.length > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: missingConnections.length > 0 ? 10 : 0 }}>
                  {missingConnections.length > 0 ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#92400E', fontFamily: fontBody }}>
                        Connect your tools to test with real actions
                      </span>
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#059669', fontFamily: fontBody }}>
                        All tools connected
                      </span>
                    </>
                  )}
                </div>
                {missingConnections.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedConnectors.map((cId) => {
                      const conn = CONNECTORS.find(c => c.id === cId);
                      if (!conn) return null;
                      const isConnected = connStatuses.find(c => c.connector_type === cId)?.connected;
                      const isConnecting = connectingType === cId;
                      return (
                        <button
                          key={cId}
                          onClick={() => !isConnected && !isConnecting && handleConnectTool(cId)}
                          disabled={isConnected || isConnecting}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                            borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: fontBody,
                            cursor: isConnected || isConnecting ? 'default' : 'pointer',
                            transition: 'all 0.15s',
                            background: isConnected ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.8)',
                            border: `1px solid ${isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.08)'}`,
                            color: isConnected ? '#059669' : '#1A1A1A',
                            opacity: isConnecting ? 0.6 : 1,
                          }}
                        >
                          <ConnectorIcon id={cId} size={14} />
                          {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : `Connect ${conn.name}`}
                        </button>
                      );
                    })}
                  </div>
                )}
                {connStatusLoading && (
                  <div style={{ fontSize: 11, color: '#999', fontFamily: fontBody, marginTop: 4 }}>Checking connection status...</div>
                )}
              </div>
            )}

            {/* Chat area */}
            <div style={{
              flex: 1, borderRadius: 11, padding: 18, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden',
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.03)',
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: testMessages.length ? 'flex-end' : 'center', gap: 10, overflow: 'auto' }}>
                {testMessages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,.03)',
                      display: 'grid', placeItems: 'center', margin: '0 auto 14px',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <p style={{ fontSize: 13.5, color: '#BBB', fontFamily: fontBody, margin: '0 0 4px' }}>Send a message to start testing</p>
                    <p style={{ fontSize: 12, color: '#DDD', fontFamily: fontBody, margin: 0 }}>Try asking your agent what it can help with</p>
                  </div>
                )}
                {testMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeUp 0.2s ease both' }}>
                    <div style={{
                      maxWidth: '75%', padding: '11px 15px', borderRadius: 12, fontSize: 13.5, fontFamily: fontBody, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                      ...(msg.role === 'user'
                        ? { background: '#1A1A1A', color: '#FFF', borderBottomRightRadius: 4 }
                        : msg.role === 'system'
                          ? { background: 'rgba(245,158,11,0.06)', color: '#92400E', border: '1px solid rgba(245,158,11,0.08)', borderBottomLeftRadius: 4 }
                          : { background: 'rgba(0,0,0,.02)', color: '#444', border: '1px solid rgba(0,0,0,0.03)', borderBottomLeftRadius: 4 }),
                    }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={(e) => { e.preventDefault(); sendTestMessage(); }} style={{ display: 'flex', gap: 8, marginTop: 14, flexShrink: 0 }}>
                <input value={testInput} onChange={(e) => setTestInput(e.target.value)}
                  placeholder={testRunning ? 'Agent is thinking...' : 'Type a message...'}
                  disabled={testRunning}
                  style={{
                    flex: 1, background: 'rgba(0,0,0,.02)', border: '1px solid rgba(0,0,0,0.04)',
                    borderRadius: 9, padding: '11px 14px', height: 42, fontSize: 13.5,
                    fontFamily: fontBody, outline: 'none', color: '#1A1A1A', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)')}
                />
                <button type="submit" disabled={testRunning || !testInput.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 9, border: 'none',
                    background: (testRunning || !testInput.trim()) ? 'rgba(0,0,0,.06)' : '#1A1A1A',
                    cursor: (testRunning || !testInput.trim()) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background 0.15s',
                  }}>
                  {testRunning
                    ? <div style={{ width: 15, height: 15, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#999', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={testInput.trim() ? 'white' : '#CCC'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                </button>
              </form>
            </div>

            {/* Test message count indicator */}
            {testMessages.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, color: '#CCC', fontFamily: fontBody }}>
                  {testMessages.filter(m => m.role === 'user').length} message{testMessages.filter(m => m.role === 'user').length !== 1 ? 's' : ''} sent
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: testMessages.length > 0 ? 6 : 14, flexShrink: 0 }}>
              <button onClick={() => setStep('setup')} style={{
                padding: '10px 22px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(0,0,0,.02)', color: '#888', fontSize: 13, fontWeight: 550,
                fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.12s',
              }}>&larr; Back</button>
              <button onClick={() => setStep('publish')}
                style={{
                  padding: '10px 22px', borderRadius: 9, border: 'none',
                  background: '#1A1A1A', color: '#FFF', fontSize: 13, fontWeight: 600,
                  fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                Continue to Publish
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* ════════════ PUBLISH ════════════ */}
        {step === 'publish' && (() => {
          const previewPrice = Number(pricing) > 0 ? `$${pricing}/mo` : 'Free';
          const previewConnectors = selectedConnectors;
          const previewStats = { speed: 78 + ((agentName.length * 3) % 15), accuracy: 82 + ((agentName.length * 7) % 12), reliability: 85 + ((agentName.length * 5) % 10) };
          const testsRun = testMessages.filter((m) => m.role === 'user').length;
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp 0.3s ease both', overflow: 'auto', flex: 1, paddingBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Publish your agent</h2>
              <p style={{ fontSize: 13.5, color: '#999', fontFamily: fontBody, margin: 0 }}>This is how your agent will appear on the marketplace.</p>
            </div>

            {/* ── Marketplace Preview ── */}
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.04)',
            }}>
              {/* Preview label */}
              <div style={{
                padding: '8px 20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.03)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.03em', textTransform: 'uppercase' }}>Marketplace Preview</span>
              </div>

              <div style={{ padding: 22 }}>
                {/* Two-column layout mirroring marketplace detail */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 22 }}>

                  {/* Left: Agent info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F3F3F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 20, fontWeight: 400, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em' }}>
                            {agentName || 'Untitled Agent'}
                          </span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#999', background: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>New</span>
                          <span style={{ fontSize: 11, color: '#CCC' }}>v1</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.55, margin: 0 }}>{agentDesc || 'No description yet'}</p>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {[1,2,3,4,5].map((i) => (
                          <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        ))}
                        <span style={{ fontSize: 12, color: '#CCC', marginLeft: 4 }}>No ratings yet</span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#CCC' }}>0 active users</span>
                      <span style={{ fontSize: 11.5, color: '#CCC' }}>0 tasks</span>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', padding: '3px 9px', borderRadius: 5, textTransform: 'capitalize' }}>
                        {category.replace('-', ' ')}
                      </span>
                    </div>

                    {/* Connections preview */}
                    {previewConnectors.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 600, color: '#AAA', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>Integrations</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {previewConnectors.map((c) => {
                            const name = CONNECTORS.find(cn => cn.id === c)?.name || c;
                            return (
                              <div key={c} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                                background: 'rgba(0,0,0,0.02)', borderRadius: 7, border: '1px solid rgba(0,0,0,0.03)',
                              }}>
                                <div style={{ width: 5, height: 5, borderRadius: 3, background: '#22C55E' }} />
                                <span style={{ fontSize: 11.5, fontWeight: 550, color: '#1A1A1A' }}>{name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Reviews placeholder */}
                    <div style={{ padding: '16px 18px', background: 'rgba(0,0,0,0.015)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontHeading }}>Reviews</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#BBB', margin: 0, lineHeight: 1.5 }}>No reviews yet. Reviews will appear here once users start using your agent.</p>
                    </div>
                  </div>

                  {/* Right: Sidebar preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Price + Install */}
                    <div style={{ padding: 18, background: 'rgba(0,0,0,0.015)', borderRadius: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 22, fontWeight: 300, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em' }}>{previewPrice}</span>
                        {previewPrice === 'Free' && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#059669', background: 'rgba(5,150,105,0.08)', padding: '2px 8px', borderRadius: 5 }}>Free Forever</span>
                        )}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '10px 0', background: '#E5E5E5', borderRadius: 9, fontSize: 13, fontWeight: 600,
                        color: '#999', fontFamily: fontBody, cursor: 'default',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                        </svg>
                        Install Agent
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                        <div style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 300, color: '#CCC', fontFamily: fontHeading }}>0</div>
                          <div style={{ fontSize: 10, color: '#BBB', marginTop: 2 }}>Active Users</div>
                        </div>
                        <div style={{ padding: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 16, fontWeight: 300, color: '#CCC', fontFamily: fontHeading }}>0</div>
                          <div style={{ fontSize: 10, color: '#BBB', marginTop: 2 }}>Tasks Done</div>
                        </div>
                      </div>
                    </div>

                    {/* Performance */}
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.015)', borderRadius: 11 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#AAA', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>Performance</div>
                      {[
                        { label: 'Speed', value: previewStats.speed },
                        { label: 'Accuracy', value: previewStats.accuracy },
                        { label: 'Reliability', value: previewStats.reliability },
                      ].map((s) => (
                        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ width: 56, fontSize: 10.5, color: '#999' }}>{s.label}</span>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#1A1A1A', width: `${s.value}%` }} />
                          </div>
                          <span style={{ width: 26, fontSize: 10.5, fontWeight: 600, color: '#1A1A1A', textAlign: 'right' }}>{s.value}%</span>
                        </div>
                      ))}
                    </div>

                    {/* Level */}
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.015)', borderRadius: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#AAA', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Agent Level</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#999', background: 'rgba(0,0,0,0.04)', padding: '2px 7px', borderRadius: 4 }}>NEW</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', borderRadius: 3, background: '#1A1A1A', width: '0%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#CCC' }}>
                        <span>0 tasks</span>
                        <span>100 to Bronze</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                        {['Bronze', 'Silver', 'Gold', 'Platinum'].map((name) => (
                          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'rgba(0,0,0,0.03)', border: '1.5px solid rgba(0,0,0,0.06)',
                            }}>
                              <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/></svg>
                            </div>
                            <span style={{ fontSize: 8, color: '#CCC' }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ padding: 16, background: 'rgba(0,0,0,0.015)', borderRadius: 11 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#AAA', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>Details</div>
                      {[
                        { label: 'Model', value: 'Sonnet' },
                        { label: 'Category', value: category.replace('-', ' ') },
                        { label: 'Version', value: 'v1' },
                        { label: 'Pricing', value: previewPrice },
                      ].map((row) => (
                        <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#999' }}>{row.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 550, color: '#1A1A1A', textTransform: 'capitalize' }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Readiness Checklist ── */}
            <div style={{
              background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(0,0,0,.03)', borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#999', fontFamily: fontBody, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>Launch Checklist</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Agent name', done: !!agentName.trim() },
                  { label: 'Description', done: !!agentDesc.trim() },
                  { label: 'System instructions', done: !!instructions.trim() },
                  { label: 'Knowledge base', done: kbFiles.length > 0, optional: true },
                  { label: 'Sandbox tested', done: testsRun > 0 },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: item.done ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.03)',
                      border: item.done ? '1.5px solid rgba(34,197,94,0.3)' : '1.5px solid rgba(0,0,0,0.06)',
                    }}>
                      {item.done ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.1)' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, color: item.done ? '#1A1A1A' : '#999', fontWeight: item.done ? 550 : 400, fontFamily: fontBody }}>
                      {item.label}
                    </span>
                    {item.optional && <span style={{ fontSize: 10, color: '#CCC', fontFamily: fontBody }}>optional</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Publish Actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => handlePublish('private')} disabled={publishing}
                style={{
                  borderRadius: 11, padding: 18, cursor: publishing ? 'default' : 'pointer',
                  transition: 'all 0.15s', textAlign: 'left',
                  background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,0,0,.03)', opacity: publishing ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!publishing) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody, marginBottom: 3 }}>Save as Draft</div>
                <div style={{ fontSize: 12, color: '#999', fontFamily: fontBody, lineHeight: 1.5 }}>Keep it private. Only you can use this agent.</div>
              </button>
              <button onClick={() => handlePublish('public')} disabled={publishing}
                style={{
                  borderRadius: 11, padding: 18, cursor: publishing ? 'default' : 'pointer',
                  transition: 'all 0.15s', textAlign: 'left',
                  background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,0,0,.03)', opacity: publishing ? 0.6 : 1,
                }}
                onMouseEnter={(e) => { if (!publishing) e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,.03)', display: 'grid', placeItems: 'center', marginBottom: 10 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>Publish to Marketplace</span>
                  <span style={{ fontSize: 9.5, fontWeight: 650, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', borderRadius: 4, padding: '2px 6px', fontFamily: fontBody }}>85%</span>
                </div>
                <div style={{ fontSize: 12, color: '#999', fontFamily: fontBody, lineHeight: 1.5 }}>List publicly and earn 85% revenue when others use your agent.</div>
              </button>
            </div>

            {publishing && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0' }}>
                <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.08)', borderTopColor: '#1A1A1A', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                <span style={{ fontSize: 13, color: '#999', fontFamily: fontBody }}>Publishing your agent...</span>
              </div>
            )}

            <div>
              <button onClick={() => setStep('test')} style={{
                padding: '10px 22px', borderRadius: 9, border: '1px solid rgba(0,0,0,0.05)',
                background: 'rgba(0,0,0,.02)', color: '#888', fontSize: 13, fontWeight: 550,
                fontFamily: fontBody, cursor: 'pointer', transition: 'all 0.12s',
              }}>&larr; Back to Testing</button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
