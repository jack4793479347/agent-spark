'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiData } from '@/hooks/useApiData';
import { getMyAgents, sandboxAgent, getExecution, type AgentMine } from '@/lib/api/agents';
import { getActiveRentals, type ActiveRental } from '@/lib/api/rentals';
import { SkeletonGrid } from '@/components/shared/Skeleton';
import { MarketplaceContent } from '@/components/marketplace/MarketplaceContent';

/* ===================================================================
   TYPES
   =================================================================== */

interface UnifiedAgent {
  id: string;
  name: string;
  status: string;
  category?: string;
  total_executions: number;
  avg_rating?: number;
  isInstalled: boolean;
  rentalSlug?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  status?: 'sending' | 'running' | 'completed' | 'failed';
  timestamp: Date;
}

interface WorkflowNode {
  id: string;
  agentId: string;
  agentName: string;
}

interface WorkflowTemplate {
  name: string;
  description: string;
  icon: React.ReactNode;
  /** indices into available agents to auto-fill (e.g. [0,1] means first two) */
  slots: number;
  labels: string[];
}

/* ===================================================================
   CONSTANTS
   =================================================================== */

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  active:    { color: '#22C55E', label: 'Active' },
  draft:     { color: '#CCC',    label: 'Draft' },
  published: { color: '#3B82F6', label: 'Published' },
  paused:    { color: '#F59E0B', label: 'Paused' },
  error:     { color: '#EF4444', label: 'Error' },
  in_review: { color: '#F59E0B', label: 'In Review' },
  suspended: { color: '#EF4444', label: 'Suspended' },
  archived:  { color: '#CCC',    label: 'Archived' },
};

const fontBody = "var(--font-body), 'DM Sans', sans-serif";
const fontHeading = "var(--font-outfit), 'Outfit', sans-serif";

const TEMPLATES: WorkflowTemplate[] = [
  {
    name: 'Research & Summarize',
    description: 'One agent researches, another summarizes the findings',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    slots: 2,
    labels: ['Researcher', 'Summarizer'],
  },
  {
    name: 'Draft & Review',
    description: 'One agent creates content, another reviews and refines it',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    slots: 2,
    labels: ['Drafter', 'Reviewer'],
  },
  {
    name: '3-Step Pipeline',
    description: 'Chain three agents: analyze, process, output',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    slots: 3,
    labels: ['Analyzer', 'Processor', 'Output'],
  },
  {
    name: 'Custom',
    description: 'Start blank and build your own flow',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
    slots: 0,
    labels: [],
  },
];

/* ===================================================================
   AGENT LIST ITEM (sidebar)
   =================================================================== */

function AgentListItem({
  agent,
  selected,
  onSelect,
  draggable,
}: {
  agent: UnifiedAgent;
  selected: boolean;
  onSelect: () => void;
  draggable?: boolean;
}) {
  const st = STATUS_COLORS[agent.status] || STATUS_COLORS.draft;

  return (
    <button
      onClick={onSelect}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('agent-id', agent.id);
        e.dataTransfer.setData('agent-name', agent.name);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      style={{
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border: 'none',
        background: selected ? 'rgba(0,0,0,0.05)' : 'transparent',
        cursor: draggable ? 'grab' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textAlign: 'left',
        transition: 'background 0.12s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = 'rgba(0,0,0,0.025)'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: agent.isInstalled ? 'rgba(34,197,94,0.08)' : selected ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {agent.isInstalled ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected ? '#1A1A1A' : '#999'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          fontWeight: selected ? 600 : 500,
          color: selected ? '#1A1A1A' : '#555',
          fontFamily: fontBody,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap' as const,
        }}>
          {agent.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#BBB', fontFamily: fontBody }}>
            {agent.total_executions} runs
          </span>
        </div>
      </div>
      {draggable && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="9" cy="5" r="1" /><circle cx="15" cy="5" r="1" />
          <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
          <circle cx="9" cy="19" r="1" /><circle cx="15" cy="19" r="1" />
        </svg>
      )}
    </button>
  );
}

/* ===================================================================
   CHAT PANEL
   =================================================================== */

function ChatPanel({ agent }: { agent: UnifiedAgent }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMessages([]); setInput(''); setSending(false); inputRef.current?.focus(); }, [agent.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const pollExecution = useCallback(async (executionId: string, messageId: string) => {
    const poll = async () => {
      try {
        const res = await getExecution(executionId);
        const exec = res.execution;
        if (exec.status === 'completed') {
          setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: exec.result?.text ?? 'Done.', status: 'completed' as const } : m));
          return;
        }
        if (exec.status === 'failed') {
          setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: exec.error ?? 'Execution failed.', status: 'failed' as const } : m));
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, content: 'Failed to check status.', status: 'failed' as const } : m));
      }
    };
    poll();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const userMsgId = `u-${Date.now()}`;
    const agentMsgId = `a-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: text, timestamp: new Date() },
      { id: agentMsgId, role: 'agent', content: '', status: 'sending', timestamp: new Date() },
    ]);
    setInput('');
    setSending(true);
    try {
      setMessages((prev) => prev.map((m) => m.id === agentMsgId ? { ...m, status: 'running' as const } : m));
      const res = await sandboxAgent(agent.id, text);
      if (res.result?.text && res.status === 'completed') {
        setMessages((prev) => prev.map((m) => m.id === agentMsgId ? { ...m, content: res.result!.text, status: 'completed' as const } : m));
      } else {
        pollExecution(res.executionId, agentMsgId);
      }
    } catch (e) {
      setMessages((prev) => prev.map((m) => m.id === agentMsgId ? { ...m, content: e instanceof Error ? e.message : 'Something went wrong.', status: 'failed' as const } : m));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: agent.isInstalled ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={agent.isInstalled ? '#22C55E' : '#888'} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: '#BBB', fontFamily: fontBody }}>{agent.category ?? 'Agent'} &middot; {agent.total_executions} runs</div>
        </div>
        <Link href={`/agents/${agent.id}`}
          style={{ fontSize: 12, fontWeight: 500, color: '#999', textDecoration: 'none', padding: '5px 11px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.06)', fontFamily: fontBody, transition: 'all 0.12s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = '#666'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#999'; }}
        >
          Full View
        </Link>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, padding: '40px 0' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p style={{ fontSize: 13, color: '#CCC', margin: 0, fontFamily: fontBody, textAlign: 'center' }}>
              Send a message to start working with {agent.name}
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 12,
              fontSize: 13.5, lineHeight: 1.6, fontFamily: fontBody,
              ...(msg.role === 'user'
                ? { background: '#1A1A1A', color: '#fff', borderBottomRightRadius: 4 }
                : { background: msg.status === 'failed' ? 'rgba(239,68,68,0.06)' : 'rgba(0,0,0,0.03)', color: msg.status === 'failed' ? '#EF4444' : '#1A1A1A', borderBottomLeftRadius: 4 }),
            }}>
              {(msg.status === 'sending' || msg.status === 'running') && !msg.content ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.1)', borderTopColor: '#1A1A1A', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span style={{ fontSize: 12, color: '#999' }}>{msg.status === 'sending' ? 'Sending...' : 'Thinking...'}</span>
                </div>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Message ${agent.name}...`}
          disabled={sending}
          style={{
            flex: 1, fontSize: 13.5, color: '#1A1A1A', fontFamily: fontBody,
            background: 'rgba(0,0,0,0.025)', border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 10, padding: '10px 14px', outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            background: input.trim() && !sending ? '#1A1A1A' : 'rgba(0,0,0,0.06)',
            color: input.trim() && !sending ? '#fff' : '#CCC',
            cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {sending ? (
            <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
   WORKFLOW NODE (visual card in the canvas)
   =================================================================== */

function WorkflowNodeCard({
  node,
  index,
  total,
  roleLabel,
  onRemove,
  onReplace,
  agents,
}: {
  node: WorkflowNode;
  index: number;
  total: number;
  roleLabel?: string;
  onRemove: () => void;
  onReplace: (agentId: string, agentName: string) => void;
  agents: UnifiedAgent[];
}) {
  const [showSwap, setShowSwap] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Arrow from previous */}
      {index > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 0 }}>
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
            <line x1="12" y1="0" x2="12" y2="24" stroke="#E0E0E0" strokeWidth="1.5" />
            <polyline points="7,20 12,26 17,20" fill="none" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Node card */}
      <div
        style={{
          position: 'relative',
          width: 200,
          background: '#fff',
          border: '1.5px solid rgba(0,0,0,0.08)',
          borderRadius: 14,
          padding: '14px 16px',
          transition: 'all 0.15s',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
      >
        {/* Role label */}
        {roleLabel && (
          <div style={{
            fontSize: 10, fontWeight: 600, color: '#BBB', fontFamily: fontBody,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
          }}>
            {roleLabel}
          </div>
        )}

        {/* Step number + agent name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            width: 22, height: 22, borderRadius: 7,
            background: '#1A1A1A', color: '#fff',
            fontSize: 11, fontWeight: 700, fontFamily: fontBody,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {index + 1}
          </span>
          <button
            onClick={() => setShowSwap(!showSwap)}
            style={{
              flex: 1, minWidth: 0,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 13, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody,
              textAlign: 'left',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            title="Click to swap agent"
          >
            {node.agentName}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: '#DDD', transition: 'color 0.1s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#DDD'; }}
            title="Remove"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* What this step does */}
        <div style={{ fontSize: 11, color: '#BBB', fontFamily: fontBody, lineHeight: 1.4 }}>
          {index === 0 ? 'Receives your prompt' : `Gets output from step ${index}`}
          {index < total - 1 ? ` \u2192 passes to step ${index + 2}` : ' \u2192 final output'}
        </div>

        {/* Swap dropdown */}
        {showSwap && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowSwap(false)} />
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0,
              marginTop: 6, background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: 4, zIndex: 51, maxHeight: 200, overflowY: 'auto',
            }}>
              {agents.filter((a) => a.status !== 'draft' && a.status !== 'archived').map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onReplace(a.id, a.name); setShowSwap(false); }}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7,
                    border: 'none', background: a.id === node.agentId ? 'rgba(0,0,0,0.04)' : 'transparent',
                    fontSize: 12, fontWeight: a.id === node.agentId ? 600 : 450,
                    color: '#1A1A1A', fontFamily: fontBody, cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===================================================================
   WORKFLOW BUILDER (visual canvas with templates)
   =================================================================== */

function WorkflowBuilder({ agents }: { agents: UnifiedAgent[] }) {
  const router = useRouter();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [roleLabels, setRoleLabels] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const runnableAgents = agents.filter((a) => a.status !== 'draft' && a.status !== 'archived');

  const applyTemplate = (template: WorkflowTemplate) => {
    if (template.slots === 0) {
      setNodes([]);
      setRoleLabels([]);
      setSelectedTemplate('Custom');
      return;
    }
    const newNodes: WorkflowNode[] = [];
    const usedIds = new Set<string>();
    for (let i = 0; i < template.slots; i++) {
      const available = runnableAgents.find((a) => !usedIds.has(a.id));
      if (available) {
        newNodes.push({ id: `n-${Date.now()}-${i}`, agentId: available.id, agentName: available.name });
        usedIds.add(available.id);
      }
    }
    setNodes(newNodes);
    setRoleLabels(template.labels);
    setSelectedTemplate(template.name);
  };

  const addNode = (agentId: string, agentName: string) => {
    setNodes((prev) => [...prev, { id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, agentId, agentName }]);
    if (!selectedTemplate) setSelectedTemplate('Custom');
  };

  const removeNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
  };

  const replaceNode = (nodeId: string, agentId: string, agentName: string) => {
    setNodes((prev) => prev.map((n) => n.id === nodeId ? { ...n, agentId, agentName } : n));
  };

  // Drag-and-drop from sidebar
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const agentId = e.dataTransfer.getData('agent-id');
    const agentName = e.dataTransfer.getData('agent-name');
    if (agentId && agentName) {
      addNode(agentId, agentName);
    }
  };

  const handleRun = async () => {
    if (nodes.length === 0 || !prompt.trim() || running) return;
    setRunning(true);
    try {
      const { executionId } = await sandboxAgent(nodes[0].agentId, prompt.trim());
      router.push(`/workflows/${executionId}`);
    } catch {
      setRunning(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', fontFamily: fontBody }}>
          Agent-to-Agent Workflow
        </div>
        <div style={{ fontSize: 12, color: '#BBB', fontFamily: fontBody, marginTop: 2 }}>
          Each agent&apos;s output feeds into the next. Drag agents from the sidebar or pick a template.
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Templates */}
        {nodes.length === 0 && (
          <div style={{ padding: '16px 20px 8px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#AAA', fontFamily: fontBody, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Start with a template
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t)}
                  disabled={t.slots > 0 && runnableAgents.length < t.slots}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: 'rgba(255,255,255,0.6)',
                    cursor: (t.slots > 0 && runnableAgents.length < t.slots) ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s',
                    opacity: (t.slots > 0 && runnableAgents.length < t.slots) ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => { if (!(t.slots > 0 && runnableAgents.length < t.slots)) { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.background = '#fff'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.6)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: '#1A1A1A' }}>
                    {t.icon}
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: fontBody }}>{t.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#AAA', fontFamily: fontBody, lineHeight: 1.4 }}>
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Canvas / Flow */}
        <div
          style={{
            padding: '20px',
            minHeight: nodes.length === 0 ? 120 : undefined,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            borderRadius: 14,
            margin: nodes.length === 0 ? '8px 20px' : '0 20px',
            border: dragOver ? '2px dashed #1A1A1A' : nodes.length === 0 ? '2px dashed rgba(0,0,0,0.06)' : '2px dashed transparent',
            background: dragOver ? 'rgba(0,0,0,0.02)' : 'transparent',
            transition: 'all 0.15s',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {nodes.length === 0 && !selectedTemplate && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8 }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <div style={{ fontSize: 13, color: '#CCC', fontFamily: fontBody }}>
                Drag agents here or pick a template above
              </div>
            </div>
          )}

          {nodes.map((node, i) => (
            <WorkflowNodeCard
              key={node.id}
              node={node}
              index={i}
              total={nodes.length}
              roleLabel={roleLabels[i]}
              onRemove={() => removeNode(node.id)}
              onReplace={(aid, aname) => replaceNode(node.id, aid, aname)}
              agents={agents}
            />
          ))}

          {/* Add more button (after nodes exist) */}
          {nodes.length > 0 && (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ margin: '4px 0' }}>
                <line x1="12" y1="2" x2="12" y2="16" stroke="#E0E0E0" strokeWidth="1.5" />
                <polyline points="8,13 12,18 16,13" fill="none" stroke="#E0E0E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{ position: 'relative' }}>
                <AddAgentButton agents={runnableAgents} onAdd={addNode} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom: prompt + run */}
      {nodes.length > 0 && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,0,0,0.04)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt — what should this workflow do?"
              onKeyDown={(e) => { if (e.key === 'Enter') handleRun(); }}
              style={{
                flex: 1, padding: '11px 14px', borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.9)',
                fontSize: 13.5, fontFamily: fontBody, outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; }}
            />
          </div>
          <button
            onClick={handleRun}
            disabled={running || !prompt.trim()}
            style={{
              width: '100%', padding: '12px 24px', borderRadius: 10,
              border: 'none',
              background: running ? '#666' : '#1A1A1A',
              color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: fontBody,
              cursor: running ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: !prompt.trim() ? 0.5 : 1, transition: 'all 0.15s',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            {running ? 'Running...' : `Run ${nodes.length}-Agent Workflow`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Add Agent Button (dropdown) ── */

function AddAgentButton({
  agents,
  onAdd,
}: {
  agents: UnifiedAgent[];
  onAdd: (id: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 200,
          padding: '10px 0',
          borderRadius: 10,
          border: '1.5px dashed rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#BBB',
          fontFamily: fontBody,
          transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1A1A1A'; e.currentTarget.style.color = '#1A1A1A'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#BBB'; }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Agent
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            marginTop: 6, background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: 4, zIndex: 51, width: 200, maxHeight: 220, overflowY: 'auto',
          }}>
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => { onAdd(a.id, a.name); setOpen(false); }}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 7,
                  border: 'none', background: 'transparent',
                  fontSize: 12, fontWeight: 500, color: '#1A1A1A',
                  fontFamily: fontBody, cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                </svg>
                {a.name}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ===================================================================
   PAGE
   =================================================================== */

type PageTab = 'my-agents' | 'browse' | 'installed';

export default function MyAgentsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as PageTab) || 'my-agents';
  const [activeTab, setActiveTab] = useState<PageTab>(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'chat' | 'orchestrate'>('chat');
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useApiData({ fetchFn: () => getMyAgents() });
  const { data: rentalsData, loading: rentalsLoading } = useApiData({ fetchFn: () => getActiveRentals() });

  const agents = data?.agents ?? [];
  const rentals = rentalsData?.rentals ?? [];

  const allAgents: UnifiedAgent[] = [
    ...rentals.map((r) => ({
      id: r.agent_id, name: r.agents?.name ?? 'Installed Agent', status: 'active',
      total_executions: r.total_executions, isInstalled: true, rentalSlug: r.agents?.slug,
    })),
    ...agents.map((a) => ({
      id: a.id, name: a.name, status: a.status, category: a.category,
      total_executions: a.total_executions ?? 0, avg_rating: a.avg_rating, isInstalled: false,
    })),
  ];

  useEffect(() => {
    if (!selectedId && allAgents.length > 0) setSelectedId(allAgents[0].id);
  }, [allAgents.length]);

  const selectedAgent = allAgents.find((a) => a.id === selectedId);
  const filtered = search.trim()
    ? allAgents.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    : allAgents;
  const isLoading = loading || rentalsLoading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 40px)', animation: 'fadeUp 0.4s ease both' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 4px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#1A1A1A', fontFamily: fontHeading, letterSpacing: '-0.03em', margin: 0 }}>
          Agents
        </h1>
        <Link href="/studio" className="no-underline"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none',
            background: '#1A1A1A', color: '#FFF', fontSize: 13, fontWeight: 600, fontFamily: fontBody,
            textDecoration: 'none', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 16, flexShrink: 0 }}>
        {([
          { key: 'my-agents' as PageTab, label: 'My Agents' },
          { key: 'browse' as PageTab, label: 'Browse' },
          { key: 'installed' as PageTab, label: 'Installed' },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 450,
              color: activeTab === tab.key ? '#1A1A1A' : '#BBB', fontFamily: fontBody,
              borderBottom: activeTab === tab.key ? '2px solid #1A1A1A' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main */}
      {activeTab === 'browse' ? (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <MarketplaceContent embedded />
        </div>
      ) : activeTab === 'installed' ? (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {isLoading ? (
            <SkeletonGrid count={3} cardHeight={200} />
          ) : rentals.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 20, border: '2px dashed rgba(0,0,0,0.06)', padding: '64px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="22" height="12" rx="2"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: fontHeading }}>No installed agents</div>
              <div style={{ fontSize: 15, color: '#999', fontFamily: fontBody, marginBottom: 20, maxWidth: 400, textAlign: 'center' }}>Browse the marketplace to find agents built by the community.</div>
              <button onClick={() => setActiveTab('browse')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: fontBody, border: 'none', cursor: 'pointer' }}>Browse Marketplace</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, minHeight: 0, height: '100%' }}>
              {/* Installed agent list */}
              <div style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.65)', borderRadius: 16,
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                  {allAgents.filter(a => a.isInstalled).map((agent) => (
                    <AgentListItem
                      key={agent.id + '-r'}
                      agent={agent}
                      selected={selectedId === agent.id}
                      onSelect={() => setSelectedId(agent.id)}
                      draggable={false}
                    />
                  ))}
                </div>
              </div>
              {/* Chat panel */}
              <div style={{
                background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.65)', borderRadius: 16,
                display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
              }}>
                <div style={{ flex: 1, minHeight: 0 }}>
                  {selectedAgent && selectedAgent.isInstalled ? (
                    <ChatPanel key={selectedAgent.id} agent={selectedAgent} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <div style={{ fontSize: 13, color: '#CCC', fontFamily: fontBody }}>Select an installed agent to chat</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : isLoading ? (
        <SkeletonGrid count={3} cardHeight={200} />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div style={{ fontSize: 15, color: '#EF4444', marginBottom: 16, fontFamily: fontBody }}>{error}</div>
          <button onClick={refetch} style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '12px 28px', cursor: 'pointer', fontFamily: fontBody }}>Retry</button>
        </div>
      ) : allAgents.filter(a => !a.isInstalled).length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.4)', borderRadius: 20, border: '2px dashed rgba(0,0,0,0.06)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1A1A1A', fontFamily: fontHeading }}>No agents yet</div>
          <div style={{ fontSize: 15, color: '#999', fontFamily: fontBody, marginBottom: 20, maxWidth: 400, textAlign: 'center' }}>Create your first agent or browse the marketplace.</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/studio" className="no-underline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, background: '#1A1A1A', color: '#FFF', fontSize: 14, fontWeight: 600, fontFamily: fontBody, textDecoration: 'none' }}>Create Agent</Link>
            <button onClick={() => setActiveTab('browse')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.7)', color: '#666', fontSize: 14, fontWeight: 600, fontFamily: fontBody, cursor: 'pointer' }}>Browse Marketplace</button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, minHeight: 0 }}>
          {/* Left: Agent List */}
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.65)', borderRadius: 16,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Search */}
            <div style={{ padding: '12px 10px 6px', flexShrink: 0 }}>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search agents..."
                style={{
                  width: '100%', padding: '8px 11px', borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)',
                  fontSize: 12, fontFamily: fontBody, outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}
              />
            </div>

            {/* Hint for orchestrate mode */}
            {mode === 'orchestrate' && (
              <div style={{ padding: '4px 14px 2px', fontSize: 10, color: '#BBB', fontFamily: fontBody }}>
                Drag agents to the canvas {'\u2192'}
              </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 6px' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#CCC', fontFamily: fontBody }}>No agents found</div>
              ) : (
                filtered.map((agent) => (
                  <AgentListItem
                    key={agent.id + (agent.isInstalled ? '-r' : '')}
                    agent={agent}
                    selected={mode === 'chat' && selectedId === agent.id}
                    onSelect={() => { if (mode === 'chat') setSelectedId(agent.id); }}
                    draggable={mode === 'orchestrate'}
                  />
                ))
              )}
              <Link href="/studio" className="no-underline"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                  textDecoration: 'none', transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.025)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, border: '1.5px dashed rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#BBB', fontFamily: fontBody }}>New Agent</span>
              </Link>
            </div>
          </div>

          {/* Right: Chat / Orchestrate */}
          <div style={{
            background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.65)', borderRadius: 16,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0,
          }}>
            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(0,0,0,0.04)', flexShrink: 0 }}>
              {(['chat', 'orchestrate'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    flex: 1, padding: '12px 0', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: mode === m ? 600 : 450,
                    color: mode === m ? '#1A1A1A' : '#BBB', fontFamily: fontBody,
                    borderBottom: mode === m ? '2px solid #1A1A1A' : '2px solid transparent',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  {m === 'chat' ? (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>Chat</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="M11 18H8a2 2 0 0 1-2-2V9" /></svg>Orchestrate</>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minHeight: 0 }}>
              {mode === 'chat' ? (
                selectedAgent ? (
                  <ChatPanel key={selectedAgent.id} agent={selectedAgent} />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DDD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <div style={{ fontSize: 13, color: '#CCC', fontFamily: fontBody }}>Select an agent to start chatting</div>
                  </div>
                )
              ) : (
                <WorkflowBuilder agents={allAgents} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
