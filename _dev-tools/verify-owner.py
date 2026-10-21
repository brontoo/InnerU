"""Owner staffing: real SQL/RLS + production gateways and UI, local fixtures only."""
import json,subprocess,uuid
from test_support import DatabaseFixture,playwright_session,launch,new_context,artifact,CONTAINER
f=DatabaseFixture('inneru_owner_check');checks=0;errors=[]
def q(value):return "'"+str(value).replace("'","''")+"'"
def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label,flush=True)
def own(uid,statement,role='authenticated'):
 return subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d',f.database,'-v','ON_ERROR_STOP=1','-qAt'],input='set role '+role+';'+('set request.jwt.claim.sub='+q(uid)+';' if uid else '')+statement,text=True,capture_output=True)
def api(page,action='staffing',data=None):
 url=f.origin+'/api/owner?action='+action
 return page.request.get(url) if data is None else page.request.post(url,data=data)
def change(code,target,expected):return {'classCode':code,'teacherId':target,'expectedTeacherEmail':expected}
def assign(page,*changes):return api(page,'assign',{'changes':list(changes)})
def roster(page):return f.api(page,'classroom').json()
def pending(browser,email,name):
 page=new_context(browser,service_workers='block',viewport={'width':1440,'height':1100}).new_page()
 r=page.request.post(f.origin+'/api/auth?action=signup',data={'email':email,'password':'Local-Owner-Fixture-123','name':name,'avatarId':'sage','requestedRole':'teacher'})
 assert r.ok,r.text()
 return page,r.json().get('user')
try:
 f.sql('delete from auth.users;delete from public.staffing_audit;')
 with playwright_session() as pw:
  browser=launch(pw)
  owner,o=f.account(browser,'owner-fixture@example.com','Owner fixture');owner.on('pageerror',lambda e:errors.append(str(e)));f.sql("update public.profiles set role='admin' where id="+q(o['id']))
  maryam,m=f.account(browser,'sf.alhammadi@moe.sch.ae','Maryam fixture')
  riham,r=f.account(browser,'riham.hassan@moe.sch.ae','Riham fixture')
  students=[f.account(browser,'owner-student-'+str(n)+'@example.com','Student '+str(n),'10G'+str(n)) for n in range(1,7)]
  request,t=pending(browser,'pending-teacher@example.com','Pending teacher')
  unverified,_=pending(browser,'confirm@example.com','Unverified teacher');unverified_id=f.sql("select id from auth.users where email='confirm@example.com'")
  anon=new_context(browser,service_workers='block').new_page()
  for page,status,label in [(anon,401,'anonymous'),(students[0][0],403,'student'),(riham,403,'teacher'),(request,403,'pending teacher')]:
   for action,data in [('staffing',None),('assign',{'changes':[change('10G5',m['id'],'riham.hassan@moe.sch.ae')]}),('approve',{'teacherId':t['id']})]:
    check(api(page,action,data).status==status,label+' cannot '+action+' through the API')
  for uid,label in [(None,'anonymous'),(students[0][1]['id'],'student'),(r['id'],'teacher'),(t['id'],'pending teacher')]:
   for statement in ['select public.inneru_owner_staffing();','select public.inneru_owner_assign(\'[]\'::jsonb);','select public.inneru_owner_approve('+q(t['id'])+');']:
    check(own(uid,statement,'anon' if uid is None else 'authenticated').returncode!=0,label+' cannot call owner SQL directly')
  check(api(owner).ok,'a database-approved admin can read staffing')
  state=api(owner).json();check([c['code'] for c in state['classes']]==['10G1','10G2','10G3','10G4','10G5','10G6'],'owner sees exactly the existing six classes')
  check({x['id'] for x in state['teachers']}=={m['id'],r['id'],t['id'],unverified_id,o['id']},'approval list contains existing teacher/admin accounts and requests, never ordinary students')
  check(owner.request.post(f.origin+'/api/owner?action=assign',headers={'Origin':'https://untrusted.example'},data={'changes':[]}).status==403,'cross-origin owner mutations are rejected')
  check(owner.request.get(f.origin+'/api/owner?action=approve').status==405,'approval cannot be triggered by a GET request')
  for changes in [[],[change('10G7',m['id'],None)],[change('10G5','bad-id','riham.hassan@moe.sch.ae')],[change('10G5',str(uuid.uuid4()),'riham.hassan@moe.sch.ae')],[change('10G5',students[0][1]['id'],'riham.hassan@moe.sch.ae')],[change('10G5',unverified_id,'riham.hassan@moe.sch.ae')],[change('10G5',m['id'],'riham.hassan@moe.sch.ae')]*2]:
   check(api(owner,'assign',{'changes':changes}).status==400,'invalid/missing/duplicate class or ineligible teacher is rejected')
  for target in [students[0][1]['id'],unverified_id,o['id'],str(uuid.uuid4())]:
   check(api(owner,'approve',{'teacherId':target}).status==400,'approval rejects ordinary, unverified, owner or missing account')
  duplicate=str(uuid.uuid4());f.sql("insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values ("+q(duplicate)+",'OWNER-FIXTURE@example.com','{\"requested_role\":\"teacher\"}',now());")
  check(api(owner,'approve',{'teacherId':duplicate}).status==400 and f.sql('select role from public.profiles where id='+q(o['id']))=='admin','ambiguous verified email cannot approve or demote a different account, including the last owner')
  check(assign(owner,change('10G5',duplicate,'riham.hassan@moe.sch.ae')).status==400,'ambiguous verified emails cannot silently replace another account link')
  f.sql('delete from auth.users where id='+q(duplicate))
  check(own(o['id'],"select public.inneru_approve_teacher('pending-teacher@example.com');").returncode!=0,'legacy SQL-only approval helper stays inaccessible to authenticated JWTs')
  check(own(o['id'],"update public.profiles set role='student' where id="+q(o['id'])+';').returncode!=0,'the last owner cannot change their role through direct writes')
  check(f.sql('select role from public.profiles where id='+q(o['id']))=='admin','staffing actions cannot remove or demote an owner')
  # An existing class teacher may be designated owner without changing assignments.
  f.sql("update public.profiles set role='admin' where id="+q(r['id']))
  f.open(riham,'owner','.owner-class');riham.locator('[data-owner-form] [type=submit]').click()
  check(riham.locator('#owner-10G5').input_value()==r['id'] and 'No assignment changes selected' in riham.locator('[data-owner-status]').inner_text(),'designating an assigned teacher as owner retains their current assignment without accidental edits')
  f.sql("update public.profiles set role='teacher' where id="+q(r['id']))
  riham.reload();riham.wait_for_selector('.td-page')
  # Persist an ordinary student record, class locks and a submitted response first.
  f.unlock(riham)
  f.open(students[4][0],'dashboard','.sd-page')
  initial=f.api(students[4][0],'state').json()['progress'];snapshot=initial['snapshot'];snapshot['assessment']={'responses':[{'id':'owner-example','system':'skeletal','mission':1,'title':'Owner fixture','prompt':'Supporting tissue?','answer':'Saved student writing','at':'2026-10-21T08:00:00Z'}]}
  saved=f.api(students[4][0],'save',{'snapshot':snapshot,'revision':initial['revision'],'requestId':str(uuid.uuid4())})
  assert saved.ok,saved.text()
  check(saved.ok,'student work saves before staffing changes')
  before=f.sql("select jsonb_build_object('progress',(select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p),'locks',(select jsonb_agg(to_jsonb(c) order by class_code,system_id,mission_number) from public.class_mission_settings c),'responses',(select jsonb_agg(to_jsonb(x)) from public.learning_responses x))")
  # Pending requests can be prepared, but a class assignment never approves them.
  changes=[change('10G'+str(n),t['id'],'sf.alhammadi@moe.sch.ae' if n<=4 else 'riham.hassan@moe.sch.ae') for n in range(1,7)]
  response=api(owner,'assign',{'changes':changes});assert response.ok,response.text()
  check(response.ok,'owner can assign all six classes in one atomic request')
  check(f.sql('select role from public.profiles where id='+q(t['id']))=='student' and f.api(request,'classroom').status==403,'assigning six classes to a pending teacher grants no teacher access')
  check(f.sql('select count(*) from public.profiles where class_code is not null and assigned_teacher_id='+q(t['id']))=='6','all six student profiles derive their new teacher inside SQL')
  check(roster(maryam)['students']==[] and roster(riham)['students']==[],'former teachers immediately lose every reassigned student')
  check(own(r['id'],'select count(*) from public.learning_responses;').stdout.strip()=='0','former teacher RLS cannot read saved student answers')
  check(f.api(riham,'set-mission-control',{'classCode':'10G5','system':'skeletal','number':0,'unlocked':False}).status==403,'former teacher cannot change the reassigned class controls')
  check(assign(owner,change('10G5',m['id'],'riham.hassan@moe.sch.ae')).status==409,'a stale assignment cannot overwrite a newer change')
  check(assign(owner,change('10G5',t['id'],t['email'])).ok and f.sql('select count(*) from public.staffing_audit;')=='6','unchanged assignments create no duplicate audit record')
  f.open(owner,'owner','.owner-class');owner.locator('[data-owner-approve="'+t['id']+'"]').click();owner.wait_for_selector('[data-owner-dialog][open]')
  check(t['email'] in owner.locator('[data-owner-review]').inner_text(),'approval confirmation identifies the verified teacher before granting access')
  owner.locator('[data-owner-confirm]').click();owner.wait_for_function('document.querySelector("[data-owner-status]")?.textContent.includes("Teacher approved")')
  check(next(x for x in api(owner).json()['teachers'] if x['id']==t['id'])['approved'],'owner can explicitly approve a verified teacher request through the UI')
  check({x['id'] for x in roster(request)['students']}=={u['id'] for _,u in students},'only explicit approval opens the newly assigned teacher roster')
  check(own(t['id'],'select count(*) from public.learning_responses;').stdout.strip()=='1','approved assigned teacher sees the saved response through RLS')
  check(f.api(request,'feedback',{'studentId':students[4][1]['id'],'responseId':'owner-example','note':'Assigned teacher review','reviewed':True,'submissionAt':'2026-10-21T08:00:00Z'}).ok,'newly assigned approved teacher can review existing work')
  check(api(owner,'approve',{'teacherId':t['id']}).ok and f.sql("select count(*) from public.staffing_audit where action='approval'")=='1','repeated approval is idempotent and creates no duplicate audit entry')
  # Split classes again, then remove one teacher while keeping student membership.
  check(assign(owner,change('10G1',m['id'],t['email']),change('10G5',r['id'],t['email'])).ok,'owner can reassign a batch to different approved teachers')
  check([x['classCode'] for x in roster(maryam)['students']]==['10G1'] and [x['classCode'] for x in roster(riham)['students']]==['10G5'],'each teacher sees only the newly assigned class')
  for p,u in students:
   visible=own(u['id'],'select count(*) from public.profiles;').stdout.strip()
   check(visible=='1' and f.api(p,'state').json()['profile']['classCode']==u['classCode'],u['classCode']+' student retains only their own profile and class')
  # All-or-nothing validation of a mixed valid/invalid batch.
  audit_count=f.sql('select count(*) from public.staffing_audit;')
  check(assign(owner,change('10G1',None,m['email']),change('10G9',None,None)).status==400 and f.sql("select teacher_email from public.school_classes where code='10G1'")==m['email'] and f.sql('select count(*) from public.staffing_audit;')==audit_count,'invalid batch rolls back assignments and audit records atomically')
  check(assign(owner,change('10G5',None,r['email'])).ok,'owner can remove a class teacher without removing the class')
  profile=f.api(students[4][0],'state').json()['profile'];check(profile['classCode']=='10G5' and profile['assignedTeacher']['email'] is None and roster(riham)['students']==[],'unassigned student stays in 10G5 and the removed teacher loses access')
  students[4][0].reload();students[4][0].wait_for_function('InneruCloud.status()==="Saved to your account"');check('No teacher assigned.' in students[4][0].locator('.iu-cloud-assignment').inner_text(),'student dashboard clearly explains an unassigned teacher without requesting class reselection')
  # A new student can select an existing temporarily unassigned class.
  newcomer,n=f.account(browser,'unassigned-class@example.com','New learner','10G5');check(n['classCode']=='10G5' and n['assignedTeacher'] is None,'signup still accepts an existing class with no assigned teacher')
  check(assign(owner,change('10G5',r['id'],None)).ok and {s['id'] for s in roster(riham)['students']}=={students[4][1]['id'],n['id']},'reassigning an empty class restores all of its current students')
  # Owner UI: displayed current mapping, cancellation, confirmation, persistence.
  owner.reload();owner.wait_for_selector('.owner-class')
  check(owner.locator('[data-teacher-view=owner][aria-current=page]').count()==1 and owner.locator('.owner-class').count()==6,'owner-only navigation highlights the six-class management screen')
  check(r['email'] in owner.locator('.owner-class').nth(4).inner_text() and owner.locator('#owner-10G5').input_value()==r['id'],'current assignment is visible before editing')
  owner.locator('#owner-10G5').select_option('');owner.locator('[data-owner-form] [type=submit]').click();owner.wait_for_selector('[data-owner-dialog][open]')
  check('lose access' in owner.locator('[data-owner-review]').inner_text(),'removals require an explicit confirmation that explains lost access')
  owner.keyboard.press('Escape');check(f.sql("select teacher_email from public.school_classes where code='10G5'")==r['email'],'Escape cancels removal without saving')
  owner.locator('[data-owner-form] [type=submit]').click()
  assert assign(owner,change('10G5',t['id'],r['email'])).ok
  owner.locator('[data-owner-confirm]').click();owner.wait_for_function('document.querySelector("[data-owner-dialog-status]")?.textContent.includes("An assignment changed")')
  check(owner.locator('[data-owner-dialog][open]').count()==1 and f.sql("select teacher_email from public.school_classes where code='10G5'")==t['email'],'stale confirmation shows a clear error and preserves the newer assignment')
  owner.locator('[data-owner-cancel]').click();assert assign(owner,change('10G5',r['id'],t['email'])).ok
  owner.locator('[data-owner-refresh]').click();owner.wait_for_selector('#owner-10G5');owner.locator('#owner-10G5').select_option('')
  owner.locator('[data-owner-form] [type=submit]').click();owner.locator('[data-owner-confirm]').click();owner.wait_for_function('document.querySelector("[data-owner-status]")?.textContent.includes("Assignments saved")')
  owner.reload();owner.wait_for_selector('.owner-class');check(owner.locator('#owner-10G5').input_value()=='' and 'No teacher assigned' in owner.locator('.owner-class').nth(4).inner_text(),'confirmed removal persists after refresh')
  # Forging the client role does not authorize API/SQL or reveal owner data.
  for page,label in [(riham,'teacher'),(students[0][0],'student')]:
   page.goto(f.origin+'/index.html?nosw=1#owner');page.wait_for_selector('.td-page' if label=='teacher' else '.sd-page')
   check(page.locator('.owner-page,[data-teacher-view=owner]').count()==0,label+' direct owner URL redirects to its own dashboard')
   page.evaluate("InneruAccess.user.role='admin';location.hash='owner'");page.wait_for_selector('.owner-page [role=alert]')
   check(page.locator('.owner-class').count()==0 and 'owner' in page.locator('.owner-page [role=alert]').inner_text(),'forged '+label+' client state cannot fetch staffing data')
  for role in ['authenticated','anon']:
   check(own(o['id'],'select * from public.staffing_audit;',role).returncode!=0 and own(o['id'],"delete from public.staffing_audit;",role).returncode!=0,role+' cannot read or alter audit records directly, including the owner JWT')
  # Neither approval nor assignment mutates assessed records or mission settings.
  after=f.sql("select jsonb_build_object('progress',(select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p where user_id<>"+q(n['id'])+"),'locks',(select jsonb_agg(to_jsonb(c) order by class_code,system_id,mission_number) from public.class_mission_settings c),'responses',(select jsonb_agg(to_jsonb(x)) from public.learning_responses x))")
  check(before==after,'staffing changes preserve student work, XP, revisions and class mission settings byte-for-byte')
  audit=api(owner).json()['audit'];check(len(audit)==14 and all(a['actor_id']==o['id'] for a in audit) and {'assignment','approval'}=={a['action'] for a in audit},'audit records successful before/after changes with the acting owner only')
  owner.evaluate("InneruPreferences.set({language:'ar'})");owner.wait_for_function('document.documentElement.dir==="rtl"');owner.wait_for_timeout(300)
  check(owner.evaluate('InneruLocale.coverage(document.querySelector(".owner-page"))')==[],'Arabic owner interface and accessible labels have authored translations')
  owner.set_viewport_size({'width':390,'height':844});check(owner.evaluate('document.documentElement.scrollWidth<=innerWidth'),'owner controls reflow on mobile in RTL')
  owner.screenshot(path=artifact('owner-mobile-arabic.png'),full_page=True)
  owner.set_viewport_size({'width':1440,'height':1100});owner.evaluate("InneruPreferences.set({language:'en'})");owner.wait_for_timeout(200);owner.screenshot(path=artifact('owner-desktop.png'),full_page=True)
  # Revocation is checked on every request, not from stale browser role state.
  f.sql("update auth.users set email_confirmed_at=null where id="+q(o['id']))
  check(api(owner).status==403,'unverified admin cannot use owner RPCs through the gateway')
  f.sql("update auth.users set email_confirmed_at=now() where id="+q(o['id']))
  f.sql("update public.profiles set role='teacher' where id="+q(o['id']))
  check(api(owner).status==403,'server rechecks owner status after it changes outside this screen')
  check(errors==[],'owner UI reports no JavaScript errors')
  browser.close()
 print('PASS',checks,'owner staffing checks; isolated local fixtures only.')
finally:f.close()
