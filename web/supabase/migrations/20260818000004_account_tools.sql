-- 20260818000004: Export de datos y borrado de cuenta
-- ----------------------------------------------------------------------------

-- Exporta todos los datos del usuario autenticado como JSON
create or replace function public.export_my_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result jsonb;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select row_to_json(p) from public.profiles p where p.id = uid),
    'workouts', (select coalesce(jsonb_agg(w), '[]'::jsonb)
                   from (select * from public.workouts where user_id = uid) w),
    'workout_exercises', (select coalesce(jsonb_agg(we), '[]'::jsonb)
                            from (select * from public.workout_exercises where workout_id in (select id from public.workouts where user_id = uid)) we),
    'workout_sets', (select coalesce(jsonb_agg(ws), '[]'::jsonb)
                       from (select * from public.workout_sets where workout_exercise_id in (select id from public.workout_exercises where workout_id in (select id from public.workouts where user_id = uid))) ws),
    'routines', (select coalesce(jsonb_agg(r), '[]'::jsonb) from public.routines r where r.user_id = uid),
    'routine_exercises', (select coalesce(jsonb_agg(re), '[]'::jsonb)
                            from public.routine_exercises re
                            where re.routine_id in (select id from public.routines where user_id = uid)),
    'meal_logs', (select coalesce(jsonb_agg(ml), '[]'::jsonb) from public.meal_logs ml where ml.user_id = uid),
    'playlists', (select coalesce(jsonb_agg(p), '[]'::jsonb) from public.playlists p where p.user_id = uid),
    'achievements', (select coalesce(jsonb_agg(ua), '[]'::jsonb)
                       from (select ua.achievement_id, ua.unlocked_at from public.user_achievements ua where ua.user_id = uid) ua),
    'followers', (select coalesce(jsonb_agg(f), '[]'::jsonb)
                    from (select follower_id from public.followers where following_id = uid) f),
    'following', (select coalesce(jsonb_agg(f), '[]'::jsonb)
                    from (select following_id from public.followers where follower_id = uid) f),
    'feed_posts', (select coalesce(jsonb_agg(fp), '[]'::jsonb) from public.feed_posts fp where fp.user_id = uid)
  ) into result;

  return result;
end;
$$;

revoke all on function public.export_my_data() from public;
grant execute on function public.export_my_data() to authenticated;

-- Borra el perfil (cascada a todos sus datos) y la cuenta de auth
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  delete from public.profiles where id = uid;

  -- Delete user from auth; cascade via trigger if present, otherwise orphans are removed here.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;