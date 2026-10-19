"""Report untranslated portal-owned text on real routes, using isolated fixtures.
Run through the release runner: node _dev-tools/run-critical-checks.js arabic-coverage.
This is a strict translation gate, separate from the functional support regression.
"""
import json,struct
from pathlib import Path
from test_support import DatabaseFixture,playwright_session,launch,artifact,new_context
f=DatabaseFixture('inneru_arabic_coverage_check');f.sql('delete from auth.users;')
report={}
try:
 with playwright_session() as pw:
  b=launch(pw);teacher,_=f.account(b,'Riham.hassan@moe.sch.ae','Local teacher')
  teacher.emulate_media(reduced_motion='reduce')
  teacher.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));")
  def capture(p,key):
   p.wait_for_timeout(100)
   report[key]=p.evaluate('InneruLocale.coverage(document.querySelector("#main")||document.body)')
   open(artifact('arabic-coverage.json'),'w').write(json.dumps(report,ensure_ascii=False,indent=2))
   print(key,len(report[key]),'untranslated text/labels',flush=True)
  def inspect_buttons(p,selector,key):
   for index in range(p.locator(selector).count()):
    button=p.locator(selector).nth(index)
    if button.is_visible() and button.is_enabled():
     button.click();capture(p,key+'/'+str(index))
  def collect(p,route,selector='#main'):
   p.goto(f.origin+'/index.html?nosw=1#'+route);p.wait_for_selector(selector);p.wait_for_function('!document.querySelector("[data-route-loading]")');p.wait_for_timeout(350)
   capture(p,route)
   # Sample every instruction step in the first lab of each system.
   if any(x in route for x in ['mission/1?','circulatory/1?']):
    guide=p.locator('.iu-guidance').first
    if guide.count():
     for step in range(15):
      next_button=guide.locator('[data-iu-guide-next]')
      if next_button.is_disabled():break
      next_button.evaluate('(b)=>b.click()');capture(p,route+'/instruction/'+str(step))
  login_context=new_context(b,service_workers='block');login_context.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));");login=login_context.new_page()
  for role in ['student','teacher']:
   login.goto(f.origin+'/login.html?role='+role);login.wait_for_selector('[data-auth-mode=signup]');login.wait_for_timeout(350);capture(login,'login/'+role+'/signin')
   login.locator('[data-auth-mode=signup]').first.click();capture(login,'login/'+role+'/signup');login.locator('#gate-entry-form [type=submit]').click();capture(login,'login/'+role+'/validation')
   login.locator('#entry-email').fill('catalogue-fixture@example.com');login.locator('#entry-password').fill('Local-Fixture-123');login.locator('#entry-confirm').fill('Local-Fixture-123')
   if role=='student':login.locator('#entry-class').select_option('10G5')
   login.locator('#gate-entry-form [type=submit]').click();login.wait_for_selector('.gate-avatar-grid');capture(login,'login/'+role+'/avatars')
  login_context.close()
  collect(teacher,'teacher','.td-page')
  for view in ['students','answers','controls','analytics','preview','board']:collect(teacher,'teacher?view='+view,'[data-teacher-page='+view+']')
  worlds=teacher.evaluate('InneruLearning.worlds.map(w=>({route:w.route,missions:w.titles.map((_,i)=>InneruLearning.missionRoute(w,i+1)),final:InneruLearning.finalRoute(w)}))')
  for world in worlds:
   collect(teacher,world['route'].lstrip('#')+'?preview=1')
   if world['route'].lstrip('#') in ['world','respiratory']:
    filename='skeletal' if world['route'].lstrip('#')=='world' else 'respiratory'
    with open(Path(__file__).resolve().parents[1]/('assets/'+filename+'-atlas.glb'),'rb') as model:
     model.read(12);size,kind=struct.unpack('<II',model.read(8));metadata=json.loads(model.read(size))
    names=list({alias for node in metadata['nodes'] if 'name' in node for alias in [node['name'],node['name'].replace(' ','_')]})
    report[filename+'/mesh-labels']=teacher.evaluate('(names)=>names.filter(name=>!InneruLocale.has(name))',names)
    print(filename,'model label translation gaps',len(report[filename+'/mesh-labels']),flush=True)
   # Inspect existing named controls; never drag or synthesize learner credits.
   teacher.wait_for_timeout(1000)
   root=world['route'].lstrip('#');selectors={'world':('[data-view=back]','[data-part]'),'muscle':('[data-muscle-region]','[data-muscle-part]'),'respiratory':('[data-resp-mode]','[data-part]'),'integumentary':('[data-skin-mode]','[data-part]','[data-dermis-part]','[data-skin-detail]'),'circulatory':('[data-heart-mode]','[data-heart-group]','[data-heart-structure]'),'excretory':('[data-explorer-tab]','[data-structure]')}
   for selector in selectors.get(root,()):inspect_buttons(teacher,selector,root+'/anatomy/'+selector)
   for route in world['missions']+[world['final']]:collect(teacher,route.lstrip('#')+'?preview=1','.iu-teacher-preview-bar')
  student,_=f.account(b,'arabic-coverage@example.com','Local learner','10G5')
  student.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));")
  for route in ['home','dashboard','badges','glossary','review','daily','detective','connect','about','privacy','sources','attribution']:collect(student,route)
  collect(student,'capstone')
  collect(student,'detective')
  inspect_buttons(student,'[data-dd-act-case]','detective/cases')
  collect(student,'connect')
  inspect_buttons(student,'[data-bt-system]','connect/systems')
  f.unlock(teacher)
  f.open(student,'mission/1','[data-skel-question]')
  answer=student.evaluate('checks[1][0].answer');student.locator('[data-skel-question=\"0\"][data-skel-answer=\"'+str(answer)+'\"]').click()
  student.evaluate('InneruCloud.flush()');student.wait_for_function('InneruCloud.status()===\"Saved to your account\"')
  collect(teacher,'teacher?view=answers','[data-teacher-page=answers]')
  collect(teacher,'teacher?view=students','[data-teacher-page=students]')
  link=teacher.locator('.td-student-link').first.get_attribute('href')
  collect(teacher,link.lstrip('#')+'?view=answers')
  gaps=sum(len(v) for v in report.values());print('Untranslated occurrences:',gaps,'across',len(report),'views/states. See',artifact('arabic-coverage.json'))
  b.close()
 if gaps:raise SystemExit(1)
finally:f.close()
