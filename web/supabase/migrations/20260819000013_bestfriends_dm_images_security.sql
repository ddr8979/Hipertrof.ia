-- ============================================================
-- Migración 13: Mejores amigos, imágenes en DM, seguridad
-- 2026-08-19
-- ============================================================

-- 1) Imágenes en mensajes directos
alter table public.direct_messages add column if not exists image_url text;

-- 2) Mejores amigos: flag en followers
alter table public.followers add column if not exists is_best_friend boolean not null default false;
create index if not exists followers_best_friend_idx on public.followers(follower_id) where is_best_friend;

-- Solo el seguidor puede actualizar el flag de mejor amigo de sus propios follows
drop policy if exists followers_update on public.followers;
create policy followers_update on public.followers
  for update using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

-- 3) Alcance 'best_friends' en publicaciones
alter table public.feed_posts drop constraint if exists feed_posts_scope_check;
alter table public.feed_posts
  add constraint feed_posts_scope_check check (scope in ('global', 'friends', 'best_friends'));

drop policy if exists feed_posts_select on public.feed_posts;
create policy feed_posts_select on public.feed_posts
  for select using (
    user_id = auth.uid()
    or scope = 'global'
    or (scope = 'friends' and exists (
      select 1 from public.followers f
      where f.following_id = feed_posts.user_id and f.follower_id = auth.uid()
    ))
    or (scope = 'best_friends' and exists (
      select 1 from public.followers f
      where f.following_id = feed_posts.user_id and f.follower_id = auth.uid() and f.is_best_friend
    ))
  );

-- 4) Comentarios y likes: respetar el nuevo alcance
drop policy if exists post_comments_select on public.post_comments;
create policy post_comments_select on public.post_comments
  for select using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_comments.post_id
        and (
          p.user_id = auth.uid()
          or p.scope = 'global'
          or (p.scope = 'friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid()
          ))
          or (p.scope = 'best_friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid() and f.is_best_friend
          ))
        )
    )
  );

drop policy if exists post_likes_select on public.post_likes;
create policy post_likes_select on public.post_likes
  for select using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_likes.post_id
        and (
          p.user_id = auth.uid()
          or p.scope = 'global'
          or (p.scope = 'friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid()
          ))
          or (p.scope = 'best_friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid() and f.is_best_friend
          ))
        )
    )
  );

-- Likes solo sobre posts visibles para el usuario
drop policy if exists post_likes_insert on public.post_likes;
create policy post_likes_insert on public.post_likes
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.feed_posts p
      where p.id = post_likes.post_id
        and (
          p.user_id = auth.uid()
          or p.scope = 'global'
          or (p.scope = 'friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid()
          ))
          or (p.scope = 'best_friends' and exists (
            select 1 from public.followers f
            where f.following_id = p.user_id and f.follower_id = auth.uid() and f.is_best_friend
          ))
        )
    )
  );

-- 5) Realtime para mensajes directos (notificaciones en vivo)
alter publication supabase_realtime add table public.direct_messages;

-- 6) SEGURIDAD: bloquear auto-escalada a admin/trainer vía UPDATE propio
create or replace function public.prevent_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.role := old.role;
  new.is_admin := old.is_admin;
  new.is_trainer_approved := old.is_trainer_approved;
  return new;
end $$;

drop trigger if exists trg_protect_privileges on public.profiles;
create trigger trg_protect_privileges
  before update on public.profiles
  for each row execute function public.prevent_privilege_escalation();

-- 7) SEGURIDAD: enrollments — impedir auto-marcarse pagado
create or replace function public.protect_enrollment_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  new.paid := old.paid;
  new.paid_at := old.paid_at;
  new.amount_paid := old.amount_paid;
  return new;
end $$;

drop trigger if exists trg_protect_enrollment_payment on public.course_enrollments;
create trigger trg_protect_enrollment_payment
  before update on public.course_enrollments
  for each row execute function public.protect_enrollment_payment();

-- 8) SEGURIDAD/PRIVACIDAD: vista de perfiles públicos sin datos sensibles
-- (peso, altura, edad, sexo, BMR, TDEE quedan fuera)
drop view if exists public.public_profiles;
create view public.public_profiles with (security_invoker = true) as
  select
    id,
    username,
    display_name,
    bio,
    avatar_url,
    banner_url,
    accent_color,
    is_public_profile,
    show_playlists,
    show_weight,
    show_height,
    show_followers,
    show_personal,
    streak_count,
    created_at
  from public.profiles;

grant select on public.public_profiles to authenticated, anon;

-- 9) SEGURIDAD: playlists respetan show_playlists
drop policy if exists playlists_select on public.playlists;
create policy playlists_select on public.playlists
  for select using (
    user_id = auth.uid()
    or (
      profile_is_public(user_id)
      and exists (
        select 1 from public.profiles p
        where p.id = playlists.user_id and p.show_playlists
      )
    )
  );

-- 10) SEGURIDAD: buckets de storage con tipos y tamaño permitido
update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'image/avif'],
    file_size_limit = 5242880
where id in ('avatars', 'banners', 'recipe-photos');