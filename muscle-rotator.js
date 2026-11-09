/* Optional inspection only. No reward, evidence, mission or account writes. */
const InnerUMuscleRotator=(()=>{
 'use strict';
 let modulePromise;
 const tr=text=>window.InneruLocale?.t(text)||text;
 function markup(){return `<section class="muscle-rotator" id="mq-3d" aria-labelledby="mq-3d-title" data-iu-locale="muscle">
 <header><div><span class="eyebrow">ANATOMY · TURN AND EXPLORE</span><h2 id="mq-3d-title">Explore muscles in 3D</h2><p>Turn the body to compare the muscles at the front, sides and back.</p></div><span class="muscle-rotator-tag">360° · whole-body view</span></header>
 <div class="muscle-rotator-stage" tabindex="-1" role="group" aria-label="Interactive muscular anatomy. Arrow keys turn the model; plus and minus zoom; Home resets the view.">
 <img class="muscle-rotator-poster" src="assets/muscular/rotational-atlas.webp" alt="Anatomical muscle atlas with red muscle tissue and pale connective tissue and skeletal support." width="700" height="850" loading="lazy" decoding="async">
 <div class="muscle-rotator-launch"><button type="button" class="btn" data-muscle-open>Open 3D model</button></div></div>
 <div class="muscle-rotator-controls" hidden><div role="group" aria-label="Model view"><button type="button" data-muscle-view="front" aria-pressed="true">Front view</button><button type="button" data-muscle-view="back" aria-pressed="false">Back view</button><button type="button" data-muscle-view="side" aria-pressed="false">Side view</button></div>
 <div role="group" aria-label="Turn and zoom"><button type="button" data-muscle-turn="left">Turn left</button><button type="button" data-muscle-turn="right">Turn right</button><button type="button" data-muscle-zoom="in" aria-label="Zoom in">＋</button><button type="button" data-muscle-zoom="out" aria-label="Zoom out">−</button><button type="button" data-muscle-reset>Reset view</button><button type="button" data-muscle-spin aria-pressed="false">Auto rotate</button></div></div>
 <p class="muscle-rotator-status" role="status" aria-live="polite">Open the model when you are ready. Drag or use the turn buttons to explore.</p>
 <footer><div class="muscle-rotator-legend"><span><i class="muscle-tissue" aria-hidden="true"></i>Muscle tissue</span><span><i class="muscle-connective" aria-hidden="true"></i>Tendons and fascia</span><span><i class="muscle-bone" aria-hidden="true"></i>Skeletal support</span></div><details><summary>Model sources and limits</summary><p>Atlas-based teaching model. Shapes and surface fibres are simplified; this is not a patient scan.</p><p><a href="assets/muscular/ATTRIBUTION.md" target="_blank" rel="noopener">BodyParts3D / Z-Anatomy · attribution and licenses</a></p></details></footer></section>`;}
 function mount(root=document.querySelector('.muscle-rotator')){
  if(!root||root.dataset.muscleMounted)return;
  root.dataset.muscleMounted='true';const abort=new AbortController(),signal=abort.signal;
  const open=root.querySelector('[data-muscle-open]'),status=root.querySelector('.muscle-rotator-status');
  let busy=false,view=null,disposed=false;
  async function start(){
   if(busy||view||disposed)return;busy=true;open.disabled=true;root.setAttribute('aria-busy','true');status.textContent=tr('Loading muscular anatomy…');
   try{
    modulePromise||=import('./muscle-rotator-view.js?v=rotation-1').catch(error=>{modulePromise=null;throw error;});
    const module=await modulePromise;
    if(disposed||!root.isConnected)return;
    const built=await module.mountMuscleRotator(root);
    if(disposed||!root.isConnected){built.dispose();return;}
    view=built;root.dataset.muscleReady='true';root.querySelector('.muscle-rotator-controls').hidden=false;
    root.querySelector('.muscle-rotator-stage').tabIndex=0;root.querySelector('.muscle-rotator-stage').focus({preventScroll:true});status.textContent=tr('Model ready. Drag to turn, or use the buttons and arrow keys.');
   }catch(error){
    if(disposed)return;console.warn('Optional muscular model unavailable:',error);
    status.textContent=tr(/WebGL/i.test(error.message)?'3D is unavailable on this device. Use the anatomy illustration to keep exploring.':'The 3D model could not load. The anatomy illustration remains available. Reconnect and try again.');open.textContent=tr('Try 3D again');
   }finally{busy=false;if(!disposed){open.disabled=false;root.removeAttribute('aria-busy');}}
  }
  open.addEventListener('click',start,{signal});
  root.addEventListener('muscle-rotator-unavailable',()=>{view=null;open.textContent=tr('Try 3D again');},{signal});
  const observer=new MutationObserver(()=>{if(!root.isConnected){disposed=true;abort.abort();observer.disconnect();view?.dispose();}});
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
 }
 return{markup,mount};
})();
