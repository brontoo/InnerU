"""Teacher four-area navigation, shared home, class-scoped ranking and real dashboard data.
Uses isolated PostgreSQL and local Auth fixtures. No production identities or data.
"""
import json,os,subprocess,uuid
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, CONTAINER, start_fixture
ROOT=Path(__file__).resolve().parents[1];DB='inneru_teacher_workspace_check'
ENV={**os.environ,'INNERU_DB_TEST_CONTAINER':CONTAINER,'INNERU_DB_TEST_DATABASE':DB}
proc,ORIGIN=start_fixture(ENV,database=True);checks=0;errors=[];created=[]
def q(v):return "'"+str(v).replace("'","''")+"'"
def sql(s):return subprocess.check_output(['docker','exec','-i',CONTAINER,'psql','-U','postgres','-d',DB,'-v','ON_ERROR_STOP=1','-qAt'],input=s,text=True).strip()
def check(v,m):
 global checks
 assert v,m
 checks+=1;print('PASS',m,flush=True)
def api(p,a,data=None):return p.request.get(ORIGIN+'/api/learning?action='+a) if data is None else p.request.post(ORIGIN+'/api/learning?action='+a,data=data)
def go(p,h,selector):p.evaluate('(h)=>location.hash=h',h);p.wait_for_selector(selector)
try:
 sql("delete from auth.users where lower(email) in ('riham.hassan@moe.sch.ae','sf.alhammadi@moe.sch.ae') or email like 'workspace-fixture-%@example.com';delete from public.class_mission_settings;")
 with sync_playwright() as pw:
  browser=launch(pw)
  def account(email,name,code=None):
   ctx=new_context(browser, service_workers='block',viewport={'width':1680,'height':1100},reduced_motion='reduce');p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
   response=p.request.post(ORIGIN+'/api/auth?action=signup',data={'email':email,'password':'Local-Workspace-Fixture-123','name':name,'avatarId':'pip','requestedRole':'student' if code else 'teacher',**({'classCode':code} if code else {})});assert response.ok,response.text()
   u=response.json()['user'];created.append(u['id'])
   if not code:sql('select public.inneru_approve_teacher('+q(email)+');')
   return p,u
  teacher,t=account('riham.hassan@moe.sch.ae','Riham fixture');maryam,m=account('sf.alhammadi@moe.sch.ae','Maryam fixture')
  a,au=account('workspace-fixture-a@example.com','Amina','10G5');b,bu=account('workspace-fixture-b@example.com','Basma','10G6');c,cu=account('workspace-fixture-c@example.com','Cleo','10G5');outsider,ou=account('workspace-fixture-outside@example.com','Outside class','10G1')
  for p,code in [(teacher,'10G5'),(teacher,'10G6'),(maryam,'10G1')]:assert api(p,'set-mission-control',{'classCode':code,'system':'skeletal','number':0,'unlocked':True}).ok
  for p,name in [(a,'Amina'),(b,'Basma'),(outsider,'Outside class')]:
   snap={'name':name,'done':[1],'rewards':['activity1','q1-0','q1-1','q1-2'],'assessment':{'version':1,'responses':[{'id':'skeletal:1:q0','system':'skeletal','mission':1,'kind':'check','title':'Skeleton science check','prompt':'What supports the body?','answer':'The skeleton','expected':'The skeleton','correct':True,'at':'2026-10-18T08:00:00Z'}]}}
   response=api(p,'save',{'snapshot':snap,'revision':0,'requestId':str(uuid.uuid4())});assert response.ok,response.text()
  teacher.goto(ORIGIN+'/index.html?nosw=1#teacher');teacher.wait_for_selector('[data-dashboard-overview]')
  check(teacher.locator('[data-teacher-navigation] .navlink').all_text_contents()==['Explore Worlds','Dashboard','Mission Preview','Achievements Board'],'only four teacher primary destinations are shown')
  check(teacher.locator('.sidebar .sidebottom .navlink').count()==0,'no extra teacher tools are duplicated in the sidebar')
  check(teacher.locator('[data-td-students]').inner_text()=='3' and teacher.locator('[data-td-earned]').inner_text()=='2','dashboard totals reflect only the three assigned students and their two earned badges')
  check(teacher.locator('.td-activity-feed li').count()==2 and 'Outside class' not in teacher.locator('.td-page').inner_text(),'recent activity includes real assigned submissions only')
  teacher.locator('#td-dashboard-class').select_option('10G5')
  check(teacher.locator('[data-td-students]').inner_text()=='2' and teacher.locator('.td-activity-feed li').count()==1,'overview class filter updates totals and submitted work together')
  teacher.locator('.td-resource-grid a[data-resource-world=respiratory]').click();teacher.wait_for_selector('.td-preview-library')
  check(teacher.locator('.td-preview-list a').count()==45,'dashboard learning resources open the existing 45-mission preview library')
  teacher.locator('[data-teacher-view=dashboard]').click();teacher.wait_for_selector('[data-dashboard-overview]');teacher.locator('.td-tabs a[href="#teacher?view=analytics"]').click();teacher.wait_for_selector('[data-dashboard-analytics]')
  check(teacher.locator('.td-analysis-bars button').count()==6 and teacher.locator('.td-class-pulse article').count()==1,'analytics shows six systems and respects the selected class')
  teacher.locator('#td-analytics-class').select_option('')
  check(teacher.locator('.td-class-pulse article').count()==2,'analytics can compare both assigned classes')
  teacher.locator('[data-teacher-view=board]').click();teacher.wait_for_selector('[data-board-content]')
  check(teacher.locator('[data-board-row]').count()==3 and 'Outside class' not in teacher.locator('[data-board-content]').inner_text(),'Discovery League includes only assigned students')
  check(teacher.locator('.td-podium [data-board-rank="1"]').count()==2 and teacher.locator('[data-board-row] .td-league-rank').all_text_contents()==['#1','#1','—'],'equal XP shares rank one and zero activity remains unranked')
  check(teacher.locator('.td-league-person b').all_text_contents()==['Amina','Basma','Cleo'],'tied students appear alphabetically')
  check(teacher.locator('.td-league-person .avatar .iu-avatar-art').count()==3,'student avatars come from saved profile identity')
  teacher.locator('[data-board-metric=missions]').click();check(teacher.locator('[data-board-metric=missions]').get_attribute('aria-pressed')=='true' and teacher.locator('.td-podium b').first.inner_text()=='1 mission','mission ranking uses actual completed mission counts')
  teacher.locator('[data-board-metric=badges]').click();check(teacher.locator('.td-podium b').first.inner_text()=='1 badge','badge ranking uses confirmed earned badges')
  teacher.locator('#td-board-class').select_option('10G5')
  check(teacher.locator('[data-board-row]').count()==2 and teacher.locator('.td-league-person b').all_text_contents()==['Amina','Cleo'],'board class filter limits rankings and roster to that class')
  teacher.locator('[data-board-content] .td-badge').first.click();teacher.wait_for_selector('.td-dialog[open]')
  check('Amina' in teacher.locator('.td-dialog').inner_text() and 'Basma' not in teacher.locator('.td-dialog').inner_text(),'badge detail includes only achievers in the selected class')
  teacher.locator('[data-td-close]').click();teacher.locator('.td-league-person').first.click();teacher.wait_for_selector('.td-dialog[open]')
  check('Amina’s discoveries' in teacher.locator('.td-dialog').inner_text() and teacher.locator('.td-dialog .td-badge.is-earned').count()==1,'interactive explorer passport shows the correct student achievements')
  teacher.locator('[data-td-close]').click();baseline=sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;')
  teacher.locator('[data-board-celebrate]').click()
  check('applause' in teacher.locator('[data-board-cheer]').inner_text() and teacher.locator('.td-confetti i').count()==0,'celebration has accessible feedback and honors reduced motion')
  teacher.emulate_media(reduced_motion='no-preference');teacher.locator('[data-board-celebrate]').click();check(teacher.locator('.td-confetti i').count()==24,'animated celebration works when motion is enabled');teacher.emulate_media(reduced_motion='reduce')
  check(sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;')==baseline,'ranking changes, badge inspection and celebrations never alter student learning or XP')
  teacher.screenshot(path=artifact('teacher-discovery-league.png'),full_page=True)
  teacher.reload();teacher.wait_for_selector('[data-board-content]');check(teacher.locator('[data-board-row]').count()==3,'board reload restores saved class learning records')
  maryam.goto(ORIGIN+'/index.html?nosw=1#teacher?view=board');maryam.wait_for_selector('[data-board-content]')
  check(maryam.locator('.td-league-person b').all_text_contents()==['Outside class'] and maryam.locator('#td-board-class option').all_text_contents()==['All assigned classes','10G1','10G2','10G3','10G4'],'Maryam sees only her four classes and assigned student')
  check(api(a,'classroom').status==403,'student sessions cannot fetch the teacher leaderboard data')
  a.goto(ORIGIN+'/index.html?nosw=1#teacher?view=board');a.wait_for_selector('.sd-page');check(a.locator('[data-board-content]').count()==0,'student URL changes cannot enter the teacher-only board')
  teacher.locator('[data-teacher-view=home]').click();teacher.wait_for_selector('.explore-screen')
  a.evaluate('location.hash="home"');a.wait_for_selector('.explore-screen')
  check(teacher.locator('.inneru-welcome').inner_text()==a.locator('.inneru-welcome').inner_text() and teacher.locator('#human-map').inner_html()==a.locator('#human-map').inner_html(),'teachers and students share the same home hero and anatomical body map')
  for i,world in enumerate(['integumentary','skeletal','muscle','respiratory','circ','excretory']):
   teacher.locator('[data-iu-world="'+str(i)+'"]').click();check(teacher.locator('#human-map').get_attribute('data-selected')==str(i),world+' home gallery remains interactive')
   teacher.locator('.iu-world-panel a.iu-btn').click();teacher.wait_for_selector('.iu-teacher-preview-bar[data-preview-mission=system]',timeout=30000)
   check(teacher.evaluate('InneruMissionAccess.teacherBrowseActive') and teacher.locator('[data-teacher-view=home][aria-current=page]').count()==1,world+' anatomy opens in protected teacher exploration mode')
   teacher.evaluate('reward("activity1",999);save()');teacher.locator('[data-teacher-view=home]').click();teacher.wait_for_selector('.explore-screen')
  check(sql('select jsonb_agg(to_jsonb(s) order by user_id) from public.student_progress s;')==baseline,'shared teacher home and all six system explorations leave every student record unchanged')
  for width in [1680,768,390,320]:
   teacher.set_viewport_size({'width':width,'height':1000})
   for view,selector in [('overview','[data-dashboard-overview]'),('students','#td-group-filter'),('analytics','[data-dashboard-analytics]'),('board','[data-board-content]'),('preview','.td-preview-library')]:
    go(teacher,'teacher' if view=='overview' else 'teacher?view='+view,selector)
    check(teacher.evaluate('document.documentElement.scrollWidth<=innerWidth'),str(width)+'px '+view+' has no horizontal page overflow')
    check(teacher.locator('[data-teacher-navigation] .navlink').count()==4 and teacher.locator('[data-teacher-navigation] [aria-current=page]').count()==1,str(width)+'px '+view+' retains the four destinations and one active highlight')
    if width<=390:check(teacher.locator('[data-teacher-navigation] .navlink').evaluate_all('(links)=>links.every(link=>{const r=link.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})'),str(width)+'px '+view+' shows all four teacher links without scrolling the navigation')
   if width==390:
    go(teacher,'teacher?view=board','[data-board-content]');teacher.screenshot(path=artifact('teacher-discovery-league-mobile.png'),full_page=True)
  teacher.set_viewport_size({'width':1680,'height':1100});go(teacher,'teacher','[data-dashboard-overview]');teacher.screenshot(path=artifact('teacher-dashboard-workspace.png'),full_page=True)
  check(not errors,'no uncaught browser errors: '+str(errors));browser.close()
 print(checks,'teacher workspace checks passed.')
finally:
 proc.terminate();proc.wait(timeout=10)
 for uid in created:sql('delete from auth.users where id='+q(uid))
