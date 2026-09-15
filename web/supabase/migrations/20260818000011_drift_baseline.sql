-- =============================================================================
-- Drift baseline — objetos que existen en producción pero NO estaban migrados
-- =============================================================================
-- Motivo: el código usa estas tablas/RPCs/columnas, pero ninguna migración las
-- creaba. En producción existían creadas a mano; en una base nueva desde cero
-- la app fallaba. Esta migración las formaliza.
--
-- IDEMPOTENTE: usa "if not exists" / "create or replace" / "drop policy if exists".
-- Se puede pegar tal cual en el SQL Editor de Supabase (staging y luego prod).
--
-- ⚠️ ORDEN: el nombre `20260818000002a_...` la ubica DESPUÉS de `init_schema`
-- y `seed_catalog`, y ANTES de `20260819000013_bestfriends_dm_images_security.sql`,
-- que hace `alter table public.direct_messages ...` y por lo tanto necesita que
-- la tabla ya exista en una base recreada desde cero.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) direct_messages — mensajería directa (texto, estrellas, imagen, view-once)
-- -----------------------------------------------------------------------------
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  stars int not null default 0 check (stars >= 0),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  image_url text,
  view_once boolean not null default false,
  opened_at timestamptz,
  media_type text,                                   -- 'image' | 'video'
  video_url text,
  expires_at timestamptz,                            -- chat efímero (24 h)
  reply_to uuid references public.direct_messages(id) on delete set null,
  deleted_for_everyone boolean not null default false
);

-- Columnas agregadas por si la tabla ya existía en prod con una versión previa.
alter table public.direct_messages add column if not exists image_url text;
alter table public.direct_messages add column if not exists view_once boolean not null default false;
alter table public.direct_messages add column if not exists opened_at timestamptz;
alter table public.direct_messages add column if not exists media_type text;
alter table public.direct_messages add column if not exists video_url text;
alter table public.direct_messages add column if not exists expires_at timestamptz;
alter table public.direct_messages add column if not exists reply_to uuid;
alter table public.direct_messages add column if not exists deleted_for_everyone boolean not null default false;

create index if not exists direct_messages_sender_idx on public.direct_messages(sender_id, created_at desc);
create index if not exists direct_messages_recipient_idx on public.direct_messages(recipient_id, created_at desc);
create index if not exists direct_messages_unread_idx on public.direct_messages(recipient_id) where read_at is null;

alter table public.direct_messages enable row level security;

-- Solo emisor y receptor ven el mensaje.
drop policy if exists direct_messages_select on public.direct_messages;
create policy direct_messages_select on public.direct_messages
  for select using (sender_id = auth.uid() or recipient_id = auth.uid());

-- Solo el emisor autenticado puede crear sus mensajes.
drop policy if exists direct_messages_insert on public.direct_messages;
create policy direct_messages_insert on public.direct_messages
  for insert with check (sender_id = auth.uid());

-- El receptor marca leído/abierto; el emisor puede borrar para todos.
drop policy if exists direct_messages_update on public.direct_messages;
create policy direct_messages_update on public.direct_messages
  for update using (sender_id = auth.uid() or recipient_id = auth.uid())
  with check (sender_id = auth.uid() or recipient_id = auth.uid());

drop policy if exists direct_messages_delete on public.direct_messages;
create policy direct_messages_delete on public.direct_messages
  for delete using (sender_id = auth.uid() or recipient_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 2) assigned_recipes — recetas que un trainer asigna a un alumno
-- -----------------------------------------------------------------------------
-- El nombre de la FK `assigned_recipes_trainer_id_fkey` lo usa PostgREST para
-- el embed `trainer:profiles!assigned_recipes_trainer_id_fkey(...)`.
create table if not exists public.assigned_recipes (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (athlete_id, recipe_id),
  check (trainer_id <> athlete_id)
);

create index if not exists assigned_recipes_athlete_idx on public.assigned_recipes(athlete_id);
create index if not exists assigned_recipes_trainer_idx on public.assigned_recipes(trainer_id);

alter table public.assigned_recipes enable row level security;

drop policy if exists assigned_recipes_select on public.assigned_recipes;
create policy assigned_recipes_select on public.assigned_recipes
  for select using (trainer_id = auth.uid() or athlete_id = auth.uid());

drop policy if exists assigned_recipes_insert on public.assigned_recipes;
create policy assigned_recipes_insert on public.assigned_recipes
  for insert with check (trainer_id = auth.uid() and athlete_id <> auth.uid());

drop policy if exists assigned_recipes_update on public.assigned_recipes;
create policy assigned_recipes_update on public.assigned_recipes
  for update using (trainer_id = auth.uid() or athlete_id = auth.uid())
  with check (trainer_id = auth.uid() or athlete_id = auth.uid());

drop policy if exists assigned_recipes_delete on public.assigned_recipes;
create policy assigned_recipes_delete on public.assigned_recipes
  for delete using (trainer_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 3) push_subscriptions — suscripciones Web Push del usuario
-- -----------------------------------------------------------------------------
-- `endpoint` es la PK a propósito: el código hace upsert sin onConflict, y
-- Supabase resuelve el conflicto por PK. Así re-registrar no duplica.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select on public.push_subscriptions;
create policy push_subscriptions_select on public.push_subscriptions
  for select using (user_id = auth.uid());

drop policy if exists push_subscriptions_insert on public.push_subscriptions;
create policy push_subscriptions_insert on public.push_subscriptions
  for insert with check (user_id = auth.uid());

drop policy if exists push_subscriptions_update on public.push_subscriptions;
create policy push_subscriptions_update on public.push_subscriptions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists push_subscriptions_delete on public.push_subscriptions;
create policy push_subscriptions_delete on public.push_subscriptions
  for delete using (user_id = auth.uid());

-- ⚠️ NOTA: /api/push/send hoy lee esta tabla con el cliente anónimo SIN usuario,
-- por lo que RLS la niega y los push no se envían. Fix de código pendiente:
-- usar createAdminClient() (service_role) en ese route handler.

-- -----------------------------------------------------------------------------
-- 4) spotify_tokens — tokens OAuth de Spotify por usuario
-- -----------------------------------------------------------------------------
-- `user_id` es PK: el upsert del código resuelve el conflicto por PK.
create table if not exists public.spotify_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  share_playing boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.spotify_tokens enable row level security;

-- Solo el dueño lee/escribe sus tokens. El servidor (service_role) puede leer
-- los de otro usuario para mostrar "reproduciendo" en su perfil.
drop policy if exists spotify_tokens_select on public.spotify_tokens;
create policy spotify_tokens_select on public.spotify_tokens
  for select using (user_id = auth.uid());

drop policy if exists spotify_tokens_insert on public.spotify_tokens;
create policy spotify_tokens_insert on public.spotify_tokens
  for insert with check (user_id = auth.uid());

drop policy if exists spotify_tokens_update on public.spotify_tokens;
create policy spotify_tokens_update on public.spotify_tokens
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists spotify_tokens_delete on public.spotify_tokens;
create policy spotify_tokens_delete on public.spotify_tokens
  for delete using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5) star_balances — saldo de estrellas (moneda interna del chat)
-- -----------------------------------------------------------------------------
-- El saldo NO se escribe desde el cliente: solo la RPC send_message (SECURITY
-- DEFINER) lo modifica. Por eso no hay policies de insert/update para
-- `authenticated`; solo de lectura propia.
create table if not exists public.star_balances (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

alter table public.star_balances enable row level security;

drop policy if exists star_balances_select on public.star_balances;
create policy star_balances_select on public.star_balances
  for select using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6) RPC get_conversations() — lista de conversaciones del usuario
-- -----------------------------------------------------------------------------
-- Devuelve, por cada interlocutor: sus datos públicos, el último mensaje, su
-- fecha y la cantidad de no leídos. SECURITY DEFINER para poder cruzar mensajes
-- de ambos sentidos sin chocar con RLS.
create or replace function public.get_conversations()
returns table (
  other_id uuid,
  display_name text,
  username text,
  avatar_url text,
  last_message text,
  last_message_at timestamptz,
  unread int
)
language sql
security definer
set search_path = public
stable
as $$
  with me as (select auth.uid() as uid),
  pairs as (
    select
      case when dm.sender_id = (select uid from me) then dm.recipient_id else dm.sender_id end as other_id,
      dm.content,
      dm.created_at,
      dm.read_at,
      dm.recipient_id
    from public.direct_messages dm
    where dm.sender_id = (select uid from me) or dm.recipient_id = (select uid from me)
  ),
  agg as (
    select
      p.other_id,
      (array_agg(p.content order by p.created_at desc))[1] as last_message,
      max(p.created_at) as last_message_at,
      count(*) filter (where p.recipient_id = (select uid from me) and p.read_at is null) as unread
    from pairs p
    group by p.other_id
  )
  select
    a.other_id,
    pr.display_name,
    pr.username,
    pr.avatar_url,
    a.last_message,
    a.last_message_at,
    a.unread::int
  from agg a
  join public.profiles pr on pr.id = a.other_id
  order by a.last_message_at desc nulls last;
$$;

grant execute on function public.get_conversations() to authenticated;

-- -----------------------------------------------------------------------------
-- 7) RPC send_message() — envía un mensaje y transfiere estrellas si hay
-- -----------------------------------------------------------------------------
-- Atómico: valida saldo, descuenta al emisor, acredita al receptor y crea el
-- mensaje. Evita que el cliente pueda inyectar mensajes o estrellas saltándose
-- las reglas.
create or replace function public.send_message(
  p_recipient uuid,
  p_content text,
  p_stars int default 0
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_balance int;
begin
  if v_uid is null then
    raise exception 'No autenticado';
  end if;
  if p_recipient is null then
    raise exception 'Destinatario requerido';
  end if;
  if p_recipient = v_uid then
    raise exception 'No podés enviarte mensajes a vos mismo';
  end if;
  if p_stars < 0 then
    raise exception 'Cantidad de estrellas inválida';
  end if;

  -- Transferencia de estrellas (si corresponde), bloqueando la fila del emisor.
  if p_stars > 0 then
    select balance into v_balance
      from public.star_balances
      where user_id = v_uid
      for update;

    if coalesce(v_balance, 0) < p_stars then
      raise exception 'Saldo de estrellas insuficiente';
    end if;

    update public.star_balances
      set balance = balance - p_stars, updated_at = now()
      where user_id = v_uid;

    insert into public.star_balances (user_id, balance)
      values (p_recipient, p_stars)
      on conflict (user_id)
      do update set balance = public.star_balances.balance + excluded.balance,
                    updated_at = now();
  end if;

  insert into public.direct_messages (sender_id, recipient_id, content, stars)
    values (v_uid, p_recipient, coalesce(p_content, ''), p_stars)
    returning id into v_id;

  return v_id;
end $$;

grant execute on function public.send_message(uuid, text, int) to authenticated;

-- -----------------------------------------------------------------------------
-- 8) profiles — columnas de perfil usadas por /perfil y /perfil/[id]
-- -----------------------------------------------------------------------------
alter table public.profiles add column if not exists is_verified boolean not null default false;
alter table public.profiles add column if not exists instagram_handle text;
alter table public.profiles add column if not exists tiktok_handle text;
alter table public.profiles add column if not exists twitter_handle text;
alter table public.profiles add column if not exists spotify_handle text;
alter table public.profiles add column if not exists profile_track_id text;
alter table public.profiles add column if not exists profile_track_name text;
alter table public.profiles add column if not exists profile_track_artist text;
alter table public.profiles add column if not exists profile_track_preview text;
alter table public.profiles add column if not exists profile_track_cover text;

-- -----------------------------------------------------------------------------
-- 9) Bucket de Storage para imágenes de DM
-- -----------------------------------------------------------------------------
-- Lectura pública (la URL se guarda en el mensaje); subida restringida a la
-- carpeta del propio usuario (`<uid>/archivo`).
insert into storage.buckets (id, name, public)
  values ('dm-images', 'dm-images', true)
  on conflict (id) do nothing;

drop policy if exists dm_images_insert on storage.objects;
create policy dm_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dm-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists dm_images_select on storage.objects;
create policy dm_images_select on storage.objects
  for select using (bucket_id = 'dm-images');

drop policy if exists dm_images_delete on storage.objects;
create policy dm_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dm-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- FIN — drift baseline
-- =============================================================================
