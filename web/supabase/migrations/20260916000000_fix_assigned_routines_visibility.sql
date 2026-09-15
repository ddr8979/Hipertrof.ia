-- ============================================================================
-- P0-1: el alumno asignado (y su trainer) deben poder leer la rutina asignada.
-- Antes: routines_select / routine_exercises_select sólo permitían
-- `user_id = auth.uid()` o `is_public = true`. Una rutina asignada pertenece al
-- trainer y nace `is_public = false`, así que el alumno veía la asignación pero
-- no el contenido (y "Entrenar" abría una sesión vacía).
-- ============================================================================

drop policy if exists routines_select on public.routines;
create policy routines_select on public.routines
  for select using (
    user_id = auth.uid()
    or is_public = true
    or exists (
      select 1 from public.assigned_routines ar
      where ar.routine_id = routines.id
        and ar.active
        and (ar.athlete_id = auth.uid() or ar.trainer_id = auth.uid())
    )
  );

drop policy if exists routine_exercises_select on public.routine_exercises;
create policy routine_exercises_select on public.routine_exercises
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and (
          r.user_id = auth.uid()
          or r.is_public
          or exists (
            select 1 from public.assigned_routines ar
            where ar.routine_id = r.id
              and ar.active
              and (ar.athlete_id = auth.uid() or ar.trainer_id = auth.uid())
          )
        )
    )
  );
