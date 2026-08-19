-- Likes en posts del feed
create table if not exists public.post_likes (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_post_idx on public.post_likes(post_id);

alter table public.post_likes enable row level security;

create policy post_likes_select on public.post_likes
  for select using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_likes.post_id
        and (
          p.user_id = auth.uid()
          or p.scope = 'global'
          or public.is_following(auth.uid(), p.user_id)
        )
    )
  );

create policy post_likes_insert on public.post_likes
  for insert with check (user_id = auth.uid());

create policy post_likes_delete on public.post_likes
  for delete using (user_id = auth.uid());

-- Diario: nombre propio por día (domingo..sábado)
alter table public.daily_entries
  add column if not exists name text;