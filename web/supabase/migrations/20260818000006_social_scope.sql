-- Social: alcance de publicaciones (global/amigos) + recetas en posts
alter table public.feed_posts
  add column if not exists scope text not null default 'global'
  check (scope in ('global', 'friends')),
  add column if not exists recipe_id uuid references public.recipes(id) on delete set null;

create index if not exists feed_posts_scope_idx on public.feed_posts(scope, created_at desc);

drop policy if exists feed_posts_select on public.feed_posts;
create policy feed_posts_select on public.feed_posts
  for select using (
    user_id = auth.uid()
    or scope = 'global'
    or (scope = 'friends' and exists (
      select 1 from public.followers f
      where f.following_id = feed_posts.user_id and f.follower_id = auth.uid()
    ))
  );

-- Privacidad por métrica del perfil
alter table public.profiles
  add column if not exists show_weight boolean not null default true,
  add column if not exists show_height boolean not null default true,
  add column if not exists show_followers boolean not null default true,
  add column if not exists show_personal boolean not null default true;

-- Logros visibles para perfiles públicos
drop policy if exists user_achievements_select on public.user_achievements;
create policy user_achievements_select on public.user_achievements
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.followers f
      where f.following_id = user_achievements.user_id and f.follower_id = auth.uid())
    or exists (select 1 from public.profiles p
      where p.id = user_achievements.user_id and p.is_public_profile)
  );

-- Playlists: portada extraída del enlace
alter table public.playlists add column if not exists thumbnail_url text;

-- Contadores de seguidores/seguidos visibles en perfiles públicos (según show_followers)
drop policy if exists followers_select on public.followers;
create policy followers_select on public.followers
  for select using (
    follower_id = auth.uid()
    or following_id = auth.uid()
    or exists (select 1 from public.profiles p
      where p.id = followers.following_id and p.is_public_profile and p.show_followers)
    or exists (select 1 from public.profiles p
      where p.id = followers.follower_id and p.is_public_profile and p.show_followers)
  );