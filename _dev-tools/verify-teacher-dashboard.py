"""Real submitted work, complete classroom records, and safe teacher review."""
import base64,copy,functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
ORIGIN=f'http://127.0.0.1:{server.server_port}'
URL=ORIGIN+'/?nosw=1'
checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def go(p,hash,selector):
 p.evaluate('(v)=>location.hash=v',hash);p.wait_for_selector(selector)
def raw(p):return p.evaluate('localStorage.getItem("bodyquest-v1")')
def evidence(p):return p.evaluate('state.assessment?.responses||[]')
def classes(p):return p.evaluate('InneruTeacher.list()')
def record(p,id):return p.evaluate('(id)=>InneruTeacher.get(id)',id)
def selected_route(id,view='overview'):return 'teacher/student/'+id+('' if view=='overview' else '?view='+view)
def solve_choices(p,selector):
 for b in p.locator(selector).all():
  if b.is_disabled():break
  b.click()
def legacy_code(name='Earlier learner',xp=50):
 data={'v':1,'n':name,'x':xp,'k':'000000','w':'010000','c':0};text=json.dumps(data,separators=(',',':'));h=0
 for c in text:h=(h*31+ord(c))%1296
 chars='0123456789abcdefghijklmnopqrstuvwxyz';return 'INNERU1-'+base64.urlsafe_b64encode(text.encode()).decode().rstrip('=')+'-'+chars[h//36]+chars[h%36]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':1680,'height':1100},accept_downloads=True)
  p=context.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(URL+'#teacher',wait_until='domcontentloaded');p.wait_for_selector('.td-tabs')
  before=raw(p)
  check(p.locator('[data-td-students]').inner_text()=='0' and len(classes(p))==0,'fresh teacher register has no invented students or class data')
  check('Teacher Dashboard' in p.locator('.crumb').inner_text() and p.locator('.sidebar a[href="#teacher"]').get_attribute('class').endswith('active'),'teacher page has its own active navigation and breadcrumb')
  check('TEACHER WORKSPACE' in p.locator('.topbar .profile').inner_text() and 'XP' not in p.locator('.topbar .profile').inner_text(),'teacher header does not present the active student’s XP as the teacher’s identity')
  go(p,'teacher?view=answers','.td-answer-list');check(p.locator('.td-empty').count()==1,'answer desk explains that student submissions must be collected')
  go(p,'teacher?view=achievements','.td-badge-grid');check(p.locator('.td-badge').count()==49 and p.locator('.td-badge.is-earned').count()==0,'achievement cabinet uses all current requirements without granting unearned badges')
  check(raw(p)==before,'browsing the class dashboard changes no learner progress')
  check(p.evaluate('(()=>{const before=JSON.stringify(state),m=InneruLearning.snapshot({name:"Separate",xp:50,done:[1],rewards:[],weak:[]});return m.missions===1&&JSON.stringify(state)===before})()'),'imported profiles use the same progress model without swapping or mutating live learner state')

  # Real graded work with a wrong first answer and corrected submission.
  go(p,'mission/1','[data-skeletal-mission="1"]')
  correct=p.evaluate('checks[1][0].answer');wrong=(correct+1)%3
  wrong_text=p.evaluate('(i)=>checks[1][0].options[i]',wrong)
  p.locator(f'[data-skel-question="0"][data-skel-answer="{wrong}"]').click()
  check(p.evaluate('state.xp===0') and evidence(p)[0]['correct'] is False,'incorrect work is recorded without awarding points')
  p.locator(f'[data-skel-question="0"][data-skel-answer="{correct}"]').click()
  answer=evidence(p)[0]
  check(answer['correct'] is True and answer['attempts']==2 and answer['history'][0]['answer']==wrong_text and answer['history'][0]['correct'] is False,'corrected answers retain the actual earlier choice and attempt result')
  check(answer['answer']==answer['expected'] and answer['prompt'] and answer['at'],'answer records contain the real prompt, answer, reference response and timestamp')
  for i,j in enumerate(p.evaluate('checks[1].map(q=>q.answer)')):
   b=p.locator(f'[data-skel-question="{i}"][data-skel-answer="{j}"]')
   if b.is_enabled():b.click()
  for i,v in enumerate([0,0,0,1,1,1,1]):p.locator(f'#division-{i}').select_option(str(v))
  p.locator('#division-check').click();p.locator('#complete').click();p.wait_for_selector('.skel-chapters')
  check(p.evaluate('state.xp===50&&state.done.includes(1)') and p.evaluate('InneruLearning.snapshot().earned.length===1'),'answer recording preserves the existing once-only mission XP and achievement requirements')
  check(any(a['kind']=='submission' and 'Axial' in a['answer'] for a in evidence(p)),'submitted investigation settings are retained as teacher-review work, without an inferred grade')

  # Science checkpoints in every other system use their actual grading logic.
  targets=[('integumentary/mission/1','[data-question="0"] [data-choice]','integumentary'),('respiratory/mission/1','.resp-question[data-question="1-q0"] [data-choice]','respiratory'),('excretory/mission/1','[data-exc-question="0"] [data-choice]','excretory'),('circulatory/1','.circ-question[data-q="m1-c0"] [data-answer]','circ'),('muscle/mission/1','#m1-conscious [data-option]','muscle')]
  for route,selector,system in targets:
   go(p,route,selector)
   if system=='muscle':p.locator(selector+'[data-option="1"]').click()
   else:solve_choices(p,selector)
   found=[a for a in evidence(p) if a['system']==system and a['correct'] is True]
   check(bool(found) and found[-1]['answer']==found[-1]['expected'],system+' checkpoint records the submitted answer and its authoritative automatic result')
  p.locator('#m1-check-3 textarea').fill('Skeletal muscle pulls on bones, cardiac muscle pumps blood, and smooth muscle moves material through hollow organs.')
  p.locator('#m1-check-3 [data-compare]').click()
  for i in range(3):p.locator(f'#m1-check-3 [data-reflection="{i}"]').check()
  p.locator('#m1-check-3 [data-confirm]').click()
  written=[a for a in evidence(p) if a['kind']=='written'][0]
  check(written['correct'] is None and 'Skeletal muscle pulls' in written['answer'],'submitted explanations are saved for teacher review and never labelled automatically correct')
  student_id=p.evaluate('state.learnerId');check(len(student_id)>=8,'learner identity persists independently of the displayed nickname')
  before=raw(p);go(p,'excretory/mission/1?preview=1','[data-exc-question="0"] [data-choice]');solve_choices(p,'[data-exc-question="0"] [data-choice]')
  check(raw(p)==before,'preview responses create no evidence, points or profile writes')

  # Collect the current student, then import the same identity again.
  go(p,'teacher','.td-tabs');p.evaluate('state.name="Amina";save()')
  p.locator('#t-save').click();p.wait_for_function('(async()=> (await InneruTeacher.list()).length===1)()')
  p.wait_for_timeout(200)
  first=record(p,student_id);check(first['name']=='Amina' and first['payload']['a']['responses'],'classroom snapshot contains this learner’s actual submitted work')
  p.locator('#t-code').click();code=p.locator('#t-code-text').input_value();decoded=p.evaluate('(s)=>InneruTeacher.decode(s).payload',code)
  check(decoded['id']==student_id and decoded['a']['responses']==evidence(p),'share codes carry stable identity and the complete recorded response set')
  p.locator('#t-import').fill(code);p.locator('#t-add').click();p.wait_for_timeout(300)
  check(len(classes(p))==1,'reimporting a learner updates the existing register entry instead of duplicating students')
  before=raw(p)

  # Distinct learner IDs may share a nickname. Fixtures are isolated to this browser.
  others=p.evaluate('''(async()=>{const base=InneruTeacher.current();const ids=[];for(const name of ['Sara','Amina']){const p={v:1,id:crypto.randomUUID(),at:new Date().toISOString(),n:name,x:0,k:'000000',w:'000000',c:0,r:[],t:{skeletal:{done:[]}},a:{version:1,responses:[]}};await InneruTeacher.upsert(p);ids.push(p.id);}return ids;})()''')
  p.locator('.td-topline [data-td-refresh]').click();p.wait_for_function('document.querySelector("[data-td-students]").textContent==="3"')
  check(len(classes(p))==3 and raw(p)==before,'same-name students remain distinct and classroom imports never replace the active learner')
  result=p.evaluate('(v)=>InneruTeacher.upsert(v.payload,{targetId:v.other})',{'payload':first['payload'],'other':others[0]})
  check(result['record']['id']==student_id and len(classes(p))==3 and record(p,others[0])['name']=='Sara','a modern learner ID remains authoritative even if an old-code matching choice was left selected')
  go(p,selected_route(student_id,'notes'),'[data-td-notes]')
  p.locator('#td-class-group').fill('Grade 10 A');p.locator('#td-student-notes').fill('Strong structure-function links. <script>window.noteExecuted=true</script>')
  p.locator('[data-td-notes] button').click();p.wait_for_timeout(250)
  check(record(p,student_id)['group']=='Grade 10 A' and '<script>' in record(p,student_id)['notes'] and p.evaluate('!window.noteExecuted'),'teacher notes and group membership save as text without executing markup')
  check(raw(p)==before,'teacher annotations leave student answers, earned points and badges unchanged')
  go(p,'teacher?view=students','[data-td-roster-filter]');p.locator('#td-group-filter').select_option('Grade 10 A')
  check(p.locator('.td-table tbody tr').count()==1,'class-group filter selects the intended learner')
  p.locator('#td-group-filter').select_option('');p.locator('#td-student-search').fill('Amina')
  check(p.locator('.td-table tbody tr').count()==2,'student search preserves different learners with the same nickname')
  p.locator('#td-student-search').fill('');p.locator('#td-sort').select_option('xp')
  check(p.locator('.td-table tbody tr').first.locator('th').inner_text().startswith('A\nAmina'),'register can sort students by actual earned XP')

  go(p,selected_route(student_id,'answers'),'[data-td-answer-list]');p.locator('#td-answer-status').select_option('written')
  check(p.locator('.td-answer').count()>=1 and 'Skeletal muscle pulls' in p.locator('.td-answer-list').inner_text(),'teacher can find and read the student’s complete written explanation')
  form=p.locator('[data-td-feedback]').first
  form.locator('textarea').fill('Clear comparison. Next, explain one example of involuntary control. <b>Keep exploring.</b>')
  form.locator('input').check();form.locator('button').click();p.wait_for_timeout(200)
  saved=record(p,student_id);feedback=saved['feedback'][written['id']]
  check(feedback['reviewedAt'] and feedback['submissionAt']==written['at'] and '<b>' in feedback['note'],'review decisions and teacher comments are tied to the exact submitted version')
  check(raw(p)==before and saved['payload']['a']['responses']==first['payload']['a']['responses'],'teacher review does not rewrite the student’s work or award achievement credit')
  p.reload(wait_until='domcontentloaded');p.wait_for_selector('[data-td-answer-list]')
  p.locator('#td-answer-status').select_option('written')
  check('Clear comparison' in p.locator('.td-answer textarea').first.input_value() and p.locator('.td-answer .td-answer-meta').first.inner_text().endswith('Reviewed'),'feedback and reviewed state survive a page reload')
  older=copy.deepcopy(saved['payload']);older['at']='2000-01-01T00:00:00Z';older['x']=0
  result=p.evaluate('(p)=>InneruTeacher.upsert(p)',older)
  check(result['stale'] and record(p,student_id)['payload']['x']==saved['payload']['x'],'an older snapshot cannot silently roll back newer saved progress')
  newer=copy.deepcopy(saved['payload']);newer['at']='2030-01-01T00:00:00Z'
  for a in newer['a']['responses']:
   if a['id']==written['id']:a['at']='2030-01-01T00:00:00Z';a['answer']+=' A new example is a heartbeat.'
  p.evaluate('(p)=>InneruTeacher.upsert(p)',newer);p.locator('.td-topline [data-td-refresh]').click();p.wait_for_timeout(250);p.locator('#td-answer-status').select_option('written')
  check('earlier review applies' in p.locator('.td-answer-list').inner_text() and not p.locator('.td-answer input[type=checkbox]').first.is_checked(),'an updated submission requires a new review while retaining prior teacher feedback')

  go(p,selected_route(student_id,'progress'),'.td-world-records')
  check(p.locator('.td-world-record').count()==6 and p.locator('.td-mission-list li.is-done').count()==1,'individual progress shows actual completed missions across all current systems')
  go(p,selected_route(student_id,'achievements'),'.td-badge-grid')
  check(p.locator('.td-badge.is-earned').count()==1,'teacher achievements agree with the learner’s task-based badge model')
  opener=p.locator('[data-td-badge="skeletal-mission-1"]');opener.click();p.wait_for_selector('dialog[open]')
  check('Complete mission 1' in p.locator('dialog').inner_text() and 'Amina' in p.locator('dialog').inner_text(),'earned badge details include the actual requirement and learner confirmation')
  p.keyboard.press('Escape');check(opener.evaluate('el=>el===document.activeElement'),'badge dialogs return keyboard focus to their opener')

  # Earlier compact codes remain useful without fabricated per-question history.
  go(p,'teacher?view=students','#t-import');p.locator('#t-import').fill(legacy_code());p.locator('#t-add').click();p.wait_for_timeout(250)
  legacy=next(r for r in classes(p) if r['name']=='Earlier learner')
  legacy_model=p.evaluate('(r)=>InneruTeacher.model(r)',legacy)
  check(legacy_model['summaryOnly'] and legacy_model['missions']==1 and legacy_model['responses']==[] and not any(b['earned'] for b in legacy_model['badges'] if b['kind']=='mission'),'legacy totals are retained without inventing exact mission badges or answer choices')
  go(p,selected_route(legacy['id'],'progress'),'.td-world-records')
  check(p.locator('.td-mission-list').count()==0 and 'without naming' in p.locator('.td-world-records').inner_text(),'summary-only learners have a clear missing-detail state instead of guessed mission records')
  go(p,'teacher?view=students','#t-import');p.locator('#t-import').fill(legacy_code(xp=60));p.locator('#t-add').click();p.wait_for_selector('#td-import-target')
  check(len(classes(p))==4,'ambiguous old codes ask which student to update before changing the register')
  p.locator('#td-import-target').select_option(legacy['id']);p.locator('#t-add').click();p.wait_for_timeout(250)
  check(len(classes(p))==4 and record(p,legacy['id'])['payload']['x']==60,'explicit legacy matching updates the selected record and preserves learner identity')
  p.locator('#t-import').fill('INNERU1-damaged-xx');p.locator('#t-add').click()
  check('damaged' in p.locator('#t-import-out').inner_text() or 'checksum' in p.locator('#t-import-out').inner_text(),'damaged progress codes expose an import error without replacing class data')

  # Backup/restore includes evidence and teacher annotations, not just totals.
  with p.expect_download() as d:p.locator('[data-td-backup]').click()
  backup=json.loads(Path(d.value.path()).read_text())
  check(backup['version']==2 and len(backup['students'])==4 and any(r['feedback'] for r in backup['students']),'downloaded classroom backup includes learners, recorded answers and teacher feedback')
  with p.expect_download() as d:p.locator('[data-td-export-csv]').click()
  check('Completed missions' in Path(d.value.path()).read_text() and 'Grade 10 A' in Path(d.value.path()).read_text(),'register CSV exports the visible class data and progress columns')
  go(p,selected_route(student_id,'answers'),'[data-td-export-answers]')
  with p.expect_download() as d:p.locator('[data-td-export-answers]').click()
  exported=Path(d.value.path()).read_text()
  check('Student answer' in exported and 'A new example is a heartbeat' in exported and 'Clear comparison' in exported,'response export contains actual submitted text, references and teacher feedback')
  before=raw(p);p.locator('#t-clear').click();p.wait_for_selector('[data-td-confirm]');p.locator('dialog [data-td-close]').last.click()
  check(len(classes(p))==4,'cancelling register removal retains every student')
  p.locator('#t-clear').click();p.wait_for_selector('[data-td-confirm]');p.locator('[data-td-confirm]').click();p.wait_for_timeout(300)
  check(len(classes(p))==0 and raw(p)==before,'clearing the teacher register leaves the active learner’s answers and progress intact')
  p.locator('[data-td-backup-file]').set_input_files({'name':'classroom.json','mimeType':'application/json','buffer':json.dumps(backup).encode()});p.wait_for_timeout(350)
  restored=record(p,student_id)
  check(len(classes(p))==4 and restored['notes']==saved['notes'] and restored['feedback']==saved['feedback'] and restored['payload']==newer,'classroom backup restores complete learning snapshots, notes and review decisions')
  invalid=copy.deepcopy(backup);invalid['students'][1]['id']='!!!'
  result=p.evaluate('(v)=>InneruTeacher.importBackup(v).then(()=>false,e=>e.message)',invalid)
  check(result and len(classes(p))==4,'invalid backups fail before partially replacing classroom records')

  # Shared-device reset is confirmed, reversible and separate from the register.
  p.locator('#t-reset').click();p.wait_for_selector('[data-td-confirm]');p.locator('dialog [data-td-close]').last.click()
  check(raw(p)==before,'cancelling shared-device preparation preserves the current student')
  p.locator('#t-reset').click();p.wait_for_selector('[data-td-confirm]');p.locator('[data-td-confirm]').click();p.wait_for_timeout(300)
  check(p.evaluate('state.xp===0&&!state.assessment&&!state.learnerId') and len(classes(p))==4,'confirmed preparation starts a fresh learner without removing saved class snapshots')
  p.locator('#t-undo').click();p.wait_for_timeout(250)
  check(p.evaluate('state.learnerId')==student_id and p.evaluate('state.xp')==json.loads(before)['xp'] and evidence(p)==json.loads(before)['assessment']['responses'],'undo restores the previous learner identity, answers and earned points')

  # Responsive records and dialogs use real fixture data, never production seed data.
  for width in [1680,1280,1024,768,390,320]:
   p.set_viewport_size({'width':width,'height':950})
   for route,selector in [('teacher?view=students','.td-table'),(selected_route(student_id,'progress'),'.td-world-records'),(selected_route(student_id,'answers'),'.td-answer-list'),(selected_route(student_id,'achievements'),'.td-badge-grid'),(selected_route(student_id,'notes'),'[data-td-notes]')]:
    go(p,route,selector)
    if not p.evaluate('document.documentElement.scrollWidth<=innerWidth'):
     print(p.evaluate('JSON.stringify([...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,id:e.id,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width,scroll:e.scrollWidth})).slice(0,30))'),flush=True)
     p.screenshot(path='/workspace/cloud-onboarding/teacher-overflow.png',full_page=True)
     raise AssertionError((width,route))
   check(True,f'{width}px register, mission records, answers, badges and notes fit without page overflow')
  p.emulate_media(reduced_motion='reduce')
  check(p.locator('.td-page').evaluate('el=>getComputedStyle(el.querySelector(".td-button")).transitionDuration')=='0s','reduced motion removes decorative teacher-dashboard transitions')
  p.set_viewport_size({'width':1680,'height':1100});go(p,'home','.iu-expedition')
  check(p.locator('.td-page').count()==0 and p.locator('.crumb').inner_text().endswith('Explore Worlds'),'leaving the classroom restores normal portal layout and navigation')
  # Updates in a second classroom tab announce fresh work without discarding edits.
  go(p,selected_route(student_id,'notes'),'[data-td-notes]')
  p.locator('#td-student-notes').fill('An unsaved teaching thought')
  other=context.new_page();other.goto(URL+'#teacher');other.wait_for_selector('.td-tabs')
  other.evaluate('(id)=>InneruTeacher.edit(id,{group:"Grade 10 B"})',student_id)
  p.wait_for_selector('[data-td-update]:not([hidden])')
  check(p.locator('#td-student-notes').input_value()=='An unsaved teaching thought','another classroom tab announces updated records without discarding an unsaved note')
  p.locator('.td-topline [data-td-refresh]').click();p.wait_for_selector('[data-td-confirm]');p.locator('dialog [data-td-close]').last.click()
  check(p.locator('#td-student-notes').input_value()=='An unsaved teaching thought','cancelling refresh preserves the current teacher draft')
  other.close()
  # Concurrent imports serialize against the latest saved record.
  result=p.evaluate('(async()=>{const payload={v:1,n:"Concurrent import",x:0,k:"000000",w:"000000",c:0};const rows=await Promise.all([InneruTeacher.upsert(payload),InneruTeacher.upsert(payload)]);return rows[0].record.id===rows[1].record.id})()')
  check(result,'identical older codes arriving together create one classroom record')
  # Existing class summaries migrate to the new register without changing learners.
  oldcontext=browser.new_context();oldcontext.add_init_script('localStorage.setItem("inneru-class-v1",JSON.stringify([{name:"Previous class",xp:80,k:"000000",w:"010000",savedAt:"2026-10-01T00:00:00Z"}]))')
  oldpage=oldcontext.new_page();oldpage.goto(URL+'#teacher');oldpage.wait_for_selector('.td-tabs')
  migrated=classes(oldpage)
  check(len(migrated)==1 and migrated[0]['name']=='Previous class' and migrated[0]['payload']['x']==80,'the previous teacher class list migrates with its existing names and totals')
  oldpage.reload();oldpage.wait_for_selector('.td-tabs')
  check(len(classes(oldpage))==1,'migration is idempotent across page reloads')
  oldcontext.close()
  # Unavailable classroom storage reports a real error, never a successful save.
  blocked=browser.new_context();blocked.add_init_script('Object.defineProperty(window,"indexedDB",{value:undefined})')
  bp=blocked.new_page();bp.goto(URL+'#teacher');bp.wait_for_selector('.td-notice.is-error')
  check('unavailable' in bp.locator('[role=alert]').inner_text() and bp.evaluate('state.xp===0'),'unavailable classroom storage shows an error while learner progress remains intact')
  blocked.close()
  # The registered worker serves the complete classroom and its saved responses offline.
  off=context.new_page();off.goto(ORIGIN+'/index.html#teacher/student/'+student_id+'?view=answers',wait_until='load')
  off.evaluate('navigator.serviceWorker.ready');off.wait_for_function('navigator.serviceWorker.controller!==null')
  off.wait_for_selector('.td-answer-list')
  cached=off.evaluate('(async()=>{const c=await caches.open("inneru-v38");return !!(await c.match("teacher-dashboard.js?v=teacher-desk-1"))&&!!(await c.match("learning-evidence.js?v=teacher-desk-1"));})()')
  check(cached,'the current worker precaches both the submitted-work journal and teacher dashboard')
  context.set_offline(True);off.reload(wait_until='domcontentloaded');off.wait_for_selector('.td-answer-list')
  check('A new example is a heartbeat' in off.locator('.td-answer-list').inner_text() and len(classes(off))==5,'saved classroom answers and records remain usable offline')
  context.set_offline(False);off.close()
  p.locator('dialog[open]').count() and p.keyboard.press('Escape')
  go(p,'teacher','.td-system-grid');p.screenshot(path='/workspace/cloud-onboarding/teacher-dashboard-desktop.png',full_page=True)
  go(p,selected_route(student_id,'answers'),'.td-answer-list');p.screenshot(path='/workspace/cloud-onboarding/teacher-answers-desktop.png',full_page=True)
  p.set_viewport_size({'width':390,'height':900});p.screenshot(path='/workspace/cloud-onboarding/teacher-answers-phone.png',full_page=True)
  check(not errors,'no browser JavaScript exceptions across real submissions and classroom operations: '+str(errors))
  browser.close()
 print(f'{checks} teacher dashboard checks passed.')
finally:server.shutdown()
