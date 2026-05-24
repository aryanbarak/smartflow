-- photo_albums must be created before photos (photos.album_id references it)
create table if not exists public.photo_albums (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  name        text        not null,
  description text,
  cover_photo_id uuid,    -- FK to photos added below after photos table exists
  created_at  timestamptz not null default now()
);

create table if not exists public.photos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  r2_key      text        not null,
  thumb_key   text,
  file_name   text        not null,
  file_size   integer,
  mime_type   text,
  width       integer,
  height      integer,
  taken_at    text,
  album_id    uuid        references public.photo_albums(id) on delete set null,
  tags        text[]      not null default '{}',
  caption     text,
  created_at  timestamptz not null default now()
);

-- Now that photos exists, add the FK for cover_photo_id
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'fk_albums_cover_photo'
  ) then
    alter table public.photo_albums
      add constraint fk_albums_cover_photo
      foreign key (cover_photo_id) references public.photos(id) on delete set null;
  end if;
end $$;

-- ── Row-level security ─────────────────────────────────────────────────────────

alter table public.photos        enable row level security;
alter table public.photo_albums  enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_select_own') then
    create policy photos_select_own on public.photos for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_insert_own') then
    create policy photos_insert_own on public.photos for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_update_own') then
    create policy photos_update_own on public.photos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photos' and policyname='photos_delete_own') then
    create policy photos_delete_own on public.photos for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photo_albums' and policyname='albums_select_own') then
    create policy albums_select_own on public.photo_albums for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photo_albums' and policyname='albums_insert_own') then
    create policy albums_insert_own on public.photo_albums for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photo_albums' and policyname='albums_update_own') then
    create policy albums_update_own on public.photo_albums for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='photo_albums' and policyname='albums_delete_own') then
    create policy albums_delete_own on public.photo_albums for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index if not exists idx_photos_user_album   on public.photos(user_id, album_id);
create index if not exists idx_photos_user_created on public.photos(user_id, created_at desc);
create index if not exists idx_albums_user         on public.photo_albums(user_id);
