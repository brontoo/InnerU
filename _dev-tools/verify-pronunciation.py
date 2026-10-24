"""Verify name-only speech requests in all six actual anatomy studios.
Speech output is intercepted so no audio device or installed voice is required.
"""
import functools,http.server,json,threading
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class H(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
ORIGIN=f'http://127.0.0.1:{server.server_port}'
BASE=ORIGIN+'/?nosw=1'
checks=0;errors=[]
STUB='''window.audioLog={calls:[],cancels:0};window.SpeechSynthesisUtterance=function(text){this.text=text};Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{getVoices(){return []},cancel(){audioLog.cancels++},speak(u){window.lastUtterance=u;audioLog.calls.push({text:u.text,lang:u.lang,rate:u.rate})}}});'''
def check(value,message):
 global checks
 assert value,message
 checks+=1;print('PASS',message,flush=True)
def raw(p):return p.evaluate('localStorage.getItem("bodyquest-v1")')
def calls(p):return p.evaluate('audioLog.calls')
def go(p,route,selector):p.evaluate('(r)=>location.hash=r',route);p.wait_for_selector(selector)
def pronounce(p,root,name):
 button=root.locator('.structure-audio-button')
 button.wait_for(state='visible')
 assert button.is_enabled()
 assert root.locator('.structure-audio-name').inner_text()==name,(root.locator('.structure-audio-name').inner_text(),name)
 before=raw(p);n=len(calls(p));button.dispatch_event('click')
 assert len(calls(p))==n+1 and calls(p)[-1]['text']==name,(name,calls(p)[-1])
 assert raw(p)==before,'pronunciation changed learner progress'
 assert button.get_attribute('aria-pressed')=='true'
 return button
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  context=browser.new_context(viewport={'width':1680,'height':1100},device_scale_factor=.5);context.add_init_script(STUB)
  p=context.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#dashboard');p.wait_for_selector('.sd-page')
  check(p.locator('#tts-toggle,#tts-rate,.structure-audio').count()==0 and p.evaluate('typeof inneruSpeech==="undefined"'),'student dashboard has no page reader, speed control or arbitrary-text speech API')
  for route,selector in [('home','.iu-expedition'),('teacher','.td-tabs'),('review','.rs-studio'),('detective','.dd-page'),('glossary','.glossary-page'),('mission/1','[data-skeletal-mission]'),('respiratory/mission/1','.resp-mission-header')]:
   go(p,route,selector)
   check(p.locator('#tts-toggle,#tts-rate,.structure-audio').count()==0 and not calls(p),route+' has no narration controls and never starts speech')
  go(p,'respiratory/mission/1','.resp-mission-header')
  term=p.locator('#main .term').first;term.dispatch_event('click');p.wait_for_selector('#term-pop:not([hidden])')
  check(p.locator('#term-pop-audio').count()==0 and p.locator('.term-pop-def').inner_text() and not calls(p),'glossary definitions remain available with no audio action')
  p.keyboard.press('Escape')
  # Skin selections include all embedded structures and every dermal component.
  go(p,'integumentary','[data-skin-explorer] .structure-audio-button')
  root=p.locator('[data-skin-explorer]');root.scroll_into_view_if_needed();p.wait_for_function('!!window.inneruSkinExplorerState')
  check(root.locator('.structure-audio-button').is_disabled(),'skin audio waits for an explicit anatomy selection')
  names=root.locator('.body-atlas-parts [data-part]').evaluate_all('es=>es.map(e=>e.dataset.part)')
  for name in names:
   root.locator('[data-skin-mode="cutaway"]').dispatch_event('click');root.locator('.body-atlas-parts [data-part="'+name+'"]').dispatch_event('click')
   p.wait_for_function('(n)=>document.querySelector("[data-skin-explorer] .structure-audio-name").textContent===n',arg=name)
   button=pronounce(p,root,name);button.dispatch_event('click')
  root.locator('[data-part="Dermis"]').dispatch_event('click')
  for name in root.locator('[data-dermis-part]').evaluate_all('es=>es.map(e=>e.dataset.dermisPart).filter(Boolean)'):
   root.locator('[data-dermis-part="'+name+'"]').dispatch_event('click')
   p.wait_for_function('(n)=>document.querySelector("[data-skin-explorer] .structure-audio-name").textContent===n',arg=name)
   pronounce(p,root,name).dispatch_event('click')
  check(True,'skin audio pronounces all structure names and detailed dermal components without their descriptions')
  root.locator('[data-part="Epidermis"]').dispatch_event('click');pronounce(p,root,'Epidermis');cancel=p.evaluate('audioLog.cancels')
  root.locator('[data-part="Dermis"]').dispatch_event('click')
  check(p.evaluate('audioLog.cancels')>cancel and root.locator('.structure-audio-button').get_attribute('aria-pressed')=='false','changing a structure cancels its pronunciation')
  root.locator('[data-skin-process="cooling"]').dispatch_event('click')
  check(root.locator('.structure-audio-button').is_disabled(),'skin process explanations cannot be narrated')
  root.locator('[data-skin-action="reset"]').dispatch_event('click')
  check(root.locator('.structure-audio-button').is_disabled(),'reset removes the previous spoken structure selection')
  # Skeletal and respiratory models share the actual region and mesh selectors.
  for route,kind in [('world','skeletal'),('respiratory','respiratory')]:
   go(p,route,'[data-atlas="'+kind+'"] .structure-audio-button');root=p.locator('[data-atlas="'+kind+'"]');root.scroll_into_view_if_needed()
   p.wait_for_function('(k)=>window.__inneruAtlasLive?.kind===k',arg=kind)
   names=root.locator('.body-atlas-parts [data-part]').evaluate_all('es=>es.map(e=>e.dataset.part)')
   for name in names:
    root.locator('.body-atlas-parts [data-part="'+name+'"]').dispatch_event('click')
    p.wait_for_function('(v)=>document.querySelector("[data-atlas="+v.kind+"] .structure-audio-name").textContent===v.name',arg={'kind':kind,'name':name})
    pronounce(p,root,name).dispatch_event('click')
   check(True,kind+' model pronounces every selectable anatomy name only')
   if kind=='skeletal':
    root.locator('[data-part="Skull"]').dispatch_event('click');root.locator('.body-atlas-stage').scroll_into_view_if_needed();p.wait_for_function('window.__inneruAtlasLive.meshes.length>0')
    target=p.evaluate('''async()=>{const T=await import('./assets/three/three.module.js'),s=__inneruAtlasLive,m=s.meshes.find(m=>m.name.replace(/_/g,' ')==='Frontal bone');if(!m)return null;const v=new T.Box3().setFromObject(m).getCenter(new T.Vector3()).project(s.camera),r=s.renderer.domElement.getBoundingClientRect();return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};}''')
    assert target,'Frontal bone mesh must be available for the mesh-selection check'
    if target:
     p.mouse.click(target['x'],target['y']);p.wait_for_timeout(60)
     actual=root.locator('.body-atlas-info > strong').inner_text().replace('_',' ');pronounce(p,root,actual).dispatch_event('click')
     check(actual!='Skull','clicking a skeletal mesh pronounces the individual bone rather than the region or explanatory paragraph')
  # The removed full-body studio must not reappear; retain the arm activity.
  go(p,'muscle','.mq-landing');check(p.locator('.muscle-studio').count()==0,'removed muscular studio has no model details or pronunciation controls')
  arm=p.locator('.arm-lab');arm.locator('.structure-audio').wait_for()
  check(arm.locator('.structure-audio-button').is_disabled(),'the whole-arm activity title has no narration option')
  for key,name in [('biceps','Biceps brachii'),('triceps','Triceps brachii'),('tendons','Tendons'),('bones','Humerus, radius, ulna')]:
   arm.locator('[data-arm-part="'+key+'"]').dispatch_event('click');p.wait_for_function('(n)=>document.querySelector(".arm-lab .structure-audio-name").textContent===n',arg=name)
   pronounce(p,arm,name).dispatch_event('click')
  check(True,'the 3D opposing-muscle activity says anatomical names without movement explanations')
  # Urinary organs, kidney cutaway, nephron and urine-flow studies.
  go(p,'excretory','.exc-explorer .structure-audio-button');root=p.locator('.exc-explorer');root.scroll_into_view_if_needed();p.wait_for_function('!!window.inneruExcretoryExplorerState')
  for mode in ['organs','kidney','nephron','flow']:
   root.locator('[data-explorer-tab="'+mode+'"]').dispatch_event('click')
   names=root.locator('.exc-structures [data-structure]').evaluate_all('es=>es.map(e=>e.dataset.structure)')
   for name in names:
    root.locator('[data-structure="'+name+'"]').dispatch_event('click');p.wait_for_function('(n)=>document.querySelector(".exc-explorer .structure-audio-name").textContent===n',arg=name)
    pronounce(p,root,name).dispatch_event('click')
   check(bool(names),'excretory '+mode+' study supports all displayed structure names only')
  # Heart external and internal anatomy uses its own scientific structure registry.
  go(p,'circulatory','.heart-lab .structure-audio-button');root=p.locator('.heart-lab');root.scroll_into_view_if_needed();p.wait_for_function('!!window.inneruHeartExplorerState')
  root.locator('[data-heart-mode="cutaway"]').dispatch_event('click')
  count=0
  for group in ['chambers','valves','support','vessels','conduction']:
   root.locator('[data-heart-group="'+group+'"]').dispatch_event('click')
   for key in root.locator('#heart-structure-list [data-heart-structure]').evaluate_all('es=>es.map(e=>e.dataset.heartStructure)'):
    root.locator('#heart-structure-list [data-heart-structure="'+key+'"]').dispatch_event('click');p.wait_for_timeout(20)
    name=root.locator('#circ-vessel-info h3').inner_text();pronounce(p,root,name).dispatch_event('click');count+=1
  check(count==26,'all 26 heart structures, including chambers, valves and internal supports, are pronounced by name only')
  pronounce(p,root,root.locator('#circ-vessel-info h3').inner_text());p.evaluate('lastUtterance.onend()')
  check(root.locator('.structure-audio-button').get_attribute('aria-pressed')=='false' and 'finished' in root.locator('.structure-audio-status').inner_text(),'speech completion resets the button and reports completion')
  pronounce(p,root,root.locator('#circ-vessel-info h3').inner_text());p.evaluate('lastUtterance.onerror({error:"synthesis-unavailable"})')
  check('unavailable' in root.locator('.structure-audio-status').inner_text(),'a voice-engine error provides a clear message without reading other text')
  pronounce(p,root,root.locator('#circ-vessel-info h3').inner_text());cancel=p.evaluate('audioLog.cancels');go(p,'dashboard','.sd-page')
  check(p.evaluate('audioLog.cancels')>cancel and p.locator('.structure-audio').count()==0,'leaving a model cancels speech and removes its audio controls')
  # No installed speech support is handled in-place rather than silently failing.
  no=browser.new_context();no.add_init_script('Object.defineProperty(window,"speechSynthesis",{value:undefined})');q=no.new_page();q.goto(BASE+'#respiratory');q.wait_for_selector('.structure-audio-button')
  check(q.locator('.structure-audio-button').is_disabled() and 'unavailable' in q.locator('.structure-audio-status').inner_text(),'unsupported browsers display a disabled local pronunciation control with an explanation')
  no.close()
  go(p,'integumentary','[data-skin-explorer] .structure-audio-button');p.locator('[data-part="Dermis"]').dispatch_event('click');p.locator('[data-dermis-part="Free nerve endings"]').dispatch_event('click')
  for width in [1680,768,390,320]:
   p.set_viewport_size({'width':width,'height':1000});root=p.locator('[data-skin-explorer]');root.locator('.structure-audio').scroll_into_view_if_needed()
   if not p.evaluate('document.documentElement.scrollWidth<=innerWidth'):
    print('OVERFLOW',width,p.evaluate('JSON.stringify([...document.querySelectorAll("body *")].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,id:e.id,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,25))'),flush=True)
    p.screenshot(path='/workspace/cloud-onboarding/structure-audio-overflow.png',full_page=True)
    raise AssertionError(width)
  check(True,'structure controls fit desktop, tablet and 320px phones')
  p.locator('.structure-audio-button').focus();n=len(calls(p));p.keyboard.press('Enter')
  check(len(calls(p))==n+1 and calls(p)[-1]['text']=='Free nerve endings','keyboard activation pronounces the exact selected dermal structure')
  p.keyboard.press('Escape');check(p.locator('.structure-audio-button').get_attribute('aria-pressed')=='false','Escape stops anatomical pronunciation')
  p.set_viewport_size({'width':1680,'height':1100});p.locator('[data-skin-explorer] .structure-audio').screenshot(path='/workspace/cloud-onboarding/structure-pronunciation.png')
  check(not errors,'no browser exceptions across all six models and restricted speech: '+str(errors))
  print(str(len(calls(p)))+' exact anatomical pronunciation requests verified.')
  browser.close()
 print(str(checks)+' pronunciation checks passed.')
finally:server.shutdown()
