"""Test the animated circulation overview, anatomy selection and practice journey."""
import functools,http.server,math,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0;errors=[]
def check(ok,text):
 global checks
 assert ok,text
 checks+=1;print('PASS',text,flush=True)
def stored(p):return p.evaluate("localStorage.getItem('bodyquest-v1')")
def go(p,path):
 p.evaluate('x=>location.hash=x',path);p.wait_for_selector('.circ-route-quest')
def select(p,key):p.locator('[data-crq-inspect]').select_option(key)
def points(p):return p.locator('.crq-track').evaluate_all("paths=>paths.map(p=>{let l=p.getTotalLength();return [p.getPointAtLength(0),p.getPointAtLength(l)].map(v=>[v.x,v.y])})")
def assert_route(p,label):
 ends=points(p)
 check(len(ends)==8 and all(math.dist(ends[i][1],ends[(i+1)%8][0])<.1 for i in range(8)),label+' forms one continuous closed physiological route')
 # No line crossings or shared tracks may imply a shortcut bypassing a pump.
 crossings=p.locator('.crq-track').evaluate_all("""paths=>{const polys=paths.map(p=>{const l=p.getTotalLength();return Array.from({length:101},(_,i)=>p.getPointAtLength(l*i/100))});let found=[];function cross(a,b,c,d){const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,z=rx*sy-ry*sx;if(Math.abs(z)<1e-7)return false;const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/z,u=((c.x-a.x)*ry-(c.y-a.y)*rx)/z;return t>1e-5&&t<.99999&&u>1e-5&&u<.99999;}for(let i=0;i<polys.length;i++)for(let j=i+1;j<polys.length;j++)for(let a=0;a<100;a++)for(let b=0;b<100;b++)if(cross(polys[i][a],polys[i][a+1],polys[j][b],polys[j][b+1]))found.push([i,j]);return found;}""")
 check(not crossings,label+' has no crossing vessels that imply an anatomical shortcut: '+str(crossings))
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  ctx=browser.new_context(viewport={'width':1680,'height':1100});p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#circulatory/1',wait_until='domcontentloaded');p.wait_for_selector('.crq-track');p.locator('.circ-route-quest').scroll_into_view_if_needed();p.wait_for_timeout(100)
  baseline=stored(p)
  check(p.locator('.circ-map').count()==0,'the selected Trace the science table is replaced by the anatomical map')
  check(p.locator('.crq-map image').count()==4,'the map contains separately cropped lungs, a four-chamber heart and muscle artwork')
  assert_route(p,'Wide map')
  check(p.locator('.crq-checkpoints button').count()==8 and p.locator('[data-crq-inspect] option').count()==10,'eight checkpoints and ten anatomical structures are freely available')
  ambient=p.locator('[data-crq-packet]').first;before=ambient.get_attribute('transform');p.wait_for_timeout(250)
  check(ambient.get_attribute('transform')!=before,'red cells visibly move along the physiological paths')
  check(p.locator('[data-crq-packet] ellipse').evaluate_all("els=>els.every(e=>{const x=getComputedStyle(e).fill.match(/\\d+/g).map(Number);return x[0]>x[1]&&x[0]>x[2]})"),'all moving blood cells remain red on both oxygen-level routes')
  for key,index in [('venae',0),('ra',1),('rv',1),('pa',2),('lungs',3),('pv',4),('la',5),('lv',5),('aorta',6),('body',7)]:
   select(p,key);check(p.locator('.circ-route-quest').get_attribute('data-crq-stage')==str(index) and p.locator(f'[data-crq-structure="{key}"]').get_attribute('aria-pressed')=='true',key+' selection synchronizes its anatomical marker and explanation')
  select(p,'ra');a=p.locator('[data-crq-leader]').get_attribute('transform');select(p,'rv');check(a!=p.locator('[data-crq-leader]').get_attribute('transform'),'right atrium and ventricle selection place the courier in distinct chambers')
  select(p,'la');a=p.locator('[data-crq-leader]').get_attribute('transform');select(p,'lv');check(a!=p.locator('[data-crq-leader]').get_attribute('transform'),'left atrium and ventricle selection place the courier in distinct chambers')
  select(p,'pa');check('oxygen-poor blood away' in p.locator('[data-crq-text]').inner_text(),'pulmonary arteries are explained by direction despite their lower oxygen load')
  select(p,'pv');check('oxygen-rich blood' in p.locator('[data-crq-text]').inner_text() and 'toward the heart' in p.locator('[data-crq-text]').inner_text(),'pulmonary veins return oxygen-rich blood toward the heart')
  select(p,'lungs');check('alveolar air → blood' in p.locator('.crq-gas-o2').inner_text() and 'blood → alveolar air' in p.locator('.crq-gas-co2').inner_text(),'lung oxygen and carbon dioxide exchange directions are opposite and explicit')
  select(p,'body');check('blood → body cells' in p.locator('.crq-gas-o2').inner_text() and 'body cells → blood' in p.locator('.crq-gas-co2').inner_text(),'tissue oxygen and carbon dioxide exchange directions are opposite and explicit')
  p.locator('[data-crq-loop-choice="pulmonary"]').click();p.wait_for_function("Number(getComputedStyle(document.querySelector('[data-crq-path=\"6\"]')).opacity)<.3")
  check(p.locator('[data-crq-path="6"]').evaluate("el=>Number(getComputedStyle(el).opacity)<.3") and p.locator('[data-crq-path="2"]').evaluate("el=>Number(getComputedStyle(el).opacity)>.6"),'lung-loop focus fades the systemic vessels and highlights the pulmonary route')
  p.locator('[data-crq-loop-choice="systemic"]').click();p.wait_for_function("Number(getComputedStyle(document.querySelector('[data-crq-path=\"2\"]')).opacity)<.3")
  check(p.locator('[data-crq-path="2"]').evaluate("el=>Number(getComputedStyle(el).opacity)<.3"),'body-loop focus fades pulmonary vessels')
  select(p,'lungs');check(p.locator('.circ-route-quest').get_attribute('data-crq-loop')=='all','selecting another loop reveals its previously faded anatomy')
  p.locator('[data-crq-reset]').click();check(p.locator('progress').get_attribute('value')=='0','reset clears only the local discovery journey')
  for i in range(8):
   p.locator(f'[data-crq-stop="{i}"]').click();check(p.locator('.circ-route-quest').get_attribute('data-crq-oxygen')==('higher' if i in [3,4,5,6] else 'lower'),f'checkpoint {i+1} shows the appropriate oxygen load')
  check('8 / 8' in p.locator('[data-crq-count]').inner_text() and 'Network explored' in p.locator('[data-crq-badge]').inner_text(),'exploring the full route earns the local game badge')
  check(stored(p)==baseline and not p.evaluate("circHas('m1-lab')"),'the practice journey never writes XP, mission completion or saved progress')
  p.locator('[data-crq-reset]').click();p.locator('[data-crq-play]').click();p.wait_for_timeout(700)
  check(p.locator('.circ-route-quest').get_attribute('data-crq-playing')=='true','guided playback starts the complete red-cell journey')
  p.locator('[data-crq-play]').click();a=p.locator('[data-crq-leader]').get_attribute('transform');p.wait_for_timeout(200)
  check(p.locator('[data-crq-leader]').get_attribute('transform')==a,'pausing the journey holds the courier at its exact current position')
  p.locator('[data-crq-motion-toggle]').click();a=ambient.get_attribute('transform');p.wait_for_timeout(200)
  check(ambient.get_attribute('transform')==a and p.locator('[data-crq-play]').is_disabled(),'map pause stops ambient motion and guided playback')
  p.locator('[data-crq-stop="4"]').focus();p.keyboard.press('Enter')
  check(p.locator('.circ-route-quest').get_attribute('data-crq-stage')=='4','keyboard checkpoint controls remain usable with animation paused')
  p.locator('[data-crq-motion-toggle]').click();p.emulate_media(reduced_motion='reduce');p.wait_for_function("document.querySelector('[data-crq-play]').disabled&&document.querySelector('.circ-route-quest').dataset.crqMotion==='off'")
  check(p.locator('[data-crq-play]').is_disabled() and p.locator('.circ-route-quest').get_attribute('data-crq-motion')=='off','reduced motion stops automatic movement')
  select(p,'rv');check(p.locator('[data-crq-title]').inner_text()=='Right ventricle','manual anatomy discovery remains available with reduced motion')
  p.emulate_media(reduced_motion='no-preference');p.locator('[data-ca-motion-toggle]').click();p.wait_for_function("document.querySelector('[data-crq-play]').disabled")
  check(p.locator('[data-crq-play]').is_disabled(),'the existing illustration pause also pauses the route quest')
  p.locator('[data-ca-motion-toggle]').click()
  for width in [768,390,320]:
   p.set_viewport_size({'width':width,'height':844});p.wait_for_timeout(100)
   check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'the complete route and controls fit a {width}px screen')
   assert_route(p,str(width)+'px map')
   for key in ['ra','rv','la','lv','pa','pv','venae','aorta','lungs','body']:
    p.locator(f'[data-crq-structure="{key}"]').click();assert p.locator('.circ-route-quest').get_attribute('data-crq-selected')==key,(width,key)
   check(True,f'all ten anatomical controls are directly clickable at {width}px')
  p.locator('[data-crq-reset]').click();p.locator('[data-crq-quick-step]').click();check('1 / 8' in p.locator('[data-crq-count]').inner_text(),'controls beside the phone diagram support manual checkpoint discovery')
  p.locator('[data-crq-quick-play]').click();p.wait_for_timeout(100);check(p.locator('.circ-route-quest').get_attribute('data-crq-playing')=='true','the phone diagram can start its guided journey without scrolling to the coach')
  p.locator('[data-crq-quick-play]').click();check(p.locator('.circ-route-quest').get_attribute('data-crq-playing')=='false','the nearby phone control pauses the same shared journey')
  check(stored(p)==baseline,'keyboard, loop focus and responsive exploration preserve learner state')
  # Use a fresh, clock-controlled lesson to complete an automatic circulation cycle.
  c=browser.new_context(viewport={'width':1680,'height':1100});q=c.new_page();q.on('pageerror',lambda e:errors.append(str(e)));q.goto(BASE+'#circulatory/1',wait_until='domcontentloaded');q.wait_for_selector('[data-crq-path]');q.locator('.circ-route-quest').scroll_into_view_if_needed();q.wait_for_timeout(100);q.clock.install();q.locator('[data-crq-play]').click();q.clock.run_for(27000)
  check(q.locator('.circ-route-quest').get_attribute('data-crq-complete')=='true' and q.locator('.circ-route-quest').get_attribute('data-crq-playing')=='false','automatic playback completes all eight physiological checkpoints and stops')
  check('Replay' in q.locator('[data-crq-play]').inner_text(),'a complete guided journey can be replayed')
  q.locator('[data-crq-reset]').click();q.locator('[data-crq-play]').click();q.clock.run_for(2000);q.evaluate("location.hash='home'");q.wait_for_selector('.explore-screen');q.clock.run_for(4000)
  check(q.locator('.circ-route-quest').count()==0,'leaving during playback removes the map and its animation safely')
  p.evaluate('state.circ.done=[1,2,3,4,5,6,7]')
  for path in ['circulatory/2','circulatory/3','circulatory/4','circulatory/5','circulatory/6','circulatory/7','circulatory/mastery','circulatory/boss']:
   go(p,path);select(p,'lungs');check(p.locator('.circ-route-quest').count()==1 and p.locator('[data-crq-title]').inner_text()=='Lung capillaries',path+' mounts one functional shared science map')
  check(not errors,'no JavaScript errors during animation, discovery, resizing, preferences or route cleanup')
  browser.close()
finally:server.shutdown();server.server_close()
print(f'{checks} animated circulation checks passed.',flush=True)
