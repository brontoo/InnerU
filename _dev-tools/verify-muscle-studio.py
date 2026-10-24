"""Verify the real muscular studio in Chromium. No learner storage is reused."""
import json
import math
from pathlib import Path
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, start_fixture

proc,ORIGIN=start_fixture()
BASE=ORIGIN+'/?nosw=1'
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
        browser=launch(p)
        context=new_context(browser, service_workers='block',viewport={'width':1510,'height':1100})
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
        check(page.locator('.muscle-studio-stage > .support-read-controls').count()==0,'finished loading removes its temporary reader without covering the anatomy')

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
                    for(const d of [new T.Vector3(0,0,1),new T.Vector3(0,0,-1),new T.Vector3(1,0,0),new T.Vector3(-1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,-1,0),new T.Vector3(1,0,1).normalize(),new T.Vector3(-1,0,-1).normalize()]){ray.set(v.clone(),d);if(!ray.intersectObjects(m.garments,false).length){uncovered++;break;}}
                }
            }
            const box=id=>{const b=new T.Box3();m.meshes.filter(x=>x.userData.structure===id).forEach(x=>b.expandByObject(x));return {min:b.min.toArray(),max:b.max.toArray()};};
            const head=m.decorations.filter(x=>x.name.includes('head'));const b=new T.Box3();head.forEach(x=>b.expandByObject(x));
            return{finite,protectedSupport,coverageSamples,uncovered,headSize:b.getSize(new T.Vector3()).toArray(),calf:box('gastrocnemius'),shin:box('tibialis'),biceps:box('biceps'),triceps:box('triceps'),clothes:m.garments.length,context:m.decorations.map(o=>o.name),navy:m.garments[0].material.color.getHex(),
                paired:['biceps','triceps','deltoid','rectus-femoris','gastrocnemius'].every(id=>{const a=m.meshes.filter(o=>o.userData.structure===id).map(o=>new T.Box3().setFromObject(o).getCenter(new T.Vector3()).x);return a.some(x=>x<0)&&a.some(x=>x>0)&&Math.abs(a.reduce((n,x)=>n+x,0))<.03;})};
        }""")
        check(geometry['finite'],'all actual vertices contain finite coordinates')
        check(geometry['clothes']>=5 and state(page)['garmentOpaque'],'shorts include opaque hip, leg, hem and waist geometry')
        check(geometry['coverageSamples']>80 and geometry['uncovered']==0,'actual hip and upper-thigh muscle vertices stay covered horizontally, diagonally, above and below')
        check(geometry['protectedSupport']==0,'protected template anatomy is absent from the rendered body support')
        check(.38<geometry['headSize'][1]<.46,'reconstructed head retains adult atlas proportions')
        check(geometry['calf']['min'][1]<-1 and geometry['calf']['min'][2]<0 and geometry['shin']['max'][2]>0,'calf is posterior and shin muscle anterior')
        check(geometry['biceps']['max'][2]>geometry['triceps']['max'][2],'biceps and triceps occupy distinct anterior and posterior compartments')

        check(geometry['paired'],'atlas left/right compartments remain paired after the reference pose refinement')
        check(geometry['navy']==0x1c304e,'the opaque garment uses the reference navy palette')
        check(all(any(name in item for item in geometry['context']) for name in ['Frontalis','Orbicularis oculi','Nasal cartilage','Thoracolumbar','Patella','Foot extensor']),'facial, connective-tissue and extremity detail is actual geometry')
        check(not any(m in state(page)['structures'] for m in ['face','patella','foot']),'contextual face, fascia and patella are not mislabelled as selectable muscles')
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
        page.locator('[data-muscle-action=labels]').click()
        for side in ['front','back']:
            page.locator('[data-muscle-action='+side+']').click();settled(page)
            stage.screenshot(path=artifact('muscle-reference-'+side+'.png'))
        reset(page);stage.focus()
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
        page.evaluate("location.hash='home'")
        page.wait_for_selector('.explore-screen')
        check(page.locator('.muscle-studio').count()==0 and page.evaluate('window.__inneruMuscleStudio===null && oldMuscleModel.group.children.length===0'),'leaving the page disposes the anatomy and its rendering resources')
        check(page.locator('.explore-screen').count()>0,'home restores the six-system exploration view')
        ready(page);check(page.locator('.muscle-studio canvas').count()==1,'returning mounts one fresh studio without duplicate canvases')
        page.evaluate("location.hash='integumentary'")
        page.wait_for_selector('.skin-explorer')
        check(page.evaluate('window.__inneruMuscleStudio===null'),'switching to another body system also cleans up the model')

        mobile=new_context(browser, service_workers='block',viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce')
        phone=mobile.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));ready(phone)
        check(phone.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile page has no horizontal overflow')
        check(not state(phone)['spin'] and not state(phone)['transitioning'],'reduced motion starts with a still model and immediate camera changes')
        phone.locator('[data-muscle-region=legs]').click();settled(phone)
        phone.locator('[data-muscle-part=gastrocnemius]').click();settled(phone)
        check(state(phone)['selection']=='gastrocnemius' and state(phone)['camera'][2]<0,'mobile muscle selection reveals posterior anatomy')
        check(phone.locator('[data-muscle-part=gastrocnemius]').bounding_box()['height']>=43,'mobile muscle targets remain large enough for touch')
        phone.locator('.muscle-studio').screenshot(path=artifact('muscle-studio-mobile.png'))
        mobile.close()

        fallback=new_context(browser, service_workers='block',viewport={'width':1300,'height':1000})
        fallback.add_init_script('window.WebGLRenderingContext=undefined')
        f=fallback.new_page();f.on('pageerror',lambda e:errors.append(str(e)));f.goto(BASE+'#muscle');f.wait_for_selector('.muscle-studio-unavailable:visible')
        check(f.locator('.muscle-studio-fallback').evaluate('img=>img.complete&&img.naturalWidth>0'),'fallback shows the matching covered anatomy model when WebGL is unavailable')
        f.locator('[data-muscle-region=back]').click();f.locator('[data-muscle-part=latissimus]').click()
        check('Latissimus dorsi'==f.locator('.muscle-studio-info h3').inner_text(),'fallback tabs and anatomy descriptions remain interactive')
        check(f.locator('[data-muscle-action=spin]').is_disabled(),'unavailable 3D controls do not pretend to rotate the fallback image')
        fallback.close()
        failed=new_context(browser, service_workers='block',);failed.route('**/anatomical-muscles.glb',lambda r:r.abort())
        f=failed.new_page();f.goto(BASE+'#muscle');f.locator('.muscle-studio').scroll_into_view_if_needed();f.wait_for_selector('.muscle-studio-unavailable:visible')
        f.locator('[data-muscle-part=biceps]').click()
        check(f.locator('.muscle-studio-info h3').inner_text()=='Biceps brachii' and f.locator('.muscle-studio canvas').count()==0,'a failed model download falls back cleanly while anatomy remains usable')
        failed.close()
        arabic=new_context(browser,service_workers='block',viewport={'width':320,'height':900},reduced_motion='reduce')
        arabic.add_init_script("localStorage.setItem('inneru-accessibility-v1',JSON.stringify({language:'ar',guided:true}));")
        ap=arabic.new_page();ap.on('pageerror',lambda e:errors.append(str(e)));ready(ap)
        ap.wait_for_function('document.documentElement.dir==="rtl"');ap.wait_for_timeout(300)
        check(not ap.evaluate('InneruLocale.coverage(document.querySelector(".muscle-studio"))'),'new model description, fallback label and sources have authored Arabic coverage')
        probe=(Path(__file__).with_name('layout-probe.js')).read_text()
        for structure in ['biceps','neck','gastrocnemius']:
            ap.locator('[data-muscle-part='+structure+']').click();settled(ap);ap.wait_for_timeout(100)
            result=ap.evaluate(probe)
            check(not result['issues'],'320px Arabic '+structure+' selection has no clipped text: '+json.dumps(result['issues'][:2],ensure_ascii=False))
        ap.locator('.muscle-studio').screenshot(path=artifact('muscle-reference-arabic-320.png'))
        check(not state(ap)['spin'] and ap.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Arabic Guided preferences retain a still, responsive model')
        arabic.close()

        # Exercise the actual worker cache with this model's new module graph.
        offline=new_context(browser,reduced_motion='reduce');op=offline.new_page()
        op.goto(ORIGIN+'/login.html');op.evaluate('navigator.serviceWorker.ready');op.wait_for_function('navigator.serviceWorker.controller!==null')
        op.goto(ORIGIN+'/#muscle');op.locator('.muscle-studio-stage').scroll_into_view_if_needed();op.wait_for_function('window.inneruMuscleExplorerState?.()?.frames>0',timeout=60000);op.wait_for_load_state('networkidle')
        cached=op.evaluate("""async()=>{const keys=await caches.keys();return(await Promise.all(keys.map(async k=>(await(await caches.open(k)).keys()).map(r=>new URL(r.url).pathname)))).flat();}""")
        check(all('/'+path in cached for path in ['muscle-reference-surfaces.js','assets/muscular/anatomical-muscles.glb','assets/muscular/body-template.glb']),'visited muscle studio caches its reference module and both existing model assets')
        worker=offline.service_workers[0];worker.evaluate("()=>{self.fetch=()=>Promise.reject(new TypeError('Disconnected local test network'));}");offline.set_offline(True)
        op.reload();op.locator('.muscle-studio-stage').scroll_into_view_if_needed();op.wait_for_function('window.inneruMuscleExplorerState?.()?.frames>0',timeout=60000)
        op.locator('[data-muscle-action=back]').click();settled(op)
        check(state(op)['camera'][2]<0 and state(op)['garmentOpaque'],'the rebuilt model remains rotatable and covered after an offline refresh')
        check(not any(path.startswith('/api/') for path in cached),'model caching excludes account and learning APIs')
        offline.close()
        check(not errors,'no JavaScript or WebGL shader errors during normal exploration')
        context.close();browser.close()
    print(json.dumps({'checks':checks,'result':'PASS','geometry':geometry},indent=2),flush=True)
finally:
    proc.terminate();proc.wait(timeout=10)
