import * as THREE from './assets/three/three.module.js';
import {OrbitControls} from './assets/three/OrbitControls.js';
import {createMuscleModel} from './muscle-model.js?v=muscle-studio-1';

const {parts,tabs}=window.InnerUMuscleAtlas;
let disposeCurrent=()=>{};
const REGION_BOX={neck:[[-.23,.99,-.23],[.23,1.59,.30]],arms:[[-.70,-.22,-.28],[.70,1.04,.36]],core:[[-.40,.1,-.27],[.40,1.03,.36]],back:[[-.40,.08,-.30],[.40,1.30,.30]],legs:[[-.42,-1.87,-.34],[.42,.19,.36]]};
const REGION_LABELS={all:['deltoid','pectoralis','biceps','rectus','rectus-femoris','tibialis'],neck:['neck'],arms:['deltoid','biceps','triceps','flexors','extensors'],core:['pectoralis','serratus','rectus','oblique'],back:['trapezius','latissimus','erectors'],legs:['rectus-femoris','vastus-lateralis','vastus-medialis','hamstrings','gastrocnemius','tibialis']};

export function mountMuscleExplorer(root){
  disposeCurrent();if(!root?.isConnected)return;
  const stage=root.querySelector('.muscle-studio-stage'),info=root.querySelector('.muscle-studio-info'),status=root.querySelector('.muscle-studio-status'),badge=root.querySelector('.muscle-studio-selected');
  const abort=new AbortController(),signal=abort.signal,reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>reducedQuery.matches||document.body.classList.contains('motionoff');
  let model,renderer,scene,camera,controls,resize,visibilityObserver,mutation,frame=0,disposed=false,visible=true,region='all',selection=null,labels=true,spin=false,needsRender=true,cameraGoal=null,lastFrame=0,loadingTimer,loading=false;
  let labelButtons=[],seen=new Set(),viewName='anterior',loadObserver,lastTick=0;
  const ghost=new THREE.MeshBasicMaterial({color:0x647c7b,transparent:true,opacity:.055,depthWrite:false,side:THREE.FrontSide});
  const baseGhost=new THREE.MeshBasicMaterial({color:0x758884,transparent:true,opacity:.025,depthWrite:false,side:THREE.FrontSide});
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const on=(el,type,handler,options={})=>el?.addEventListener(type,handler,{...options,signal});
  const find=id=>parts.find(p=>p.id===id);
  function boundsFor(id){const b=new THREE.Box3();if(id==='gluteal'){model.garments.forEach(m=>b.expandByObject(m));return b;}model.meshes.filter(m=>m.userData.structure===id).forEach(m=>b.expandByObject(m));return b;}
  function regionBounds(){if(region==='all')return model.bounds.clone();const [min,max]=REGION_BOX[region];return new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max));}
  function frameBox(box,side='front',close=false){
    if(!camera||box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),tan=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
    const distance=Math.max(size.y/(tan*2),size.x/(tan*2*camera.aspect))*1.14+size.z*.30;
    // A mostly straight-on teaching view keeps right/left and attachments clear.
    const direction=new THREE.Vector3(side==='back'?-.08:.07,.035,side==='back'?-1:1).normalize();
    cameraGoal={target:center,position:center.clone().add(direction.multiplyScalar(Math.max(close?.76:1.05,distance)))};
    if(reduced()){camera.position.copy(cameraGoal.position);controls.target.copy(cameraGoal.target);cameraGoal=null;controls.update();}
    viewName=side==='back'?'posterior':'anterior';updateViewName();needsRender=true;
  }
  function updateViewName(){
    if(camera&&controls){const v=camera.position.clone().sub(controls.target);viewName=Math.abs(v.z)<Math.abs(v.x)*.70?(v.x>0?'left lateral':'right lateral'):v.z>0?'anterior':'posterior';}
    const element=root.querySelector('.muscle-studio-view'),text=(selection?find(selection).name:tabs.find(t=>t.id===region).name)+' · '+viewName+' view';
    if((window.InneruLocale?InneruLocale.source(element):element.textContent)!==text)element.textContent=text;
  }
  function applyVisual(){
    if(!model)return;
    for(const mesh of model.meshes){
      const p=find(mesh.userData.structure),active=selection?mesh.userData.structure===selection:region==='all'||p?.region===region;
      mesh.material=active?mesh.userData.originalMaterial:ghost;mesh.castShadow=active;mesh.renderOrder=active?3:0;
      if(active){mesh.material.userData.baseColor||=mesh.material.color.clone();mesh.material.color.copy(selection?new THREE.Color(0x4b9989):mesh.material.userData.baseColor);mesh.material.emissive.setHex(selection?0x134f46:0);mesh.material.emissiveIntensity=selection?.13:0;}
    }
    model.baseMeshes.forEach(m=>{m.userData.originalMaterial||=m.material;m.material=selection||region!=='all'?baseGhost:m.userData.originalMaterial;});
    // Garments are intentionally excluded from the anatomy fade. They write
    // depth and stay opaque, including in covered-region selection and zoom.
    for(const m of model.garments){m.material.transparent=false;m.material.opacity=1;m.material.depthWrite=true;m.material.userData.baseColor||=m.material.color.clone();m.material.color.copy(selection==='gluteal'?new THREE.Color(0x448f83):m.material.userData.baseColor);m.material.emissive.setHex(selection==='gluteal'?0x185c57:0);m.material.emissiveIntensity=selection==='gluteal'?.15:0;}
    needsRender=true;updateLabels();
  }
  function explain(){
    const part=find(selection);
    root.querySelectorAll('[data-muscle-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.musclePart===selection)));
    badge.hidden=!part;badge.textContent=part?(part.id==='gluteal'?'Covered region · ':'Selected · ')+part.name:'';
    root.querySelector('[data-muscle-action="clear"]').disabled=!selection&&region==='all';
    root.querySelector('[data-muscle-action="focus"]').disabled=!selection||!model||!renderer;
    root.querySelector('.muscle-studio-count').textContent=seen.size;root.querySelector('progress').value=seen.size;
    if(part)info.innerHTML=`<span class="muscle-info-kicker">${part.location}</span><h3>${part.name}</h3><p>${part.action}</p><div class="muscle-info-example"><b>In everyday movement</b><p>${part.example}</p></div><details><summary>Follow the attachments</summary><p>${part.attachments}</p></details>${part.id==='gluteal'?'<p class="muscle-info-covered">The teal shorts mark the covered hip region. Shorts remain on while you explore its function.</p>':''}${model?'<button type="button" class="muscle-studio-reveal" data-muscle-reveal>View selected muscle ↑</button>':''}`;
    else info.innerHTML=`<span class="muscle-info-kicker">${tabs.find(t=>t.id===region).name.toUpperCase()} · SHAPE & FUNCTION</span><h3>Choose a muscle to begin.</h3><p>${tabs.find(t=>t.id===region).tip}</p><div class="muscle-info-example"><b>Look for a pair</b><p>${region==='legs'?'Quadriceps straighten the knee; hamstrings bend it.':region==='back'?'Trapezius positions the shoulder blade; latissimus dorsi moves the upper arm.':region==='neck'?'Compare the right and left sides of the neck as you rotate.':'Biceps bends the elbow; triceps straightens it.'}</p></div>`;
    stage.setAttribute('aria-label',part?`${part.name} selected. ${part.id==='gluteal'?'The hip region stays covered.':'Other muscles are transparent.'} Arrow keys rotate; plus and minus zoom.`:'Rotatable muscular anatomy. Arrow keys rotate; plus and minus zoom. Choose a muscle using the named buttons.');
    updateViewName();
  }
  function stopSpin(){spin=false;if(controls)controls.autoRotate=false;root.querySelector('[data-muscle-action="spin"]').setAttribute('aria-pressed','false');}
  function select(id){
    const p=find(id);if(!p)return;stopSpin();selection=id;seen.add(id);applyVisual();explain();
    if(model)frameBox(boundsFor(id),p.view,true);
    status.textContent=p.id==='gluteal'?'Gluteus maximus selected. The highlighted hip region stays covered by shorts.':`${p.name} highlighted in teal. Other muscles are transparent. ${p.action}`;
    const button=root.querySelector(`[data-muscle-part="${id}"]`);if(button?.hidden){setRegion(p.region,false);selection=id;applyVisual();explain();}
  }
  function setRegion(id,frameView=true){
    region=id;selection=null;stopSpin();
    root.querySelectorAll('[data-muscle-region]').forEach(b=>{const active=b.dataset.muscleRegion===id;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
    root.querySelector('#muscle-region-panel').setAttribute('aria-labelledby','muscle-tab-'+id);
    root.querySelectorAll('[data-muscle-part]').forEach(b=>b.hidden=id!=='all'&&find(b.dataset.musclePart).region!==id);
    root.querySelector('.muscle-studio-tip').textContent=tabs.find(t=>t.id===id).tip;
    applyVisual();explain();if(model&&frameView)frameBox(regionBounds(),id==='back'?'back':'front');
    status.textContent=tabs.find(t=>t.id===id).name+' anatomy. '+tabs.find(t=>t.id===id).tip;
  }
  function zoom(factor){if(!camera)return;cameraGoal=null;const d=camera.position.clone().sub(controls.target).multiplyScalar(factor);d.clampLength(controls.minDistance,controls.maxDistance);camera.position.copy(controls.target.clone().add(d));controls.update();needsRender=true;}
  function action(id){
    if(id==='clear'){setRegion('all');return;}
    if(id==='reset'){labels=true;root.querySelector('[data-muscle-action="labels"]').setAttribute('aria-pressed','true');setRegion('all');return;}
    if(id==='labels'){labels=!labels;root.querySelector('[data-muscle-action="labels"]').setAttribute('aria-pressed',String(labels));updateLabels();needsRender=true;return;}
    if(!camera||!model)return;
    if(id==='spin'){
      spin=!spin;controls.autoRotate=spin;root.querySelector('[data-muscle-action="spin"]').setAttribute('aria-pressed',String(spin));cameraGoal=null;status.textContent=spin?'Automatic rotation on. Choose Auto rotate again to pause.':'Automatic rotation paused.';needsRender=true;
    }else if(id==='in'||id==='out')zoom(id==='in'?.8:1.25);
    else if(id==='focus'&&selection)frameBox(boundsFor(selection),find(selection).view,true);
    else if(id==='front'||id==='back'){stopSpin();frameBox(selection?boundsFor(selection):regionBounds(),id,!!selection);}
  }
  root.querySelectorAll('[data-muscle-part]').forEach(b=>on(b,'click',()=>select(b.dataset.musclePart)));
  const tabButtons=[...root.querySelectorAll('[data-muscle-region]')];
  tabButtons.forEach((b,i)=>{
    on(b,'click',()=>setRegion(b.dataset.muscleRegion));
    on(b,'keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabButtons.length;else if(e.key==='ArrowLeft')n=(i+tabButtons.length-1)%tabButtons.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabButtons.length-1;else return;e.preventDefault();tabButtons[n].focus();setRegion(tabButtons[n].dataset.muscleRegion);});
  });
  root.querySelectorAll('[data-muscle-action]').forEach(b=>{on(b,'click',()=>action(b.dataset.muscleAction));if(stage.contains(b))on(b,'pointerdown',e=>e.stopPropagation());});
  on(info,'click',e=>{if(!e.target.closest('[data-muscle-reveal]'))return;stage.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});stage.focus({preventScroll:true});});
  on(stage,'keydown',e=>{
    if(e.target!==stage||!camera)return;
    if(['+','=','-'].includes(e.key)){e.preventDefault();zoom(e.key==='-'?1.25:.8);return;}
    const direction=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(direction);
    if(e.key==='ArrowLeft')s.theta+=.15;else if(e.key==='ArrowRight')s.theta-=.15;else if(e.key==='ArrowUp')s.phi=Math.max(.3,s.phi-.12);else if(e.key==='ArrowDown')s.phi=Math.min(Math.PI-.3,s.phi+.12);else return;
    e.preventDefault();stopSpin();cameraGoal=null;camera.position.copy(controls.target.clone().add(direction.setFromSpherical(s)));controls.update();needsRender=true;
  });
  let down=null;
  on(stage,'pointerdown',e=>{if(e.target.closest('button'))return;cameraGoal=null;stopSpin();down={x:e.clientX,y:e.clientY,id:e.pointerId};});
  on(stage,'pointercancel',()=>down=null);
  on(stage,'pointerup',e=>{
    const start=down;down=null;if(!start||e.pointerId!==start.id||!model||e.target.closest('button')||Math.hypot(start.x-e.clientX,start.y-e.clientY)>7)return;
    const rect=stage.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);
    const hits=ray.intersectObjects([...model.garments,...model.decorations,...model.meshes],false);
    // Clothing and the mannequin's smooth face/hands/feet occlude hidden anatomy.
    const first=hits.find(h=>h.object.userData.garment||model.decorations.includes(h.object)||h.object.material!==ghost);
    if(!first||model.decorations.includes(first.object))return;
    if(first.object.userData.garment){if(first.point.y>-.32)select('gluteal');return;}
    select(first.object.userData.structure);
  });
  on(stage,'wheel',()=>{cameraGoal=null;stopSpin();},{passive:true});
  function initLabels(){
    const layer=root.querySelector('.muscle-studio-labels');
    for(const p of parts){
      const box=boundsFor(p.id),center=box.getCenter(new THREE.Vector3());
      // Label one side of paired anatomy, keeping the middle of the body clear.
      const candidates=model.meshes.filter(m=>m.userData.structure===p.id);let best;
      for(const m of candidates){const b=new THREE.Box3().setFromObject(m),c=b.getCenter(new THREE.Vector3());if(!best||c.x<best.center.x)best={box:b,center:c};}
      const anchor=best?best.center.clone():center.clone();anchor.z=p.view==='back'?(best?.box.min.z??box.min.z)-.012:(best?.box.max.z??box.max.z)+.012;
      if(p.id==='gluteal')anchor.set(-.18,-.12,-.29);
      const button=document.createElement('button');button.type='button';button.textContent=p.name;button.className='muscle-studio-label';button.setAttribute('aria-label','Examine '+p.name);button.hidden=true;on(button,'pointerdown',e=>e.stopPropagation());on(button,'click',()=>select(p.id));layer.append(button);labelButtons.push({p,button,anchor});
    }
  }
  function updateLabels(){
    if(!camera||!model)return;
    const occupied=[];
    for(const {p,button,anchor} of labelButtons){
      const facing=p.view==='back'?camera.position.z<-.1:camera.position.z>.1;
      const show=labels&&facing&&(selection?selection===p.id:REGION_LABELS[region].includes(p.id));
      button.hidden=!show;if(!show)continue;
      const v=anchor.clone().project(camera),x=(v.x*.5+.5)*stage.clientWidth,y=(-v.y*.5+.5)*stage.clientHeight;
      const blocked=occupied.some(r=>Math.abs(r.x-x)<125&&Math.abs(r.y-y)<38);
      if(v.z>1||v.z<0||x<30||x>stage.clientWidth-30||y<55||y>stage.clientHeight-65||blocked){button.hidden=true;continue;}
      occupied.push({x,y});button.style.left=x+'px';button.style.top=y+'px';button.setAttribute('aria-pressed',String(selection===p.id));
    }
  }
  function unavailable(){
    root.querySelector('.muscle-studio-loading')?.remove();root.querySelector('.muscle-studio-fallback').hidden=false;root.querySelector('.muscle-studio-unavailable').hidden=false;
    root.querySelectorAll('[data-muscle-action]').forEach(b=>{if(!['clear','reset'].includes(b.dataset.muscleAction))b.disabled=true;});
    stage.tabIndex=-1;stage.setAttribute('aria-label','Static front-view muscular anatomy illustration. Use the tabs and named structure buttons to explore.');
    status.textContent='3D is unavailable. All anatomy tabs and muscle descriptions remain available.';
  }
  function stopRendering(){cancelAnimationFrame(frame);frame=0;lastTick=0;}
  function render(now=0){
    frame=0;if(disposed||!renderer||!visible||document.hidden)return;
    // A user may explicitly request spin with reduced motion, but changing
    // either motion preference stops any ongoing automatic movement.
    const delta=lastTick?Math.min(.25,(now-lastTick)/1000):1/60;lastTick=now;
    const changed=controls.update(delta);
    if(cameraGoal){camera.position.lerp(cameraGoal.position,.17);controls.target.lerp(cameraGoal.target,.17);if(camera.position.distanceTo(cameraGoal.position)<.008&&controls.target.distanceTo(cameraGoal.target)<.008){camera.position.copy(cameraGoal.position);controls.target.copy(cameraGoal.target);cameraGoal=null;}needsRender=true;}
    if(needsRender||changed||spin){if(!lastFrame||now-lastFrame>30||!spin){camera.updateMatrixWorld();updateViewName();updateLabels();renderer.render(scene,camera);lastFrame=now;needsRender=false;}}
    frame=requestAnimationFrame(render);
  }
  function resume(){needsRender=true;if(!frame&&!disposed&&visible&&!document.hidden&&renderer)frame=requestAnimationFrame(render);}
  function motionChanged(){if(controls)controls.enableDamping=!reduced();if(reduced()){stopSpin();if(cameraGoal){camera.position.copy(cameraGoal.position);controls.target.copy(cameraGoal.target);cameraGoal=null;controls.update();}}resume();}
  on(reducedQuery,'change',motionChanged);
  on(document,'visibilitychange',()=>{if(document.hidden)stopRendering();else resume();});
  function disposeRenderer(){stopRendering();resize?.disconnect();controls?.dispose();renderer?.dispose();renderer?.domElement.remove();renderer=null;model?.dispose();model=null;scene?.traverse(o=>{if(o.userData.studioGround){o.geometry.dispose();o.material.dispose();}});}
  function cleanup(){if(disposed)return;disposed=true;abort.abort();clearTimeout(loadingTimer);stopRendering();loadObserver?.disconnect();visibilityObserver?.disconnect();mutation?.disconnect();ghost.dispose();baseGhost.dispose();disposeRenderer();labelButtons.forEach(l=>l.button.remove());if(window.__inneruMuscleStudio?.root===root)window.__inneruMuscleStudio=null;}
  disposeCurrent=cleanup;
  const live={root,get model(){return model},get camera(){return camera},get controls(){return controls},get renderer(){return renderer},get disposed(){return disposed},
    state:()=>({canvas:!!renderer,structures:parts.map(p=>p.id),region,selection,explored:seen.size,spin,labels,transitioning:!!cameraGoal,frames:renderer?.info.render.frame??0,drawCalls:renderer?.info.render.calls??0,triangles:renderer?.info.render.triangles??0,
      camera:camera?.position.toArray(),target:controls?.target.toArray(),visible,disposed,
      garmentOpaque:model?.garments.every(m=>m.material.opacity===1&&!m.material.transparent&&m.material.depthWrite),
      focused:model?.meshes.filter(m=>m.material!==ghost).map(m=>m.userData.structure),faded:model?.meshes.filter(m=>m.material===ghost).length??0,
      garmentBounds:model?new THREE.Box3().setFromObject(model.garments[0]).min.toArray().concat(new THREE.Box3().setFromObject(model.garments[0]).max.toArray()):null,
    }),draw:()=>{if(renderer&&camera)renderer.render(scene,camera)},select,
  };
  window.__inneruMuscleStudio=live;
  window.inneruMuscleExplorerState=()=>window.__inneruMuscleStudio?.state()??null;
  mutation=new MutationObserver(()=>{if(!root.isConnected)cleanup();else motionChanged();});mutation.observe(document.getElementById('app'),{childList:true});
  // The global accessibility setting changes a class without replacing #app.
  const motionObserver=new MutationObserver(motionChanged);motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});signal.addEventListener('abort',()=>motionObserver.disconnect(),{once:true});
  async function load(){
    if(loading||disposed)return;loading=true;
    try{
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(stage.clientWidth,stage.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
      renderer.domElement.setAttribute('aria-hidden','true');stage.prepend(renderer.domElement);
      on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();disposeRenderer();unavailable();});
      scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,stage.clientWidth/stage.clientHeight,.025,35);
      camera.position.set(.18,-.12,6.5);controls=new OrbitControls(camera,stage);controls.enablePan=false;controls.enableDamping=!reduced();controls.dampingFactor=.1;controls.minDistance=.62;controls.maxDistance=10;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI-.35;controls.autoRotateSpeed=.8;controls.target.set(0,-.12,0);controls.update();
      scene.add(new THREE.HemisphereLight(0xfff8eb,0x667f7d,2));
      const key=new THREE.DirectionalLight(0xffead7,2.5);key.position.set(-3,5,5);scene.add(key);
      const fill=new THREE.DirectionalLight(0xf2fffc,1.4);fill.position.set(4,1,3);scene.add(fill);
      const rim=new THREE.DirectionalLight(0xb5e3df,1.5);rim.position.set(-2,3,-4);scene.add(rim);
      loadingTimer=setTimeout(()=>{const el=root.querySelector('.muscle-studio-loading');if(el)el.textContent='Still preparing the model. You can explore the muscle descriptions now.';},12000);
      const built=await createMuscleModel();if(disposed){built.dispose();return;}model=built;scene.add(model.group);
      const missing=parts.filter(p=>!model.meshes.some(m=>m.userData.structure===p.id));if(missing.length)throw new Error('Missing muscle structures: '+missing.map(p=>p.id).join(', '));
      // Soft radial shadow below the feet, baked locally rather than moving
      // heavy shadow maps on every rotation.
      const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,8,64,64,64);gradient.addColorStop(0,'rgba(41,70,65,.18)');gradient.addColorStop(1,'rgba(41,70,65,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(canvas);
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.8),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-1.87,.02);ground.userData.studioGround=true;scene.add(ground);signal.addEventListener('abort',()=>shadowTexture.dispose(),{once:true});
      clearTimeout(loadingTimer);root.querySelector('.muscle-studio-loading')?.remove();initLabels();applyVisual();explain();frameBox(selection?boundsFor(selection):regionBounds(),selection?find(selection).view:region==='back'?'back':'front',!!selection);
      resize=new ResizeObserver(()=>{if(!renderer||disposed)return;const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);frameBox(selection?boundsFor(selection):regionBounds(),viewName==='posterior'?'back':'front',!!selection);resume();});resize.observe(stage);
      visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else stopRendering();},{rootMargin:'80px'});visibilityObserver.observe(stage);resume();
    }catch(e){if(disposed)return;console.error('Muscular anatomy:',e);clearTimeout(loadingTimer);disposeRenderer();unavailable();}
  }
  explain();
  if(!window.WebGLRenderingContext){unavailable();return;}
  loadObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){loadObserver.disconnect();load();}},{rootMargin:'300px'});loadObserver.observe(stage);
}
