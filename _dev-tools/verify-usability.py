"""Availability-aware guidance and evidence triage. Isolated local fixtures only."""
import json,uuid
from test_support import DatabaseFixture,playwright_session,launch,artifact
f=DatabaseFixture('inneru_usability_check');checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS '+message,flush=True)
def control(system,unlocked,number=0):
 r=f.api(teacher,'set-mission-control',{'classCode':'10G5','system':system,'number':number,'unlocked':unlocked});assert r.ok,r.text()
def refresh():p.evaluate('InneruMissionAccess.refresh()')
def go(page,route,selector):
 page.goto(f.origin+'/index.html?nosw=1#'+route);page.wait_for_selector(selector)
 if selector=='.sd-page':
  page.wait_for_function('InneruCloud.status()==="Saved to your account"||InneruCloud.status()==="Choose a saved version"')
  if page.locator('[data-cloud-use=remote]').count():page.locator('[data-cloud-use=remote]').click()
  page.wait_for_function('InneruCloud.status()==="Saved to your account"')
 page.wait_for_timeout(150)
try:
 with playwright_session() as pw:
  b=launch(pw);teacher,t=f.account(b,'riham.hassan@moe.sch.ae','Riham local');maryam,m=f.account(b,'sf.alhammadi@moe.sch.ae','Maryam local')
  p,u=f.account(b,'pathway@example.com','Pathway learner','10G5');second,s=f.account(b,'pathway-other-class@example.com','Other assigned class','10G6');outside,o=f.account(b,'pathway-outside@example.com','Outside teacher class','10G1')
  for page in [p,teacher,maryam]:page.on('pageerror',lambda error:errors.append(str(error)))
  control('respiratory',True);go(p,'dashboard','.sd-page');refresh()
  check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#respiratory/mission/1','a non-skeletal unlocked mission becomes the primary recommendation')
  check(p.locator('.sd-plan [data-sd-continue]').get_attribute('href')=='#respiratory/mission/1','learning-plan recommendation uses the same authorized mission')
  p.locator('[data-sd-world=respiratory]').click();check(p.locator('[data-sd-resume]').get_attribute('href')=='#respiratory/mission/1','system resume respects authorized access')
  p.locator('[data-sd-world=skeletal]').click();check(p.locator('[data-sd-resume]').get_attribute('href')=='#home' and 'unlock' in p.locator('[data-sd-resume] + [data-sd-pathway-status]').inner_text(),'locked system offers exploration with a visible explanation')
  control('respiratory',False);refresh();check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#home' and 'unlock' in p.locator('.sd-hero [data-sd-pathway-status]').inner_text(),'all locked systems produce a useful fallback instead of a disabled start action')
  p.reload();p.wait_for_selector('.sd-page');refresh();check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#home','refresh preserves the all-locked guidance')
  control('respiratory',True);refresh();check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#respiratory/mission/1','new teacher access updates recommendations without replacing progress')
  control('respiratory',False,1);refresh();check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#home','individual mission locks also govern recommendations')
  control('respiratory',True,1)
  p.route('**/api/learning?action=mission-catalog',lambda route:route.abort())
  p.evaluate('InneruMissionAccess.refresh().catch(()=>{})');p.wait_for_function('document.querySelector(".sd-hero [data-sd-pathway-status]").textContent.includes("Reconnect")')
  check(p.locator('.sd-hero [data-sd-continue]').get_attribute('href')=='#home','access-check failure never invents availability')
  p.unroute('**/api/learning?action=mission-catalog');refresh()
  baseline=p.evaluate('JSON.stringify(state)');p.locator('.sd-preferences summary').click();check(p.locator('#reset').inner_text()=='Reset my learning progress','reset label names learning progress rather than browser-only scope')
  p.locator('#reset').click();check('cloud learning record' in p.locator('#reset-confirm').inner_text(),'reset confirmation explains account progress and attached feedback')
  p.locator('[data-sd-cancel-reset]').press('Enter');check(p.evaluate('JSON.stringify(state)')==baseline and p.locator('#reset').evaluate('el=>el===document.activeElement'),'keyboard cancellation preserves progress and restores focus')
  # Seed only explicit isolated submitted-work fixtures; no XP or completion flags.
  snap=json.loads(p.evaluate('JSON.stringify(state)'));at='2026-10-25T08:00:00Z';snap['assessment']={'version':1,'responses':[
   {'id':'respiratory:1:q0','system':'respiratory','mission':1,'kind':'check','title':'Local wrong check','prompt':'Local fixture prompt','answer':'Local fixture answer','expected':'Local fixture reference','correct':False,'at':at,'attempts':1,'history':[]},
   {'id':'form:respiratory/mission/1:fixture','system':'respiratory','mission':1,'kind':'submission','title':'Local written work','prompt':'Explain your idea','answer':'Home — ATP و CO₂','correct':None,'at':at,'attempts':1,'history':[]}]}
  current=f.api(p,'state').json()['progress'];r=f.api(p,'save',{'snapshot':snap,'revision':current['revision'],'requestId':str(uuid.uuid4())});check(r.ok,'explicit local evidence fixtures save without minting points')
  go(teacher,'teacher','[data-attention]');check('Outside teacher class' not in teacher.locator('[data-attention]').inner_text(),'attention summary excludes the other teacher’s student')
  check(teacher.locator('[data-attention-category=incorrect] [data-attention-count]').inner_text()=='1','incorrect category counts matched unresolved objective evidence')
  check(teacher.locator('[data-attention-category=review] [data-attention-count]').inner_text()=='1','review category counts only unreviewed ungraded submissions')
  teacher.locator('#td-dashboard-class').select_option('10G6');check(teacher.locator('[data-attention-category=incorrect] [data-attention-count]').inner_text()=='0' and 'Pathway learner' not in teacher.locator('[data-attention]').inner_text(),'class selection scopes every attention category')
  teacher.locator('#td-dashboard-class').select_option('10G5');teacher.locator('[data-attention-category=incorrect] li a').first.click();teacher.wait_for_selector('[data-mastery]');check(teacher.locator('[data-ms-filter=status]').input_value()=='developing' and teacher.locator('[data-ms-objective]').count()==1,'attention link opens the authorized student and relevant mastery filter')
  go(teacher,'teacher','[data-attention]');teacher.locator('#td-dashboard-class').select_option('10G5');teacher.locator('[data-attention-category=missing]>a').click();teacher.wait_for_selector('[data-mastery]');check(teacher.locator('[data-ms-filter=class]').input_value()=='10G5' and teacher.locator('[data-ms-filter=status]').input_value()=='insufficient','class-wide attention link retains its class and evidence status')
  go(teacher,'teacher','[data-attention]');teacher.locator('#td-dashboard-class').select_option('10G5');teacher.locator('[data-attention-category=review]>a').click();teacher.wait_for_selector('.td-answer-list');check(teacher.locator('#td-answer-status').input_value()=='submitted-review' and teacher.locator('.td-answer').count()==1,'review summary opens only unreviewed submissions in the selected class')
  go(p,'dashboard?view=mastery','[data-mastery]')
  result=p.evaluate("""()=>{const e=InneruMasteryCatalog.find(e=>e.id==='integumentary-1'),rows=e.checks.map((id,i)=>({id,system:e.system,mission:1,correct:true,at:'2026-10-25T08:00:00Z',attempts:i<2?2:1,history:i<2?[{correct:false}]:[]}));const before=JSON.stringify(rows),r=InneruMasteryModel.objective(e,rows);return {status:r.status,next:r.nextStep,pure:before===JSON.stringify(rows)};}""")
  check(result['status']=='developing' and 'different assessment' in result['next'] and 'repeating' in result['next'] and result['pure'],'corrected evidence explains the need for a different follow-up without changing criteria or history')
  go(p,'muscle','.mq-landing');p.evaluate("InneruPreferences.set({language:'ar'})");p.wait_for_function('document.documentElement.lang==="ar"');p.wait_for_timeout(450)
  check('من 7' in p.locator('.mq-hero').inner_text(),'Arabic mission progress uses an unambiguous completed-of-total phrase')
  check(p.locator('.mq-hero bdi[dir=ltr]').count()>0,'standalone numeric fractions retain readable LTR order')
  p.evaluate("(()=>{const select=document.createElement('select');select.id='fixture-fraction';select.innerHTML='<option>1 / 2</option>';document.body.append(select);})()");p.wait_for_timeout(100)
  check(p.locator('#fixture-fraction').input_value()=='1 / 2' and p.locator('#fixture-fraction option').evaluate('e=>e.childElementCount')==0,'Arabic fraction formatting leaves native option values and markup intact');p.locator('#fixture-fraction').evaluate('e=>e.remove()')
  go(p,'respiratory/mission/1','.resp-question');p.wait_for_selector('[data-mission-objective]');check(p.locator('[data-mission-objective]').get_attribute('data-mission-objective')=='respiratory-1','mission objective uses the existing authored assessment mapping')
  check(not p.evaluate('InneruLocale.coverage(document.querySelector("[data-mission-objective]"))'),'mission objectives and evidence guidance have authored Arabic text')
  go(p,'dashboard','.sd-page')
  for width in [320,390,768,1440]:
   p.set_viewport_size({'width':width,'height':844});p.wait_for_timeout(120)
   check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)+'px Arabic student dashboard has no overflow')
   check(p.locator('[data-interface-language]').is_visible() and p.locator('[data-guided-toggle]').is_visible(),str(width)+'px keeps language and Guided controls visible')
   if width<=390:check(p.locator('.topbar').evaluate('e=>e.getBoundingClientRect().height')<240,str(width)+'px mobile header is compact')
  p.set_viewport_size({'width':390,'height':844});p.screenshot(path=artifact('student-arabic-mobile.png'),full_page=False)
  go(teacher,'teacher','[data-attention]');teacher.set_viewport_size({'width':1680,'height':1000})
  tops=teacher.locator('.td-tabs>a').evaluate_all('es=>es.map(e=>Math.round(e.getBoundingClientRect().top))');check(len(set(tops))==1 and len(tops)==6,'all six desktop teacher dashboard tabs share one row')
  teacher.screenshot(path=artifact('teacher-attention-desktop.png'),full_page=True)
  teacher.evaluate("InneruPreferences.set({language:'ar'})");teacher.wait_for_timeout(450);teacher.set_viewport_size({'width':320,'height':950});check(teacher.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Arabic teacher attention summary reflows on narrow screens')
  check(not teacher.evaluate('InneruLocale.coverage(document.querySelector("[data-attention]"))'),'teacher attention summary has authored Arabic coverage and preserves names')
  teacher.screenshot(path=artifact('teacher-attention-arabic-mobile.png'),full_page=True)
  check(not errors,'no uncaught browser errors: '+str(errors));b.close()
 print(str(checks)+' usability checks passed.',flush=True)
finally:f.close()
