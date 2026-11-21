-- Security and SOC 2 groundwork.
--   * Owner access now needs MFA (aal2), checked in the database, not only in the app.
--   * Append-only, hash-chained audit log written by triggers.
--   * Tables for the Security and Compliance agents: findings, evidence, key register, recurring controls.
--   * Outbound guard results on approvals.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. MFA required for every owner read and write.
-- Supabase puts the assurance level in the JWT: aal1 = email link only, aal2 = email link + TOTP.
-- ---------------------------------------------------------------------------
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from app_owner where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- The activity feed is written by agents only; the owner can read it but not edit or delete it.
drop policy if exists owner_all on events;
create policy owner_read on events for select to authenticated using (public.is_owner());

-- Lead websites must be web links (blocks javascript: and data: links planted by a web page).
alter table leads add constraint leads_website_http check (website is null or website ~* '^https?://');

-- ---------------------------------------------------------------------------
-- 2. Audit log: who changed what, when. Append-only and hash-chained, so a
-- deleted or edited row breaks the chain and the Security agent reports it.
-- ---------------------------------------------------------------------------
create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor text not null,                -- owner email, or 'service' for agents
  table_name text not null,
  op text not null check (op in ('INSERT','UPDATE','DELETE')),
  row_key text,
  old_row jsonb,
  new_row jsonb,
  prev_hash text not null,
  hash text not null
);
create index audit_log_at on audit_log (at desc);
alter table audit_log enable row level security;
create policy owner_read on audit_log for select to authenticated using (public.is_owner());
revoke insert, update, delete, truncate on audit_log from anon, authenticated, service_role;

create or replace function public.audit_hash(prev text, r audit_log) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(
    prev || '|' || extract(epoch from r.at)::text || '|' || r.actor || '|' || r.table_name || '|' || r.op || '|' ||
    coalesce(r.row_key, '') || '|' || coalesce(r.old_row::text, '') || '|' || coalesce(r.new_row::text, ''),
    'sha256'), 'hex');
$$;

create or replace function public.audit_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec audit_log;
  prev text;
  claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
begin
  perform pg_advisory_xact_lock(hashtext('audit_log_chain'));
  select hash into prev from audit_log order by id desc limit 1;
  rec.at := now();
  rec.actor := coalesce(claims ->> 'email', claims ->> 'role', current_user);
  rec.table_name := tg_table_name;
  rec.op := tg_op;
  rec.old_row := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
  rec.new_row := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
  rec.row_key := coalesce(rec.new_row, rec.old_row) ->> coalesce(tg_argv[0], 'id');
  rec.prev_hash := coalesce(prev, 'genesis');
  rec.hash := public.audit_hash(rec.prev_hash, rec);
  insert into audit_log (at, actor, table_name, op, row_key, old_row, new_row, prev_hash, hash)
  values (rec.at, rec.actor, rec.table_name, rec.op, rec.row_key, rec.old_row, rec.new_row, rec.prev_hash, rec.hash);
  return coalesce(new, old);
end $$;

create or replace function public.audit_block_changes() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;
create trigger audit_log_no_change before update or delete on audit_log
  for each row execute function public.audit_block_changes();
create trigger audit_log_no_truncate before truncate on audit_log
  for each statement execute function public.audit_block_changes();

-- Returns the id of the first row whose hash does not match, or null when the chain is intact.
create or replace function public.audit_log_verify() returns bigint
language plpgsql stable security definer set search_path = public as $$
declare
  r audit_log;
  prev text := 'genesis';
begin
  for r in select * from audit_log order by id loop
    if r.prev_hash <> prev or r.hash <> public.audit_hash(r.prev_hash, r) then
      return r.id;
    end if;
    prev := r.hash;
  end loop;
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Outbound guard results on approvals.
-- ---------------------------------------------------------------------------
alter table approvals add column guard_status text not null default 'unchecked'
  check (guard_status in ('unchecked','passed','flagged','blocked'));
alter table approvals add column guard_flags jsonb not null default '[]';
alter table approvals add column decided_by text;
alter table approvals drop constraint approvals_status_check;
alter table approvals add constraint approvals_status_check
  check (status in ('pending','approved','rejected','sent','failed','blocked'));

-- Record who decided, from the signed-in session, so the app cannot fake it.
create or replace function public.approvals_stamp() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.status in ('approved','rejected') then
    new.decided_by := coalesce(auth.jwt() ->> 'email', 'service');
    new.decided_at := now();
  end if;
  -- A blocked draft can never be approved from the dashboard.
  if old.guard_status = 'blocked' and new.status = 'approved' then
    raise exception 'blocked by the outbound guard';
  end if;
  return new;
end $$;
create trigger approvals_stamp before update on approvals for each row execute function public.approvals_stamp();

-- ---------------------------------------------------------------------------
-- 4. Security agent: findings.
-- ---------------------------------------------------------------------------
create table security_findings (
  id uuid primary key default gen_random_uuid(),
  check_id text not null,
  severity text not null check (severity in ('critical','high','medium','low')),
  title text not null,
  detail text,
  status text not null default 'open' check (status in ('open','resolved','accepted')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  resolved_at timestamptz,
  owner_note text
);
create unique index security_findings_open on security_findings (check_id) where status = 'open';

-- ---------------------------------------------------------------------------
-- 5. Key register: every secret, where it lives and when it was last rotated.
-- ---------------------------------------------------------------------------
create table key_register (
  name text primary key,
  purpose text not null,
  stored_in text not null,
  last_rotated_on date,
  rotate_every_days integer not null default 90
);
insert into key_register (name, purpose, stored_in) values
  ('SUPABASE_SERVICE_ROLE_KEY', 'Worker access to the database (bypasses RLS)', 'Worker host secrets'),
  ('ANTHROPIC_API_KEY', 'Agents call the Claude API', 'Worker host secrets'),
  ('SMTP_PASS', 'Sending approved outreach email', 'Worker host secrets'),
  ('GITHUB_TOKEN', 'Security agent reads CI and Dependabot status (read-only, optional)', 'Worker host secrets');

-- ---------------------------------------------------------------------------
-- 6. Recurring manual controls the Compliance agent tracks, mapped to SOC 2 criteria.
-- ---------------------------------------------------------------------------
create table controls (
  id text primary key,
  title text not null,
  criteria text not null,
  every_days integer not null,
  last_done_on date,
  note text
);
insert into controls (id, title, criteria, every_days) values
  ('access_review',   'Review who can sign in (app_owner, Supabase users, GitHub, Vercel, worker host)', 'CC6.2, CC6.3', 90),
  ('key_rotation',    'Rotate keys that are due in the key register',                                    'CC6.1', 90),
  ('restore_test',    'Restore a database backup to a scratch project and check it',                    'A1.3', 90),
  ('vendor_review',   'Check vendor SOC 2 reports: Supabase, Vercel, Anthropic, email provider, GitHub', 'CC9.2', 365),
  ('policy_review',   'Read and re-approve the policies in /policies',                                   'CC1.1, CC5.3', 365),
  ('incident_drill',  'Walk through the incident runbook with one made-up scenario',                     'CC7.4', 365),
  ('risk_review',     'Update the risk register in /policies/risk-register.md',                          'CC3.1, CC3.2', 365);

-- ---------------------------------------------------------------------------
-- 7. Compliance agent: evidence snapshots (hashed when stored).
-- ---------------------------------------------------------------------------
create table compliance_evidence (
  id bigint generated always as identity primary key,
  collected_at timestamptz not null default now(),
  control text not null,
  summary text not null,
  data jsonb not null,
  sha256 text not null
);
create index compliance_evidence_at on compliance_evidence (collected_at desc);
create trigger compliance_evidence_no_change before update or delete on compliance_evidence
  for each row execute function public.audit_block_changes();

-- ---------------------------------------------------------------------------
-- 8. Read-only reports for the agents (service role only).
-- ---------------------------------------------------------------------------
create or replace function public.security_rls_report() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'table', c.relname,
    'rls', c.relrowsecurity,
    'policies', coalesce((select jsonb_agg(jsonb_build_object('name', p.policyname, 'roles', p.roles, 'cmd', p.cmd))
                          from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname), '[]'::jsonb)
  ) order by c.relname), '[]'::jsonb)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','p');
$$;

create or replace function public.security_auth_report() returns jsonb
language plpgsql stable security definer set search_path = public, auth as $$
declare
  result jsonb := '{}';
begin
  result := result || jsonb_build_object(
    'owners', (select coalesce(jsonb_agg(email), '[]') from app_owner),
    'non_owner_users', (select coalesce(jsonb_agg(u.email), '[]') from auth.users u
                        where not exists (select 1 from app_owner o where lower(o.email) = lower(u.email))),
    'owners_without_mfa', (select coalesce(jsonb_agg(o.email), '[]') from app_owner o
                           where not exists (select 1 from auth.users u join auth.mfa_factors f on f.user_id = u.id
                                             where lower(u.email) = lower(o.email) and f.status = 'verified')),
    'sessions_last_24h', (select count(*) from auth.sessions where created_at > now() - interval '24 hours')
  );
  return result;
end $$;

-- Deletes leads marked lost with no activity for 12 months. Opted-out leads are kept
-- (company and email only) so they are never contacted again.
create or replace function public.apply_retention() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  deleted integer;
  minimised integer;
begin
  delete from leads where status = 'lost' and updated_at < now() - interval '12 months';
  get diagnostics deleted = row_count;
  update leads set contact_name = null, contact_role = null, reason = null
   where status = 'opted_out' and updated_at < now() - interval '30 days'
     and (contact_name is not null or contact_role is not null or reason is not null);
  get diagnostics minimised = row_count;
  return jsonb_build_object('deleted_lost_leads', deleted, 'minimised_opted_out', minimised);
end $$;

revoke execute on function public.security_rls_report(), public.security_auth_report(),
  public.apply_retention(), public.audit_log_verify() from public, anon, authenticated;
grant execute on function public.security_rls_report(), public.security_auth_report(),
  public.apply_retention(), public.audit_log_verify() to service_role;
grant execute on function public.audit_log_verify() to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Owner-only RLS on the new tables, audit triggers, new agents, live updates.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['security_findings','key_register','controls'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy owner_all on %I for all to authenticated using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
  alter table compliance_evidence enable row level security;
  create policy owner_read on compliance_evidence for select to authenticated using (public.is_owner());

  foreach t in array array['approvals','settings','agents','revenue','app_owner','key_register','controls','security_findings'] loop
    execute format('create trigger audit_%1$s after insert or update or delete on %1$I for each row execute function public.audit_write(%2$L)',
                   t, case t when 'settings' then 'key' when 'agents' then 'name' when 'app_owner' then 'email'
                             when 'key_register' then 'name' else 'id' end);
  end loop;
  -- Leads change often; log only status changes and deletes.
  execute 'create trigger audit_leads after delete or update of status on leads for each row execute function public.audit_write(''id'')';
end $$;

insert into agents (name, title, model, effort, daily_budget_usd, schedule_minutes) values
  ('security',   'Security',       'claude-haiku-5-5', 'low', 1, 1440),
  ('guard',      'Outbound guard', 'claude-haiku-5-5', 'low', 1, 0),
  ('compliance', 'Compliance',     'claude-haiku-5-5', 'low', 1, 10080);

insert into settings (key, value) values ('kill_reason', '""') on conflict do nothing;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table security_findings, key_register, controls, audit_log, compliance_evidence;
  end if;
end $$;
