-- ============================================================================
-- Peso objetivo por ejercicio + visibilidad del entrenador.
-- 1) routine_exercises.target_weight_kg: el coach/asignación puede fijar carga.
-- 2) save_routine: persiste target_weight_kg y weight_unit.
-- 3) RLS: un entrenador activo puede LEER workouts, workout_exercises,
--    workout_sets y meal_logs de sus alumnos activos (progreso + nutrición).
-- IDEMPOTENTE.
-- ============================================================================

-- 1) Columna de peso objetivo (opcional).
alter table public.routine_exercises
  add column if not exists target_weight_kg numeric(6,2)
  check (target_weight_kg is null or target_weight_kg >= 0);

-- 2) save_routine: además de todo lo anterior, guardar target_weight_kg.
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

  delete from public.routine_exercises where routine_id = v_routine_id;

  for ex in select jsonb_array_elements(p_routine -> 'exercises')
  loop
    insert into public.routine_exercises
      (routine_id, exercise_id, order_index, target_sets, target_reps,
       rest_sec, group_name, color, is_superset, weight_unit, target_weight_kg)
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
       coalesce(ex ->> 'weight_unit', 'kg'),
       nullif(ex ->> 'target_weight_kg', '')::numeric(6,2));
  end loop;

  return v_routine_id;
end;
$$;

grant execute on function public.save_routine(jsonb) to authenticated;

-- 3) Helper: ¿soy el entrenador ACTIVO de este alumno?
create or replace function public.is_my_client(p_athlete uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trainer_clients tc
    where tc.trainer_id = auth.uid()
      and tc.athlete_id = p_athlete
      and tc.status = 'active'
  );
$$;

grant execute on function public.is_my_client(uuid) to authenticated;

-- workouts: el entrenador activo puede leer los de su alumno.
drop policy if exists workouts_select on public.workouts;
create policy workouts_select on public.workouts
  for select using (
    user_id = auth.uid() or public.is_my_client(user_id)
  );

-- workout_exercises
drop policy if exists workout_exercises_select on public.workout_exercises;
create policy workout_exercises_select on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id
        and (w.user_id = auth.uid() or public.is_my_client(w.user_id))
    )
  );

-- workout_sets
drop policy if exists workout_sets_select on public.workout_sets;
create policy workout_sets_select on public.workout_sets
  for select using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id
        and (w.user_id = auth.uid() or public.is_my_client(w.user_id))
    )
  );

-- meal_logs: el entrenador activo puede leer la nutrición de su alumno.
drop policy if exists meal_logs_select on public.meal_logs;
create policy meal_logs_select on public.meal_logs
  for select using (
    user_id = auth.uid() or public.is_my_client(user_id)
  );
