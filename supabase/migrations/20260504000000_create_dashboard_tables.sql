create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount >= 0),
  category text not null,
  date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age integer,
  color text not null default '#6366f1',
  initials text not null,
  schedule jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learn_ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null,
  language text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;
alter table public.finance_transactions enable row level security;
alter table public.family_children enable row level security;
alter table public.learn_ai_messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_select_own') then
    create policy tasks_select_own on public.tasks for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_insert_own') then
    create policy tasks_insert_own on public.tasks for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_update_own') then
    create policy tasks_update_own on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'tasks' and policyname = 'tasks_delete_own') then
    create policy tasks_delete_own on public.tasks for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_transactions' and policyname = 'finance_transactions_select_own') then
    create policy finance_transactions_select_own on public.finance_transactions for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_transactions' and policyname = 'finance_transactions_insert_own') then
    create policy finance_transactions_insert_own on public.finance_transactions for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_transactions' and policyname = 'finance_transactions_update_own') then
    create policy finance_transactions_update_own on public.finance_transactions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'finance_transactions' and policyname = 'finance_transactions_delete_own') then
    create policy finance_transactions_delete_own on public.finance_transactions for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_children' and policyname = 'family_children_select_own') then
    create policy family_children_select_own on public.family_children for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_children' and policyname = 'family_children_insert_own') then
    create policy family_children_insert_own on public.family_children for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_children' and policyname = 'family_children_update_own') then
    create policy family_children_update_own on public.family_children for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'family_children' and policyname = 'family_children_delete_own') then
    create policy family_children_delete_own on public.family_children for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learn_ai_messages' and policyname = 'learn_ai_messages_select_own') then
    create policy learn_ai_messages_select_own on public.learn_ai_messages for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'learn_ai_messages' and policyname = 'learn_ai_messages_insert_own') then
    create policy learn_ai_messages_insert_own on public.learn_ai_messages for insert with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists tasks_user_created_idx on public.tasks(user_id, created_at desc);
create index if not exists finance_transactions_user_date_idx on public.finance_transactions(user_id, date desc, created_at desc);
create index if not exists family_children_user_created_idx on public.family_children(user_id, created_at);
create index if not exists learn_ai_messages_user_mode_created_idx on public.learn_ai_messages(user_id, mode, created_at);

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
before update on public.tasks
for each row execute function public.update_updated_at_column();

drop trigger if exists update_finance_transactions_updated_at on public.finance_transactions;
create trigger update_finance_transactions_updated_at
before update on public.finance_transactions
for each row execute function public.update_updated_at_column();

drop trigger if exists update_family_children_updated_at on public.family_children;
create trigger update_family_children_updated_at
before update on public.family_children
for each row execute function public.update_updated_at_column();
