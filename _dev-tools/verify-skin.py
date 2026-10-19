"""Functional and anatomical checks for the living-skin studio.

Run with Python Playwright and Chromium installed. Uses isolated browser storage
and a read-only local server; no user progress or application files are changed.
"""
import json
import math
from test_support import playwright_session as sync_playwright, launch, new_context, artifact, start_fixture

proc,ORIGIN=start_fixture()
BASE=ORIGIN+'/?nosw=1'
checks = 0
errors = []

def check(value, message):
    global checks
    assert value, message
    checks += 1
    print('PASS', message, flush=True)

def state(page): return page.evaluate('window.inneruSkinExplorerState()')
def ready(page):
    page.goto(BASE + '#integumentary')
    page.locator('.skin-explorer').scroll_into_view_if_needed()
    page.wait_for_function('window.inneruSkinExplorerState && window.inneruSkinExplorerState().canvas')
    page.wait_for_function('window.inneruSkinExplorerState().frames > 0')
def settled(page):
    # Position the viewer directly; animated canvas frames are not a layout-stability assertion.
    page.locator('.body-atlas-stage').evaluate("e=>e.scrollIntoView({behavior:'instant',block:'center'})")
    page.wait_for_function('!window.inneruSkinExplorerState().transitioning')
def reset(page):
    page.locator('[data-skin-action="reset"]').click(no_wait_after=True)
    settled(page)
def alpha(page):
    return page.evaluate("""() => new Promise(resolve => requestAnimationFrame(() => {
        window.inneruSkinExplorerDrawFrame();
        const canvas=document.querySelector('.skin-explorer canvas'),gl=canvas.getContext('webgl2');
        const pixels=new Uint8Array(canvas.width*canvas.height*4);
        gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
        let opaque=0,faint=0;
        for(let i=3;i<pixels.length;i+=4){if(pixels[i]>=242)opaque++;if(pixels[i]>0&&pixels[i]<=45)faint++;}
        resolve({opaque,faint});
    }))""")

try:
    with sync_playwright() as p:
        browser=launch(p)
        context = new_context(browser, service_workers='block',viewport={'width':1440,'height':1100})
        context.set_default_timeout(60000)
        page = context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda msg: errors.append(msg.text) if msg.type == 'error' and
                any(token in msg.text for token in ['Shader Error', 'WebGLProgram', 'VALIDATE_STATUS']) else None)
        ready(page)
        saved = page.evaluate("localStorage.getItem('bodyquest-v1')")
        check(page.locator('.skin-explorer canvas').count() == 1, 'one live 3D canvas')
        check(len(set(state(page)['structures'])) == 11, 'eleven anatomical structures available')
        check(page.locator('[data-skin-mode]').count() == 4, 'four anatomy views')
        check(state(page)['drawCalls'] < 120, 'complete dermal anatomy stays below 120 draw calls')
        check(state(page)['triangles'] < 900000, 'detailed anatomy stays within the rendering budget')

        # Inspect the actual generated geometry, not the descriptive metadata.
        anatomy = page.evaluate("""async () => {
            const {createSkinModel,skinJunction}=await import('./skin-model.js?v=dermis-anatomy-4');
            const THREE=await import('./assets/three/three.module.js');
            const m=createSkinModel();m.group.updateMatrixWorld(true);
            const box=name=>{const b=new THREE.Box3();m.meshes.filter(x=>x.userData.structure===name).forEach(x=>b.expandByObject(x));return {min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new THREE.Vector3()).toArray()};};
            let vascularBreaches=0,finite=true,cellVertices=0,sideFiberVertices=0;
            const follicleColors=new Set(),dermalComponents=new Set();let collagenVolume=0,lymphOutside=0;const papillary=new THREE.Box3(),reticular=new THREE.Box3();
            for(const mesh of m.meshes){if(mesh.userData.dermisPart)dermalComponents.add(mesh.userData.dermisPart);if(mesh.userData.tissueShell)(mesh.userData.dermisRegion==='papillary'?papillary:reticular).expandByObject(mesh);const a=mesh.geometry.getAttribute('position');for(let i=0;i<a.count;i++){
                const v=new THREE.Vector3().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);
                finite=finite&&Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z);
                if(mesh.userData.structure==='Blood vessels'&&v.y>=skinJunction(v.x,v.z))vascularBreaches++;
                if(mesh.userData.structure==='Epidermis'&&!mesh.material.map)cellVertices++;
                if(mesh.userData.structure==='Dermis'&&v.x>1.501)sideFiberVertices++;if(mesh.userData.dermisPart==='Collagen bundles'&&Math.abs(v.x)<1.3&&v.z<.3&&v.z>-.7&&v.y<.77)collagenVolume++;if(mesh.userData.dermisPart==='Lymphatic vessels'&&(v.y<-.59||v.y>=skinJunction(v.x,v.z)))lymphOutside++;
            }}
            m.meshes.filter(x=>x.userData.structure==='Hair follicle').forEach(x=>follicleColors.add(x.material.color.getHex()));
            const result={epidermis:box('Epidermis'),dermis:box('Dermis'),fat:box('Subcutaneous layer'),follicle:box('Hair follicle'),sweat:box('Sweat gland'),pressure:box('Pressure receptor'),vascularBreaches,finite,
              cellVertices,sideFiberVertices,follicleColors:follicleColors.size,dermalComponents:[...dermalComponents],collagenVolume,lymphOutside,papillaryBottom:papillary.min.y,reticularTop:reticular.max.y,
              sweatStart:m.paths.sweat.getPoint(0).toArray(),sweatEnd:m.paths.sweat.getPoint(1).toArray(),touchStart:m.paths.touch.getPoint(0).toArray(),touchEnd:m.paths.touch.getPoint(1).toArray()};
            m.dispose();return result;
        }""")
        check(anatomy['finite'], 'geometry contains finite positions throughout')
        check(anatomy['epidermis']['size'][1] < anatomy['dermis']['size'][1] * .2, 'epidermis is much thinner than dermis')
        check(anatomy['vascularBreaches'] == 0, 'blood vessels remain below the avascular epidermis')
        check(anatomy['fat']['max'][1] <= anatomy['dermis']['min'][1] + .03, 'subcutaneous fat sits below the dermis')
        check(anatomy['follicle']['min'][1] < anatomy['dermis']['min'][1], 'hair bulb reaches the upper subcutis')
        check(anatomy['sweatStart'][1] < 0 and anatomy['sweatEnd'][1] > 1.25, 'continuous eccrine route runs from deep coil to surface')
        check(anatomy['touchStart'][1] > 0 and anatomy['touchEnd'][1] < -.9, 'sensory route runs from the follicular plexus into a deeper nerve')
        check(anatomy['pressure']['min'][1] < -.8, 'lamellated pressure receptor lies deep in the tissue')
        check(anatomy['cellVertices'] > 30000, 'epidermal cell relief uses real inspectable geometry')
        check(anatomy['fat']['size'][2] > 1.8, 'adipose cells fill the depth of the stepped cutaway')
        check(anatomy['sideFiberVertices'] > 1000, 'collagen geometry continues onto the side cut face')
        check(anatomy['follicleColors'] >= 8, 'follicle includes distinct sheath, cell, shaft and bulb surfaces')
        check(set(anatomy['dermalComponents'])=={'Papillary dermis','Reticular dermis','Collagen bundles','Elastic fibers','Fibroblasts','Mast cells','Macrophages','Capillary loops','Vascular plexuses','Lymphatic vessels','Free nerve endings'}, 'all eleven dermal components have actual geometry')
        check(abs(anatomy['papillaryBottom']-.77)<.0001 and abs(anatomy['reticularTop']-.77)<.0001, 'papillary and reticular tissue meet at a shared boundary')
        check(anatomy['collagenVolume']>500, 'collagen occupies the tissue volume beyond the cut faces')
        check(anatomy['lymphOutside']==0, 'lymphatic routes remain within the dermal compartment')

        for mode, count in [('cutaway',11),('layers',3),('glands',4),('sensation',4)]:
            page.locator(f'[data-skin-mode="{mode}"]').click()
            check(page.locator('.body-atlas-parts [data-part]:visible').count() == count, mode + ': relevant structure controls')
            for button in page.locator('.body-atlas-parts [data-part]:visible').all():
                name=button.get_attribute('data-part');button.click();s=state(page)
                visible=[x for x in s['opacity'] if x['visible']]
                check(s['selection']==name and button.get_attribute('aria-pressed')=='true', mode + ': ' + name + ' selected')
                if name == 'Dermis':
                    check(all((0 < x['opacity'] < .6) if x['shell'] else x['opacity']<=.05 if x['part'] in ['Epidermis','Subcutaneous layer'] else x['opacity']==1 for x in visible), 'dermis selection retains embedded anatomy and a translucent matrix')
                else:
                    check(all(x['opacity']==1 if x['part']==name else x['opacity']<=.05 for x in visible), name + ': selected anatomy opaque and context transparent')
                check(page.locator('.skin-selection-badge').is_visible() and name in page.locator('.body-atlas-info h3').inner_text(), name + ': badge and science explanation agree')

        reset(page)
        page.locator('[data-part="Dermis"]').click()
        check(page.locator('.skin-dermis-explorer').is_visible(), 'dermis anatomy inventory opens with layer selection')
        # Position the viewer directly; animated canvas frames are not a layout-stability assertion.
        page.locator('.body-atlas-stage').evaluate("e=>e.scrollIntoView({behavior:'instant',block:'center'})")
        page.locator('.body-atlas-stage').screenshot(path=artifact('inneru-dermis-complete.png'))
        components=page.locator('[data-dermis-part]').all()
        check(len(components)==12, 'whole dermis plus eleven component controls are available')
        for button in components:
            name=button.get_attribute('data-dermis-part');button.click();current=state(page)
            check(current['selection']=='Dermis' and current['dermisPart']==(name or None), 'dermal component selection: '+(name or 'Whole dermis'))
            check(button.get_attribute('aria-pressed')=='true', 'dermal component announces selection: '+(name or 'Whole dermis'))
            if name:
                check(name in page.locator('.body-atlas-info h3').inner_text(), name+': specific scientific explanation')
                check(any(x['visible'] and x['component']==name and x['opacity']>0 for x in current['opacity']), name+': real geometry is visible')
        for name in ['Fibroblasts','Mast cells','Macrophages']:
            page.locator(f'[data-dermis-part="{name}"]').click()
            page.locator('[data-dermis-cell-focus]').click();settled(page)
            check(state(page)['detail']=='dermis-cell' and math.dist(state(page)['camera'],state(page)['target'])<1.4, name+': representative cell can be magnified')
            if name=='Fibroblasts': page.locator('.body-atlas-stage').screenshot(path=artifact('inneru-dermis-fibroblast-cell.png'))
        page.locator('[data-dermis-part=""]').click()
        for name in ['Hair follicle','Sweat gland','Sebaceous gland','Arrector pili','Blood vessels','Nerves','Touch receptors','Pressure receptor']:
            check(any(x['part']==name and x['visible'] and x['opacity']==1 for x in state(page)['opacity']), 'whole dermis retains '+name)
        page.locator('#skin-matrix-opacity').fill('0')
        check(all(x['opacity']==0 for x in state(page)['opacity'] if x['shell']), 'matrix control removes the shell to expose internal anatomy')
        page.locator('#skin-matrix-opacity').fill('45')
        check(all(abs(x['opacity']-.45)<.001 for x in state(page)['opacity'] if x['shell']), 'matrix control restores translucent tissue')
        page.locator('[data-dermis-part="Fibroblasts"]').focus();page.keyboard.press('Enter')
        check(state(page)['dermisPart']=='Fibroblasts', 'dermal component controls work with the keyboard')
        reset(page)
        before=alpha(page)
        page.locator('[data-part="Sweat gland"]').click()
        after=alpha(page)
        check(before['opaque']>1000 and after['opaque']<before['opaque']*.25, 'rendered pixels isolate the selected gland')
        check(after['faint']>500, 'rendered pixels include transparent surrounding anatomy')
        page.locator('[data-skin-action="clear"]').click()
        restored=alpha(page)
        check(abs(restored['opaque']/before['opaque']-1)<.08, 'show all restores opaque anatomy')

        for lens, part in [('cells','Epidermis'),('collagen','Dermis'),('follicle','Hair follicle'),('fat','Subcutaneous layer')]:
            page.locator(f'[data-skin-detail="{lens}"]').click();settled(page)
            s=state(page)
            check(s['detail']==lens and s['selection']==part, lens+': detail lens isolates the correct tissue')
            check(math.dist(s['camera'],s['target']) < 3.6, lens+': detail lens magnifies a small anatomical region')
            check('Detail lens' in page.locator('.skin-view-name').text_content(), lens+': visible close-up indicator')
            if lens in ['cells','fat','follicle']:
                page.locator('.body-atlas-stage').screenshot(path=artifact('inneru-skin-detail-'+lens+'.png'))
            page.locator('[data-skin-action="clear"]').click();settled(page)
            check(not state(page)['detail'] and not state(page)['selection'], lens+': show all restores the full context')

        page.locator('[data-skin-action="labels"]').click()
        check(page.locator('.skin-hotspot').count()==0, 'on-model labels can be hidden')
        canvas=page.locator('.skin-explorer canvas');rect=canvas.bounding_box()
        canvas.click(position={'x':rect['width']*.49,'y':rect['height']*.52})
        check(state(page)['selection'] is not None, 'ray picking selects real geometry on the canvas')
        reset(page)
        page.locator('.skin-hotspot', has_text='Sweat gland').click()
        check(state(page)['selection']=='Sweat gland', 'on-model label selects its structure')
        initial_distance=math.dist(state(page)['camera'],state(page)['target'])
        page.locator('[data-skin-action="focus"]').click();settled(page)
        check(math.dist(state(page)['camera'],state(page)['target']) < initial_distance*.9, 'focus moves the camera closer to the selected structure')
        page.locator('[data-skin-action="back"]').click();settled(page)
        check(state(page)['camera'][2] < state(page)['target'][2], 'back view turns behind the anatomy')
        page.locator('[data-skin-action="front"]').click();settled(page)
        check(state(page)['camera'][2] > state(page)['target'][2], 'front view returns in front of the anatomy')
        stage=page.locator('.body-atlas-stage');stage.focus()
        camera_before=state(page)['camera'];stage.press('ArrowRight')
        check(state(page)['camera'] != camera_before, 'keyboard arrows rotate the model')
        distance=math.dist(state(page)['camera'],state(page)['target']);stage.press('+')
        check(math.dist(state(page)['camera'],state(page)['target']) < distance, 'keyboard plus zooms in')

        page.locator('[data-skin-mode="layers"]').click()
        page.locator('#skin-separation').fill('100')
        check(state(page)['layerPositions']['epidermis']>.6 and state(page)['layerPositions']['fat']<-.4, 'slider physically separates the tissue layers')
        page.locator('#skin-separation').fill('0')
        check(all(v==0 for v in state(page)['layerPositions'].values()), 'slider reconnects the tissue layers')

        for route, count in [('cooling',17),('touch',5)]:
            page.locator(f'[data-skin-process="{route}"]').click()
            # Position the viewer directly; animated canvas frames are not a layout-stability assertion.
            page.locator('.body-atlas-stage').evaluate("e=>e.scrollIntoView({behavior:'instant',block:'center'})")
            check(state(page)['process']==route and state(page)['particles']==count, route + ': animated route exists')
            first=state(page)['particlePositions']
            page.wait_for_function('(first)=>JSON.stringify(window.inneruSkinExplorerState().particlePositions)!==JSON.stringify(first)',arg=first)
            check(True, route + ': route markers move through the anatomy')
            page.locator('[data-skin-action="play"]').click()
            paused=state(page)['particlePositions']
            page.wait_for_timeout(180)
            check(state(page)['particlePositions']==paused, route + ': pause stops route motion')
            page.locator('[data-skin-action="play"]').click()
            check(state(page)['playing'], route + ': play resumes motion')
        reset(page)
        check(state(page)['mode']=='cutaway' and not state(page)['selection'] and not state(page)['process'], 'reset clears selection and function route')
        page.locator('[data-skin-action="spin"]').click()
        camera_before=state(page)['camera']
        page.wait_for_function('(before)=>JSON.stringify(window.inneruSkinExplorerState().camera)!==JSON.stringify(before)',arg=camera_before)
        check(state(page)['spin'], 'auto rotate moves the camera')
        reset(page)
        check(not state(page)['spin'], 'reset stops auto rotate')
        check(page.evaluate("localStorage.getItem('bodyquest-v1')")==saved, 'model exploration leaves learning progress unchanged')
        page.locator('[data-skin-mode="cutaway"]').focus();page.keyboard.press('ArrowRight')
        check(state(page)['mode']=='layers' and page.locator('#skin-tab-layers').evaluate('(e)=>e===document.activeElement'), 'keyboard tab navigation changes the view and focus')
        reset(page)
        page.locator('.skin-explorer').screenshot(path=artifact('inneru-skin-desktop.png'))

        page.goto(BASE+'#home')
        page.wait_for_selector('.explore-screen')
        check(page.locator('[data-system]').count()==6, 'leaving the studio restores the six-system home')
        page.wait_for_function('!window.inneruSkinExplorerState')
        check(True, 'leaving the studio disposes its renderer and animation loop')

        mobile=new_context(browser, service_workers='block',viewport={'width':390,'height':844}).new_page()
        ready(mobile)
        check(mobile.locator('.skin-explorer').evaluate('(e)=>e.scrollWidth<=e.clientWidth'), 'mobile studio fits its container')
        for mode in ['layers','glands','sensation']:
            mobile.locator(f'[data-skin-mode="{mode}"]').click()
            mobile.locator('.body-atlas-parts [data-part]:visible').first.click()
            check(bool(state(mobile)['selection']), 'mobile '+mode+': structure controls work')
        reset(mobile)
        mobile.locator('[data-part="Dermis"]').click()
        mobile.locator('[data-dermis-part="Lymphatic vessels"]').click()
        check(state(mobile)['dermisPart']=='Lymphatic vessels', 'mobile dermis component inspection works')
        check(mobile.locator('.skin-dermis-explorer').evaluate('(e)=>e.scrollWidth<=e.clientWidth'), 'mobile dermis controls fit their container')
        reset(mobile)
        mobile.locator('[data-skin-detail="cells"]').click();settled(mobile)
        check(state(mobile)['detail']=='cells', 'mobile cellular close-up works')
        reset(mobile)
        mobile.locator('.skin-explorer').screenshot(path=artifact('inneru-skin-mobile.png'))
        mobile.close()

        reduced_context=new_context(browser, service_workers='block',reduced_motion='reduce')
        reduced_page=reduced_context.new_page()
        ready(reduced_page)
        reduced_page.locator('[data-skin-process="touch"]').click()
        check(not state(reduced_page)['playing'], 'reduced motion uses still route markers by default')
        check(reduced_page.locator('[data-skin-action="play"]').inner_text()=='Play route', 'reduced motion offers an explicit play control')
        reduced_context.close()

        fallback_context=new_context(browser, service_workers='block',)
        fallback_context.add_init_script('HTMLCanvasElement.prototype.getContext=function(){return null}')
        fallback=fallback_context.new_page();fallback.goto(BASE+'#integumentary')
        fallback.wait_for_selector('.skin-fallback',state='visible')
        fallback.locator('[data-part="Sweat gland"]').click()
        check('Evaporation' in fallback.locator('.body-atlas-info').inner_text(), 'non-WebGL fallback retains scientific explanations')
        check(fallback.locator('[data-skin-action="focus"]').is_disabled(), 'fallback disables unavailable 3D controls')
        check(fallback.locator('[data-skin-detail="cells"]').is_disabled(), 'fallback disables unavailable detail zoom')
        fallback.locator('[data-skin-process="touch"]').click()
        check('sensory fiber' in fallback.locator('.body-atlas-info').inner_text(), 'fallback explains the function routes')
        fallback.locator('[data-skin-mode="cutaway"]').click()
        fallback.locator('[data-part="Dermis"]').click()
        fallback.locator('[data-dermis-part="Lymphatic vessels"]').click()
        check('Blind-ended' in fallback.locator('.body-atlas-info').inner_text(), 'fallback retains dermal component explanations')
        check(fallback.locator('#skin-matrix-opacity').is_disabled(), 'fallback disables unavailable matrix rendering control')
        fallback_context.close()
        check(not errors, 'no JavaScript or shader errors: '+json.dumps(errors))
        browser.close()
finally:
    proc.terminate();proc.wait(timeout=10)

print(f'{checks} skin studio checks passed.',flush=True)
