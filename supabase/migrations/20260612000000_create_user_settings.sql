-- Local replay compatibility:
-- Later migrations and language settings expect public.user_settings to exist.
-- Production migration history must be audited separately before remote use.
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  language text not null default 'en' check (language in ('en', 'de', 'fa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_user_id_key unique (user_id)
);

alter table public.user_settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_select_own'
  ) then
    create policy user_settings_select_own
      on public.user_settings
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_insert_own'
  ) then
    create policy user_settings_insert_own
      on public.user_settings
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_settings'
      and policyname = 'user_settings_update_own'
  ) then
    create policy user_settings_update_own
      on public.user_settings
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists user_settings_user_id_idx on public.user_settings(user_id);

drop trigger if exists update_user_settings_updated_at on public.user_settings;
create trigger update_user_settings_updated_at
before update on public.user_settings
for each row execute function public.update_updated_at_column();
