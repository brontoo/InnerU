/* User-activated anatomy pronunciation and instruction/feedback reading.
   Built-in voices only; never autoplay or read account fields. */
(() => {
  'use strict';
  const supported=!!window.speechSynthesis&&typeof window.SpeechSynthesisUtterance==='function';
  const engine=window.speechSynthesis;
  const roots=new Map();
  let current=null,serial=0,reader=null;
  const tr=value=>window.InneruLocale?.t(value)||value;
  const text=element=>(window.InneruLocale?InneruLocale.source(element):element?.textContent||'').trim().replace(/_/g,' ').replace(/\s+/g,' ');
  const pressed=(root,selector)=>root.querySelector(selector+'[aria-pressed="true"]');
  const configs=[
    {root:'[data-skin-explorer]',info:'.body-atlas-info',name(root,info){
      const part=pressed(root,'[data-part]');if(!part)return '';
      const dermal=pressed(root,'[data-dermis-part]');
      const name=text(info.querySelector('h3'));
      return name===(dermal?.dataset.dermisPart||part.dataset.part)?name:'';
    }},
    {root:'.arm-lab',info:'.arm-lab-anatomy',name(root){return {biceps:'Biceps brachii',triceps:'Triceps brachii',tendons:'Tendons',bones:'Humerus, radius, ulna'}[pressed(root,'[data-arm-part]')?.dataset.armPart]||'';}},
    {root:'.muscle-studio',info:'.muscle-studio-info',name(root,info){return pressed(root,'[data-muscle-part]')?text(info.querySelector('h3')):'';}},
    {root:'.exc-explorer',info:'.exc-structure-info',name(root,info){
      const part=pressed(root,'[data-structure]'),name=text(info.querySelector('h3'));
      return part&&name===part.dataset.structure?name:'';
    }},
    {root:'.heart-lab',info:'#circ-vessel-info',name(root,info){return root.querySelector('#heart-selected-label:not([hidden])')?text(info.querySelector('h3')):'';}},
    {root:'.body-atlas[data-atlas]:not([data-skin-explorer])',info:'.body-atlas-info',name(root,info){
      return pressed(root,'[data-part]')?text(info.querySelector(':scope > strong,:scope > h3')):'';
    }}
  ];
  const icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
  function resetButton(entry){entry.button.setAttribute('aria-pressed','false');entry.button.querySelector('span').textContent='Pronounce structure';}
  function stop(){
    ++serial;
    if(reader){const previous=reader;reader=null;try{engine?.cancel();}catch{}previous.button?.setAttribute('aria-pressed','false');if(previous.status)previous.status.textContent='';}
    if(!current)return;
    const entry=current;current=null;
    try{engine.cancel();}catch{}
    resetButton(entry);entry.status.textContent='';
  }
  function update(entry){
    const name=entry.config.name(entry.root,entry.info);
    if(name===entry.name)return;
    if(current===entry)stop();
    entry.name=name;
    entry.button.disabled=!supported||!name;
    entry.button.setAttribute('aria-label',name?'Pronounce '+name:'Select a structure to hear its name');
    entry.label.textContent=name||'Choose a structure in this model.';
    entry.status.textContent=supported?'':'Pronunciation is unavailable in this browser.';
  }
  function speak(entry){
    // Resolve from this model again at the instant of the click; never accept text.
    update(entry);
    if(!supported||!entry.name||!entry.root.isConnected)return;
    if(current===entry){stop();return;}
    stop();
    const request=++serial,name=tr(entry.name);
    const utterance=new window.SpeechSynthesisUtterance(name);
    utterance.lang=/[\u0600-\u06ff]/.test(name)?'ar-AE':'en-GB';utterance.rate=.85;
    const voices=engine.getVoices?.()||[];
    const prefix=utterance.lang==='ar-AE'?'ar':'en';
    const voice=voices.find(v=>v.localService&&v.lang?.toLowerCase().startsWith(prefix))||voices.find(v=>v.lang?.toLowerCase().startsWith(prefix));
    if(utterance.lang==='ar-AE'&&!voices.some(v=>/^ar[-_]/i.test(v.lang))){entry.status.textContent=tr('No suitable voice is available for this language. You can read all instructions on screen.');return;}
    if(voice)utterance.voice=voice;
    current=entry;entry.button.setAttribute('aria-pressed','true');entry.button.querySelector('span').textContent='Stop pronunciation';entry.status.textContent='Pronouncing: '+name;
    utterance.onend=()=>{if(request!==serial)return;current=null;resetButton(entry);entry.status.textContent='Pronunciation finished.';};
    utterance.onerror=event=>{if(request!==serial)return;current=null;resetButton(entry);entry.status.textContent=event.error==='not-allowed'?'Tap Pronounce structure to try again.':'Pronunciation is unavailable on this device.';};
    try{engine.speak(utterance);}catch{if(request===serial){current=null;resetButton(entry);entry.status.textContent='Pronunciation is unavailable on this device.';}}
  }
  function mount(root,config){
    if(roots.has(root))return;
    const info=root.querySelector(config.info);if(!info)return;
    const box=document.createElement('div');box.className='structure-audio';box.dataset.noTerms='';
    const button=document.createElement('button');button.type='button';button.className='structure-audio-button';button.setAttribute('aria-pressed','false');button.innerHTML=icon+'<span>Pronounce structure</span>';
    const label=document.createElement('small');label.className='structure-audio-name';
    const status=document.createElement('span');status.className='structure-audio-status';status.setAttribute('role','status');
    box.append(button,label,status);info.after(box);
    const entry={root,config,info,box,button,label,status,name:null,observer:null};
    button.addEventListener('click',()=>speak(entry));
    // Observe the information panel and semantic selection flags, not 3D frame styles.
    const observer=new MutationObserver(()=>update(entry));
    observer.observe(info,{subtree:true,childList:true,characterData:true});
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['aria-pressed']});
    entry.observer=observer;roots.set(root,entry);update(entry);
  }
  function refresh(){
    for(const [root,entry] of roots){if(!root.isConnected){if(current===entry)stop();entry.observer.disconnect();roots.delete(root);}}
    for(const config of configs)document.querySelectorAll(config.root).forEach(root=>mount(root,config));
  }
  let queued=false;
  function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh();});}
  if(typeof layout==='function'){const previousLayout=layout;layout=function(...args){stop();previousLayout(...args);schedule();};}
  const app=document.getElementById('app');
  if(app)new MutationObserver(changes=>{
    if(changes.some(change=>change.target===app||[...change.addedNodes,...change.removedNodes].some(node=>node.nodeType===1&&(node.matches?.('.body-atlas,.muscle-studio,.arm-lab,.exc-explorer,.heart-lab')||node.querySelector?.('.body-atlas,.muscle-studio,.arm-lab,.exc-explorer,.heart-lab')))))schedule();
  }).observe(app,{childList:true,subtree:true});
  window.addEventListener('hashchange',stop);
  window.addEventListener('pagehide',stop);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&(current||reader))stop();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  function read(element,button,status){
    if(reader?.button===button){stop();return;}
    stop();
    if(!element?.isConnected||!element.matches('[data-iu-guide-text],[data-support-reader]')||element.closest('input,textarea,[data-iu-private]'))return;
    if(!supported){status.textContent=tr('Read-aloud is unavailable in this browser. You can read all instructions on screen.');return;}
    const language=(element.closest('[lang]')?.getAttribute('lang')||document.documentElement.lang).startsWith('ar')?'ar':'en',voices=engine.getVoices?.()||[],voice=voices.find(v=>v.lang?.toLowerCase().startsWith(language)&&v.localService)||voices.find(v=>v.lang?.toLowerCase().startsWith(language));
    if(!voice){status.textContent=tr('No suitable voice is available for this language. You can read all instructions on screen.');return;}
    const words=element.innerText?.trim()||element.textContent?.trim();if(!words)return;
    const request=++serial,utterance=new window.SpeechSynthesisUtterance(words);utterance.lang=language==='ar'?'ar-AE':'en-GB';utterance.voice=voice;utterance.rate=.85;
    reader={button,status,element};button?.setAttribute('aria-pressed','true');status.textContent=tr('Reading. Select Listen / Stop to stop.');
    const finish=message=>{if(request!==serial)return;reader=null;button?.setAttribute('aria-pressed','false');status.textContent=tr(message);};
    utterance.onend=()=>finish('Reading finished.');utterance.onerror=()=>finish('Read-aloud is unavailable on this device. All text remains on screen.');
    try{engine.speak(utterance);}catch{finish('Read-aloud is unavailable on this device. All text remains on screen.');}
  }
  window.InneruSpeech={stop,read,changed(target){if(reader&&(!reader.element.isConnected||reader.element.contains(target)))stop();}};
  document.addEventListener('inneru-preferences-change',()=>{stop();schedule();});
  document.addEventListener('inneru-instruction-change',stop);
  refresh();
})();
