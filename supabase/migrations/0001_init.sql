-- LiveIdeas agency: shared board for agents and the owner dashboard.
-- Every agent action lands in these tables; the dashboard reads them live.


-- One row per agent: on/off switch, model settings and daily spend cap.
create table agents (
  name text primary key,
  title text not null,
  enabled boolean not null default true,
  model text not null default 'claude-opus-5-5',
  effort text not null default 'medium' check (effort in ('low','medium','high','xhigh','max')),
  daily_budget_usd numeric(10,2) not null default 5,
  schedule_minutes integer not null default 60,
  last_run_at timestamptz
);

insert into agents (name, title, effort, daily_budget_usd, schedule_minutes) values
  ('ceo',      'CEO',      'high',   5, 1440),
  ('research', 'Research', 'low',    5, 240),
  ('sales',    'Sales',    'medium', 5, 60);

-- Global switches. kill_switch=true stops every agent at its next step.
create table settings (
  key text primary key,
  value jsonb not null
);

insert into settings (key, value) values
  ('kill_switch', 'false'),
  ('monthly_revenue_target_gbp', '100000'),
  ('daily_send_cap', '40');

create table leads (
  id uuid primary key default gen_random_uuid(),
  niche text not null check (niche in ('manual_testing','forex','product')),
  company text not null,
  website text,
  contact_name text,
  contact_role text,
  email text,
  reason text,             -- why this company, in one or two sentences
  status text not null default 'new'
    check (status in ('new','drafted','contacted','replied','proof_sent','pilot_paid','won','lost','opted_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (niche, website)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  agent text not null references agents(name),
  kind text not null,
  instructions text not null,
  niche text,
  status text not null default 'queued' check (status in ('queued','running','done','failed','cancelled')),
  result text,
  created_by text not null default 'ceo',
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index tasks_agent_status on tasks (agent, status, created_at);

-- Anything that leaves the company waits here for the owner.
create table approvals (
  id uuid primary key default gen_random_uuid(),
  agent text not null references agents(name),
  kind text not null check (kind in ('email','linkedin','post','proposal','other')),
  lead_id uuid references leads(id) on delete set null,
  title text not null,
  payload jsonb not null,  -- e.g. {to, subject, body}
  status text not null default 'pending' check (status in ('pending','approved','rejected','sent','failed')),
  owner_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  sent_at timestamptz
);
create index approvals_status on approvals (status, created_at);

-- The live activity feed.
create table events (
  id bigint generated always as identity primary key,
  agent text not null,
  level text not null default 'info' check (level in ('info','warn','error','briefing')),
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index events_created on events (created_at desc);

-- AI spend per agent per call, to enforce daily caps and show cost.
create table spend (
  id bigint generated always as identity primary key,
  agent text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cache_read_tokens integer not null default 0,
  cache_write_tokens integer not null default 0,
  usd numeric(12,6) not null default 0,
  created_at timestamptz not null default now()
);
create index spend_agent_day on spend (agent, created_at);

-- Revenue is recorded by the owner (or later by a Stripe webhook).
create table revenue (
  id uuid primary key default gen_random_uuid(),
  niche text,
  lead_id uuid references leads(id) on delete set null,
  kind text not null check (kind in ('pilot','build','retainer','other')),
  amount_gbp numeric(12,2) not null,
  received_on date not null default current_date,
  note text
);

-- Owner-only access. Only emails listed in app_owner can read or change anything
-- from the dashboard. Agents use the service role key, which bypasses RLS.
create table app_owner (email text primary key);
alter table app_owner enable row level security;  -- no policies: invisible to clients

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from app_owner where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

do $$
declare t text;
begin
  foreach t in array array['agents','settings','leads','tasks','approvals','events','spend','revenue'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy owner_all on %I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- Live updates for the dashboard.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table events, approvals, tasks, leads, agents, settings, spend, revenue;
  end if;
end $$;
