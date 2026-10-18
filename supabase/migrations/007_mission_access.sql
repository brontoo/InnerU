-- Class-scoped teacher controls and server-validated mission progression.
-- Apply after 006, or use the full setup.sql installer. Existing progress is retained.
begin;
create table if not exists public.class_mission_settings (
 class_code text not null references public.school_classes(code),
 system_id text not null references public.systems(id),
 mission_number integer not null check(mission_number between 0 and 30),
 unlocked boolean not null default false,
 updated_by uuid references public.profiles(id) on delete set null,
 updated_at timestamptz not null default now(),
 primary key(class_code,system_id,mission_number)
);
alter table public.class_mission_settings alter column unlocked set default false;
alter table public.class_mission_settings enable row level security;
revoke all on public.class_mission_settings from public,anon,authenticated;
grant select on public.class_mission_settings to authenticated;
create or replace function public.inneru_can_view_mission_settings(p_class text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='student' and p.class_code=p_class)
 or (public.inneru_is_teacher() and exists(select 1 from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where c.code=p_class and t.teacher_id=auth.uid()));
$$;
revoke all on function public.inneru_can_view_mission_settings(text) from public,anon;
grant execute on function public.inneru_can_view_mission_settings(text) to authenticated;
drop policy if exists mission_settings_read on public.class_mission_settings;
create policy mission_settings_read on public.class_mission_settings for select to authenticated using(public.inneru_can_view_mission_settings(class_code));

-- Internal helper: callers cannot supply another student's identity or a forged baseline.
create or replace function public.inneru_mission_gate(p_student uuid,p_mission text,p_before jsonb default null)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare p public.profiles;m public.missions;snap jsonb;done jsonb;teacher_open boolean;finished boolean;reason text:='';
begin
 select * into p from public.profiles where id=p_student;
 select * into m from public.missions where id=p_mission;
 if p.id is null or p.role<>'student' or p.class_code is null or m.id is null then
  return jsonb_build_object('allowed',false,'reason','Choose your school class before opening missions.','code','class_required');
 end if;
 select coalesce((select unlocked from public.class_mission_settings where class_code=p.class_code and system_id=m.system_id and mission_number=0),false)
  and coalesce((select unlocked from public.class_mission_settings where class_code=p.class_code and system_id=m.system_id and mission_number=m.number),true) into teacher_open;
 if p_before is null then select snapshot into snap from public.student_progress where user_id=p.id;else snap:=p_before;end if;
 done:=case when m.system_id='skeletal' then snap->'done' else snap->m.system_id->'done' end;
 if jsonb_typeof(done) is distinct from 'array' then done:='[]'::jsonb;end if;
 finished:=case when m.is_final then case when m.system_id in ('skeletal','muscle') then done @> '[8]'::jsonb else coalesce(snap->m.system_id->>'mastery','false')='true' end else done @> jsonb_build_array(m.number) end;
 if not teacher_open then reason:='Your teacher has locked this mission.';
 elsif exists(select 1 from public.missions prev where prev.system_id=m.system_id and prev.number<m.number and not prev.is_final and not done @> jsonb_build_array(prev.number)) then reason:='Complete the previous mission first.';end if;
 return jsonb_build_object('allowed',reason='','reason',reason,'code',case when not teacher_open then 'teacher_locked' when reason<>'' then 'previous_required' else 'available' end,
  'teacherUnlocked',teacher_open,'completed',finished,'missionId',m.id);
end $$;

create or replace function public.inneru_mission_catalog() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare uid uuid:=auth.uid();role_name text;
begin
 select role into role_name from public.profiles where id=uid;
 if role_name is null then raise insufficient_privilege;end if;
 return jsonb_build_object('accessVersion',7,'role',role_name,'systems',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'order',s.sort_order,
  'missions',(select jsonb_agg(jsonb_build_object('id',m.id,'number',m.number,'title',m.title,'isFinal',m.is_final)||case when role_name='student' then public.inneru_mission_gate(uid,m.id) else jsonb_build_object('allowed',true,'previewOnly',true) end order by m.number) from public.missions m where m.system_id=s.id)) order by s.sort_order) from public.systems s),'[]'::jsonb));
end $$;

create or replace function public.inneru_authorize_mission(p_system text,p_number integer,p_preview boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare m public.missions;role_name text;
begin
 select role into role_name from public.profiles where id=auth.uid();
 if role_name is null then raise insufficient_privilege;end if;
 select * into m from public.missions where system_id=p_system and number=p_number;
 if m.id is null then raise invalid_parameter_value;end if;
 if p_preview then
  if not public.inneru_is_teacher() then raise insufficient_privilege using message='teacher_preview_only';end if;
  return jsonb_build_object('allowed',true,'previewOnly',true,'missionId',m.id,'accessVersion',7);
 end if;
 if role_name<>'student' then raise insufficient_privilege;end if;
 return public.inneru_mission_gate(auth.uid(),m.id)||jsonb_build_object('accessVersion',7);
end $$;

create or replace function public.inneru_mission_controls() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() then raise insufficient_privilege;end if;
 return jsonb_build_object('accessVersion',7,'classes',coalesce((select jsonb_agg(jsonb_build_object('code',c.code,'systems',
  (select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'unlocked',coalesce((select unlocked from public.class_mission_settings where class_code=c.code and system_id=s.id and mission_number=0),false),
   'missions',(select jsonb_agg(jsonb_build_object('id',m.id,'number',m.number,'title',m.title,'isFinal',m.is_final,
    'unlocked',coalesce((select unlocked from public.class_mission_settings where class_code=c.code and system_id=s.id and mission_number=m.number),true)) order by m.number)
    from public.missions m where m.system_id=s.id)) order by s.sort_order) from public.systems s)) order by c.code)
   from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where t.teacher_id=auth.uid()),'[]'::jsonb));
end $$;

create or replace function public.inneru_set_mission_control(p_class text,p_system text,p_number integer,p_unlocked boolean)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() or not exists(select 1 from public.school_classes c join public.school_teachers t on t.email=c.teacher_email where c.code=p_class and t.teacher_id=auth.uid()) then raise insufficient_privilege;end if;
 if p_unlocked is null or p_number is null or not exists(select 1 from public.systems where id=p_system) or (p_number<>0 and not exists(select 1 from public.missions where system_id=p_system and number=p_number)) then raise invalid_parameter_value;end if;
 perform pg_advisory_xact_lock(hashtextextended(p_class||':'||p_system,0));
 insert into public.class_mission_settings(class_code,system_id,mission_number,unlocked,updated_by) values(p_class,p_system,p_number,p_unlocked,auth.uid())
 on conflict(class_code,system_id,mission_number) do update set unlocked=excluded.unlocked,updated_by=excluded.updated_by,updated_at=now();
 return public.inneru_mission_controls();
end $$;

-- Bind every system task to its existing mission. Extra portal activities stay separate.
alter table public.reward_definitions add column if not exists mission_id text references public.missions(id);
update public.reward_definitions r set mission_id=m.id from public.missions m where m.required_rewards ? r.id;
update public.reward_definitions r set mission_id=m.id from public.missions m where r.system_id=m.system_id and m.number=(case
 when r.system_id='skeletal' then case when r.id ~ '^case[0-3]$' then 7 when r.id='boss' then 8 else null end
 when r.system_id='muscle' then case when r.id ~ '^muscle:(m|complete-)[0-9]' then substring(r.id from '^muscle:(?:m|complete-)([0-9]+)')::integer else 7 end
 when r.system_id in ('integumentary','respiratory','excretory') then coalesce(substring(r.id from '^[a-z]+-(?:mission-)?([0-9]+)')::integer,7)
 when r.system_id='circ' then coalesce(substring(r.id from '^circ-(?:m|mission-)([0-9]+)')::integer,8) end) and r.mission_id is null;

create or replace function public.inneru_validate_mission_save(p_snapshot jsonb,p_before jsonb) returns void language plpgsql security definer set search_path='' as $$
declare m public.missions;p public.profiles;old_done jsonb;new_done jsonb;fresh boolean;gate jsonb;
begin
 select * into p from public.profiles where id=auth.uid() and role='student';
 if p.id is null or p.class_code is null then raise insufficient_privilege using message='class_required';end if;
 for m in select mm.* from public.missions mm join public.systems s on s.id=mm.system_id order by s.sort_order,mm.number loop
  old_done:=case when m.system_id='skeletal' then p_before->'done' else p_before->m.system_id->'done' end;
  new_done:=case when m.system_id='skeletal' then p_snapshot->'done' else p_snapshot->m.system_id->'done' end;
  fresh:=exists(select 1 from public.reward_definitions r where r.mission_id=m.id and coalesce(p_snapshot->'rewards','[]') ? r.id and not coalesce(p_before->'rewards','[]') ? r.id);
  if not m.is_final then fresh:=fresh or (coalesce(new_done,'[]') @> jsonb_build_array(m.number) and not coalesce(old_done,'[]') @> jsonb_build_array(m.number));
  elsif m.system_id in ('skeletal','muscle') then fresh:=fresh or (coalesce(new_done,'[]') @> '[8]'::jsonb and not coalesce(old_done,'[]') @> '[8]'::jsonb);
  else fresh:=fresh or (coalesce(p_snapshot->m.system_id->>'mastery','false')='true' and coalesce(p_before->m.system_id->>'mastery','false')<>'true');end if;
  fresh:=fresh or exists(select 1 from jsonb_array_elements(coalesce(p_snapshot->'assessment'->'responses','[]')) a where a->>'system'=m.system_id
   and ((a->>'mission' ~ '^[0-9]+$' and (a->>'mission')::integer=m.number) or (m.is_final and a->>'kind'='final'))
   and not exists(select 1 from jsonb_array_elements(coalesce(p_before->'assessment'->'responses','[]')) old_a where old_a=a));
  if fresh then
   perform pg_advisory_xact_lock_shared(hashtextextended(p.class_code||':'||m.system_id,0));
   gate:=public.inneru_mission_gate(p.id,m.id,coalesce(p_before,'{}'::jsonb));
   if not (gate->>'allowed')::boolean then raise insufficient_privilege using message=gate->>'code';end if;
  end if;
 end loop;
end $$;

create or replace function public.inneru_save(p_snapshot jsonb,p_revision bigint,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.student_progress; snap jsonb; item jsonb; world record; b record; completed jsonb; whole_done jsonb; total integer; earned boolean; is_key boolean; field text; rid text;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise insufficient_privilege; end if;
 if p_request_id is null or p_revision is null or p_revision<0 or p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or octet_length(p_snapshot::text)>3000000 or jsonb_typeof(p_snapshot->'rewards') is distinct from 'array' or jsonb_typeof(p_snapshot->'done') is distinct from 'array' or jsonb_array_length(p_snapshot->'rewards')>10000 then raise invalid_parameter_value; end if;
 select * into previous from public.student_progress where user_id=uid for update;
 if not found then raise exception 'profile_missing'; end if;
 if previous.last_request_id=p_request_id then return jsonb_build_object('revision',previous.revision,'snapshot',previous.snapshot,'updatedAt',previous.updated_at); end if;
 if previous.revision<>p_revision then raise exception 'revision_conflict' using errcode='P0001'; end if;
 perform public.inneru_validate_mission_save(p_snapshot,previous.snapshot);
 select coalesce(jsonb_object_agg(key,value),'{}') into snap from jsonb_each(p_snapshot) where key in ('name','level','motion','done','rewards','weak','integumentary','muscle','respiratory','circ','excretory','capstone','learning','assessment','review','habit','glossary','learnerId');
 snap:=jsonb_set(snap,'{name}',to_jsonb(coalesce(nullif(left(snap->>'name',24),''),'Explorer')));
 -- Unknown credits cannot mint points. One row per completed task prevents duplicates.
 delete from public.xp_events where user_id=uid and reward_id not in(select jsonb_array_elements_text(snap->'rewards'));
 insert into public.xp_events(user_id,reward_id,xp)
 select uid,r.id,r.xp from public.reward_definitions r where (snap->'rewards')?r.id on conflict(user_id,reward_id) do nothing;
 insert into public.xp_events(user_id,reward_id,xp)
 select uid,v,10 from (select distinct jsonb_array_elements_text(snap->'rewards') as v) d where v ~ '^daily-[0-9]{4}-[0-9]{2}-[0-9]{2}$' and substring(v from 7)=to_char(current_date,'YYYY-MM-DD') on conflict do nothing;
 select coalesce(sum(xp),0)::integer into total from public.xp_events where user_id=uid;
 snap:=jsonb_set(snap,'{xp}',to_jsonb(total));
 -- Keep only accepted task IDs; progress is a student activity record, not a proctored grade.
 snap:=jsonb_set(snap,'{rewards}',coalesce((select jsonb_agg(reward_id order by reward_id) from public.xp_events where user_id=uid),'[]'));
 if jsonb_typeof(snap->'learning')='object' and jsonb_typeof(snap->'learning'->'entries')='array' then
  snap:=jsonb_set(snap,'{learning,entries}',coalesce((select jsonb_agg(entry||jsonb_build_object('xp',e.xp)) from (select distinct on (value->>'id') value as entry from jsonb_array_elements(snap->'learning'->'entries')) d join public.xp_events e on e.user_id=uid and e.reward_id=d.entry->>'id'),'[]'));
 end if;
 for world in select * from public.systems order by sort_order loop
  field:=world.id;
  whole_done:=case when field='skeletal' then snap->'done' else snap->field->'done' end;
  if jsonb_typeof(whole_done) is distinct from 'array' then whole_done:='[]'; end if;
  select coalesce(jsonb_agg(n order by n),'[]') into completed from(select distinct value::integer as n from jsonb_array_elements(whole_done) where jsonb_typeof(value)='number' and value::text ~ '^[0-9]+$' and value::integer between 1 and world.mission_count and exists(select 1 from public.missions m where m.system_id=field and m.number=value::integer and (snap->'rewards') @> m.required_rewards)) d;
  is_key:=jsonb_array_length(completed)=world.mission_count and case when field='skeletal' then (whole_done @> '[8]') and (snap->'rewards')?'boss' when field='muscle' then (whole_done @> '[8]') and (snap->'rewards')?'muscle:complete-8' else coalesce(snap->field->>'mastery','false')='true' and (snap->'rewards')?(case field when 'integumentary' then 'integ-key' when 'respiratory' then 'resp-key' when 'excretory' then 'exc-key' when 'circ' then 'circ-mastery' end) end;
  is_key:=is_key and exists(select 1 from public.missions m where m.system_id=field and m.is_final and (snap->'rewards') @> m.required_rewards);
  insert into public.system_progress values(uid,field,completed,is_key,now()) on conflict(user_id,system_id) do update set completed_missions=excluded.completed_missions,mastery=excluded.mastery,updated_at=now();
  if field='skeletal' then snap:=jsonb_set(snap,'{done}',completed||case when is_key then '[8]'::jsonb else '[]'::jsonb end);
  else
   if jsonb_typeof(snap->field) is distinct from 'object' then snap:=jsonb_set(snap,array[field],'{}'); end if;
   snap:=jsonb_set(snap,array[field,'done'],completed||case when field='muscle' and is_key then '[8]'::jsonb else '[]'::jsonb end);
   if field<>'muscle' then snap:=jsonb_set(snap,array[field,'mastery'],to_jsonb(is_key)); end if;
  end if;
 end loop;
 -- Replace submitted answers transactionally. Feedback for removed answers cascades.
 if snap ? 'assessment' and (jsonb_typeof(snap->'assessment'->'responses') is distinct from 'array' or jsonb_array_length(snap->'assessment'->'responses')>600) then raise invalid_parameter_value; end if;
 delete from public.learning_responses where user_id=uid and response_id not in(select value->>'id' from jsonb_array_elements(coalesce(snap->'assessment'->'responses','[]')));
 for item in select value from jsonb_array_elements(coalesce(snap->'assessment'->'responses','[]')) loop
  if char_length(item->>'id') not between 1 and 180 or item->>'id' is null or char_length(item->>'answer')>20000 or item->>'at' is null then raise invalid_parameter_value; end if;
  insert into public.learning_responses values(uid,item->>'id',case when exists(select 1 from public.systems where id=item->>'system') then item->>'system' end,item,(item->>'at')::timestamptz)
  on conflict(user_id,response_id) do update set response=excluded.response,system_id=excluded.system_id,submitted_at=excluded.submitted_at;
 end loop;
 for b in select * from public.badges loop
  earned:=false;
  if b.kind='mission' then select completed_missions @> jsonb_build_array(substring(b.id from '-mission-([0-9]+)$')::integer) into earned from public.system_progress where user_id=uid and system_id=b.system_id;
  elsif b.kind='mastery' then select mastery into earned from public.system_progress where user_id=uid and system_id=b.system_id;
  elsif b.id='medical' then earned:=(snap->'rewards') ?& array['case0','case1','case2','case3'];
  elsif b.id='detective' then earned:=(snap->'rewards') ?& array['detective2-touch','detective2-spine','detective2-wave','detective2-air','detective2-signal','detective2-sample'];
  elsif b.id='connection' then earned:=(snap->'rewards')?'connection';
  elsif b.id='capstone' then earned:=(snap->'rewards')?'capstone' and (select count(*)=6 from public.system_progress where user_id=uid and mastery);
  end if;
  if coalesce(earned,false) then insert into public.student_badges(user_id,badge_id) values(uid,b.id) on conflict do nothing;
  else delete from public.student_badges where user_id=uid and badge_id=b.id;
  end if;
 end loop;
 update public.profiles set display_name=snap->>'name',updated_at=now() where id=uid;
 update public.student_progress set snapshot=snap,revision=revision+1,last_request_id=p_request_id,total_xp=total,updated_at=now() where user_id=uid returning * into previous;
 return jsonb_build_object('revision',previous.revision,'snapshot',previous.snapshot,'updatedAt',previous.updated_at);
end $$;

revoke all on function public.inneru_mission_gate(uuid,text,jsonb),public.inneru_validate_mission_save(jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.inneru_mission_catalog(),public.inneru_authorize_mission(text,integer,boolean),public.inneru_mission_controls(),public.inneru_set_mission_control(text,text,integer,boolean) from public,anon;
grant execute on function public.inneru_mission_catalog(),public.inneru_authorize_mission(text,integer,boolean),public.inneru_mission_controls(),public.inneru_set_mission_control(text,text,integer,boolean) to authenticated;
insert into public.inneru_schema(version) values(7) on conflict do nothing;
notify pgrst,'reload schema';
commit;
