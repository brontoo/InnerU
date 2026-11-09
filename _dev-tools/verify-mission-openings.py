"""Consistent EN/AR mission openings, real local gates and read-only previews."""
import json,sys
from pathlib import Path
from test_support import DatabaseFixture,playwright_session,launch,artifact
baseline='--capture-baseline' in sys.argv
f=DatabaseFixture('inneru_mission_openings_check');checks=0;errors=[];measurements=[]
def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS',label,flush=True)
def go(p,route):
 p.goto(f.origin+'/index.html?nosw=1#'+route)
 p.wait_for_selector('[data-mission-objective]')
 p.wait_for_timeout(100)
def language(p,lang):
 p.evaluate('(language)=>InneruPreferences.set({language,guided:false})',lang)
 p.wait_for_function('(language)=>document.documentElement.lang===language',arg=lang)
 p.wait_for_timeout(200)
def capture(p,name,width):
 p.set_viewport_size({'width':width,'height':1000})
 p.evaluate('scrollTo(0,document.querySelector("main").getBoundingClientRect().top+scrollY-16)')
 p.screenshot(path=artifact(name+'-'+str(width)+'.png'),animations='disabled')
 box=p.locator('[data-mission-objective]') if not baseline else p.locator('main h1')
 measurements.append({'view':name,'width':width,'openingHeight':box.bounding_box()['height'],'pageHeight':p.evaluate('document.documentElement.scrollHeight')})
try:
 f.sql('delete from auth.users;')
 with playwright_session() as pw:
  b=launch(pw)
  teacher,_=f.account(b,'riham.hassan@moe.sch.ae','Local teacher')
  owner,owner_user=f.account(b,'mission-owner@example.com','Local owner')
  f.sql("update public.profiles set role='admin' where id='"+owner_user['id']+"';")
  student,_=f.account(b,'opening-student@example.com','Local learner','10G5')
  f.unlock(teacher)
  for p in [teacher,owner,student]:p.on('pageerror',lambda e:errors.append(str(e)))
  firsts=['integumentary/mission/1','mission/1','muscle/mission/1','respiratory/mission/1','circulatory/1','excretory/mission/1']
  for role,p in [('student',student),('teacher',teacher),('owner',owner)]:
   for i,route in enumerate(firsts):
    go(p,route+('' if role=='student' else '?preview=1'))
    for lang in ['en','ar']:
     language(p,lang)
     if not baseline:p.locator('[data-mission-objective] > details').evaluate_all('es=>es.forEach(e=>e.open=false)')
     for width in [320,390,768,1440]:
      if width in [390,1440] and (role=='student' or i==0):capture(p,role+'-'+str(i+1)+'-'+lang,width)
      p.set_viewport_size({'width':width,'height':1000})
      check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),role+' '+route+' '+lang+' fits '+str(width)+'px')
     if not baseline:
      root=p.locator('[data-mission-objective]')
      check(root.count()==1 and root.locator('h1').count()==1,role+' '+route+' has one opening containing its original title')
      check(root.locator('.iu-opening-objective').count()==1 and root.locator('[data-mission-position]').is_visible(),role+' '+route+' shows one objective and its saved/preview status')
      check(root.locator('.iu-mission-jumps button').count()>0,role+' '+route+' retains activity navigation')
      saved=p.evaluate('JSON.stringify(state)')
      tab_order=p.locator('main textarea').evaluate_all('es=>es.map(e=>e.tabIndex)')
      for button in root.locator('.iu-mission-jumps button').all():
       button.focus();p.keyboard.press('Enter');check(p.evaluate('document.activeElement!==document.body'),route+' activity action moves keyboard focus')
      check(p.locator('main textarea').evaluate_all('es=>es.map(e=>e.tabIndex)')==tab_order,route+' navigation preserves natural writing-field tab order')
      for details in root.locator('details').all():
       if details.get_attribute('open') is None:details.locator(':scope > summary').click()
      gaps=p.evaluate('InneruLocale.coverage(document.querySelector("[data-mission-objective]"))') if lang=='ar' else []
      check(not gaps,role+' '+route+' expanded Arabic opening has authored translations: '+str(gaps))
      check(p.evaluate('JSON.stringify(state)')==saved,role+' '+route+' opening actions/language preserve answers and rewards')
  if not baseline:
   # Every system mission and final uses the same component in both languages.
   teacher.goto(f.origin+'/index.html?nosw=1#teacher?view=preview');teacher.wait_for_selector('.td-preview-library')
   links=teacher.locator('.td-preview-list a').evaluate_all('es=>es.map(e=>e.getAttribute("href"))')
   stored=f.sql('select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p;')
   settings=f.sql('select jsonb_agg(to_jsonb(s) order by class_code,system_id,mission_number) from public.class_mission_settings s;')
   for href in links:
    go(teacher,href.lstrip('#'))
    for lang in ['en','ar']:
     language(teacher,lang)
     check(teacher.locator('[data-mission-objective] h1').count()==1 and teacher.locator('[data-mission-objective] .iu-teacher-preview-bar').count()==1,href+' '+lang+' unifies the title and read-only preview notice')
     check(teacher.locator('.iu-mission-jumps button').count()>0,href+' '+lang+' has a real next activity/check action')
     for details in teacher.locator('[data-mission-objective] > details').all():
      if details.get_attribute('open') is None:details.locator(':scope > summary').click()
     if lang=='ar':check(not teacher.evaluate('InneruLocale.coverage(document.querySelector("[data-mission-objective]"))'),href+' expanded briefing/map has Arabic coverage')
   check(len(links)==45,'all 39 regular missions and six final challenges were inspected')
   check(f.sql('select jsonb_agg(to_jsonb(p) order by user_id) from public.student_progress p;')==stored and f.sql('select jsonb_agg(to_jsonb(s) order by class_code,system_id,mission_number) from public.class_mission_settings s;')==settings,'all mission openings leave database learning and teacher locks unchanged')
   # The whole-body final keeps its existing six-key gate and uses its authored objective.
   cap,cap_user=f.account(b,'opening-final@example.com','Local final fixture','10G5')
   cap.goto(f.origin+'/index.html?nosw=1#dashboard');cap.wait_for_function('InneruCloud.status()==="Saved to your account"')
   raw=f.api(cap,'state').json()['progress']['snapshot']
   raw['done']=list(range(1,9));raw['muscle']={**(raw.get('muscle') or {}),'done':list(range(1,9))}
   for system in ['integumentary','respiratory','circ','excretory']:raw[system]={**(raw.get(system) or {}),'done':list(range(1,8 if system=='circ' else 7)),'mastery':True}
   encoded=json.dumps(raw).replace("'","''")
   f.sql("update public.student_progress set snapshot='"+encoded+"'::jsonb,revision=revision+1 where user_id='"+cap_user['id']+"';")
   cap.reload();cap.wait_for_function('keysEarned()===6||document.querySelector("[data-cloud-use=remote]")')
   if cap.locator('[data-cloud-use=remote]').count():cap.locator('[data-cloud-use=remote]').click()
   cap.wait_for_function('InneruLearning.snapshot().keys===6')
   cap.evaluate('location.hash="final"');cap.wait_for_selector('[data-mission-objective=capstone]')
   saved=cap.evaluate('JSON.stringify(state)')
   for lang in ['en','ar']:
    language(cap,lang)
    for width in [320,390,768,1440]:
     cap.set_viewport_size({'width':width,'height':1000})
     check(cap.evaluate('document.documentElement.scrollWidth<=innerWidth'),'whole-body final '+lang+' fits '+str(width)+'px')
    check(cap.locator('[data-mission-objective] h1').count()==1,'whole-body final retains one original title')
    cap.locator('.iu-mission-jumps button').first.click()
   check(cap.evaluate('JSON.stringify(state)')==saved,'whole-body opening and language changes preserve station answers and XP')
   student.goto(f.origin+'/index.html?nosw=1#final');student.wait_for_selector('.cap-locked')
   check(student.locator('[data-mission-objective]').count()==0,'whole-body final retains its six-key gate for unfinished student accounts')
   student.goto(f.origin+'/index.html?nosw=1#mission/1?preview=1');student.wait_for_selector('.iu-mission-access-notice')
   check(student.locator('[data-mission-objective]').count()==0,'student preview URLs cannot gain the shared preview opening or bypass authorization')
  Path(artifact('opening-measurements.json')).write_text(json.dumps(measurements,indent=2))
  check(not errors,'no browser exceptions: '+str(errors))
  b.close()
 print(checks,'mission opening checks passed.')
finally:f.close()
