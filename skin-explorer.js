import * as THREE from "./assets/three/three.module.js";
import { OrbitControls } from "./assets/three/OrbitControls.js";
import { createSkinModel, SKIN_STRUCTURES } from "./skin-model.js?v=skin-detail-3";

const MODES = {
  cutaway: { parts:SKIN_STRUCTURES.map(p=>p.name), title:"Connected skin cutaway", tip:"The front is opened to expose structures in their tissue layers. Choose a label or tap the anatomy." },
  layers: { parts:["Epidermis","Dermis","Subcutaneous layer"], title:"Skin layers", tip:"Move the layer slider to compare the thin epidermis, the thicker dermis and the fat beneath the skin." },
  glands: { parts:["Hair follicle","Sebaceous gland","Arrector pili","Sweat gland"], title:"Hair & glands", tip:"Compare a gland opening into a follicle with an eccrine gland opening directly onto the surface." },
  sensation: { parts:["Nerves","Touch receptors","Pressure receptor","Blood vessels"], title:"Sensation & supply", tip:"Compare touch-sensitive endings around a hair follicle with the deeper pressure receptor, then follow a sensory nerve." },
};
const ANCHORS={"Epidermis":[-1.22,1.23,.65],"Dermis":[-1.28,.42,.48],"Subcutaneous layer":[-.98,-1.00,.59],"Hair follicle":[-.75,.55,.76],"Sweat gland":[.49,-.30,.76],"Touch receptors":[-.74,.43,.77],"Pressure receptor":[1.05,-.57,.77],"Nerves":[.14,.36,.64],"Blood vessels":[-.17,-.80,.74],"Sebaceous gland":[-.43,.65,.73],"Arrector pili":[-.29,.63,.71]};
const DETAIL_LENSES={
  cells:{title:"Epidermal cells",part:"Epidermis",center:[.05,1.16,.65],size:[.87,.43,.48]},
  collagen:{title:"Collagen bundles",part:"Dermis",center:[.50,.20,.48],size:[.9,.82,.55]},
  follicle:{title:"Follicle sheaths",part:"Hair follicle",center:[-.73,.33,.65],size:[.52,.98,.48]},
  fat:{title:"Adipose cells",part:"Subcutaneous layer",center:[-.12,-.94,.84],size:[.87,.62,.52]},
};
let disposeCurrent=()=>{};

export function mountSkinExplorer(root) {
  disposeCurrent();
  if(!root?.isConnected)return;
  const stage=root.querySelector(".body-atlas-stage"), info=root.querySelector(".body-atlas-info"), status=root.querySelector(".skin-status");
  const labelLayer=root.querySelector(".skin-hotspots"), selectionBadge=root.querySelector(".skin-selection-badge"), fallbackImage=root.querySelector(".skin-fallback");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer,scene,camera,controls,model,resize,mutation,intersection,frame,environment,ground;
  let selection=null,mode="cutaway",process=null,detail=null,separation=.55,spin=false,labels=true,playing=!reduced,disposed=false,visible=true,cameraGoal=null,lastTime=0,elapsed=0;
  let particles=[],outlines=[],labelButtons=[],needsRender=true;
  const ghostMaterial=new THREE.MeshBasicMaterial({color:0x8c8680,transparent:true,opacity:.045,depthWrite:false,side:THREE.FrontSide});
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const outlineMaterial=new THREE.ShaderMaterial({
    uniforms:{outlineWidth:{value:.009},outlineColor:{value:new THREE.Color(0x16958b)}},
    vertexShader:"uniform float outlineWidth; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); p.xyz+=normalize(normalMatrix*normal)*outlineWidth; gl_Position=projectionMatrix*p; }",
    fragmentShader:"uniform vec3 outlineColor; void main(){ gl_FragColor=vec4(outlineColor,.96);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
    side:THREE.BackSide,transparent:true,depthTest:true,depthWrite:false,
  });

  function clearOutlines(){outlines.forEach(m=>m.removeFromParent());outlines=[];}
  function clearParticles(){particles.forEach(p=>{p.mesh.removeFromParent();p.mesh.geometry.dispose();p.mesh.material.dispose();});particles=[];}
  function frameBounds(box, orientation="three-quarter", close=false){
    if(!camera||box.isEmpty())return;
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    const tan=Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
    const distance=Math.max(size.y/(2*tan),size.x/(2*tan*camera.aspect))*1.20+size.z*.55;
    const dir=orientation==="front"?new THREE.Vector3(.05,.04,1):orientation==="back"?new THREE.Vector3(-.35,.16,-1):new THREE.Vector3(.48,.20,1);
    cameraGoal={target:center,position:center.clone().add(dir.normalize().multiplyScalar(Math.max(close?1.1:3,distance)))};
    if(reduced){controls.target.copy(cameraGoal.target);camera.position.copy(cameraGoal.position);cameraGoal=null;controls.update();}
  }
  function selectedBounds(){const box=new THREE.Box3();model?.meshes.filter(m=>m.userData.structure===selection).forEach(m=>box.expandByObject(m));return box;}
  function allBounds(){const box=new THREE.Box3();model.meshes.filter(m=>m.visible).forEach(m=>box.expandByObject(m));return box;}
  function viewBounds(){const lens=DETAIL_LENSES[detail];return lens?new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...lens.center),new THREE.Vector3(...lens.size)):selection?selectedBounds():allBounds();}

  function applyVisual(){
    if(!model)return;
    needsRender=true;
    clearOutlines();
    const primary=process==="cooling"?["Sweat gland","Blood vessels"]:process==="touch"?["Nerves","Touch receptors"]:MODES[mode].parts;
    model.setSeparation(mode==="layers"?separation:0);
    model.meshes.forEach(mesh=>{
      const part=mesh.userData.structure;
      mesh.visible=mode!=="layers"||["Epidermis","Dermis","Subcutaneous layer"].includes(part);
      const active=selection?part===selection:primary.includes(part);
      if(!mesh.userData.originalMaterial)mesh.userData.originalMaterial=mesh.material;
      mesh.material=active?mesh.userData.originalMaterial:ghostMaterial;
      if(active){mesh.material.emissive.setHex(selection?0x174f49:0);mesh.material.emissiveIntensity=selection?.12:0;}
      mesh.castShadow=active;mesh.receiveShadow=active;mesh.renderOrder=active?2:0;
      if(selection&&active&&mesh.visible&&!detail){const outline=new THREE.Mesh(mesh.geometry,outlineMaterial);outline.position.copy(mesh.position);outline.quaternion.copy(mesh.quaternion);outline.scale.copy(mesh.scale);mesh.parent.add(outline);outlines.push(outline);}
    });
    if(ground)ground.position.y=mode==="layers"?-1.31-separation*.44:-1.31;
    updateLabels();
  }
  function explain(){
    const part=SKIN_STRUCTURES.find(p=>p.name===selection);
    selectionBadge.hidden=!selection&&!process;
    selectionBadge.textContent=selection?"Selected · "+selection:process==="cooling"?"Cooling · sweat & circulation":"Touch · sensory signal";
    stage.setAttribute("aria-label",selection?`${selection} selected. Other structures are transparent. Arrow keys rotate; plus and minus zoom.`:"Rotatable skin cutaway. Arrow keys rotate; plus and minus zoom. Choose a structure to examine it.");
    root.querySelectorAll("[data-part]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.part===selection)));
    root.querySelector('[data-skin-action="focus"]').disabled=!selection||!renderer;
    root.querySelector('[data-skin-action="clear"]').disabled=!selection&&!process;
    if(part){info.innerHTML=`<span class="skin-info-kicker">${part.location}</span><h3>${part.name}</h3><p>${part.job}</p><div class="skin-find"><b>Look closely</b><p>${part.find}</p></div><span class="skin-lesson-link">Lesson connection · Mission 0${part.lesson}</span>`;}
    else if(process){info.innerHTML=process==="cooling"?'<span class="skin-info-kicker">FUNCTION LAB · COOLING</span><h3>From gland to surface</h3><p>The moving cyan markers trace secretion through an eccrine coil and its duct to the surface pore. Evaporation removes heat; increased skin blood flow helps bring heat toward the surface.</p><div class="skin-find"><b>Observe</b><p>The sweat duct opens on the surface, independently of the hair follicle. Markers show a route, not its real speed.</p></div>':'<span class="skin-info-kicker">FUNCTION LAB · LIGHT TOUCH</span><h3>From receptor to nerve</h3><p>A nerve plexus around the hair root detects movement of the hair. Moving golden markers follow a sensory fiber away from the follicle toward a deeper nerve.</p><div class="skin-find"><b>Observe</b><p>The hair-root receptor and nerve are in the dermis. The signal continues toward the central nervous system beyond this cutaway.</p></div>';}
    else info.innerHTML=`<span class="skin-info-kicker">${MODES[mode].title}</span><h3>Choose a structure</h3><p>${MODES[mode].tip}</p><div class="skin-find"><b>Try the function lab</b><p>Trace the route of sweat or follow a sensory signal, then examine the structures that make it possible.</p></div>`;
  }
  function select(part){
    const previousDetail=detail;detail=null;
    if(part&&!MODES[mode].parts.includes(part))setMode("cutaway");
    selection=part;process=null;clearParticles();updateProcessButtons();applyVisual();explain();
    root.querySelectorAll("[data-skin-detail]").forEach(b=>b.setAttribute("aria-pressed","false"));
    root.querySelector(".skin-view-name").textContent=MODES[mode].title;
    if(previousDetail&&!part&&model)frameBounds(allBounds());
    status.textContent=part?`${part} isolated. Choose Focus structure for a closer view, or Show all to compare.`:"Drag to rotate · scroll or pinch to zoom · tap a structure";
  }
  function setMode(next){
    mode=next;selection=null;process=null;detail=null;clearParticles();updateProcessButtons();
    root.querySelectorAll("[data-skin-detail]").forEach(b=>b.setAttribute("aria-pressed","false"));
    root.querySelectorAll("[data-skin-mode]").forEach(b=>{const active=b.dataset.skinMode===next;b.setAttribute("aria-selected",String(active));b.tabIndex=active?0:-1;});
    root.querySelector(".skin-model-panel").setAttribute("aria-labelledby","skin-tab-"+next);
    root.querySelectorAll("[data-part]").forEach(b=>b.hidden=!MODES[next].parts.includes(b.dataset.part));
    root.querySelector(".skin-layer-control").hidden=next!=="layers";
    root.querySelector(".skin-view-name").textContent=MODES[next].title;
    applyVisual();explain();if(model)frameBounds(allBounds());
  }
  function updateProcessButtons(){root.querySelectorAll("[data-skin-process]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.skinProcess===process)));root.querySelector('[data-skin-action="play"]').hidden=!process;}
  function startProcess(next){
    if(process===next){select(null);return;}
    setMode(next==="cooling"?"glands":"sensation");process=next;selection=null;clearParticles();
    if(model){
      const routes=next==="cooling"?[{curve:model.paths.sweat,color:0x41c9c4,count:7,rate:.085},{curve:model.paths.blood,color:0xf2a28c,count:5,rate:.10},{curve:model.paths.returnBlood,color:0x9bc8db,count:5,rate:.10}]:[{curve:model.paths.touch,color:0xffe88a,count:5,rate:.15}];
      routes.forEach(route=>{for(let i=0;i<route.count;i++){const mesh=new THREE.Mesh(new THREE.SphereGeometry(next==="touch"?.020:.018,10,8),new THREE.MeshBasicMaterial({color:route.color}));mesh.renderOrder=5;scene.add(mesh);particles.push({mesh,curve:route.curve,offset:i/route.count,rate:route.rate});}});
    }
    updateProcessButtons();applyVisual();explain();
    status.textContent=reduced?"Route shown as still markers. Use Play route to animate it.":"Animated markers trace a route. Pause to examine the anatomy.";
  }

  function updateLabels(){
    needsRender=true;
    labelLayer.replaceChildren();labelButtons=[];
    if(!labels||detail)return;
    const names=selection?[selection]:process==="cooling"?["Sweat gland","Blood vessels"]:process==="touch"?["Touch receptors","Nerves"]:mode==="cutaway"?["Epidermis","Hair follicle","Sweat gland","Subcutaneous layer"]:MODES[mode].parts;
    names.forEach(name=>{const b=document.createElement("button");b.type="button";b.className="skin-hotspot";b.textContent=name;b.setAttribute("aria-label","Examine "+name);b.onclick=()=>select(name);labelLayer.append(b);labelButtons.push({button:b,name});});
  }
  function positionLabels(){
    if(!camera)return;
    const width=stage.clientWidth,height=stage.clientHeight;
    labelButtons.forEach(({button,name})=>{
      const point=new THREE.Vector3(...ANCHORS[name]);
      if(mode==="layers"){if(name==="Epidermis")point.y+=separation*.62;if(name==="Subcutaneous layer")point.y-=separation*.44;}
      point.project(camera);
      const x=(point.x*.5+.5)*width,y=(-point.y*.5+.5)*height;
      button.hidden=point.z>1||point.z< -1||camera.position.z< -.1;
      button.style.left=Math.max(12,Math.min(width-button.offsetWidth-12,x+12))+"px";
      button.style.top=Math.max(50,Math.min(height-45,y-12))+"px";
    });
  }

  root.querySelectorAll("[data-part]").forEach(b=>b.onclick=()=>select(b.dataset.part));
  root.querySelectorAll("[data-skin-mode]").forEach((b,i,all)=>{
    b.onclick=()=>setMode(b.dataset.skinMode);
    b.onkeydown=e=>{let next;if(e.key==="ArrowRight")next=(i+1)%all.length;else if(e.key==="ArrowLeft")next=(i+all.length-1)%all.length;else if(e.key==="Home")next=0;else if(e.key==="End")next=all.length-1;else return;e.preventDefault();all[next].focus();setMode(all[next].dataset.skinMode);};
  });
  root.querySelectorAll("[data-skin-process]").forEach(b=>b.onclick=()=>startProcess(b.dataset.skinProcess));
  root.querySelectorAll("[data-skin-detail]").forEach(b=>b.onclick=()=>{
    const lens=DETAIL_LENSES[b.dataset.skinDetail];setMode("cutaway");select(lens.part);detail=b.dataset.skinDetail;
    b.setAttribute("aria-pressed","true");applyVisual();
    root.querySelector(".skin-view-name").textContent="Detail lens · "+lens.title;
    if(model)frameBounds(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...lens.center),new THREE.Vector3(...lens.size)),"three-quarter",true);
    status.textContent="Detail lens · "+lens.title+". Drag to turn the detail; Show all returns to the full cutaway.";
  });
  root.querySelector("#skin-separation").oninput=e=>{separation=+e.target.value/100;root.querySelector("#skin-separation-value").textContent=e.target.value+"%";applyVisual();if(model)frameBounds(allBounds());};
  root.querySelectorAll("[data-skin-action]").forEach(b=>b.onclick=()=>{
    const action=b.dataset.skinAction;
    if(action==="spin"){spin=!spin;if(controls)controls.autoRotate=spin;b.setAttribute("aria-pressed",String(spin));}
    else if(action==="labels"){labels=!labels;b.setAttribute("aria-pressed",String(labels));updateLabels();}
    else if(action==="clear")select(null);
    else if(action==="play"){playing=!playing;b.setAttribute("aria-pressed",String(playing));b.textContent=playing?"Pause route":"Play route";}
    else if(action==="focus"&&selection&&model){detail=null;applyVisual();root.querySelector(".skin-view-name").textContent=MODES[mode].title;root.querySelectorAll("[data-skin-detail]").forEach(b=>b.setAttribute("aria-pressed","false"));frameBounds(selectedBounds(),"three-quarter",true);}
    else if(action==="reset"){spin=false;labels=true;separation=.55;root.querySelector("#skin-separation").value="55";root.querySelector("#skin-separation-value").textContent="55%";root.querySelector('[data-skin-action="labels"]').setAttribute("aria-pressed","true");if(controls)controls.autoRotate=false;root.querySelector('[data-skin-action="spin"]').setAttribute("aria-pressed","false");setMode("cutaway");status.textContent="Full connected cutaway restored.";}
    else if(camera&&model){if(action==="in"||action==="out"){cameraGoal=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).multiplyScalar(action==="in"?.85:1.18)));controls.update();}else frameBounds(viewBounds(),action==="front"?"front":"back",!!selection);}
  });

  const cleanup=()=>{
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);resize?.disconnect();mutation?.disconnect();intersection?.disconnect();controls?.dispose();clearOutlines();clearParticles();model?.meshes.forEach(m=>{if(m.userData.originalMaterial)m.material=m.userData.originalMaterial;});model?.dispose();environment?.dispose();ground?.geometry.dispose();ground?.material.dispose();outlineMaterial.dispose();ghostMaterial.dispose();renderer?.dispose();renderer?.domElement.remove();
    if(window.inneruSkinExplorerState===report){delete window.inneruSkinExplorerState;delete window.inneruSkinExplorerDrawFrame;}
  };
  disposeCurrent=cleanup;
  function report(){return {mode,selection,process,detail,separation,labels,spin,playing,canvas:!!renderer,structures:model?.meshes.map(m=>m.userData.structure),anatomy:model?.anatomy,camera:camera?.position.toArray(),target:controls?.target.toArray(),transitioning:!!cameraGoal,layerPositions:model?Object.fromEntries(Object.entries(model.layers).map(([name,layer])=>[name,layer.position.y])):null,frames:renderer?.info.render.frame,drawCalls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,particles:particles.length,particlePositions:particles.map(p=>p.mesh.position.toArray()),opacity:model?.meshes.map(m=>({part:m.userData.structure,opacity:m.material.opacity,visible:m.visible})),disposed};}
  window.inneruSkinExplorerState=report;
  root.querySelector('[data-skin-action="play"]').setAttribute("aria-pressed",String(playing));
  root.querySelector('[data-skin-action="play"]').textContent=playing?"Pause route":"Play route";
  function fallback(){
    renderer?.domElement.remove();renderer?.dispose();renderer=null;fallbackImage.hidden=false;
    labelLayer.hidden=true;
    root.querySelector(".body-atlas-loading").hidden=true;root.querySelector(".skin-fallback-note").hidden=false;
    root.querySelectorAll("[data-skin-action]").forEach(b=>{if(b.dataset.skinAction!=="clear")b.disabled=true;});
    root.querySelector("#skin-separation").disabled=true;
    root.querySelectorAll("[data-skin-detail]").forEach(b=>b.disabled=true);
    status.textContent="Use the scientific illustration and structure buttons to continue exploring.";
  }
  setMode("cutaway");
  mutation=new MutationObserver(()=>{if(!root.isConnected)cleanup();});mutation.observe(document.getElementById("app"),{childList:true,subtree:true});
  try {
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;stage.prepend(renderer.domElement);
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(38,1,.05,40);camera.position.set(1.8,1.2,6.5);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.dampingFactor=.09;controls.minDistance=.7;controls.maxDistance=12;controls.autoRotateSpeed=.65;
    controls.addEventListener("change",()=>{needsRender=true;});
    scene.add(new THREE.HemisphereLight(0xfff2df,0x6d7b89,1.45));
    const key=new THREE.DirectionalLight(0xffe7d6,2.25);key.position.set(-3,6,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.5,far:16});key.shadow.bias=-.001;key.shadow.normalBias=.025;key.shadow.radius=4;scene.add(key);
    const rim=new THREE.DirectionalLight(0xd9edf6,1.75);rim.position.set(4,3,-3);scene.add(rim);
    const fill=new THREE.DirectionalLight(0xffe4dc,.65);fill.position.set(2,0,5);scene.add(fill);
    const envData=new Uint8Array(128*64*4);
    for(let y=0;y<64;y++)for(let x=0;x<128;x++){const light=72+115*Math.exp(-Math.pow((x-24)/16,2)-Math.pow((y-21)/13,2))+95*Math.exp(-Math.pow((x-91)/10,2)-Math.pow((y-18)/15,2));const i=(y*128+x)*4;envData[i]=Math.min(255,light+10);envData[i+1]=light;envData[i+2]=light-5;envData[i+3]=255;}
    const envTexture=new THREE.DataTexture(envData,128,64);envTexture.mapping=THREE.EquirectangularReflectionMapping;envTexture.colorSpace=THREE.SRGBColorSpace;envTexture.needsUpdate=true;
    const pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromEquirectangular(envTexture);scene.environment=environment.texture;scene.environmentIntensity=.6;envTexture.dispose();pmrem.dispose();
    model=createSkinModel();scene.add(model.group);
    ground=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:.09}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.31;ground.receiveShadow=true;scene.add(ground);
    const size=()=>{if(!stage.isConnected)return;needsRender=true;camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();renderer.setSize(stage.clientWidth,stage.clientHeight);if(model)frameBounds(viewBounds(),"three-quarter",!!selection);};
    resize=new ResizeObserver(size);resize.observe(stage);size();applyVisual();explain();
    // Set the first view immediately; later changes ease into place.
    if(cameraGoal){controls.target.copy(cameraGoal.target);camera.position.copy(cameraGoal.position);cameraGoal=null;controls.update();}
    root.querySelector(".body-atlas-loading").hidden=true;
    status.textContent="Drag to rotate · scroll or pinch to zoom · tap a structure";
    let start;
    function hitAt(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);ray.setFromCamera(pointer,camera);return ray.intersectObjects(model.meshes,false).find(h=>h.object.visible&&h.object.material.opacity>.2);}
    renderer.domElement.onpointerdown=e=>{start=[e.clientX,e.clientY];cameraGoal=null;};
    renderer.domElement.onpointerup=e=>{if(!start)return;const moved=Math.hypot(e.clientX-start[0],e.clientY-start[1])>6;start=null;if(moved)return;const hit=hitAt(e);if(hit)select(hit.object.userData.structure);};
    renderer.domElement.onpointermove=e=>{if(start)return;renderer.domElement.style.cursor=hitAt(e)?"pointer":"grab";};
    renderer.domElement.onwheel=()=>{cameraGoal=null;};
    stage.onkeydown=e=>{
      if(e.target!==stage)return;
      let axis,angle;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){axis=new THREE.Vector3(0,1,0);angle=e.key==="ArrowLeft"?.13:-.13;}else if(e.key==="ArrowUp"||e.key==="ArrowDown"){axis=new THREE.Vector3(1,0,0);angle=e.key==="ArrowUp"?.09:-.09;}
      if(axis){cameraGoal=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).applyAxisAngle(axis,angle)));controls.update();e.preventDefault();}
      else if(e.key==="+"||e.key==="="||e.key==="-"){cameraGoal=null;camera.position.copy(controls.target.clone().add(camera.position.clone().sub(controls.target).multiplyScalar(e.key==="-"?1.12:.89)));controls.update();e.preventDefault();}
      else if(e.key==="Escape"){select(null);e.preventDefault();}
    };
    intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)needsRender=true;},{rootMargin:"180px"});intersection.observe(stage);
    // Diagnostic frame hook lets verification read pixels in the same WebGL frame.
    window.inneruSkinExplorerDrawFrame=()=>{if(renderer&&!disposed)renderer.render(scene,camera);};
    function draw(time=0){
      if(disposed)return;frame=requestAnimationFrame(draw);
      if(!root.isConnected){cleanup();return;}
      const dt=Math.min(64,Math.max(0,time-lastTime))/1000;lastTime=time;
      if(document.hidden||!visible)return;
      if(cameraGoal){const factor=reduced?1:1-Math.exp(-dt*9);controls.target.lerp(cameraGoal.target,factor);camera.position.lerp(cameraGoal.position,factor);if(camera.position.distanceTo(cameraGoal.position)<.006&&controls.target.distanceTo(cameraGoal.target)<.006)cameraGoal=null;}
      if(playing)elapsed+=dt;
      controls.update();outlineMaterial.uniforms.outlineWidth.value=camera.position.distanceTo(controls.target)*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)*3/stage.clientHeight;
      particles.forEach(p=>p.mesh.position.copy(p.curve.getPointAt((elapsed*p.rate+p.offset)%1)));
      if(needsRender||(playing&&particles.length)||spin){positionLabels();renderer.render(scene,camera);needsRender=false;}
    }
    draw();
  } catch(error){console.warn("Skin explorer unavailable:",error);fallback();}
  return cleanup;
}
