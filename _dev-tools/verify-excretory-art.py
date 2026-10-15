"""Verify anatomical art, synchronized activity visuals, preview isolation and motion."""
import functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[]
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def go(page,path):
 page.goto(BASE+'#excretory'+path,wait_until='domcontentloaded');page.wait_for_selector('.ea-scope')
def saved(page):return page.evaluate("localStorage.getItem('bodyquest-v1')")
def fits(page):return page.evaluate('document.documentElement.scrollWidth<=innerWidth')
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  p=browser.new_page(viewport={'width':1680,'height':1100});p.on('pageerror',lambda e:errors.append(str(e)))
  go(p,'');baseline=saved(p)
  check(p.locator('.ea-card').count()==6,'all six mission cards have original anatomical artwork')
  check(p.locator('.exc-mission-art').count()==0,'the old flat card diagrams are replaced')
  p.locator('.ea-card img').evaluate_all('imgs=>Promise.all(imgs.map(i=>{i.loading="eager";return i.decode()}))')
  check(p.locator('.ea-card img').evaluate_all('imgs=>imgs.every(i=>i.complete&&i.naturalWidth===1536)'),'all six optimized art assets load at full resolution')
  check(p.locator('.exc-card-actions a[href*="preview=1"]').count()==6,'every mission keeps its free preview link')
  check(p.locator('.exc-explorer').count()==1,'the rotational anatomy studio is preserved')
  region_counts=[4,6,4,4,4,6,3]
  for n,count in enumerate(region_counts,1):
   if n<=6:p.locator(f'.ea-card [data-ea-open="{n}"]').click()
   else:p.locator('.ea-card [data-ea-open="6"]').click();p.locator('[data-ea-next]').click()
   dialog=p.locator('.ea-dialog');check(dialog.is_visible(),f'study {n} opens without completing any mission')
   check(dialog.locator('.ea-pin').count()==count,f'study {n} includes all {count} anatomical regions')
   for i in range(count):
    dialog.locator(f'.ea-tabs [data-ea-select="{i}"]').click()
    check(dialog.locator(f'.ea-pin[data-ea-select="{i}"]').get_attribute('aria-pressed')=='true',f'study {n}: region {i+1} synchronizes pin and explanation')
   check('complete' in dialog.locator('.ea-count').inner_text(),f'study {n}: visual discovery badge responds')
   p.keyboard.press('Escape');check(not dialog.is_visible(),'Escape closes the anatomy guide')
  check(saved(p)==baseline,'anatomy discovery does not change saved progress or XP')
  for n in range(1,7):
   go(p,f'/mission/{n}?preview=1')
   check(p.locator(f'.ea-study[data-ea-study="{n}"]').count()==1,f'mission {n} includes its interactive anatomical study')
   check(p.locator('.ea-question-art').count()==3,f'mission {n}: all three questions have relevant anatomical clues')
   check(p.locator('.exc-preview-answer').count()==3,f'mission {n}: all answer explanations remain freely previewable')
   p.locator('.ea-question-art').first.click();check(p.locator('.ea-dialog').is_visible(),'question artwork opens a larger inspection view');p.keyboard.press('Escape')
   if n==1:
    p.locator('[data-exc-item="2"]').click();check(p.locator('[data-ea-organ="1"]').get_attribute('aria-pressed')=='true','sweat cargo selects the sweat-gland study')
    for i in range(5):p.locator(f'[data-exc-step="{i}"]').click()
    check(p.locator('.ea-reached').count()==5,'urinary route illustration follows all five successful steps')
    p.locator('#exc-route-reset').click();check(p.locator('.ea-reached').count()==0,'reset clears the visual urine route')
   if n==2:
    p.locator('[data-kidney-label="0"]').click();check(p.locator('.exc-lab .ea-study[data-ea-selected="0"]').count()==1,'kidney clue selects its actual tissue region')
   if n==3:
    p.locator('[data-exc-item="5"]').click();check(p.locator('.ea-process[data-ea-filter="retained"]').count()==1,'blood-cell cargo remains on the capillary side')
    p.locator('[data-exc-item="0"]').click();check(p.locator('.ea-process[data-ea-filter="small"]').count()==1,'water cargo activates passage into first filtrate')
    scene=p.locator('.ea-process');scene.scroll_into_view_if_needed();p.wait_for_timeout(150)
    check(scene.locator('svg').evaluate('s=>!s.animationsPaused()'),'visible scientific process animates')
    p.locator('button[data-ea-motion]').click();check(scene.locator('svg').evaluate('s=>s.animationsPaused()'),'illustration pause stops the actual SVG timeline')
    p.locator('button[data-ea-motion]').click();scene.scroll_into_view_if_needed();p.wait_for_timeout(150);check(scene.locator('svg').evaluate('s=>!s.animationsPaused()'),'illustration play resumes the SVG timeline')
    before=scene.locator('.ea-small-particles circle').first.evaluate('c=>c.getCTM().f');p.wait_for_timeout(450)
    after=scene.locator('.ea-small-particles circle').first.evaluate('c=>c.getCTM().f');check(abs(after-before)>2,'filtered particles visibly move across the barrier')
    p.locator('.ea-study .ea-pin').first.click();p.emulate_media(reduced_motion='reduce');p.wait_for_function('document.querySelector(".ea-scope").dataset.eaMotion==="off"')
    check(p.locator('button[data-ea-motion]').is_disabled() and scene.locator('svg').evaluate('s=>s.animationsPaused()'),'reduced motion pauses the timeline and honors system preference')
    p.emulate_media(reduced_motion='no-preference')
   if n==4:
    p.locator('[data-exc-item="0"]').click();check(p.locator('.ea-process[data-ea-exchange="return"]').count()==1,'useful glucose activates tubule-to-blood reabsorption')
    p.locator('[data-exc-item="3"]').click();check(p.locator('.ea-process[data-ea-exchange="urine"]').count()==1,'net urea waste follows tubular fluid toward urine')
    p.locator('button[data-ea-exchange="secrete"]').click();check('blood → interstitium → tubule' in p.locator('.ea-process-note').inner_text(),'secretion shows the opposite transport direction')
   if n==5:
    for value,level,num in [(10,'low',1),(50,'moderate',3),(90,'high',5)]:
     p.locator('#adh-level').fill(str(value));scene=p.locator('.ea-process[data-ea-process="5"]')
     check(scene.get_attribute('data-ea-adh')==level,f'ADH {level} setting updates the cellular visual')
     check(scene.locator('[data-ea-water]').evaluate_all('gs=>gs.filter(g=>g.style.opacity==="1").length')==num,f'ADH {level} changes visible water channels and water return')
    check('intercalated cell' in p.locator('.ea-acid-base').inner_text(),'acid–base detail distinguishes intercalated cells from ADH principal cells')
   if n==6:
    for i in range(6):
     p.locator(f'[data-case-tab="{i}"]').click()
     check(p.locator('#exc-case-content .ea-case-art').count()==1,f'case {i+1} has a specific mechanism illustration')
    check(p.locator('.ea-treatment-figure').count()==2,'dialysis and donor kidney both have treatment illustrations')
    p.locator('.ea-treatment-figure [data-ea-open="7"]').click();check(p.locator('.ea-dialog [data-ea-study="7"]').count()==1,'dialyzer guide explains separate blood and dialysis-fluid compartments');p.keyboard.press('Escape')
   check(saved(p)==baseline,f'mission {n}: visual interactions leave preview storage unchanged')
  go(p,'/mastery?preview=1');check(p.locator('.ea-question-art').count()==8,'all eight final decisions have matching visual clues')
  for width in [320,390,768]:
   p.set_viewport_size({'width':width,'height':900})
   go(p,'');check(fits(p),f'{width}px: mission board fits')
   for n in range(1,7):
    p.locator(f'.ea-card [data-ea-open="{n}"]').click();dialog=p.locator('.ea-dialog')
    check(dialog.evaluate('d=>d.scrollWidth<=d.clientWidth+1'),f'{width}px: study {n} dialog fits')
    for i in range(region_counts[n-1]):
     dialog.locator(f'.ea-pin[data-ea-select="{i}"]').click(timeout=3000)
     check(dialog.locator(f'.ea-tabs [data-ea-select="{i}"]').get_attribute('aria-pressed')=='true',f'{width}px: study {n} hotspot {i+1} is directly clickable')
    p.keyboard.press('Escape')
   for n in [1,3,4,5,6]:
    go(p,f'/mission/{n}?preview=1');check(fits(p),f'{width}px: mission {n} fits')
  go(p,'/mission/3?preview=1');p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('document.querySelector(".ea-scope").dataset.eaMotion==="off"');check(p.locator('button[data-ea-motion]').is_disabled(),'app motion preference also pauses illustrations')
  old=p.locator('.ea-process svg').element_handle();p.evaluate('location.hash="home"');p.wait_for_selector('.ea-scope',state='detached');check(old.evaluate('s=>s.animationsPaused()'),'leaving the page stops detached animation timelines')
  check(not errors,'no uncaught browser errors: '+str(errors))
  browser.close()
 print(f'{checks} checks passed.',flush=True)
finally:server.shutdown();server.server_close()
