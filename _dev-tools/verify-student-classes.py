"""All six school classes: browser/API/PostgreSQL assignments and teacher isolation.
The two school email addresses are used only in this isolated local Auth fixture.
No real account, outbound email or production database is created/contacted.
"""
import json,os,subprocess,uuid
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, CONTAINER, start_fixture
ROOT=Path(__file__).resolve().parents[1];DB='inneru_school_class_check'
ENV={**os.environ,'INNERU_DB_TEST_CONTAINER':CONTAINER,'INNERU_DB_TEST_DATABASE':DB}
proc,ORIGIN=start_fixture(ENV,database=True);checks=0;errors=[];created=[]
MARYAM='sf.alhammadi@moe.sch.ae';RIHAM='riham.hassan@moe.sch.ae';PASSWORD='Local-Class-Fixture-Only-123'
def q(v):return "'"+str(v).replace("'","''")+"'"
def sql(s,ok=True):
 r=subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-qAt'],input=s,text=True,capture_output=True)
 if ok and r.returncode:raise AssertionError(r.stderr)
 return r

def own(uid,s,ok=True):return sql('set role authenticated;set request.jwt.claim.sub='+q(uid)+';'+s,ok)
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def session(p):return p.request.get(ORIGIN+'/api/auth?action=session').json()['user']
def entry(p,role='student'):
 p.goto(ORIGIN+'/login.html?nosw=1');p.locator('[data-select-role='+role+']').click();p.wait_for_selector('#entry-email')
def details(p,email,name,code=None,role='student'):
 entry(p,role);p.locator('[data-auth-mode=signup]').first.click();p.locator('#entry-email').fill(email);p.locator('#entry-nickname').fill(name);p.locator('#entry-password').fill(PASSWORD);p.locator('#entry-confirm').fill(PASSWORD)
 if code:p.locator('#entry-class').select_option(code)
def submit(p):
 p.locator('#gate-entry-form [type=submit]').click();p.locator('input[value=sage]').check();p.locator('#gate-avatar-form [type=submit]').click()
def dashboard(p):
 p.wait_for_url('**/index.html#dashboard');p.wait_for_selector('.sd-page');p.wait_for_function('window.InneruCloud?.status()==="Saved to your account"')
def approve(p,email):
 sql('select public.inneru_approve_teacher('+q(email)+');');p.locator('[data-role-refresh]').click();p.wait_for_url('**/index.html#teacher');p.wait_for_selector('.td-page');p.wait_for_function('window.InneruCloud?.status()==="Teacher classroom connected"')
def roster(p):return p.request.get(ORIGIN+'/api/learning?action=classroom').json()
def signup_api(p,email,**values):
 return p.request.post(ORIGIN+'/api/auth?action=signup',data={'email':email,'password':PASSWORD,'name':'API fixture','avatarId':'sage',**values})
def save_work(p):
 p.evaluate('InneruEvidence.record({id:"skeletal:1:q0",system:"skeletal",mission:1,title:"Class fixture",prompt:"Supporting tissue?",answer:"Bone",correct:true});for(const [id,xp] of [["activity1",20],["q1-0",10],["q1-1",10],["q1-2",10]])reward(id,xp);state.done.push(1);save()')
 p.wait_for_function('InneruCloud.status()==="Saved to your account"&&state.xp===50')
try:
 # Retained local fixture DBs are cleaned only of this suite's fake accounts.
 sql("delete from auth.users where email in ("+q(MARYAM)+','+q(RIHAM)+") or email like 'class-fixture-%@example.com';")
 # Existing school availability is preconfigured by the owner in this assignment fixture.
 sql("insert into public.class_mission_settings(class_code,system_id,mission_number,unlocked) select code,'skeletal',0,true from public.school_classes on conflict(class_code,system_id,mission_number) do update set unlocked=true;")
 with sync_playwright() as pw:
  browser=launch(pw)
  def page(width=1440):
   c=new_context(browser, service_workers='block',viewport={'width':width,'height':1000},is_mobile=width<=600,has_touch=width<=600);p=c.new_page();p.on('pageerror',lambda e:errors.append(str(e)));return p
  probe=page();probe.goto(ORIGIN+'/login.html?nosw=1')
  for code in [None,'','10G0','10G7','10g1',' 10G1 ',{},['10G1']]:
   response=signup_api(probe,'class-fixture-invalid-'+uuid.uuid4().hex[:8]+'@example.com',**({'classCode':code} if code is not None else {}))
   check(response.status==400,'signup API rejects missing/invalid class '+str(code))
  check(probe.request.get(ORIGIN+'/__test/status').json()['users']==[],'invalid class requests never create Auth accounts')
  # Teacher onboarding has no class field and still requires owner approval.
  rt=page();details(rt,RIHAM,'Riham fixture',role='teacher');check(rt.locator('#entry-class').count()==0,'teacher signup has no student class selection');submit(rt);rt.wait_for_selector('[data-role-refresh]');r=session(rt);created.append(r['id'])
  check(r['role']=='student' and r['requestedRole']=='teacher' and r['classCode'] is None,'teacher signup and existing role approval remain unchanged')
  check(rt.request.get(ORIGIN+'/api/learning?action=classroom').status==403,'a registered but unapproved teacher cannot read the roster')
  check(sql('select teacher_id is null from public.school_teachers where email='+q(MARYAM)).stdout.strip()=='t' and sql('select count(*) from auth.users where lower(email)='+q(MARYAM)).stdout.strip()=='0','Maryam has seeded class assignments with no fake Auth account or teacher profile')
  students=[]
  for n in range(1,7):
   code='10G'+str(n);p=page(1440 if n%2 else 390);email='class-fixture-'+uuid.uuid4().hex[:8]+'@example.com';details(p,email,'Explorer '+code)
   check(p.locator('#entry-class option:not([disabled])').evaluate_all('(a)=>a.map(o=>o.value)')==['10G1','10G2','10G3','10G4','10G5','10G6'],'the native '+code+' dropdown offers exactly six class choices')
   if n==1:
    p.locator('#gate-entry-form [type=submit]').click();p.wait_for_selector('#entry-class[aria-invalid=true]');check(p.locator('.gate-avatar-grid').count()==0 and 'Select your school class' in p.locator('#entry-error').inner_text(),'signup cannot advance without selecting a class')
   p.locator('#entry-class').select_option(code)
   if n==2:
    p.locator('#entry-class').focus();p.keyboard.press('ArrowDown');p.keyboard.press('ArrowUp');check(p.locator('#entry-class').input_value()==code,'the native class dropdown supports keyboard selection')
   check(p.evaluate('document.documentElement.scrollWidth<=innerWidth') and p.locator('#entry-class').bounding_box()['width']>=44,code+' selector fits and remains usable on '+('desktop' if n%2 else 'mobile'))
   if n==1:
    p.locator('#gate-entry-form [type=submit]').click();p.locator('[data-avatar-back]').click();check(p.locator('#entry-class').input_value()==code,'returning from avatar selection retains the selected class');p.locator('#entry-password').fill(PASSWORD);p.locator('#entry-confirm').fill(PASSWORD)
   if n==6:p.screenshot(path=artifact('student-class-mobile.png'),full_page=True)
   submit(p);dashboard(p);u=session(p);created.append(u['id']);students.append((p,u,email))
   expected=MARYAM if n<=4 else RIHAM
   check(u['classCode']==code and u['assignedTeacher']['email']==expected and u['assignedTeacher']['id']==(None if n<=4 else r['id']),code+' saves the canonical teacher assignment on the Auth-linked profile')
   check(p.url.endswith('#dashboard') and p.locator('a[href="#teacher"]').count()==0 and ('registration pending' in p.locator('[data-cloud-panel]').inner_text())==(n<=4),code+' stays in the student dashboard and shows accurate pending teacher status')
   check(p.locator('[data-cloud-join]').count()==0 and 'Class code' not in p.locator('[data-cloud-panel]').inner_text() and code in p.locator('.iu-cloud-assignment').inner_text(),code+' shows its saved class assignment without asking for an invitation code')
   save_work(p)
   check(sql('select total_xp from public.student_progress where user_id='+q(u['id'])).stdout.strip()=='50' and sql('select count(*) from public.student_badges where user_id='+q(u['id'])).stdout.strip()=='1',code+' retains linked progress, answers, XP and earned badges')
  approve(rt,RIHAM);data=roster(rt)
  check({s['id'] for s in data['students']}=={s[1]['id'] for s in students[4:]} and [c['name'] for c in data['classes'] if c.get('schoolClass')]==['10G5','10G6'],'Riham sees only 10G5 and 10G6 students automatically')
  check(rt.locator('[data-td-students]').inner_text()=='2','Riham’s Home metrics use her assigned cloud roster')
  rt.locator('.td-tabs a[href="#teacher?view=students"]').click();rt.wait_for_selector('.td-student-link');check(rt.locator('.td-student-link').count()==2,'Riham’s Classes & students view uses only her assigned students')
  delayed=[];rt.route('**/api/learning?action=state',lambda route:delayed.append(route));rt.reload(wait_until='commit');rt.wait_for_selector('.td-student-link');rt.wait_for_function('document.querySelectorAll(".td-student-link").length===2')
  check(bool(delayed) and rt.locator('.td-student-link').count()==2,'the teacher dashboard loads its assigned roster even before shared cloud state arrives')
  for request in delayed:request.continue_()
  rt.unroute('**/api/learning?action=state');rt.wait_for_function('window.InneruCloud?.status()==="Teacher classroom connected"')
  # Registration resolves pending links, but approval still gates teacher permissions.
  mt=page();details(mt,'Sf.Alhammadi@moe.sch.ae','Maryam fixture',role='teacher');submit(mt);mt.wait_for_selector('[data-role-refresh]');m=session(mt);created.append(m['id'])
  check(sql('select count(*) from public.profiles where class_code in (\'10G1\',\'10G2\',\'10G3\',\'10G4\') and assigned_teacher_id='+q(m['id'])).stdout.strip()=='4','Maryam’s matching email links all four pending classes when her real fixture account registers')
  check(mt.request.get(ORIGIN+'/api/learning?action=classroom').status==403,'linking a matching email does not bypass teacher approval')
  approve(mt,MARYAM);data=roster(mt)
  check({s['id'] for s in data['students']}=={s[1]['id'] for s in students[:4]} and [c['name'] for c in data['classes'] if c.get('schoolClass')]==['10G1','10G2','10G3','10G4'],'Maryam sees only 10G1–10G4, including progress saved before her registration')
  check(mt.locator('[data-td-students]').inner_text()=='4','Maryam’s Home metrics use only her four assigned students')
  mt.locator('.td-tabs a[href="#teacher?view=students"]').click();mt.wait_for_selector('#td-group-filter');mt.locator('#td-group-filter').select_option('10G2')
  check(mt.locator('.td-student-link').count()==1 and '10G2' in mt.locator('.td-student-link').inner_text(),'teacher class filters organize the automatic roster')
  mt.locator('.td-student-link').click();mt.wait_for_selector('.td-hero-student');mt.locator('.td-tabs a[href*="view=answers"]').click();mt.wait_for_selector('.td-answer');mt.locator('.td-feedback summary').click();mt.wait_for_selector('[data-td-feedback]');mt.locator('[data-td-feedback] textarea').fill('Mapped teacher feedback');mt.locator('[data-td-feedback] input').check();mt.locator('[data-td-feedback] button').click();mt.wait_for_function('document.querySelector(".td-form-status").textContent.includes("saved")')
  check(next(s for s in roster(mt)['students'] if s['classCode']=='10G2')['feedback']['skeletal:1:q0']['note']=='Mapped teacher feedback','assigned teachers can save feedback from the main dashboard')
  for teacher,allowed,denied in [(m,students[:4],students[4:]),(r,students[4:],students[:4])]:
   allowed_ids={s[1]['id'] for s in allowed};denied_ids={s[1]['id'] for s in denied}
   for table,col in [('profiles','id'),('student_progress','user_id'),('system_progress','user_id'),('learning_responses','user_id'),('xp_events','user_id'),('student_badges','user_id')]:
    raw=own(teacher['id'],'select distinct '+col+' from public.'+table+';').stdout.strip().splitlines();visible=set(raw)
    check(allowed_ids<=visible and not denied_ids.intersection(visible),teacher['email']+' RLS isolates '+table)
   target=denied[0][1]['id'];check(own(teacher['id'],'select public.inneru_feedback('+q(target)+",'skeletal:1:q0','Wrong teacher',true,now());",False).returncode!=0,teacher['email']+' cannot submit feedback for the other teacher’s student')
  unassigned=page();unassigned_email='class-fixture-unassigned-'+uuid.uuid4().hex[:8]+'@example.com';details(unassigned,unassigned_email,'Unassigned teacher',role='teacher');submit(unassigned);unassigned.wait_for_selector('[data-role-refresh]');other_teacher=session(unassigned);created.append(other_teacher['id']);approve(unassigned,unassigned_email)
  unassigned.evaluate('InneruTeacher.list=async()=>{throw new Error("Legacy browser roster used")};InneruTeacherDashboard.render()');unassigned.wait_for_selector('[data-td-students]')
  check(roster(unassigned)['students']==[] and roster(unassigned)['classes']==[] and unassigned.locator('[data-td-students]').inner_text()=='0' and unassigned.locator('#td-sharing').count()==0,'teachers without assigned school classes have an empty cloud roster and never fall back to imported browser students')
  first=students[0];p,u,email=first
  for values in [{'classCode':'10G7'},{'classCode':'10G5'},{'classCode':'10G2'}]:
   response=p.request.post(ORIGIN+'/api/learning?action=select-class',data=values);check(response.status in [400,403],'saved student class cannot be invalid or self-reassigned: '+values['classCode'])
  check(own(u['id'],"update public.profiles set assigned_teacher_email='riham.hassan@moe.sch.ae';",False).returncode!=0,'students cannot write teacher or class fields directly')
  own(u['id'],"select public.inneru_select_student_class('10G1');")
  sql('update auth.users set raw_user_meta_data=raw_user_meta_data||\'{"class_code":"10G5","assigned_teacher_email":"riham.hassan@moe.sch.ae"}\'::jsonb where id='+q(u['id']))
  check(session(p)['classCode']=='10G1','updating editable Auth metadata cannot move an existing student to another teacher')
  # A deliberately incorrect legacy enrollment must not punch a hole through RLS.
  wrong=json.loads(sql('insert into public.classrooms(teacher_id,name) values('+q(r['id'])+",'Archived fixture') returning to_jsonb(classrooms);").stdout)
  for action,values in [('join-class',{'code':wrong['join_code']}),('create-class',{'name':'Retired workflow'})]:
   check(p.request.post(ORIGIN+'/api/learning?action='+action,data=values).status==410,action+' is retired at the API')
  for uid,call in [(u['id'],"inneru_join_class("+q(wrong['join_code'])+")"),(r['id'],"inneru_create_class('Retired workflow')")]:
   check(own(uid,'select public.'+call+';',False).returncode!=0,'direct authenticated database calls cannot use '+call.split('(')[0])
  sql('insert into public.enrollments(class_id,student_id) values('+q(wrong['id'])+','+q(u['id'])+')')
  check(not own(r['id'],'select id from public.profiles where id='+q(u['id'])).stdout.strip() and own(r['id'],'select student_id from public.enrollments where student_id='+q(u['id']),False).returncode!=0,'a stale or injected legacy enrollment cannot expose a school student to another teacher')
  check([c['name'] for c in roster(rt)['classes']]==['10G5','10G6'],'archived invitation classrooms never appear alongside the assigned school classes')
  rt.locator('[data-cloud-open-classroom]').click();rt.wait_for_selector('.iu-cloud-classes')
  check(rt.locator('[data-cloud-create],.iu-cloud-classes input').count()==0 and [s.inner_text() for s in rt.locator('.iu-cloud-classes article>b').all()]==['10G5','10G6'],'teacher classroom lists automatic classes without creating or sharing invitation codes')
  # Canonical fields overwrite forged caller assignments, even on privileged updates.
  sql('update public.profiles set assigned_teacher_id='+q(r['id'])+',assigned_teacher_email='+q(RIHAM)+' where id='+q(u['id']))
  check(session(p)['assignedTeacher']['id']==m['id'],'database triggers derive teacher identity instead of accepting supplied teacher fields')
  # Existing accounts choose once after login, keeping their original progress/identity.
  legacy,lu,lemail=students[5];legacy.request.post(ORIGIN+'/api/auth?action=logout',data={});sql('update public.profiles set class_code=null where id='+q(lu['id']))
  entry(legacy);legacy.locator('#entry-email').fill(lemail);legacy.locator('#entry-password').fill(PASSWORD);legacy.locator('#gate-entry-form [type=submit]').click();legacy.wait_for_selector('#gate-class-form')
  check(session(legacy)['id']==lu['id'] and legacy.locator('.sd-page').count()==0,'an existing student without a class is prompted at next sign-in before the dashboard')
  legacy.goto(ORIGIN+'/index.html?nosw=1#dashboard');legacy.wait_for_selector('#gate-class-form')
  check('/login.html' in legacy.url,'an existing signed-in student cannot bypass the class step with a dashboard URL')
  legacy.locator('#entry-class').select_option('10G6');legacy.locator('#gate-class-form [type=submit]').click();dashboard(legacy)
  check(session(legacy)['id']==lu['id'] and legacy.evaluate('state.xp')==50 and session(legacy)['assignedTeacher']['id']==r['id'],'one-time legacy class selection preserves account, answers, XP and teacher assignment')
  legacy.reload();dashboard(legacy);check(legacy.locator('#gate-class-form').count()==0,'a saved class is not requested on subsequent sign-ins or reloads')
  # Even a stale archived enrollment cannot expose a student awaiting selection.
  sql('update public.profiles set class_code=null where id='+q(lu['id']))
  sql('insert into public.enrollments(class_id,student_id) values('+q(wrong['id'])+','+q(lu['id'])+')')
  check(not own(r['id'],'select id from public.profiles where id='+q(lu['id'])).stdout.strip(),'classless students cannot become visible through old invitation enrollments')
  sql("update public.profiles set class_code='10G6' where id="+q(lu['id']))
  # Invalid/fabricated teacher fields are ignored at new account creation.
  extra=page();extra.goto(ORIGIN+'/login.html');response=signup_api(extra,'class-fixture-forged-'+uuid.uuid4().hex[:8]+'@example.com',classCode='10G3',teacherId=r['id'],assignedTeacher={'email':RIHAM,'id':r['id']});fu=response.json()['user'];created.append(fu['id'])
  check(fu['classCode']=='10G3' and fu['assignedTeacher']['id']==m['id'],'signup ignores forged teacher fields and uses the selected class mapping')
  # Verification and email changes resolve/revoke pending links without fake identities.
  sql('update auth.users set email_confirmed_at=null where id='+q(m['id']))
  check(sql('select count(*) from public.profiles where class_code in (\'10G1\',\'10G2\',\'10G3\',\'10G4\') and assigned_teacher_id is null').stdout.strip()=='5' and own(m['id'],'select count(*) from public.learning_responses').stdout.strip()=='0','an unverified teacher email cannot retain access through a stale assignment')
  sql('update auth.users set email_confirmed_at=now() where id='+q(m['id']))
  check(len(json.loads(own(m['id'],'select public.inneru_classroom()').stdout)['students'])==5,'verifying the matching email resolves pending links and restores only its classes')
  sql('update auth.users set email='+q('class-fixture-moved-'+uuid.uuid4().hex[:8]+'@example.com')+' where id='+q(m['id']))
  check(own(m['id'],'select count(*) from public.learning_responses').stdout.strip()=='0','changing a teacher email removes access to students assigned to the former email')
  sql('update auth.users set email='+q(MARYAM)+' where id='+q(m['id']))
  canonical=sql("select jsonb_agg(jsonb_build_array(id,role,class_code,assigned_teacher_email,assigned_teacher_id) order by id) from public.profiles;").stdout
  sql((ROOT/'supabase/migrations/005_student_classes.sql').read_text())
  check(sql("select jsonb_agg(jsonb_build_array(id,role,class_code,assigned_teacher_email,assigned_teacher_id) order by id) from public.profiles;").stdout==canonical,'reapplying migration 005 preserves saved classes, canonical teacher links and approved roles')
  sql((ROOT/'supabase/setup.sql').read_text())
  check(sql("select jsonb_agg(jsonb_build_array(id,role,class_code,assigned_teacher_email,assigned_teacher_id) order by id) from public.profiles;").stdout==canonical,'the full installer remains idempotent with classified students and linked teachers')
  check(own(u['id'],'select public.inneru_join_class('+q(wrong['join_code'])+');',False).returncode!=0,'rerunning the full installer preserves retired invitation permissions')
  check(sql("update public.school_classes set teacher_email='riham.hassan@moe.sch.ae' where code='10G1';",False).returncode!=0,'database constraints reject an incorrect class-to-teacher mapping')
  check(own(u['id'],"update public.school_classes set teacher_email='riham.hassan@moe.sch.ae' where code='10G1';",False).returncode!=0,'authenticated students cannot modify the mapping catalog')
  check(mt.request.post(ORIGIN+'/api/learning?action=select-class',data={'classCode':'10G1'}).status==403,'an approved teacher cannot take the student class selection action')
  for width in [1440,768,390,320]:
   rt.set_viewport_size({'width':width,'height':1000});check(rt.evaluate('document.documentElement.scrollWidth<=innerWidth'),'assigned teacher dashboard fits '+str(width)+'px')
  p.request.post(ORIGIN+'/__test/legacy-schema',data={'enabled':True})
  check(p.request.get(ORIGIN+'/api/learning?action=state').status==503 and rt.request.get(ORIGIN+'/api/learning?action=classroom').status==503,'old database installations return an explicit update requirement instead of invitation-based rosters')
  p.reload();p.wait_for_selector('[data-cloud-panel] .iu-cloud-notice')
  check(p.locator('[data-cloud-join]').count()==0 and 'database update' in p.locator('[data-cloud-panel]').inner_text(),'an old database cannot bring back the student class-code form')
  p.request.post(ORIGIN+'/__test/legacy-schema',data={'enabled':False})
  sql('delete from auth.users where id='+q(m['id']))
  sql('update auth.users set email='+q(MARYAM)+' where id='+q(r['id']))
  check({s['classCode'] for s in json.loads(own(r['id'],'select public.inneru_classroom()').stdout)['students']}=={'10G1','10G2','10G3','10G4'},'changing between configured teacher emails relinks only the new email’s classes without a unique-ID collision')
  sql('update auth.users set email='+q(RIHAM)+' where id='+q(r['id']))
  check({s['classCode'] for s in json.loads(own(r['id'],'select public.inneru_classroom()').stdout)['students']}=={'10G5','10G6'},'restoring a teacher email returns access only to its configured classes')
  sql('delete from auth.users where id='+q(r['id']))
  check(sql('select count(*) from public.profiles where class_code in (\'10G5\',\'10G6\') and assigned_teacher_id is null').stdout.strip()=='2' and sql('select teacher_id is null from public.school_teachers where email='+q(RIHAM)).stdout.strip()=='t','deleting a teacher account safely returns its students to pending assignment')
  check(not errors,'no uncaught JavaScript errors in signup, class selection, linking, dashboards or feedback: '+str(errors))
  browser.close()
 print(checks,'student-class checks passed.')
finally:
 proc.terminate();proc.wait(timeout=10)
 for uid in created:sql('delete from auth.users where id='+q(uid),ok=False)
