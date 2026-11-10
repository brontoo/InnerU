/* Optional inspection only. No reward, evidence, mission or account writes. */
const InnerUMuscleRotator=(()=>{
 'use strict';
 let modulePromise;
 // Existing atlas descriptions; camera anchors reference the unchanged anatomical asset.
 const muscles=[{"name": "Sternocleidomastoid", "location": "At each side of the neck.", "function": "Positions the head.", "movement": "Turns or tilts the head.", "example": "Looking over your shoulder.", "id": "0", "view": "front", "point": [0.0311, 0.6208, 0.051], "span": [0.0611, 0.201, 0.1194]},
  {"name": "Masseter", "location": "At the side of the jaw.", "function": "Closes the jaw.", "movement": "Raises the lower jaw.", "example": "Chewing food.", "id": "1", "view": "front", "point": [0.0487, 0.6888, 0.0469], "span": [0.0279, 0.0667, 0.0472]},
  {"name": "Temporalis", "location": "At each temple, above the ear.", "function": "Helps close the jaw.", "movement": "Raises and draws back the lower jaw.", "example": "Biting a sandwich.", "id": "2", "view": "side", "point": [0.0769, 0.7472, -0.0034], "span": [0.0391, 0.1159, 0.1138]},
  {"name": "Deltoid", "location": "Around the shoulder.", "function": "Raises and positions the arm.", "movement": "Lifts the arm out to the side.", "example": "Reaching for a book on a shelf.", "id": "3", "view": "front", "point": [0.155, 0.4898, 0.0155], "span": [0.1444, 0.1676, 0.1186]},
  {"name": "Pectoralis major", "location": "Across the front of the upper chest.", "function": "Moves the upper arm toward the body.", "movement": "Brings the arm forward and inward.", "example": "Pushing a door open.", "id": "4", "view": "front", "point": [0.0995, 0.4386, 0.1136], "span": [0.1894, 0.2311, 0.1384]},
  {"name": "Biceps brachii", "location": "At the front of the upper arm.", "function": "Helps bend the elbow and turn the forearm.", "movement": "Flexes the elbow.", "example": "Lifting a backpack toward your body.", "id": "5", "view": "front", "point": [0.1825, 0.385, 0.0035], "span": [0.0946, 0.3453, 0.0415]},
  {"name": "Triceps brachii", "location": "At the back of the upper arm.", "function": "Straightens the elbow.", "movement": "Extends the elbow.", "example": "Pushing yourself away from a desk.", "id": "6", "view": "back", "point": [0.1813, 0.3833, -0.087], "span": [0.0933, 0.2714, 0.0531]},
  {"name": "Forearm muscle groups", "location": "Between the elbow and wrist.", "function": "Move the wrist and fingers.", "movement": "Flexes and extends the wrist and fingers.", "example": "Gripping a pencil.", "id": "7", "view": "front", "point": [0.2282, 0.1374, 0.0306], "span": [0.0878, 0.2768, 0.0655]},
  {"name": "Trapezius", "location": "Across the upper back and neck.", "function": "Moves and steadies the shoulder blades.", "movement": "Shrugs the shoulders.", "example": "Carrying a school bag comfortably.", "id": "8", "view": "back", "point": [0.0797, 0.4985, -0.1302], "span": [0.1671, 0.4519, 0.1251]},
  {"name": "Latissimus dorsi", "location": "Across the broad lower and middle back.", "function": "Pulls the arm back and inward.", "movement": "Extends and adducts the shoulder.", "example": "Pulling a door toward you.", "id": "9", "view": "back", "point": [0.0911, 0.2801, -0.13], "span": [0.1871, 0.4104, 0.1018]},
  {"name": "Rectus abdominis", "location": "A paired strip along the front of the abdomen.", "function": "Flexes and braces the trunk.", "movement": "Bends the trunk forward.", "example": "Sitting up from a reclined position.", "id": "10", "view": "front", "point": [0.0424, 0.1975, 0.1099], "span": [0.0787, 0.4082, 0.0748]},
  {"name": "External oblique", "location": "Along the sides of the abdomen.", "function": "Helps rotate and brace the trunk.", "movement": "Turns the torso.", "example": "Turning to reach something beside you.", "id": "11", "view": "front", "point": [0.0715, 0.2213, 0.1129], "span": [0.1359, 0.416, 0.1818]},
  {"name": "Gluteus maximus", "location": "At the back of the hip.", "function": "Extends the hip.", "movement": "Moves the thigh backward.", "example": "Standing up from a chair.", "id": "12", "view": "back", "point": [0.0719, 0.0184, -0.1257], "span": [0.1469, 0.2648, 0.0979]},
  {"name": "Quadriceps", "location": "At the front of the thigh.", "function": "Straightens the knee.", "movement": "Extends the knee.", "example": "Climbing a step.", "id": "13", "view": "front", "point": [0.0973, -0.1888, 0.0467], "span": [0.1247, 0.5564, 0.095]},
  {"name": "Hamstrings", "location": "At the back of the thigh.", "function": "Bend the knee and help extend the hip.", "movement": "Flexes the knee.", "example": "Pulling your heel back while walking.", "id": "14", "view": "back", "point": [0.0699, -0.2578, -0.0875], "span": [0.1134, 0.4816, 0.0852]},
  {"name": "Gastrocnemius", "location": "At the back of the lower leg.", "function": "Helps push the foot downward.", "movement": "Points the foot and helps bend the knee.", "example": "Pushing off the ground while walking.", "id": "15", "view": "back", "point": [0.0694, -0.5043, -0.1], "span": [0.0952, 0.3093, 0.0869]},
  {"name": "Tibialis anterior", "location": "Along the front of the shin.", "function": "Lifts the front of the foot.", "movement": "Dorsiflexes the ankle.", "example": "Clearing the toes while stepping.", "id": "16", "view": "front", "point": [0.0919, -0.6235, 0.0438], "span": [0.0498, 0.3941, 0.0768]}];
 const tr=text=>window.InneruLocale?.t(text)||text;
 function markup(){return `<section class="muscle-rotator" id="mq-3d" aria-labelledby="mq-3d-title" data-iu-locale="muscle">
 <header><div><span class="eyebrow">ANATOMY · TURN AND EXPLORE</span><h2 id="mq-3d-title">Explore muscles in 3D</h2><p>Turn the body to compare the muscles at the front, sides and back.</p></div><span class="muscle-rotator-tag">360° · whole-body view</span></header>
 <div class="muscle-rotator-workbench"><div class="muscle-rotator-stage" tabindex="-1" role="group" aria-label="Interactive muscular anatomy. Arrow keys turn the model; plus and minus zoom; Home resets the view.">
 <img class="muscle-rotator-poster" src="assets/muscular/rotational-atlas.webp" alt="Anatomical muscle atlas with red muscle tissue and pale connective tissue and skeletal support." width="700" height="850" loading="lazy" decoding="async">
 <span class="muscle-rotator-label" aria-hidden="true" hidden></span><div class="muscle-rotator-launch"><button type="button" class="btn" data-muscle-open>Open 3D model</button></div></div>
 <aside class="muscle-rotator-side" aria-label="Muscular model controls and details"><h3>Model controls</h3><div class="muscle-rotator-controls" hidden><div role="group" aria-label="Model view"><button type="button" data-muscle-view="front" aria-pressed="true">Front view</button><button type="button" data-muscle-view="back" aria-pressed="false">Back view</button><button type="button" data-muscle-view="side" aria-pressed="false">Side view</button></div>
 <div role="group" aria-label="Turn and zoom"><button type="button" data-muscle-turn="left">Turn left</button><button type="button" data-muscle-turn="right">Turn right</button><button type="button" data-muscle-zoom="in" aria-label="Zoom in">＋</button><button type="button" data-muscle-zoom="out" aria-label="Zoom out">−</button><button type="button" data-muscle-reset>Reset view</button><button type="button" data-muscle-spin aria-pressed="false">Auto rotate</button><button type="button" data-muscle-focus disabled>Focus structure</button><button type="button" data-muscle-all>Show all</button><button type="button" data-muscle-labels aria-pressed="true">Labels</button></div></div>
 <p class="muscle-rotator-status" role="status" aria-live="polite">Open the model when you are ready. Drag or use the turn buttons to explore.</p>
 <div class="muscle-rotator-examine"><h3>Examine a muscle</h3><p>Choose a muscle to read its location and action. Use Focus structure for a closer view.</p><div class="muscle-rotator-parts" role="group" aria-label="Major muscles">${muscles.map(m=>`<button type="button" data-muscle-select="${m.id}" aria-pressed="false">${m.name}</button>`).join('')}</div></div>
 <div class="muscle-rotator-info" aria-live="polite"><span class="eyebrow">MUSCLE PROFILE</span><h3>Choose a muscle</h3><p>Select a muscle above to explore its location, function and role in movement.</p></div></aside></div>
 <footer><div class="muscle-rotator-legend"><span><i class="muscle-tissue" aria-hidden="true"></i>Muscle tissue</span><span><i class="muscle-connective" aria-hidden="true"></i>Tendons and fascia</span><span><i class="muscle-bone" aria-hidden="true"></i>Skeletal support</span></div><details><summary>Model sources and limits</summary><p>Atlas-based teaching model. Shapes and surface fibres are simplified; this is not a patient scan.</p><p><a href="assets/muscular/ATTRIBUTION.md" target="_blank" rel="noopener">BodyParts3D / Z-Anatomy · attribution and licenses</a></p></details></footer></section>`;}
 function mount(root=document.querySelector('.muscle-rotator')){
  if(!root||root.dataset.muscleMounted)return;
  root.dataset.muscleMounted='true';const abort=new AbortController(),signal=abort.signal;
  const open=root.querySelector('[data-muscle-open]'),status=root.querySelector('.muscle-rotator-status');
  let busy=false,view=null,disposed=false,selected=null;
  const info=root.querySelector('.muscle-rotator-info'),focus=root.querySelector('[data-muscle-focus]');
  function selection(id){
   selected=muscles.find(m=>m.id===id)||null;
   root.querySelectorAll('[data-muscle-select]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.muscleSelect===selected?.id)));
   focus.disabled=!selected||!view;
   info.innerHTML=selected?`<span class="eyebrow">MUSCLE PROFILE</span><h3>${selected.name}</h3><dl><div><dt>Location</dt><dd>${selected.location}</dd></div><div><dt>Main function</dt><dd>${selected.function}</dd></div><div><dt>Movement</dt><dd>${selected.movement}</dd></div><div><dt>Real-life example</dt><dd>${selected.example}</dd></div><div><dt>Muscle type</dt><dd>Skeletal muscle</dd></div></dl>`:'<span class="eyebrow">MUSCLE PROFILE</span><h3>Choose a muscle</h3><p>Select a muscle above to explore its location, function and role in movement.</p>';
   root.dispatchEvent(new CustomEvent('muscle-rotator-selection',{detail:selected}));
  }
  root.querySelectorAll('[data-muscle-select]').forEach(b=>b.addEventListener('click',()=>selection(b.dataset.muscleSelect),{signal}));
  root.querySelector('[data-muscle-all]').addEventListener('click',()=>selection(null),{signal});
  async function start(){
   if(busy||view||disposed)return;busy=true;open.disabled=true;root.setAttribute('aria-busy','true');status.textContent=tr('Loading muscular anatomy…');
   try{
    modulePromise||=import('./muscle-rotator-view.js?v=sidebar-1').catch(error=>{modulePromise=null;throw error;});
    const module=await modulePromise;
    if(disposed||!root.isConnected)return;
    const built=await module.mountMuscleRotator(root);
    if(disposed||!root.isConnected){built.dispose();return;}
    view=built;focus.disabled=!selected;if(selected)root.dispatchEvent(new CustomEvent('muscle-rotator-selection',{detail:selected}));root.dataset.muscleReady='true';root.querySelector('.muscle-rotator-controls').hidden=false;
    root.querySelector('.muscle-rotator-stage').tabIndex=0;root.querySelector('.muscle-rotator-stage').focus({preventScroll:true});status.textContent=tr('Model ready. Drag to turn, or use the buttons and arrow keys.');
   }catch(error){
    if(disposed)return;console.warn('Optional muscular model unavailable:',error);
    status.textContent=tr(/WebGL/i.test(error.message)?'3D is unavailable on this device. Use the anatomy illustration to keep exploring.':'The 3D model could not load. The anatomy illustration remains available. Reconnect and try again.');open.textContent=tr('Try 3D again');
   }finally{busy=false;if(!disposed){open.disabled=false;root.removeAttribute('aria-busy');}}
  }
  open.addEventListener('click',start,{signal});
  root.addEventListener('muscle-rotator-unavailable',()=>{view=null;focus.disabled=true;open.textContent=tr('Try 3D again');},{signal});
  const observer=new MutationObserver(()=>{if(!root.isConnected){disposed=true;abort.abort();observer.disconnect();view?.dispose();}});
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
 }
 return{markup,mount};
})();
