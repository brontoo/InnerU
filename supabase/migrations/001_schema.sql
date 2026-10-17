-- InnerU schema v1. Apply as the Supabase project owner, never from a browser.
begin;
create table if not exists public.inneru_schema(version integer primary key, installed_at timestamptz not null default now());
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Explorer' check(char_length(display_name) between 1 and 24),
 avatar_id text check(avatar_id in ('nova','atlas','luna','neo','pip','ember')),
 role text not null default 'student' check(role in ('student','teacher','admin')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.systems(id text primary key,name text not null,mission_count integer not null check(mission_count between 1 and 30),sort_order integer not null);
create table if not exists public.missions(id text primary key,system_id text not null references public.systems(id),number integer not null,title text not null,is_final boolean not null default false,unique(system_id,number));
alter table public.missions add column if not exists required_rewards jsonb not null default '[]';
create table if not exists public.badges(id text primary key,system_id text references public.systems(id),name text not null,kind text not null,requirement text not null);
create table if not exists public.reward_definitions(id text primary key,system_id text references public.systems(id),xp integer not null check(xp between 0 and 100),description text not null default 'Completed learning task');
create table if not exists public.classrooms(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.profiles(id) on delete cascade,name text not null check(char_length(name) between 1 and 80),join_code text not null unique default replace(gen_random_uuid()::text,'-',''),created_at timestamptz not null default now());
create index if not exists classrooms_teacher_idx on public.classrooms(teacher_id);
create table if not exists public.enrollments(class_id uuid references public.classrooms(id) on delete cascade,student_id uuid references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),primary key(class_id,student_id));
create index if not exists enrollments_student_idx on public.enrollments(student_id);
create table if not exists public.student_progress(user_id uuid primary key references public.profiles(id) on delete cascade,snapshot jsonb,revision bigint not null default 0 check(revision>=0),last_request_id uuid,total_xp integer not null default 0 check(total_xp>=0),updated_at timestamptz not null default now(),check(snapshot is null or jsonb_typeof(snapshot)='object'));
create table if not exists public.system_progress(user_id uuid references public.profiles(id) on delete cascade,system_id text references public.systems(id),completed_missions jsonb not null default '[]',mastery boolean not null default false,updated_at timestamptz not null default now(),primary key(user_id,system_id));
create table if not exists public.learning_responses(user_id uuid references public.profiles(id) on delete cascade,response_id text check(char_length(response_id) between 1 and 180),system_id text references public.systems(id),response jsonb not null,submitted_at timestamptz not null,primary key(user_id,response_id));
create index if not exists learning_responses_submitted_idx on public.learning_responses(user_id,submitted_at desc);
create table if not exists public.xp_events(user_id uuid references public.profiles(id) on delete cascade,reward_id text not null,xp integer not null check(xp between 0 and 100),source text not null default 'learning' check(source in ('learning','legacy-import')),recorded_at timestamptz not null default now(),primary key(user_id,reward_id));
create table if not exists public.student_badges(user_id uuid references public.profiles(id) on delete cascade,badge_id text references public.badges(id),earned_at timestamptz not null default now(),primary key(user_id,badge_id));
create table if not exists public.teacher_feedback(teacher_id uuid references public.profiles(id) on delete cascade,student_id uuid references public.profiles(id) on delete cascade,response_id text not null,note text not null default '' check(char_length(note)<=6000),reviewed boolean not null default false,submission_at timestamptz not null,updated_at timestamptz not null default now(),primary key(teacher_id,student_id,response_id),foreign key(student_id,response_id) references public.learning_responses(user_id,response_id) on delete cascade);

create or replace function public.inneru_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name,avatar_id) values(new.id,coalesce(nullif(left(new.raw_user_meta_data->>'display_name',24),''),'Explorer'),case when new.raw_user_meta_data->>'avatar_id' in ('nova','atlas','luna','neo','pip','ember') then new.raw_user_meta_data->>'avatar_id' end)
 on conflict(id) do update set display_name=excluded.display_name,avatar_id=excluded.avatar_id,updated_at=now();
 insert into public.student_progress(user_id) values(new.id) on conflict do nothing;
 return new;
end $$;
drop trigger if exists inneru_create_profile on auth.users;
create trigger inneru_create_profile after insert or update of raw_user_meta_data on auth.users for each row execute function public.inneru_auth_profile();
-- Backfill accounts that existed before this migration. Never overwrite approved roles.
insert into public.profiles(id,display_name,avatar_id) select id,coalesce(nullif(left(raw_user_meta_data->>'display_name',24),''),'Explorer'),case when raw_user_meta_data->>'avatar_id' in ('nova','atlas','luna','neo','pip','ember') then raw_user_meta_data->>'avatar_id' end from auth.users on conflict do nothing;
insert into public.student_progress(user_id) select id from public.profiles on conflict do nothing;

create or replace function public.inneru_is_teacher() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('teacher','admin')); $$;
create or replace function public.inneru_can_read(p_student uuid) returns boolean language sql stable security definer set search_path='' as $$
 select p_student=auth.uid() or (public.inneru_is_teacher() and exists(select 1 from public.enrollments e join public.classrooms c on c.id=e.class_id where e.student_id=p_student and c.teacher_id=auth.uid())); $$;
create or replace function public.inneru_can_view_class(p_class uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.classrooms c where c.id=p_class and c.teacher_id=auth.uid() and public.inneru_is_teacher()) or exists(select 1 from public.enrollments where class_id=p_class and student_id=auth.uid()); $$;

-- Deny direct mutation. Narrow, authenticated RPCs below handle writes.
revoke all on public.inneru_schema,public.profiles,public.systems,public.missions,public.badges,public.reward_definitions,public.classrooms,public.enrollments,public.student_progress,public.system_progress,public.learning_responses,public.xp_events,public.student_badges,public.teacher_feedback from anon,authenticated;
grant select on public.systems,public.missions,public.badges,public.reward_definitions to anon,authenticated;
grant select on public.profiles,public.classrooms,public.enrollments,public.student_progress,public.system_progress,public.learning_responses,public.xp_events,public.student_badges,public.teacher_feedback to authenticated;
do $$ declare t text;begin
 foreach t in array array['inneru_schema','profiles','systems','missions','badges','reward_definitions','classrooms','enrollments','student_progress','system_progress','learning_responses','xp_events','student_badges','teacher_feedback'] loop
 execute format('alter table public.%I enable row level security',t);
 end loop;
 foreach t in array array['systems','missions','badges','reward_definitions'] loop
 execute format('drop policy if exists catalog_read on public.%I',t);
 execute format('create policy catalog_read on public.%I for select using(true)',t);
 end loop;
 foreach t in array array['student_progress','system_progress','learning_responses','xp_events','student_badges'] loop
 execute format('drop policy if exists learner_read on public.%I',t);
 execute format('create policy learner_read on public.%I for select to authenticated using(public.inneru_can_read(user_id))',t);
 end loop;
end $$;
drop policy if exists profile_read on public.profiles;
create policy profile_read on public.profiles for select to authenticated using(public.inneru_can_read(id));
drop policy if exists classroom_read on public.classrooms;
create policy classroom_read on public.classrooms for select to authenticated using(public.inneru_can_view_class(id));
drop policy if exists enrollment_read on public.enrollments;
create policy enrollment_read on public.enrollments for select to authenticated using(student_id=auth.uid() or (public.inneru_is_teacher() and public.inneru_can_view_class(class_id)));
drop policy if exists feedback_read on public.teacher_feedback;
create policy feedback_read on public.teacher_feedback for select to authenticated using(student_id=auth.uid() or (teacher_id=auth.uid() and public.inneru_is_teacher() and public.inneru_can_read(student_id)));
revoke all on function public.inneru_auth_profile() from public,anon,authenticated;
revoke all on function public.inneru_is_teacher(),public.inneru_can_read(uuid),public.inneru_can_view_class(uuid) from public,anon;
grant execute on function public.inneru_is_teacher(),public.inneru_can_read(uuid),public.inneru_can_view_class(uuid) to authenticated;
commit;
