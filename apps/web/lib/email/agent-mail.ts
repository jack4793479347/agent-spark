import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const DOMAIN = process.env.AGENT_EMAIL_DOMAIN || 'agentspark.ca';
const IS_SHARED_DOMAIN = DOMAIN === 'resend.dev';

/**
 * Build the email address for an agent.
 * On the shared Resend domain, all mail must come from onboarding@resend.dev.
 */
export function agentEmailAddress(agentSlug: string) {
  if (IS_SHARED_DOMAIN) return 'onboarding@resend.dev';
  return `${agentSlug}@${DOMAIN}`;
}

/**
 * Build a friendly "from" string for an agent.
 * On the shared domain the address is fixed but we still set the display name.
 */
export function agentFromAddress(agentName: string, agentSlug: string) {
  return `${agentName} <${agentEmailAddress(agentSlug)}>`;
}

/**
 * Send an email from an agent's address.
 */
export async function sendAgentEmail(params: {
  agentId: string;
  agentName: string;
  agentSlug: string;
  to: string | string[];
  subject: string;
  body: string;
  replyToMessageId?: string;
}) {
  const resend = getResend();
  const from = agentFromAddress(params.agentName, params.agentSlug);

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    text: params.body,
    headers: params.replyToMessageId
      ? { 'In-Reply-To': params.replyToMessageId, References: params.replyToMessageId }
      : undefined,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  // Log the sent email in our DB
  const sb = createAdminClient();
  await sb.from('agent_emails').insert({
    agent_id: params.agentId,
    direction: 'outbound',
    from_address: agentEmailAddress(params.agentSlug),
    to_address: Array.isArray(params.to) ? params.to.join(', ') : params.to,
    subject: params.subject,
    body: params.body,
    resend_id: data?.id,
  });

  return { id: data?.id, from: agentEmailAddress(params.agentSlug) };
}

/**
 * Get recent emails for an agent.
 */
export async function getAgentEmails(agentId: string, limit = 20) {
  const sb = createAdminClient();

  const { data, error } = await sb
    .from('agent_emails')
    .select('*')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Build the Claude tool definitions for agent email.
 * These are injected alongside Composio tools in the agentic loop.
 */
export function getAgentEmailTools(agentName: string, agentSlug: string) {
  return [
    {
      name: 'send_email',
      description: `Send an email from your agent address (${agentEmailAddress(agentSlug)}). Use this to communicate with users, send reports, notifications, or replies.`,
      input_schema: {
        type: 'object' as const,
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          body: {
            type: 'string',
            description: 'Email body text. Can be plain text or simple formatting.',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
    {
      name: 'check_inbox',
      description: `Check your recent sent emails from ${agentEmailAddress(agentSlug)}.`,
      input_schema: {
        type: 'object' as const,
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of emails to return (default 10)',
          },
        },
      },
    },
  ];
}
