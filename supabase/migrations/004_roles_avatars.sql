-- Dashboard roles and expanded avatars. Apply once as the Supabase project owner.
begin;
alter table public.profiles add column if not exists requested_role text not null default 'student' check(requested_role in ('student','teacher'));
alter table public.profiles drop constraint if exists profiles_avatar_id_check;
alter table public.profiles add constraint profiles_avatar_id_check check(avatar_id in ('nova','atlas','luna','neo','pip','ember','amira','sami','noor','finn','pebble','sage'));
create or replace function public.inneru_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,avatar_id,requested_role) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',24),''),'Explorer'),case when new.raw_user_meta_data->>'avatar_id' in ('nova','atlas','luna','neo','pip','ember','amira','sami','noor','finn','pebble','sage') then new.raw_user_meta_data->>'avatar_id' end,case when new.raw_user_meta_data->>'requested_role'='teacher' then 'teacher' else 'student' end)
 on conflict(id) do update set display_name=excluded.display_name,avatar_id=excluded.avatar_id,requested_role=case when public.profiles.role in ('teacher','admin') then 'teacher' else excluded.requested_role end,updated_at=now();
 insert into public.student_progress(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
update public.profiles p set requested_role=case when p.role in ('teacher','admin') or u.raw_user_meta_data->>'requested_role'='teacher' then 'teacher' else 'student' end,avatar_id=case when p.avatar_id is null and u.raw_user_meta_data->>'avatar_id' in ('nova','atlas','luna','neo','pip','ember','amira','sami','noor','finn','pebble','sage') then u.raw_user_meta_data->>'avatar_id' else p.avatar_id end from auth.users u where p.id=u.id;

-- Requesting access cannot approve it. The account owner must confirm the role.
create or replace function public.inneru_request_teacher_access() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 update auth.users set raw_user_meta_data=coalesce(raw_user_meta_data,'{}')||'{"requested_role":"teacher"}'::jsonb where id=auth.uid();
 update public.profiles set requested_role='teacher',updated_at=now() where id=auth.uid();
 return jsonb_build_object('requested',true);
end $$;
revoke all on function public.inneru_request_teacher_access() from public,anon;
grant execute on function public.inneru_request_teacher_access() to authenticated;

-- SQL Editor / database-owner only. Never callable by a student's or teacher's JWT.
create or replace function public.inneru_approve_teacher(p_email text) returns uuid language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 select id into target from auth.users where lower(email)=lower(trim(p_email)) and email_confirmed_at is not null;
 if target is null then raise exception 'No verified Auth account exists for this email. Complete signup and email confirmation first.'; end if;
 update public.profiles set role='teacher',requested_role='teacher',updated_at=now() where id=target;
 return target;
end $$;
revoke all on function public.inneru_approve_teacher(text) from public,anon,authenticated;

-- Protect the legacy snapshot RPC too; teachers manage classes, not student XP.
create or replace function public.inneru_save(p_snapshot jsonb,p_revision bigint,p_request_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); previous public.student_progress; snap jsonb; item jsonb; world record; b record; completed jsonb; whole_done jsonb; total integer; earned boolean; is_key boolean; field text; rid text;
begin
 if uid is null or not exists(select 1 from public.profiles where id=uid and role='student') then raise insufficient_privilege; end if;
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


notify pgrst,'reload schema';
commit;
