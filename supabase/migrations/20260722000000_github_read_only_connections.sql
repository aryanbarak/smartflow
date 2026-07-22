-- GitHub Read-only Integration V1: verified, non-secret connection metadata only.

create table if not exists public.github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  installation_id bigint not null unique check (installation_id > 0),
  github_account_id bigint not null check (github_account_id > 0),
  github_account_login text not null check (char_length(github_account_login) between 1 and 100),
  status text not null default 'connected' check (status in ('connected', 'revoked')),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.github_connection_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setup_state_hash text not null unique check (char_length(setup_state_hash) = 64),
  oauth_state_hash text unique check (oauth_state_hash is null or char_length(oauth_state_hash) = 64),
  claimed_installation_id bigint check (claimed_installation_id is null or claimed_installation_id > 0),
  expires_at timestamptz not null,
  setup_consumed_at timestamptz,
  oauth_consumed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists github_connection_attempts_user_id_idx
  on public.github_connection_attempts (user_id);
create index if not exists github_connection_attempts_expires_at_idx
  on public.github_connection_attempts (expires_at);

alter table public.github_connections enable row level security;
alter table public.github_connection_attempts enable row level security;

revoke insert, update, delete on public.github_connections from anon, authenticated;
revoke all on public.github_connection_attempts from anon, authenticated;

grant select on public.github_connections to authenticated;
grant select, insert, update, delete on public.github_connections to service_role;
grant select, insert, update, delete on public.github_connection_attempts to service_role;

drop policy if exists "Users can read their own verified GitHub connection" on public.github_connections;
create policy "Users can read their own verified GitHub connection"
  on public.github_connections
  for select
  to authenticated
  using (auth.uid() = user_id);

comment on table public.github_connections is
  'Verified GitHub App installation metadata. Provider credentials and OAuth state are never stored here.';
comment on table public.github_connection_attempts is
  'Short-lived hashed state for single-use GitHub App connection attempts. Accessible only through the service role.';
