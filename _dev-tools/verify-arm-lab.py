"""Check elbow anatomy, movement learning and the three discovery challenges."""
import functools,http.server,threading,json,math
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}/?nosw=1#muscle'
checks=0;errors=[]
def check(value,message):
    global checks
    assert value,message
    checks+=1;print('PASS',message,flush=True)
def state(page):return page.evaluate('inneruArmLabState()')
def pose(page,angle):return page.evaluate("a=>{const r=document.querySelector('#mq-arm-range');r.value=a;r.dispatchEvent(new Event('input',{bubbles:true}));return inneruArmLabState();}",angle)
def ready(page):
    page.goto(BASE);page.locator('.arm-lab').scroll_into_view_if_needed();page.wait_for_function('window.__inneruArmView?.state().frames>0',timeout=60000)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-unsafe-swiftshader'])
        ctx=browser.new_context(viewport={'width':1510,'height':1100});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' and any(w in m.text for w in ['Shader Error','WebGLProgram']) else None)
        ready(page);saved=page.evaluate("localStorage.getItem('bodyquest-v1')")
        check(page.locator('#mq-pairs.arm-lab').count()==1 and page.locator('#mq-pair-view').count()==0,'old paired-muscle animation is replaced in its original lesson location')
        check(page.locator('.arm-lab canvas').count()==1,'one genuine 3D arm canvas')
        check(page.locator('[data-arm-quest]').count()==4,'free exploration and all three challenges are open')
        check(page.locator('[data-muscle-type]').count()==3 and page.locator('[data-muscle-step]').count()==6,'neighboring muscular lesson activities remain present')
        anatomy=page.evaluate("""async()=>{
          const T=await import('./assets/three/three.module.js'),m=window.__inneruArmView.model;
          let finite=true;for(const mesh of m.meshes){const a=mesh.geometry.attributes.position;for(let i=0;i<a.array.length;i++)finite=finite&&Number.isFinite(a.array[i]);}
          const boneData=m.bones.map(b=>Array.from(b.geometry.attributes.position.array));
          const states=[],samples=[];let contactError=0,connectionError=0;
          for(const angle of [0,30,60,90,120,130]){
            m.update({angle,phase:'idle',part:'all'});states.push(m.state());
            const widths={};for(const id of ['biceps','triceps']){let min=Infinity,max=-Infinity;for(const mesh of m.muscles.filter(x=>x.userData.part===id)){const a=mesh.geometry.attributes.position,y=mesh.geometry.attributes.armRestY;for(let i=0;i<a.count;i++){if(y.getX(i)>.2&&y.getX(i)<.36){min=Math.min(min,a.getX(i));max=Math.max(max,a.getX(i));}}}widths[id]=max-min;}samples.push(widths);
            for(const id of ['radius','ulna']){const bone=m.bones.find(b=>b.name.toLowerCase().includes(id)),a=bone.geometry.attributes.position,marker=m.markers[id].position;let min=Infinity;for(let i=0;i<a.count;i++)min=Math.min(min,new T.Vector3().fromBufferAttribute(a,i).distanceTo(marker));contactError=Math.max(contactError,min);}
            for(const tendon of m.tendons){const a=tendon.geometry.attributes.position,center=new T.Vector3(),start=a.count-9;for(let j=0;j<8;j++)center.add(new T.Vector3().fromBufferAttribute(a,start+j));center.multiplyScalar(1/8);const id=tendon.userData.muscle==='biceps'?'radius':'ulna';connectionError=Math.max(connectionError,center.distanceTo(new T.Vector3(...m.state().insertions[id])));}
          }
          const rigid=m.bones.every((b,k)=>b.geometry.attributes.position.array.every((v,i)=>v===boneData[k][i]));
          return{finite,rigid,states,samples,contactError,connectionError,bones:m.bones.length,biceps:m.muscles.filter(x=>x.userData.part==='biceps').length,triceps:m.muscles.filter(x=>x.userData.part==='triceps').length,forearmBones:m.forearm.children.filter(x=>x.userData.part==='bones').length};
        }""")
        check(anatomy['finite'],'all arm geometry contains finite positions')
        check(anatomy['bones']==5 and anatomy['forearmBones']==2,'scapula, clavicle, humerus, radius and ulna are actual atlas meshes')
        check(anatomy['biceps']==2 and anatomy['triceps']==3,'biceps has two anatomical heads and triceps has three')
        check(anatomy['rigid'],'bone vertices and lengths remain exactly unchanged throughout flexion')
        check(anatomy['contactError']<.001,'tendon insertion markers lie on the correct radius and ulna surfaces')
        check(anatomy['connectionError']<.0001,'moving tendon endpoints remain attached to their rotating bones')
        b=[s['bicepsLength'] for s in anatomy['states']];t=[s['tricepsLength'] for s in anatomy['states']]
        check(all(b[i+1]<b[i] for i in range(5)),'biceps belly progressively shortens during flexion')
        check(all(t[i+1]>t[i] for i in range(5)),'triceps belly progressively lengthens during flexion')
        check(anatomy['samples'][-1]['biceps']>anatomy['samples'][0]['biceps'],'biceps belly becomes fuller as its length decreases')
        check(max(s['tendonLengths']['biceps'] for s in anatomy['states'])-min(s['tendonLengths']['biceps'] for s in anatomy['states'])<.0003,'biceps tendon length stays essentially constant')
        check(max(s['tendonLengths']['triceps'] for s in anatomy['states'])-min(s['tendonLengths']['triceps'] for s in anatomy['states'])<.0004,'posterior triceps tendon retains its length while wrapping around the elbow')
        pose(page,20);s=pose(page,35)
        check(s['phase']=='flex' and page.locator('[data-arm-state=biceps]').get_attribute('class')=='is-active','increasing a small angle activates biceps, independent of slider position')
        pose(page,115);s=pose(page,100)
        check(s['phase']=='extend' and page.locator('[data-arm-state=triceps]').get_attribute('class')=='is-active','decreasing a large angle activates triceps, independent of slider position')
        page.wait_for_timeout(600)
        check(state(page)['phase']=='idle' and page.locator('.arm-lab-muscle-states .is-active').count()==0,'a stationary pose does not falsely identify an actively contracting muscle')
        pose(page,20);page.locator('[data-arm-move=flex]').click();page.wait_for_function('inneruArmLabState().angle>30&&inneruArmLabState().playing')
        check(state(page)['phase']=='flex','bend button animates the actual elbow through intermediate angles')
        page.locator('[data-arm-pause]').click();a=state(page)['angle'];page.wait_for_timeout(250)
        check(not state(page)['playing'] and abs(state(page)['angle']-a)<.01,'pause stops the animation at its current pose')
        page.locator('[data-arm-move=flex]').click();page.wait_for_function('inneruArmLabState().angle>110',timeout=15000);page.locator('[data-arm-pause]').click()
        check(state(page)['angle']>110,'movement continues from the paused angle')
        page.locator('[data-arm-move=extend]').click();page.wait_for_function('inneruArmLabState().phase==="extend"&&inneruArmLabState().angle<100',timeout=15000);page.locator('[data-arm-pause]').click()
        check(state(page)['angle']<100,'extension smoothly reverses the motion')
        pose(page,200);check(state(page)['angle']==130,'elbow flexion clamps at its 130-degree limit')
        pose(page,-20);check(state(page)['angle']==0,'extension does not hyperextend past zero degrees')

        # All challenge content is accessible in any order.
        page.locator('[data-arm-quest="2"]').click()
        check(page.locator('[data-arm-answer]').count()==2 and state(page)['stars']==0,'final challenge can be previewed before earning any stars')
        page.locator('[data-arm-quest="0"]').click();page.locator('[data-arm-answer="1"]').click()
        check(state(page)['stars']==0 and not state(page)['achievements'][0]['answer'],'incorrect flexor choice gives a hint without awarding a star')
        page.locator('[data-arm-answer="0"]').click();check(state(page)['stars']==0,'correct answer alone does not bypass the movement challenge')
        pose(page,110)
        check(state(page)['stars']==1 and page.locator('.arm-lab-target').get_attribute('class').find('is-in-zone')>=0,'bending into the target zone earns the first discovery star')
        pose(page,110);check(state(page)['stars']==1,'repeating a completed target never duplicates a star')
        check(page.evaluate("window.__inneruArmView.model.group.getObjectByName('Target angle beacon').visible"),'challenge target beacon is visible in the live anatomy scene')
        page.locator('[data-arm-quest="1"]').click();page.locator('[data-arm-answer="1"]').click();pose(page,20)
        check(state(page)['stars']==2,'correctly extending into the target zone earns a second star')
        page.locator('[data-arm-quest="2"]').click();page.locator('[data-arm-part=tendons]').click()
        check(state(page)['stars']==2,'inspecting tendons still requires the connection question')
        page.locator('[data-arm-answer="0"]').click()
        check(state(page)['stars']==3 and 'arm-lab-master' in page.locator('.arm-lab').get_attribute('class'),'tracing muscle-to-bone attachments completes the three-star challenge')
        check(page.locator('[data-arm-star]').all_text_contents()==['★','★','★'],'all earned stars are shown on their discovery cards')
        page.locator('[data-arm-quest=free]').click()
        check(page.locator('.arm-lab-target').is_hidden() and not page.evaluate("window.__inneruArmView.model.group.getObjectByName('Target angle beacon').visible"),'free exploration clears the challenge target and keeps the anatomy open')
        for part in ['biceps','triceps','tendons','bones','all']:
            page.locator(f'[data-arm-part={part}]').click()
            check(state(page)['part']==part and page.locator('.arm-lab-anatomy p').inner_text(),f'{part} selection provides an anatomical explanation')
        page.locator('[data-arm-part=biceps]').click()
        check(page.evaluate("window.__inneruArmView.model.muscles.filter(m=>m.userData.part==='triceps').every(m=>m.material.opacity===.1)"),'selected muscle is isolated while its opposing muscle becomes transparent')
        check(page.evaluate("localStorage.getItem('bodyquest-v1')")==saved,'all new activity interactions preserve existing lesson XP and progress')
        page.locator('[data-arm-part=all]').click();page.locator('.arm-lab-stage').scroll_into_view_if_needed();view=page.evaluate('__inneruArmView.camera.position.toArray()');box=page.locator('.arm-lab-stage').bounding_box();page.mouse.move(box['x']+box['width']*.4,box['y']+box['height']*.4);page.mouse.down();page.mouse.move(box['x']+box['width']*.65,box['y']+box['height']*.4,steps=8);page.mouse.up();page.wait_for_timeout(200)
        check(math.dist(view,page.evaluate('__inneruArmView.camera.position.toArray()'))>.1,'the arm itself can be rotated to inspect the anatomical attachments')
        page.locator('[data-arm-view-reset]').click();page.wait_for_timeout(100)
        check(math.dist([-1.43,.55,1.56],page.evaluate('__inneruArmView.camera.position.toArray()'))<.01,'reset view restores the anatomical teaching view')
        page.locator('.arm-lab-science summary').click()
        check('lengthening' in page.locator('.arm-lab-science').inner_text() and 'brachialis' in page.locator('.arm-lab-science').inner_text(),'scientific notes explain other flexors and loaded lengthening contractions')
        page.locator('[data-arm-quest="0"]').click();page.locator('[data-arm-answer="0"]').click();pose(page,110);page.locator('.arm-lab').screenshot(path='/tmp/arm-lab-challenge-final.png')
        page.evaluate('window.oldArmModel=window.__inneruArmView.model;location.hash="muscle/mission/1"');page.wait_for_selector('.mq-panel')
        check(page.evaluate('window.__inneruArmView===null&&window.__inneruArmLab===null&&oldArmModel.group.children.length===0'),'route changes release both the animation controller and 3D resources')

        mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');phone=mobile.new_page();phone.on('pageerror',lambda e:errors.append(str(e)));ready(phone)
        check(phone.evaluate('document.documentElement.scrollWidth<=innerWidth'),'mobile activity has no horizontal overflow')
        phone.locator('[data-arm-move=flex]').click()
        check(state(phone)['angle']==120 and not state(phone)['playing'],'reduced motion shows the completed flexed pose without automatic animation')
        phone.locator('[data-arm-quest="0"]').click();phone.locator('[data-arm-answer="0"]').click();phone.locator('#mq-arm-range').scroll_into_view_if_needed();pose(phone,110)
        check(state(phone)['stars']==1,'the movement challenge works on a touch-size screen')
        rect=phone.locator('.arm-lab-stage').bounding_box();check(rect['y']+rect['height']>0 and rect['y']<500,'mobile anatomy remains visible beside the movement controls while scrolling')
        check(phone.locator('[data-arm-move=flex]').bounding_box()['height']>=44,'mobile movement buttons remain accessible touch targets')
        phone.locator('.arm-lab').screenshot(path='/tmp/arm-lab-mobile-final.png');mobile.close()

        fallback=browser.new_context(viewport={'width':1300,'height':1000},reduced_motion='reduce');fallback.add_init_script('window.WebGLRenderingContext=undefined');f=fallback.new_page();f.on('pageerror',lambda e:errors.append(str(e)));f.goto(BASE);f.locator('.arm-lab').scroll_into_view_if_needed()
        check(f.locator('.arm-lab-svg svg').is_visible() and f.locator('.arm-lab canvas').count()==0,'devices without WebGL get the interactive scientific illustration')
        lengths=[]
        for angle in [0,60,120]:pose(f,angle);lengths.append(f.evaluate("[...document.querySelectorAll('[data-arm-tendon]')].map(p=>p.getTotalLength())"))
        check(max(x[0] for x in lengths)-min(x[0] for x in lengths)<1 and max(x[1] for x in lengths)-min(x[1] for x in lengths)<1,'fallback tendons also retain their lengths as the elbow moves')
        f.locator('[data-arm-quest="0"]').click();f.locator('[data-arm-answer="0"]').click();pose(f,110)
        check(state(f)['stars']==1 and '110' in f.locator('.arm-lab-svg svg').get_attribute('aria-label'),'fallback movement and discovery rewards remain fully interactive')
        f.locator('[data-arm-part=tendons]').click();check(f.locator('.arm-lab-anatomy h4').inner_text()=='The connection that carries the pull','fallback supports anatomical inspection')
        fallback.close()
        failed=browser.new_context();failed.route('**/movement-arm.glb',lambda r:r.abort());f=failed.new_page();f.goto(BASE);f.locator('.arm-lab').scroll_into_view_if_needed();f.wait_for_function("document.querySelector('.arm-lab-render-note').textContent.includes('3D unavailable')")
        check(f.locator('.arm-lab-svg svg').is_visible(),'an unavailable anatomical asset falls back without losing the activity');failed.close()
        check(not errors,'no JavaScript or WebGL shader errors during normal use')
        browser.close()
    print(json.dumps({'checks':checks,'result':'PASS','attachmentError':anatomy['contactError'],'tendonConnectionError':anatomy['connectionError']},indent=2),flush=True)
finally:server.shutdown();server.server_close()
