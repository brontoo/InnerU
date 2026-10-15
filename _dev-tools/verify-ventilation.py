"""Exercise the textured ventilation animation, its mechanics and lifecycle."""
import base64,functools,http.server,io,threading
from pathlib import Path
from PIL import Image,ImageChops
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1#respiratory/mission/1?preview=1'
checks=0;errors=[]
def check(ok,message):
 global checks
 assert ok,message
 checks+=1;print('PASS',message,flush=True)
def pixels(p):
 data=p.locator('.ra-ventilation canvas').evaluate("el=>el.toDataURL().split(',')[1]")
 return Image.open(io.BytesIO(base64.b64decode(data))).convert('RGB')
def lung_edges(im):
 y=round(im.height*500/1024)
 xs=[x for x in range(im.width) if (lambda rgb:rgb[0]>100 and rgb[0]>rgb[1]*1.2)(im.getpixel((x,y)))]
 return min(xs),max(xs)
def manual(p,v):
 p.locator('#ra-vent-depth').evaluate("(el,v)=>{el.value=v;el.dispatchEvent(new Event('input'));el.dispatchEvent(new Event('change'));}",v)
def idle(p,v):
 p.wait_for_function("v=>{const el=document.querySelector('.ra-ventilation');return el.dataset.ventPhase==='hold'&&Math.abs(Number(el.dataset.ventDepth)-v)<.002}",arg=v,timeout=10000)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  ctx=browser.new_context(viewport={'width':1680,'height':1100});p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE);p.wait_for_selector('.ra-ventilation.is-rendered');p.locator('.ra-ventilation').scroll_into_view_if_needed();p.wait_for_timeout(200)
  baseline=p.evaluate("localStorage.getItem('bodyquest-v1')")
  exhaled=pixels(p);lung_before=lung_edges(exhaled)
  dome_before=p.locator('.ra-vent-dome').get_attribute('d')
  check('NO AIRFLOW' in p.locator('.ra-vent-phase').inner_text(),'initial exhaled pose has no continuous airflow')
  p.locator('[data-vent-pose="in"]').click();p.wait_for_function("document.querySelector('.ra-ventilation').dataset.ventPhase==='in'")
  check('into lungs' in p.locator('.ra-ventilation-flow .ra-transport').get_attribute('aria-label'),'inhalation sends air from atmosphere into lungs')
  check('Contracting' in p.locator('[data-vent-muscle]').inner_text() and 'falls below' in p.locator('.ra-vent-status').inner_text(),'inhalation explains contraction, expansion and lower alveolar pressure')
  idle(p,1);inhaled=pixels(p);lung_after=lung_edges(inhaled)
  check(lung_after[0]<lung_before[0]-10 and lung_after[1]>lung_before[1]+10,'the actual textured lungs visibly widen on both sides')
  check(p.locator('.ra-vent-dome').get_attribute('d')!=dome_before and 'lower and flatter' in p.locator('[data-vent-muscle]').inner_text(),'diaphragm outline descends and flattens at the inhaled pose')
  # The larynx and upper trachea must stay fixed instead of scaling the whole poster.
  fixed=(540,0,610,165)
  check(ImageChops.difference(exhaled.crop(fixed),inhaled.crop(fixed)).getbbox() is None,'larynx and upper trachea remain anchored during lung expansion')
  check('NO AIRFLOW' in p.locator('.ra-vent-phase').inner_text() and not p.locator('.ra-ventilation-flow .ra-moving-packet').is_visible(),'holding an expanded lung stops airflow and hides moving packets')
  check('equals atmospheric' in p.locator('.ra-vent-status').inner_text(),'held volume is not presented as a persistent pressure gradient')
  p.locator('[data-vent-pose="out"]').click();p.wait_for_function("document.querySelector('.ra-ventilation').dataset.ventPhase==='out'")
  check('lungs to atmosphere' in p.locator('.ra-ventilation-flow .ra-transport').get_attribute('aria-label') and 'is-backward' in p.locator('.ra-ventilation-flow .ra-transport').get_attribute('class'),'exhalation reverses the visible and accessible airflow direction')
  check('Relaxing' in p.locator('[data-vent-muscle]').inner_text() and 'Elastic recoil' in p.locator('.ra-vent-status').inner_text(),'quiet exhalation describes relaxation and passive elastic recoil')
  idle(p,0)
  check(ImageChops.difference(exhaled,pixels(p)).getbbox() is None,'exhalation returns the textured anatomy to its original resting pose')
  p.locator('#ra-vent-depth').focus();p.keyboard.press('ArrowRight');check(p.locator('#ra-vent-depth').input_value()=='1','breath depth can be controlled by the keyboard')
  manual(p,42);check(p.locator('#ra-vent-depth-value').inner_text()=='42%' and p.locator('.ra-ventilation').get_attribute('data-vent-phase')=='hold','manual depth selection supports intermediate held positions')
  p.locator('[data-vent-play]').click();p.wait_for_timeout(400);p.locator('[data-vent-play]').click();held=p.locator('.ra-ventilation').get_attribute('data-vent-depth');p.wait_for_timeout(400)
  check(p.locator('.ra-ventilation').get_attribute('data-vent-depth')==held and p.locator('.ra-ventilation').get_attribute('data-vent-phase')=='hold','pause stops a breath at its current position')
  manual(p,0);p.locator('[data-vent-play]').click();p.wait_for_function("document.querySelector('.ra-ventilation').dataset.ventPhase==='in'");idle(p,0)
  check(p.locator('[data-vent-play]').inner_text()=='Play one breath','one complete breath finishes at quiet exhalation and resets playback')
  p.locator('[data-vent-pose="in"]').click();p.wait_for_timeout(350);p.locator('[data-vent-pose="out"]').click();idle(p,0)
  check(p.locator('.ra-ventilation').get_attribute('data-vent-phase')=='hold','rapid reversal cancels the previous transition safely')
  p.locator('[data-vent-play]').click();p.wait_for_timeout(300);p.locator('[data-ra-motion-toggle]').click()
  check(p.locator('[data-vent-play]').is_disabled() and p.locator('.ra-ventilation').get_attribute('data-vent-phase')=='hold','activity pause cancels anatomical playback')
  p.locator('[data-vent-pose="in"]').click();idle(p,1)
  check('100%' in p.locator('#ra-vent-depth-value').inner_text(),'manual inhale still selects the anatomical endpoint while animation is paused')
  p.locator('[data-ra-motion-toggle]').click();p.emulate_media(reduced_motion='reduce');p.locator('[data-vent-pose="out"]').click();idle(p,0)
  check(p.locator('[data-vent-play]').is_disabled(),'reduced motion disables playback and preserves direct pose controls')
  check(p.evaluate("localStorage.getItem('bodyquest-v1')")==baseline,'breathing exploration in preview never changes saved progress or XP')
  for width in [768,390,320]:
   p.set_viewport_size({'width':width,'height':844});check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'ventilation controls and anatomy fit a {width}px screen')
  p.set_viewport_size({'width':1680,'height':1100});p.emulate_media(reduced_motion='no-preference');p.locator('[data-vent-play]').click();p.wait_for_timeout(200);p.locator('[data-lab="1"]').click();p.wait_for_timeout(300)
  check(p.locator('.ra-ventilation').count()==0 and p.locator('.ra-event-scene[data-event="1"]').count()==1,'switching event stations disposes the anatomy animation')
  for _ in range(7):p.locator('[data-lab="0"]').click();p.wait_for_selector('.ra-ventilation.is-rendered');p.locator('[data-lab="1"]').click()
  p.locator('[data-lab="0"]').click();p.wait_for_selector('.ra-ventilation.is-rendered');p.locator('[data-vent-play]').click();p.evaluate("location.hash='home'");p.wait_for_selector('.explore-screen');p.wait_for_timeout(300)
  check(p.locator('.ra-ventilation').count()==0,'repeated remounts and leaving during playback release the scene without exceptions')
  fallback=browser.new_context(viewport={'width':1680,'height':1100});fallback.add_init_script("const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:get.call(this,type,...args)}")
  f=fallback.new_page();f.on('pageerror',lambda e:errors.append(str(e)));f.goto(BASE);f.wait_for_selector('.ra-ventilation.is-rendered');before=pixels(f);manual(f,100)
  check(ImageChops.difference(before,pixels(f)).getbbox() is not None,'Canvas 2D fallback still moves the anatomical illustration without WebGL')
  check(not errors,'no JavaScript errors during controls, preferences, remounts or cleanup')
  browser.close()
finally:server.shutdown();server.server_close()
print(f'{checks} ventilation checks passed.',flush=True)
