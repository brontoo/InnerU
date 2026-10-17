-- Fixed school classes. No Auth users or teacher profiles are created here.
begin;
create table if not exists public.school_teachers (
 email text primary key check(email=lower(trim(email))),
 display_name text not null,
 teacher_id uuid unique references public.profiles(id) on delete set null,
 unique(email,teacher_id)
);
insert into public.school_teachers(email,display_name) values
 ('sf.alhammadi@moe.sch.ae','Maryam'),('riham.hassan@moe.sch.ae','Riham')
on conflict(email) do update set display_name=excluded.display_name;
create table if not exists public.school_classes (
 code text primary key check(code in ('10G1','10G2','10G3','10G4','10G5','10G6')),
 teacher_email text not null references public.school_teachers(email),
 unique(code,teacher_email),
 check((code in ('10G1','10G2','10G3','10G4') and teacher_email='sf.alhammadi@moe.sch.ae')
    or (code in ('10G5','10G6') and teacher_email='riham.hassan@moe.sch.ae'))
);
insert into public.school_classes(code,teacher_email) values
 ('10G1','sf.alhammadi@moe.sch.ae'),('10G2','sf.alhammadi@moe.sch.ae'),
 ('10G3','sf.alhammadi@moe.sch.ae'),('10G4','sf.alhammadi@moe.sch.ae'),
 ('10G5','riham.hassan@moe.sch.ae'),('10G6','riham.hassan@moe.sch.ae')
on conflict(code) do nothing;
alter table public.profiles add column if not exists class_code text;
alter table public.profiles add column if not exists assigned_teacher_email text;
alter table public.profiles add column if not exists assigned_teacher_id uuid;
do $$ begin
 if not exists(select 1 from pg_constraint where conrelid='public.profiles'::regclass and conname='student_class_assignment') then
  alter table public.profiles add constraint student_class_assignment check(
   (class_code is null and assigned_teacher_email is null and assigned_teacher_id is null)
   or (class_code is not null and assigned_teacher_email is not null and role='student'));
  alter table public.profiles add constraint student_class_teacher foreign key(class_code,assigned_teacher_email)
   references public.school_classes(code,teacher_email);
  alter table public.profiles add constraint student_teacher_account foreign key(assigned_teacher_email,assigned_teacher_id)
   references public.school_teachers(email,teacher_id) on update cascade;
 end if;
end $$;
create index if not exists profiles_assigned_teacher_idx on public.profiles(assigned_teacher_id,class_code) where role='student';

-- Only the class is accepted. Derive both teacher fields inside the database.
-- Metadata is used only at profile creation: avatar/name changes cannot move a class.
create or replace function public.inneru_profile_class() returns trigger language plpgsql security definer set search_path='' as $$
declare choice text;
begin
 if tg_op='INSERT' and new.role='student' then
  select nullif(u.raw_user_meta_data->>'class_code','') into choice from auth.users u where u.id=new.id;
  new.class_code:=coalesce(new.class_code,choice);
 end if;
 if new.role<>'student' then new.class_code:=null; end if;
 if new.class_code is null then
  new.assigned_teacher_email:=null;new.assigned_teacher_id:=null;
 else
  select c.teacher_email,t.teacher_id into new.assigned_teacher_email,new.assigned_teacher_id
   from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where c.code=new.class_code;
  if not found then raise invalid_parameter_value using message='Select one of the six school classes.'; end if;
 end if;
 return new;
end $$;
drop trigger if exists inneru_profile_school_class on public.profiles;
create trigger inneru_profile_school_class before insert or update of role,class_code,assigned_teacher_email,assigned_teacher_id on public.profiles
 for each row execute function public.inneru_profile_class();

-- Verified Auth email links a real profile; the existing teacher approval flow is
-- unchanged. An unapproved account still cannot read any other learner's data.
create or replace function public.inneru_link_school_teachers() returns trigger language plpgsql security definer set search_path='' as $$
begin
 -- Release former links first, including when an account changes between two
 -- configured email addresses. This avoids transient unique-ID collisions.
 update public.school_teachers t set teacher_id=null
  where t.email in (lower(trim(new.email)),case when tg_op='UPDATE' then lower(trim(old.email)) end)
  and t.teacher_id is not null and t.teacher_id is distinct from
   (select p.id from auth.users u join public.profiles p on p.id=u.id where lower(trim(u.email))=t.email and u.email_confirmed_at is not null);
 update public.school_teachers t set teacher_id=(select p.id from auth.users u join public.profiles p on p.id=u.id
  where lower(trim(u.email))=t.email and u.email_confirmed_at is not null)
 where t.email in (lower(trim(new.email)),case when tg_op='UPDATE' then lower(trim(old.email)) end);
 -- A NULL (pending) foreign key is not an FK reference, so its first link
 -- needs an explicit update as well as ON UPDATE CASCADE for existing links.
 update public.profiles p set assigned_teacher_id=t.teacher_id,updated_at=now()
  from public.school_teachers t where p.assigned_teacher_email=t.email and p.assigned_teacher_id is distinct from t.teacher_id;
 return new;
end $$;
drop trigger if exists inneru_school_teacher_link on auth.users;
create trigger inneru_school_teacher_link after insert or update of email,email_confirmed_at on auth.users
 for each row execute function public.inneru_link_school_teachers();
-- Resolve teachers already registered; missing teachers remain NULL/pending.
update public.school_teachers t set teacher_id=(select p.id from auth.users u join public.profiles p on p.id=u.id
 where lower(trim(u.email))=t.email and u.email_confirmed_at is not null);
update public.profiles p set assigned_teacher_id=t.teacher_id,updated_at=now()
 from public.school_teachers t where p.assigned_teacher_email=t.email and p.assigned_teacher_id is distinct from t.teacher_id;
-- Preserve classes selected through the signup API during a code-first rollout.
-- Older accounts with no class metadata still choose at their next sign-in.
update public.profiles p set class_code=u.raw_user_meta_data->>'class_code',updated_at=now() from auth.users u
 where p.id=u.id and p.role='student' and p.class_code is null and coalesce(u.raw_user_meta_data->>'requested_role','student')<>'teacher'
 and exists(select 1 from public.school_classes where code=u.raw_user_meta_data->>'class_code');

alter table public.school_teachers enable row level security;
alter table public.school_classes enable row level security;
revoke all on public.school_teachers,public.school_classes from public,anon,authenticated;

-- School students cannot be exposed through a legacy enrollment at another
-- teacher. Legacy classes remain available to other existing teachers/accounts.
create or replace function public.inneru_can_read(p_student uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_student=auth.uid() or (public.inneru_is_teacher() and exists(
  select 1 from public.profiles p where p.id=p_student and p.role='student' and (
   (p.class_code is not null and p.assigned_teacher_id=auth.uid()) or
   (p.class_code is null and not exists(select 1 from public.school_teachers t where t.teacher_id=auth.uid())
    and exists(select 1 from public.enrollments e join public.classrooms c on c.id=e.class_id where e.student_id=p.id and c.teacher_id=auth.uid())))));
$$;
drop policy if exists enrollment_read on public.enrollments;
create policy enrollment_read on public.enrollments for select to authenticated using(student_id=auth.uid() or
 (public.inneru_is_teacher() and public.inneru_can_view_class(class_id) and public.inneru_can_read(student_id)));

create or replace function public.inneru_select_student_class(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles;
begin
 select * into p from public.profiles where id=auth.uid() and role='student' for update;
 if not found then raise insufficient_privilege; end if;
 if p_code is null or not exists(select 1 from public.school_classes where code=p_code) then raise invalid_parameter_value; end if;
 -- First selection only; the school owner can correct a mistake in profiles.
 if p.class_code is not null and p.class_code<>p_code then raise insufficient_privilege; end if;
 update public.profiles set class_code=p_code,updated_at=now() where id=p.id returning * into p;
 return jsonb_build_object('classCode',p.class_code,'assignedTeacher',jsonb_build_object('id',p.assigned_teacher_id,
  'email',p.assigned_teacher_email,'name',(select display_name from public.school_teachers where email=p.assigned_teacher_email),
  'pending',p.assigned_teacher_id is null));
end $$;

create or replace function public.inneru_join_class(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.classrooms;p public.profiles;
begin
 select * into p from public.profiles where id=auth.uid() and role='student';
 if not found then raise insufficient_privilege; end if;
 select * into c from public.classrooms where join_code=p_code;
 if not found then raise invalid_parameter_value; end if;
 if (p.class_code is not null and c.teacher_id is distinct from p.assigned_teacher_id)
  or (p.class_code is null and exists(select 1 from public.school_teachers where teacher_id=c.teacher_id)) then raise insufficient_privilege; end if;
 insert into public.enrollments(class_id,student_id) values(c.id,p.id) on conflict do nothing;
 return jsonb_build_object('id',c.id,'name',c.name);
end $$;

create or replace function public.inneru_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();result jsonb;
begin
 if uid is null then raise insufficient_privilege; end if;
 select jsonb_build_object('schemaVersion',1,'profile',jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,'role',p.role,
  'classCode',p.class_code,'assignedTeacher',case when p.class_code is not null then jsonb_build_object('id',p.assigned_teacher_id,
   'email',p.assigned_teacher_email,'name',t.display_name,'pending',p.assigned_teacher_id is null) end),
  'progress',jsonb_build_object('snapshot',s.snapshot,'revision',s.revision,'updatedAt',s.updated_at),
  'classes',case when p.class_code is not null then jsonb_build_array(jsonb_build_object('id',p.class_code,'name',p.class_code,'schoolClass',true)) else '[]'::jsonb end ||
   coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name)) from public.enrollments e join public.classrooms c on c.id=e.class_id
    where e.student_id=uid and (p.class_code is null or c.teacher_id=p.assigned_teacher_id)),'[]'::jsonb)) into result
 from public.profiles p join public.student_progress s on s.user_id=p.id left join public.school_teachers t on t.email=p.assigned_teacher_email where p.id=uid;
 if result is null then raise exception 'profile_missing'; end if;
 return result;
end $$;

create or replace function public.inneru_classroom() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() then raise insufficient_privilege; end if;
 return jsonb_build_object('classes',coalesce((select jsonb_agg(jsonb_build_object('id',c.code,'name',c.code,'schoolClass',true,
  'studentCount',(select count(*) from public.profiles p where p.class_code=c.code and p.role='student')) order by c.code)
  from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where t.teacher_id=auth.uid()),'[]') ||
  coalesce((select jsonb_agg(to_jsonb(c)) from public.classrooms c where teacher_id=auth.uid()),'[]'),
  'students',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,
   'classCode',p.class_code,'snapshot',s.snapshot,'revision',s.revision,'updatedAt',s.updated_at,
   'group',coalesce(p.class_code,(select string_agg(distinct c.name,', ' order by c.name) from public.enrollments e join public.classrooms c on c.id=e.class_id where e.student_id=p.id and c.teacher_id=auth.uid())),
   'feedback',coalesce((select jsonb_object_agg(f.response_id,jsonb_build_object('note',f.note,'reviewedAt',case when f.reviewed then f.updated_at end,'submissionAt',f.submission_at))
    from public.teacher_feedback f where f.student_id=p.id and f.teacher_id=auth.uid()),'{}')) order by p.class_code,p.display_name,p.id)
   from public.profiles p join public.student_progress s on s.user_id=p.id where p.role='student' and p.id<>auth.uid() and public.inneru_can_read(p.id)),'[]'));
end $$;

revoke all on function public.inneru_profile_class(),public.inneru_link_school_teachers() from public,anon,authenticated;
revoke all on function public.inneru_select_student_class(text) from public,anon;
grant execute on function public.inneru_select_student_class(text) to authenticated;
insert into public.inneru_schema(version) values(5) on conflict do nothing;
notify pgrst,'reload schema';
commit;
