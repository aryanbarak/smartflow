create table if not exists public.flashcard_decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

create table if not exists public.flashcards (
  id            uuid primary key default gen_random_uuid(),
  deck_id       uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  front         text not null,
  back          text not null,
  ease_factor   real not null default 2.5,
  interval_days integer not null default 1,
  next_review   date not null default current_date,
  review_count  integer not null default 0,
  last_rating   smallint,
  created_at    timestamptz default now()
);

alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

create policy "Users manage own decks"
  on public.flashcard_decks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own flashcards"
  on public.flashcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant all on public.flashcard_decks to authenticated;
grant all on public.flashcards to authenticated;
