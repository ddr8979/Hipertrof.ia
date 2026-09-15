-- ============================================================================
-- Trainer ↔ Alumno bidireccional: invitación por link/QR + aceptación.
-- El trainer genera un código/link; el alumno lo abre (o lo tipea) y acepta.
-- `accept_trainer_invite` crea el vínculo en trainer_clients de forma atómica,
-- sin exponer la tabla trainer_invites al alumno.
-- ============================================================================

create table if not exists public.trainer_invites (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  note text,
  max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0,
  revoked boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trainer_invites_trainer_idx on public.trainer_invites(trainer_id);

alter table public.trainer_invites enable row level security;

drop policy if exists trainer_invites_select on public.trainer_invites;
create policy trainer_invites_select on public.trainer_invites
  for select using (trainer_id = auth.uid() or public.is_admin());

drop policy if exists trainer_invites_insert on public.trainer_invites;
create policy trainer_invites_insert on public.trainer_invites
  for insert with check (trainer_id = auth.uid());

drop policy if exists trainer_invites_update on public.trainer_invites;
create policy trainer_invites_update on public.trainer_invites
  for update using (trainer_id = auth.uid() or public.is_admin());

drop policy if exists trainer_invites_delete on public.trainer_invites;
create policy trainer_invites_delete on public.trainer_invites
  for delete using (trainer_id = auth.uid() or public.is_admin());

-- Crea una invitación (solo trainers). El código es corto y único.
create or replace function public.create_trainer_invite(
  p_note text default null,
  p_expires_days int default 30,
  p_max_uses int default null
)
returns public.trainer_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_row public.trainer_invites;
  v_try int := 0;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = v_uid and p.role = 'trainer'
  ) then
    raise exception 'Solo los entrenadores pueden invitar';
  end if;

  loop
    v_try := v_try + 1;
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.trainer_invites where code = v_code);
    if v_try >= 10 then
      raise exception 'No se pudo generar un código único';
    end if;
  end loop;

  insert into public.trainer_invites (trainer_id, code, note, max_uses, expires_at)
  values (
    v_uid,
    v_code,
    nullif(trim(coalesce(p_note, '')), ''),
    p_max_uses,
    case
      when p_expires_days is null then null
      else now() + make_interval(days => p_expires_days)
    end
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- Previsualiza una invitación por código (datos del trainer, sin exponer la tabla).
create or replace function public.get_trainer_invite(p_code text)
returns table (
  code text,
  trainer_id uuid,
  trainer_name text,
  trainer_username text,
  trainer_avatar text,
  note text,
  expired boolean,
  exhausted boolean,
  already_linked boolean,
  self_invite boolean
)
language sql
security definer
set search_path = public
as $$
  select
    i.code,
    i.trainer_id,
    p.display_name,
    p.username,
    p.avatar_url,
    i.note,
    (i.expires_at is not null and i.expires_at < now()) as expired,
    (i.max_uses is not null and i.uses >= i.max_uses) as exhausted,
    exists (
      select 1 from public.trainer_clients tc
      where tc.trainer_id = i.trainer_id
        and tc.athlete_id = auth.uid()
        and tc.status = 'active'
    ) as already_linked,
    (i.trainer_id = auth.uid()) as self_invite
  from public.trainer_invites i
  join public.profiles p on p.id = i.trainer_id
  where i.code = upper(trim(p_code)) and not i.revoked;
$$;

-- Acepta una invitación: crea/activa el vínculo trainer_clients de forma atómica.
create or replace function public.accept_trainer_invite(p_code text)
returns table (
  trainer_id uuid,
  trainer_name text,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.trainer_invites;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;

  select * into v_inv
  from public.trainer_invites
  where code = upper(trim(p_code)) and not revoked
  for update;

  if not found then
    raise exception 'La invitación no existe o fue revocada';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'La invitación expiró';
  end if;
  if v_inv.max_uses is not null and v_inv.uses >= v_inv.max_uses then
    raise exception 'La invitación ya no tiene usos disponibles';
  end if;
  if v_inv.trainer_id = v_uid then
    raise exception 'No podés aceptar tu propia invitación';
  end if;

  insert into public.trainer_clients (trainer_id, athlete_id, status)
  values (v_inv.trainer_id, v_uid, 'active')
  on conflict (trainer_id, athlete_id)
  do update set status = 'active';

  update public.trainer_invites
  set uses = uses + 1
  where id = v_inv.id;

  return query
    select v_inv.trainer_id, p.display_name, 'active'::text
    from public.profiles p
    where p.id = v_inv.trainer_id;
end;
$$;

grant execute on function public.create_trainer_invite(text, int, int) to authenticated;
grant execute on function public.get_trainer_invite(text) to authenticated;
grant execute on function public.accept_trainer_invite(text) to authenticated;
