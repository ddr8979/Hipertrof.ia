-- ----------------------------------------------------------------------------
-- Streak + logros automáticos
-- ----------------------------------------------------------------------------

-- 1) Trigger: al insertar un workout, actualizar racha del perfil y
--    publicar el entrenamiento en el feed.
create or replace function public.handle_workout_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  last_day date;
  today date;
begin
  select * into p from public.profiles where id = new.user_id;
  if not found then
    return new;
  end if;

  today := (new.started_at at time zone 'utc')::date;
  if p.last_workout_at is not null then
    last_day := (p.last_workout_at at time zone 'utc')::date;
    if last_day = today then
      null; -- ya entrenó hoy: no tocar racha
    elsif last_day = today - 1 then
      update public.profiles
        set streak_count = p.streak_count + 1,
            max_streak = greatest(p.max_streak, p.streak_count + 1),
            last_workout_at = new.started_at
        where id = new.user_id;
    else
      update public.profiles
        set streak_count = 1,
            max_streak = greatest(p.max_streak, 1),
            last_workout_at = new.started_at
        where id = new.user_id;
    end if;
  else
    update public.profiles
      set streak_count = 1,
          max_streak = greatest(p.max_streak, 1),
          last_workout_at = new.started_at
      where id = new.user_id;
  end if;

  -- Feed: publicar el entrenamiento completado (visible por followers)
  insert into public.feed_posts (user_id, type, workout_id)
  values (new.user_id, 'workout', new.id);

  return new;
end;
$$;

drop trigger if exists workouts_streak_trigger on public.workouts;
create trigger workouts_streak_trigger
  after insert on public.workouts
  for each row execute function public.handle_workout_insert();

-- 2) RPC: evaluar y desbloquear logros tras un entrenamiento.
create or replace function public.unlock_achievements()
returns table (code text, name text, description text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  w_count int;
  s_count int;
  total_volume numeric;
  new_prs int;
  rec record;
begin
  if uid is null then
    return;
  end if;

  select count(*) into w_count from public.workouts where user_id = uid;
  select streak_count into s_count from public.profiles where id = uid;

  select coalesce(sum(s.weight_kg * s.reps), 0)
    into total_volume
    from public.workout_sets s
    join public.workout_exercises we on we.id = s.workout_exercise_id
    join public.workouts w on w.id = we.workout_id
    where w.user_id = uid and s.completed and s.type <> 'W';

  -- Récords personales: comparar 1RM estimado por ejercicio (solo sesión reciente)
  select count(*) into new_prs
  from (
    select we.exercise_id,
           max(s.weight_kg * (1 + s.reps::numeric / 30)) as best_1rm
    from public.workout_sets s
    join public.workout_exercises we on we.id = s.workout_exercise_id
    join public.workouts w on w.id = we.workout_id
    where w.user_id = uid
      and s.completed and s.type <> 'W'
      and s.reps > 0 and s.weight_kg > 0
      and we.exercise_id is not null
    group by we.exercise_id
  ) cur
  where not exists (
    select 1
    from public.workout_sets s2
    join public.workout_exercises we2 on we2.id = s2.workout_exercise_id
    join public.workouts w2 on w2.id = we2.workout_id
    where w2.user_id = uid
      and we2.exercise_id = cur.exercise_id
      and w2.id <> coalesce(
        (select w3.id from public.workouts w3
         join public.workout_exercises we3 on we3.workout_id = w3.id
         where w3.user_id = uid and we3.exercise_id = cur.exercise_id
         order by w3.started_at desc limit 1), '00000000-0000-0000-0000-000000000000'::uuid)
      and s2.completed and s2.type <> 'W'
      and s2.weight_kg * (1 + s2.reps::numeric / 30) >= cur.best_1rm
  )
  and exists (
    select 1 from public.workout_sets s3
    join public.workout_exercises we4 on we4.id = s3.workout_exercise_id
    join public.workouts w4 on w4.id = we4.workout_id
    where w4.user_id = uid and we4.exercise_id = cur.exercise_id
      and s3.completed and s3.type <> 'W'
      and s3.weight_kg * (1 + s3.reps::numeric / 30) >= cur.best_1rm
  );

  -- Logros elegibles
  for rec in
    select * from (
      select 'first_workout' as code
      union all select 'workouts_10'
      union all select 'workouts_50'
      union all select 'workouts_100'
      union all select 'streak_3'
      union all select 'streak_7'
      union all select 'streak_30'
      union all select 'volume_10000'
      union all select 'pr_first'
      union all select 'pr_5'
      union all select 'early_bird'
    ) cand
    where not exists (
      select 1 from public.user_achievements ua
      where ua.user_id = uid and ua.achievement_id = cand.code
    )
    and (
      (cand.code = 'first_workout' and w_count >= 1) or
      (cand.code = 'workouts_10'   and w_count >= 10) or
      (cand.code = 'workouts_50'   and w_count >= 50) or
      (cand.code = 'workouts_100'  and w_count >= 100) or
      (cand.code = 'streak_3'      and s_count >= 3) or
      (cand.code = 'streak_7'      and s_count >= 7) or
      (cand.code = 'streak_30'     and s_count >= 30) or
      (cand.code = 'volume_10000'  and total_volume >= 10000) or
      (cand.code = 'pr_first'      and new_prs >= 1) or
      (cand.code = 'pr_5'          and new_prs >= 5) or
      (cand.code = 'early_bird'    and exists (
        select 1 from public.workouts w
        where w.user_id = uid and extract(hour from w.started_at) between 0 and 8
      ))
    )
  loop
    insert into public.user_achievements (user_id, achievement_id)
    values (uid, rec.code)
    on conflict do nothing;

    insert into public.feed_posts (user_id, type, achievement_id)
    values (uid, 'achievement', rec.code)
    on conflict do nothing;

    return query
      select a.code, a.name, a.description
      from public.achievements a where a.code = rec.code;
  end loop;

  return;
end;
$$;

grant execute on function public.unlock_achievements() to authenticated;

-- Fix perfil nuevo: racha inicial en 0 ya está por default.
-- Índice para consultas de feed/feed de followers.
create index if not exists feed_posts_created_idx on public.feed_posts(created_at desc);
create index if not exists workouts_started_idx on public.workouts(started_at desc);