"""Report untranslated portal-owned text on real routes, using isolated fixtures.
Run through the release runner: node _dev-tools/run-critical-checks.js arabic-coverage.
This is a strict translation gate, separate from the functional support regression.
"""
import json
from test_support import DatabaseFixture,playwright_session,launch,artifact
f=DatabaseFixture('inneru_arabic_coverage_check');f.sql('delete from auth.users;')
report={}
try:
 with playwright_session() as pw:
  b=launch(pw);teacher,_=f.account(b,'Riham.hassan@moe.sch.ae','Local teacher')
  teacher.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));")
  def collect(p,route,selector='#main'):
   p.goto(f.origin+'/index.html?nosw=1#'+route);p.wait_for_selector(selector);p.wait_for_function('!document.querySelector("[data-route-loading]")');p.wait_for_timeout(350)
   report[route]=p.evaluate('InneruLocale.coverage(document.querySelector("#main"))')
   open(artifact('arabic-coverage.json'),'w').write(json.dumps(report,ensure_ascii=False,indent=2));print(route,len(report[route]),'untranslated text/labels',flush=True)
  collect(teacher,'teacher','.td-page')
  for view in ['students','answers','controls','analytics','preview','board']:collect(teacher,'teacher?view='+view,'[data-teacher-page='+view+']')
  worlds=teacher.evaluate('InneruLearning.worlds.map(w=>({route:w.route,missions:w.titles.map((_,i)=>InneruLearning.missionRoute(w,i+1)),final:InneruLearning.finalRoute(w)}))')
  for world in worlds:
   for route in world['missions']+[world['final']]:collect(teacher,route.lstrip('#')+'?preview=1','.iu-teacher-preview-bar')
  student,_=f.account(b,'arabic-coverage@example.com','Local learner','10G5')
  student.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));")
  for route in ['home','dashboard','badges','glossary','review','daily','detective','connect','about','privacy','sources','attribution']:collect(student,route)
  gaps=sum(len(v) for v in report.values());print('Untranslated occurrences:',gaps,'across',len(report),'routes. See',artifact('arabic-coverage.json'))
  b.close()
 if gaps:raise SystemExit(1)
finally:f.close()
