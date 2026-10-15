import * as THREE from './assets/three/three.module.js';
import {OrbitControls} from './assets/three/OrbitControls.js';
import {createArmModel} from './muscle-pair-model.js?v=arm-team-1';

export async function mountArmView(root,controller,select){
  if(!root.isConnected||!window.WebGLRenderingContext)return;
  const stage=root.querySelector('.arm-lab-stage'),abort=new AbortController(),signal=abort.signal;
  let renderer,camera,scene,controls,model,resize,intersection,mutation,frame=0,disposed=false,visible=true,needsRender=true;
  const on=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal});
  function reset(){if(!camera)return;const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.target.set(-.055,.19,.09);camera.position.set(-1.43,.55,1.56);controls.update();controls.enableDamping=damping;needsRender=true;}
  function resume(){needsRender=true;if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function draw(){frame=0;if(disposed||!visible||document.hidden||!model)return;const changed=controls.update();if(changed||needsRender){renderer.render(scene,camera);needsRender=false;}frame=requestAnimationFrame(draw);}
  function cleanup(){if(disposed)return;disposed=true;abort.abort();cancelAnimationFrame(frame);resize?.disconnect();intersection?.disconnect();mutation?.disconnect();controls?.dispose();model?.dispose();renderer?.dispose();renderer?.domElement.remove();delete root.dataset.arm3d;root.querySelector('.arm-lab-3d').hidden=true;root.querySelector('.arm-lab-svg').hidden=false;if(window.__inneruArmView?.root===root)window.__inneruArmView=null;}
  controller.attach({dispose:cleanup});
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(stage.clientWidth,stage.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.10;renderer.domElement.setAttribute('aria-hidden','true');stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(35,stage.clientWidth/stage.clientHeight,.015,20);controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.dampingFactor=.14;controls.minDistance=1.3;controls.maxDistance=3.5;controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI-.35;reset();
    scene.add(new THREE.HemisphereLight(0xfff5e6,0x647f79,2));const key=new THREE.DirectionalLight(0xffe9d3,2.4);key.position.set(-3,4,5);scene.add(key);const rim=new THREE.DirectionalLight(0xbce5de,1.4);rim.position.set(3,1,-3);scene.add(rim);const fill=new THREE.DirectionalLight(0xffffff,1.2);fill.position.set(2,3,4);scene.add(fill);
    const built=await createArmModel();if(disposed||!root.isConnected){built.dispose();cleanup();return;}model=built;scene.add(model.group);root.dataset.arm3d='true';root.querySelector('.arm-lab-svg').hidden=true;root.querySelector('.arm-lab-3d').hidden=false;model.update(controller.pose);
    on(root,'arm-lab-pose',e=>{controls.enableDamping=!(matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('motionoff'));model.update(e.detail);resume();});on(root,'arm-lab-view-reset',reset);
    let start=null;const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
    on(renderer.domElement,'pointerdown',e=>start=[e.clientX,e.clientY]);
    on(renderer.domElement,'pointerup',e=>{if(!start)return;const moved=Math.hypot(e.clientX-start[0],e.clientY-start[1]);start=null;if(moved>7)return;const box=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-box.left)/box.width*2-1,-(e.clientY-box.top)/box.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(model.meshes.filter(m=>m.material.opacity>.25),false)[0];if(hit)select(hit.object.userData.part);});
    on(renderer.domElement,'webglcontextlost',e=>{e.preventDefault();cleanup();});
    resize=new ResizeObserver(()=>{if(disposed)return;const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);resume();});resize.observe(stage);
    intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resume();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'60px'});intersection.observe(stage);
    on(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else resume();});
    mutation=new MutationObserver(()=>{if(!root.isConnected)cleanup();});mutation.observe(document.getElementById('app'),{childList:true});
    window.__inneruArmView={root,model,renderer,camera,controls,draw:()=>renderer.render(scene,camera),state:()=>({...model.state(),frames:renderer.info.render.frame,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls,visible,disposed})};
    root.querySelector('.arm-lab-render-note').textContent='Atlas anatomy · drag to turn · scroll to zoom · 0° is straight';resume();
  }catch(e){console.warn('Anatomical arm uses the interactive illustration:',e);cleanup();root.querySelector('.arm-lab-render-note').textContent='Interactive anatomical illustration · 3D unavailable on this device';}
}
