-- Agent Email system: each agent gets its own email address
create table if not exists agent_emails (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_address text not null,
  to_address text not null,
  subject text not null default '',
  body text not null default '',
  message_id text,          -- email Message-ID header (for threading)
  resend_id text,           -- Resend API response ID (outbound only)
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_agent_emails_agent on agent_emails(agent_id, created_at desc);
create index idx_agent_emails_direction on agent_emails(agent_id, direction);

-- RLS: service role only (accessed via admin client)
alter table agent_emails enable row level security;
