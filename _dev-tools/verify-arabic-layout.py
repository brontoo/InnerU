"""Rendered Arabic layout gate. Loopback accounts + isolated SQL; no production data.
Screenshots and JSON geometry are review artifacts, not golden-image snapshots.
Run: npm run test:arabic-layout. See ARABIC-LAYOUT.md for scope and limits.
"""
import json,re
from pathlib import Path
from test_support import DatabaseFixture,playwright_session,launch,artifact,new_context
ROOT=Path(__file__).resolve().parents[1]
PROBE=(ROOT/'_dev-tools/layout-probe.js').read_text()
f=DatabaseFixture('inneru_arabic_layout_check')
report=[];failures=[];errors=[];checks=0
prefs="localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:false}));"
def check(value,message):
 global checks
 checks+=1
 if not value:failures.append(message)
 print(('PASS ' if value else 'FAIL ')+message,flush=True)
def capture(page,key,widths=(320,768,1440),height=1000):
 for width in widths:
  page.mouse.move(0,0);page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(80)
  stage=page.locator('.body-atlas-stage,#heart-canvas,.exc-explorer-stage').first
  if stage.count() and any(word in key for word in ['-world','-anatomy-','-structure-']):
   stage.scroll_into_view_if_needed();page.wait_for_timeout(220)
  result=page.evaluate(PROBE);result['state']=key
  if key.startswith('home'):
   result['issues']+=page.evaluate("""()=>{
    const issues=[],expected=['#integumentary','#world','#muscle','#respiratory','#circulatory','#excretory'];
    const lab=document.querySelector('.anatomy-lab').getBoundingClientRect();
    const cards=[...document.querySelectorAll('.anatomy-lab [data-card]')];
    if(cards.length!==6)issues.push({kind:'home-card-count'});
    for(const card of cards){
     const link=card.querySelector('a.btn'),r=card.getBoundingClientRect(),a=link?.getBoundingClientRect();
     if(!link||link.getAttribute('href')!==expected[+card.dataset.card])issues.push({kind:'home-destination',system:card.dataset.card});
     if(r.left<lab.left+8||r.right>lab.right-8)issues.push({kind:'home-card-clipped',system:card.dataset.card});
     if(!a||a.width<r.width-42||a.height<44)issues.push({kind:'home-action-size',system:card.dataset.card});
    }
    const labels=[...document.querySelectorAll('[data-label-system]')];
    if(labels.map(el=>el.dataset.labelSystem).join(',')!=='0,1,2,3,4,5')issues.push({kind:'home-label-reading-order'});
    if(innerWidth<=640){
     const model=document.querySelector('#human-map').getBoundingClientRect();
     if(labels.some(el=>el.getBoundingClientRect().top<model.bottom-1))issues.push({kind:'home-mobile-labels-cover-model'});
    }
    return issues;
   }""")
  filename=re.sub('[^a-zA-Z0-9-]+','-',key).strip('-')+'-'+str(width)+'.png'
  result['screenshot']=filename
  page.screenshot(path=artifact(filename),full_page=True,animations='disabled')
  report.append(result)
  Path(artifact('layout-report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2))
  check(not result['issues'],key+' at '+str(width)+'px: no overflow, clipped captions or artwork collisions'+(' '+json.dumps(result['issues'][:3],ensure_ascii=False) if result['issues'] else ''))
def load_visible_art(page):
 # Full-page captures must actually visit deferred illustrations, not record their
 # unloaded placeholders. This changes only the test's scroll position.
 page.mouse.move(0,0)
 page.evaluate("""async()=>{
  const position=scrollY;
  for(const image of document.images) {
   if(image.loading==='lazy'&&!image.complete&&image.checkVisibility({checkVisibilityCSS:true})) {
    image.scrollIntoView({block:'center'});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await image.decode().catch(()=>{});
   }
  }
  scrollTo(0,position);
 }""")
def ready(page):
 page.wait_for_function('document.documentElement.lang==="ar" && !document.querySelector("[data-route-loading]") && (document.querySelector("#main")||document.querySelector(".gate-welcome"))')
 page.wait_for_timeout(180);load_visible_art(page)
def go(page,route):
 page.goto(f.origin+'/index.html?nosw=1#'+route);ready(page)
def flush(page):
 page.evaluate('InneruCloud.flush()');page.wait_for_function('InneruCloud.status()==="Saved to your account"')
try:
 f.sql('delete from auth.users;')
 with playwright_session() as pw:
  b=launch(pw)
  teacher,t=f.account(b,'riham.hassan@moe.sch.ae','ريهام حسن المعلمة')
  student,u=f.account(b,'layout-student@example.com','أحمد محمد عبدالرحمن','10G5')
  second,second_user=f.account(b,'layout-second@example.com','Learner 2 أحمد','10G6')
  owner,o=f.account(b,'layout-owner@example.com','مسؤولة المدرسة')
  f.sql("update public.profiles set role='admin' where id='"+o['id']+"'")
  pending=new_context(b,service_workers='block').new_page()
  assert pending.request.post(f.origin+'/api/auth?action=signup',data={'email':'pending-layout-teacher@example.com','password':'Local-Layout-Fixture-123','name':'معلمة بانتظار المراجعة','avatarId':'sage','requestedRole':'teacher'}).ok
  f.unlock(teacher)
  anon=new_context(b,service_workers='block').new_page()
  for page in [teacher,student,second,owner,anon]:
   page.add_init_script(prefs);page.emulate_media(reduced_motion='reduce');page.on('pageerror',lambda error:errors.append(str(error)))
  anon.goto(f.origin+'/login.html');ready(anon);capture(anon,'entry-role-cards')
  for role in ['student','teacher']:
   anon.goto(f.origin+'/login.html?role='+role);ready(anon);capture(anon,'signin-'+role)
   anon.locator('[data-auth-mode=signup]').first.click();capture(anon,'signup-'+role)
   anon.locator('#gate-entry-form [type=submit]').click();capture(anon,'signup-validation-'+role,(320,1440))
   anon.locator('#entry-email').fill('layout-entry@example.com');anon.locator('#entry-password').fill('Local-Layout-Fixture-123');anon.locator('#entry-confirm').fill('Local-Layout-Fixture-123')
   if role=='student':anon.locator('#entry-class').select_option('10G5')
   anon.locator('#gate-entry-form [type=submit]').click();anon.wait_for_selector('.gate-avatar-grid');capture(anon,'avatars-'+role,(320,768,1440));anon.set_viewport_size({'width':320,'height':1000});anon.locator('.gate-avatar-card').last.scroll_into_view_if_needed();capture(anon,'avatars-last-'+role,(320,))
  anon.goto(f.origin+'/login.html?role=student');ready(anon);anon.locator('[data-auth-mode=recover]').click();capture(anon,'recovery')
  anon.locator('#entry-email').fill('layout-entry@example.com');anon.locator('#gate-recovery-form [type=submit]').click();anon.wait_for_timeout(150);capture(anon,'recovery-feedback',(320,1440))
  # Actual first-mission feedback in all six systems. No synthetic progress flags.
  go(student,'dashboard');student.wait_for_function('InneruCloud.status()==="Saved to your account"')
  targets=[('mission/1','[data-skel-question="0"]'),('muscle/mission/1','#m1-conscious [data-option]'),('respiratory/mission/1','.resp-question[data-question="1-q0"] [data-choice]'),('integumentary/mission/1','[data-question="0"] [data-choice]'),('circulatory/1','.circ-question[data-q="m1-c0"] [data-answer]'),('excretory/mission/1','[data-exc-question="0"] [data-choice]')]
  for route,selector in targets:
   go(student,route);student.wait_for_selector(selector)
   if route=='mission/1':button=student.locator(selector+'[data-skel-answer="'+str((student.evaluate('checks[1][0].answer')+1)%3)+'"]')
   elif route=='muscle/mission/1':button=student.locator('#m1-conscious [data-option="0"]')
   else:button=student.locator(selector).first
   button.click();capture(student,route+'-submitted-feedback',(320,1440))
   flush(student);saved=student.evaluate('JSON.stringify(InneruLearning.snapshot())')
   student.locator('[data-guided-toggle]').click();capture(student,route+'-guided',(320,768))
   guide=student.locator('.iu-guidance:visible').first
   if guide.count():
    next_button=guide.locator('[data-iu-guide-next]')
    if next_button.is_enabled():next_button.click();capture(student,route+'-guided-next',(320,))
   student.locator('[data-guided-toggle]').click()
   flush(student)
   check(student.evaluate('JSON.stringify(InneruLearning.snapshot())')==saved,route+' presentation/feedback inspection preserves learning record')
  # Verbatim user text, including catalogue words, Latin science and a long URL.
  go(student,'muscle/mission/1')
  writing='Home — كتبتُ تفسيري بنفسي: ATP و CO₂ بنسبة 0.5 L. '+('تسحب العضلات الهيكلية العظام، ويضخ القلب الدم. '*7).strip()
  student.locator('#m1-check-3 textarea').fill(writing);student.locator('#m1-check-3 [data-compare]').click()
  for i in range(3):student.locator('#m1-check-3 [data-reflection="'+str(i)+'"]').check()
  student.locator('#m1-check-3 [data-confirm]').click();flush(student)
  response=next(x for x in student.evaluate('state.assessment.responses') if x.get('kind')=='written')
  note='Home — ملاحظتي الأصلية: راجع وظيفة العضلة. ATP / 0.5 L / CO₂. '+('أحسنت تفسير الفكرة؛ أضف مثالًا من الدرس. '*6).strip()
  assert f.api(teacher,'feedback',{'studentId':u['id'],'responseId':response['id'],'note':note,'reviewed':True,'submissionAt':response['at']}).ok
  for route in ['home','dashboard','badges','glossary','review','daily','detective','connect','about','privacy','sources','attribution','capstone']:
   go(student,route);capture(student,route)
   if route in ['home','review']:
    selector='[data-iu-world]' if route=='home' else '[data-rs-stage]'
    tabs=student.locator(selector);tabs.first.focus();student.keyboard.press('ArrowLeft')
    check(tabs.nth(1).evaluate('(element)=>element===document.activeElement'),route+' Arabic tabs move left to the next visible item')
    student.keyboard.press('ArrowRight');check(tabs.first.evaluate('(element)=>element===document.activeElement'),route+' Arabic tabs move right to the previous item')
  go(student,'home')
  student.locator('[data-label-system="0"]').focus();student.keyboard.press('Enter')
  check(student.locator('[data-system="0"]').get_attribute('aria-pressed')=='true' and student.locator('[data-label-system="0"]').get_attribute('aria-pressed')=='true' and student.locator('.iu-expedition').get_attribute('data-world')=='0','keyboard body-map selection keeps the card and gallery synchronized')
  check('من' in student.locator('[data-card="0"] .progress-meta').inner_text(),'Arabic mission counts use an unambiguous completed-of-total phrase')
  for i in range(6):
   student.locator('[data-system="'+str(i)+'"]').first.click();student.wait_for_timeout(120);capture(student,'home-selected-system-'+str(i),(320,1440))
  # A separate, explicitly historical local fixture reaches the six-key capstone.
  # Seed only this isolated database account; never forge a URL/role or alter the
  # primary learner's progress to reach a restricted visual state.
  go(second,'dashboard');flush(second)
  completed=f.api(second,'state').json()['progress']['snapshot']
  completed['done']=list(range(1,9));completed['muscle']={**(completed.get('muscle') or {}),'done':list(range(1,9))}
  for system in ['integumentary','respiratory','circ','excretory']:completed[system]={**(completed.get(system) or {}),'mastery':True}
  encoded=json.dumps(completed).replace("'","''")
  f.sql("update public.student_progress set snapshot='"+encoded+"'::jsonb,revision=revision+1 where user_id='"+second_user['id']+"'")
  second.reload();ready(second);second.wait_for_function('keysEarned()===6||document.querySelector("[data-cloud-use=remote]")')
  if second.locator('[data-cloud-use=remote]').count():second.locator('[data-cloud-use=remote]').click()
  second.wait_for_function('keysEarned()===6');go(second,'capstone');second.wait_for_selector('[data-cap-station]');capture(second,'capstone-unlocked')
  gaps=second.evaluate('InneruLocale.coverage(document.querySelector("main"))')
  check(not gaps,'unlocked capstone has no Arabic interface translation gaps: '+json.dumps(gaps,ensure_ascii=False))
  # Popovers, menu, locked badge dialog and all detective/connection selections.
  go(student,'home');student.locator('[data-iu-keys]').first.click();capture(student,'system-key-dialog');student.keyboard.press('Escape')
  go(student,'dashboard');student.locator('.iu-account-menu>summary').click();capture(student,'account-menu',(320,768,1440));student.keyboard.press('Escape')
  go(student,'badges');student.locator('[data-sd-badge]').first.click();capture(student,'badge-dialog');student.keyboard.press('Escape')
  go(student,'mission/1');student.locator('.term').first.focus();student.keyboard.press('Enter');student.wait_for_selector('#term-pop:not([hidden])');capture(student,'glossary-popover');capture(student,'glossary-popover-short',(320,),568);student.keyboard.press('Escape')
  for route,selector in [('detective','[data-dd-act-case]'),('connect','[data-bt-system]')]:
   go(student,route)
   for i in range(student.locator(selector).count()):
    button=student.locator(selector).nth(i)
    if button.is_visible() and button.is_enabled():button.click();capture(student,route+'-selection-'+str(i),(320,768))
  go(student,'review');student.locator('#review-start').click();capture(student,'review-session');student.locator('.rs-choice').first.click();student.locator('[data-rs-check]').click();capture(student,'review-answer',(320,1440))
  flush(student);baseline=f.api(student,'state').json()['progress']
  for view in ['overview','students','answers','controls','analytics','preview','board']:
   go(teacher,'teacher'+('' if view=='overview' else '?view='+view));capture(teacher,'teacher-'+view)
  go(teacher,'teacher?view=board');teacher.locator('[data-board-student="'+second_user['id']+'"]').first.click();capture(teacher,'teacher-explorer-passport');gaps=teacher.evaluate('InneruLocale.coverage(document.querySelector("dialog[open]"))');check(not gaps,'explorer passport has no Arabic interface translation gaps: '+json.dumps(gaps,ensure_ascii=False));teacher.keyboard.press('Escape')
  for view in ['overview','progress','answers','achievements','notes']:
   go(teacher,'teacher/student/'+u['id']+'?view='+view);capture(teacher,'student-record-'+view)
  go(teacher,'teacher/student/'+u['id']+'?view=answers')
  form=teacher.locator('[data-td-feedback][data-response-id="'+response['id']+'"]');details=form.locator('xpath=..')
  if details.get_attribute('open') is None:details.locator('summary').click()
  capture(teacher,'teacher-feedback-expanded')
  check(writing in teacher.locator('main').inner_text() and any(area.input_value()==note for area in teacher.locator('textarea').all()),'learner writing and teacher feedback remain verbatim in Arabic')
  go(owner,'owner');capture(owner,'owner')
  owner.locator('#owner-10G5').select_option('');owner.locator('[data-owner-form] [type=submit]').click();owner.wait_for_selector('[data-owner-dialog][open]');capture(owner,'owner-removal-dialog');capture(owner,'owner-removal-dialog-short',(320,),568);owner.keyboard.press('Escape')
  owner.locator('[data-owner-approve]').first.click();owner.wait_for_selector('[data-owner-dialog][open]');capture(owner,'owner-approval-dialog');owner.keyboard.press('Escape')
  # Every existing mission/final, with the teacher's real read-only preview guard.
  go(teacher,'teacher?view=preview')
  worlds=teacher.evaluate('InneruLearning.worlds.map(w=>({route:w.route,missions:w.titles.map((_,i)=>InneruLearning.missionRoute(w,i+1)),final:InneruLearning.finalRoute(w)}))')
  structures={'world':['[data-part]'],'muscle':['[data-muscle-part]'],'respiratory':['[data-part]'],'integumentary':['[data-part]','[data-dermis-part]','[data-skin-detail]'],'circulatory':['[data-heart-group]','[data-heart-structure]'],'excretory':['[data-structure]']}
  modes={'world':'[data-view]','muscle':'[data-muscle-region]','respiratory':'[data-resp-mode]','integumentary':'[data-skin-mode]','circulatory':'[data-heart-mode]','excretory':'[data-explorer-tab]'}
  for world in worlds:
   root=world['route'].lstrip('#');go(teacher,root+'?preview=1');capture(teacher,root+'-world')
   teacher.locator('canvas').first.wait_for(state='visible');teacher.wait_for_timeout(300)
   for i in range(teacher.locator(modes[root]).count()):
    button=teacher.locator(modes[root]).nth(i)
    if button.is_visible() and button.is_enabled():button.click();teacher.wait_for_timeout(100);capture(teacher,root+'-anatomy-mode-'+str(i),(320,1440))
   for selector in structures[root]:
    buttons=teacher.locator(selector+':visible')
    if buttons.count():
     buttons.last.click();teacher.wait_for_timeout(100);capture(teacher,root+'-structure-'+selector,(320,1440))
   for route in world['missions']+[world['final']]:
    route=route.lstrip('#');go(teacher,route+'?preview=1');teacher.wait_for_selector('.iu-teacher-preview-bar');capture(teacher,route+'-preview')
   check(f.api(student,'state').json()['progress']==baseline,root+' previews do not alter saved learner progress')
  # Intermediate widths and English switching cover the shared responsive rules.
  for page,route in [(anon,None),(student,'home'),(student,'dashboard'),(teacher,'teacher?view=controls'),(owner,'owner')]:
   if route:go(page,route)
   else:page.goto(f.origin+'/login.html');ready(page)
   capture(page,(route or 'login')+'-intermediate',(390,1024,1060,1100,1280,1680) if route=='home' else (390,1024,1680))
   page.locator('[data-interface-language]').select_option('en');page.wait_for_function('document.documentElement.dir==="ltr"');capture(page,(route or 'login')+'-english',(320,768,1440))
   page.locator('[data-interface-language]').select_option('ar');ready(page)
  go(student,'mission/1');student.set_viewport_size({'width':320,'height':1000});student.locator('#main').focus();student.keyboard.press('Tab')
  check(student.evaluate('document.activeElement!==document.body && getComputedStyle(document.activeElement).outlineStyle!=="none"'),'Arabic keyboard focus has a visible indicator')
  go(teacher,'world?preview=1')
  check(teacher.locator('canvas').first.evaluate('(element)=>getComputedStyle(element).direction==="ltr"'),'physical anatomy canvas retains LTR coordinates')
  check(not errors,'no browser JavaScript exceptions: '+str(errors))
  print('Reviewed',len(report),'rendered viewport/states. Artifacts:',artifact('layout-report.json'))
  b.close()
finally:f.close()
if failures:raise AssertionError(str(len(failures))+' layout failures; inspect layout-report.json and corresponding screenshots.')
print('PASS',checks,'Arabic layout checks; isolated fixtures only.')
