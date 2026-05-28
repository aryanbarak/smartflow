create table if not exists public.mood_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  mood        smallint not null check (mood between 1 and 5),
  note        text,
  created_at  timestamptz default now(),
  unique (user_id, date)
);

alter table public.mood_logs enable row level security;

create policy "Users manage own mood logs"
  on public.mood_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on public.mood_logs to authenticated;
