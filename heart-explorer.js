import * as THREE from './assets/three/three.module.js';
import {GLTFLoader} from './assets/three/GLTFLoader.js';
import {OrbitControls} from './assets/three/OrbitControls.js';

const facts={
  aorta:{title:'Aorta',names:['Aorta'],point:[.08,.75,.12],view:'anterior',description:'The aorta is the body’s largest artery. It carries oxygen-rich blood from the left ventricle to the systemic circulation.',from:'Left ventricle',to:'Body tissues',blood:'Oxygen-rich',direction:'Away from the heart'},
  superior:{title:'Superior vena cava',names:['Superior vena cava'],point:[-.24,.75,-.03],view:'anterior',description:'The superior vena cava returns oxygen-poor blood from the upper body to the right atrium.',from:'Upper body',to:'Right atrium',blood:'Oxygen-poor',direction:'Toward the heart'},
  inferior:{title:'Inferior vena cava',names:['Inferior vena cava'],point:[-.23,-.39,-.03],view:'posterior',description:'The inferior vena cava returns oxygen-poor blood from the lower body to the right atrium.',from:'Lower body',to:'Right atrium',blood:'Oxygen-poor',direction:'Toward the heart'},
  arteries:{title:'Pulmonary arteries',names:['Pulmonary trunk','Left pulmonary artery','Right pulmonary artery'],point:[.28,.43,.30],view:'anterior',description:'The pulmonary arteries carry oxygen-poor blood from the right ventricle toward the lungs.',from:'Right ventricle through the pulmonary trunk',to:'Lungs',blood:'Oxygen-poor',direction:'Away from the heart'},
  veins:{title:'Pulmonary veins',names:['Left pulmonary veins','Right pulmonary veins'],point:[.38,.28,-.30],view:'posterior',description:'The pulmonary veins return oxygen-rich blood from the lungs to the left atrium.',from:'Lungs',to:'Left atrium',blood:'Oxygen-rich',direction:'Toward the heart'},
  coronary:{title:'Coronary vessels',names:['Coronary arteries','Coronary veins'],point:[.37,-.25,.40],view:'anterior',description:'Coronary arteries supply the heart muscle with oxygen and nutrients; coronary veins return oxygen-poor blood.',from:'Aorta and heart muscle',to:'Heart muscle and right atrium',blood:'Oxygen-rich in arteries; oxygen-poor in veins',direction:'Arteries away from the aorta; veins toward the heart'}
};
const viewAngles={anterior:[.38,1.18],posterior:[Math.PI+.22,1.35],left:[Math.PI/2,1.28],right:[-Math.PI/2,1.28]};
const V=a=>new THREE.Vector3(...a);

window.initHeartExplorer=function(signal){
  const host=document.getElementById('heart-canvas');if(!host)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  /* Honour both the operating-system setting and the in-app "Reduce motion" checkbox. */
  const motionOff=()=>reduced.matches||(typeof state!=='undefined'&&!!state.motion);
  const status=document.getElementById('heart-error');
  const seen=new Set((circProgress().heartExplored||[]).filter(x=>facts[x]));
  const buttons=[...document.querySelectorAll('[data-vessel-focus]')];
  const count=document.getElementById('circ-vessel-count');
  function syncSeen(){if(count)count.textContent=seen.size===6?'Heart Network Mapped — 6/6':`${seen.size}/6 explored`;buttons.forEach(b=>b.classList.toggle('explored',seen.has(b.dataset.vesselFocus)))}
  syncSeen();
  let renderer,scene,camera,controls,heart,frame,observer,resize,active=null,spin=false,beat=false,flow=false,playing=true,route='both',speed=1,elapsed=0,last=0,particles=[];
  const ray=new THREE.Raycaster(),projected=new THREE.Vector3();
  const fallback=()=>{if(status)status.hidden=false;host.querySelector('#heart-loading')?.remove();const flowSettings=document.getElementById('circ-flow-settings');if(flowSettings)flowSettings.hidden=false;};
  function info(key){const f=facts[key],box=document.getElementById('circ-vessel-info');if(!box)return;box.innerHTML=`<b>${f.title}</b><span>${f.description}</span><span><strong>From:</strong> ${f.from} · <strong>To:</strong> ${f.to}</span><small>${f.blood} · ${f.direction}</small>`;}
  function select(key){
    active=key;info(key);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.vesselFocus===key)));
    if(!seen.has(key)){seen.add(key);const progress=circProgress();progress.heartExplored=[...seen];save();circStep('heart-discovery-'+key,10);syncSeen()}
    if(heart){heart.traverse(o=>{if(!o.isMesh||o.userData.flowParticle)return;const selected=facts[key].names.some(n=>o.name.startsWith(n+' —'));o.material.opacity=selected?1:.07;o.material.transparent=!selected;o.material.emissive.set(selected?0x63cbbc:0x000000);o.material.emissiveIntensity=selected?.48:0;o.material.depthWrite=selected;o.renderOrder=selected?2:1});preset(facts[key].view)}
  }
  buttons.forEach(b=>b.addEventListener('click',()=>select(b.dataset.vesselFocus),{signal}));
  function preset(name){if(!controls)return;const [az,polar]=viewAngles[name],radius=camera.position.distanceTo(controls.target);camera.position.set(radius*Math.sin(polar)*Math.sin(az),radius*Math.cos(polar),radius*Math.sin(polar)*Math.cos(az));controls.update();document.querySelectorAll('[data-heart-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.heartView===name)))}
  document.querySelectorAll('[data-heart-view]').forEach(b=>b.addEventListener('click',()=>preset(b.dataset.heartView),{signal}));
  document.getElementById('heart-reset')?.addEventListener('click',()=>{active=null;if(heart)heart.traverse(o=>{if(o.isMesh&&!o.userData.flowParticle){o.material.opacity=1;o.material.transparent=false;o.material.emissive.set(0);o.material.emissiveIntensity=0;o.material.depthWrite=true;o.renderOrder=0}});const hotspot=document.getElementById('heart-hotspot');if(hotspot)hotspot.hidden=true;buttons.forEach(b=>b.setAttribute('aria-pressed','false'));const vesselInfo=document.getElementById('circ-vessel-info');if(vesselInfo)vesselInfo.textContent='Choose a vessel to trace its route through the heart.';if(camera){camera.position.set(1.3,1.1,3.8);controls.target.set(0,0,0);heart.rotation.y=0;controls.update()}},{signal});
  for(const [id,factor] of [['heart-zoom-in',.8],['heart-zoom-out',1.25]])document.getElementById(id)?.addEventListener('click',()=>{if(camera){camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update()}},{signal});
  const rotation=document.getElementById('heart-motion'),flowBtn=document.getElementById('heart-flow'),beatBtn=document.getElementById('heart-beat');
  function motion(){if(motionOff()){spin=false;beat=false;flow=false}if(!rotation||!flowBtn||!beatBtn)return;rotation.textContent=spin?'Pause rotation':'Rotate model';rotation.setAttribute('aria-pressed',String(spin));beatBtn.textContent=beat?'Pause heartbeat':'Start Heartbeat';beatBtn.setAttribute('aria-pressed',String(beat));flowBtn.textContent=flow?'Deactivate Blood Flow':'Activate Blood Flow';flowBtn.setAttribute('aria-pressed',String(flow));const flowSettings=document.getElementById('circ-flow-settings');if(flowSettings)flowSettings.hidden=!flow&&!motionOff();particles.forEach(p=>p.mesh.visible=flow&&!motionOff()&&(route==='both'||route===p.kind));}
  rotation?.addEventListener('click',()=>{spin=!spin;motion()},{signal});beatBtn?.addEventListener('click',()=>{beat=!beat;motion()},{signal});flowBtn?.addEventListener('click',()=>{flow=!flow;playing=true;motion()},{signal});reduced.addEventListener('change',motion,{signal});
  document.querySelectorAll('[data-flow-route]').forEach(b=>b.addEventListener('click',()=>{route=b.dataset.flowRoute;document.querySelectorAll('[data-flow-route]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));motion()},{signal}));
  const play=document.getElementById('flow-play');play?.addEventListener('click',()=>{playing=!playing;play.textContent=playing?'Pause':'Play'},{signal});document.getElementById('flow-replay')?.addEventListener('click',()=>{elapsed=0;playing=true;if(play)play.textContent='Pause'},{signal});document.getElementById('flow-speed')?.addEventListener('change',e=>speed=Number(e.target.value),{signal});
  host.addEventListener('keydown',e=>{if(!controls)return;const step=e.shiftKey?.22:.11;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){const a=e.key==='ArrowLeft'?step:-step;camera.position.sub(controls.target).applyAxisAngle(new THREE.Vector3(0,1,0),a).add(controls.target)}else if(e.key==='ArrowUp'||e.key==='ArrowDown'){const dir=camera.position.clone().sub(controls.target),s=new THREE.Spherical().setFromVector3(dir);s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-step:step),.4,Math.PI-.4);camera.position.copy(new THREE.Vector3().setFromSpherical(s).add(controls.target))}else if(e.key==='+'||e.key==='='){document.getElementById('heart-zoom-in')?.click()}else if(e.key==='-'){document.getElementById('heart-zoom-out')?.click()}else return;e.preventDefault();controls.update()},{signal});
  if(!window.WebGLRenderingContext){fallback();return}
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();start()}},{rootMargin:'250px'});observer.observe(host)}else start();
  signal?.addEventListener('abort',cleanup,{once:true});
  async function start(){
    if(signal?.aborted)return;
    try{
      renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.55;renderer.setSize(host.clientWidth,host.clientHeight);renderer.domElement.className='heart-webgl';host.prepend(renderer.domElement);
      scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,60);camera.position.set(1.3,1.1,3.8);
      controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=2.55;controls.maxDistance=7;controls.minPolarAngle=.38;controls.maxPolarAngle=Math.PI-.38;controls.target.set(0,0,0);controls.update();
      scene.add(new THREE.HemisphereLight(0xc5eeed,0x5a343f,2.2));const key=new THREE.DirectionalLight(0xffe8d6,3.3);key.position.set(-3,5,5);scene.add(key);const rim=new THREE.DirectionalLight(0x71bec9,2);rim.position.set(2,2,-3);scene.add(rim);
      const loader=new GLTFLoader();
      const gltf=await loader.loadAsync('assets/anatomical-heart.glb');if(signal?.aborted){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});return}heart=gltf.scene;heart.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.side=THREE.DoubleSide;o.material.roughness=.7;o.material.metalness=0}});scene.add(heart);
      host.querySelector('#heart-loading')?.remove();makeFlow();resize=new ResizeObserver(()=>{if(!renderer?.domElement?.isConnected)return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)});resize.observe(host);frame=requestAnimationFrame(draw);if(active)select(active);
    }catch(err){console.error('Heart explorer:',err);fallback();cleanup()}
  }
  function makeFlow(){
    // Anatomical waypoints follow the vessel lumens and chambers of the aligned source model.
    const paths={poor:[[[-.2,.83,-.02],[-.20,.48,-.03],[-.19,.29,-.04],[-.14,.1,.05],[.02,-.16,.21],[.22,.3,.31],[.22,.57,.23],[.52,.56,.15]], [[-.2,-.65,-.03],[-.18,-.38,-.03],[-.16,.03,.04],[.02,-.16,.21],[.22,.3,.31],[.22,.56,.23],[-.23,.48,.12]]],rich:[[[.53,.26,-.38],[.34,.25,-.31],[.15,.24,-.26],[.16,.04,-.18],[.21,-.31,.09],[.19,.17,.03],[.14,.6,-.03],[.12,.9,-.09]], [[-.38,.19,-.32],[-.14,.21,-.27],[.15,.24,-.26],[.21,-.31,.09],[.19,.17,.03],[.12,.9,-.09]]]};
    for(const kind of ['poor','rich'])for(const points of paths[kind]){const curve=new THREE.CatmullRomCurve3(points.map(V));for(let i=0;i<(innerWidth<700?3:5);i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),new THREE.MeshBasicMaterial({color:kind==='poor'?0x67b4db:0xffba7c,depthTest:true,transparent:true,opacity:.85}));mesh.userData.flowParticle=true;mesh.visible=false;heart.add(mesh);particles.push({mesh,curve,kind,offset:i/(innerWidth<700?3:5)})}}
  }
  function draw(t){frame=requestAnimationFrame(draw);const dt=Math.min((t-last)/1000,.05)||0;last=t;controls.update();if(spin&&!motionOff()&&!document.hidden)heart.rotation.y+=dt*.16;if(beat&&!motionOff()&&!document.hidden){const s=1+.006*Math.sin(t*.004);heart.scale.setScalar(s)}else heart.scale.setScalar(1);if(flow&&playing&&!motionOff()&&!document.hidden)elapsed+=dt*speed*.16;for(const p of particles){p.mesh.visible=flow&&!motionOff()&&(route==='both'||route===p.kind);if(p.mesh.visible)p.mesh.position.copy(p.curve.getPoint((elapsed+p.offset)%1))}hotspot();renderer.render(scene,camera)}
  function hotspot(){const label=document.getElementById('heart-hotspot');if(!label)return;if(!active||!heart){label.hidden=true;return}heart.localToWorld(projected.copy(V(facts[active].point)));const direction=projected.clone().sub(camera.position);ray.set(camera.position,direction.clone().normalize());const hits=ray.intersectObject(heart,true);if(hits.length&&hits[0].distance<direction.length()-.16){label.hidden=true;return}projected.project(camera);if(projected.z>1||Math.abs(projected.x)>.88||Math.abs(projected.y)>.83){label.hidden=true;return}label.hidden=false;label.style.left=((projected.x+1)*50)+'%';label.style.top=((-projected.y+1)*50)+'%';const nameEl=document.getElementById('heart-hotspot-name');if(nameEl)nameEl.textContent=facts[active].title}
  function cleanup(){observer?.disconnect();resize?.disconnect();cancelAnimationFrame(frame);controls?.dispose();if(scene)scene.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()})}});renderer?.dispose();renderer?.domElement?.remove()}
};
if(document.getElementById('heart-canvas'))window.initHeartExplorer(window.circHeartAbort?.signal);
