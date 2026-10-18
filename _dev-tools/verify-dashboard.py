"""Exercise real completions, the unified dashboard and its once-only credit log."""
import base64,json
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, artifact, DatabaseFixture
ROOT=Path(__file__).resolve().parents[1]
fixture=DatabaseFixture('inneru_dashboard_check')
BASE=fixture.origin+'/index.html?nosw=1'
checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def stored(p):return p.evaluate('localStorage.getItem("bodyquest-v1")')
def go(p,path,selector):p.evaluate('(h)=>location.hash=h',path);p.wait_for_selector(selector)
def model(p):return p.evaluate('(()=>{const p=InneruLearning.snapshot();return {xp:p.xp,missions:p.missions,keys:p.keys,earned:p.earned.length,tasks:p.tasks,tracked:p.tracked,earlier:p.earlier,entries:p.entries,percent:p.percent}})()')
def solve_first(p):
 for i,v in enumerate([0,0,0,1,1,1,1]):p.locator(f'#division-{i}').select_option(str(v))
 p.locator('#division-check').click()
def correct_checks(p,n):
 for i,j in enumerate(p.evaluate(f'checks[{n}].map(q=>q.answer)')):
  b=p.locator(f'[data-skel-question="{i}"][data-skel-answer="{j}"]')
  if b.is_enabled():b.click()
def legacy_code(keys="000000",worlds="010000",cap=0,xp=50):
 raw=json.dumps(dict(v=1,n='Earlier learner',x=xp,k=keys,w=worlds,c=cap),separators=(',',':'));checksum=0
 for c in raw:checksum=(checksum*31+ord(c))%1296
 chars='0123456789abcdefghijklmnopqrstuvwxyz'
 return 'INNERU1-'+base64.urlsafe_b64encode(raw.encode()).decode().rstrip('=')+'-'+chars[checksum//36]+chars[checksum%36]
try:
 with sync_playwright() as pw:
  b=launch(pw);teacher,_=fixture.account(b,'riham.hassan@moe.sch.ae','Fixture teacher');p,user=fixture.account(b,'dashboard@example.com','Explorer','10G5');ctx=p.context;fixture.unlock(teacher);p.on('pageerror',lambda e:errors.append(str(e)))
  fixture.open(p,'dashboard','.sd-page');baseline=stored(p)
  check(p.locator('.command-hero,.mq-dashboard,.cap-dashboard').count()==0,'the full dashboard replaces the accumulated skeletal-first summary sections')
  check(model(p)['xp']==0 and model(p)['missions']==0 and model(p)['earned']==0,'new students start with no points, completed missions or earned badges')
  check(p.evaluate('InneruLearning.snapshot().missionTotal===39&&InneruLearning.snapshot().total===45&&InneruLearning.snapshot().badges.length===49'),'progress covers 39 missions, six system finals and 49 distinct achievements')
  check(p.locator('.sd-hero a').get_attribute('href')=='#mission/1','a fresh learner is sent to the first accessible mission')
  for wid in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:
   p.locator(f'[data-sd-world="{wid}"]').click()
   check(p.locator('#sd-world-panel').get_attribute('aria-labelledby')=='sd-tab-'+wid and p.locator('#sd-world-panel img').get_attribute('src').endswith('.webp'),wid+' has a selectable anatomical progress panel')
  p.locator('[data-sd-world="excretory"]').focus();p.keyboard.press('ArrowRight');check(p.locator('[data-sd-world="integumentary"]').get_attribute('aria-selected')=='true','system tabs wrap with the arrow keys')
  p.keyboard.press('End');check(p.locator('[data-sd-world="excretory"]').get_attribute('aria-selected')=='true','End selects the final system');p.keyboard.press('Home')
  p.locator('[data-sd-badge="skeletal-mission-1"]').click();check('Complete mission 1' in p.locator('dialog').inner_text() and p.locator('dialog').is_visible(),'locked badges expose their exact completion requirement')
  p.keyboard.press('Escape');check(p.locator('[data-sd-badge="skeletal-mission-1"]').evaluate('el=>el===document.activeElement'),'closing an achievement returns focus to its opener')
  go(p,'badges','.sd-collection');check(p.locator('.sd-badge-grid .sd-badge').count()==49,'the achievement collection uses the same 49 requirements as the dashboard')
  p.locator('[data-sd-badge-mode="earned"]').click();check(p.locator('.sd-badge-grid .sd-badge').count()==0,'unearned achievements are never shown as earned')
  p.locator('[data-sd-badge-mode="all"]').click();p.locator('#sd-badge-system').select_option('muscle');check(p.locator('.sd-badge-grid .sd-badge').count()==8,'muscular achievements include all seven missions plus the final key')
  p.locator('#sd-badge-system').select_option('all');check(stored(p)==baseline,'browsing, filtering and inspecting badges or systems never writes progress')
  go(p,'mission/1','[data-skeletal-mission="1"]');wrong=p.evaluate('(checks[1][0].answer+1)%3');p.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
  check(model(p)['xp']==0 and model(p)['earned']==0,'a wrong answer awards neither XP nor a mission badge')
  correct_checks(p,1);check(model(p)['xp']==30 and model(p)['earned']==0,'three correct checks earn 30 XP while an unfinished investigation keeps the badge locked')
  solve_first(p);check(model(p)['xp']==50 and p.locator('#complete').is_enabled() and model(p)['earned']==0,'a solved investigation adds 20 XP but the mission still requires completion')
  p.locator('#complete').click();p.wait_for_selector('.skel-chapters');check(model(p)['xp']==50 and model(p)['missions']==1 and model(p)['earned']==1,'completing the mission unlocks its achievement without paying for the badge again')
  check(p.evaluate('state.learning.entries.length===4&&state.learning.entries.every(r=>r.at&&r.xp>0)&&!!state.learning.completed["badge:skeletal-mission-1"]'),'each new task credit and the badge unlock have completion timestamps')
  go(p,'dashboard','.sd-page');check(p.locator('[data-sd-xp]').inner_text().startswith('50') and p.locator('[data-sd-missions]').inner_text().startswith('1'),'dashboard totals update from actual completed work')
  check(model(p)['tracked']==50 and model(p)['earlier']==0,'the activity log reconciles exactly with the new earned-point total')
  p.locator('#sd-activity-filter').select_option('missions');check('Mission completed' in p.locator('[data-sd-events]').inner_text(),'completed skeletal missions appear in the log even without a separate mission XP bonus')
  p.locator('#sd-activity-filter').select_option('checks');check(p.locator('[data-sd-events] li').count()==3,'the log can filter the three completed science checks')
  before=stored(p);p.reload(wait_until='domcontentloaded');p.wait_for_selector('.sd-page');check(model(p)['xp']==50 and model(p)['earned']==1,'reload preserves points and task-based badges')
  check(stored(p)==before,'opening the redesigned dashboard never rewrites the learning record')
  # Native replay and transfer retain the once-only rule.
  go(p,'mission/1','[data-skeletal-mission="1"]');correct_checks(p,1);solve_first(p);p.locator('#complete').click();p.wait_for_selector('.skel-chapters')
  check(model(p)['xp']==50 and len(model(p)['entries'])==4,'replaying a full completed mission creates no duplicate points or log credits')
  p.evaluate('InneruCloud.flush()');p.wait_for_function('InneruCloud.status()==="Saved to your account"');before=stored(p)
  # Progress codes are a data-format compatibility check; students no longer open teacher tools.
  code=p.evaluate('InneruTeacher.encode(state)');payload=p.evaluate('(code)=>InneruTeacher.decode(code).payload',code)
  check(set(payload['r'])=={'activity1','q1-0','q1-1','q1-2'} and len(payload['l']['entries'])==4,'current progress codes retain exact paid task IDs and itemised credit log')
  restored=p.evaluate('(payload)=>{const p=InneruLearning.snapshot(InneruTeacher.profile(payload));return {xp:p.xp,tracked:p.tracked,missions:p.missions}}',payload)
  check(restored=={'xp':50,'tracked':50,'missions':1},'current progress-code decoding preserves completion, XP and the tracked log without changing the active account')
  legacy=p.evaluate('(code)=>{const p=InneruLearning.snapshot(InneruTeacher.profile(InneruTeacher.decode(code).payload));return {xp:p.xp,earlier:p.earlier,missions:p.missions}}',legacy_code())
  check(legacy=={'xp':50,'earlier':50,'missions':1},'legacy totals decode without inventing historical task timestamps')
  check(stored(p)==before,'compatibility decoding leaves the signed-in student record unchanged')
  # Preview guard covers all reward paths, including direct reward callers.
  go(p,'detective?preview=1','.dd-practice');before=stored(p);p.evaluate('reward("connection",35);save()');check(stored(p)==before and model(p)['xp']==50,'preview blocks shared reward and save paths without changing learner storage')
  go(p,'dashboard','.sd-page');before=stored(p)
  for value in [None,-5,float('nan')]:
   if value is None:p.evaluate('reward("invalid",undefined)')
   elif value==-5:p.evaluate('reward("invalid",-5)')
   else:p.evaluate('reward("invalid",NaN)')
  check(stored(p)==before,'invalid and negative XP requests cannot corrupt the ledger')
  # Complete actual muscular and circulatory mission gates through their controls.
  go(p,'muscle/mission/1','#mq-complete');start=model(p)['xp']
  for i in range(3):
   p.locator(f'[data-tissue-answer="{i}"]').click()
   if i<2:p.locator('[data-next-sample]').click()
  for section,answers in [('m1-location',[0,1,2]),('m1-control',[1,1,0]),('m1-check-2',[0,1])]:
   for i,destination in enumerate(answers):
    p.locator(f'#{section} [data-sort="{i}"]').click();p.locator(f'#{section} [data-bin="{destination}"] [data-place]').click()
   p.locator(f'#{section} [data-sort-check]').click()
  p.locator('#m1-conscious [data-option="1"]').click();p.locator('#m1-check-1 [data-option="1"]').click()
  p.locator('#m1-check-3 textarea').fill('Smooth muscle moves material through hollow organs, cardiac muscle pumps rhythmically, and skeletal muscle pulls on bones.');p.locator('#m1-check-3 [data-compare]').click()
  for i in range(3):p.locator(f'#m1-check-3 [data-reflection="{i}"]').check()
  p.locator('#m1-check-3 [data-confirm]').click();check(p.locator('#mq-complete').is_enabled(),'all muscular tasks and reviewed reasoning are required before mission completion')
  p.locator('#mq-complete').click();p.wait_for_selector('.mq-hero')
  check(model(p)['xp']==start+100 and p.evaluate('state.muscle.xp')==100 and p.evaluate('InneruLearning.snapshot().badges.find(b=>b.id==="muscle-mission-1").earned'),'a real muscular mission keeps its local XP, global XP and earned badge consistent')
  before=model(p)['xp'];go(p,'muscle/mission/1','#mq-complete');p.locator('#m1-conscious [data-option="1"]').click();check(model(p)['xp']==before and p.evaluate('state.muscle.xp')==100,'replaying a muscular answer adds no global or per-system XP')
  go(p,'circulatory/1','#circ-lab');start=model(p)['xp']
  for bttn in p.locator('[data-vessel]').all():bttn.click()
  for item in p.locator('.circ-question[data-q]').all():
   for bttn in item.locator('[data-answer]').all():
    if bttn.is_disabled():break
    bttn.click()
  check(p.evaluate('state.circ.done.includes(1)') and model(p)['xp']==start+100 and p.evaluate('InneruLearning.snapshot().badges.find(b=>b.id==="circ-mission-1").earned'),'a real circulatory mission awards its task credits, completion bonus and achievement through the shared log')
  check(p.evaluate('state.learning.entries.filter(r=>r.id.startsWith("circ-")).reduce((s,r)=>s+r.xp,0)')==100,'the circulatory task log reconciles with all 100 earned mission points')
  task_flags=p.evaluate('JSON.stringify({muscle:state.muscle.tasks,circ:state.circ.steps})')
  code=p.evaluate('InneruTeacher.encode(state)');payload=p.evaluate('(code)=>InneruTeacher.decode(code).payload',code)
  check(p.evaluate('(payload)=>{const restored=InneruTeacher.profile(payload);return JSON.stringify({muscle:restored.muscle.tasks,circ:restored.circ.steps})}',payload)==task_flags,'current progress codes preserve exact muscular and circulatory task flags')
  # Check aggregate model math without forging the signed-in student's completion state.
  full=p.evaluate('''()=>{const p={name:'Completed fixture',xp:1000,done:[1,2,3,4,5,6,7,8],muscle:{done:[1,2,3,4,5,6,7,8]},rewards:[]};for(const [id,n] of [['integumentary',6],['respiratory',6],['circ',7],['excretory',6]])p[id]={done:Array.from({length:n},(_,i)=>i+1),mastery:true};const m=InneruLearning.snapshot(p);return {missions:m.missions,keys:m.keys,percent:m.percent,badges:m.earned.length};}''')
  check(full=={'missions':39,'keys':6,'percent':100,'badges':45},'all-system model counts 39 missions, six finals and 45 earned system badges')
  p.evaluate('InneruCloud.flush()');p.wait_for_function('InneruCloud.status()==="Saved to your account"')
  progress=fixture.api(p,'state').json()['progress']['snapshot']
  check(progress['xp']==250 and progress['done']==[1] and progress['muscle']['done']==[1] and progress['circ']['done']==[1],'real skeletal, muscular and circulatory work persists through the account API')
  p.reload();p.wait_for_selector('#circ-lab');go(p,'dashboard','.sd-page');p.wait_for_function('InneruCloud.status()==="Saved to your account"')
  check(model(p)['xp']==250 and model(p)['missions']==3 and model(p)['earned']==3,'a verified page reload restores the three real mission completions and badges')
  # A second signed-in tab receives the same task ledger and emits live updates.
  other=ctx.new_page();other.goto(BASE+'#dashboard');other.wait_for_selector('.sd-page');other.wait_for_function('InneruCloud.status()==="Saved to your account"');other.evaluate('reward("detective2-touch",30);save()')
  p.wait_for_function('document.querySelector("[data-sd-xp]").textContent.includes("280")')
  check(model(p)['xp']==280,'a newly earned task in another account tab updates the open dashboard')
  other.evaluate('InneruCloud.flush()');other.close();p.reload();p.wait_for_selector('.sd-page')
  p.wait_for_function('["Saved to your account","Choose a saved version"].includes(InneruCloud.status())')
  if p.locator('[data-cloud-use=remote]').count():p.locator('[data-cloud-use=remote]').click()
  p.wait_for_function('InneruCloud.status()==="Saved to your account"')
  check(model(p)['xp']==280,'explicit cloud-version resolution after multi-tab work preserves the saved task credits')
  # Preferences do not confer learning credit; cancel reset keeps everything.
  p.locator('.sd-preferences>details>summary').click();p.locator('#nickname').fill('Mariam');p.locator('#dash-level').select_option('Master');p.locator('#motion').check();p.locator('#save-profile').click()
  check('Mariam' in p.locator('.sd-hero em').inner_text(),'saving a nickname updates the personalised dashboard')
  check(p.evaluate('state.name==="Mariam"&&state.level==="Master"&&state.motion') and model(p)['xp']==280,'profile and challenge preferences change no earned points')
  p.locator('#reset').click();p.locator('[data-sd-cancel-reset]').click();check(model(p)['xp']==280,'cancelling a progress reset retains all six systems and rewards')
  # All routes fit small screens, with operable badge dialogs.
  before=stored(p)
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900))
   for wid in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:
    p.locator(f'[data-sd-world="{wid}"]').click();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,wid)
   check(True,f'all six system panels fit {width}px without horizontal overflow')
  go(p,'badges','.sd-collection');p.locator('[data-sd-badge-mode="earned"]').click();check(p.locator('.sd-badge-grid .sd-badge').count()==3,'the earned filter matches the three completed missions')
  for width in [1680,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900));assert p.evaluate('document.documentElement.scrollWidth<=innerWidth')
  check(True,'the full achievement collection fits desktop and narrow phones')
  p.locator('[data-sd-badge="skeletal-mission-1"]').click();check(p.locator('dialog').evaluate('el=>el.scrollWidth<=el.clientWidth'),'achievement details remain readable on a 320px phone');p.keyboard.press('Escape')
  check(stored(p)==before,'responsive exploration, filters and badge inspection preserve saved progress')
  p.emulate_media(reduced_motion='reduce');check(p.locator('.sd-badge').first.evaluate('el=>getComputedStyle(el).transitionDuration')=='0s','reduced motion removes decorative badge movement')
  go(p,'dashboard','.sd-page');p.locator('.sd-preferences>details>summary').click();p.locator('#reset').click();p.locator('#confirm-reset').click();p.wait_for_function('document.querySelector("[data-sd-xp]").textContent.trim().startsWith("0")')
  check(model(p)['xp']==0 and model(p)['missions']==0 and model(p)['keys']==0 and model(p)['earned']==0 and len(model(p)['entries'])==0,'confirmed reset clears all six systems, earned points, badges and log together')
  check(p.evaluate('state.name==="Mariam"&&state.level==="Master"&&state.motion'),'reset retains the chosen profile and accessibility preferences')
  shell=p.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
  check(all(p.request.get(fixture.origin+'/'+url.removeprefix('./')).status==200 for url in shell),f'all {len(shell)} offline shell URLs resolve')
  check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both HTML entry points load identical progress and dashboard modules')
  check(not errors,'no JavaScript exceptions across rewards, restore, dashboard, badges or responsive navigation: '+str(errors))
  b.close()
finally:fixture.close()
print(f'{checks} student dashboard checks passed.',flush=True)
