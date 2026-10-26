/* On-demand reading/voice policy. Learning text only; never values or hidden answers. */
(() => {
 'use strict';
 if(window.InneruSpeechCore)return;
 const tr=s=>window.InneruLocale?.t(s)||s,ar=()=>document.documentElement.lang==='ar';
 const excluded='script,style,noscript,input,textarea,select,nav,footer,[hidden],[aria-hidden="true"],[data-iu-private],.name,.iu-account-menu,.speech-local,.support-read-controls,.structure-audio,.guide-actions,.guide-heading,.support-status,.td-answer-text,.td-response-text,.td-answer-history,.td-student-link,.td-league-person,.td-podium strong,.td-activity-feed b,.owner-list,.term-pop-actions,pre,code,.sr-only,.visually-hidden,.skip,.gate-skip';
 function visible(el){return !!el?.isConnected&&!el.closest(excluded)&&!el.closest('details:not([open]) > :not(summary)')&&(el.checkVisibility?.({checkVisibilityCSS:true})??el.getClientRects().length>0);}
 function words(element){
  const texts=[];
  function walk(node){
   if(node.nodeType===3){texts.push(node.textContent);return;}
   if(node.nodeType===11){node.childNodes.forEach(walk);return;}
   if(node.nodeType!==1||node.matches(excluded)||node.closest('details:not([open]) > :not(summary)')||getComputedStyle(node).display==='none'||getComputedStyle(node).visibility==='hidden')return;
   if(ar()&&node.matches('.term-pop-word,[data-iu-scientific-term]')||!ar()&&node.matches('.term-pop-ar'))return;
   if(node.matches('button')&&!node.matches('[data-skel-answer],[data-choice],[data-answer],[data-option],.choice'))return;
   if(node.matches('img,canvas,svg')){const label=node.getAttribute('alt')||node.getAttribute('aria-label');if(label)texts.push(label);return;}
   node.childNodes.forEach(walk);if(node.matches('p,li,h1,h2,h3,h4,dt,dd,article,section'))texts.push('\n');
  }
  if(visible(element))walk(element);
  return texts.join(' ').replace(/[\u2066-\u2069\u200e\u200f]/g,'').replace(/https?:\/\/\S+|\S+@\S+\.\S+/g,'').replace(/\s+/g,' ').trim();
 }
 function prepare(text){
  let result=text;
  if(ar())for(const [from,to]of Object.entries(window.InneruSpeechArabic||{}).sort((a,b)=>b[0].length-a[0].length)){const escaped=from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),letters=/[A-Za-z]/.test(from)?'A-Za-z0-9':'\\p{L}\\p{N}';result=result.replace(new RegExp('(?<!['+letters+'])'+escaped+'(?!['+letters+'])','gu'),to);}
  return result;
 }
 function voices(signal,language,done){
  const engine=window.speechSynthesis,available=()=>{try{return engine.getVoices?.()||[];}catch{return [];}};
  const suitable=()=>available().some(v=>String(v.lang||'').toLowerCase().replace(/_/g,'-').split('-')[0]===language);
  if(suitable()){done(available());return;}
  let timer,poll;const finish=()=>{clearTimeout(timer);clearInterval(poll);engine.removeEventListener?.('voiceschanged',change);signal.removeEventListener('abort',cancel);};
  const cancel=()=>finish(),change=()=>{if(suitable()&&!signal.aborted){finish();done(available());}};
  engine.addEventListener?.('voiceschanged',change);signal.addEventListener('abort',cancel,{once:true});poll=setInterval(change,100);timer=setTimeout(()=>{finish();if(!signal.aborted)done(available());},1600);
 }
 function speak(options){
  const {element,name,signal,finish}=options;
  const raw=name?tr(name):words(element),text=prepare(raw);
  if(!text){finish('There is no visible text to read here.');return;}
  if(ar()&&!/[\u0600-\u06ff]/.test(text)){finish('Arabic reading text is not ready. Wait for the translation, then try again.');return;}
  options.source=raw;const language=ar()?'ar':'en';
  voices(signal,language,list=>{
   if(signal.aborted)return;
   const normalized=v=>String(v.lang||'').toLowerCase().replace(/_/g,'-'),score=v=>language==='ar'?(normalized(v)==='ar-ae'?300:normalized(v)==='ar-sa'?200:0)+Number(!!v.localService)*50:Number(!!v.localService)*100+(normalized(v)==='en-gb'?30:0);
   const voice=list.filter(v=>normalized(v).split('-')[0]===language).sort((a,b)=>score(b)-score(a))[0];
   // Some browsers expose no Arabic entry until their native engine resolves
   // utterance.lang. Ask for Arabic explicitly; never assign an English voice.
   const failure=error=>language==='ar'&&['language-unavailable','voice-unavailable','synthesis-unavailable'].includes(error)?'Arabic audio is unavailable on this device. Enable an Arabic text-to-speech voice in your device settings, then try again.':'Read-aloud is unavailable on this device. All text remains on screen.';
   const chunks=[];let remaining=text;while(remaining.length>350){let end=remaining.lastIndexOf(' ',350);if(end<1)end=350;chunks.push(remaining.slice(0,end));remaining=remaining.slice(end).trim();}if(remaining)chunks.push(remaining);
   let index=0;const next=()=>{
    if(signal.aborted)return;if(index===chunks.length){finish(name?'Pronunciation finished.':'Reading finished.');return;}
    try{
     const utterance=new SpeechSynthesisUtterance(chunks[index++]);utterance.lang=voice?String(voice.lang).replace(/_/g,'-'):language==='ar'?'ar-SA':'en-GB';if(voice)utterance.voice=voice;utterance.rate=.85;
     utterance.onend=next;utterance.onerror=event=>{if(!signal.aborted)finish(failure(event.error));};
     utterance.onstart=()=>{if(index===1&&!signal.aborted)options.onStart();};window.speechSynthesis.speak(utterance);
    }catch{finish(failure());}
   };next();
  });
 }
 function local(root){
  if(root.querySelector(':scope > .speech-local'))return;
  const box=document.createElement('div');box.className='speech-local';box.dataset.noTerms='';box.innerHTML='<button type="button" aria-pressed="false">Listen / Stop</button><span role="status"></span>';root.dataset.supportReader='1';root.append(box);box.querySelector('button').onclick=()=>InneruSpeech.read(root,box.querySelector('button'),box.querySelector('[role=status]'));
 }
 function refresh(){
  if(!ar()){document.querySelectorAll('.speech-local').forEach(n=>n.remove());return;}
  document.querySelectorAll('#term-pop:not([hidden]),dialog[open]').forEach(root=>{if(root.querySelector('input[type=password],input[type=email]'))return;local(root);});
 }
 let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}
 function changed(request,target){
  if(!request.element.contains(target)||target.closest?.('.speech-local,.support-read-controls,.structure-audio'))return false;
  // Mounting/localizing audio controls must not cancel a pending or active read.
  // Compare only the marked instruction or definition, never unrelated DOM.
  return request.source!==undefined&&request.source!==(request.name?tr(request.name):words(request.element));
 }
 window.InneruSpeechCore={speak,refresh,prepare,words,changed};
 const link=document.createElement('link');link.rel='stylesheet';link.href='speech-core.css?v=compact-audio-1';document.head.append(link);
 new MutationObserver(changes=>{for(const c of changes)InneruSpeech.changed(c.target);schedule();}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','open']});document.addEventListener('inneru-language-ready',schedule);document.addEventListener('inneru-preferences-change',()=>{InneruSpeech.stop();document.querySelectorAll('.support-read-controls .support-status,[data-iu-guide-speech-status]').forEach(n=>n.textContent='');schedule();});refresh();
})();
