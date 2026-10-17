begin;
create or replace function public.inneru_state() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise insufficient_privilege; end if;
 select jsonb_build_object('schemaVersion',1,'profile',jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,'role',p.role),'progress',jsonb_build_object('snapshot',s.snapshot,'revision',s.revision,'updatedAt',s.updated_at),'classes',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name)) from public.enrollments e join public.classrooms c on c.id=e.class_id where e.student_id=uid),'[]'::jsonb)) into result from public.profiles p join public.student_progress s on s.user_id=p.id where p.id=uid;
 if result is null then raise exception 'profile_missing'; end if;
 return result;
end $$;

create or replace function public.inneru_save(p_snapshot jsonb,p_revision bigint,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.student_progress; snap jsonb; item jsonb; world record; b record; completed jsonb; whole_done jsonb; total integer; earned boolean; is_key boolean; field text; rid text;
begin
 if uid is null then raise insufficient_privilege; end if;
 if p_request_id is null or p_revision is null or p_revision<0 or p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or octet_length(p_snapshot::text)>3000000 or jsonb_typeof(p_snapshot->'rewards') is distinct from 'array' or jsonb_typeof(p_snapshot->'done') is distinct from 'array' or jsonb_array_length(p_snapshot->'rewards')>10000 then raise invalid_parameter_value; end if;
 select * into previous from public.student_progress where user_id=uid for update;
 if not found then raise exception 'profile_missing'; end if;
 if previous.last_request_id=p_request_id then return jsonb_build_object('revision',previous.revision,'snapshot',previous.snapshot,'updatedAt',previous.updated_at); end if;
 if previous.revision<>p_revision then raise exception 'revision_conflict' using errcode='P0001'; end if;
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

create or replace function public.inneru_create_class(p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.classrooms;
begin
 if not public.inneru_is_teacher() then raise insufficient_privilege; end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 80 then raise invalid_parameter_value; end if;
 insert into public.classrooms(teacher_id,name) values(auth.uid(),trim(p_name)) returning * into c;
 return to_jsonb(c);
end $$;
create or replace function public.inneru_join_class(p_code text) returns jsonb language plpgsql security definer set search_path='' as $$
declare c public.classrooms;
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and role='student') then raise insufficient_privilege; end if;
 select * into c from public.classrooms where join_code=p_code;
 if not found then raise invalid_parameter_value; end if;
 insert into public.enrollments(class_id,student_id) values(c.id,auth.uid()) on conflict do nothing;
 return jsonb_build_object('id',c.id,'name',c.name);
end $$;
create or replace function public.inneru_classroom() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() then raise insufficient_privilege; end if;
 return jsonb_build_object('classes',coalesce((select jsonb_agg(to_jsonb(c)) from public.classrooms c where teacher_id=auth.uid()),'[]'),'students',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'avatarId',p.avatar_id,'snapshot',s.snapshot,'revision',s.revision,'updatedAt',s.updated_at,'group',(select string_agg(distinct c.name,', ' order by c.name) from public.enrollments e join public.classrooms c on c.id=e.class_id where e.student_id=p.id and c.teacher_id=auth.uid()),'feedback',coalesce((select jsonb_object_agg(f.response_id,jsonb_build_object('note',f.note,'reviewedAt',case when f.reviewed then f.updated_at end,'submissionAt',f.submission_at)) from public.teacher_feedback f where f.student_id=p.id and f.teacher_id=auth.uid()),'{}'))) from public.profiles p join public.student_progress s on s.user_id=p.id where p.role='student' and p.id<>auth.uid() and public.inneru_can_read(p.id)),'[]'));
end $$;
create or replace function public.inneru_feedback(p_student uuid,p_response text,p_note text,p_reviewed boolean,p_submission_at timestamptz) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.inneru_is_teacher() or not public.inneru_can_read(p_student) or p_student=auth.uid() then raise insufficient_privilege; end if;
 if p_note is null or char_length(p_note)>6000 or p_submission_at is null or not exists(select 1 from public.learning_responses where user_id=p_student and response_id=p_response and submitted_at=p_submission_at) then raise invalid_parameter_value; end if;
 insert into public.teacher_feedback values(auth.uid(),p_student,p_response,p_note,p_reviewed,p_submission_at,now()) on conflict(teacher_id,student_id,response_id) do update set note=excluded.note,reviewed=excluded.reviewed,submission_at=excluded.submission_at,updated_at=now();
 return jsonb_build_object('saved',true);
end $$;
revoke all on function public.inneru_state(),public.inneru_save(jsonb,bigint,uuid),public.inneru_create_class(text),public.inneru_join_class(text),public.inneru_classroom(),public.inneru_feedback(uuid,text,text,boolean,timestamptz) from public,anon;
grant execute on function public.inneru_state(),public.inneru_save(jsonb,bigint,uuid),public.inneru_create_class(text),public.inneru_join_class(text),public.inneru_classroom(),public.inneru_feedback(uuid,text,text,boolean,timestamptz) to authenticated;
insert into public.inneru_schema(version) values(1) on conflict do nothing;
notify pgrst,'reload schema';
commit;
