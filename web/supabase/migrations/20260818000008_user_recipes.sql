-- Recetas propias: pasos + fotos + autor (null = catálogo)
alter table public.recipes
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists steps text[] not null default '{}',
  add column if not exists photos text[] not null default '{}';

create index if not exists recipes_user_idx on public.recipes(user_id);

drop policy if exists recipes_select on public.recipes;
create policy recipes_select on public.recipes
  for select using (
    user_id is null
    or user_id = auth.uid()
    or public.is_following(auth.uid(), user_id)
    or public.profile_is_public(user_id)
  );

drop policy if exists recipes_insert on public.recipes;
create policy recipes_insert on public.recipes
  for insert with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists recipes_update on public.recipes;
create policy recipes_update on public.recipes
  for update using (
    user_id = auth.uid()
    or public.is_admin()
  ) with check (
    user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists recipes_delete on public.recipes;
create policy recipes_delete on public.recipes
  for delete using (
    user_id = auth.uid()
    or public.is_admin()
  );

-- Bucket público para fotos de recetas
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

create policy "recipe-photos-public-read"
  on storage.objects for select
  using (bucket_id = 'recipe-photos');

create policy "recipe-photos-auth-insert"
  on storage.objects for insert
  with check (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recipe-photos-auth-update"
  on storage.objects for update
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "recipe-photos-auth-delete"
  on storage.objects for delete
  using (
    bucket_id = 'recipe-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );