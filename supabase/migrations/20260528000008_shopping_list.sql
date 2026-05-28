create table if not exists public.shopping_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'Other',
  quantity    numeric,
  unit        text,
  checked     boolean not null default false,
  created_at  timestamptz default now()
);

alter table public.shopping_items enable row level security;

create policy "Users manage own shopping items"
  on public.shopping_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on public.shopping_items to authenticated;
