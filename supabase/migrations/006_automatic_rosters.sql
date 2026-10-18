-- School class selection is the only source of classroom membership.
-- Apply after 005, or run the complete supabase/setup.sql installer.
-- Retain legacy tables for recovery; they no longer grant classroom access.
begin;
create or replace function public.inneru_can_read(p_student uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_student=auth.uid() or (public.inneru_is_teacher() and exists(
  select 1 from public.profiles p
  join public.school_classes c on c.code=p.class_code and c.teacher_email=p.assigned_teacher_email
  join public.school_teachers t on t.email=c.teacher_email and t.teacher_id=p.assigned_teacher_id
  where p.id=p_student and p.role='student' and t.teacher_id=auth.uid()));
$$;

-- Both the API and direct database calls reject retired invitation workflows.
create or replace function public.inneru_join_class(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 raise insufficient_privilege using message='Select your school class. Class assignments are automatic.';
end $$;
create or replace function public.inneru_create_class(p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 raise insufficient_privilege using message='School classes are assigned by the school owner.';
end $$;
revoke all on function public.inneru_join_class(text),public.inneru_create_class(text) from public,anon,authenticated;
revoke all on public.classrooms,public.enrollments from public,anon,authenticated;

create or replace function public.inneru_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();result jsonb;
begin
 if uid is null then raise insufficient_privilege; end if;
 select jsonb_build_object('schemaVersion',1,'assignmentVersion',6,
  'profile',jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,'role',p.role,
   'classCode',p.class_code,'assignedTeacher',case when p.class_code is not null then jsonb_build_object('id',p.assigned_teacher_id,
    'email',p.assigned_teacher_email,'name',t.display_name,'pending',p.assigned_teacher_id is null) end),
  'progress',jsonb_build_object('snapshot',s.snapshot,'revision',coalesce(s.revision,0),'updatedAt',s.updated_at),
  'classes',case when p.class_code is not null then jsonb_build_array(jsonb_build_object('id',p.class_code,'name',p.class_code,'schoolClass',true)) else '[]'::jsonb end)
 into result from public.profiles p left join public.student_progress s on s.user_id=p.id
 left join public.school_teachers t on t.email=p.assigned_teacher_email where p.id=uid;
 if result is null then raise exception 'profile_missing'; end if;
 return result;
end $$;

create or replace function public.inneru_classroom() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() then raise insufficient_privilege; end if;
 return jsonb_build_object('assignmentVersion',6,
  'classes',coalesce((select jsonb_agg(jsonb_build_object('id',c.code,'name',c.code,'schoolClass',true,
   'studentCount',(select count(*) from public.profiles p where p.class_code=c.code and p.role='student' and public.inneru_can_read(p.id))) order by c.code)
   from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where t.teacher_id=auth.uid()),'[]'::jsonb),
  'students',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,
   'classCode',p.class_code,'group',p.class_code,'snapshot',s.snapshot,'revision',coalesce(s.revision,0),'updatedAt',s.updated_at,
   'feedback',coalesce((select jsonb_object_agg(f.response_id,jsonb_build_object('note',f.note,'reviewedAt',case when f.reviewed then f.updated_at end,'submissionAt',f.submission_at))
    from public.teacher_feedback f where f.student_id=p.id and f.teacher_id=auth.uid()),'{}'::jsonb)) order by p.class_code,p.display_name,p.id)
   from public.profiles p left join public.student_progress s on s.user_id=p.id
   where p.role='student' and p.id<>auth.uid() and public.inneru_can_read(p.id)),'[]'::jsonb));
end $$;

insert into public.inneru_schema(version) values(6) on conflict do nothing;
notify pgrst,'reload schema';
commit;
