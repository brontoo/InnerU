"""All 45 actual student lessons: anatomy, task actions, optional work and read-only aids."""
import copy,json
from pathlib import Path
from test_support import DatabaseFixture,playwright_session,launch,artifact,new_context

f=DatabaseFixture('inneru_mission_clarity_check');checks=0;errors=[];rows=[];captures=[]
VOICE_STUB="""(()=>{window.__speech={calls:[],cancelled:0};class U{constructor(text){this.text=text;}}window.SpeechSynthesisUtterance=U;Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{lang:'en-GB',localService:true},{lang:'ar-AE',localService:true}],speak:u=>window.__speech.calls.push({text:u.text,lang:u.lang}),cancel:()=>window.__speech.cancelled++},configurable:true});})();"""
def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label,flush=True)
def dashboard(page):
 page.goto(f.origin+'/index.html?nosw=1#dashboard')
 page.wait_for_selector('.sd-page')
 page.wait_for_function('window.InneruCloud&&(InneruCloud.status()==="Saved to your account"||InneruCloud.status()==="Choose a saved version")')
 if page.locator('[data-cloud-use=remote]').count():page.locator('[data-cloud-use=remote]').click()
 page.wait_for_function('InneruCloud.status()==="Saved to your account"')
def go(page,route):
 page.evaluate('(route)=>location.hash=route',route)
 page.wait_for_selector('[data-mission-objective]')
 page.wait_for_selector('[data-mission-task]')
 page.wait_for_timeout(80)
def language(page,value,guided=False):
 page.evaluate('p=>InneruPreferences.set(p)',{'language':value,'guided':guided})
 page.wait_for_function('(value)=>document.documentElement.lang===value',arg=value)
 if value=='ar':page.wait_for_function('!document.querySelector("script[data-locale]")||InneruLocale.coverage(document.querySelector(".iu-task-action")).length===0')
 page.wait_for_timeout(100)
def capture(page,name,selector=None):
 page.evaluate('''async()=>{const images=[...document.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width);images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode().catch(()=>{})));}''')
 if selector:page.locator(selector).screenshot(path=artifact(name+'.png'),animations='disabled')
 else:page.screenshot(path=artifact(name+'.png'),animations='disabled',full_page=True)
 captures.append(name+'.png')
def open_optional(page,selector):
 for detail in page.locator('.iu-optional').filter(has=page.locator(selector)).all():
  if detail.get_attribute('open') is None:detail.locator(':scope>summary').click()

try:
 f.sql('delete from auth.users;')
 with playwright_session() as pw:
  browser=launch(pw);teacher,_=f.account(browser,'riham.hassan@moe.sch.ae','Local teacher');student,user=f.account(browser,'mission-clarity@example.com','Local learner','10G5')
  f.unlock(teacher);dashboard(student)
  student.on('pageerror',lambda error:errors.append(str(error)));teacher.on('pageerror',lambda error:errors.append(str(error)))
  requests=[];student.on('request',lambda request:requests.append(request.url))
  blank=f.api(student,'state').json()['progress']['snapshot']
  cookies=student.context.cookies()
  teacher.goto(f.origin+'/index.html?nosw=1#teacher?view=preview');teacher.wait_for_selector('.td-preview-library')
  entries=teacher.locator('.td-preview-list a').evaluate_all('''es=>es.map(e=>{const route=e.getAttribute('href').split('?')[0],m=InneruMissionAccess.parse(route.slice(1));return {route,id:m.world.id+'-'+m.number,system:m.world.id,number:m.number};})''')
  check(len(entries)==45,'audit includes all 39 required missions and six system finals')
  for entry in entries:
   # SQL setup only in this isolated fixture: the current task stays untouched;
   # prerequisite completions exercise the real server-authorized student route.
   record=copy.deepcopy(blank);prior=list(range(1,entry['number']))
   if entry['system']=='skeletal':record['done']=prior
   else:record[entry['system']]={**(record.get(entry['system']) or {}),'done':prior,'mastery':False}
   credit=json.loads(f.sql("select jsonb_build_object('rewards',coalesce(jsonb_agg(r.id order by r.id),'[]'),'xp',coalesce(sum(r.xp),0)) from public.reward_definitions r where r.id in(select jsonb_array_elements_text(required_rewards) from public.missions where system_id='"+entry['system']+"' and number<"+str(entry['number'])+");"))
   record.update(credit)
   student.context.close()
   encoded=json.dumps(record).replace("'","''")
   f.sql("update public.student_progress set snapshot='"+encoded+"'::jsonb,revision=revision+1 where user_id='"+user['id']+"';")
   context=new_context(browser,service_workers='block',viewport={'width':1440,'height':1000},storage_state={'cookies':cookies,'origins':[]})
   context.add_init_script(VOICE_STUB);student=context.new_page()
   student.on('pageerror',lambda error:errors.append(str(error)));student.on('request',lambda request:requests.append(request.url))
   dashboard(student)
   go(student,entry['route'])
   check(student.locator('[data-mission-objective]').get_attribute('data-mission-objective')==entry['id'],entry['id']+' opens through the actual student access gate')
   before=student.evaluate('JSON.stringify(state)')
   anatomical=student.evaluate('''()=>[...document.querySelectorAll('main img,main svg[role=img],main figure[role=img]')].filter(e=>!e.closest('details:not([open]),dialog,.iu-mission-opening,footer')&&(e.matches('img')?e.alt.trim():e.getAttribute('aria-label'))&&e.getBoundingClientRect().width>30).map(e=>({label:e.alt||e.getAttribute('aria-label'),asset:e.getAttribute('src')||e.querySelector('image')?.getAttribute('href')||e.querySelector('img')?.getAttribute('src')||'code-native SVG'}))''')
   check(bool(anatomical),entry['id']+' has relevant visible anatomy outside optional disclosures')
   authored=student.evaluate('(id)=>{const e=InneruMasteryCatalog.find(e=>e.id===id);return {checks:e.checks.length,written:e.written.length};}',entry['id'])
   if entry['system']=='muscle':
    check(student.locator('.mq-panel .mq-status').count()>=authored['checks']+authored['written'],entry['id']+' retains its authored assessment tasks')
   else:
    check(student.locator('.skel-check,.resp-question,.circ-question:not(:has(textarea))').count()>=authored['checks'],entry['id']+' retains every authored assessment question')
    if authored['written']:check(student.locator('main textarea').count()>=authored['written'],entry['id']+' retains its authored written-response fields')
   check(student.locator('.skel-check,.resp-question,.circ-question,.ra-prediction').evaluate_all('es=>es.every(e=>e.querySelector(":scope>.iu-task-action [data-mission-task],:scope>.quest-check-content>.iu-task-action [data-mission-task]"))'),entry['id']+' gives each question a visible answer action')
   if entry['system']=='muscle':check(student.locator('.mq-panel').evaluate_all('es=>es.every(e=>!e.querySelector(".mq-status")||e.querySelector(":scope>.iu-task-action [data-mission-task]"))'),entry['id']+' retains explicit actions for every required muscular task')
   primary=student.locator('#exc-main-lab,#circ-lab,.skel-lab-section,.integ-quest,.resp-activity-game')
   check(not primary.count() or primary.first.locator(':scope>.iu-task-action [data-mission-task]').count()==1,entry['id']+' names the required investigation action')
   for lang in ['en','ar']:
    language(student,lang)
    for width in [390,1440]:
     student.set_viewport_size({'width':width,'height':1000})
     check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),entry['id']+' '+lang+' fits '+str(width)+'px')
     check(student.locator('[data-mission-task]').evaluate_all('es=>es.every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)'),entry['id']+' '+lang+' task headings remain readable at '+str(width)+'px')
     if entry['number']==1 or entry['id'] in ['excretory-3','excretory-4','excretory-5']:
      capture(student,entry['id']+'-'+lang+'-'+str(width))
    if lang=='ar':
     gaps=student.evaluate('''()=>[...document.querySelectorAll('.iu-task-action,.ea-process,.iu-optional>summary')].flatMap(e=>InneruLocale.coverage(e))''')
     check(not gaps,entry['id']+' task/diagram/disclosure copy has authored Arabic: '+str(gaps))
   language(student,'ar',True)
   check(student.locator('[data-mission-task]').first.is_visible(),entry['id']+' keeps the main action visible in Guided mode')
   if entry['number']==1:
    check(student.evaluate('__speech.calls.length')==0,entry['id']+' never autoplays task audio')
    student.locator('.iu-task-action .support-read-controls button').first.focus();student.keyboard.press('Enter')
    student.wait_for_function('__speech.calls.length>0')
    spoken=student.evaluate('__speech.calls.at(-1)')
    check(spoken['lang']=='ar-AE' and any('\u0600'<=c<='\u06ff' for c in spoken['text']),entry['id']+' keyboard activation reads the authored Arabic task')
    cancelled=student.evaluate('__speech.cancelled');student.keyboard.press('Escape')
    check(student.evaluate('__speech.cancelled')>cancelled,entry['id']+' Escape stops task reading')
   language(student,'en')
   check(student.evaluate('JSON.stringify(state)')==before,entry['id']+' inspection, language and Guided mode preserve the learning record')
   row={**entry,'illustrations':anatomical,'actions':student.locator('[data-mission-task]').all_text_contents()};rows.append(row)
   if entry['system']=='excretory' and entry['number'] in [1,3,4,5,6]:
    check(student.locator('.exc-bonus').evaluate_all('es=>es.every(e=>e.parentElement.matches("details.iu-optional")&&!e.parentElement.open)'),entry['id']+' optional side quests start collapsed')
    check(student.locator('.exc-bonus').evaluate_all('es=>es.every(e=>document.querySelector(".exc-checks").compareDocumentPosition(e.parentElement)&Node.DOCUMENT_POSITION_FOLLOWING)'),entry['id']+' places required checks before optional challenges')
    summary=student.locator('.iu-optional').filter(has=student.locator('.exc-bonus')).locator(':scope>summary')
    summary.focus();student.keyboard.press('Enter')
    check(summary.evaluate('e=>e.parentElement.open') and summary.evaluate('e=>parseFloat(getComputedStyle(e).outlineWidth)>=3'),entry['id']+' optional work opens by keyboard with visible focus')
    student.keyboard.press('Enter')
   if entry['id']=='excretory-5':
    for value,level,count in [(10,'low',1),(50,'moderate',3),(90,'high',5)]:
     student.locator('#adh-level').fill(str(value));scene=student.locator('[data-ea-process="5"]')
     check(scene.get_attribute('data-ea-adh')==level and scene.locator('[data-ea-water]').evaluate_all('es=>es.filter(e=>e.style.opacity==="1").length')==count,'ADH '+level+' synchronizes the real collecting-duct visual')
    open_optional(student,'.ea-acid-base');language(student,'ar');capture(student,'acid-base-ar-1440','.ea-acid-base')
    student.set_viewport_size({'width':320,'height':1000});capture(student,'acid-base-ar-320','.ea-acid-base')
    check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Arabic acid–base detail reflows at 320px')
    check(student.locator('.ea-acid-base svg').evaluate('e=>getComputedStyle(e).direction')=='ltr','RTL retains physical H⁺ and bicarbonate transport directions')
   if entry['id']=='excretory-3':
    language(student,'en');student.locator('[data-exc-item="5"]').click();check(student.locator('[data-ea-process="3"]').get_attribute('data-ea-filter')=='retained','blood-cell selection keeps the illustrated cargo on the blood side')
    student.emulate_media(reduced_motion='reduce');student.wait_for_function('document.querySelector(".ea-scope").dataset.eaMotion==="off"')
    check(student.locator('[data-ea-process="3"] svg').evaluate('e=>e.animationsPaused()'),'reduced motion stops the actual filtration transport animation')
   if entry['id']=='excretory-4':
    student.locator('button[data-ea-exchange="secrete"]').click();check(student.locator('[data-ea-process="4"]').get_attribute('data-ea-exchange')=='secrete','secretion reverses transport without joining blood and tubule lumens')
   if entry['number']==1:
    for width in [320,768]:
     student.set_viewport_size({'width':width,'height':1000});check(student.evaluate('document.documentElement.scrollWidth<=innerWidth'),entry['id']+' also fits '+str(width)+'px')
    language(student,'en');go(teacher,entry['route']+'?preview=1');old=teacher.evaluate('JSON.stringify(state)')
    check(teacher.locator('[data-mission-task]').count()>0 and teacher.locator('.iu-teacher-preview-bar').count()==1,entry['id']+' teacher preview uses the same required actions')
    language(teacher,'ar',True);check(teacher.evaluate('JSON.stringify(state)')==old,entry['id']+' preview presentation cannot alter teacher learning')
   if entry['id']=='skeletal-1':
    wrong=student.evaluate('(checks[1][0].answer+1)%3');xp=student.evaluate('state.xp')
    student.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
    student.wait_for_selector('#skeletal-check-0 .iu-task-action')
    check(student.evaluate('state.xp')==xp and student.evaluate('state.assessment.responses.find(r=>r.id==="skeletal:1:q0").correct') is False,'a wrong answer preserves its result and awards no XP after the question redraws')
   if entry['id']=='respiratory-1':
    xp=student.evaluate('state.xp')
    for index in [1,2,0]:
     student.locator(f'[data-lab="{index}"]').click();student.wait_for_selector('.ra-prediction .iu-task-action')
    check(student.evaluate('state.xp')==xp,'dynamic respiratory stations retain question instructions without awarding exploration XP')
  check(not any('.glb' in url or 'three.module' in url for url in requests),'mission anatomy does not download 3D models or Three.js')
  check(not errors,'no browser exceptions across all required missions: '+str(errors))
  Path(artifact('mission-audit.json')).write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
  Path(artifact('captures.json')).write_text(json.dumps(captures,indent=2)+'\n')
  browser.close()
 print(checks,'mission anatomy and clarity checks passed.')
finally:f.close()
