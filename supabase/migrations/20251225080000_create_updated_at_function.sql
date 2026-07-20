-- Local replay compatibility:
-- Later historical migrations create triggers that call this function.
-- Production migration history must be audited separately before remote use.
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
