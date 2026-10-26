/* User-activated speech. The larger reader/voice engine loads only when needed. */
(() => {
 'use strict';
 const engine=window.speechSynthesis,supported=!!engine&&typeof window.SpeechSynthesisUtterance==='function';
 const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
 const roots=new Map();let active=null,serial=0,pending=null;
 const tr=s=>window.InneruLocale?.t(s)||s;
 const source=el=>(window.InneruLocale?InneruLocale.source(el):el?.textContent||'').trim().replace(/_/g,' ').replace(/\s+/g,' ');
 const pressed=(root,key)=>root.querySelector(key+'[aria-pressed="true"]');
 const configs=[
  {root:'[data-skin-explorer]',info:'.body-atlas-info',name(root,info){const part=pressed(root,'[data-part]'),dermal=pressed(root,'[data-dermis-part]'),name=source(info.querySelector('h3'));return part&&name===(dermal?.dataset.dermisPart||part.dataset.part)?name:'';}},
  {root:'.arm-lab',info:'.arm-lab-anatomy',name(root){return {biceps:'Biceps brachii',triceps:'Triceps brachii',tendons:'Tendons',bones:'Humerus, radius, ulna'}[pressed(root,'[data-arm-part]')?.dataset.armPart]||'';}},
  {root:'.exc-explorer',info:'.exc-structure-info',name(root,info){const part=pressed(root,'[data-structure]'),name=source(info.querySelector('h3'));return part&&name===part.dataset.structure?name:'';}},
  {root:'.heart-lab',info:'#circ-vessel-info',name(root,info){return pressed(root,'[data-heart-structure]')?source(info.querySelector('h3')):'';}},
  {root:'.body-atlas[data-atlas]:not([data-skin-explorer])',info:'.body-atlas-info',name(root,info){return pressed(root,'[data-part]')?source(info.querySelector(':scope > strong,:scope > h3')):'';}}
 ];
 function load(){
  if(window.InneruSpeechCore)return Promise.resolve(InneruSpeechCore);
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='speech-core.js?v=compact-audio-1';let timer;
   const fail=()=>{clearTimeout(timer);script.remove();pending=null;reject(new Error('Audio controls could not load. Reconnect and try again.'));};
   script.onload=()=>{clearTimeout(timer);resolve(window.InneruSpeechCore);};script.onerror=fail;timer=setTimeout(fail,15000);document.body.append(script);
  });return pending;
 }
 function stop(){++serial;if(!active)return;const old=active;active=null;old.abort.abort();try{engine?.cancel();}catch{}old.button?.setAttribute('aria-pressed','false');old.reset?.();if(old.status)old.status.textContent='';}
 function start(options){
  if(active?.button===options.button){stop();return;}stop();
  if(!supported){options.status.textContent=tr('Read-aloud is unavailable in this browser. You can read all instructions on screen.');return;}
  const ticket=++serial,request={...options,abort:new AbortController()};active=request;options.button.setAttribute('aria-pressed','true');options.status.textContent=tr('Preparing read-aloud…');
  const finish=message=>{if(ticket!==serial)return;active=null;request.abort.abort();options.button.setAttribute('aria-pressed','false');options.reset?.();options.status.textContent=tr(message);};
  load().then(core=>{if(ticket!==serial||!options.element.isConnected)return;core.speak(Object.assign(request,{signal:request.abort.signal,onStart(){if(ticket!==serial)return;options.started?.();options.status.textContent=tr(options.name?'Pronouncing: ':'Reading. Select Listen / Stop to stop.')+(options.name?tr(options.name):'');},finish}));}).catch(()=>finish('Audio controls could not load. Reconnect and try again.'));
 }
 function update(entry){const name=entry.config.name(entry.root,entry.info);if(name===entry.name)return;if(active?.entry===entry)stop();entry.name=name;entry.button.disabled=!supported||!name;entry.button.setAttribute('aria-label',name?'Pronounce '+name:'Select a structure to hear its name');entry.label.textContent=name||'Choose a structure in this model.';entry.status.textContent=supported?'':'Pronunciation is unavailable in this browser.';}
 function mount(root,config){
  if(roots.has(root))return;const info=root.querySelector(config.info);if(!info)return;
  const box=document.createElement('div');box.className='structure-audio';box.dataset.noTerms='';box.innerHTML='<button type="button" class="structure-audio-button" aria-pressed="false">'+icon+'<span>Pronounce structure</span></button><small class="structure-audio-name"></small><span class="structure-audio-status" role="status"></span>';info.after(box);
  const entry={root,info,config,box,button:box.querySelector('button'),label:box.querySelector('small'),status:box.querySelector('[role=status]'),name:null};
  entry.button.onclick=()=>{update(entry);if(!entry.name||!supported)return;start({entry,element:info,name:entry.name,button:entry.button,status:entry.status,started:()=>entry.button.querySelector('span').textContent='Stop pronunciation',reset:()=>entry.button.querySelector('span').textContent='Pronounce structure'});};
  const observer=new MutationObserver(()=>update(entry));observer.observe(info,{subtree:true,childList:true,characterData:true});observer.observe(root,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});entry.observer=observer;roots.set(root,entry);update(entry);
 }
 function refresh(){for(const [root,entry]of roots)if(!root.isConnected){if(active?.entry===entry)stop();entry.observer.disconnect();roots.delete(root);}for(const config of configs)document.querySelectorAll(config.root).forEach(root=>mount(root,config));}
 let queued=false;function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});}
 if(typeof layout==='function'){const previous=layout;layout=function(...args){stop();const value=previous(...args);schedule();return value;};}
 const app=document.getElementById('app');if(app)new MutationObserver(schedule).observe(app,{childList:true,subtree:true});
 window.InneruSpeech={stop,read(element,button,status){if(!element?.isConnected||!element.matches('[data-iu-guide-text],[data-support-reader]')||element.closest('input,textarea,[data-iu-private]'))return;start({element,button,status});},changed(target){if(active&&(!active.element.isConnected||window.InneruSpeechCore?.changed(active,target)))stop();}};
 window.addEventListener('hashchange',stop);window.addEventListener('pagehide',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});document.addEventListener('keydown',event=>{if(event.key==='Escape')stop();});document.addEventListener('inneru-instruction-change',stop);
 function ready(core){core?.refresh();}
 function language(){stop();for(const e of roots.values())e.status.textContent=supported?'':'Pronunciation is unavailable in this browser.';schedule();if(document.documentElement.lang==='ar')load().then(ready).catch(()=>{});}
 document.addEventListener('inneru-preferences-change',language);document.addEventListener('inneru-language-ready',()=>{if(document.documentElement.lang==='ar')load().then(ready).catch(()=>{});});refresh();language();
})();
