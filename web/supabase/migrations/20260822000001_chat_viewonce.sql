-- Chat: ver una vez (view-once), media, efímero, respuestas, borrado
alter table public.direct_messages
  add column if not exists view_once boolean not null default false,
  add column if not exists media_type text,
  add column if not exists video_url text,
  add column if not exists opened_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists reply_to text,
  add column if not exists deleted_for_everyone boolean not null default false;

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.direct_messages(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (message_id, user_id)
);
alter table public.message_reactions enable row level security;