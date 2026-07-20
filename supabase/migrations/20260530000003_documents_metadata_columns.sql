-- Local replay compatibility:
-- Documents UI/services expect these metadata columns on public.documents.
-- Production migration history must be audited separately before remote use.
alter table public.documents
  add column if not exists tags text[] not null default '{}',
  add column if not exists ai_summary text,
  add column if not exists ai_summary_points text[] not null default '{}',
  add column if not exists extracted_tasks_count integer not null default 0,
  add column if not exists last_opened_at timestamptz;

create index if not exists documents_tags_idx on public.documents using gin(tags);
