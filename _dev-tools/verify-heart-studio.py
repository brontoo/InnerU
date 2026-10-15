"""Verify the detailed heart studio using real WebGL, anatomy and stored progress."""
import functools,http.server,json,threading,math
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
def live(p):return p.evaluate('window.inneruHeartExplorerState()')
def saved(p):return p.evaluate("localStorage.getItem('bodyquest-v1')")
def state(p):return json.loads(saved(p))
def mode(p,name):
 p.locator(f'[data-heart-mode="{name}"]').click();p.wait_for_function('name=>window.inneruHeartExplorerState().mode===name',arg=name)
 p.locator('#heart-canvas').scroll_into_view_if_needed();p.wait_for_timeout(80)
def group(p,name):p.locator(f'[data-heart-group="{name}"]').click()
def choose(p,key):p.locator(f'#heart-structure-list [data-heart-structure="{key}"]').click()
def frame(p):return p.evaluate('window.inneruHeartExplorerSnapshot()')
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
  p=b.new_page(viewport={'width':1680,'height':1100});p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(BASE+'#home',wait_until='domcontentloaded');p.evaluate("localStorage.setItem('bodyquest-v1',JSON.stringify({name:'Anatomist',xp:0,rewards:[],done:[],weak:[],motion:false,circ:{done:[],steps:[],mastery:false,boss:false,heartExplored:[]}}))")
  p.goto(BASE+'#circulatory',wait_until='domcontentloaded');p.wait_for_function('window.inneruHeartExplorerState?.().canvas',timeout=30000)
  check(p.locator('.heart-lab-modes [role="tab"]').count()==4,'four complete anatomy investigation views are available')
  check(live(p)['canvas'],'a real WebGL heart is rendered')
  baseline=saved(p)
  # Invariants come from the actual geometry, not only UI descriptions.
  anatomy=p.evaluate('''async()=>{const {createHeartAnatomy,HEART_STRUCTURES}=await import('./heart-anatomy.js?v=heart-studio-1');const m=createHeartAnatomy();const all=new Set(m.meshes.flatMap(x=>x.userData.ids));const result={all:Object.keys(HEART_STRUCTURES).every(k=>all.has(k)),count:m.meshes.length,finite:m.meshes.every(x=>[...x.geometry.attributes.position.array,...x.geometry.attributes.normal.array].every(Number.isFinite)),lv:m.chambers.lv.wall,rv:m.chambers.rv.wall,counts:Object.fromEntries(m.valves.map(v=>[v.id,v.leaflets.length])),chordal:m.valves.filter(v=>v.chords.length).map(v=>v.id),fossa:m.meshes.some(x=>x.userData.heartId==='fossa'&&x.userData.closedDepression),fourPV:m.meshes.filter(x=>x.userData.heartId==='veins'&&x.geometry.type==='TubeGeometry').length/2,phases:[]};for(const phase of [0,.42,.65,.86]){m.setPhase(phase);result.phases.push(m.valves.map(v=>[v.id,v.open]));}new Set(m.meshes.map(x=>x.geometry)).forEach(g=>g.dispose());new Set(m.meshes.map(x=>x.material)).forEach(g=>g.dispose());m.textures.forEach(t=>t.dispose());return result;}''')
  check(anatomy['all'],'all 26 named anatomical structures have actual geometry')
  check(anatomy['count']>=190 and anatomy['finite'],'the detailed model has finite surfaces, cords, muscle ridges and vessel geometry')
  check(anatomy['lv']>anatomy['rv']*2.5,'the left ventricular wall is substantially thicker than the right')
  check(anatomy['counts']=={'tricuspid':3,'mitral':2,'pulmonary':3,'aortic':3},'valves have scientifically correct leaflet/cusp counts')
  check(set(anatomy['chordal'])=={'tricuspid','mitral'},'chordae attach only to AV valves, never to semilunar valves')
  check(anatomy['fourPV']==4,'four pulmonary veins return toward the posterior left atrium')
  check(anatomy['fossa'],'the adult fossa ovalis is an intact depression, not an open septal hole')
  for i,phase_name in enumerate(['filling','isovolumetric contraction','ejection','isovolumetric relaxation']):
   values=dict(anatomy['phases'][i]);av=1 if i==0 else 0;semi=1 if i==2 else 0
   check(values['mitral']==av and values['tricuspid']==av and values['aortic']==semi and values['pulmonary']==semi,phase_name+' has the correct open/closed valve relationships')
  mode(p,'cutaway');check(live(p)['meshes']>=190,'Inside the heart loads the internal reconstruction')
  normal=frame(p)
  groups={'chambers':['ra','rv','la','lv'],'valves':['tricuspid','mitral','pulmonary','aortic'],'support':['septum','atrialseptum','myocardium','chordae','papillary','trabeculae','pectinate','fossa'],'conduction':['san','avnode','his','purkinje'],'vessels':['aorta','superior','inferior','arteries','veins','coronary']}
  for category,ids in groups.items():
   group(p,category)
   for key in ids:
    choose(p,key);check(live(p)['selection']==key and live(p)['selectedMeshes']>0,key+' selects actual anatomy')
    check(p.locator('#heart-selected-label').is_visible() and 'Selected' in p.locator('#heart-selected-label').inner_text(),key+' is clearly identified on the model')
    check(p.locator('#circ-vessel-info h3').count()==1,key+' has anatomical explanation and close-observation guidance')
  check(saved(p)==baseline,'all new internal explorations leave XP and persisted progress unchanged')
  group(p,'chambers');choose(p,'lv');isolated=frame(p)
  check(isolated['opaque']>100 and isolated['opaque']<normal['opaque']*.75,'only the selected structure stays opaque in the actual rendered framebuffer')
  check(isolated['faint']>200,'other anatomy is transparent on the rendered canvas')
  before=live(p)['camera'];p.locator('#heart-focus').click();check(live(p)['camera']!=before,'Focus structure magnifies and centres the selected anatomy')
  p.locator('#heart-reset').click();restored=frame(p);check(restored['opaque']>isolated['opaque']*1.4,'reset restores the complete heart to full visibility')
  check(live(p)['selection'] is None and p.locator('#heart-selected-label').is_hidden(),'reset clears the anatomical selection')
  p.locator('#heart-shell').click();check(not live(p)['opened'],'the anterior chamber wall can be restored')
  closed=frame(p);p.locator('#heart-shell').click();check(live(p)['opened'] and frame(p)!=closed,'removing the anterior wall reveals the interior again')
  # Mouse ray casting and keyboard control.
  p.locator('#heart-canvas').scroll_into_view_if_needed();box=p.locator('#heart-canvas').bounding_box()
  for x,y in [(.65,.65),(.35,.60),(.65,.55)]:
   p.mouse.click(box['x']+box['width']*x,box['y']+box['height']*y)
   if live(p)['selection']:break
  check(live(p)['selection'] is not None,'tapping the actual model selects a mesh')
  p.locator('#heart-reset').click();before=live(p)['camera'];p.locator('#heart-canvas').focus();p.keyboard.press('ArrowLeft');check(live(p)['camera']!=before,'arrow keys rotate the 3D model')
  p.locator('#heart-tab-cutaway').focus();p.keyboard.press('ArrowRight');check(live(p)['mode']=='valves','arrow keys navigate the anatomy tabs')
  check(p.locator('.heart-bench-labels button').count()==4,'the enlarged valve bench labels all four valves')
  for val in ['tricuspid','mitral','pulmonary','aortic']:
   choose(p,val);check(live(p)['selectedMeshes']>0,'the enlarged '+val+' valve can be isolated')
  p.locator('#heart-reset').click()
  for value,label in [(5,'Filling'),(42,'Isovolumetric contraction'),(65,'Ejection'),(86,'Isovolumetric relaxation')]:
   p.locator('#heart-cycle').fill(str(value));check(p.locator('#heart-cycle-label').inner_text()==label,'the cycle scrubber reveals '+label)
  # Actual automatic motion, pause, and system/app motion preferences.
  p.locator('#heart-beat').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['phase'];p.wait_for_function('v=>Math.abs(window.inneruHeartExplorerState().phase-v)>.04',arg=before,timeout=8000);check(live(p)['beating'],'cardiac-cycle playback moves the actual valve geometry')
  p.locator('#heart-beat').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['phase'];p.wait_for_timeout(300);check(live(p)['phase']==before,'pausing the cycle freezes its anatomical phase')
  p.emulate_media(reduced_motion='reduce');p.wait_for_function('document.querySelector("#heart-beat").disabled');check(not live(p)['beating'] and p.locator('#heart-motion').is_disabled(),'system reduced motion disables automatic motion')
  p.locator('#heart-cycle').fill('65');check(live(p)['phase']==.65,'manual phase investigation remains available with reduced motion')
  p.emulate_media(reduced_motion='no-preference');mode(p,'flow')
  expected=['superior','ra','tricuspid','rv','pulmonary','arteries','veins','la','mitral','lv','aortic','aorta']
  for i,key in enumerate(expected):
   check(live(p)['selection']==key and live(p)['journeyStep']==i,'blood journey stop '+str(i+1)+' follows the physiological route')
   if i<11:p.locator('#heart-route-next').click()
  check('outside this heart model' in p.locator('#heart-route-note').inner_text(),'tissue gas exchange is correctly placed outside the heart')
  check(saved(p)==baseline,'the blood journey does not award mission XP or change stored progress')
  mode(p,'flow');p.locator('#heart-flow').click();p.locator('#heart-canvas').scroll_into_view_if_needed();before=live(p)['particlePositions'];p.wait_for_timeout(500);check(live(p)['particlePositions']!=before,'blood journey animates red cells along the active anatomical segment')
  p.evaluate('document.body.classList.add("motionoff")');p.wait_for_function('!window.inneruHeartExplorerState().journeyPlaying');check(p.locator('#heart-flow').is_disabled(),'app Reduce motion also pauses the journey');p.evaluate('document.body.classList.remove("motionoff")')
  # Original six discovery rewards remain once-only and use real surface mesh names.
  mode(p,'surface')
  for key in groups['vessels']:
   choose(p,key);check(live(p)['selectedMeshes']>0,'surface '+key+' matches the actual imported mesh name')
  check(state(p)['xp']==60 and len(state(p)['circ']['heartExplored'])==6,'the existing six surface discovery rewards total 60 XP')
  choose(p,'aorta');check(state(p)['xp']==60,'revisiting an explored vessel does not duplicate XP')
  # Small screens keep all categories, modes and phase controls available.
  for width in [320,390,768]:
   p.set_viewport_size({'width':width,'height':900})
   for name in ['surface','cutaway','valves','flow']:
    mode(p,name);check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),f'{width}px: {name} layout fits')
   mode(p,'cutaway');group(p,'support');choose(p,'chordae');check(live(p)['selectedMeshes']>0,f'{width}px: detailed support structures remain selectable')
  p.evaluate('location.hash="home"');p.wait_for_selector('.heart-lab',state='detached');check(live(p)['disposed'] and not live(p)['canvas'],'leaving the page disposes the renderer and observers')
  # The anatomy text and manual phase controls survive a missing WebGL context.
  no=b.new_context();no.add_init_script("HTMLCanvasElement.prototype.getContext=function(){return null}")
  q=no.new_page();q.goto(BASE+'#circulatory',wait_until='domcontentloaded');q.wait_for_selector('#heart-fallback',state='visible');check(q.locator('#heart-error').is_visible(),'non-WebGL devices receive an anatomical fallback illustration')
  mode(q,'cutaway');group(q,'valves');choose(q,'mitral');check('leaflets' in q.locator('#circ-vessel-info').inner_text(),'fallback still explains internal valve anatomy')
  q.locator('#heart-cycle').fill('65');check(q.locator('#heart-cycle-label').inner_text()=='Ejection','fallback preserves manual scientific phase investigation')
  check(not errors,'no uncaught browser errors: '+str(errors));b.close()
 print(f'{checks} checks passed.',flush=True)
finally:server.shutdown();server.server_close()
