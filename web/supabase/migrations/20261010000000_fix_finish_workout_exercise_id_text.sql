-- ============================================================================
-- Fix: finish_workout casteaba exercise_id a ::uuid, pero la columna
-- workout_exercises.exercise_id es text (IDs de catálogo como '0198').
-- Causaba "invalid input syntax for type uuid" al guardar la sesión.
-- Redefine finish_workout con ::text (igual que save_routine).
-- IDEMPOTENTE.
-- ============================================================================

create or replace function public.finish_workout(p_workout jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user       uuid := auth.uid();
  v_workout_id uuid;
  ex           jsonb;
  st           jsonb;
  we_id        uuid;
  ex_idx       int := 0;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;
  if p_workout is null then
    raise exception 'Payload de workout requerido';
  end if;

  v_workout_id := (p_workout ->> 'id')::uuid;

  -- 1) Upsert del workout (idempotente por draft.id; sólo el dueño).
  if exists (select 1 from public.workouts w where w.id = v_workout_id and w.user_id = v_user) then
    update public.workouts
       set name = p_workout ->> 'name',
           notes = nullif(p_workout ->> 'notes', ''),
           source_routine_id = nullif(p_workout ->> 'source_routine_id', '')::uuid,
           started_at = coalesce((p_workout ->> 'started_at')::timestamptz, now()),
           ended_at = (p_workout ->> 'ended_at')::timestamptz,
           duration_sec = (p_workout ->> 'duration_sec')::int
     where id = v_workout_id;
  else
    insert into public.workouts
      (id, user_id, name, notes, source_routine_id, started_at, ended_at, duration_sec)
    values
      (v_workout_id, v_user,
       p_workout ->> 'name',
       nullif(p_workout ->> 'notes', ''),
       nullif(p_workout ->> 'source_routine_id', '')::uuid,
       coalesce((p_workout ->> 'started_at')::timestamptz, now()),
       (p_workout ->> 'ended_at')::timestamptz,
       (p_workout ->> 'duration_sec')::int);
  end if;

  -- Limpia ejercicios/sets previos del workout (el draft.id es idempotente):
  -- evita duplicados en re-guardados. El borrado cascadea a workout_sets (FK).
  delete from public.workout_exercises where workout_id = v_workout_id;

  -- 2) Insert de ejercicios + 3) insert de sets, atómicamente en la misma txn.
  for ex in select jsonb_array_elements(p_workout -> 'exercises')
  loop
    ex_idx := ex_idx + 1;
    insert into public.workout_exercises
      (workout_id, exercise_id, name, order_index, notes)
    values
      (v_workout_id,
       nullif(ex ->> 'exercise_id', '')::text,
       ex ->> 'name',
       ex_idx,
       nullif(ex ->> 'notes', ''))
    returning id into we_id;

    for st in select jsonb_array_elements(ex -> 'sets')
    loop
      insert into public.workout_sets
        (workout_exercise_id, set_index, type, weight_kg, reps, rpe, completed)
      values
        (we_id,
         (st ->> 'set_index')::int,
         st ->> 'type',
         (st ->> 'weight_kg')::numeric(6,2),
         (st ->> 'reps')::int,
         nullif(st ->> 'rpe', '')::numeric(2,1),
         (st ->> 'completed')::boolean);
    end loop;
  end loop;

  return v_workout_id;
end;
$$;

grant execute on function public.finish_workout(jsonb) to authenticated;
