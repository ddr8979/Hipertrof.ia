-- Fix crítico: feed_posts.type no admitía 'recipe' ni 'routine' -> compartir recetas fallaba siempre
alter table public.feed_posts drop constraint feed_posts_type_check;
alter table public.feed_posts
  add constraint feed_posts_type_check check (
    type = any (array['workout', 'achievement', 'status', 'recipe', 'routine'])
  );

-- Posts de rutinas compartidas
alter table public.feed_posts
  add column if not exists routine_id uuid references public.routines(id) on delete set null;

-- Títulos por paso en recetas (cada paso: título + descripción + foto)
alter table public.recipes
  add column if not exists step_titles text[] not null default '{}';

-- Comentarios de publicaciones
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments(post_id);

alter table public.post_comments enable row level security;

drop policy if exists post_comments_select on public.post_comments;
create policy post_comments_select on public.post_comments
  for select using (
    exists (
      select 1 from public.feed_posts p
      where p.id = post_comments.post_id
        and (
          p.user_id = auth.uid()
          or p.scope = 'global'
          or public.is_following(auth.uid(), p.user_id)
        )
    )
  );

drop policy if exists post_comments_insert on public.post_comments;
create policy post_comments_insert on public.post_comments
  for insert with check (user_id = auth.uid());

drop policy if exists post_comments_delete on public.post_comments;
create policy post_comments_delete on public.post_comments
  for delete using (user_id = auth.uid());

-- Realtime para comentarios
alter publication supabase_realtime add table public.post_comments;