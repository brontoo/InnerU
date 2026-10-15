"""Verify the real muscular studio in Chromium. No learner storage is reused."""
import functools
import http.server
import json
import math
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1'
checks=0
errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1
    print('PASS',message,flush=True)
def state(page): return page.evaluate('inneruMuscleExplorerState()')
def settled(page):
    page.locator('.muscle-studio-stage').scroll_into_view_if_needed()
    page.wait_for_function('!inneruMuscleExplorerState().transitioning')
def ready(page):
    page.goto(BASE+'#muscle')
    page.locator('.muscle-studio').scroll_into_view_if_needed()
    page.wait_for_function('window.inneruMuscleExplorerState?.()?.frames>0',timeout=60000)
    settled(page)
def reset(page):
    page.locator('[data-muscle-action=reset]').click()
    settled(page)

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':1510,'height':1100})
        page=context.new_page()
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and any(s in m.text for s in ['Shader Error','WebGLProgram','Muscular anatomy:']) else None)
        ready(page)
        saved=page.evaluate("localStorage.getItem('bodyquest-v1')")
        check(page.evaluate("document.querySelector('.mq-hero').nextElementSibling.matches('.muscle-studio')"),'studio appears immediately after the muscular hero')
        check(page.locator('.muscle-studio canvas').count()==1 and state(page)['triangles']>100000,'genuine detailed 3D geometry renders in one canvas')
        check(state(page)['drawCalls']<140 and state(page)['triangles']<350000,'anatomy fits the classroom rendering budget')
        check(page.get_by_role('tab').count()==6,'six named anatomical region tabs')
        check(len(state(page)['structures'])==23,'all 23 structure choices available')

        geometry=page.evaluate("""async()=>{
            const T=await import('./assets/three/three.module.js');const m=window.__inneruMuscleStudio.model;
            m.group.updateMatrixWorld(true);let finite=true,protectedSupport=0,coverageSamples=0,uncovered=0;
            for(const mesh of [...m.meshes,...m.baseMeshes,...m.decorations,...m.garments]){
                const a=mesh.geometry.attributes.position;
                for(let i=0;i<a.count;i++){const v=new T.Vector3().fromBufferAttribute(a,i);finite=finite&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);}
            }
            for(const mesh of m.baseMeshes){const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);if(y>.00&&y<.14&&Math.abs(x)<.2)protectedSupport++;}}
            const ray=new T.Raycaster();
            for(const mesh of m.meshes){const a=mesh.geometry.attributes.position;
                for(let i=0;i<a.count;i+=47){const v=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);if(v.y<-.61||v.y>.16||Math.abs(v.x)>.36)continue;
                    coverageSamples++;
                    for(const d of [new T.Vector3(0,0,1),new T.Vector3(0,0,-1),new T.Vector3(1,0,0),new T.Vector3(-1,0,0)]){ray.set(v.clone(),d);if(!ray.intersectObjects(m.garments,false).length){uncovered++;break;}}
                }
            }
            const box=id=>{const b=new T.Box3();m.meshes.filter(x=>x.userData.structure===id).forEach(x=>b.expandByObject(x));return {min:b.min.toArray(),max:b.max.toArray()};};
            const head=m.decorations.filter(x=>x.name.includes('head'));const b=new T.Box3();head.forEach(x=>b.expandByObject(x));
            return{finite,protectedSupport,coverageSamples,uncovered,headSize:b.getSize(new T.Vector3()).toArray(),calf:box('gastrocnemius'),shin:box('tibialis'),biceps:box('biceps'),triceps:box('triceps'),clothes:m.garments.length};
        }""")
        check(geometry['finite'],'all actual vertices contain finite coordinates')
        check(geometry['clothes']>=5 and state(page)['garmentOpaque'],'shorts include opaque hip, leg, hem and waist geometry')
        check(geometry['coverageSamples']>80 and geometry['uncovered']==0,'actual hip and upper-thigh muscle vertices lie inside shorts from four directions')
        check(geometry['protectedSupport']==0,'protected template anatomy is absent from the rendered body support')
        check(.38<geometry['headSize'][1]<.46,'smooth mannequin head retains adult atlas proportions')
        check(geometry['calf']['min'][1]<-1 and geometry['calf']['min'][2]<0 and geometry['shin']['max'][2]>0,'calf is posterior and shin muscle anterior')
        check(geometry['biceps']['max'][2]>geometry['triceps']['max'][2],'biceps and triceps occupy distinct anterior and posterior compartments')

        front=state(page)['camera']
        page.locator('[data-muscle-action=back]').click();settled(page)
        check(state(page)['camera'][2]<0 and front[2]>0,'front and back controls turn the camera around the anatomy')
        page.locator('[data-muscle-action=spin]').click()
        a=state(page)['camera']
        page.wait_for_function("a=>Math.hypot(...inneruMuscleExplorerState().camera.map((v,i)=>v-a[i]))>.03",arg=a,timeout=5000)
        check(state(page)['spin'],'auto rotation moves the live 3D camera')
        page.locator('[data-muscle-action=spin]').click()
        check(not state(page)['spin'],'auto rotation pauses on request')
        stage=page.locator('.muscle-studio-stage');stage.focus();a=state(page)['camera'];page.keyboard.press('ArrowLeft');page.wait_for_timeout(200)
        check(math.dist(a,state(page)['camera'])>.02,'keyboard rotates the 3D anatomy')
        a=state(page)['camera'];page.keyboard.press('+');page.wait_for_timeout(150)
        check(math.dist(a,state(page)['camera'])>.02,'keyboard zoom changes the actual camera distance')
        reset(page)
        rect=stage.bounding_box();a=state(page)['camera'];page.mouse.move(rect['x']+rect['width']*.63,rect['y']+rect['height']*.43);page.mouse.down();page.mouse.move(rect['x']+rect['width']*.8,rect['y']+rect['height']*.43,steps=8);page.mouse.up();page.wait_for_timeout(200)
        check(math.dist(a,state(page)['camera'])>.08,'drag rotates the live body rather than swapping an illustration')

        # Stop transitions for exhaustive inspection; separately tested above.
        page.emulate_media(reduced_motion='reduce');reset(page)
        stage.focus()
        for _ in range(20):page.keyboard.press('ArrowLeft')
        page.wait_for_function("document.querySelector('.muscle-studio-view').textContent.includes('posterior')")
        check(state(page)['camera'][2]<0,'anatomical view label follows manual rotation to the back')
        reset(page)
        for region in ['neck','arms','core','back','legs','all']:
            page.locator(f'[data-muscle-region={region}]').click();settled(page)
            check(state(page)['region']==region and page.locator(f'#muscle-tab-{region}').get_attribute('aria-selected')=='true',f'{region} tab updates its panel and camera')
        for id in state(page)['structures']:
            page.locator(f'[data-muscle-part="{id}"]').click();settled(page)
            s=state(page)
            check(s['selection']==id and s['faded']>25 and set(s['focused'])=={id} and s['garmentOpaque'],f'{id} isolates its real meshes while shorts stay opaque')
            check(page.locator('.muscle-studio-info h3').inner_text() and page.locator('.muscle-info-example p').inner_text(),f'{id} explains its function and an everyday example')
        check(state(page)['explored']==23,'free discovery counter counts unique structures')
        page.locator('[data-muscle-part=gluteal]').click();settled(page)
        check('covered' in page.locator('.muscle-studio-info').inner_text().lower(),'hip selection explicitly remains covered')
        page.locator('[data-muscle-part=biceps]').click();settled(page)
        pix=page.evaluate("""()=>{const live=window.__inneruMuscleStudio;live.draw();const c=live.renderer.domElement,gl=c.getContext('webgl2'),data=new Uint8Array(c.width*c.height*4);gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,data);let faint=0,teal=0;for(let i=0;i<data.length;i+=4){if(data[i+3]>0&&data[i+3]<70)faint++;if(data[i+3]>240&&data[i+1]>data[i]*1.15&&data[i+1]>data[i+2]*1.04)teal++;}return{faint,teal};}""")
        check(pix['faint']>1000 and pix['teal']>1000,'rendered selection contains visible teal anatomy and genuinely transparent surrounding structures')
        check(page.locator('[data-muscle-part=biceps]').evaluate("b=>getComputedStyle(b).backgroundColor")=='rgb(40, 110, 107)','selected button uses the same clear teal highlight')
        check(page.evaluate("localStorage.getItem('bodyquest-v1')")==saved,'all anatomy browsing leaves learner progress and XP unchanged')
        page.locator('.muscle-studio-info summary').click()
        check('radius' in page.locator('.muscle-studio-info details').inner_text().lower(),'attachment notes open without completing a lesson')
        reset(page);page.locator('#muscle-tab-all').focus();page.keyboard.press('End')
        check(page.evaluate('document.activeElement.id')=='muscle-tab-legs' and state(page)['region']=='legs','tab keyboard End selects the final anatomical region')
        page.keyboard.press('Home');check(state(page)['region']=='all','tab keyboard Home restores whole body')
        page.locator('[data-muscle-action=labels]').click()
        check(page.locator('.muscle-studio-label:visible').count()==0,'on-model labels can be hidden')
        page.locator('[data-muscle-action=labels]').click()
        page.locator('.muscle-studio-label:visible').first.click();settled(page)
        check(state(page)['selection'] is not None,'an on-model label selects its anatomical meshes')

        # Real mesh picking: project the anterior abdomen into the rendered view.
        reset(page);page.locator('[data-muscle-action=labels]').click()
        xy=page.evaluate("""async()=>{const T=await import('./assets/three/three.module.js');const l=window.__inneruMuscleStudio,p=new T.Vector3(-.07,.39,.30).project(l.camera),r=l.renderer.domElement.getBoundingClientRect();return{x:r.x+(p.x*.5+.5)*r.width,y:r.y+(-p.y*.5+.5)*r.height};}""")
        page.mouse.click(xy['x'],xy['y']);settled(page)
        check(state(page)['selection']=='rectus','clicking the visible abdomen ray-picks rectus abdominis')
        page.evaluate('window.oldMuscleModel=window.__inneruMuscleStudio.model;window.oldMuscleRenderer=window.__inneruMuscleStudio.renderer')
        page.evaluate("location.hash='muscle/mission/1'")
        page.wait_for_selector('.mq-panel')
        check(page.locator('.muscle-studio').count()==0 and page.evaluate('window.__inneruMuscleStudio===null && oldMuscleModel.group.children.length===0'),'leaving the page disposes the anatomy and its rendering resources')
        check(page.locator('.mq-panel').count()>0,'existing muscular mission still opens normally')
        ready(page);check(page.locator('.muscle-studio canvas').count()==1,'returning mounts one fresh studio without duplicate canvases')
        page.evaluate("location.hash='integumentary'")
        page.wait_for_selector('.skin-explorer')
        check(page.evaluate('window.__inneruMuscleStudio===null'),'switching to another body system also cleans up the model')

        mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        phone=mobile.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));ready(phone)
        check(phone.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile page has no horizontal overflow')
        check(not state(phone)['spin'] and not state(phone)['transitioning'],'reduced motion starts with a still model and immediate camera changes')
        phone.locator('[data-muscle-region=legs]').click();settled(phone)
        phone.locator('[data-muscle-part=gastrocnemius]').click();settled(phone)
        check(state(phone)['selection']=='gastrocnemius' and state(phone)['camera'][2]<0,'mobile muscle selection reveals posterior anatomy')
        check(phone.locator('[data-muscle-part=gastrocnemius]').bounding_box()['height']>=43,'mobile muscle targets remain large enough for touch')
        phone.locator('.muscle-studio').screenshot(path='/tmp/muscle-studio-mobile.png')
        mobile.close()

        fallback=browser.new_context(viewport={'width':1300,'height':1000})
        fallback.add_init_script('window.WebGLRenderingContext=undefined')
        f=fallback.new_page();f.on('pageerror',lambda e:errors.append(str(e)));f.goto(BASE+'#muscle');f.wait_for_selector('.muscle-studio-unavailable:visible')
        check(f.locator('.muscle-studio-fallback').evaluate('img=>img.complete&&img.naturalWidth>0'),'fallback shows the same covered mannequin when WebGL is unavailable')
        f.locator('[data-muscle-region=back]').click();f.locator('[data-muscle-part=latissimus]').click()
        check('Latissimus dorsi'==f.locator('.muscle-studio-info h3').inner_text(),'fallback tabs and anatomy descriptions remain interactive')
        check(f.locator('[data-muscle-action=spin]').is_disabled(),'unavailable 3D controls do not pretend to rotate the fallback image')
        fallback.close()
        failed=browser.new_context();failed.route('**/anatomical-muscles.glb',lambda r:r.abort())
        f=failed.new_page();f.goto(BASE+'#muscle');f.locator('.muscle-studio').scroll_into_view_if_needed();f.wait_for_selector('.muscle-studio-unavailable:visible')
        f.locator('[data-muscle-part=biceps]').click()
        check(f.locator('.muscle-studio-info h3').inner_text()=='Biceps brachii' and f.locator('.muscle-studio canvas').count()==0,'a failed model download falls back cleanly while anatomy remains usable')
        failed.close()
        check(not errors,'no JavaScript or WebGL shader errors during normal exploration')
        context.close();browser.close()
    print(json.dumps({'checks':checks,'result':'PASS','geometry':geometry},indent=2),flush=True)
finally:
    server.shutdown();server.server_close()
