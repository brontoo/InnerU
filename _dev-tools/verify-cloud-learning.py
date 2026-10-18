"""Browser + production API + real PostgreSQL cloud learning integration."""
import json,os,subprocess,uuid
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DB=os.environ.get('INNERU_DB_TEST_DATABASE','postgres')
proc=subprocess.Popen(['node',str(ROOT/'_dev-tools/account-test-server.js')],env={**os.environ,'INNERU_DB_TEST_CONTAINER':'inneru-db-check'},stdout=subprocess.PIPE,stderr=open('/workspace/cloud-onboarding/cloud-fixture-errors.log','w'),text=True)
ORIGIN=json.loads(proc.stdout.readline())['origin'];checks=0;errors=[]
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def signup(p,email,name):
 p.goto(ORIGIN+'/login.html?nosw=1');p.locator('[data-select-role=student]').click();p.locator('[data-auth-mode=signup]').first.click();p.locator('#entry-email').fill(email);p.locator('#entry-nickname').fill(name);p.locator('#entry-class').select_option('10G5');p.locator('#entry-password').fill('Fixture-Only-Password-123');p.locator('#entry-confirm').fill('Fixture-Only-Password-123');p.locator('#gate-entry-form [type=submit]').click();p.locator('input[value=luna]').check();p.locator('#gate-avatar-form [type=submit]').click();p.wait_for_url('**/index.html#dashboard')
def sync(p):
 try:p.wait_for_function('window.InneruCloud&&["Saved to your account","Teacher classroom connected"].includes(InneruCloud.status())',timeout=25000)
 except Exception:
  print('SYNC DEBUG',p.evaluate('({status:window.InneruCloud?.status(),panels:[...document.querySelectorAll("[data-cloud-panel]")].map(e=>e.textContent),meta:Object.fromEntries(Object.entries(localStorage).filter(([k])=>k.startsWith("inneru-cloud"))),user:window.InneruAccount.currentUser,state:JSON.stringify(state)})'),errors,flush=True)
  raise
def go(p,hash):p.evaluate('(h)=>location.hash=h',hash);p.wait_for_selector('[data-cloud-panel]')
def api(p,action,values=None):return p.evaluate('(v)=>InneruCloud.api(v.action,v.values)',{'action':action,**({'values':values} if values is not None else {})})
try:
 # Only this isolated local Auth fixture uses the school's teacher address.
 subprocess.run(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-q'],input="delete from auth.users where lower(email)='riham.hassan@moe.sch.ae';",text=True,check=True)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);student=browser.new_context(viewport={'width':1440,'height':1000},service_workers='block');p=student.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  signup(p,'db-student-'+uuid.uuid4().hex[:8]+'@example.com','Cloud learner');sync(p);uid=p.evaluate('state.authUserId')
  check(api(p,'state')['profile']['id']==uid,'a real signup creates the Auth-linked database profile and learning row')
  go(p,'dashboard');check('Saved to your account' in p.locator('[data-cloud-panel]').inner_text(),'student dashboard reports actual cloud save status')
  p.evaluate('InneruEvidence.record({id:"skeletal:1:q0",system:"skeletal",mission:1,title:"Name the tissue",prompt:"Which tissue supports the body?",answer:"Bone",correct:true});reward("activity1",20);reward("q1-0",10);state.done.push(1);save()');sync(p)
  saved=api(p,'state')['progress'];check(saved['snapshot']['xp']==30 and len(saved['snapshot']['assessment']['responses'])==1,'completed work uploads task credits, answers and mission progress')
  rev=saved['revision'];p.evaluate('reward("q1-0",10);save()');sync(p);check(api(p,'state')['progress']['snapshot']['xp']==30,'replaying a credited task cannot duplicate cloud points')
  teacher=browser.new_context(service_workers='block');t=teacher.new_page();t.on('pageerror',lambda e:errors.append(str(e)));signup(t,'riham.hassan@moe.sch.ae','Teacher');sync(t);tid=t.evaluate('state.authUserId')
  denied=t.request.get(ORIGIN+'/api/learning?action=classroom');check(denied.status==403,'choosing a role card does not grant database teacher permissions')
  t.request.post(ORIGIN+'/__test/approve-teacher',data={'id':tid});t.reload();sync(t);go(t,'teacher');t.locator('[data-cloud-open-classroom]').click();t.wait_for_selector('.iu-cloud-classes')
  check('10G5' in p.locator('.iu-cloud-assignment').inner_text() and t.locator('[data-cloud-create],.iu-cloud-classes input').count()==0 and [c['name'] for c in api(t,'classroom')['classes']]==['10G5','10G6'],'selected school class connects student progress to the assigned teacher without any class code')
  t.reload();sync(t);t.locator('[data-cloud-open-classroom]').click();t.wait_for_selector('[data-cloud-student]');t.locator('[data-cloud-student="'+uid+'"]').click();t.wait_for_selector('[data-cloud-feedback]')
  check('Cloud learner' in t.locator('[data-cloud-student-detail]').inner_text() and 'Bone' in t.locator('[data-cloud-student-detail]').inner_text(),'teacher cloud classroom displays assigned student progress, achievements and answers')
  t.locator('[data-cloud-feedback] textarea').fill('Good connection between structure and support.');t.locator('[data-cloud-feedback] input[type=checkbox]').check();t.locator('[data-cloud-feedback] button').click();t.wait_for_function('document.querySelector("[data-cloud-feedback] [role=status]").textContent.includes("saved")')
  check(next(s for s in api(t,'classroom')['students'] if s['id']==uid)['feedback']['skeletal:1:q0']['note'].startswith('Good connection'),'teacher feedback is persisted in the relational database')
  # Simulate a second device by sharing only the HttpOnly session, never local learner data.
  other=browser.new_context(service_workers='block');other.add_cookies(student.cookies());q=other.new_page();q.on('pageerror',lambda e:errors.append(str(e)));q.goto(ORIGIN+'/index.html?nosw=1#dashboard');sync(q)
  check(q.evaluate('state.xp')==30 and q.evaluate('state.assessment.responses[0].answer')=='Bone','a fresh browser restores account progress and answers from the database')
  # Offline saves retain the browser record; a newer remote revision cannot be overwritten.
  other.set_offline(True);q.evaluate('reward("q1-1",10)');q.wait_for_function('InneruCloud.status().includes("needs attention")');check(q.evaluate('state.xp')==40,'offline work stays in the learner’s local record')
  p.evaluate('reward("q1-2",10)');sync(p);other.set_offline(False);q.evaluate('window.dispatchEvent(new Event("online"))');q.wait_for_selector('[data-cloud-use=remote]')
  check('another saved version' in q.locator('[data-cloud-panel]').inner_text(),'concurrent device changes show an explicit version conflict')
  q.locator('[data-cloud-use=remote]').click();sync(q);check(q.evaluate('state.rewards.includes("q1-2")&&!state.rewards.includes("q1-1")'),'choosing cloud restores the newer saved record without silently merging answers')
  check(q.evaluate('(id)=>JSON.parse(localStorage.getItem("inneru-cloud-recovery-v1:"+id)).rewards.includes("q1-1")',uid),'conflict resolution keeps a local recovery copy before replacing work')
  # Test the opposite conflict choice.
  q.evaluate('reward("q2-0",10)');sync(q);p.evaluate('reward("q2-1",10)');p.wait_for_selector('[data-cloud-use=local]');p.locator('[data-cloud-use=local]').click();sync(p)
  check('q2-1' in api(p,'state')['progress']['snapshot']['rewards'],'choosing the device record explicitly replaces the cloud version at its current revision')
  # Connection diagnostics do not ask for or expose credentials.
  p.goto(ORIGIN+'/connection.html');p.wait_for_function('!document.querySelector("#connection-retry").disabled');check('learning database installed' in p.locator('#connection-results').inner_text(),'connection diagnostics verify the deployed Auth adapter and learning schema')
  t.reload();sync(t);go(t,'teacher');t.locator('[data-cloud-open-classroom]').click();t.wait_for_selector('[data-cloud-student]');t.locator('[data-cloud-student="'+uid+'"]').click();t.wait_for_selector('[data-cloud-feedback]')
  for width in [1440,768,390,320]:
   t.set_viewport_size({'width':width,'height':1000});check(t.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'cloud classroom, answers and feedback fit {width}px without horizontal overflow')
  check(not errors,'no JavaScript exceptions during real database signup, sync, classroom review or conflicts: '+str(errors))
  browser.close()
 print(checks,'cloud-learning browser checks passed.')
finally:
 proc.terminate();proc.wait(timeout=10)
 subprocess.run(['docker','exec','-i','inneru-db-check','psql','-U','postgres','-d',DB,'-q'],input="delete from auth.users where lower(email)='riham.hassan@moe.sch.ae';",text=True,check=True)
