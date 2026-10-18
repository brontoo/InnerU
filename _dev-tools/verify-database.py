"""Real PostgreSQL integration: schema, Auth trigger, constraints, RLS and RPCs."""
import json,os,subprocess,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAME='inneru-db-check';DB=os.environ.get('INNERU_DB_TEST_DATABASE','postgres');checks=0
def sql(s,ok=True):
 r=subprocess.run(['docker','exec','-i',NAME,'psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-qAt'],input=s,text=True,capture_output=True)
 if ok and r.returncode:raise AssertionError(r.stderr)
 return r

def q(x):return "'"+str(x).replace("'","''")+"'"
def as_user(id,s):return sql('set role authenticated;set request.jwt.claim.sub='+q(id)+';'+s)
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
ids=[str(uuid.uuid4()) for _ in range(4)];a,b,t,t2=ids
for i,id in enumerate(ids):sql('insert into auth.users(id,raw_user_meta_data) values('+q(id)+','+q(json.dumps({'display_name':'Learner '+str(i),'avatar_id':'luna','role':'admin'}))+'::jsonb);')
check(sql('select count(*) from public.profiles where id in('+','.join(map(q,ids))+') and role=\'student\';').stdout.strip()=='4','Auth trigger creates profiles and ignores self-selected privileged roles')
check(sql('select count(*) from public.student_progress where user_id in('+','.join(map(q,ids))+');').stdout.strip()=='4','every new account receives a revision-zero learning record')
check(not sql('set role anon;select * from public.student_progress;',ok=False).returncode==0,'anonymous clients cannot read learner records')
check(as_user(a,'select count(*) from public.profiles;').stdout.strip()=='1','students can read only their own profile')
check(sql('set role authenticated;set request.jwt.claim.sub='+q(a)+";update public.profiles set role='teacher';",ok=False).returncode!=0,'students cannot promote their profile by direct database writes')
check(sql('set role authenticated;set request.jwt.claim.sub='+q(a)+";select public.inneru_create_class('Unauthorized');",ok=False).returncode!=0,'student sessions cannot create teacher classes')
# Owner-configured school availability for the relational learning fixture.
sql("update public.profiles set class_code=case when id="+q(a)+" then '10G5' else '10G1' end where id in ("+q(a)+','+q(b)+");")
sql("insert into public.class_mission_settings(class_code,system_id,mission_number,unlocked) select c.code,s.id,0,true from public.school_classes c cross join public.systems s where c.code in ('10G1','10G5') on conflict(class_code,system_id,mission_number) do update set unlocked=true;")
snap={'name':'SQL learner','level':'Explorer','motion':False,'done':[1],'rewards':['activity1','q1-0','q1-0','unknown-million-xp'],'xp':9999999,'assessment':{'version':1,'responses':[{'id':'skeletal:1:q0','system':'skeletal','title':'Recall','answer':'Bones','correct':True,'at':'2026-10-17T10:00:00Z'}]}}
rid=str(uuid.uuid4())
def save(id,s,rev,request):return json.loads(as_user(id,'select public.inneru_save('+q(json.dumps(s))+'::jsonb,'+str(rev)+','+q(request)+');').stdout)
r=save(a,snap,0,rid)
check(r['snapshot']['xp']==30 and r['revision']==1,'XP is computed from known task credits, not browser totals or duplicate IDs')
check(save(a,snap,0,rid)['revision']==1,'retrying an acknowledged request is idempotent')
check(sql('set role authenticated;set request.jwt.claim.sub='+q(a)+';select public.inneru_save('+q(json.dumps(snap))+'::jsonb,0,'+q(str(uuid.uuid4()))+');',ok=False).returncode!=0,'a stale device cannot overwrite newer learning')
check(sql('select count(*) from public.xp_events where user_id='+q(a)+';').stdout.strip()=='2','unique task credits prevent duplicate XP rows')
check(sql('select count(*) from public.learning_responses where user_id='+q(a)+';').stdout.strip()=='1','submitted answers have normalized relational records')
check(sql('select count(*) from public.student_badges where user_id='+q(a)+" and badge_id='skeletal-mission-1';").stdout.strip()=='0','an incomplete set of science checks cannot mint a mission badge')
snap['rewards']+=['q1-1','q1-2'];r=save(a,snap,1,str(uuid.uuid4()))
check(r['snapshot']['xp']==50 and sql('select count(*) from public.student_badges where user_id='+q(a)+" and badge_id='skeletal-mission-1';").stdout.strip()=='1','a complete investigation and three checks earn the mission badge')
check(as_user(b,'select count(*) from public.learning_responses;').stdout.strip()=='0','another student cannot read answers or progress')
for id in [t,t2]:sql("update public.profiles set role='teacher' where id="+q(id)+';')
sql("update auth.users set email='riham.hassan@moe.sch.ae' where id="+q(t)+';')
sql("update public.profiles set class_code='10G5' where id="+q(a)+';')
check(as_user(t,'select count(*) from public.learning_responses;').stdout.strip()=='1','an approved teacher can read answers from an automatically assigned student')
check(as_user(t2,'select count(*) from public.learning_responses;').stdout.strip()=='0','an unrelated approved teacher cannot access that student')
check(len(json.loads(as_user(t,'select public.inneru_classroom();').stdout)['students'])==1,'cloud classroom returns only assigned student accounts')
as_user(t,'select public.inneru_feedback('+q(a)+",'skeletal:1:q0','Clear explanation',true,'2026-10-17T10:00:00Z');")
check(as_user(a,'select count(*) from public.teacher_feedback;').stdout.strip()=='1','student can read feedback from an authorized teacher')
check(sql('set role authenticated;set request.jwt.claim.sub='+q(t2)+';select public.inneru_feedback('+q(a)+",'skeletal:1:q0','Not allowed',true,'2026-10-17T10:00:00Z');",ok=False).returncode!=0,'unrelated teachers cannot write feedback')
old=sql('select snapshot::text from public.student_progress where user_id='+q(a)+';').stdout
broken={**snap,'assessment':{'version':1,'responses':[{'id':'bad','at':'not-a-date'}]}}
check(sql('set role authenticated;set request.jwt.claim.sub='+q(a)+';select public.inneru_save('+q(json.dumps(broken))+'::jsonb,2,'+q(str(uuid.uuid4()))+');',ok=False).returncode!=0 and sql('select snapshot::text from public.student_progress where user_id='+q(a)+';').stdout==old,'a malformed response rolls back the complete save transaction')
reset=save(a,{'name':'Reset','done':[],'rewards':[]},2,str(uuid.uuid4()))
check(reset['snapshot']['xp']==0 and sql('select count(*) from public.student_badges where user_id='+q(a)+';').stdout.strip()=='0','explicit reset clears current credits and badges together')
# A full six-system record must satisfy each seeded final gate.
catalog=json.loads((ROOT/'supabase/catalog.json').read_text())
all_rewards=json.loads(sql("select jsonb_agg(id) from public.reward_definitions;").stdout)
full={'name':'Full course','done':[],'rewards':[],'capstone':{'done':False}}
for world in catalog['worlds']:
 if world['id']!='skeletal':full[world['id']]={'done':[],'mastery':False}
sequence=json.loads(sql("select jsonb_agg(jsonb_build_object('system',m.system_id,'number',m.number,'final',m.is_final,'rewards',(select jsonb_agg(id) from public.reward_definitions where mission_id=m.id)) order by s.sort_order,m.number) from public.missions m join public.systems s on s.id=m.system_id;").stdout)
revision=0
for mission in sequence:
 full['rewards']+=mission['rewards'] or []
 field=full if mission['system']=='skeletal' else full[mission['system']]
 if mission['final'] and mission['system'] not in ['skeletal','muscle']:field['mastery']=True
 else:field['done'].append(8 if mission['final'] else mission['number'])
 complete=save(b,full,revision,str(uuid.uuid4()));revision=complete['revision']
full['rewards']=all_rewards;full['capstone']['done']=True
complete=save(b,full,revision,str(uuid.uuid4()));revision=complete['revision']
check(sql('select count(*) from public.system_progress where user_id='+q(b)+' and mastery;').stdout.strip()=='6','all six systems accept their complete activity, science-check and final gates')
missing={**full,'rewards':[id for id in full['rewards'] if id!='resp-final-7']}
save(b,missing,revision,str(uuid.uuid4()))
check(sql('select mastery from public.system_progress where user_id='+q(b)+" and system_id='respiratory';").stdout.strip()=='f','a missing final decision prevents its System Key and mastery badge')

# Running the supplied setup again retains users and approved roles.
sql((ROOT/'supabase/setup.sql').read_text())
check(sql('select role from public.profiles where id='+q(t)+';').stdout.strip()=='teacher','reapplying the setup preserves existing profiles and teacher approvals')
for id in ids:sql('delete from auth.users where id='+q(id)+';')
check(sql('select count(*) from public.student_progress where user_id in('+','.join(map(q,ids))+');').stdout.strip()=='0','deleting an Auth account cascades through learner data')
print(checks,'database checks passed.')
