-- ============================================================================
-- hypertrof.ia — Esquema inicial (producción-grade)
-- RLS activo en TODAS las tablas. Aislamiento por usuario vía auth.uid().
-- Fase 1: extensiones, helpers y TODAS las tablas.
-- Fase 2: triggers, políticas RLS, storage y logros.
-- ============================================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- FASE 1 — TABLAS
-- ============================================================================

-- profiles (extiende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  bio text check (char_length(bio) <= 300),
  avatar_url text,
  banner_url text,
  accent_color text not null default '#a3e635',
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  role text not null default 'athlete' check (role in ('athlete', 'trainer', 'admin')),
  is_admin boolean not null default false,
  is_trainer_approved boolean not null default false,
  is_public_profile boolean not null default true,
  show_playlists boolean not null default true,
  onboarded boolean not null default false,

  sex text check (sex in ('male', 'female', 'other', null)),
  age_years int check (age_years between 10 and 100),
  height_cm int check (height_cm between 100 and 250),
  weight_kg numeric(5,1) check (weight_kg between 20 and 300),
  activity_level text check (activity_level in ('sedentary','light','moderate','very','extra')),
  diet_type text check (diet_type in ('omnivoro','vegetariano','vegano','sin_gluten')),
  diet_goal text check (diet_goal in ('volumen','definicion','mantenimiento')),
  bmr_kcal int,
  tdee_kcal int,

  streak_count int not null default 0,
  max_streak int not null default 0,
  last_workout_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Catálogo de ejercicios
create table if not exists public.exercises (
  id text primary key,
  name text not null unique,
  muscle_group text,
  primary_muscle text,
  equipment text,
  gif_url text,
  instructions text,
  is_custom boolean not null default false,
  author_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Rutinas (plantillas)
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_template boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id text references public.exercises(id) on delete set null,
  order_index int not null default 0,
  target_sets int not null default 3 check (target_sets between 1 and 20),
  target_reps text not null default '8-12',
  rest_sec int not null default 90 check (rest_sec between 0 and 600),
  group_name text,
  color text,
  is_superset boolean not null default false,
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  created_at timestamptz not null default now()
);

-- Rutinas asignadas por un trainer a un atleta
create table if not exists public.assigned_routines (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  unique (athlete_id, routine_id),
  check (trainer_id <> athlete_id)
);

-- Sesiones de entrenamiento (workouts) + series
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Entrenamiento',
  notes text,
  source_routine_id uuid references public.routines(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_sec int,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id text references public.exercises(id) on delete set null,
  name text not null,
  order_index int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_index int not null default 0,
  type text not null default 'N' check (type in ('N', 'W', 'F', 'D')),
  weight_kg numeric(6,2) not null default 0,
  reps int not null default 0 check (reps >= 0),
  rpe numeric(2,1) check (rpe between 0 and 10),
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Nutrición
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  calories int not null check (calories >= 0),
  protein_g int not null default 0,
  carbs_g int not null default 0,
  fats_g int not null default 0,
  country_code text not null default 'UY',
  category text,
  tags text,
  prep_minutes int,
  difficulty text,
  servings int not null default 1,
  diet_types text,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete set null,
  name text not null,
  calories int not null default 0,
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fats_g numeric(6,1) not null default 0,
  notes text,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Trainer ↔ atletas
create table if not exists public.trainer_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'active', 'terminated')),
  created_at timestamptz not null default now(),
  unique (trainer_id, athlete_id),
  check (trainer_id <> athlete_id)
);

-- Social: seguidores, logros, feed, playlists
create table if not exists public.followers (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.achievements (
  code text primary key,
  name text not null,
  description text not null,
  icon text not null,
  category text not null default 'general',
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null references public.achievements(code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('workout', 'achievement', 'status')),
  workout_id uuid references public.workouts(id) on delete set null,
  achievement_id text references public.achievements(code) on delete set null,
  caption text check (char_length(caption) <= 280),
  created_at timestamptz not null default now()
);

-- Conexiones de terceros (Spotify / Apple Music / YouTube Music)
create table if not exists public.user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('spotify', 'apple_music', 'youtube_music')),
  external_user_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('spotify', 'apple_music', 'youtube_music')),
  external_id text,
  name text not null,
  artist text,
  cover_url text,
  url text,
  played_at timestamptz,
  created_at timestamptz not null default now()
);

-- Marketplace de cursos
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  price_uyu int not null default 0 check (price_uyu >= 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  cover_url text,
  content_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (course_id, athlete_id)
);

-- Índices
create index exercises_muscle_group_idx on public.exercises(muscle_group);
create index exercises_custom_author_idx on public.exercises(author_id) where is_custom;
create index routines_user_idx on public.routines(user_id);
create index routine_exercises_routine_idx on public.routine_exercises(routine_id);
create index assigned_routines_athlete_idx on public.assigned_routines(athlete_id);
create index assigned_routines_trainer_idx on public.assigned_routines(trainer_id);
create index workouts_user_started_idx on public.workouts(user_id, started_at desc);
create index workout_exercises_workout_idx on public.workout_exercises(workout_id);
create index workout_sets_exercise_idx on public.workout_sets(workout_exercise_id);
create index meal_logs_user_eaten_idx on public.meal_logs(user_id, eaten_at desc);
create index trainer_clients_trainer_idx on public.trainer_clients(trainer_id);
create index trainer_clients_athlete_idx on public.trainer_clients(athlete_id);
create index followers_following_idx on public.followers(following_id);
create index feed_posts_user_created_idx on public.feed_posts(user_id, created_at desc);
create index playlists_user_provider_idx on public.playlists(user_id, provider);
create index courses_status_idx on public.courses(status);
create index course_enrollments_athlete_idx on public.course_enrollments(athlete_id);

-- ============================================================================
-- FASE 2 — TRIGGERS, RLS Y POLÍTICAS
-- ============================================================================

-- Helper admin (después de crear profiles)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Username por defecto a partir del email (único, con sufijo aleatorio)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
begin
  base := lower(coalesce(split_part(new.email, '@', 1), 'user'));
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');
  if base = '' then base := 'user'; end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) loop
    candidate := base || substr(md5(new.id::text || random()::text), 1, 6);
  end loop;
  insert into public.profiles (id, username, display_name)
  values (new.id, candidate, base);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

create trigger user_connections_set_updated_at
  before update on public.user_connections
  for each row execute function public.set_updated_at();

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: profiles
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (
    id = auth.uid()
    or is_public_profile = true
    or exists (select 1 from public.followers f where f.following_id = profiles.id and f.follower_id = auth.uid())
    or exists (select 1 from public.trainer_clients tc where tc.athlete_id = profiles.id and tc.trainer_id = auth.uid())
  );

create policy profiles_insert on public.profiles
  for insert with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_delete on public.profiles
  for delete using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: ejercicios (catálogo público, custom del autor)
-- ----------------------------------------------------------------------------
alter table public.exercises enable row level security;

create policy exercises_select on public.exercises
  for select using (is_custom = false or author_id = auth.uid());

create policy exercises_insert on public.exercises
  for insert with check (is_custom = true and author_id = auth.uid());

create policy exercises_update on public.exercises
  for update using (is_custom = true and author_id = auth.uid());

create policy exercises_delete on public.exercises
  for delete using (is_custom = true and author_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: rutinas
-- ----------------------------------------------------------------------------
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

create policy routines_select on public.routines
  for select using (user_id = auth.uid() or is_public = true);

create policy routines_insert on public.routines
  for insert with check (user_id = auth.uid());

create policy routines_update on public.routines
  for update using (user_id = auth.uid());

create policy routines_delete on public.routines
  for delete using (user_id = auth.uid());

create policy routine_exercises_select on public.routine_exercises
  for select using (
    exists (select 1 from public.routines r where r.id = routine_id and (r.user_id = auth.uid() or r.is_public))
  );

create policy routine_exercises_insert on public.routine_exercises
  for insert with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );

create policy routine_exercises_update on public.routine_exercises
  for update using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );

create policy routine_exercises_delete on public.routine_exercises
  for delete using (
    exists (select 1 from public.routines r where r.id = routine_id and r.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- RLS: rutinas asignadas
-- ----------------------------------------------------------------------------
alter table public.assigned_routines enable row level security;

create policy assigned_routines_select on public.assigned_routines
  for select using (trainer_id = auth.uid() or athlete_id = auth.uid());

create policy assigned_routines_insert on public.assigned_routines
  for insert with check (trainer_id = auth.uid() and athlete_id <> auth.uid());

create policy assigned_routines_update on public.assigned_routines
  for update using (trainer_id = auth.uid() or athlete_id = auth.uid());

create policy assigned_routines_delete on public.assigned_routines
  for delete using (trainer_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: workouts
-- ----------------------------------------------------------------------------
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy workouts_select on public.workouts
  for select using (user_id = auth.uid());

create policy workouts_insert on public.workouts
  for insert with check (user_id = auth.uid());

create policy workouts_update on public.workouts
  for update using (user_id = auth.uid());

create policy workouts_delete on public.workouts
  for delete using (user_id = auth.uid());

create policy workout_exercises_select on public.workout_exercises
  for select using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy workout_exercises_insert on public.workout_exercises
  for insert with check (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy workout_exercises_update on public.workout_exercises
  for update using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy workout_exercises_delete on public.workout_exercises
  for delete using (exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy workout_sets_select on public.workout_sets
  for select using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy workout_sets_insert on public.workout_sets
  for insert with check (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy workout_sets_update on public.workout_sets
  for update using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

create policy workout_sets_delete on public.workout_sets
  for delete using (
    exists (
      select 1 from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- RLS: nutrición
-- ----------------------------------------------------------------------------
alter table public.recipes enable row level security;
alter table public.meal_logs enable row level security;

create policy recipes_select on public.recipes for select using (true);
create policy recipes_insert on public.recipes for insert with check (public.is_admin());
create policy recipes_update on public.recipes for update using (public.is_admin());
create policy recipes_delete on public.recipes for delete using (public.is_admin());

create policy meal_logs_select on public.meal_logs
  for select using (user_id = auth.uid());

create policy meal_logs_insert on public.meal_logs
  for insert with check (user_id = auth.uid());

create policy meal_logs_update on public.meal_logs
  for update using (user_id = auth.uid());

create policy meal_logs_delete on public.meal_logs
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: trainer_clients
-- ----------------------------------------------------------------------------
alter table public.trainer_clients enable row level security;

create policy trainer_clients_select on public.trainer_clients
  for select using (trainer_id = auth.uid() or athlete_id = auth.uid());

create policy trainer_clients_insert on public.trainer_clients
  for insert with check (trainer_id = auth.uid());

create policy trainer_clients_update on public.trainer_clients
  for update using (trainer_id = auth.uid() or athlete_id = auth.uid());

create policy trainer_clients_delete on public.trainer_clients
  for delete using (trainer_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: social
-- ----------------------------------------------------------------------------
alter table public.followers enable row level security;

create policy followers_select on public.followers
  for select using (follower_id = auth.uid() or following_id = auth.uid());

create policy followers_insert on public.followers
  for insert with check (follower_id = auth.uid() and following_id <> auth.uid());

create policy followers_delete on public.followers
  for delete using (follower_id = auth.uid());

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy achievements_select on public.achievements for select using (true);
create policy achievements_insert on public.achievements for insert with check (public.is_admin());
create policy achievements_update on public.achievements for update using (public.is_admin());
create policy achievements_delete on public.achievements for delete using (public.is_admin());

create policy user_achievements_select on public.user_achievements
  for select using (user_id = auth.uid() or exists (
    select 1 from public.followers f where f.following_id = user_achievements.user_id and f.follower_id = auth.uid()
  ));

create policy user_achievements_insert on public.user_achievements
  for insert with check (user_id = auth.uid());

create policy user_achievements_delete on public.user_achievements
  for delete using (user_id = auth.uid());

alter table public.feed_posts enable row level security;

create policy feed_posts_select on public.feed_posts
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.followers f where f.following_id = feed_posts.user_id and f.follower_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = feed_posts.user_id and p.is_public_profile)
  );

create policy feed_posts_insert on public.feed_posts
  for insert with check (user_id = auth.uid());

create policy feed_posts_update on public.feed_posts
  for update using (user_id = auth.uid());

create policy feed_posts_delete on public.feed_posts
  for delete using (user_id = auth.uid());

alter table public.user_connections enable row level security;

create policy user_connections_select on public.user_connections
  for select using (user_id = auth.uid());

create policy user_connections_insert on public.user_connections
  for insert with check (user_id = auth.uid());

create policy user_connections_update on public.user_connections
  for update using (user_id = auth.uid());

create policy user_connections_delete on public.user_connections
  for delete using (user_id = auth.uid());

alter table public.playlists enable row level security;

create policy playlists_select on public.playlists
  for select using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public_profile and p.show_playlists)
  );

create policy playlists_insert on public.playlists
  for insert with check (user_id = auth.uid());

create policy playlists_update on public.playlists
  for update using (user_id = auth.uid());

create policy playlists_delete on public.playlists
  for delete using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- RLS: marketplace
-- ----------------------------------------------------------------------------
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;

create policy courses_select on public.courses
  for select using (status = 'published' or trainer_id = auth.uid() or public.is_admin());

create policy courses_insert on public.courses
  for insert with check (trainer_id = auth.uid());

create policy courses_update on public.courses
  for update using (trainer_id = auth.uid() or public.is_admin());

create policy courses_delete on public.courses
  for delete using (trainer_id = auth.uid() or public.is_admin());

create policy enrollments_select on public.course_enrollments
  for select using (athlete_id = auth.uid() or public.is_admin());

create policy enrollments_insert on public.course_enrollments
  for insert with check (athlete_id = auth.uid());

create policy enrollments_update on public.course_enrollments
  for update using (athlete_id = auth.uid());

create policy enrollments_delete on public.course_enrollments
  for delete using (athlete_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Storage: buckets públicos (avatars, banners) — escritura solo en carpeta propia
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('banners', 'banners', true)
on conflict (id) do nothing;

create policy storage_media_read on storage.objects
  for select using (bucket_id in ('avatars', 'banners'));

create policy storage_media_insert on storage.objects
  for insert with check (
    bucket_id in ('avatars', 'banners')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy storage_media_update on storage.objects
  for update using (
    bucket_id in ('avatars', 'banners')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy storage_media_delete on storage.objects
  for delete using (
    bucket_id in ('avatars', 'banners')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- Logros del sistema
-- ----------------------------------------------------------------------------
insert into public.achievements (code, name, description, icon, category) values
  ('first_workout',    'Primer Entrenamiento',  'Completá tu primera sesión.',                       'Flame',           'entrenamiento'),
  ('workouts_10',      'Racha de Hierro',       'Completá 10 sesiones.',                             'Dumbbell',        'entrenamiento'),
  ('workouts_50',      'Máquina',               'Completá 50 sesiones.',                              'Cpu',             'entrenamiento'),
  ('workouts_100',     'Imparable',             'Completá 100 sesiones.',                             'Rocket',          'entrenamiento'),
  ('streak_3',         'En Fuego',              'Entrená 3 días seguidos.',                           'Zap',             'constancia'),
  ('streak_7',         'Semana Completa',       'Entrená 7 días seguidos.',                           'CalendarCheck',   'constancia'),
  ('streak_30',        'Mes Imparable',         'Entrená 30 días seguidos.',                          'Medal',           'constancia'),
  ('volume_10000',     'Diez Toneladas',        'Acumulá 10.000 kg de volumen total.',               'Weight',          'rendimiento'),
  ('pr_first',         'Nuevo Récord',          'Batí tu primer récord personal de 1RM.',            'Trophy',          'rendimiento'),
  ('pr_5',             'Coleccionista',         'Batí 5 récords personales.',                        'Award',           'rendimiento'),
  ('follower_10',      'Influencer',            'Conseguí 10 seguidores.',                            'Users',           'social'),
  ('early_bird',       'Amanecer',              'Entrená antes de las 9:00.',                         'Sunrise',         'entrenamiento')
on conflict (code) do nothing;
-- ----------------------------------------------------------------------------
-- Grants PostgREST: el RLS es la capa real de control de acceso.
-- anon/authenticated pueden operar según las políticas; service_role admin total.
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated, service_role;
grant insert, update, delete on all tables in schema public to authenticated, service_role;
