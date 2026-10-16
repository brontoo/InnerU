"""Exercise real completions, the unified dashboard and its once-only credit log."""
import base64,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
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
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);ctx=b.new_context(viewport=dict(width=1680,height=1100));p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#dashboard',wait_until='domcontentloaded');p.wait_for_selector('.sd-page');baseline=stored(p)
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
  go(p,'teacher','#t-code');p.locator('#t-code').click();code=p.locator('#t-code-text').input_value();payload=json.loads(base64.urlsafe_b64decode(code.rsplit('-',1)[0].removeprefix('INNERU1-')+'==='))
  check(set(payload['r'])=={'activity1','q1-0','q1-1','q1-2'} and len(payload['l']['entries'])==4,'new progress codes carry the exact paid task IDs and activity log')
  p.evaluate('state={name:"Reset",xp:0,done:[],rewards:[],weak:[],level:"Explorer",motion:false};save()');p.locator('#t-import').fill(code);p.locator('#t-load').click()
  check(model(p)['xp']==50 and model(p)['tracked']==50 and model(p)['missions']==1,'restoring a current code preserves mission credit, XP and its itemised log')
  go(p,'mission/1','[data-skeletal-mission="1"]');correct_checks(p,1);solve_first(p);p.locator('#complete').click();p.wait_for_selector('.skel-chapters');check(model(p)['xp']==50,'restored tasks cannot earn their XP again')
  go(p,'teacher','#t-import');p.locator('#t-import').fill(legacy_code());p.locator('#t-load').click();check(model(p)['xp']==50 and model(p)['earlier']==50,'legacy codes preserve earlier earned XP without inventing historical timestamps')
  go(p,'mission/1','[data-skeletal-mission="1"]');correct_checks(p,1);solve_first(p);p.locator('#complete').click();p.wait_for_selector('.skel-chapters');check(model(p)['xp']==50,'replaying missions from an older compact code does not pay for missing task IDs again')
  go(p,'mission/2','[data-skeletal-mission="2"]');j=p.evaluate('checks[2][0].answer');p.locator(f'[data-skel-question="0"][data-skel-answer="{j}"]').click();check(model(p)['xp']==60 and model(p)['tracked']==10 and model(p)['earlier']==50,'a genuinely new task after legacy restore still earns its normal XP')
  old=ctx.new_page();old.goto(BASE+'#teacher',wait_until='domcontentloaded');old.wait_for_selector('#t-import');old.locator('#t-import').fill(legacy_code('111111','677676',1,1000));old.locator('#t-load').click()
  old.evaluate('["resp-final-0","integ-final-0","exc-final-0","circ-master-0","cap-station-0"].forEach(id=>reward(id,8))')
  check(model(old)['xp']==1000,'older completed system finals and capstone decisions cannot earn missing historical task credits again')
  old.locator('#t-code').click();old_code=old.locator('#t-code-text').input_value();old.evaluate('state={name:"Blank",xp:0,done:[],rewards:[],weak:[],level:"Explorer",motion:false};save()');old.locator('#t-import').fill(old_code);old.locator('#t-load').click();old.evaluate('reward("resp-final-1",8)')
  check(model(old)['xp']==1000,'legacy replay protection survives export into the current progress-code format');old.close()
  # The other page shares storage; restore this test's earlier partial learner.
  p.reload(wait_until='domcontentloaded');p.wait_for_selector('[data-skeletal-mission="2"]');go(p,'teacher','#t-import');p.locator('#t-import').fill(legacy_code());p.locator('#t-load').click();go(p,'mission/2','[data-skeletal-mission="2"]');j=p.evaluate('checks[2][0].answer');p.locator(f'[data-skel-question="0"][data-skel-answer="{j}"]').click()
  # Preview guard covers all reward paths, including direct reward callers.
  go(p,'detective?preview=1','.dd-practice');before=stored(p);p.evaluate('reward("connection",35);save()');check(stored(p)==before and model(p)['xp']==60,'preview blocks shared reward and save paths without changing learner storage')
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
  go(p,'teacher','#t-code');p.locator('#t-code').click();code=p.locator('#t-code-text').input_value();saved_xp=model(p)['xp']
  p.evaluate('state={name:"Blank",xp:0,done:[],rewards:[],weak:[],level:"Explorer",motion:false};save()');p.locator('#t-import').fill(code);p.locator('#t-load').click()
  check(p.evaluate('JSON.stringify({muscle:state.muscle.tasks,circ:state.circ.steps})')==task_flags and model(p)['xp']==saved_xp,'current progress codes restore exact muscular and circulatory task flags as well as paid credits')
  # Every system uses its own completion flags, including muscular mission 7.
  p.evaluate('state={name:"Amina",xp:1000,done:[1,2,3,4,5,6,7,8],rewards:[],weak:[],level:"Challenger",motion:false,integumentary:{done:[1,2,3,4,5,6],mastery:true},muscle:{done:[1,2,3,4,5,6,7,8],tasks:{},weak:[],xp:0},respiratory:{done:[1,2,3,4,5,6],mastery:true},circ:{done:[1,2,3,4,5,6,7],mastery:true,steps:[]},excretory:{done:[1,2,3,4,5,6],mastery:true}};save();dashboard()');p.wait_for_selector('.sd-page')
  check(model(p)['missions']==39 and model(p)['keys']==6 and model(p)['percent']==100,'all six systems produce 39 completed missions, six keys and 100 percent expedition progress')
  check(model(p)['earned']==45,'mission and final flags unlock exactly 39 mission badges and six mastery badges')
  check(p.evaluate('InneruLearning.snapshot().badges.find(b=>b.id==="muscle-mission-7").earned'),'Muscle Lab mission 7 receives its own achievement')
  check(p.locator('.sd-hero a').get_attribute('href')=='#final','six keys recommend the unlocked final mission')
  # Capstone now uses the same central paid-task ledger.
  go(p,'final','[data-cap-station]')
  for i in range(6):
   for j in range(4):
    choices=p.locator(f'[data-cap-station="{i}"] [data-cap-choice]')
    if choices.first.is_disabled():break
    choices.nth(j).click()
  check(model(p)['xp']==1090 and len(model(p)['entries'])==6,'six real final decisions record six distinct 15 XP task credits')
  check(p.locator('#cap-finish').is_disabled(),'the final achievement stays locked until the written reflection is reviewed')
  p.locator('#cap-response').fill('The muscles use ATP to move bones. Lungs supply oxygen and blood carries it to cells. Sweating cools the skin while kidneys conserve water.');p.locator('#cap-review').click()
  for i in range(3):p.locator(f'[data-cap-rubric="{i}"]').check()
  p.locator('#cap-finish').click();p.wait_for_selector('#cap-certificate')
  check(model(p)['xp']==1120 and len(model(p)['entries'])==7 and model(p)['earned']==46,'reviewed final synthesis earns exactly 30 XP and its own completed-task achievement')
  before=model(p)['xp'];p.locator('#cap-finish').click();check(model(p)['xp']==before,'opening an earned certificate never pays the final reward twice')
  go(p,'teacher','#t-code');p.locator('#t-code').click();code=p.locator('#t-code-text').input_value()
  p.evaluate('state={name:"Blank",xp:0,done:[],rewards:[],weak:[],level:"Explorer",motion:false};save()');p.locator('#t-import').fill(code);p.locator('#t-load').click()
  check(p.evaluate('state.capstone.done&&Object.keys(state.capstone.stations).length===6&&state.capstone.rubric.length===3') and model(p)['xp']==1120,'a final-challenge progress code preserves all completed decisions, reviewed writing and its once-only credit')
  go(p,'final','#cap-certificate');check(p.locator('#cap-finish').is_enabled(),'a restored completed final challenge keeps its certificate available')
  # Live updates and multi-tab storage use the same totals.
  go(p,'dashboard','.sd-page');p.evaluate('reward("daily-2026-10-16",10)');p.wait_for_function('document.querySelector("[data-sd-xp]").textContent.includes("1,130")')
  check(model(p)['tracked']==130 and model(p)['earlier']==1000,'live dashboard credits reconcile with preserved earlier XP')
  p.evaluate('window.liveCapRef=state.capstone;window.liveRewardRef=state.rewards');other=ctx.new_page();other.goto(BASE+'#dashboard',wait_until='domcontentloaded');other.wait_for_selector('.sd-page');other.evaluate('reward("detective2-touch",30)');p.wait_for_function('document.querySelector("[data-sd-xp]").textContent.includes("1,160")')
  check(model(p)['xp']==1160,'a completed task in another browser tab updates the open dashboard');check(p.evaluate('state.capstone===window.liveCapRef&&state.rewards===window.liveRewardRef'),'cross-tab updates preserve the state references used by live lessons');other.close()
  # Preferences do not confer learning credit; cancel reset keeps everything.
  p.locator('.sd-preferences>details>summary').click();p.locator('#nickname').fill('Mariam');p.locator('#dash-level').select_option('Master');p.locator('#motion').check();p.locator('#save-profile').click()
  check('Mariam' in p.locator('.sd-hero em').inner_text(),'saving a nickname updates the personalised dashboard')
  check(p.evaluate('state.name==="Mariam"&&state.level==="Master"&&state.motion') and model(p)['xp']==1160,'profile and challenge preferences change no earned points')
  p.locator('#reset').click();p.locator('[data-sd-cancel-reset]').click();check(model(p)['xp']==1160,'cancelling a progress reset retains all six systems and rewards')
  # All routes fit small screens, with operable badge dialogs.
  before=stored(p)
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900))
   for wid in ['integumentary','skeletal','muscle','respiratory','circ','excretory']:
    p.locator(f'[data-sd-world="{wid}"]').click();assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,wid)
   check(True,f'all six system panels fit {width}px without horizontal overflow')
  go(p,'badges','.sd-collection');p.locator('[data-sd-badge-mode="earned"]').click();check(p.locator('.sd-badge-grid .sd-badge').count()==46,'the earned filter matches completed tasks after final synthesis')
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
  check(all(p.request.get(BASE.split('?')[0]+url.removeprefix('./')).status==200 for url in shell),f'all {len(shell)} offline shell URLs resolve')
  check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both HTML entry points load identical progress and dashboard modules')
  check(not errors,'no JavaScript exceptions across rewards, restore, dashboard, badges or responsive navigation: '+str(errors))
  b.close()
finally:server.shutdown()
print(f'{checks} student dashboard checks passed.',flush=True)
