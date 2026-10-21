-- Owner management reuses the existing, explicitly granted admin role.
-- No owner/teacher account is created or approved by this migration.
begin;
create or replace function public.inneru_is_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p join auth.users u on u.id=p.id
  where p.id=auth.uid() and p.role='admin' and u.email_confirmed_at is not null);
$$;
revoke all on function public.inneru_is_owner() from public,anon;
grant execute on function public.inneru_is_owner() to authenticated;

-- Retain the same six class records and one-teacher-per-class model. A class can
-- temporarily have no teacher. The owner RPC updates derived student links in
-- the same transaction; class membership, work and mission settings never move.
do $$ declare c record;begin
 for c in select conname from pg_constraint where conrelid='public.school_classes'::regclass
  and contype='c' and pg_get_constraintdef(oid) like '%teacher_email%'
  and pg_get_constraintdef(oid) like '%sf.alhammadi@moe.sch.ae%'
  and pg_get_constraintdef(oid) like '%riham.hassan@moe.sch.ae%' loop
  execute format('alter table public.school_classes drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.school_classes alter column teacher_email drop not null;
alter table public.profiles drop constraint if exists student_class_assignment;
alter table public.profiles add constraint student_class_assignment check(
 (class_code is null and assigned_teacher_email is null and assigned_teacher_id is null)
 or (role='student' and class_code is not null and (assigned_teacher_email is not null or assigned_teacher_id is null)));
alter table public.profiles drop constraint if exists student_class_teacher;
alter table public.profiles add constraint student_class_teacher foreign key(class_code,assigned_teacher_email)
 references public.school_classes(code,teacher_email) deferrable initially deferred;
alter table public.profiles drop constraint if exists student_school_class;
alter table public.profiles add constraint student_school_class foreign key(class_code) references public.school_classes(code);

create or replace function public.inneru_profile_class() returns trigger language plpgsql security definer set search_path='' as $$
declare choice text;
begin
 if tg_op='INSERT' and new.role='student' then
  select nullif(u.raw_user_meta_data->>'class_code','') into choice from auth.users u where u.id=new.id;
  new.class_code:=coalesce(new.class_code,choice);
 end if;
 if new.role<>'student' then new.class_code:=null;end if;
 if new.class_code is null then new.assigned_teacher_email:=null;new.assigned_teacher_id:=null;
 else
  select c.teacher_email,t.teacher_id into new.assigned_teacher_email,new.assigned_teacher_id
   from public.school_classes c left join public.school_teachers t on t.email=c.teacher_email where c.code=new.class_code;
  if not found then raise invalid_parameter_value using message='Select one of the six school classes.';end if;
 end if;
 return new;
end $$;
revoke all on function public.inneru_profile_class() from public,anon,authenticated;

-- No pre-existing staffing audit exists. Keep immutable before/after records;
-- account deletion must not erase the administrative history.
create table if not exists public.staffing_audit(
 id uuid primary key default gen_random_uuid(),actor_id uuid not null,actor_email text not null,
 action text not null check(action in ('assignment','approval')),target_id uuid,
 before_value jsonb not null,after_value jsonb not null,created_at timestamptz not null default now()
);
alter table public.staffing_audit enable row level security;
revoke all on public.staffing_audit from public,anon,authenticated;

create or replace function public.inneru_owner_staffing() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.inneru_is_owner() then raise insufficient_privilege;end if;
 return jsonb_build_object(
  'classes',coalesce((select jsonb_agg(jsonb_build_object('code',c.code,'teacherEmail',c.teacher_email,
   'teacherId',t.teacher_id,'teacherName',t.display_name,'approved',coalesce(p.role in ('teacher','admin'),false)) order by c.code)
   from public.school_classes c left join public.school_teachers t on t.email=c.teacher_email
   left join public.profiles p on p.id=t.teacher_id),'[]'::jsonb),
  'teachers',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'email',lower(trim(u.email)),
   'verified',u.email_confirmed_at is not null,'approved',p.role in ('teacher','admin')) order by lower(u.email),p.id)
   from public.profiles p join auth.users u on u.id=p.id
   where p.role in ('teacher','admin') or (p.role='student' and p.requested_role='teacher')),'[]'::jsonb),
  'audit',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc,a.id)
   from (select * from public.staffing_audit order by created_at desc,id limit 50) a),'[]'::jsonb));
end $$;

create or replace function public.inneru_owner_assign(p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb;c public.school_classes;target public.profiles;target_email text;actor_email text;old_id uuid;
begin
 if not public.inneru_is_owner() then raise insufficient_privilege;end if;
 -- Serialize owner changes and approvals; stale screens must explicitly refresh.
 perform pg_advisory_xact_lock(hashtextextended('inneru-owner-staffing',0));
 if p_changes is null or jsonb_typeof(p_changes)<>'array' then raise invalid_parameter_value;end if;
 if jsonb_array_length(p_changes) not between 1 and 6 then raise invalid_parameter_value;end if;
 if exists(select 1 from jsonb_array_elements(p_changes) x where jsonb_typeof(x)<>'object'
  or not(x ?& array['classCode','teacherId','expectedTeacherEmail'])
  or (select count(*) from jsonb_object_keys(x))<>3
  or jsonb_typeof(x->'classCode')<>'string' or jsonb_typeof(x->'teacherId') not in ('string','null')
  or jsonb_typeof(x->'expectedTeacherEmail') not in ('string','null')) then raise invalid_parameter_value;end if;
 if (select count(distinct x->>'classCode') from jsonb_array_elements(p_changes) x)<>jsonb_array_length(p_changes) then raise invalid_parameter_value;end if;
 select email into actor_email from auth.users where id=auth.uid();
 for item in select value from jsonb_array_elements(p_changes) order by value->>'classCode' loop
  select * into c from public.school_classes where code=item->>'classCode' for update;
  if not found then raise invalid_parameter_value;end if;
  if c.teacher_email is distinct from (item->>'expectedTeacherEmail') then raise serialization_failure using message='assignment_conflict';end if;
  select teacher_id into old_id from public.school_teachers where email=c.teacher_email;
  target_email:=null;target:=null;
  if item->>'teacherId' is not null then
   if (item->>'teacherId')!~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then raise invalid_parameter_value;end if;
   select p.* into target from public.profiles p join auth.users u on u.id=p.id
    where p.id=(item->>'teacherId')::uuid and u.email_confirmed_at is not null
    and (p.role in ('teacher','admin') or (p.role='student' and p.requested_role='teacher')) for update of p;
   if not found then raise invalid_parameter_value;end if;
   select lower(trim(email)) into target_email from auth.users where id=target.id;
   if (select count(*) from auth.users u where lower(trim(u.email))=target_email and u.email_confirmed_at is not null)<>1 then raise invalid_parameter_value;end if;
   insert into public.school_teachers(email,display_name,teacher_id) values(target_email,target.display_name,target.id)
    on conflict(email) do update set display_name=excluded.display_name,teacher_id=excluded.teacher_id;
  end if;
  if c.teacher_email is not distinct from target_email then continue;end if;
  update public.school_classes set teacher_email=target_email where code=c.code;
  update public.profiles set assigned_teacher_email=target_email,updated_at=now() where role='student' and class_code=c.code;
  insert into public.staffing_audit(actor_id,actor_email,action,target_id,before_value,after_value)
   values(auth.uid(),actor_email,'assignment',target.id,
    jsonb_build_object('classCode',c.code,'teacherEmail',c.teacher_email,'teacherId',old_id),
    jsonb_build_object('classCode',c.code,'teacherEmail',target_email,'teacherId',target.id));
 end loop;
 return public.inneru_owner_staffing();
end $$;

-- Reuse the existing verified-email approval helper. It remains unavailable to
-- authenticated JWTs directly. This wrapper cannot edit or demote an admin.
create or replace function public.inneru_owner_approve(p_teacher uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.profiles;target_email text;actor_email text;
begin
 if not public.inneru_is_owner() then raise insufficient_privilege;end if;
 perform pg_advisory_xact_lock(hashtextextended('inneru-owner-staffing',0));
 select * into p from public.profiles where id=p_teacher for update;
 if not found or not(p.role='teacher' or (p.role='student' and p.requested_role='teacher')) then raise invalid_parameter_value;end if;
 select u.email into target_email from auth.users u where u.id=p_teacher and u.email_confirmed_at is not null;
 if target_email is null then raise invalid_parameter_value;end if;
 if (select count(*) from auth.users u where lower(trim(u.email))=lower(trim(target_email)) and u.email_confirmed_at is not null)<>1 then raise invalid_parameter_value;end if;
 if p.role='teacher' then return public.inneru_owner_staffing();end if;
 if public.inneru_approve_teacher(target_email) is distinct from p_teacher then raise invalid_parameter_value;end if;
 select u.email into actor_email from auth.users u where u.id=auth.uid();
 insert into public.staffing_audit(actor_id,actor_email,action,target_id,before_value,after_value)
  values(auth.uid(),actor_email,'approval',p_teacher,jsonb_build_object('role',p.role),jsonb_build_object('role','teacher'));
 return public.inneru_owner_staffing();
end $$;
revoke all on function public.inneru_owner_staffing(),public.inneru_owner_assign(jsonb),public.inneru_owner_approve(uuid) from public,anon;
grant execute on function public.inneru_owner_staffing(),public.inneru_owner_assign(jsonb),public.inneru_owner_approve(uuid) to authenticated;
insert into public.inneru_schema(version) values(8) on conflict do nothing;
notify pgrst,'reload schema';
commit;
