"""Current assigned-cloud roster, real student work and persisted teacher feedback.
Retains the real lesson interactions from the earlier public-dashboard harness;
retired anonymous/import UI is tested only through its data-format compatibility API.
"""
import json
from datetime import datetime
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, artifact, DatabaseFixture
ROOT=Path(__file__).resolve().parents[1]
fixture=DatabaseFixture('inneru_teacher_dashboard_check')
checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def go(p,route,selector):p.evaluate('(route)=>location.hash=route',route);p.wait_for_selector(selector)
def evidence(p):return p.evaluate('state.assessment?.responses||[]')
def selected_route(id,view='overview'):return 'teacher/student/'+id+('' if view=='overview' else '?view='+view)
def solve_choices(p,selector):
 for button in p.locator(selector).all():
  if button.is_disabled():break
  button.click()
def roster(p):return fixture.api(p,'classroom').json()['students']
def flush(p):
 p.evaluate('InneruCloud.flush()');p.wait_for_function('InneruCloud.status()==="Saved to your account"')
try:
 with sync_playwright() as pw:
  browser=launch(pw)
  teacher,t=fixture.account(browser,'riham.hassan@moe.sch.ae','Fixture teacher')
  fixture.open(teacher,'teacher','.td-tabs')
  check(teacher.locator('[data-td-students]').inner_text()=='0' and roster(teacher)==[],'fresh assigned classroom has no invented student records')
  check('Teacher Dashboard' in teacher.locator('.crumb').inner_text() and teacher.locator('[data-teacher-view=dashboard]').get_attribute('aria-current')=='page','teacher identity has its own active Dashboard navigation')
  check('TEACHER WORKSPACE' in teacher.locator('.topbar .profile').inner_text() and 'XP' not in teacher.locator('.topbar .profile').inner_text(),'teacher header does not present student XP as teacher identity')
  p,user=fixture.account(browser,'teacher-work-amina@example.com','Amina','10G5')
  same_name,second=fixture.account(browser,'teacher-work-second@example.com','Amina','10G6')
  outside,other=fixture.account(browser,'teacher-work-outside@example.com','Outside class','10G1')
  for page in [p,teacher]:page.on('pageerror',lambda e:errors.append(str(e)))
  fixture.unlock(teacher)
  # Real graded work with a wrong first answer and corrected submission.
  fixture.open(p,'dashboard','.sd-page')
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
  # Student previews remain teacher-only; denial leaves the student's saved work untouched.
  flush(p);before=fixture.api(p,'state').json()['progress']
  go(p,'excretory/mission/1?preview=1','.iu-mission-access-notice')
  check('Only teachers' in p.locator('.iu-mission-access-notice').inner_text(),'student URL changes cannot enter teacher preview')
  check(fixture.api(p,'state').json()['progress']==before,'denied preview leaves the saved student record unchanged')
  student_id=user['id'];fixture.open(teacher,'teacher?view=students','.td-student-link')
  check(len(roster(teacher))==2 and {r['id'] for r in roster(teacher)}=={student_id,second['id']},'teacher roster contains exactly the two assigned students and excludes the other teacher’s class')
  check(teacher.locator('.td-student-link').count()==2 and all(r['name']=='Amina' for r in roster(teacher)),'same-name students retain distinct account identities')
  check(teacher.locator('#t-import,#t-save,#t-reset').count()==0,'retired shared-device/import controls cannot replace account-linked student identities')
  teacher.locator('#td-group-filter').select_option('10G5');check(teacher.locator('.td-student-link').count()==1,'class filter selects only the requested assigned class')
  teacher.locator('#td-group-filter').select_option('');teacher.locator('#td-student-search').fill('Amina');check(teacher.locator('.td-student-link').count()==2,'name search preserves students with matching display names')
  teacher.locator('#td-student-search').fill('');teacher.locator('#td-sort').select_option('xp')
  check(teacher.locator('.td-student-link').first.get_attribute('href').endswith(student_id),'roster sorts by real earned XP')
  with teacher.expect_download() as download:teacher.locator('[data-td-export-csv]').click()
  csv=Path(download.value.path()).read_text()
  check('Completed missions' in csv and '10G5' in csv and 'Outside class' not in csv,'roster CSV exports only assigned learner data')
  go(teacher,selected_route(student_id,'answers'),'[data-td-answer-list]');teacher.locator('#td-answer-status').select_option('written')
  check('Skeletal muscle pulls' in teacher.locator('.td-answer-list').inner_text(),'teacher sees the complete submitted explanation')
  review_count=int(teacher.locator('[data-td-review-count]').inner_text())
  form=teacher.locator('[data-td-feedback]').first
  form.locator('textarea').fill('Clear comparison. <b>Keep exploring.</b>');form.locator('input').check();form.locator('button').click();teacher.wait_for_function('document.querySelector(".td-form-status").textContent.includes("saved")')
  saved=next(r for r in roster(teacher) if r['id']==student_id);feedback=saved['feedback'][written['id']]
  check(feedback['reviewedAt'] and datetime.fromisoformat(feedback['submissionAt'].replace('Z','+00:00'))==datetime.fromisoformat(written['at'].replace('Z','+00:00')) and '<b>' in feedback['note'],'teacher feedback is stored against the exact submission version')
  check(fixture.api(p,'state').json()['progress']==before,'reviewing an answer neither changes student work nor awards XP')
  check(int(teacher.locator('[data-td-review-count]').inner_text())==review_count-1,'review count decreases for the same submitted version despite normalized database timestamps')
  teacher.reload();teacher.wait_for_selector('[data-td-answer-list]');teacher.locator('#td-answer-status').select_option('written')
  check('Clear comparison' in teacher.locator('.td-answer textarea').first.input_value() and 'Reviewed' in teacher.locator('.td-answer-meta').first.inner_text(),'feedback and reviewed status survive a verified page reload')
  check(teacher.locator('.td-answer textarea b').count()==0,'feedback markup stays plain text')
  with teacher.expect_download() as download:teacher.locator('[data-td-export-answers]').click()
  exported=Path(download.value.path()).read_text()
  check('Student answer' in exported and 'Skeletal muscle pulls' in exported and 'Clear comparison' in exported,'answer export contains real work and saved teacher feedback')
  teacher.locator('[data-cloud-open-classroom]').click();teacher.locator('[data-cloud-student="'+student_id+'"]').click()
  cloud_form=teacher.locator('[data-cloud-feedback='+json.dumps(written['id'])+']')
  check(cloud_form.locator('input').is_checked() and 'Clear comparison' in cloud_form.locator('textarea').input_value(),'account classroom panel recognises the same saved review across equivalent timestamp formats')
  # A new version must be reviewed anew; the earlier note stays available.
  go(p,'muscle/mission/1','#m1-check-3 textarea')
  p.evaluate('(r)=>InneruEvidence.record({...r,answer:r.answer+" A new example is a heartbeat.",at:undefined})',written);flush(p)
  teacher.locator('.td-topline [data-td-refresh]').click();teacher.wait_for_selector('[data-td-answer-list]')
  teacher.wait_for_function('document.querySelector(".td-answer-list").textContent.includes("new example")')
  check('earlier review applies' in teacher.locator('.td-answer-list').inner_text() and not teacher.locator('.td-answer input[type=checkbox]').first.is_checked(),'updated student work requires a fresh review and preserves the previous feedback')
  denied=fixture.api(outside,'feedback',{'studentId':student_id,'responseId':written['id'],'note':'Not a teacher','reviewed':True,'submissionAt':written['at']})
  check(denied.status==403,'student sessions cannot submit teacher feedback')
  go(teacher,selected_route(student_id,'progress'),'.td-world-records')
  check(teacher.locator('.td-world-record').count()==6 and teacher.locator('.td-mission-list li.is-done').count()==1,'individual progress shows actual mission completion across all six systems')
  go(teacher,selected_route(student_id,'achievements'),'.td-badge-grid')
  check(teacher.locator('.td-badge.is-earned').count()==1,'teacher badge view agrees with the learner’s completed-task achievements')
  opener=teacher.locator('[data-td-badge="skeletal-mission-1"]');opener.click();teacher.wait_for_selector('dialog[open]')
  check('Complete mission 1' in teacher.locator('dialog').inner_text() and 'Amina' in teacher.locator('dialog').inner_text(),'badge details show the actual requirement and the selected student')
  teacher.keyboard.press('Escape');check(opener.evaluate('el=>el===document.activeElement'),'badge dialog returns keyboard focus to its opener')
  # Existing compact formats remain readable, without granting UI access to imports.
  code=p.evaluate('InneruTeacher.encode(state)');decoded=p.evaluate('(code)=>InneruTeacher.decode(code).payload',code)
  check(decoded['a']['responses']==evidence(p),'progress-code compatibility retains recorded answers without using retired teacher import controls')
  check(p.evaluate('(payload)=>{const before=JSON.stringify(state);InneruLearning.snapshot(InneruTeacher.profile(payload));return JSON.stringify(state)===before}',decoded),'reading a transferred profile does not replace live account state')
  for width in [1680,1280,1024,768,390,320]:
   teacher.set_viewport_size({'width':width,'height':950})
   for route,selector in [('teacher?view=students','.td-table'),(selected_route(student_id,'progress'),'.td-world-records'),(selected_route(student_id,'answers'),'.td-answer-list'),(selected_route(student_id,'achievements'),'.td-badge-grid'),(selected_route(student_id,'notes'),'.td-section')]:
    go(teacher,route,selector);check(teacher.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}px {route.split("?")[-1]} fits without overflow')
  teacher.emulate_media(reduced_motion='reduce');go(teacher,selected_route(student_id,'achievements'),'.td-badge-grid')
  check(teacher.locator('.td-badge').first.evaluate('el=>getComputedStyle(el).transitionDuration')=='0s','reduced motion removes decorative badge transitions')
  teacher.set_viewport_size({'width':1680,'height':1100});go(teacher,'home','.iu-expedition')
  check(teacher.locator('.td-page').count()==0 and teacher.locator('.crumb').inner_text().endswith('Explore Worlds'),'leaving the Dashboard opens the shared portal home')
  # Assigned rosters fail closed offline; old local imports are never substituted.
  go(teacher,'teacher?view=students','.td-table');teacher.context.set_offline(True);teacher.locator('.td-topline [data-td-refresh]').click();teacher.wait_for_selector('.td-notice.is-error')
  check(teacher.locator('.td-student-link').count()==0,'offline assigned-roster failure never substitutes browser-imported student data')
  teacher.context.set_offline(False);teacher.reload();teacher.wait_for_selector('.td-student-link')
  check(teacher.locator('.td-student-link').count()==2,'reconnection restores the assigned roster')
  go(teacher,selected_route(student_id,'answers'),'.td-answer-list');teacher.screenshot(path=artifact('teacher-answers-desktop.png'),full_page=True)
  teacher.set_viewport_size({'width':390,'height':900});teacher.screenshot(path=artifact('teacher-answers-phone.png'),full_page=True)
  check(not errors,'no JavaScript exceptions across real submissions and assigned classroom operations: '+str(errors))
  browser.close()
 print(f'{checks} teacher dashboard checks passed.')
finally:fixture.close()
