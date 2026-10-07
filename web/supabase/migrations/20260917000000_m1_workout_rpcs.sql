-- =============================================================================
-- M1: RPC transaccionales (plpgsql, SECURITY DEFINER)
-- =============================================================================
-- `finish_workout`: persiste workout + workout_exercises + workout_sets en una
-- única transacción. Reemplaza al flujo cliente de 3 round-trips no atómicos
-- (upsert workout → insert exercises x uno → insert sets x lote), que podía
-- dejar huérfanos / duplicados de ejercicios en caso de error o reintentos.
--
-- `save_routine`: upsertea routines + routine_exercises atómicamente (evita los
-- inserts/upserts sueltos de la página /rutinas).
--
-- IDEMPOTENTE: `create or replace` / `drop function if exists`.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- finish_workout(p_workout jsonb) -> uuid
-- -----------------------------------------------------------------------------
-- payload:
-- { id, name, notes, source_routine_id?, started_at, ended_at, duration_sec,
--   exercises: [ { exercise_id?, name, notes, sets: [
--       { type, weight_kg, reps, rpe?, completed } ] } ] }
-- -----------------------------------------------------------------------------
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
       nullif(ex ->> 'exercise_id', '')::uuid,
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

-- -----------------------------------------------------------------------------
-- save_routine(p_routine jsonb) -> uuid
-- -----------------------------------------------------------------------------
-- payload:
-- { id?, name, description?, is_public?, is_template?, exercises: [
--     { id?, exercise_id?, order_index, target_sets, target_reps, rest_sec,
--       group_name?, color?, is_superset? } ] }
-- -----------------------------------------------------------------------------
create or replace function public.save_routine(p_routine jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user        uuid := auth.uid();
  v_routine_id  uuid;
  ex            jsonb;
begin
  if v_user is null then
    raise exception 'No autenticado';
  end if;
  if p_routine is null then
    raise exception 'Payload de rutina requerido';
  end if;

  -- 1) Upsert de la rutina (sólo el dueño puede modificar).
  if p_routine ->> 'id' is not null then
    v_routine_id := (p_routine ->> 'id')::uuid;
    update public.routines
       set name = p_routine ->> 'name',
           description = nullif(p_routine ->> 'description', ''),
            is_public = coalesce((p_routine ->> 'is_public')::boolean, false),
           is_template = coalesce((p_routine ->> 'is_template')::boolean, false),
           updated_at = now()
     where id = v_routine_id and user_id = v_user;
    if not found then
      raise exception 'No autorizado para editar esta rutina';
    end if;
  else
    insert into public.routines (user_id, name, description, is_template, is_public)
    values
      (v_user,
       p_routine ->> 'name',
       nullif(p_routine ->> 'description', ''),
       coalesce((p_routine ->> 'is_template')::boolean, false),
       coalesce((p_routine ->> 'is_public')::boolean, false))
    returning id into v_routine_id;
  end if;

  -- 2) Reemplazar ejercicios: borrar los previos y reinsertar desde el payload.
  -- Idempotente y sin duplicados/huérfanos (el cliente persiste el borrador actual).
  delete from public.routine_exercises where routine_id = v_routine_id;

  for ex in select jsonb_array_elements(p_routine -> 'exercises')
  loop
    insert into public.routine_exercises
      (routine_id, exercise_id, order_index, target_sets, target_reps,
       rest_sec, group_name, color, is_superset, weight_unit)
    values
      (v_routine_id,
       nullif(ex ->> 'exercise_id', '')::text,
       coalesce((ex ->> 'order_index')::int, 0),
       (ex ->> 'target_sets')::int,
       ex ->> 'target_reps',
       (ex ->> 'rest_sec')::int,
       nullif(ex ->> 'group_name', ''),
       nullif(ex ->> 'color', ''),
       coalesce((ex ->> 'is_superset')::boolean, false),
       coalesce(ex ->> 'weight_unit', 'kg'));
  end loop;

  return v_routine_id;
end;
$$;

grant execute on function public.save_routine(jsonb) to authenticated;
