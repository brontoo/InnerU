"""Real PostgreSQL + Auth fixture: classroom controls, sequence gates, distinct views and previews.
School emails are local matching fixtures only. No production account or email is used.
"""
import json,os,subprocess,uuid
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, CONTAINER, start_fixture
ROOT=Path(__file__).resolve().parents[1];DB='inneru_mission_access_check'
ENV={**os.environ,'INNERU_DB_TEST_CONTAINER':CONTAINER,'INNERU_DB_TEST_DATABASE':DB}
proc,ORIGIN=start_fixture(ENV,database=True);checks=0;created=[];errors=[]
PASSWORD='Local-Mission-Access-Fixture-123'
def q(v):return "'"+str(v).replace("'","''")+"'"
def sql(s,ok=True):
 r=subprocess.run(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-qAt'],input=s,text=True,capture_output=True)
 if ok and r.returncode:raise AssertionError(r.stderr)
 return r

def own(uid,s,ok=True):return sql('set role authenticated;set request.jwt.claim.sub='+q(uid)+';'+s,ok)
def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label,flush=True)
def api(page,action,data=None):return page.request.get(ORIGIN+'/api/learning?action='+action) if data is None else page.request.post(ORIGIN+'/api/learning?action='+action,data=data)
def controls(page,code,system,number,unlocked):return api(page,'set-mission-control',{'classCode':code,'system':system,'number':number,'unlocked':unlocked})
def authorize(page,system,number,preview=False):return api(page,'authorize-mission',{'system':system,'number':number,'preview':preview})
def save(page,snap):return api(page,'save',{'snapshot':snap,'revision':api(page,'state').json()['progress']['revision'],'requestId':str(uuid.uuid4())})
def navigate(page,fragment,selector):
 page.evaluate('(h)=>location.hash=h',fragment);page.wait_for_selector(selector)
def classroom(page):return api(page,'classroom').json()
try:
 sql("delete from auth.users where lower(email) in ('riham.hassan@moe.sch.ae','sf.alhammadi@moe.sch.ae') or email like 'mission-fixture-%@example.com';delete from public.class_mission_settings;")
 with sync_playwright() as pw:
  browser=launch(pw)
  def account(email,name,code=None,teacher=False):
   context=new_context(browser, service_workers='block',viewport={'width':1440,'height':1000},reduced_motion='reduce');p=context.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
   response=p.request.post(ORIGIN+'/api/auth?action=signup',data={'email':email,'password':PASSWORD,'name':name,'avatarId':'sage','requestedRole':'teacher' if teacher else 'student',**({'classCode':code} if code else {})})
   assert response.ok,response.text();user=response.json()['user'];created.append(user['id'])
   if teacher:sql('select public.inneru_approve_teacher('+q(email)+');')
   return p,user
  teacher,t=account('Riham.hassan@moe.sch.ae','Riham fixture',teacher=True)
  maryam,m=account('Sf.Alhammadi@moe.sch.ae','Maryam fixture',teacher=True)
  student,u=account('mission-fixture-five@example.com','Student five','10G5')
  other_class,v=account('mission-fixture-six@example.com','Student six','10G6')
  other_teacher,w=account('mission-fixture-one@example.com','Student one','10G1')
  teacher.goto(ORIGIN+'/index.html?nosw=1#teacher');teacher.wait_for_selector('[data-teacher-page=overview]')
  expected=['home','dashboard','preview','board']
  check(teacher.locator('[data-teacher-navigation] [data-teacher-view]').evaluate_all('(a)=>a.map(n=>n.dataset.teacherView)')==expected,'teacher navigation contains only Explore Worlds, Dashboard, Mission Preview and Achievements Board')
  check(len(set(teacher.locator('[data-teacher-navigation] a').evaluate_all('(a)=>a.map(n=>n.getAttribute("href"))')))==4,'the four main teacher destinations have distinct routes')
  headings=[]
  for view in ['overview','students','answers','controls','analytics']:
   teacher.locator('.td-tabs a[href="'+('#teacher' if view=='overview' else '#teacher?view='+view)+'"]').click();teacher.wait_for_selector('[data-teacher-page='+view+']');teacher.wait_for_selector('[data-teacher-view=dashboard][aria-current=page]')
   headings.append(teacher.locator('.td-page h1').inner_text())
   check(teacher.locator('.td-hero').count()==0,view+' opens its own dashboard content without a repeated welcome hero')
  check(len(set(headings))==5,'every dashboard tab has a different relevant heading')
  teacher.locator('[data-teacher-view=preview]').click();teacher.wait_for_selector('.td-preview-library')
  check(teacher.locator('.td-preview-list a').count()==45,'unchanged teacher preview library includes all 39 missions and six final challenges')
  teacher.locator('[data-teacher-view=home]').click();teacher.wait_for_selector('.explore-screen')
  check(teacher.url.endswith('#home') and teacher.locator('.anatomy-lab [data-system]').count()==6,'Explore Worlds opens the shared student home with all six body systems')
  teacher.locator('[data-teacher-view=dashboard]').click();teacher.wait_for_selector('[data-teacher-page=overview]')
  data=api(teacher,'mission-controls').json()
  check([c['code'] for c in data['classes']]==['10G5','10G6'],'teacher controls are restricted to assigned classes')
  check([s['id'] for s in data['classes'][0]['systems']]==['integumentary','skeletal','muscle','respiratory','circ','excretory'],'Control Panel keeps the portal’s six systems in their existing order')
  check([c['code'] for c in api(maryam,'mission-controls').json()['classes']]==['10G1','10G2','10G3','10G4'],'Maryam receives controls only for her four assigned classes')
  check(controls(teacher,'10G1','skeletal',0,False).status==403 and controls(maryam,'10G5','skeletal',0,False).status==403,'teachers cannot change another teacher’s class settings')
  check(api(student,'mission-controls').status==403 and controls(student,'10G5','skeletal',0,False).status==403,'students cannot read or change teacher controls through the API')
  check(own(u['id'],"insert into public.class_mission_settings(class_code,system_id,mission_number,unlocked) values('10G5','skeletal',0,false);",False).returncode!=0,'students cannot bypass controls through direct database writes')
  controls(maryam,'10G1','muscle',2,False)
  check(own(t['id'],"select count(*) from public.class_mission_settings where class_code='10G1';").stdout.strip()=='0' and own(m['id'],"select count(*) from public.class_mission_settings where class_code='10G1';").stdout.strip()!='0','settings RLS does not expose another teacher’s classes')
  check(authorize(student,'skeletal',1).status==403,'a class starts locked until its teacher explicitly unlocks a system')
  for system in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:assert controls(teacher,'10G5',system,0,True).ok
  controls(teacher,'10G6','skeletal',0,True);controls(maryam,'10G1','skeletal',0,True)
  check(authorize(student,'skeletal',1).ok and authorize(student,'skeletal',2).status==403,'the first mission is available and later missions require prior completion')
  check(authorize(student,'skeletal',8).status==403,'the final challenge requires all preceding missions')
  for system in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:
   check(authorize(student,system,1).ok and authorize(student,system,2).status==403,system+' enforces its own current mission sequence')
  check(authorize(student,'skeletal',1,True).status==403 and own(u['id'],"select public.inneru_authorize_mission('skeletal',1,true);",False).returncode!=0,'student URLs and direct RPCs cannot grant teacher preview access')
  check(controls(teacher,'10G5','skeletal',0,False).ok,'teacher can lock a whole body system')
  check(authorize(student,'skeletal',1).status==403 and authorize(other_class,'skeletal',1).ok and authorize(other_teacher,'skeletal',1).ok,'a system lock applies only to the selected assigned class')
  teacher.reload();teacher.wait_for_selector('[data-teacher-page=overview]');teacher.locator('.td-tabs a[href="#teacher?view=controls"]').click();teacher.wait_for_selector('[data-control-system=skeletal]')
  section=teacher.locator('[data-control-system=skeletal]')
  check('System locked' in section.inner_text(),'system lock survives refresh and is shown in the Control Panel')
  fresh=new_context(browser, service_workers='block');fresh.add_cookies(teacher.context.cookies());newpage=fresh.new_page();newpage.goto(ORIGIN+'/index.html?nosw=1#teacher?view=controls');newpage.wait_for_selector('[data-control-system=skeletal]')
  check('System locked' in newpage.locator('[data-control-system=skeletal]').inner_text(),'a new teacher session restores persisted lock settings')
  student.goto(ORIGIN+'/index.html?nosw=1#mission/1');student.wait_for_selector('.iu-mission-access-notice')
  student.wait_for_function('document.querySelector(".iu-mission-access-notice").textContent.includes("teacher has locked")')
  check(student.locator('.skel-mission').count()==0,'a direct mission URL cannot open a teacher-locked student mission')
  navigate(student,'world','.iu-mission-lock-note');check('Your teacher has locked this mission.' in student.locator('.iu-mission-lock-note').first.inner_text(),'student mission cards explain the teacher lock visibly')
  student.evaluate('state.done=[1,2,3,4,5,6,7,8]');navigate(student,'mission/2','.iu-mission-access-notice');student.wait_for_function('document.querySelector(".iu-mission-access-notice").textContent.includes("teacher has locked")')
  check(student.locator('.skel-mission').count()==0,'forged client completion cannot bypass a teacher lock')
  one={'name':'Student five','done':[1],'rewards':['activity1','q1-0','q1-1','q1-2'],'assessment':{'version':1,'responses':[{'id':'skeletal:1:q0','system':'skeletal','mission':1,'kind':'check','answer':'Bone','at':'2026-10-18T08:00:00Z'}]}}
  check(save(student,one).status==403 and sql('select total_xp from public.student_progress where user_id='+q(u['id'])).stdout.strip()=='0','locked mission work cannot mint XP or completion through the save API')
  check(own(u['id'],'select public.inneru_save('+q(json.dumps(one))+'::jsonb,0,'+q(str(uuid.uuid4()))+');',False).returncode!=0,'direct database save RPCs enforce the same teacher lock')
  section.locator('[data-control-number="0"]').click();teacher.wait_for_function('document.querySelector("[data-control-system=skeletal] [data-system-status]").textContent==="System unlocked"')
  check(authorize(student,'skeletal',1).ok,'teacher unlock button saves the class setting')
  two={**one,'done':[1,2],'rewards':one['rewards']+['activity2','q2-0','q2-1','q2-2']}
  check(save(student,two).status==403,'a forged bulk payload cannot complete the current and later mission in a single unsaved jump')
  check(save(student,one).ok and authorize(student,'skeletal',2).ok,'completing the current mission with its required tasks opens the next mission')
  student.goto(ORIGIN+'/index.html?nosw=1&mission-check=2#dashboard');student.wait_for_selector('.sd-page');student.wait_for_function('["Saved to your account","Choose a saved version"].includes(InneruCloud.status())')
  if student.locator('[data-cloud-use=remote]').count():student.locator('[data-cloud-use=remote]').click()
  navigate(student,'mission/2','[data-skeletal-mission="2"]')
  check('Bone detective' in student.locator('.skel-mission-heading').inner_text(),'the real student lesson opens after the saved prerequisite is complete')
  check(authorize(student,'skeletal',3).status==403,'mission three stays locked until mission two is complete')
  check(sql('select public.inneru_mission_gate('+q(u['id'])+",'skeletal-3','{\"done\":[2]}'::jsonb)->>'allowed';").stdout.strip()=='false','all earlier missions are required, including gaps in historical records')
  check(own(u['id'],'select public.inneru_mission_gate('+q(u['id'])+",'skeletal-3','{\"done\":[1,2]}'::jsonb);",False).returncode!=0,'students cannot invoke the internal helper with a forged progress baseline')
  check(sql('select count(*) from public.reward_definitions where system_id is not null and mission_id is null;').stdout.strip()=='0','every existing body-system task credit is bound to its mission gate')
  check(controls(teacher,'10G5','skeletal',2,False).ok and authorize(student,'skeletal',2).status==403,'teacher can lock an individual mission even after its prerequisite is complete')
  check(save(student,two).status==403,'individual mission locks also prevent new learning writes')
  student.evaluate('window.dispatchEvent(new Event("focus"))');student.wait_for_function('document.querySelector(".iu-mission-access-notice")?.textContent.includes("teacher has locked")')
  check(student.locator('[data-skeletal-mission="2"]').count()==0,'returning to an open lesson rechecks and applies a new teacher lock')
  student.reload();student.wait_for_selector('.iu-mission-access-notice');student.wait_for_function('document.querySelector(".iu-mission-access-notice").textContent.includes("teacher has locked")')
  check(student.locator('[data-skeletal-mission="2"]').count()==0,'a persisted individual lock closes the student lesson after refresh')
  controls(teacher,'10G5','skeletal',2,True)
  check(save(student,two).ok and authorize(student,'skeletal',3).ok,'unlocking and completing mission two advances persisted progression')
  invalid={**two,'done':[1,2,3]}
  result=save(student,invalid)
  check(result.ok and 3 not in result.json()['snapshot']['done'],'a client completion flag without the required tasks cannot complete a mission')
  # Existing records survive a later lock and can sync unchanged.
  controls(teacher,'10G5','skeletal',0,False)
  check(save(student,two).ok,'locking a system preserves previously saved work and permits unchanged account sync')
  student.reload();student.wait_for_selector('.iu-mission-access-notice');navigate(student,'teacher?view=controls','.sd-page')
  check(student.locator('.td-page').count()==0,'a student cannot enter the teacher Control Panel by changing the URL')
  navigate(student,'mission/1?preview=1','.iu-mission-access-notice');student.wait_for_function('document.querySelector(".iu-mission-access-notice").textContent.includes("Only teachers")')
  check(student.locator('.skel-mission').count()==0,'the old preview query parameter cannot bypass student locks')
  navigate(student,'detective?preview=1','.dd-practice');check(student.locator('.iu-teacher-preview-bar').count()==0,'unrelated existing detective practice remains available without teacher-preview access')
  # All previews are read-only, including every final and every locked lesson.
  baseline=sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;').stdout
  settings=sql('select jsonb_agg(to_jsonb(s) order by class_code,system_id,mission_number) from public.class_mission_settings s;').stdout
  teacher.locator('[data-teacher-view=preview]').click();teacher.wait_for_selector('.td-preview-library');links=teacher.locator('.td-preview-list a').evaluate_all('(a)=>a.map(n=>n.getAttribute("href"))')
  before=teacher.evaluate('localStorage.getItem("bodyquest-v1")')
  for href in links:
   parsed=teacher.evaluate('(href)=>InneruMissionAccess.parse(href)',href);mission_id=parsed['world']['id']+'-'+str(parsed['number'])
   teacher.evaluate('(h)=>location.hash=h',href)
   teacher.wait_for_selector('.iu-teacher-preview-bar[data-preview-mission="'+mission_id+'"]',timeout=20000)
   teacher.evaluate('reward("activity1",999);save()')
   expected_title=parsed['world']['final'] if parsed['number']>len(parsed['world']['titles']) else parsed['world']['titles'][parsed['number']-1]
   check(expected_title.lower() in teacher.locator('main h1').inner_text().lower() and teacher.evaluate('localStorage.getItem("bodyquest-v1")')==before,mission_id+' preview shows the correct lesson and does not change saved account progress')
  teacher.locator('.iu-teacher-preview-bar a[href="#home"]').click();teacher.wait_for_selector('.explore-screen');teacher.locator('[data-teacher-view=dashboard]').click();teacher.wait_for_selector('[data-teacher-page=overview]')
  check(teacher.evaluate('localStorage.getItem("bodyquest-v1")')==before,'leaving preview restores the teacher’s original account record')
  check(sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;').stdout==baseline and sql('select jsonb_agg(to_jsonb(s) order by class_code,system_id,mission_number) from public.class_mission_settings s;').stdout==settings,'all teacher previews leave every student’s database progress and lock settings unchanged')
  # Keep existing records and locks when the installer is reapplied.
  sql((ROOT/'supabase/setup.sql').read_text())
  check(sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;').stdout==baseline and authorize(student,'skeletal',1).status==403,'reapplying the installer preserves student records and persistent teacher locks')
  for width in [1440,768,390,320]:
   teacher.set_viewport_size({'width':width,'height':1000});teacher.locator('.td-tabs a[href="#teacher?view=controls"]').click();teacher.wait_for_selector('[data-teacher-page=controls]')
   check(teacher.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)+'px Control Panel fits without page overflow')
  teacher.set_viewport_size({'width':1440,'height':1000});teacher.screenshot(path=artifact('teacher-control-panel.png'),full_page=True)
  check(not errors,'no uncaught browser errors in teacher views, controls, previews or student locks: '+str(errors))
  browser.close()
 print(checks,'mission access checks passed.')
finally:
 proc.terminate();proc.wait(timeout=10)
 for uid in created:sql('delete from auth.users where id='+q(uid),False)
