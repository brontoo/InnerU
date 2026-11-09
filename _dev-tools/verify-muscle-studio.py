"""Local-only muscular rotation, failure recovery and preserved elbow/mission learning."""
import base64,json
from urllib.parse import urlsplit
from test_support import playwright_session,launch,new_context,artifact,start_fixture
proc,origin=start_fixture();checks=0;errors=[]
retired={'muscle-atlas-ui.js','muscle-explorer.js','muscle-model.js','muscle-reference-surfaces.js','muscle-studio.css','assets/muscular/body-template.glb','assets/muscular/classroom-model.webp'}
sections=['mq-essentials','mq-how','mq-contraction','mq-pairs','mq-roles','mq-tendons','mq-activities','mq-terms','mq-missions','mq-final','mq-completion-state']
asset='assets/muscular/rotational-atlas.glb'
def check(value,label):
 global checks
 assert value,label
 checks+=1;print('PASS '+label,flush=True)
def saved(p):return p.evaluate('JSON.stringify(InneruLearning.snapshot())')
def open_model(p):
 p.locator('[data-muscle-open]').click();p.wait_for_function('window.__inneruMuscleRotator?.state().frames>0',timeout=60000)
def camera(p):return p.evaluate('__inneruMuscleRotator.camera.position.toArray()')
def distance(p):return p.evaluate('__inneruMuscleRotator.camera.position.distanceTo(__inneruMuscleRotator.controls.target)')
try:
 with playwright_session() as pw:
  b=launch(pw)
  for language in ['en','ar']:
   c=new_context(b,service_workers='block',reduced_motion='reduce',viewport={'width':1440,'height':1000})
   c.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'"+language+"',guided:false}));")
   p=c.new_page();requests=[];p.on('request',lambda r:requests.append(urlsplit(r.url).path.lstrip('/')));p.on('pageerror',lambda e:errors.append(str(e)))
   p.on('console',lambda m:errors.append(m.text) if m.type=='error' and any(w in m.text for w in ['Shader Error','WebGLProgram']) else None)
   for refresh in [False,True]:
    if refresh:p.reload()
    else:p.goto(origin+'/index.html?nosw=1#muscle')
    p.wait_for_selector('.mq-landing');p.wait_for_function('(lang)=>document.documentElement.lang===lang',arg=language)
    check(p.locator('.muscle-rotator').count()==1 and p.locator('.muscle-studio,[data-muscle-part],[data-muscle-region]').count()==0,language+' has one compact optional viewer and no retired studio/details')
    check(p.locator('.mq-hero').evaluate('el=>el.nextElementSibling.classList.contains("muscle-rotator") && el.nextElementSibling.nextElementSibling.classList.contains("mq-foundation")'),language+' viewer is placed between the original hero and learning sequence')
    check(all(p.locator('#'+id).count()==1 for id in sections),language+' every existing learning section, final and completion panel remains')
    check(p.locator('.mq-path-card').count()==7,language+' retains all seven original mission cards')
   check(asset not in requests and 'muscle-rotator-view.js' not in requests,language+' model and renderer are not fetched before opening')
   p.locator('.muscle-rotator-poster').scroll_into_view_if_needed();p.wait_for_function('document.querySelector(".muscle-rotator-poster").naturalWidth>0')
   before=saved(p);open_model(p)
   check(p.locator('.muscle-rotator canvas').count()==1,language+' opens one genuine 3D canvas')
   check(p.evaluate('document.activeElement===document.querySelector(".muscle-rotator-stage") && document.activeElement.tabIndex===0'),language+' opening transfers keyboard focus to the model stage')
   geometry=p.evaluate('''()=>{const v=__inneruMuscleRotator;return {...v.state(),
    finite:v.model.children.every(m=>Array.from(m.geometry.attributes.position.array).every(Number.isFinite))};}''')
   check(geometry['finite'] and 20000<geometry['triangles']<950000 and geometry['drawCalls']<=12,language+' finite anatomical geometry is batched within the rendering budget')
   for name in ['front','back','side']:
    p.locator('[data-muscle-view='+name+']').click();p.wait_for_timeout(100)
    position=camera(p)
    correct=position[2]>0 if name=='front' else position[2]<0 if name=='back' else position[0]>0
    check(correct and p.locator('[data-muscle-view='+name+']').get_attribute('aria-pressed')=='true',language+' '+name+' preset moves the camera and exposes the selected state')
    p.locator('.muscle-rotator').screenshot(path=artifact('muscular-rotation-'+language+'-'+name+'.png'))
   start=distance(p);p.locator('[data-muscle-zoom=in]').click();check(distance(p)<start,language+' zoom moves the real camera closer')
   stage=p.locator('.muscle-rotator-stage');stage.focus();stage.press('Home');start=camera(p);stage.press('ArrowLeft')
   check(camera(p)!=start,language+' keyboard arrows turn the model without dragging')
   stage.press('Home');stage.press('+');check(camera(p)!=start,language+' keyboard zoom works')
   p.locator('[data-muscle-reset]').click();start=camera(p);stage.scroll_into_view_if_needed();box=stage.bounding_box()
   p.mouse.move(box['x']+box['width']*.45,box['y']+box['height']*.5);p.mouse.down();p.mouse.move(box['x']+box['width']*.65,box['y']+box['height']*.5,steps=8);p.mouse.up()
   check(camera(p)!=start,language+' drag turns the 3D camera')
   check(p.locator('[data-muscle-spin]').is_disabled() and not p.evaluate('__inneruMuscleRotator.controls.autoRotate'),language+' reduced motion prevents automatic rotation')
   for width in [320,390,768,1440]:
    p.set_viewport_size({'width':width,'height':1000});stage.scroll_into_view_if_needed();p.wait_for_timeout(150)
    check(p.evaluate('document.documentElement.scrollWidth<=innerWidth'),language+' viewer and wrapped controls fit '+str(width)+'px')
    # Inspect actual screenshot pixels: a canvas element alone can still be blank after resize.
    pixels=stage.screenshot(path=artifact('muscular-stage-'+language+'-'+str(width)+'.png'))
    visible=p.evaluate('''encoded=>new Promise(resolve=>{const image=new Image();image.onload=()=>{
     const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
     const context=canvas.getContext('2d');context.drawImage(image,0,0);const data=context.getImageData(0,0,image.width,image.height).data;
     let red=0;for(let i=0;i<data.length;i+=4)if(data[i]>70&&data[i]>data[i+1]*1.4&&data[i]>data[i+2]*1.4)red++;
     resolve(red>1000);};image.src='data:image/png;base64,'+encoded;})''',base64.b64encode(pixels).decode())
    check(visible,language+' rendered muscle tissue remains visible after resizing to '+str(width)+'px')
    if width in [320,1440]:p.locator('.muscle-rotator').screenshot(path=artifact('muscular-rotation-'+language+'-'+str(width)+'.png'))
   p.emulate_media(reduced_motion='no-preference');p.locator('[data-muscle-spin]').click();p.wait_for_timeout(200)
   check(p.evaluate('__inneruMuscleRotator.controls.autoRotate'),language+' spin starts only after the explicit control is used')
   p.emulate_media(reduced_motion='reduce');p.wait_for_function('!__inneruMuscleRotator.controls.autoRotate')
   # Presentation preference changes must not recreate the canvas or reset the lesson.
   p.locator('[data-guided-toggle]').click();p.locator('[data-guided-toggle]').click()
   check(saved(p)==before,language+' model controls and Guided mode preserve every learning/reward record')
   if language=='ar':
    p.wait_for_timeout(200);gaps=p.evaluate('InneruLocale.coverage(document.querySelector(".muscle-rotator"))')
    check(not gaps,'all visible Arabic viewer text and accessibility labels are translated: '+json.dumps(gaps,ensure_ascii=False))
   downloads=requests.count(asset);p.evaluate('location.hash="home"');p.wait_for_selector('.iu-expedition');p.wait_for_function('!window.__inneruMuscleRotator')
   p.evaluate('location.hash="muscle"');p.wait_for_selector('.mq-landing');open_model(p)
   check(requests.count(asset)==downloads,language+' returning reuses the parsed model without a duplicate download')
   p.locator('.arm-lab').scroll_into_view_if_needed();p.wait_for_function('window.__inneruArmView?.state().frames>0',timeout=60000);before=saved(p)
   check(p.locator('.arm-lab canvas').count()==1 and p.locator('[data-arm-quest]').count()==4,language+' independent 3D elbow activity and its three challenges remain')
   check(p.locator('[data-muscle-type]').count()==3 and p.locator('[data-muscle-step]').count()==6,language+' tissue comparisons and movement sequence remain')
   for angle in [30,90,120]:
    p.locator('#mq-arm-range').evaluate('(el,a)=>{el.value=a;el.dispatchEvent(new Event("input",{bubbles:true}));}',angle)
    check(p.evaluate('inneruArmLabState().angle')==angle,language+' retained elbow responds to '+str(angle)+' degrees')
   check(saved(p)==before,language+' free elbow exploration preserves answers, XP and completion')
   check(not retired.intersection(requests),language+' none of the previously rejected studio assets are requested')
   c.close()
  c=new_context(b,service_workers='block',reduced_motion='reduce');p=c.new_page();attempts=[]
  def fail_once(route):
   attempts.append(1)
   if len(attempts)==1:route.abort()
   else:route.continue_()
  p.route('**/rotational-atlas.glb',fail_once);p.goto(origin+'/index.html?nosw=1#muscle');p.locator('[data-muscle-open]').click()
  p.wait_for_function('document.querySelector("[data-muscle-open]").textContent.includes("again")')
  check(p.locator('.muscle-rotator-poster').is_visible() and p.locator('.mq-path-card').count()==7,'failed download keeps the illustration and all seven mission cards available')
  open_model(p);check(len(attempts)==2 and p.locator('.muscle-rotator canvas').count()==1,'retry fetches the failed model and recovers with exactly one canvas');c.close()
  c=new_context(b,service_workers='block');c.add_init_script("Object.defineProperty(window,'WebGLRenderingContext',{value:undefined})");p=c.new_page()
  p.goto(origin+'/index.html?nosw=1#muscle');p.locator('[data-muscle-open]').click();p.wait_for_function('document.querySelector("[data-muscle-open]").textContent.includes("again")')
  check(p.locator('.muscle-rotator-poster').is_visible() and p.locator('.muscle-rotator canvas').count()==0,'without WebGL the matching illustration and lesson remain usable');c.close()
  # Previously opened model and dependencies must work after a real worker-controlled offline refresh.
  c=new_context(b,reduced_motion='reduce');p=c.new_page();p.goto(origin+'/index.html#muscle');p.evaluate('navigator.serviceWorker.ready');p.wait_for_function('navigator.serviceWorker.controller!==null');open_model(p)
  p.wait_for_function('caches.match("/assets/muscular/rotational-atlas.glb").then(Boolean)');c.set_offline(True);p.reload();p.wait_for_selector('.muscle-rotator');open_model(p)
  check(p.locator('.muscle-rotator canvas').count()==1,'previously opened muscular anatomy remains rotatable after offline refresh');c.close()
  check(not errors,'no uncaught browser or shader errors: '+str(errors));b.close()
 print(json.dumps({'checks':checks,'result':'PASS'},indent=2))
finally:proc.terminate();proc.wait(timeout=10)
