"""Exercise balanced recall sessions, scheduling, retries, motion and saved progress."""
import functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[];DAY=86400000
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def stored(p):return p.evaluate('localStorage.getItem("bodyquest-v1")')
def review(p):return p.evaluate('JSON.parse(JSON.stringify(state.review||{}))')
def mode(p,key):p.locator(f'[data-rs-mode="{key}"]').click()
def select_only(p,wid):
 for b in p.locator('[data-rs-system]').all():
  if (b.get_attribute('aria-pressed')=='true') != (b.get_attribute('data-rs-system')==wid):b.click()
def start(p,size=5):p.locator(f'[data-rs-size="{size}"]').click();p.locator('#review-start').click();p.wait_for_selector('[data-review-card]')
def answer(p,right=True):
 id=p.locator('[data-review-card]').get_attribute('data-review-id');correct=p.evaluate('(id)=>InneruRecall.items().find(i=>i.id===id).options[0]',id)
 options=p.locator('[data-review-choice]');texts=options.locator('span').all_text_contents();index=texts.index(correct)
 if not right:index=(index+1)%len(texts)
 options.nth(index).click();p.locator('[data-rs-check]').click();return id
def advance(p):p.locator('#review-next').click()
def home(p):
 if p.locator('[data-rs-home]').count():p.locator('[data-rs-home]').click()
 elif p.locator('[data-rs-pause]').count():p.locator('[data-rs-pause]').click()
 else:p.evaluate('location.hash="review"')
 p.wait_for_selector('.rs-builder')
def seed(p,values):
 p.evaluate('(v)=>{state={name:"Amina",xp:170,done:[1],rewards:["activity1","q1-0","q1-1","q1-2"],weak:[],level:"Explorer",motion:false,...v};save()}',values)
 p.reload(wait_until='domcontentloaded');p.wait_for_selector('.rs-builder')
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader']);ctx=b.new_context(viewport=dict(width=1680,height=1100));p=ctx.new_page();p.on('pageerror',lambda err:errors.append(str(err)))
  p.goto(BASE+'#review',wait_until='domcontentloaded');p.wait_for_selector('.rs-studio');baseline=stored(p)
  check(p.locator('.sidebar .navlink.active').get_attribute('href')=='#review' and 'Recall Studio' in p.locator('.topbar .crumb').inner_text(),'the sidebar and breadcrumb identify the Review studio rather than the dashboard')
  items=p.evaluate('InneruRecall.items()');check(len(items)==54 and [i['id'] for i in items]==['r'+str(i) for i in range(54)],'all 54 existing question IDs remain stable for saved schedules')
  check(len(set(i['world'] for i in items))==6,'the question bank covers all six body systems')
  check('ion balance' in next(i['why'] for i in items if 'force fall' in i['q']),'muscle-fatigue wording describes multiple mechanisms rather than assigning all fatigue to lactate')
  check(next(i['options'][0] for i in items if 'preventable cause' in i['q'])=='Tobacco smoking','the lung-cancer question identifies the established tobacco-smoking risk accurately')
  check('Sensory nerve endings and receptors' in str(items),'touch detection is attributed to sensory structures without confining all endings to the dermis')
  check(p.locator('[data-rs-accuracy]').inner_text()=='—' and p.locator('[data-rs-due]').inner_text()=='0','a new learner sees unstarted accuracy and a distinct zero-due count')
  queue=p.evaluate('InneruRecall.queue().map(id=>InneruRecall.items().find(i=>i.id===id).world)');check(len(queue)==10 and len(set(queue))==6,'a fresh ten-question mix includes all six systems instead of drawing only the first system')
  p.locator('.rs-studio img').evaluate_all('imgs=>Promise.all(imgs.map(i=>i.decode()))');check(p.locator('.rs-studio img').evaluate_all('imgs=>imgs.every(i=>i.naturalWidth>0)'),'the constellation and all system illustrations load')
  mode(p,'due');check(p.locator('#review-start').is_disabled() and 'No selected questions are due' in p.locator('[data-rs-session-description]').inner_text(),'due-only mode explains its empty state without starting an empty session')
  mode(p,'mix')
  for button in p.locator('[data-rs-system]').all():button.click()
  check(p.locator('#review-start').is_disabled() and 'Choose at least one system' in p.locator('[data-rs-session-description]').inner_text(),'an empty selection cannot start an invalid review')
  p.locator('[data-rs-orbit="respiratory"]').click();check(p.locator('[data-rs-system][aria-pressed=true]').count()==1 and p.locator('[data-rs-system="respiratory"]').get_attribute('aria-pressed')=='true','the interactive anatomical constellation builds a focused respiratory session')
  check(len(p.evaluate('InneruRecall.queue()'))==9,'a focused deep dive uses the nine available questions without duplicates')
  p.locator('[data-rs-all]').click();check(p.locator('[data-rs-system][aria-pressed=true]').count()==6,'select-all restores the full six-system mix')
  p.locator('[data-rs-stage="4"]').click();check('0 questions' in p.locator('#rs-stage-panel').inner_text(),'a future review stage shows an honest empty state')
  p.locator('[data-rs-stage="4"]').focus();p.keyboard.press('ArrowRight');check(p.locator('[data-rs-stage="new"]').get_attribute('aria-selected')=='true','review stage tabs wrap with the keyboard')
  p.keyboard.press('End');check(p.locator('[data-rs-stage="4"]').get_attribute('aria-selected')=='true','End selects the final review interval');p.keyboard.press('Home')
  p.locator('[data-rs-expand]').click();check(p.locator('.rs-stage-items article').count()==54,'the memory map can reveal all questions in the selected stage');check(p.locator('[data-rs-expand]').evaluate('el=>el===document.activeElement'),'expanding a review stage keeps keyboard focus on its disclosure control');p.locator('[data-rs-expand]').click()
  for wid in ['integ','world','muscle','respiratory','circ','excretory']:
   p.locator(f'[data-rs-orbit="{wid}"]').click();check(p.locator(f'[data-rs-system="{wid}"]').get_attribute('aria-pressed')=='true' and p.locator('[data-rs-system][aria-pressed=true]').count()==1,wid+' constellation specimen is directly clickable and focuses its own system')
  p.locator('[data-rs-all]').click()
  check(stored(p)==baseline,'system selection, stage inspection and queue setup never write student progress')
  p.locator('.rs-constellation').scroll_into_view_if_needed();p.wait_for_function('getComputedStyle(document.querySelector(".rs-orbit-lines path:last-child")).animationPlayState==="running"');path=p.locator('.rs-orbit-lines path').last;before=path.evaluate('el=>getComputedStyle(el).strokeDashoffset');p.wait_for_timeout(180)
  check(path.evaluate('el=>getComputedStyle(el).strokeDashoffset')!=before,'the constellation has visible, gentle animated connections: '+str(path.evaluate('el=>({name:getComputedStyle(el).animationName,play:getComputedStyle(el).animationPlayState,before:el.getAttribute("stroke-dashoffset"),offset:getComputedStyle(el).strokeDashoffset,mode:el.closest(".rs-studio").dataset.rsMotion,visible:el.closest(".rs-constellation").className})')))
  p.locator('[data-rs-action-motion]').click();check(path.evaluate('el=>getComputedStyle(el).animationName')=='none','the local pause stops decorative animation')
  p.locator('[data-rs-action-motion]').click();p.emulate_media(reduced_motion='reduce');p.wait_for_function('document.querySelector("[data-rs-action-motion]").disabled')
  check(path.evaluate('el=>getComputedStyle(el).animationName')=='none','operating-system reduced motion disables automatic visuals')
  p.emulate_media(reduced_motion='no-preference');p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('document.querySelector("[data-rs-action-motion]").disabled');check(p.locator('.rs-studio').get_attribute('data-rs-motion')=='off','the app-wide reduced-motion setting remains authoritative');p.evaluate('document.body.classList.remove("motionoff")')
  # Real five-question session: every record is a first attempt, with distinct systems.
  start(p,5);check(p.locator('.rs-session-top h1').evaluate('el=>el===document.activeElement'),'starting a trail moves keyboard focus into the review session');check(p.locator('[data-rs-check]').is_disabled(),'the reveal action is disabled until an answer is selected')
  first_id=p.locator('[data-review-card]').get_attribute('data-review-id');before=stored(p);p.locator('[data-review-choice="1"]').click();check(stored(p)==before,'selecting an answer does not record it before the recall check')
  p.locator('[data-rs-lens]').click();p.locator('#rs-lens-zoom').evaluate('el=>{el.value=2;el.dispatchEvent(new Event("input",{bubbles:true}))}');check(p.locator('.rs-lens-window img').evaluate('el=>el.style.transform')=='scale(2)','the anatomy close-up has a working magnification control');p.keyboard.press('Escape');check(p.locator('[data-rs-lens]').evaluate('el=>el===document.activeElement'),'closing the anatomy lens returns keyboard focus')
  ids=[];seen_worlds=[]
  for n in range(5):
   seen_worlds.append(p.locator('[data-review-card]').get_attribute('data-review-world'));id=answer(p,right=n>=2);ids.append(id)
   check(p.locator('[data-review-answered]').get_attribute('data-review-answered')=='true' and p.locator('[data-review-choice]:enabled').count()==0,f'question {n+1} locks its first answer and reveals the science explanation')
   row=review(p)['items'][id];check(row['b']==(1 if n>=2 else 0) and (row['d']-row['t']==(DAY if n>=2 else 0)),f'question {n+1} receives the correct first-answer return interval')
   if n==0:
    count=review(p)['answers'];home(p);p.locator('[data-rs-resume]').click();check(p.locator('[data-review-card]').get_attribute('data-review-id')==id and review(p)['answers']==count,'resuming an already checked question keeps its feedback without recording a duplicate answer')
   advance(p)
  check(len(set(seen_worlds))==5 and len(set(ids))==5,'a quick session visits five distinct systems without repeated questions')
  check(review(p)['answers']==5 and review(p)['correct']==3 and review(p)['sessions']==1,'the first completed session saves five attempts, three correct and exactly one session')
  check(p.locator('.rs-summary-systems article').count()==5 and p.locator('.rs-result-list article').count()==5,'the session summary separates anatomical system results and the return plan')
  check(p.evaluate('state.xp===0&&state.rewards.length===0&&state.done.length===0'),'review recall lights never grant mission XP, completion or badges')
  correct_schedule={id:review(p)['items'][id] for id in ids};before_review=review(p);p.locator('[data-rs-retry]').click()
  retry=[]
  for _ in range(2):retry.append(answer(p));advance(p)
  check(set(retry)==set(ids[:2]),'the optional retry round contains exactly the missed connections')
  check(review(p)==before_review,'the entire retry round changes neither accuracy, sessions nor saved spacing')
  home(p);check(p.locator('[data-rs-due]').inner_text()=='2' and p.locator('[data-rs-accuracy]').inner_text()=='60%','the home statistics reflect the recorded review, including missed questions still due')
  check(p.locator('.rs-week b').last.inner_text()=='5','the recall rhythm records actual answers for today')
  second=p.evaluate('InneruRecall.queue().slice(0,5).map(id=>InneruRecall.items().find(i=>i.id===id).world)');check('excretory' in second,'quick-session rotation includes the system omitted from the first five-question session')
  # Due questions get priority over new questions in their selected system.
  mode(p,'due');check(set(p.evaluate('InneruRecall.queue()'))==set(ids[:2]),'due-only mode returns missed items and excludes new or future questions')
  start(p,5)
  for _ in range(2):answer(p);advance(p)
  check(review(p)['answers']==7 and review(p)['sessions']==2 and all(review(p)['items'][id]['b']==1 for id in ids[:2]),'a genuine later due session can rebuild the missed items and schedules them one day ahead')
  home(p);mode(p,'mix')
  # Established schedules, early practice and maximum box behavior.
  now=p.evaluate('Date.now()');entries={f'r{i}':dict(b=2,t=now-DAY,d=now+2*DAY) for i in range(54)}
  seed(p,dict(review=dict(items=entries,answers=10,correct=8,sessions=3,days={}),weak=['1-0'],muscle=dict(done=[],tasks={},weak=['m1-check-1'],xp=0)))
  check(p.locator('.review-weak[href="#mission/1"]').count()==1 and p.locator('.review-weak[href="#muscle/mission/1"]').count()==1,'flagged-concept links point to the correct skeletal and muscular lessons')
  select_only(p,'world');start(p,5);id=p.locator('[data-review-card]').get_attribute('data-review-id');before_row=review(p)['items'][id];answer(p)
  after=review(p)['items'][id];check(after['b']==before_row['b'] and after['d']==before_row['d'] and 'existing return date stays' in p.locator('.rs-schedule-result').inner_text(),'correct early practice never advances a spaced stage or postpones its stored due date')
  home(p);p.locator('[data-rs-resume]').click();advance(p);id=answer(p,False);check(review(p)['items'][id]['b']==0 and review(p)['items'][id]['d']<=p.evaluate('Date.now()'),'an early missed answer returns the connection to Rebuild immediately')
  home(p);p.evaluate('location.hash="home"');p.wait_for_selector('.iu-expedition');p.evaluate('location.hash="review"');p.wait_for_selector('.rs-builder');check(p.locator('[data-rs-resume]').count()==1,'a paused session can be resumed after leaving and returning to Review in the same tab')
  p.locator('#review-start').click();p.wait_for_selector('.rs-confirm[open]');p.locator('[data-rs-keep]').click();check(p.locator('[data-rs-resume]').count()==1,'starting another trail offers a choice to retain the paused session')
  p.locator('#review-start').click();p.locator('[data-rs-new]').click();check(p.locator('[data-review-card]').count()==1,'a confirmed new trail replaces only the unfinished local session')
  # All due stages advance on success, including the capped longest interval.
  for initial,next_box,days in [(0,1,1),(1,2,3),(2,3,7),(3,4,16),(4,4,16)]:
   home(p);now=p.evaluate('Date.now()');row=dict(b=initial,t=now-DAY,d=now-1000);seed(p,dict(review=dict(items={'r0':row},answers=1,correct=0,sessions=0,days={})))
   mode(p,'due');start(p,5);check(p.locator('[data-review-card]').get_attribute('data-review-id')=='r0','due mode selects the authoritative stored due item at stage '+str(initial))
   answer(p);saved=review(p)['items']['r0'];check(saved['b']==next_box and saved['d']-saved['t']==days*DAY,f'a due stage {initial} success schedules the correct {days}-day return');advance(p)
  home(p);before=stored(p);p.reload(wait_until='domcontentloaded');p.wait_for_selector('.rs-builder');check(stored(p)==before and review(p)['items']['r0']['b']==4,'reload preserves the final review stage and its due date')
  # Responsive behavior, focus, stages and dialogs at all target sizes.
  mode(p,'mix');p.locator('[data-rs-all]').click()
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900));assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
   p.locator('[data-rs-stage="new"]').click();p.locator('[data-rs-stage="4"]').click();check(True,f'studio setup and memory stages fit {width}px without horizontal overflow')
  start(p,5)
  for width in [1680,1024,768,390,320]:
   p.set_viewport_size(dict(width=width,height=900));assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  check(True,'the illustrated question and recall trail fit desktop and narrow phones')
  p.locator('[data-rs-lens]').click();check(p.locator('dialog').evaluate('el=>el.scrollWidth<=el.clientWidth'),'the magnified anatomy dialog fits a 320px phone');p.keyboard.press('Escape')
  p.locator('[data-review-choice="0"]').focus();p.keyboard.press('2');check(p.locator('[data-review-choice="1"]').get_attribute('aria-pressed')=='true','number keys select answer choices without submitting them')
  home(p);p.locator('#review-reset').locator('..').evaluate('el=>el.open=true');p.locator('#review-reset').click();p.locator('[data-rs-reset-cancel]').click();check(review(p)['answers']>0,'cancelling a review reset keeps all scheduled history')
  xp=p.evaluate('state.xp');done=p.evaluate('state.done');reward=p.evaluate('state.rewards');p.locator('#review-reset').click();p.locator('[data-rs-reset-confirm]').click()
  check(review(p)==dict(items={},answers=0,correct=0,sessions=0,days={}) and p.locator('[data-rs-resume]').count()==0,'confirmed review reset clears only review history and the paused trail')
  check(p.evaluate('state.xp')==xp and p.evaluate('state.done')==done and p.evaluate('state.rewards')==reward,'review reset preserves mission completions, XP and achievements')
  check(p.evaluate('inneruReviewStats().pool===54&&inneruReviewStats().due===0'),'the public review statistics stay compatible with dashboard and habit tools')
  # Navigate away during active visual motion and return with one clean studio.
  p.evaluate('location.hash="dashboard"');p.wait_for_selector('.sd-page');check(p.locator('.rs-studio').count()==0,'leaving Review removes its illustration observers and UI')
  p.evaluate('location.hash="review"');p.wait_for_selector('.rs-studio');check(p.locator('.rs-studio').count()==1,'returning mounts exactly one review studio')
  shell=p.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
  check(all(p.request.get(BASE.split('?')[0]+url.removeprefix('./')).status==200 for url in shell),f'all {len(shell)} offline shell URLs resolve')
  check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both HTML entry points load the same versioned review studio')
  check(not errors,'no JavaScript exceptions across sessions, scheduling, retries, reset, motion or navigation: '+str(errors));b.close()
finally:server.shutdown()
print(f'{checks} recall studio checks passed.',flush=True)
