-- Fix recursión infinita en RLS: las policies de profiles/followers/user_achievements/feed_posts
-- se consultaban entre sí (profiles_select -> followers -> profiles_select -> ...).
-- Solución: funciones SECURITY DEFINER que acceden a las tablas sin RLS.

create or replace function public.is_following(follower_uuid uuid, following_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.followers f
    where f.follower_id = is_following.follower_uuid
      and f.following_id = is_following.following_uuid
  );
$$;

create or replace function public.profile_is_public(profile_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = profile_is_public.profile_uuid and p.is_public_profile
  );
$$;

create or replace function public.profile_show_followers(profile_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = profile_show_followers.profile_uuid and p.show_followers
  );
$$;

grant execute on function public.is_following(uuid, uuid) to authenticated, anon;
grant execute on function public.profile_is_public(uuid) to authenticated, anon;
grant execute on function public.profile_show_followers(uuid) to authenticated, anon;

-- profiles_select: sin subquery a followers (recursión)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or is_public_profile = true
    or public.is_following(auth.uid(), id)
    or exists (select 1 from public.trainer_clients tc where tc.athlete_id = profiles.id and tc.trainer_id = auth.uid())
  );

-- followers_select: sin subquery a profiles (recursión)
drop policy if exists followers_select on public.followers;
create policy followers_select on public.followers
  for select using (
    follower_id = auth.uid()
    or following_id = auth.uid()
    or (public.profile_is_public(following_id) and public.profile_show_followers(following_id))
    or (public.profile_is_public(follower_id) and public.profile_show_followers(follower_id))
  );

-- user_achievements_select: sin subquery a followers (recursión)
drop policy if exists user_achievements_select on public.user_achievements;
create policy user_achievements_select on public.user_achievements
  for select using (
    user_id = auth.uid()
    or public.is_following(auth.uid(), user_id)
    or public.profile_is_public(user_id)
  );

-- feed_posts_select: sin subquery a followers (recursión)
drop policy if exists feed_posts_select on public.feed_posts;
create policy feed_posts_select on public.feed_posts
  for select using (
    user_id = auth.uid()
    or scope = 'global'
    or (scope = 'friends' and public.is_following(auth.uid(), user_id))
  );

-- Playlists visibles en perfiles públicos
drop policy if exists playlists_select on public.playlists;
create policy playlists_select on public.playlists
  for select using (
    user_id = auth.uid()
    or public.profile_is_public(user_id)
  );