alter table public.message_reactions enable row level security;

create index if not exists message_reactions_message_idx
  on public.message_reactions(message_id);

create index if not exists message_reactions_user_idx
  on public.message_reactions(user_id);

drop policy if exists message_reactions_select on public.message_reactions;
create policy message_reactions_select on public.message_reactions
  for select using (
    exists (
      select 1
      from public.direct_messages dm
      where dm.id = message_reactions.message_id
        and (dm.sender_id = auth.uid() or dm.recipient_id = auth.uid())
    )
  );

drop policy if exists message_reactions_insert on public.message_reactions;
create policy message_reactions_insert on public.message_reactions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.direct_messages dm
      where dm.id = message_reactions.message_id
        and (dm.sender_id = auth.uid() or dm.recipient_id = auth.uid())
    )
  );

drop policy if exists message_reactions_update on public.message_reactions;
create policy message_reactions_update on public.message_reactions
  for update using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.direct_messages dm
      where dm.id = message_reactions.message_id
        and (dm.sender_id = auth.uid() or dm.recipient_id = auth.uid())
    )
  )
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.direct_messages dm
      where dm.id = message_reactions.message_id
        and (dm.sender_id = auth.uid() or dm.recipient_id = auth.uid())
    )
  );

drop policy if exists message_reactions_delete on public.message_reactions;
create policy message_reactions_delete on public.message_reactions
  for delete using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.direct_messages dm
      where dm.id = message_reactions.message_id
        and (dm.sender_id = auth.uid() or dm.recipient_id = auth.uid())
    )
  );

alter publication supabase_realtime add table public.message_reactions;

grant select, insert, update, delete on public.message_reactions to authenticated, service_role;
