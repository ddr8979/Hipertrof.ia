-- Preferencias y restricciones alimenticias para el motor de recomendaciones
alter table public.profiles
  add column if not exists food_preferences text[] not null default '{}',
  add column if not exists food_restrictions text[] not null default '{}';

-- Cierre de jornada nutricional: historial diario consolidado
create table if not exists public.daily_entries (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

alter table public.daily_entries enable row level security;

create policy daily_entries_select on public.daily_entries
  for select to authenticated
  using (user_id = auth.uid());

create policy daily_entries_insert on public.daily_entries
  for insert to authenticated
  with check (user_id = auth.uid());

create policy daily_entries_update on public.daily_entries
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy daily_entries_delete on public.daily_entries
  for delete to authenticated
  using (user_id = auth.uid());