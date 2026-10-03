import * as THREE from './assets/three/three.module.js';
import {GLTFLoader} from './assets/three/GLTFLoader.js';
import {OrbitControls} from './assets/three/OrbitControls.js';

const notes={
 skeletal:{
  'Skull':'The skull protects the brain. Its bones meet at mostly immovable sutures; the mandible moves for speaking and chewing.',
  'Spine':'Vertebrae surround and protect the spinal cord. The curved spine supports the head and allows controlled movement.',
  'Rib cage':'Ribs and sternum protect the heart and lungs. The rib cage moves with breathing.',
  'Shoulders':'Clavicles and scapulae connect the arms to the trunk and help position the shoulder joint.',
  'Arms':'The humerus, radius and ulna make the arm and forearm. Joints between them help you lift, bend and turn.',
  'Pelvis':'The hip bones support body weight, protect pelvic organs and connect the legs to the trunk.',
  'Legs':'The femur, patella, tibia and fibula help support weight and move the body.',
  'Hands and feet':'The many small bones of hands and feet support precise grip, balance and movement.'},
 muscular:{
  'Sternocleidomastoid':'A paired neck muscle that helps turn and tilt the head.',
  'Masseter':'The masseter at the side of the jaw helps close the mouth for chewing.',
  'Temporalis':'The temporalis on the side of the head helps close the jaw.',
  'Forearms':'Forearm muscle groups move the wrist and fingers and help turn the forearm.',
  'Latissimus dorsi':'The broad latissimus dorsi helps pull the arm back and toward the body.',
  'Hamstrings':'The muscles at the back of the thigh help bend the knee and extend the hip.',
  'Tibialis anterior':'The tibialis anterior at the front of the shin lifts the foot upward.',
  'Deltoids':'The deltoids cover the shoulders and help raise and move the arms.',
  'Pectorals':'The pectoralis major muscles help move the arms forward and toward the body.',
  'Biceps':'The biceps brachii bends the elbow and helps turn the palm upward.',
  'Triceps':'The triceps brachii straightens the elbow. It works opposite the biceps in many arm movements.',
  'Trapezius':'The trapezius helps position the shoulder blades and move the neck and upper back.',
  'Abdominals':'The continuous paired rectus abdominis helps flex and brace the trunk. External obliques wrap around the sides and help rotate the torso.',
  'Gluteals':'The gluteus maximus extends the hip, especially when rising, climbing or running.',
  'Quadriceps':'These front thigh muscles straighten the knee and help you walk, jump and stand.',
  'Calves':'The gastrocnemius and soleus help point the foot downward when walking or pushing off the ground.'},
 integumentary:{
  'Epidermis':'Outer renewing skin layer. Keratin helps form a water-resistant barrier; melanocytes produce melanin.',
  'Dermis':'Connective tissue supports the skin and houses many glands, vessels, sensory nerves and hair follicles.',
  'Subcutaneous layer':'Fat and connective tissue beneath the skin cushion the body and reduce heat loss.',
  'Hair follicle':'Hair grows from dividing cells in its follicle. Keratin strengthens the shaft.',
  'Sweat gland':'A tightly coiled secretory tube lies deep in the dermis. Its narrow duct reaches a separate surface pore; evaporation of sweat helps cool skin.',
  'Sebaceous gland':'Clusters of oil-producing sacs join a short duct that opens into a hair follicle, lubricating skin and hair.',
  'Nerves':'Sensory nerve endings detect touch, pressure, temperature and pain.',
  'Blood vessels':'Dermal vessels supply tissue and help regulate heat near the surface. Red marks arterial routes and blue marks venous routes in this teaching model; human blood is red in both.',
  'Arrector pili':'A small muscle contracts and pulls a hair upright, creating goose bumps.'},
 excretory:{
  'Left kidney':'The left kidney filters blood and helps regulate water, salts and acid-base balance. This kidney has an open teaching cutaway.',
  'Right kidney':'The right kidney filters blood through many microscopic nephrons.',
  'Renal cortex':'The outer region of a kidney contains many filtration structures, including glomeruli.',
  'Renal medulla':'The inner kidney contains pyramids and tubules that help concentrate the forming urine.',
  'Renal pelvis':'Urine collects in the renal pelvis before it enters a ureter.',
  'Renal artery':'A renal artery brings blood to the kidney; red marks its route in this model.',
  'Renal vein':'A renal vein carries filtered blood away; blue marks its route in this model. Blood itself is red in both.',
  'Ureters':'Each ureter carries urine from a kidney down to the urinary bladder.',
  'Urinary bladder':'The bladder stores urine until it is released.',
  'Urethra':'The urethra carries urine from the bladder out of the body.',
  'Bowmans capsule':'Bowman’s capsule surrounds the glomerulus and catches fluid filtered out of the blood.',
  'Glomerulus':'This knot of capillaries filters small substances into Bowman’s capsule. Blood cells and large proteins normally stay in blood.',
  'Renal tubule':'Useful water and solutes can move from the filtrate back into blood along the tubule.',
  'Loop of Henle':'The loop of Henle helps the kidney conserve water and concentrate urine.',
  'Collecting duct':'Collecting ducts carry the final urine toward the renal pelvis.',
  'Peritubular capillaries':'These blood vessels surround the tubule and receive much of the reabsorbed water and useful solutes.'},
 respiratory:{
  'Left lung':'The left lung has two lobes and space for the heart. Its many tiny alveoli exchange gases with surrounding capillaries.',
  'Right lung':'The right lung has three lobes. Air reaching its microscopic alveoli supplies oxygen to blood and releases carbon dioxide.',
  'Trachea':'The trachea conducts air toward the chest and branches into the two main bronchi. Mucus and cilia help clear particles.',
  'Bronchi':'The bronchi branch from the trachea into each lung. Smaller bronchioles lead toward the alveoli where gas exchange occurs.',
  'Bronchioles':'Bronchioles are the small airway branches inside the lungs. Their finest terminal branches deliver air toward clusters of alveoli.',
  'Alveoli':'Alveoli are microscopic air sacs at the ends of the airways. Oxygen diffuses through their thin, moist walls into capillaries; carbon dioxide diffuses the other way. This cluster is magnified, not to scale.',
  'Diaphragm':'When the diaphragm contracts it flattens and descends; chest volume rises and air enters. Relaxation helps air leave.'}
};

const muscleFacts={
 'Sternocleidomastoid':{name:'Sternocleidomastoid',location:'At each side of the neck.',function:'Positions the head.',movement:'Turns or tilts the head.',example:'Looking over your shoulder.',try:'Slowly turn your head to one side without forcing the movement.'},
 'Masseter':{name:'Masseter',location:'At the side of the jaw.',function:'Closes the jaw.',movement:'Raises the lower jaw.',example:'Chewing food.',try:'Gently close your teeth and feel the side of your jaw become firmer.'},
 'Temporalis':{name:'Temporalis',location:'At each temple, above the ear.',function:'Helps close the jaw.',movement:'Raises and draws back the lower jaw.',example:'Biting a sandwich.',try:'Place your fingers lightly on a temple and gently close your jaw.'},
 'Deltoids':{name:'Deltoid',location:'Around the shoulder.',function:'Raises and positions the arm.',movement:'Lifts the arm out to the side.',example:'Reaching for a book on a shelf.',try:'Lift one arm gently to the side and feel your shoulder engage.'},
 'Pectorals':{name:'Pectoralis major',location:'Across the front of the upper chest.',function:'Moves the upper arm toward the body.',movement:'Brings the arm forward and inward.',example:'Pushing a door open.',try:'Press your palms gently together in front of your chest.'},
 'Biceps':{name:'Biceps brachii',location:'At the front of the upper arm.',function:'Helps bend the elbow and turn the forearm.',movement:'Flexes the elbow.',example:'Lifting a backpack toward your body.',try:'Bend your elbow and gently feel the front of your upper arm become firmer.'},
 'Triceps':{name:'Triceps brachii',location:'At the back of the upper arm.',function:'Straightens the elbow.',movement:'Extends the elbow.',example:'Pushing yourself away from a desk.',try:'Straighten your arm gently and feel the back of your upper arm.'},
 'Forearms':{name:'Forearm muscle groups',location:'Between the elbow and wrist.',function:'Move the wrist and fingers.',movement:'Flexes and extends the wrist and fingers.',example:'Gripping a pencil.',try:'Open and close your hand slowly while feeling your forearm.'},
 'Trapezius':{name:'Trapezius',location:'Across the upper back and neck.',function:'Moves and steadies the shoulder blades.',movement:'Shrugs the shoulders.',example:'Carrying a school bag comfortably.',try:'Raise and lower your shoulders gently.'},
 'Latissimus dorsi':{name:'Latissimus dorsi',location:'Across the broad lower and middle back.',function:'Pulls the arm back and inward.',movement:'Extends and adducts the shoulder.',example:'Pulling a door toward you.',try:'Draw your elbows gently back toward your sides.'},
 'Rectus abdominis':{name:'Rectus abdominis',location:'A paired strip along the front of the abdomen.',function:'Flexes and braces the trunk.',movement:'Bends the trunk forward.',example:'Sitting up from a reclined position.',try:'While seated, gently tighten your abdomen without holding your breath.'},
 'External oblique':{name:'External oblique',location:'Along the sides of the abdomen.',function:'Helps rotate and brace the trunk.',movement:'Turns the torso.',example:'Turning to reach something beside you.',try:'While seated, turn your shoulders slightly from side to side.'},
 'Gluteals':{name:'Gluteus maximus',location:'At the back of the hip.',function:'Extends the hip.',movement:'Moves the thigh backward.',example:'Standing up from a chair.',try:'Stand up from a chair slowly and notice the hip muscles working.'},
 'Quadriceps':{name:'Quadriceps',location:'At the front of the thigh.',function:'Straightens the knee.',movement:'Extends the knee.',example:'Climbing a step.',try:'While seated, slowly straighten one knee and feel the front of the thigh.'},
 'Hamstrings':{name:'Hamstrings',location:'At the back of the thigh.',function:'Bend the knee and help extend the hip.',movement:'Flexes the knee.',example:'Pulling your heel back while walking.',try:'While standing with support, bend one knee gently.'},
 'Calves':{name:'Gastrocnemius',location:'At the back of the lower leg.',function:'Helps push the foot downward.',movement:'Points the foot and helps bend the knee.',example:'Pushing off the ground while walking.',try:'With support, rise gently onto your toes and lower again.'},
 'Tibialis anterior':{name:'Tibialis anterior',location:'Along the front of the shin.',function:'Lifts the front of the foot.',movement:'Dorsiflexes the ankle.',example:'Clearing the toes while stepping.',try:'While seated, lift your toes toward your shin.'}
};
const muscleHotspotSpecs=[
 ['Deltoids',.31,.92,.08,'front'],['Pectorals',-.16,.76,.29,'front'],['Biceps',.40,.49,.06,'front'],['Rectus abdominis',.065,.38,.29,'front'],['External oblique',-.25,.34,.18,'front'],['Quadriceps',.18,-1.02,.16,'front'],
 ['Trapezius',.12,1.02,-.18,'back'],['Triceps',.45,.40,-.17,'back'],['Latissimus dorsi',-.21,.57,-.22,'back'],['Gluteals',.21,-.26,-.17,'back'],['Hamstrings',-.17,-1.01,-.16,'back'],['Calves',.18,-1.47,-.15,'back']
];
function partFor(name,kind){const n=name.toLowerCase().replace(/[_-]+/g,' ');if(kind==='integumentary'){return Object.keys(notes.integumentary).find(part=>n===part.toLowerCase()||n.startsWith(part.toLowerCase()+' '))||null}if(kind==='skeletal'){
 if(/frontal|parietal|temporal|zygomatic|occipital|sphenoid|mandible/.test(n))return 'Skull';
 if(/atlas|axis|vertebra|sacrum|coccyx/.test(n))return 'Spine';
 if(/rib|sternum/.test(n))return 'Rib cage';
 if(/clavicle|scapula/.test(n))return 'Shoulders';
 if(/humerus|radius|ulna/.test(n))return 'Arms';
 if(/hip bone/.test(n))return 'Pelvis';
 if(/femur|tibia|fibula|patella/.test(n))return 'Legs';
 return 'Hands and feet';}
 if(kind==='excretory'){return Object.keys(notes.excretory).find(part=>n===part.toLowerCase()||n.startsWith(part.toLowerCase()+' '))||null}
 if(kind==='respiratory'){if(n.includes('alveol'))return 'Alveoli';if(n.includes('lung')||n.includes('parenchyma')||n.includes('fissure'))return n.includes('left')||n.includes('lingular')||n.includes('apicoposterior')?'Left lung':'Right lung';if(n.includes('trachea'))return 'Trachea';if(n.includes('bronchiole'))return 'Bronchioles';if(n.includes('bronch'))return 'Bronchi';if(n.includes('diaphragm'))return 'Diaphragm';return null}
 if(kind==='muscular'&&n.includes('rectus abdominis'))return 'Rectus abdominis';if(kind==='muscular'&&n.includes('external oblique'))return 'External oblique';
 if(kind==='muscular'){for(const [token,part] of [['sternocleidomastoid','Sternocleidomastoid'],['masseter','Masseter'],['temporalis','Temporalis'],['forearm muscle','Forearms'],['latissimus dorsi','Latissimus dorsi'],['hamstring','Hamstrings'],['tibialis anterior','Tibialis anterior']])if(n.includes(token))return part;}
 for(const [token,part] of [['deltoid','Deltoids'],['pectoralis','Pectorals'],['biceps','Biceps'],['triceps','Triceps'],['trapezius','Trapezius'],['gluteus','Gluteals'],['femoris','Quadriceps'],['vastus','Quadriceps'],['gastrocnemius','Calves'],['soleus','Calves']])if(n.includes(token))return part;
 return null;
}

let currentCleanup=()=>{};
window.mountBodyAtlas=function(kind){
 currentCleanup();const root=document.querySelector(`[data-atlas="${kind}"]`);if(!root)return;
 const stage=root.querySelector('.body-atlas-stage'),error=root.querySelector('.body-atlas-error'),info=root.querySelector('.body-atlas-info');
 let renderer,scene,camera,controls,model,resize,observer,hotspotButtons=[],frame=0,loadTimer=0,disposed=false,selection=null,specific=null,meshes=[],bodyShell=null,mode=kind==='excretory'?'organs':'outside',cameraGoal=null;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const nephronParts=new Set(['Bowmans capsule','Glomerulus','Renal tubule','Loop of Henle','Collecting duct','Peritubular capillaries']);
 const fallback=()=>{if(disposed)return;root.querySelector('.body-atlas-loading')?.remove();error.hidden=false;if(kind==='muscular'){const art=root.querySelector('.body-atlas-fallback');if(art)art.hidden=false;root.querySelectorAll('[data-view]').forEach(b=>{b.disabled=true;b.title='3D view unavailable'})}};
 function applyVisual(){if(!model)return;if(kind==='muscular'&&bodyShell)bodyShell.material.opacity=selection?.05:.58;meshes.forEach(mesh=>{
  const part=mesh.userData.atlasPart||partFor(mesh.name,kind),micro=kind==='respiratory'&&part==='Alveoli';
  mesh.visible=kind!=='respiratory'||mode==='alveoli'?kind!=='respiratory'||micro:!micro;
  if(kind==='excretory'){const isNephron=mesh.userData.isNephron;mesh.visible=mode==='nephron'?isNephron:!isNephron;if(mode==='organs'&&(mesh.name.includes(' cutaway')||['Renal cortex','Renal medulla','Renal pelvis'].includes(part)))mesh.visible=false;if(mode==='cutaway'&&mesh.name.startsWith('Left kidney exterior'))mesh.visible=false;}
  if(!mesh.visible)return;
  const focused=!selection||part===selection&&(!specific||mesh.name===specific);
  const shell=kind==='respiratory'&&['Left lung','Right lung'].includes(part);
  const faint=kind==='respiratory'&&mode==='inside'&&(shell||part==='Diaphragm');
  const opacity=selection?(focused?1:kind==='integumentary'?.11:kind==='muscular'?.07:.065):(faint?.13:kind==='muscular'&&['Masseter','Temporalis'].includes(part)?.62:1);
  mesh.material.transparent=opacity<1||kind==='muscular';if(kind==='muscular'){mesh.userData.targetOpacity=opacity;mesh.material.depthWrite=false;mesh.renderOrder=focused?2:1}else{mesh.material.opacity=opacity;mesh.material.depthWrite=opacity>=.95;}
  mesh.material.depthTest=!(selection&&focused&&(kind==='integumentary'||kind==='excretory'));
  mesh.material.emissive.set(selection&&focused&&kind!=='integumentary'?(kind==='muscular'?0xb84431:0x358d85):0x000000);mesh.material.emissiveIntensity=selection&&focused&&kind!=='integumentary'?(kind==='muscular'?.55:.36):0;
  mesh.renderOrder=selection?(focused?(kind==='integumentary'||kind==='excretory'||kind==='muscular'?20:2):1):0;
 })}
 function setMode(next){if(kind!=='respiratory')return;mode=next;selection=null;specific=null;
  root.querySelectorAll('[data-resp-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.respMode===next)));
  root.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed','false'));
  info.textContent=next==='alveoli'?'Magnified alveolar sac: select Alveoli or tap an air sac to inspect gas exchange.':next==='inside'?'Inside view: transparent pleura reveals bronchi and branching bronchioles. Choose a structure to isolate it.':'Outer view: rotate the lungs and choose a structure to investigate.';
  applyVisual();if(camera){const target=next==='alveoli'?new THREE.Vector3(2.45,0,0):new THREE.Vector3(0,0,0);controls.target.copy(target);camera.position.copy(target.clone().add(new THREE.Vector3(.2,.12,next==='alveoli'?1.85:5.4)));controls.update()}
 }
 root.querySelectorAll('[data-resp-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.respMode)));
 function setExcretoryMode(next){if(kind!=='excretory')return;mode=next;selection=null;specific=null;root.querySelectorAll('[data-exc-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.excMode===next)));root.querySelectorAll('[data-part]').forEach(b=>{b.setAttribute('aria-pressed','false');b.hidden=nephronParts.has(b.dataset.part)!==(next==='nephron')});info.textContent=next==='nephron'?'Magnified nephron: choose a filtration or reabsorption structure. This close-up is not to scale.':next==='cutaway'?'Kidney cutaway: inspect cortex, medulla, pelvis and the blood supply.':'Urinary organs: follow blood into the kidneys and urine toward the bladder.';applyVisual();if(camera){const target=next==='nephron'?new THREE.Vector3(2.42,0,0):next==='cutaway'?new THREE.Vector3(-.62,.44,0):new THREE.Vector3();controls.target.copy(target);camera.position.copy(target.clone().add(new THREE.Vector3(.2,.1,next==='nephron'?2.3:next==='cutaway'?2.2:4.55)));controls.update()}}
 root.querySelectorAll('[data-exc-mode]').forEach(b=>b.addEventListener('click',()=>setExcretoryMode(b.dataset.excMode)));
 function initMuscleHotspots(){if(kind!=='muscular')return;const layer=root.querySelector('.body-atlas-hotspots');if(!layer)return;
  muscleHotspotSpecs.forEach(([part,x,y,z,side])=>{const button=document.createElement('button');button.type='button';button.className='body-atlas-hotspot';button.setAttribute('aria-label','Select '+muscleFacts[part].name);button.setAttribute('aria-pressed','false');button.title=muscleFacts[part].name;button.addEventListener('pointerdown',e=>e.stopPropagation());button.addEventListener('pointerup',e=>e.stopPropagation());button.addEventListener('click',()=>changeSelection(part));layer.append(button);hotspotButtons.push({button,part,side,point:new THREE.Vector3(x,y,z)})})
 }
 function updateMuscleHotspots(){if(kind!=='muscular'||!camera)return;const dir=camera.position.clone().sub(controls.target).normalize(),front=dir.z>.68,back=dir.z<-.68,w=stage.clientWidth,h=stage.clientHeight,used=[];
  for(const hot of hotspotButtons){const p=hot.point.clone().project(camera),x=(p.x+1)*w/2,y=(1-p.y)*h/2;let visible=(hot.side==='front'?front:back)&&p.z>-1&&p.z<1&&x>22&&x<w-22&&y>22&&y<h-22;
   if(visible&&used.some(([u,v])=>Math.hypot(x-u,y-v)<40))visible=false;
   hot.button.hidden=!visible;if(visible){hot.button.style.left=x+'px';hot.button.style.top=y+'px';used.push([x,y])}}
 }

 function changeSelection(part,name=null){selection=part;specific=name;root.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.part===part)));
  info.innerHTML=kind==='muscular'?(part&&muscleFacts[part]?`<span class="body-atlas-info-kicker">MUSCLE PROFILE</span><h3>${muscleFacts[part].name}</h3><dl class="muscle-facts"><div><dt>Location</dt><dd>${muscleFacts[part].location}</dd></div><div><dt>Main function</dt><dd>${muscleFacts[part].function}</dd></div><div><dt>Movement</dt><dd>${muscleFacts[part].movement}</dd></div><div><dt>Real-life example</dt><dd>${muscleFacts[part].example}</dd></div><div><dt>Muscle type</dt><dd>Skeletal muscle</dd></div></dl><div class="muscle-try"><b>Try it</b><p>${muscleFacts[part].try}</p></div>`:'<span class="body-atlas-info-kicker">SELECT A MUSCLE</span><p>Choose a muscle on the model to discover its location, function and role in movement.</p>'):part?`<strong>${name||part}</strong><div>${notes[kind][part]}</div>${kind==='integumentary'?'<small>Choose another label or tap a structure in the model to compare.</small>':name?`<small>Selected structure · ${part}</small>`:'<small>Click a highlighted structure to identify it more closely.</small>'}`:'Choose a region or tap the model to investigate its structures.';
  hotspotButtons.forEach(({button,part:hotspotPart})=>button.setAttribute('aria-pressed',String(hotspotPart===part)));if(kind==='muscular'&&part){const more=root.querySelector('.body-atlas-more');if(more&&[...more.querySelectorAll('[data-part]')].some(b=>b.dataset.part===part))more.open=true}if(!model)return;const selected=meshes.filter(m=>(m.userData.atlasPart||partFor(m.name,kind))===part&&(!name||m.name===name));
  applyVisual();if(kind==='muscular'){const spec=muscleHotspotSpecs.find(s=>s[0]===part);let target=null,back=false;if(spec){target=new THREE.Vector3(spec[1],spec[2],spec[3]);back=spec[4]==='back'}else if(selected.length){const box=new THREE.Box3();selected.forEach(m=>box.expandByObject(m));target=box.getCenter(new THREE.Vector3());back=target.z<-.02}if(target&&camera){cameraGoal={target,position:target.clone().add(new THREE.Vector3(0,0,back?-1:1).multiplyScalar(4.0)).add(new THREE.Vector3(0,.06,0))}}else cameraGoal=null;return}if(part&&selected.length&&camera){const box=new THREE.Box3();selected.forEach(m=>box.expandByObject(m));const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());const muscleClose=kind==='muscular'&&part==='Abdominals';const skin=kind==='integumentary';const distance=skin?(['Epidermis','Dermis','Subcutaneous layer'].includes(part)?4.35:['Hair follicle','Nerves'].includes(part)?4.05:3.7):kind==='respiratory'&&mode==='alveoli'?(name?1.5:1.9):kind==='excretory'?(mode==='nephron'?1.9:mode==='cutaway'?2.6:4.2):kind==='muscular'?THREE.MathUtils.clamp(Math.max(size.x,size.y,size.z)*3+1.5,2.2,4.8):name?THREE.MathUtils.clamp(Math.max(size.x,size.y,size.z)*2.7,2.2,4.3):5.4;const target=skin?center.clone().add(new THREE.Vector3(0,0,-.12)):kind==='respiratory'&&mode==='alveoli'||kind==='excretory'||kind==='muscular'?center:name?center:center.multiplyScalar(.18);const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(distance);if(skin){cameraGoal={target,position:target.clone().add(offset)}}else{controls.target.copy(target);camera.position.copy(target.clone().add(offset));controls.update()}}
 }
 root.querySelectorAll('[data-part]').forEach(b=>b.addEventListener('click',()=>{if(kind==='excretory'){const part=b.dataset.part,wanted=nephronParts.has(part)?'nephron':['Renal cortex','Renal medulla','Renal pelvis'].includes(part)?'cutaway':mode==='cutaway'?'cutaway':'organs';if(mode!==wanted)setExcretoryMode(wanted)}if(kind==='respiratory'){const part=b.dataset.part,wanted=part==='Alveoli'?'alveoli':['Bronchi','Bronchioles'].includes(part)?'inside':'outside';if(mode!==wanted)setMode(wanted)}changeSelection(b.dataset.part)}));
 function view(which){if(!camera)return;if(which==='spin'&&kind==='integumentary'){controls.autoRotate=!controls.autoRotate;controls.autoRotateSpeed=1.3;root.querySelector('[data-view=spin]').setAttribute('aria-pressed',String(controls.autoRotate));return}cameraGoal=null;if(which==='reset'){if(kind==='integumentary'){controls.autoRotate=false;root.querySelector('[data-view=spin]').setAttribute('aria-pressed','false')}if(kind==='respiratory')setMode('outside');else if(kind==='excretory')setExcretoryMode('organs');else changeSelection(null);if(kind==='integumentary'){cameraGoal={target:new THREE.Vector3(),position:new THREE.Vector3(.2,.12,4.8)}}else{controls.target.set(0,kind==='muscular'?-.13:0,0);camera.position.set(kind==='muscular'?0:.35,kind==='muscular'?-.13:.1,kind==='excretory'?4.55:kind==='muscular'?5.3:5.4)}}else if(which==='in'||which==='out'){const radius=camera.position.clone().sub(controls.target).multiplyScalar(which==='in'?.8:1.25);camera.position.copy(controls.target.clone().add(radius))}else{const radius=camera.position.distanceTo(controls.target);if(kind==='integumentary'){const z=which==='front'?Math.max(radius,3.2):-Math.max(radius,3.2);cameraGoal={target:controls.target.clone(),position:controls.target.clone().add(new THREE.Vector3(which==='front'?.18:-.18,.12,z))}}else camera.position.copy(controls.target.clone().add(new THREE.Vector3(which==='front'?.2:-.2,.1,which==='front'?radius:-radius)))}controls.update()}
 root.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
 stage.addEventListener('keydown',e=>{if(!camera||kind==='muscular'&&e.target!==stage)return;const delta=.12,dir=camera.position.clone().sub(controls.target);if(e.key==='ArrowLeft'||e.key==='ArrowRight'){dir.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?delta:-delta)}else if(e.key==='ArrowUp'||e.key==='ArrowDown'){const s=new THREE.Spherical().setFromVector3(dir);s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-delta:delta),.35,Math.PI-.35);dir.setFromSpherical(s)}else if(e.key==='+'||e.key==='='){view('in');e.preventDefault();return}else if(e.key==='-'){view('out');e.preventDefault();return}else return;camera.position.copy(controls.target.clone().add(dir));controls.update();e.preventDefault()});
 let pointerStart=null;stage.addEventListener('pointerdown',e=>{cameraGoal=null;pointerStart=[e.clientX,e.clientY]});stage.addEventListener('wheel',()=>{cameraGoal=null},{passive:true});stage.addEventListener('pointerup',e=>{if(kind==='muscular'&&e.target.closest('.body-atlas-hotspot')){pointerStart=null;return}if(!model||!pointerStart)return;const moved=Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>6;pointerStart=null;if(moved)return;const rect=stage.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const candidates=meshes.filter(m=>m.visible&&(kind==='integumentary'?!!m.userData.atlasPart:m.material.opacity>.2));const hits=raycaster.intersectObjects(candidates,false);const hit=kind==='integumentary'?(hits.find(h=>h.object.material.opacity>.2&&!['Epidermis','Dermis','Subcutaneous layer'].includes(h.object.userData.atlasPart))||hits[0]):hits[0];if(hit){const mesh=hit.object;const part=mesh.userData.atlasPart||partFor(mesh.name,kind);if(part){if(kind==='excretory'){const wanted=nephronParts.has(part)?'nephron':['Renal cortex','Renal medulla','Renal pelvis'].includes(part)?'cutaway':mode==='cutaway'?'cutaway':'organs';if(mode!==wanted)setExcretoryMode(wanted)}changeSelection(part,kind==='integumentary'||kind==='excretory'||kind==='muscular'?null:mesh.name)}}});
 window.__inneruAtlasLive={kind,get meshes(){return meshes},get shell(){return bodyShell},get camera(){return camera},get controls(){return controls},get renderer(){return renderer},get selection(){return selection},get goal(){return cameraGoal}};
 function cleanup(){disposed=true;observer?.disconnect();resize?.disconnect();clearTimeout(loadTimer);cancelAnimationFrame(frame);controls?.dispose();model?.traverse(o=>{o.geometry?.dispose();if(o.material){for(const mat of (Array.isArray(o.material)?o.material:[o.material]))mat.dispose()}});renderer?.dispose();renderer?.domElement?.remove()}
 currentCleanup=cleanup;
 if(!window.WebGLRenderingContext){fallback();return}
 async function load(){if(disposed)return;loadTimer=setTimeout(fallback,15000);try{
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=kind==='integumentary'?1.15:kind==='excretory'?1.03:1.5;renderer.setSize(stage.clientWidth,stage.clientHeight);stage.prepend(renderer.domElement);
   scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(40,stage.clientWidth/stage.clientHeight,.1,80);camera.position.set(kind==='integumentary'?.2:kind==='muscular'?0:.35,kind==='muscular'?-.13:.1,kind==='integumentary'?4.8:kind==='excretory'?4.55:kind==='muscular'?5.3:5.4);controls=new OrbitControls(camera,renderer.domElement);if(kind==='muscular')controls.target.set(0,-.13,0);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1.4;controls.maxDistance=9;controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI-.3;controls.update();
   scene.add(new THREE.HemisphereLight(0xfff4e8,kind==='integumentary'?0x8a6672:0x25485b,kind==='integumentary'?1.7:kind==='excretory'?1.8:2.8));const key=new THREE.DirectionalLight(0xffe3cb,kind==='integumentary'?1.6:kind==='excretory'?1.8:2.6);key.position.set(-4,5,6);scene.add(key);const rim=new THREE.DirectionalLight(kind==='integumentary'?0xffd6bc:0x74b8c1,kind==='integumentary'?1.15:kind==='excretory'?1.2:1.6);rim.position.set(3,2,-4);scene.add(rim);if(kind==='integumentary'){const fill=new THREE.DirectionalLight(0xffeadb,.9);fill.position.set(-3,0,-5);scene.add(fill)}
   const loader=new GLTFLoader(),gltf=await loader.loadAsync(`assets/${kind}-atlas.glb`);if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});return}model=gltf.scene;if(kind==='muscular'){try{const additions=await loader.loadAsync('assets/muscle-additions.glb');if(disposed){additions.scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});return}model.add(additions.scene)}catch(error){console.warn('Muscle detail unavailable:',error);throw error}}model.traverse(o=>{if(!o.isMesh)return;o.material=o.material.clone();o.material.side=THREE.DoubleSide;o.material.roughness=.72;if(o.name==='Silhouette'&&kind==='muscular'&&model.getObjectByName('Silhouette clean 1')){o.visible=false;return}if(kind==='muscular'&&o.name.startsWith('Sports shorts')){o.material.transparent=false;o.material.depthWrite=true;o.material.roughness=.94;o.renderOrder=5;o.raycast=()=>{};return}if(o.name.startsWith('Silhouette')){o.material.transparent=true;o.material.opacity=kind==='muscular'?.58:.085;o.material.depthWrite=false;o.raycast=()=>{};if(kind==='muscular')bodyShell=o;}else{o.userData.atlasPart=partFor(kind==='integumentary'?(o.userData.name||o.name):o.name,kind);if(kind==='excretory'){o.geometry.computeBoundingBox();o.userData.isNephron=o.geometry.boundingBox.getCenter(new THREE.Vector3()).x>1.4}if(kind==='muscular'){o.material.metalness=0;o.material.roughness=.88;o.material.color.setHex(/Masseter|Temporalis/.test(o.name)?0xdba898:0xf3977e);}meshes.push(o)}});if(kind==='muscular'&&bodyShell?.name.startsWith('Silhouette clean')){const oldShell=model.getObjectByName('Silhouette');if(oldShell){oldShell.parent.remove(oldShell);oldShell.geometry.dispose();oldShell.material.dispose()}}scene.add(model);
   if(kind==='integumentary'||kind==='excretory'){const missing=bodyAtlasGroups[kind].filter(part=>!meshes.some(m=>m.userData.atlasPart===part));if(missing.length)throw new Error('Unmapped '+kind+' structures: '+missing.join(', '))}
   if(kind==='muscular'){const missing=bodyAtlasGroups.muscular.filter(part=>!meshes.some(m=>m.userData.atlasPart===part));if(missing.length)throw new Error('Unmapped muscular structures: '+missing.join(', '));initMuscleHotspots()}
   clearTimeout(loadTimer);root.querySelector('.body-atlas-loading')?.remove();error.hidden=true;const fallbackArt=root.querySelector('.body-atlas-fallback');if(fallbackArt)fallbackArt.hidden=true;root.querySelectorAll('[data-view]').forEach(b=>{b.disabled=false;b.removeAttribute('title')});applyVisual();const queuedSelection=selection,queuedSpecific=specific;if(kind==='respiratory'&&mode==='alveoli')setMode('alveoli');if(kind==='excretory')setExcretoryMode(mode);if(queuedSelection)changeSelection(queuedSelection,queuedSpecific);resize=new ResizeObserver(()=>{if(!renderer?.domElement?.isConnected)return;const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)});resize.observe(stage);
   let lastRender=0;function draw(now=0){if(disposed||!stage.isConnected){cleanup();return}frame=requestAnimationFrame(draw);if(cameraGoal){controls.target.lerp(cameraGoal.target,.13);camera.position.lerp(cameraGoal.position,.13);if(camera.position.distanceTo(cameraGoal.position)<.012&&controls.target.distanceTo(cameraGoal.target)<.012)cameraGoal=null}controls.update();if(kind!=='muscular'||(!document.hidden&&now-lastRender>30)){/* the parentheses are intentional: non-muscular atlases render every frame, while the muscular one is throttled to ~30 ms because it also lerps mesh opacities */if(kind==='muscular'){for(const mesh of meshes){const goal=mesh.userData.targetOpacity??1;mesh.material.opacity+= (goal-mesh.material.opacity)*.25;if(Math.abs(goal-mesh.material.opacity)<.005)mesh.material.opacity=goal}updateMuscleHotspots()}renderer.render(scene,camera);lastRender=now}}draw();
  }catch(err){console.error(`${kind} 3D model:`,err);fallback();cleanup()}}
 if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();load()}},{rootMargin:'300px'});observer.observe(stage)}else load();
};
const shown=document.querySelector('[data-atlas]');if(shown)window.mountBodyAtlas(shown.dataset.atlas);

/* Debug/testing surface: reports the live state of the mounted atlas. */
window.inneruAtlasState=function(){const s=window.__inneruAtlasLive;if(!s)return null;return{kind:s.kind,selection:s.selection,meshes:s.meshes.length,
 shellOpacity:s.shell?s.shell.material.opacity:null,
 focused:s.meshes.filter(m=>m.material.opacity>.85&&m.visible).map(m=>m.name),
 faded:s.meshes.filter(m=>m.visible&&m.material.opacity<.2).length,
 camera:s.camera?s.camera.position.toArray().map(n=>+n.toFixed(2)):null,canvas:!!s.renderer,rotatable:!!(s.controls&&s.controls.enableRotate!==false),focusedTarget:s.meshes.filter(m=>m.visible&&(m.userData.targetOpacity??1)>.85).length,fadedTarget:s.meshes.filter(m=>m.visible&&(m.userData.targetOpacity??1)<.2).length,goal:s.goal?s.goal.position.toArray().map(n=>+n.toFixed(2)):null}};
