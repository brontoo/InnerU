-- InnerU combined installer. Sources: migrations/001–006.
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
begin;
insert into public.systems values('integumentary','Integumentary',6,0) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-1','integumentary',1,'Build the barrier',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-2','integumentary',2,'Layers and renewal',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-3','integumentary',3,'Hair, nails and glands',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-4','integumentary',4,'Balance the temperature',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-5','integumentary',5,'Protect and sense',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-6','integumentary',6,'Repair the shield',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('integumentary-7','integumentary',7,'Restore the Living Shield',true) on conflict(id) do update set title=excluded.title;
insert into public.systems values('skeletal','Skeletal',7,1) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-1','skeletal',1,'Meet your skeleton',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-2','skeletal',2,'Bone detective',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-3','skeletal',3,'Inside a bone',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-4','skeletal',4,'Joint lab',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-5','skeletal',5,'Bone remodeling',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-6','skeletal',6,'Repair the fracture',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-7','skeletal',7,'Body Detective',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('skeletal-8','skeletal',8,'The athlete case',true) on conflict(id) do update set title=excluded.title;
insert into public.systems values('muscle','Muscular',7,2) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-1','muscle',1,'Meet the three muscles',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-2','muscle',2,'Muscle to movement',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-3','muscle',3,'Zoom inside a muscle',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-4','muscle',4,'Slide to contract',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-5','muscle',5,'Fuel the movement',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-6','muscle',6,'Endurance or power?',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-7','muscle',7,'Muscle Lab',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('muscle-8','muscle',8,'Power the finish',true) on conflict(id) do update set title=excluded.title;
insert into public.systems values('respiratory','Respiratory',6,3) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-1','respiratory',1,'Why we breathe',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-2','respiratory',2,'Follow the air',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-3','respiratory',3,'At the alveolus',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-4','respiratory',4,'The breathing engine',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-5','respiratory',5,'Oxygen on the move',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-6','respiratory',6,'Protect the exchange',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('respiratory-7','respiratory',7,'Keep oxygen moving',true) on conflict(id) do update set title=excluded.title;
insert into public.systems values('circ','Circulatory',7,4) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('circ-1','circ',1,'Vessel Highway',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-2','circ',2,'Capillary Exchange',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-3','circ',3,'Heart Headquarters',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-4','circ',4,'The Double Circuit',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-5','circ',5,'Blood Cargo',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-6','circ',6,'Blood Type Match',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-7','circ',7,'Circulatory Emergency',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('circ-8','circ',8,'Keep Every Cell Alive',true) on conflict(id) do update set title=excluded.title;
insert into public.systems values('excretory','Excretory',6,5) on conflict(id) do update set name=excluded.name,mission_count=excluded.mission_count,sort_order=excluded.sort_order;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-1','excretory',1,'Waste relay',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-2','excretory',2,'Kidney cartographer',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-3','excretory',3,'The filtration gate',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-4','excretory',4,'Reabsorption rescue',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-5','excretory',5,'Balance lab',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-6','excretory',6,'Kidney care detective',false) on conflict(id) do update set title=excluded.title;
insert into public.missions(id,system_id,number,title,is_final) values('excretory-7','excretory',7,'Restore the balance',true) on conflict(id) do update set title=excluded.title;
insert into public.badges values('integumentary-mission-1','integumentary','Build the barrier','mission','Complete mission 1: Build the barrier.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-mission-2','integumentary','Layers and renewal','mission','Complete mission 2: Layers and renewal.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-mission-3','integumentary','Hair, nails and glands','mission','Complete mission 3: Hair, nails and glands.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-mission-4','integumentary','Balance the temperature','mission','Complete mission 4: Balance the temperature.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-mission-5','integumentary','Protect and sense','mission','Complete mission 5: Protect and sense.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-mission-6','integumentary','Repair the shield','mission','Complete mission 6: Repair the shield.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('integumentary-key','integumentary','Shield Master','mastery','Complete all 6 missions and the final challenge to earn the Shield Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-1','skeletal','ANATOMY EXPLORER','mission','Complete mission 1: Meet your skeleton.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-2','skeletal','Bone detective','mission','Complete mission 2: Bone detective.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-3','skeletal','FUNCTION DETECTIVE','mission','Complete mission 3: Inside a bone.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-4','skeletal','Joint lab','mission','Complete mission 4: Joint lab.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-5','skeletal','Bone remodeling','mission','Complete mission 5: Bone remodeling.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-6','skeletal','Repair the fracture','mission','Complete mission 6: Repair the fracture.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-mission-7','skeletal','Body Detective','mission','Complete mission 7: Body Detective.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('skeletal-key','skeletal','SKELETAL MASTER · Skeletal System','mastery','Complete all 7 missions and the final challenge to earn the Framework Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-1','muscle','Meet the three muscles','mission','Complete mission 1: Meet the three muscles.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-2','muscle','Muscle to movement','mission','Complete mission 2: Muscle to movement.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-3','muscle','Zoom inside a muscle','mission','Complete mission 3: Zoom inside a muscle.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-4','muscle','Slide to contract','mission','Complete mission 4: Slide to contract.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-5','muscle','Fuel the movement','mission','Complete mission 5: Fuel the movement.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-6','muscle','Endurance or power?','mission','Complete mission 6: Endurance or power?.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-mission-7','muscle','Muscle Lab','mission','Complete mission 7: Muscle Lab.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('muscle-key','muscle','Power Master','mastery','Complete all 7 missions and the final challenge to earn the Power Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-1','respiratory','Why we breathe','mission','Complete mission 1: Why we breathe.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-2','respiratory','Follow the air','mission','Complete mission 2: Follow the air.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-3','respiratory','At the alveolus','mission','Complete mission 3: At the alveolus.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-4','respiratory','The breathing engine','mission','Complete mission 4: The breathing engine.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-5','respiratory','Oxygen on the move','mission','Complete mission 5: Oxygen on the move.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-mission-6','respiratory','Protect the exchange','mission','Complete mission 6: Protect the exchange.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('respiratory-key','respiratory','Oxygen Master','mastery','Complete all 6 missions and the final challenge to earn the Oxygen Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-1','circ','Vessel Highway','mission','Complete mission 1: Vessel Highway.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-2','circ','Capillary Exchange','mission','Complete mission 2: Capillary Exchange.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-3','circ','Heart Headquarters','mission','Complete mission 3: Heart Headquarters.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-4','circ','The Double Circuit','mission','Complete mission 4: The Double Circuit.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-5','circ','Blood Cargo','mission','Complete mission 5: Blood Cargo.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-6','circ','Blood Type Match','mission','Complete mission 6: Blood Type Match.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-mission-7','circ','Circulatory Emergency','mission','Complete mission 7: Circulatory Emergency.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('circ-key','circ','Transport Master','mastery','Complete all 7 missions and the final challenge to earn the Transport Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-1','excretory','Waste relay','mission','Complete mission 1: Waste relay.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-2','excretory','Kidney cartographer','mission','Complete mission 2: Kidney cartographer.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-3','excretory','The filtration gate','mission','Complete mission 3: The filtration gate.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-4','excretory','Reabsorption rescue','mission','Complete mission 4: Reabsorption rescue.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-5','excretory','Balance lab','mission','Complete mission 5: Balance lab.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-mission-6','excretory','Kidney care detective','mission','Complete mission 6: Kidney care detective.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('excretory-key','excretory','Balance Master','mastery','Complete all 6 missions and the final challenge to earn the Balance Key.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('medical','skeletal','MEDICAL INVESTIGATOR','investigation','Solve all four joint evidence files in skeletal mission 7.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('detective',null,'ALL-SYSTEMS INVESTIGATOR','investigation','File six supported Body Detective investigations.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('connection',null,'SYSTEM THINKER','connection','Complete the six matches, predictions and reviewed reflection in System Connections.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.badges values('capstone',null,'WHOLE-BODY EXPLORER','final','Earn six System Keys, complete six final decisions and review your final explanation.') on conflict(id) do update set name=excluded.name,requirement=excluded.requirement;
insert into public.reward_definitions(id,system_id,xp) values('activity1','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q1-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q1-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q1-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity2','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q2-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q2-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q2-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity3','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q3-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q3-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q3-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity4','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q4-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q4-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q4-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity5','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q5-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q5-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q5-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity6','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q6-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q6-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q6-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity7','skeletal',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q7-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q7-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q7-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('activity8','skeletal',0) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q8-0','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q8-1','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('q8-2','skeletal',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('case0','skeletal',30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('case1','skeletal',30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('case2','skeletal',30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('case3','skeletal',30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('boss','skeletal',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-1-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-1','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-1-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-1-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-1-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-2-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-2','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-2-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-2-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-2-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-3-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-3','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-3-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-3-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-3-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-4-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-4','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-4-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-4-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-4-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-5-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-5','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-5-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-5-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-5-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-6-lab','integumentary',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-mission-6','integumentary',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-6-q0','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-6-q1','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-6-q2','integumentary',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-0','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-1','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-2','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-3','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-4','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-5','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-6','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-final-7','integumentary',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('integ-key','integumentary',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-1-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-1','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-1-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-1-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-1-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-2-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-2','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-2-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-2-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-2-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-3-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-3','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-3-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-3-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-3-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-4','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-5-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-5','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-5-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-5-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-5-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-6-lab','respiratory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-mission-6','respiratory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-6-q0','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-6-q1','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-6-q2','respiratory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-0','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-1','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-2','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-3','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-4','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-5','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-6','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-final-7','respiratory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-key','respiratory',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-1-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-1','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-1-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-1-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-1-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-2-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-2','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-2-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-2-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-2-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-3-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-3','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-3-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-3-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-3-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-4-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-4','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-4-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-4-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-4-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-5','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-6-lab','excretory',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-mission-6','excretory',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-6-q0','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-6-q1','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-6-q2','excretory',7) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-0','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-1','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-2','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-3','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-4','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-5','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-6','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-final-7','excretory',8) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-key','excretory',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-1-route','excretory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-4-audit','excretory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-ph','excretory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-5-weekly','excretory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('exc-6-treatment','excretory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-breath-in','respiratory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('resp-4-breath-rate','respiratory',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-1','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m1-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-2','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m2-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-3','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m3-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-4','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m4-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-5','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m5-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-6','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m6-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mission-7','circ',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-lab','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-a0','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-a1','circ',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-c0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-c1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-m7-c2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-3','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-4','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-5','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-6','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-7','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-8','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-9','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-10','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-11','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-12','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-13','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-master-14','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-0','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-1','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-2','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-3','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-4','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-5','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-6','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss-7','circ',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-mastery','circ',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('circ-boss','circ',40) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-1','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-scanner','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-location','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-control','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-conscious','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m1-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-2','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-arm','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-pull','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-force','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-bag','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m2-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-3','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-zoom','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-build','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-hierarchy','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-locate','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m3-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-4','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-slide','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-bridge','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-mistake','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m4-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-5','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-energy','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-oxygen','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-recovery','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-rigor-check','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m5-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-6','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-athletes','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-profiles','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-sample','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-bird','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m6-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-7','muscle',25) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-scanner','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-stimulate','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-target','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-source','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-report','muscle',30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-check-1','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-check-2','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m7-check-3','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:complete-8','muscle',50) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m8-tissue','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m8-order','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m8-contract','muscle',5) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m8-fibers','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:m8-cooperate','muscle',15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:muscle-case-0','muscle',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:muscle-case-1','muscle',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:muscle-case-2','muscle',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('muscle:muscle-case-3','muscle',20) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('force-lift','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('force-hold','muscle',10) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-touch',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-spine',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-wave',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-air',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-signal',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('detective2-sample',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('connection',null,35) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('capstone',null,30) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-0',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-1',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-2',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-3',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-4',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
insert into public.reward_definitions(id,system_id,xp) values('cap-station-5',null,15) on conflict(id) do update set xp=excluded.xp,system_id=excluded.system_id;
update public.missions set required_rewards='["activity1", "q1-0", "q1-1", "q1-2"]'::jsonb where id='skeletal-1';
update public.missions set required_rewards='["activity2", "q2-0", "q2-1", "q2-2"]'::jsonb where id='skeletal-2';
update public.missions set required_rewards='["activity3", "q3-0", "q3-1", "q3-2"]'::jsonb where id='skeletal-3';
update public.missions set required_rewards='["activity4", "q4-0", "q4-1", "q4-2"]'::jsonb where id='skeletal-4';
update public.missions set required_rewards='["activity5", "q5-0", "q5-1", "q5-2"]'::jsonb where id='skeletal-5';
update public.missions set required_rewards='["activity6", "q6-0", "q6-1", "q6-2"]'::jsonb where id='skeletal-6';
update public.missions set required_rewards='["activity7", "q7-0", "q7-1", "q7-2"]'::jsonb where id='skeletal-7';
update public.missions set required_rewards='["activity8", "q8-0", "q8-1", "q8-2"]'::jsonb where id='skeletal-8';
update public.missions set required_rewards='["integ-1-lab", "integ-1-q0", "integ-1-q1", "integ-1-q2"]'::jsonb where id='integumentary-1';
update public.missions set required_rewards='["integ-2-lab", "integ-2-q0", "integ-2-q1", "integ-2-q2"]'::jsonb where id='integumentary-2';
update public.missions set required_rewards='["integ-3-lab", "integ-3-q0", "integ-3-q1", "integ-3-q2"]'::jsonb where id='integumentary-3';
update public.missions set required_rewards='["integ-4-lab", "integ-4-q0", "integ-4-q1", "integ-4-q2"]'::jsonb where id='integumentary-4';
update public.missions set required_rewards='["integ-5-lab", "integ-5-q0", "integ-5-q1", "integ-5-q2"]'::jsonb where id='integumentary-5';
update public.missions set required_rewards='["integ-6-lab", "integ-6-q0", "integ-6-q1", "integ-6-q2"]'::jsonb where id='integumentary-6';
update public.missions set required_rewards='["resp-1-lab", "resp-1-q0", "resp-1-q1", "resp-1-q2"]'::jsonb where id='respiratory-1';
update public.missions set required_rewards='["resp-2-lab", "resp-2-q0", "resp-2-q1", "resp-2-q2"]'::jsonb where id='respiratory-2';
update public.missions set required_rewards='["resp-3-lab", "resp-3-q0", "resp-3-q1", "resp-3-q2"]'::jsonb where id='respiratory-3';
update public.missions set required_rewards='["resp-4-lab", "resp-4-q0", "resp-4-q1", "resp-4-q2"]'::jsonb where id='respiratory-4';
update public.missions set required_rewards='["resp-5-lab", "resp-5-q0", "resp-5-q1", "resp-5-q2"]'::jsonb where id='respiratory-5';
update public.missions set required_rewards='["resp-6-lab", "resp-6-q0", "resp-6-q1", "resp-6-q2"]'::jsonb where id='respiratory-6';
update public.missions set required_rewards='["exc-1-lab", "exc-1-q0", "exc-1-q1", "exc-1-q2"]'::jsonb where id='excretory-1';
update public.missions set required_rewards='["exc-2-lab", "exc-2-q0", "exc-2-q1", "exc-2-q2"]'::jsonb where id='excretory-2';
update public.missions set required_rewards='["exc-3-lab", "exc-3-q0", "exc-3-q1", "exc-3-q2"]'::jsonb where id='excretory-3';
update public.missions set required_rewards='["exc-4-lab", "exc-4-q0", "exc-4-q1", "exc-4-q2"]'::jsonb where id='excretory-4';
update public.missions set required_rewards='["exc-5-lab", "exc-5-q0", "exc-5-q1", "exc-5-q2"]'::jsonb where id='excretory-5';
update public.missions set required_rewards='["exc-6-lab", "exc-6-q0", "exc-6-q1", "exc-6-q2"]'::jsonb where id='excretory-6';
update public.missions set required_rewards='["circ-m1-lab", "circ-m1-a0", "circ-m1-a1", "circ-m1-c0", "circ-m1-c1", "circ-m1-c2"]'::jsonb where id='circ-1';
update public.missions set required_rewards='["circ-m2-lab", "circ-m2-a0", "circ-m2-a1", "circ-m2-c0", "circ-m2-c1", "circ-m2-c2"]'::jsonb where id='circ-2';
update public.missions set required_rewards='["circ-m3-lab", "circ-m3-a0", "circ-m3-a1", "circ-m3-c0", "circ-m3-c1", "circ-m3-c2"]'::jsonb where id='circ-3';
update public.missions set required_rewards='["circ-m4-lab", "circ-m4-a0", "circ-m4-a1", "circ-m4-c0", "circ-m4-c1", "circ-m4-c2"]'::jsonb where id='circ-4';
update public.missions set required_rewards='["circ-m5-lab", "circ-m5-a0", "circ-m5-a1", "circ-m5-c0", "circ-m5-c1", "circ-m5-c2"]'::jsonb where id='circ-5';
update public.missions set required_rewards='["circ-m6-lab", "circ-m6-a0", "circ-m6-a1", "circ-m6-c0", "circ-m6-c1", "circ-m6-c2"]'::jsonb where id='circ-6';
update public.missions set required_rewards='["circ-m7-lab", "circ-m7-a0", "circ-m7-a1", "circ-m7-c0", "circ-m7-c1", "circ-m7-c2"]'::jsonb where id='circ-7';
update public.missions set required_rewards='["muscle:m1-scanner", "muscle:m1-location", "muscle:m1-control", "muscle:m1-conscious", "muscle:m1-check-1", "muscle:m1-check-2", "muscle:m1-check-3"]'::jsonb where id='muscle-1';
update public.missions set required_rewards='["muscle:m2-arm", "muscle:m2-pull", "muscle:m2-force", "muscle:m2-bag", "muscle:m2-check-1", "muscle:m2-check-2", "muscle:m2-check-3"]'::jsonb where id='muscle-2';
update public.missions set required_rewards='["muscle:m3-zoom", "muscle:m3-build", "muscle:m3-hierarchy", "muscle:m3-locate", "muscle:m3-check-1", "muscle:m3-check-2", "muscle:m3-check-3"]'::jsonb where id='muscle-3';
update public.missions set required_rewards='["muscle:m4-slide", "muscle:m4-bridge", "muscle:m4-mistake", "muscle:m4-check-1", "muscle:m4-check-2", "muscle:m4-check-3"]'::jsonb where id='muscle-4';
update public.missions set required_rewards='["muscle:m5-energy", "muscle:m5-oxygen", "muscle:m5-recovery", "muscle:m5-rigor-check", "muscle:m5-check-1", "muscle:m5-check-2", "muscle:m5-check-3"]'::jsonb where id='muscle-5';
update public.missions set required_rewards='["muscle:m6-athletes", "muscle:m6-profiles", "muscle:m6-sample", "muscle:m6-bird", "muscle:m6-check-1", "muscle:m6-check-2", "muscle:m6-check-3"]'::jsonb where id='muscle-6';
update public.missions set required_rewards='["muscle:m7-scanner", "muscle:m7-stimulate", "muscle:m7-target", "muscle:m7-source", "muscle:m7-report", "muscle:m7-check-1", "muscle:m7-check-2", "muscle:m7-check-3"]'::jsonb where id='muscle-7';
update public.missions set required_rewards='["muscle:m8-tissue", "muscle:m8-order", "muscle:m8-contract", "muscle:m8-fibers", "muscle:m8-cooperate"]'::jsonb where id='muscle-8';
update public.missions set required_rewards='["integ-final-0", "integ-final-1", "integ-final-2", "integ-final-3", "integ-final-4", "integ-final-5", "integ-final-6", "integ-final-7"]'::jsonb where id='integumentary-7';
update public.missions set required_rewards='["resp-final-0", "resp-final-1", "resp-final-2", "resp-final-3", "resp-final-4", "resp-final-5", "resp-final-6", "resp-final-7"]'::jsonb where id='respiratory-7';
update public.missions set required_rewards='["circ-master-0", "circ-master-1", "circ-master-2", "circ-master-3", "circ-master-4", "circ-master-5", "circ-master-6", "circ-master-7", "circ-master-8", "circ-master-9", "circ-master-10", "circ-master-11", "circ-master-12", "circ-master-13", "circ-master-14"]'::jsonb where id='circ-8';
update public.missions set required_rewards='["exc-final-0", "exc-final-1", "exc-final-2", "exc-final-3", "exc-final-4", "exc-final-5", "exc-final-6", "exc-final-7"]'::jsonb where id='excretory-7';
commit;
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
