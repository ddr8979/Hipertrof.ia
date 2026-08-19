-- Ver autores de publicaciones visibles (posts globales o de seguidos)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or is_public_profile = true
    or public.is_following(auth.uid(), id)
    or exists (
      select 1 from public.feed_posts fp
      where fp.user_id = profiles.id
        and (
          fp.scope = 'global'
          or public.is_following(auth.uid(), fp.user_id)
        )
    )
    or exists (select 1 from public.trainer_clients tc where tc.athlete_id = profiles.id and tc.trainer_id = auth.uid())
  );