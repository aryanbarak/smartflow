-- Local replay compatibility:
-- Later chat migrations expect public.agent_chat_messages to exist.
-- Production migration history must be audited separately before remote use.
create table if not exists public.agent_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.agent_chat_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_chat_messages'
      and policyname = 'agent_chat_messages_select_own'
  ) then
    create policy agent_chat_messages_select_own
      on public.agent_chat_messages
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'agent_chat_messages'
      and policyname = 'agent_chat_messages_insert_own'
  ) then
    create policy agent_chat_messages_insert_own
      on public.agent_chat_messages
      for insert
      with check (auth.uid() = user_id or auth.role() = 'service_role');
  end if;
end $$;

create index if not exists agent_chat_messages_user_created_idx
  on public.agent_chat_messages(user_id, created_at desc);
