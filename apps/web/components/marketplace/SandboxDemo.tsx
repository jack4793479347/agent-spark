'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Loader2, Bot, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SandboxMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
  tool_name?: string;
}

interface SandboxDemoProps {
  agentId: string;
  agentName: string;
  className?: string;
}

export function SandboxDemo({ agentId, agentName, className }: SandboxDemoProps) {
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [error, setError] = useState<string>();
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleRun = async () => {
    if (!input.trim() || running) return;
    setRunning(true);
    setError(undefined);

    const userMessage: SandboxMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/agents/${agentId}/sandbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ input: userMessage.content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Sandbox failed (${res.status})`);
      }

      const { executionId } = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Sandbox execution started (${executionId.slice(0, 8)}...). The agent is processing your request in sandbox mode — no real actions will be taken.`,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Poll for result (Socket.io integration would be used in production)
      let attempts = 0;
      const maxAttempts = 30;
      const poll = async () => {
        attempts++;
        if (attempts > maxAttempts) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'system',
              content: 'Sandbox timed out. The agent may still be processing.',
              timestamp: new Date().toISOString(),
            },
          ]);
          setRunning(false);
          return;
        }

        const statusRes = await fetch(`${apiUrl}/api/agents/executions/${executionId}`, {
          credentials: 'include',
        });

        if (statusRes.ok) {
          const { execution } = await statusRes.json();

          if (execution.status === 'completed') {
            const resultText = execution.result?.text ?? 'Agent completed without a response.';
            setMessages((prev) => [
              ...prev,
              { role: 'agent', content: resultText, timestamp: new Date().toISOString() },
            ]);
            setRunning(false);
            return;
          }

          if (execution.status === 'failed') {
            setMessages((prev) => [
              ...prev,
              {
                role: 'system',
                content: `Agent failed: ${execution.error ?? 'Unknown error'}`,
                timestamp: new Date().toISOString(),
              },
            ]);
            setRunning(false);
            return;
          }
        }

        setTimeout(poll, 2000);
      };

      setTimeout(poll, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sandbox failed');
      setRunning(false);
    }
  };

  return (
    <div className={cn('', className)}>
      {/* Chat area */}
      <div
        ref={chatRef}
        className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 mb-4 scrollbar-none"
      >
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-8 h-8 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-text-tertiary text-sm">Try {agentName} in sandbox mode</p>
            <p className="text-text-tertiary text-xs mt-1">No real actions — safe to experiment</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2',
              msg.role === 'user' && 'justify-end'
            )}
          >
            {msg.role !== 'user' && (
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                msg.role === 'agent' ? 'bg-accent-primary/10' : 'bg-bg-tertiary'
              )}>
                {msg.role === 'agent' ? (
                  <Bot className="w-3.5 h-3.5 text-accent-primary" strokeWidth={1.75} />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
                )}
              </div>
            )}
            <div className={cn(
              'max-w-[80%] px-3 py-2 rounded-xl text-xs',
              msg.role === 'user'
                ? 'bg-accent-primary text-white rounded-br-sm'
                : msg.role === 'agent'
                ? 'bg-bg-tertiary text-text-primary rounded-bl-sm'
                : 'bg-warning/10 text-text-secondary rounded-bl-sm'
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-bg-tertiary flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-text-tertiary" strokeWidth={1.75} />
              </div>
            )}
          </div>
        ))}

        {running && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-accent-primary animate-spin" />
            </div>
            <div className="bg-bg-tertiary px-3 py-2 rounded-xl rounded-bl-sm">
              <span className="text-xs text-text-tertiary">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-error mb-2">{error}</p>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRun()}
          placeholder={`Ask ${agentName} something...`}
          disabled={running}
          className="flex-1 px-3 py-2 rounded-[var(--radius-md)] border border-bg-tertiary bg-bg-primary text-sm text-text-primary focus:border-accent-primary focus:outline-none transition-colors"
        />
        <button
          onClick={handleRun}
          disabled={!input.trim() || running}
          className={cn(
            'btn-primary text-sm py-2 px-4 flex items-center gap-1.5',
            (!input.trim() || running) && 'opacity-60 cursor-not-allowed'
          )}
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" strokeWidth={2} />
          )}
          Run
        </button>
      </div>
    </div>
  );
}
