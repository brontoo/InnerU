import * as THREE from './assets/three/three.module.js';
import {GLTFLoader} from './assets/three/GLTFLoader.js';
import {OrbitControls} from './assets/three/OrbitControls.js';

// Share the successful parse; each mounted view owns/disposes its GPU resources.
let asset;
function anatomy(){
 if(!asset)asset=new GLTFLoader().loadAsync('./assets/muscular/rotational-atlas.glb').catch(error=>{asset=null;throw error;});
 return asset;
}
export async function mountMuscleRotator(root){
 const stage=root.querySelector('.muscle-rotator-stage'),abort=new AbortController(),signal=abort.signal;
 const tr=s=>window.InneruLocale?.t(s)||s,on=(el,event,fn)=>el.addEventListener(event,fn,{signal});
 const media=matchMedia('(prefers-reduced-motion: reduce)'),reduced=()=>media.matches||document.body.classList.contains('motionoff');
 let renderer,controls,model,resize,intersection,mutation,frame=0,disposed=false,visible=true,previous=0,texture;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.01,30);
 const spin=root.querySelector('[data-muscle-spin]'),status=root.querySelector('.muscle-rotator-status');
 const meshes=[],materials=[],textures=[];
 const label=root.querySelector('.muscle-rotator-label');
 let selected=null,labels=root.querySelector('[data-muscle-labels]').getAttribute('aria-pressed')==='true',focused=false,fullMin=.8,fullMax=8;
 function updateLabel(){
  if(!selected||!labels){label.hidden=true;return;}
  const point=new THREE.Vector3(...selected.point),normal=new THREE.Vector3(...(selected.view==='back'?[0,0,-1]:selected.view==='side'?[1,0,0]:[0,0,1]));
  const facing=camera.position.clone().sub(controls.target).normalize().dot(normal);
  point.project(camera);label.hidden=facing<.1||point.z>1||Math.abs(point.x)>1||Math.abs(point.y)>1;
  if(label.hidden)return;
  const text=tr(selected.name);if(label.textContent!==text)label.textContent=text;
  const half=label.offsetWidth/2+10;
  label.style.left=THREE.MathUtils.clamp((point.x+1)*stage.clientWidth/2,half,stage.clientWidth-half)+'px';
  label.style.top=THREE.MathUtils.clamp((1-point.y)*stage.clientHeight/2,label.offsetHeight*1.15+10,stage.clientHeight-10)+'px';
 }
 function dispose(){
  if(disposed)return;disposed=true;abort.abort();cancelAnimationFrame(frame);frame=0;
  resize?.disconnect();intersection?.disconnect();mutation?.disconnect();controls?.dispose();
  for(const mesh of meshes)mesh.geometry.dispose();for(const material of materials)material.dispose();for(const item of textures)item.dispose();
  renderer?.dispose();renderer?.domElement.remove();delete root.dataset.muscleReady;
  label.hidden=true;
  root.querySelector('.muscle-rotator-controls').hidden=true;stage.tabIndex=-1;
  if(window.__inneruMuscleRotator?.root===root)window.__inneruMuscleRotator=null;
 }
 function request(){if(!disposed&&visible&&!document.hidden&&!frame)frame=requestAnimationFrame(draw);}
 function draw(now){
  frame=0;if(disposed||!visible||document.hidden||!model)return;
  const moved=controls.update(Math.min(.05,previous?(now-previous)/1000:1/60));previous=now;
  renderer.render(scene,camera);
  updateLabel();
  if(controls.autoRotate||moved)request();
 }
 function setSpin(value){controls.autoRotate=!!value&&!reduced();spin.setAttribute('aria-pressed',String(controls.autoRotate));request();}
 function active(name){root.querySelectorAll('[data-muscle-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.muscleView===name)));}
 let distance=3;
 function view(name){
  setSpin(false);const theta={front:0,back:Math.PI,side:Math.PI/2}[name]??0;
  focused=false;controls.minDistance=fullMin;controls.maxDistance=fullMax;
  controls.enableDamping=false;controls.target.set(0,0,0);camera.position.set(Math.sin(theta)*distance,0,Math.cos(theta)*distance);controls.update();active(name);request();
 }
 function focus(){
  if(!selected)return;setSpin(false);focused=true;
  const theta={front:0,back:Math.PI,side:Math.PI/2}[selected.view],span=selected.span;
  const width=selected.view==='side'?span[2]:span[0];
  const close=Math.max(.18,Math.max(span[1],width/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(16)))*1.3);
  controls.minDistance=.1;controls.maxDistance=fullMax;controls.target.set(...selected.point);
  camera.position.copy(controls.target).add(new THREE.Vector3(Math.sin(theta)*close,0,Math.cos(theta)*close));
  controls.update();active('');request();
 }
 function turn(sign){
  setSpin(false);const offset=camera.position.clone().sub(controls.target),polar=new THREE.Spherical().setFromVector3(offset);
  polar.theta+=sign*Math.PI/12;camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(polar));controls.update();active('');request();
 }
 function zoom(sign){
  const offset=camera.position.clone().sub(controls.target),length=THREE.MathUtils.clamp(offset.length()*(sign>0?.85:1/.85),controls.minDistance,controls.maxDistance);
  camera.position.copy(controls.target).add(offset.setLength(length));controls.update();request();
 }
 try{
  if(!window.WebGLRenderingContext)throw new Error('WebGL unavailable');
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(Math.max(1,stage.clientWidth),Math.max(1,stage.clientHeight));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  renderer.domElement.setAttribute('aria-hidden','true');
  controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=false;controls.autoRotate=false;controls.autoRotateSpeed=.75;
  controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI-.3;
  let timeout;const gltf=await Promise.race([anatomy(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Model download timed out')),45000);})]).finally(()=>clearTimeout(timeout));if(!root.isConnected)throw new Error('Route left before the model was ready');
  model=gltf.scene.clone(true);
  // Subtle directional surface shading suggests fibres; the geometry remains the source atlas.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const context=canvas.getContext('2d'),pixels=context.createImageData(128,128);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++){
   const grey=Math.round(128+23*Math.sin(x*Math.PI/16+.15*Math.sin(y*Math.PI/64)));
   const i=(y*128+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=grey;pixels.data[i+3]=255;
  }
  context.putImageData(pixels,0,0);texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(200,200);textures.push(texture);
  model.traverse(mesh=>{
   if(!mesh.isMesh)return;
   mesh.geometry=mesh.geometry.clone();mesh.material=mesh.material.clone();materials.push(mesh.material);meshes.push(mesh);
   if(mesh.name.startsWith('Muscle_tissue')||mesh.name.startsWith('Muscle tissue')){mesh.material.bumpMap=texture;mesh.material.bumpScale=.00055;mesh.material.roughness=.66;}
  });
  scene.add(model);
  scene.add(new THREE.HemisphereLight(0xfff7eb,0x747c78,1.1));
  for(const [x,y,z,color,intensity] of [[-3,4,5,0xfff3e5,2.0],[3,1,3,0xffffff,.8],[1,3,-4,0xe9f6f3,1.5]]){
   const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
  }
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());
  const midpoint=box.getCenter(new THREE.Vector3());model.position.sub(midpoint);
  function fit(){
   const width=Math.max(1,stage.clientWidth),height=Math.max(1,stage.clientHeight);camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);
   distance=Math.max(size.y/(2*Math.tan(THREE.MathUtils.degToRad(16))),size.x/(2*Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect))*1.12;
   fullMin=size.y*.55;fullMax=distance*2.5;controls.minDistance=focused ? .1 : fullMin;controls.maxDistance=fullMax;
  }
  fit();view('front');stage.prepend(renderer.domElement);
  on(controls,'change',request);on(controls,'start',()=>{setSpin(false);active('');});
  on(stage,'keydown',event=>{
   if(event.target!==stage)return;let handled=true;
   if(event.key==='ArrowLeft')turn(-1);else if(event.key==='ArrowRight')turn(1);
   else if(event.key==='+'||event.key==='=')zoom(1);else if(event.key==='-')zoom(-1);
   else if(event.key==='Home')view('front');else handled=false;
   if(handled)event.preventDefault();
  });
  root.querySelectorAll('[data-muscle-view]').forEach(b=>on(b,'click',()=>view(b.dataset.muscleView)));
  root.querySelectorAll('[data-muscle-turn]').forEach(b=>on(b,'click',()=>turn(b.dataset.muscleTurn==='left'?-1:1)));
  root.querySelectorAll('[data-muscle-zoom]').forEach(b=>on(b,'click',()=>zoom(b.dataset.muscleZoom==='in'?1:-1)));
  on(root.querySelector('[data-muscle-reset]'),'click',()=>view('front'));on(spin,'click',()=>setSpin(!controls.autoRotate));
  on(root,'muscle-rotator-selection',event=>{selected=event.detail;view(selected?.view||'front');});
  on(root.querySelector('[data-muscle-focus]'),'click',focus);
  on(root.querySelector('[data-muscle-labels]'),'click',()=>{labels=!labels;root.querySelector('[data-muscle-labels]').setAttribute('aria-pressed',String(labels));request();});
  on(document,'inneru-language-ready',request);
  function motion(){if(reduced())setSpin(false);spin.disabled=reduced();spin.title=reduced()?tr('Automatic rotation is off while reduced motion is enabled.'):tr('Auto rotate');}
  motion();on(media,'change',motion);on(document,'inneru-preferences-change',motion);on(document,'inneru-language-ready',motion);
  const motionObserver=new MutationObserver(motion);motionObserver.observe(document.body,{attributes:true,attributeFilter:['class']});signal.addEventListener('abort',()=>motionObserver.disconnect(),{once:true});
  resize=new ResizeObserver(()=>{const offset=camera.position.clone().sub(controls.target),old=distance;fit();camera.position.copy(controls.target).add(offset.multiplyScalar(distance/old));controls.update();renderer.render(scene,camera);updateLabel();request();});resize.observe(stage);
  intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){previous=0;request();}else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'50px'});intersection.observe(stage);
  on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else{previous=0;request();}});
  on(renderer.domElement,'webglcontextlost',event=>{event.preventDefault();dispose();status.textContent=tr('The 3D view stopped. The anatomy illustration remains available. Try opening the model again.');root.dispatchEvent(new Event('muscle-rotator-unavailable'));});
  mutation=new MutationObserver(()=>{if(!root.isConnected)dispose();});mutation.observe(document.getElementById('app'),{childList:true,subtree:true});
  window.__inneruMuscleRotator={root,renderer,camera,controls,model,state:()=>({ready:!disposed,visible,autoRotate:controls.autoRotate,frames:renderer.info.render.frame,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
  request();return{dispose};
 }catch(error){dispose();throw error;}
}
