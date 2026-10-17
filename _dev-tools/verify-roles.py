"""Role-bound dashboards, teacher approval and avatar persistence against PostgreSQL."""
import json,os,subprocess,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
proc=subprocess.Popen(['node',str(ROOT/'_dev-tools/account-test-server.js')],env={**os.environ,'INNERU_DB_TEST_CONTAINER':'inneru-db-check'},stdout=subprocess.PIPE,text=True)
ORIGIN=json.loads(proc.stdout.readline())['origin'];checks=0;errors=[]
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def sql(s):return subprocess.check_output(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'],input=s,text=True).strip()
def q(v):return "'"+str(v).replace("'","''")+"'"
def entry(p,role='student'):
 p.goto(ORIGIN+'/login.html?nosw=1');p.locator('[data-select-role='+role+']').click();p.wait_for_selector('#entry-email')
def create(p,email,name,avatar='sage'):
 p.locator('[data-auth-mode=signup]').first.click();p.locator('#entry-email').fill(email);p.locator('#entry-nickname').fill(name);p.locator('#entry-class').select_option('10G1');p.locator('#entry-password').fill('Fixture-Role-Test-123');p.locator('#entry-confirm').fill('Fixture-Role-Test-123');p.locator('#gate-entry-form [type=submit]').click();p.locator('input[value='+avatar+']').check();p.locator('#gate-avatar-form [type=submit]').click()
def login(p,email):
 p.locator('#entry-email').fill(email);p.locator('#entry-password').fill('Fixture-Role-Test-123');p.locator('#gate-entry-form [type=submit]').click()
def student(p):p.wait_for_url('**/index.html#dashboard');p.wait_for_selector('.sd-page');p.wait_for_function('!document.body.classList.contains("iu-access-pending")')
def teacher(p):p.wait_for_url('**/index.html#teacher');p.wait_for_selector('.td-page');p.wait_for_function('!document.body.classList.contains("iu-access-pending")')
def logout(p):
 p.wait_for_selector('.iu-account-menu');p.locator('.iu-account-menu summary').click();p.locator('[data-account-logout]').click();p.wait_for_url('**/login.html')
def session(p):return p.request.get(ORIGIN+'/api/auth?action=session').json()['user']
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);ctx=browser.new_context(service_workers='block',viewport={'width':1680,'height':1100});p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(ORIGIN+'/index.html?nosw=1#teacher');p.wait_for_selector('.iu-access-notice');check(p.locator('.td-page').count()==0,'anonymous users cannot open the teacher dashboard')
  p.goto(ORIGIN+'/index.html?nosw=1#dashboard');p.wait_for_selector('.iu-access-notice');check(p.locator('.sd-page').count()==0,'anonymous users cannot open an account’s student dashboard')
  p.goto(ORIGIN+'/login.html?nosw=1');check(p.locator('.gate-role-teacher img').get_attribute('src').endswith('teacher-guide-hijab.webp') and p.locator('.gate-role-teacher img').evaluate('e=>e.complete&&e.naturalWidth>0'),'the teacher card loads the new premium hijab illustration')
  email='role-student-'+uuid.uuid4().hex[:8]+'@example.com';entry(p);create(p,email,'Student One','noor');student(p);u=session(p)
  check(u['role']=='student' and p.evaluate('state.authUserId')==u['id'],'student identity and role come from the same verified database account')
  check(u['avatarId']=='noor' and p.locator('.iu-avatar-sheet-2').count()>0,'new avatar suggestions persist in the database and appear on the dashboard')
  check(p.locator('a[href="#teacher"]').count()==0,'student navigation contains no Teacher Dashboard link')
  p.evaluate('location.hash="teacher"');student(p);check(p.locator('.td-page').count()==0,'a typed teacher URL returns a student to Student Dashboard')
  p.evaluate('state.role="teacher";state.authRole="teacher";save();location.hash="teacher"');student(p)
  check(session(p)['role']=='student' and p.locator('.td-page').count()==0,'editing browser role fields cannot grant teacher access')
  denied=p.request.get(ORIGIN+'/api/learning?action=classroom');check(denied.status==403,'student sessions cannot read cloud classroom data')
  logout(p);entry(p,'teacher');login(p,email);p.wait_for_selector('[data-teacher-request]')
  check(session(p)['role']=='student' and p.locator('.td-page').count()==0,'signing a student account into the teacher card explains its role mismatch')
  p.locator('[data-teacher-request]').click();p.wait_for_function('document.querySelector("[data-role-request-status]").textContent.includes("requested")')
  check(sql('select requested_role from public.profiles where id='+q(u['id'])+';')=='teacher' and session(p)['role']=='student','teacher requests are recorded without granting permission')
  denied_sql=subprocess.run(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'],input='set role authenticated;set request.jwt.claim.sub='+q(u['id'])+';select public.inneru_approve_teacher('+q(email)+');',text=True,capture_output=True)
  check(denied_sql.returncode!=0,'the approval function is not executable by an authenticated student')
  sql('select public.inneru_approve_teacher('+q(email)+');');p.locator('[data-role-refresh]').click();teacher(p);approved=session(p)
  check(approved['role']=='teacher' and approved['id']==u['id'],'owner approval opens Teacher Dashboard for the existing account without creating another identity')
  check(p.locator('.topbar .name').inner_text()==approved['name'],'teacher identity is visible in the dashboard header')
  check(p.locator('a[href="#dashboard"]').count()==0 and p.locator('a[href="#world"]').count()==0,'teacher navigation exposes the teacher workspace instead of student routes')
  p.evaluate('location.hash="dashboard"');teacher(p);check(p.locator('.sd-page').count()==0,'a typed student dashboard URL cannot open for a teacher')
  p.evaluate('location.hash="muscle"');teacher(p);check(p.locator('.mq-world').count()==0,'teacher accounts stay in the teacher workspace instead of opening student missions')
  p.wait_for_function('window.InneruCloud.status()==="Teacher classroom connected"')
  denied=p.request.post(ORIGIN+'/api/learning?action=save',data={'snapshot':{'name':'Not student','done':[],'rewards':[]},'revision':0,'requestId':str(uuid.uuid4())})
  check(denied.status==403,'teacher accounts cannot upload student XP through the learning API')
  direct=subprocess.run(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-v','ON_ERROR_STOP=1','-qAt'],input='set role authenticated;set request.jwt.claim.sub='+q(u['id'])+";select public.inneru_save('{\"done\":[],\"rewards\":[]}'::jsonb,0,"+q(str(uuid.uuid4()))+');',text=True,capture_output=True)
  check('insufficient_privilege' in direct.stderr,'direct database RPC calls also reject teacher attempts to write student XP')
  p.evaluate('InneruTeacher.upsert({v:1,id:"local-student-record",n:"Teacher A private register",x:0,k:"000000",w:"000000",r:[]})')
  check(len(p.evaluate('InneruTeacher.list()'))==1,'an approved teacher can use their own browser register')
  p.screenshot(path='/workspace/cloud-onboarding/role-teacher-dashboard.png',full_page=True)
  logout(p);p.go_back();p.wait_for_selector('.iu-access-notice');check(p.locator('.td-page').count()==0,'browser Back after sign-out cannot restore an authenticated teacher dashboard')
  entry(p,'student');login(p,email);teacher(p)
  check(session(p)['role']=='teacher','the database role wins even when an approved teacher selects the student card')
  logout(p);entry(p,'student');email2='role-teacher2-'+uuid.uuid4().hex[:8]+'@example.com';create(p,email2,'Teacher Two','sami');student(p);id2=session(p)['id'];sql('select public.inneru_approve_teacher('+q(email2)+');');p.reload();teacher(p)
  check(len(p.evaluate('InneruTeacher.list()'))==0,'different teacher accounts receive separate browser classroom registers')
  check(session(p)['id']==id2 and p.evaluate('state.authUserId')==id2,'switching accounts binds the dashboard to the new verified identity')
  for width in [1680,768,390,320]:
   p.set_viewport_size({'width':width,'height':950});check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'role-specific teacher dashboard and avatar fit {width}px')
  sql("update public.profiles set role='student',requested_role='student' where id="+q(id2)+';');p.reload();p.wait_for_selector('#gate-class-form');p.locator('#entry-class').select_option('10G1');p.locator('#gate-class-form [type=submit]').click();student(p)
  check(session(p)['role']=='student' and p.locator('.td-page').count()==0,'a revoked teacher role is reflected on the next verified page load')
  check(not errors,'no JavaScript exceptions across role requests, approval, identity changes or dashboard restrictions: '+str(errors))
  browser.close()
 print(checks,'role dashboard checks passed.')
finally:proc.terminate();proc.wait(timeout=10)
