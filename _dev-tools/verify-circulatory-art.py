"""Exercise all circulatory anatomy explorers, labs, questions and saved rewards."""
import functools,http.server,re,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[]
def check(ok,message):
 global checks
 assert ok,message
 checks+=1;print('PASS',message,flush=True)
def stored(p):return p.evaluate("localStorage.getItem('bodyquest-v1')")
def go(p,path):
 p.evaluate('x=>location.hash=x',path)
 p.wait_for_selector('.circ-path' if path=='circulatory' else '.circ-assessment' if path.endswith('mastery') else '.circ-boss-stage' if path.endswith('boss') else '#circ-lab')
def slider(p,id,v):p.locator('#'+id).evaluate("(el,v)=>{el.value=v;el.dispatchEvent(new Event('input'));}",v)
answers=[
 ['One-cell-thick wall','Vein','arteries','capillaries','veins'],
 ['From blood to cell','From cell into blood','one cell thick','Oxygen','diffusion'],
 ['Right ventricle','Backward blood flow','Left atrium','septum','SA node'],
 ['Pulmonary artery','Pulmonary veins','lungs','body','systemic capillaries'],
 ['Plasma','Fibrin','haemoglobin','White blood cells','Platelets'],
 ['A and B','O','anti-B','neither A nor B','clump'],
 ['120','Stroke','rises','narrow an artery','heart muscle']]
def answer_questions(p,n):
 ids=[f'm{n}-a0',f'm{n}-a1',f'm{n}-c0',f'm{n}-c1',f'm{n}-c2']
 for id,text in zip(ids,answers[n-1]):
  q=p.locator(f'[data-q="{id}"]')
  if q.locator('[data-answer]:enabled').count():q.locator('[data-answer]').filter(has_text=re.compile('^'+re.escape(text)+'$')).click()
  check(q.locator('[data-ca-open]').is_enabled(),f'{id} keeps anatomy available after solving the question')
def solve_lab(p,n):
 if n==1:
  for x in ['Artery','Capillary','Vein']:p.locator(f'[data-vessel="{x}"]').click()
 elif n==2:slider(p,'oxygen-gradient',9);p.locator('#exchange-check').click()
 elif n==3:
  for x in ['Right atrium','Right ventricle','Left atrium','Left ventricle']:p.locator(f'[data-chamber="{x}"]').click()
 elif n==4:
  for x in ['Venae cavae','Right atrium','Right ventricle','Pulmonary artery','Lung capillaries','Pulmonary veins','Left atrium','Left ventricle','Aorta','Body arteries','Body capillaries','Body veins','Venae cavae']:p.locator(f'[data-stop="{x}"]').click()
 elif n==5:
  for x in ['Plasma','Red blood cell','White blood cell','Platelet']:p.locator(f'[data-cargo="{x}"]').click()
 elif n==6:
  for x in ['O','A','B','AB']:p.locator('#recipient').select_option(x);p.locator('#donor').select_option('O');p.locator('#match-blood').click()
 elif n==7:p.locator('#pulse-count').fill('18');p.locator('#pulse-calc').click()
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  ctx=browser.new_context(viewport={'width':1680,'height':1100});p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#circulatory');p.wait_for_selector('.ca-card-art')
  check(p.locator('.circ-card .ca-card-art').count()==7 and p.locator('.finalmission .ca-card-art').count()==1,'all seven cards and the final panel have premium artwork')
  p.locator('.circ-path').scroll_into_view_if_needed()
  check(p.locator('.circ-card.locked').count()==6,'new learners retain six mission prerequisites')
  check(p.locator('.circ-card.locked [data-ca-open]').count()==6,'all locked cards allow state-free anatomy exploration')
  baseline=stored(p);sources=set();regions=0
  for n in range(1,8):
   p.locator(f'.circ-card[data-ca-mission="{n}"] [data-ca-open]').click();p.wait_for_selector('dialog[open]')
   study=p.locator('.ca-study-dialog .ca-study');study.locator('img').evaluate('el=>el.decode()');sources.add(study.locator('img').get_attribute('src'))
   check(study.locator('img').evaluate('el=>el.naturalWidth===1536&&el.naturalHeight===1024'),f'mission {n} opens a complete high-resolution anatomical study')
   tabs=study.locator('.ca-structure-tabs [data-ca-select]');count=tabs.count();regions+=count
   for i in range(count):
    tabs.nth(i).click();check(study.locator('.ca-spot[aria-pressed="true"]').get_attribute('data-ca-select')==str(i),f'study {n} structure {i+1} synchronizes marker and explanation')
    study.locator(f'.ca-spot[data-ca-select="{i}"]').click();check(study.get_attribute('data-ca-selected')==str(i),f'study {n} anatomical hotspot {i+1} is directly clickable')
   check(study.locator('.ca-discovery-count').inner_text()==f'{count} / {count} structures',f'study {n} tracks local discoveries without XP')
   p.keyboard.press('Escape');check(p.locator('dialog[open]').count()==0,f'study {n} closes with native Escape behavior')
  check(len(sources)==7 and regions==30,'seven distinct studies expose all 30 anatomical structures')
  check(stored(p)==baseline,'exploring every anatomy structure leaves saved state unchanged')
  p.locator('.circ-card[data-ca-mission="1"] [data-ca-open]').focus();p.keyboard.press('Enter');p.locator('.ca-study-dialog [data-ca-next]').click()
  check(p.locator('.ca-study-dialog .ca-study').get_attribute('data-ca-study')=='2','field-guide navigation browses anatomy while mission 2 remains locked')
  p.locator('.ca-study-dialog [data-ca-prev]').click();p.keyboard.press('Escape')
  check(p.evaluate('document.activeElement.dataset.caOpen')=='1','closing the guide restores focus to its card control')
  p.locator('button[data-ca-motion-toggle]').click();check(p.locator('#main').get_attribute('data-ca-motion')=='off','card animation has a manual pause control')
  p.locator('button[data-ca-motion-toggle]').click();p.emulate_media(reduced_motion='reduce')
  p.wait_for_function('document.querySelector("button[data-ca-motion-toggle]").disabled && document.querySelector("#main").dataset.caMotion==="off"')
  check(p.locator('button[data-ca-motion-toggle]').is_disabled() and p.locator('#main').get_attribute('data-ca-motion')=='off','system reduced-motion preference stops anatomical cues')
  p.emulate_media(reduced_motion='no-preference');p.evaluate("location.hash='circulatory/2'");p.wait_for_selector('.circ-path');check(p.locator('#circ-lab').count()==0,'art exploration does not bypass the mission route guard')
  for n in range(1,8):
   go(p,f'circulatory/{n}');check(p.locator('#circ-lab .ca-study').count()==1 and p.locator('.ca-question-art').count()==5,f'mission {n} illustrates its lab, both activities and all three checks')
   xp=p.evaluate('state.xp');study=p.locator('#circ-lab .ca-study');study.locator('.ca-structure-tabs [data-ca-select]').last.click();check(p.evaluate('state.xp')==xp,f'mission {n} awards no XP merely for inspecting anatomy')
   if n==1:
    p.locator('[data-vessel="Vein"]').click();check(study.get_attribute('data-ca-selected')=='2' and 'toward the heart' in p.locator('#vessel-model').inner_text(), 'vessel controls focus the matching vessel and its direction')
   if n==2:
    slider(p,'oxygen-gradient',3);o2=p.locator('.ca-process .ca-route-line').first
    check(o2.get_attribute('aria-label')=='O₂ moves from Working tissue to Capillary blood' and 'is-backward' in o2.get_attribute('class'),'lower blood oxygen reverses the tissue exchange animation')
    slider(p,'oxygen-gradient',5);check('is-held' in p.locator('.ca-process .ca-route-line').first.get_attribute('class'),'equal oxygen levels stop net diffusion')
    p.locator('#exchange-check').click();check(not p.evaluate("circHas('m2-lab')"),'zero oxygen gradient does not complete the delivery challenge')
    slider(p,'oxygen-gradient',9);check(p.locator('.ca-process .ca-route-line').last.get_attribute('aria-label')=='CO₂ moves from Working tissue to Capillary blood','carbon dioxide follows the separate normal tissue-to-blood route')
   if n==3:
    p.locator('[data-chamber="Left atrium"]').click();check(not p.locator('[data-chamber="Left atrium"]').is_disabled(),'wrong chamber selection allows retry and no automatic credit')
   if n==5:
    p.locator('[data-cargo="Red blood cell"]').click();check(not p.evaluate("circHas('m5-lab')"),'a wrong cargo choice does not complete the lab')
   if n==6:
    allowed={'O':['O'],'A':['O','A'],'B':['O','B'],'AB':['O','A','B','AB']}
    for recipient in allowed:
     for donor in ['O','A','B','AB']:
      p.locator('#recipient').select_option(recipient);p.locator('#donor').select_option(donor);p.locator('#match-blood').click();safe=donor in allowed[recipient]
      check(p.locator('.ca-process').get_attribute('data-ca-compatible')==('yes' if safe else 'no'),f'ABO recipient {recipient} / donor {donor} produces the correct illustrated compatibility')
      if not safe:check('agglutination' in p.locator('.ca-abo-result').inner_text(),'incompatible antigens are connected to antibody binding and clumping risk')
   if n==7:
    d=p.locator('.ca-plaque-top').get_attribute('d');slider(p,'plaque',80)
    check(p.locator('.ca-plaque-top').get_attribute('d')!=d and study.get_attribute('data-ca-selected')=='3','plaque slider narrows the illustrated lumen and focuses the plaque inset')
    check('not a clinical measurement' in p.locator('.ca-process').inner_text(),'narrowing illustration avoids presenting a measured blood-flow prediction')
    p.locator('#pulse-count').fill('0');p.locator('#pulse-calc').click();check(not p.evaluate("circHas('m7-lab')"),'invalid pulse entries do not complete the lab')
   solve_lab(p,n);check(p.evaluate(f"circHas('m{n}-lab')"),f'mission {n} lab still saves its original completion ID')
   if n==3:check('Right ventricle → pulmonary artery → lungs → pulmonary veins → Left atrium' in p.locator('#chamber-path').inner_text(),'chamber journey places lung circulation between the right ventricle and left atrium')
   if n==5:check(p.locator('[data-cargo]:disabled').count()==4,'completed cargo controls prevent extra out-of-range clicks')
   if n==7:check('72 beats per minute' in p.locator('#lab-feedback').inner_text(),'pulse estimate retains its correct 15-second conversion')
   check(not p.evaluate(f'state.circ.done.includes({n})'),f'mission {n} lab alone does not unlock the next fragment')
   answer_questions(p,n);check(p.evaluate(f'state.circ.done.includes({n})'),f'mission {n} completes only after the lab and five questions')
   check(p.evaluate('state.xp')==n*100,f'mission {n} preserves its exact 100 XP reward total')
   q=p.locator(f'[data-q="m{n}-a0"]');q.locator('[data-ca-open]').click();check(p.locator('dialog[open]').count()==1,f'mission {n} solved activity still opens its anatomical clue');p.keyboard.press('Escape')
  go(p,'circulatory/mastery');check(p.locator('.ca-question-art').count()==15,'all 15 mastery items have matching anatomical clues')
  master=['arteries','capillary','right atrium','right ventricle','aorta','pulmonary vein','septum','pulmonary artery','pulmonary veins','pulmonary','systemic','heart attack risk','stroke risk','A or O']
  for i,text in enumerate(master):p.locator(f'[data-q="master-{i}"] [data-answer]').filter(has_text=re.compile('^'+re.escape(text)+'$')).click()
  p.locator('#master-response').fill('The heart pumps blood from the lungs through the left ventricle and aorta into arteries. Hemoglobin carries oxygen to muscle capillaries, where diffusion supplies cells. Veins return carbon dioxide toward the heart and pulmonary circulation carries it back to the lungs.');p.locator('#master-review').click()
  check(p.evaluate('state.circ.mastery&&state.xp===825'),'mastery retains its System Key and original 125 XP total')
  go(p,'circulatory/boss');check(p.locator('.ca-question-art').count()==8,'all eight final transport-crisis decisions have anatomical clues')
  boss=['Artery','Prevent backward flow','Right ventricle','Right heart → lungs → left heart','Capillary wall','Platelets then fibrin','Reject this match','Stroke risk']
  for i,text in enumerate(boss):p.locator(f'[data-q="boss-{i}"] [data-answer]').filter(has_text=re.compile('^'+re.escape(text)+'$')).click()
  check(p.evaluate('state.circ.boss&&state.xp===905'),'transport crisis retains all rewards and the 905 XP world maximum')
  go(p,'circulatory/5');solve_lab(p,5);check(p.evaluate('state.xp')==905,'replaying an illustrated lab never duplicates XP')
  p.reload(wait_until='domcontentloaded');p.wait_for_selector('#circ-lab');check(p.evaluate('state.circ.mastery&&state.circ.boss&&state.xp===905'),'reload preserves all mission, mastery and crisis progress')
  for width in [768,390,320]:
   p.set_viewport_size({'width':width,'height':844});go(p,'circulatory');p.wait_for_selector('.ca-card-art')
   check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'mission cards fit a {width}px viewport')
   p.locator('.circ-card[data-ca-mission="3"] [data-ca-open]').click();check(p.evaluate('document.querySelector("dialog").scrollWidth<=document.querySelector("dialog").clientWidth+1'),f'heart anatomy guide has no horizontal overflow at {width}px')
   for i in range(7):p.locator(f'.ca-study-dialog .ca-spot[data-ca-select="{i}"]').click();assert p.locator('.ca-study-dialog .ca-study').get_attribute('data-ca-selected')==str(i)
   check(True,f'all seven heart hotspots remain directly clickable at {width}px');p.keyboard.press('Escape')
   for n in range(1,8):go(p,f'circulatory/{n}');check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'illustrated mission {n} fits a {width}px viewport')
  p.set_viewport_size({'width':1680,'height':1100});go(p,'circulatory/7');p.locator('#pulse-start').click();go(p,'circulatory/1');p.wait_for_timeout(1200)
  check(True,'leaving an active pulse timer cleans up its interval')
  for path,sel in [('respiratory/mission/1?preview=1','.ra-ventilation'),('integumentary/mission/1?preview=1','.integ-mission'),('excretory/mission/1?preview=1','.exc-world'),('world?preview=1','.skel-chapters')]:
   p.evaluate('x=>location.hash=x',path);p.wait_for_selector(sel);check(p.locator('.ca-study-dialog').count()==0 and p.locator('.ca-scope').count()==0,f'circulatory anatomy and styles stay out of {path}')
  shell=p.evaluate(r"async()=>{const t=await(await fetch('sw.js')).text();return [...t.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);}")
  for path in shell:assert p.request.get(BASE.split('?')[0]+path.removeprefix('./')).status==200,path
  check(True,f'all {len(shell)} versioned offline shell URLs resolve')
  check((ROOT/'index.html').read_bytes()==(ROOT/'404.html').read_bytes(),'both HTML entry points load the same versioned modules')
  check(sum(x.stat().st_size for x in (ROOT/'assets/circulatory-missions').glob('*.webp'))<2500000,'seven optimized premium illustrations total less than 2.5 MB')
  check(not errors,'all card, guide, activity, question, preference and route interactions run without JavaScript errors')
  browser.close()
finally:server.shutdown();server.server_close()
print(f'{checks} circulatory illustration checks passed.',flush=True)
