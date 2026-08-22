-- Planes de suscripción + privacidad de calorías + cover de tema de perfil
alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists show_calories boolean not null default true,
  add column if not exists profile_track_cover text;